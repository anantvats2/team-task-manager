const Project = require('../models/Project')
const Task = require('../models/Task')
const User = require('../models/User')
const ApiError = require('../utils/ApiError')
const isValidObjectId = require('../utils/isValidObjectId')
const mongoose = require('mongoose')

const isOverdue = (task) => {
  // Overdue means dueDate is before today's date (ignore time), and status isn't completed.
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  return task.status !== 'completed' && new Date(task.dueDate) < todayStart
}
const startOfDay = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const endOfDay = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)

const toTaskResponse = (task) => ({
  id: task._id,
  title: task.title,
  description: task.description,
  status: isOverdue(task) ? 'overdue' : task.status,
  rawStatus: task.status,
  priority: task.priority || 'medium',
  assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo.map((u) => u?._id || u) : [],
  assignees: Array.isArray(task.assignedTo) ? task.assignedTo.map((u) => ({ id: u?._id || u, name: u?.name || '', email: u?.email || '' })) : [],
  project: task.project?._id || task.project,
  projectName: task.project?.name || '',
  dueDate: task.dueDate,
  createdBy: task.createdBy,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
})

const createTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, project, dueDate, priority = 'medium' } = req.body
    if (!title?.trim() || !assignedTo || !project || !dueDate) {
      throw new ApiError(400, 'title, assignedTo, project and dueDate are required')
    }
    if (!isValidObjectId(project)) {
      throw new ApiError(400, 'Invalid project id')
    }
    const assigneeIds = Array.isArray(assignedTo) ? assignedTo : [assignedTo]
    const uniqueAssigneeIds = [...new Set(assigneeIds.map((id) => String(id)))]
    if (uniqueAssigneeIds.length === 0) {
      throw new ApiError(400, 'At least one assignee is required')
    }
    if (!uniqueAssigneeIds.every((id) => isValidObjectId(id))) {
      throw new ApiError(400, 'Invalid assigned user id')
    }
    if (Number.isNaN(new Date(dueDate).getTime())) {
      throw new ApiError(400, 'Invalid dueDate')
    }
    if (!['low', 'medium', 'high'].includes(priority)) {
      throw new ApiError(400, 'Invalid priority')
    }

    const assignees = await User.find({ _id: { $in: uniqueAssigneeIds } }).select('_id role').lean()
    if (assignees.length !== uniqueAssigneeIds.length) {
      throw new ApiError(404, 'Assigned user not found')
    }
    if (assignees.some((u) => u.role !== 'member')) {
      throw new ApiError(400, 'Tasks can only be assigned to members')
    }

    const selectedProject = await Project.findById(project)
    if (!selectedProject) {
      throw new ApiError(404, 'Project not found')
    }

    const memberIdSet = new Set(selectedProject.members.map((id) => id.toString()))
    const allAreMembers = uniqueAssigneeIds.every((id) => memberIdSet.has(id))
    if (!allAreMembers) {
      throw new ApiError(400, 'All assignees must be project members')
    }

    const task = await Task.create({
      title,
      description: description || '',
      priority,
      assignedTo: uniqueAssigneeIds,
      project,
      dueDate,
      createdBy: req.user.id,
    })

    const populated = await Task.findById(task._id).populate('assignedTo', 'name email').populate('project', 'name')
    return res.status(201).json({ task: toTaskResponse(populated) })
  } catch (error) {
    return next(error)
  }
}

