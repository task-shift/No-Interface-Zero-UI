const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');

// All task routes require authentication
router.use(requireAuth);

// Create task - admin only
router.post('/', requireAdmin, taskController.createTask);

// Get all tasks for user's organization
router.get('/', taskController.getOrganizationTasks);

// Get specific task by ID
router.get('/:task_id', taskController.getTaskById);

module.exports = router; 