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

// Get tasks assigned to the current user
router.get('/assigned', taskController.getUserAssignedTasks);

// Get specific task by ID
router.get('/:task_id', taskController.getTaskById);

// Update task - both admins and task assignees can update, with different permissions
router.put('/:task_id', taskController.updateTask);

module.exports = router; 