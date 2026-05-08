const User = require('../models/User')

const listUsers = async (req, res, next) => {
  try {
    const search = req.query.search?.trim()
    const query = search
      ? {
          $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }],
        }
      : {}

    const users = await User.find(query).select('_id name email role').sort({ name: 1 }).limit(50).lean()
    return res.status(200).json({ users })
  } catch (error) {
    return next(error)
  }
}

module.exports = { listUsers }
