const Project = require('../models/Project')
const Task = require('../models/Task')
const User = require('../models/User')
const ApiError = require('../utils/ApiError')
const isValidObjectId = require('../utils/isValidObjectId')

const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body
    if (!name?.trim()) {
      throw new ApiError(400, 'Project name is required')
    }

    const project = await Project.create({
      name,
      description: description || '',
      members: [req.user.id],
      createdBy: req.user.id,
    })

    await User.findByIdAndUpdate(req.user.id, { $addToSet: { projects: project._id } })
    return res.status(201).json({ project })
  } catch (error) {
    return next(error)
  }
}

const addMember = async (req, res, next) => {
  try {
    const { id } = req.params
    const { email, action = 'add' } = req.body
    if (!email?.trim()) {
      throw new ApiError(400, 'email is required')
    }
    if (!['add', 'remove'].includes(action)) {
      throw new ApiError(400, 'Invalid action')
    }
    if (!isValidObjectId(id)) {
      throw new ApiError(400, 'Invalid project id')
    }

    const project = await Project.findById(id)
    if (!project) {
      throw new ApiError(404, 'Project not found')
    }

    const member = await User.findOne({ email: email.trim().toLowerCase() }).select('_id email')
    if (!member) {
      throw new ApiError(404, 'User with this email not found')
    }
    const memberId = member._id.toString()
    const alreadyMember = project.members.some((projectMemberId) => projectMemberId.toString() === memberId)

    if (action === 'remove') {
      await Project.findByIdAndUpdate(id, { $pull: { members: memberId } })
      await User.findByIdAndUpdate(memberId, { $pull: { projects: id } })
      return res.status(200).json({ message: 'Member removed' })
    }

    if (alreadyMember) {
      throw new ApiError(400, 'User is already a project member')
    }

    await Project.findByIdAndUpdate(id, { $addToSet: { members: memberId } })
    await User.findByIdAndUpdate(memberId, { $addToSet: { projects: id } })
    return res.status(200).json({ message: 'Member added' })
  } catch (error) {
    return next(error)
  }
}

const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ members: req.user.id })
      .populate('members', 'name email role')
      .sort({ createdAt: -1 })
      .lean()

    const projectIds = projects.map((project) => project._id)
    const taskCountRows = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$project', count: { $sum: 1 } } },
    ])
    const taskCountMap = taskCountRows.reduce((acc, row) => {
      acc[row._id.toString()] = row.count
      return acc
    }, {})

    const normalized = projects.map((project) => ({
      id: project._id,
      name: project.name,
      description: project.description,
      members: project.members,
      membersCount: project.members.length,
      taskCount: taskCountMap[project._id.toString()] || 0,
      createdBy: project.createdBy,
      createdAt: project.createdAt,
    }))

    return res.status(200).json({ projects: normalized })
  } catch (error) {
    return next(error)
  }
}

module.exports = { createProject, addMember, getProjects }
