const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { requireVerifiedUser } = require('../middleware/auth');
const { requireAdminOrAdminX } = require('../middleware/adminAuth');

// All task routes require authentication and email verification
router.use(requireVerifiedUser);

// Create task - admin or adminx only
router.post('/', requireAdminOrAdminX, taskController.createTask);

// Get all tasks for user's organization
router.get('/', taskController.getOrganizationTasks);

// Get specific task by ID
router.get('/:task_id', taskController.getTaskById);

module.exports = router; 