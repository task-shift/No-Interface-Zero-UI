const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { requireVerifiedUser } = require('../middleware/auth');
const { requireAdminOrAdminX } = require('../middleware/adminAuth');

// All task routes require authentication and email verification
router.use(requireVerifiedUser);

// Create task - permission check happens in the controller based on organization_members table
router.post('/', taskController.createTask);

// Get all tasks for user's organization
router.get('/', taskController.getOrganizationTasks);

// Get tasks assigned to the current user
router.get('/assigned', taskController.getUserAssignedTasks);

// Get specific task by ID
router.get('/:task_id', taskController.getTaskById);

// Update task - both admins and task assignees can update, with different permissions
router.put('/:task_id', taskController.updateTask);

// Delete task - both admins and task assignees can delete tasks they're involved with
router.delete('/:task_id', taskController.deleteTask);

module.exports = router; 