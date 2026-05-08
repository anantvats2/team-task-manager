const express = require('express')
const { listUsers } = require('../controllers/userController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

const router = express.Router()

router.use(authMiddleware)
router.get('/', roleMiddleware('admin'), listUsers)

module.exports = router
