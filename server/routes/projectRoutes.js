const express = require('express')
const { addMember, createProject, getProjects } = require('../controllers/projectController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

const router = express.Router()

router.use(authMiddleware)
router.post('/', roleMiddleware('admin'), createProject)
router.get('/', getProjects)
router.put('/:id/add-member', roleMiddleware('admin'), addMember)

module.exports = router
