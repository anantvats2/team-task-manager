const express = require('express')
const { createTask, getDashboardStats, getTasks, updateTask } = require('../controllers/taskController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

const router = express.Router()

router.use(authMiddleware)
router.post('/', roleMiddleware('admin'), createTask)
router.get('/', getTasks)
router.put('/:id', updateTask)
router.get('/dashboard', getDashboardStats)

module.exports = router