const getTasks = async (req, res, next) => {
  try {
    const query = {}
    if (req.user.role === 'member') {
      query.assignedTo = new mongoose.Types.ObjectId(req.user.id)
    } else {
      if (req.query.project) {
        if (!isValidObjectId(req.query.project)) throw new ApiError(400, 'Invalid project id')
        query.project = req.query.project
      }
      if (req.query.user) {
        if (!isValidObjectId(req.query.user)) throw new ApiError(400, 'Invalid user id')
        query.assignedTo = req.query.user
      }
    }
    if (req.query.project && req.user.role === 'member') {
      if (!isValidObjectId(req.query.project)) throw new ApiError(400, 'Invalid project id')
      query.project = req.query.project
    }
    if (req.query.priority) {
      if (!['low', 'medium', 'high'].includes(req.query.priority)) throw new ApiError(400, 'Invalid priority')
      query.priority = req.query.priority
    }
    if (req.query.status) {
      if (!['pending', 'completed', 'overdue'].includes(req.query.status)) throw new ApiError(400, 'Invalid status')
      if (req.query.status === 'overdue') {
        query.status = { $ne: 'completed' }
        query.dueDate = { ...(query.dueDate || {}), $lt: new Date() }
      } else {
        query.status = req.query.status
      }
    }
    if (req.query.overdue === 'true') {
      query.status = { $ne: 'completed' }
      query.dueDate = { ...(query.dueDate || {}), $lt: new Date() }
    }
    if (req.query.search?.trim()) {
      query.title = { $regex: req.query.search.trim(), $options: 'i' }
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .sort({ dueDate: 1, createdAt: -1 })

    return res.status(200).json({ tasks: tasks.map(toTaskResponse) })
  } catch (error) {
    return next(error)
  }
}

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params
    const { title, description, status, assignedTo, dueDate, priority } = req.body
    if (!isValidObjectId(id)) {
      throw new ApiError(400, 'Invalid task id')
    }

    const task = await Task.findById(id)
    if (!task) {
      throw new ApiError(404, 'Task not found')
    }

    if (req.user.role === 'member' && !task.assignedTo.map((v) => v.toString()).includes(req.user.id)) {
      throw new ApiError(403, 'Forbidden')
    }

    if (req.user.role === 'member') {
      if (title !== undefined || description !== undefined || assignedTo !== undefined || dueDate !== undefined || priority !== undefined) {
        throw new ApiError(403, 'Forbidden')
      }
      if (status && !['pending', 'completed'].includes(status)) {
        throw new ApiError(400, 'Invalid status')
      }
      task.status = status || task.status
    } else {
      if (title !== undefined) task.title = title
      if (description !== undefined) task.description = description
      if (status !== undefined) {
        if (!['pending', 'completed'].includes(status)) {
          throw new ApiError(400, 'Invalid status')
        }
        task.status = status
      }
      if (priority !== undefined) {
        if (!['low', 'medium', 'high'].includes(priority)) {
          throw new ApiError(400, 'Invalid priority')
        }
        task.priority = priority
      }
      if (dueDate !== undefined) {
        if (Number.isNaN(new Date(dueDate).getTime())) {
          throw new ApiError(400, 'Invalid dueDate')
        }
        task.dueDate = dueDate
      }
      if (assignedTo !== undefined) {
        const assigneeIds = Array.isArray(assignedTo) ? assignedTo : [assignedTo]
        const uniqueAssigneeIds = [...new Set(assigneeIds.map((v) => String(v)))]
        if (uniqueAssigneeIds.length === 0) {
          throw new ApiError(400, 'At least one assignee is required')
        }
        if (!uniqueAssigneeIds.every((v) => isValidObjectId(v))) {
          throw new ApiError(400, 'Invalid assigned user id')
        }
        const assignees = await User.find({ _id: { $in: uniqueAssigneeIds } }).select('_id role').lean()
        if (assignees.length !== uniqueAssigneeIds.length) {
          throw new ApiError(404, 'Assigned user not found')
        }
        if (assignees.some((u) => u.role !== 'member')) {
          throw new ApiError(400, 'Tasks can only be assigned to members')
        }
        const selectedProject = await Project.findById(task.project).select('members').lean()
        const memberIdSet = new Set((selectedProject?.members || []).map((v) => v.toString()))
        const allAreMembers = uniqueAssigneeIds.every((v) => memberIdSet.has(v))
        if (!allAreMembers) {
          throw new ApiError(400, 'All assignees must be project members')
        }
        task.assignedTo = uniqueAssigneeIds
      }
    }

    await task.save()
    const populated = await Task.findById(task._id).populate('assignedTo', 'name email').populate('project', 'name')
    return res.status(200).json({ task: toTaskResponse(populated) })
  } catch (error) {
    return next(error)
  }
}

const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id
    const tasksQuery = req.user.role === 'member' ? { assignedTo: new mongoose.Types.ObjectId(userId) } : {}
    const tasks = await Task.find(tasksQuery).select('status dueDate _id').lean()

    const now = new Date()
    const today = now.toDateString()
    const startToday = new Date(today)

    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.status === 'completed').length
    const pendingTasks = tasks.filter((task) => task.status === 'pending').length
    const overdueTasks = tasks.filter((task) => new Date(task.dueDate) < startToday && task.status !== 'completed').length
    const dueTodayTasks = tasks.filter((task) => new Date(task.dueDate).toDateString() === today).length

    const recentlyUpdated = await Task.find(tasksQuery)
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .sort({ updatedAt: -1 })
      .limit(5)

    return res.status(200).json({
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      overdue: overdueTasks,
      dueToday: dueTodayTasks,
      ...(req.user.role === 'member' ? { myTasks: totalTasks } : {}),
      recentlyUpdated: recentlyUpdated.map(toTaskResponse),
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = { createTask, getTasks, updateTask, getDashboardStats }
