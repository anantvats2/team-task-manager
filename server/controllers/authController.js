const bcrypt = require('bcryptjs')
const User = require('../models/User')
const ApiError = require('../utils/ApiError')
const generateToken = require('../utils/generateToken')

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  projects: user.projects,
})

const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      throw new ApiError(400, 'Name, email and password are required')
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      throw new ApiError(409, 'Email already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'member',
    })

    const token = generateToken(user)
    return res.status(201).json({ token, user: sanitizeUser(user) })
  } catch (error) {
    return next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email?.trim() || !password?.trim()) {
      throw new ApiError(400, 'Email and password are required')
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user) {
      throw new ApiError(401, 'Invalid credentials')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials')
    }

    const token = generateToken(user)
    return res.status(200).json({ token, user: sanitizeUser(user) })
  } catch (error) {
    return next(error)
  }
}

module.exports = { signup, login }
