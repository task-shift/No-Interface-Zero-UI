const TaskModel = require('../models/taskModel');

exports.createTask = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      assignees, 
      status, 
      due_date 
    } = req.body;

    // Check if user has an organization
    if (!req.user.organization_id) {
      return res.status(400).json({
        success: false,
        message: 'You must be associated with an organization to create tasks. Please join or create an organization first.'
      });
    }

    // Check if user has admin privileges
    if (req.user.role !== 'admin' && req.user.role !== 'adminx') {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required to create and assign tasks'
      });
    }

    // Validate required fields
    if (!title || !description || !assignees) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and assignees'
      });
    }

    // Validate assignees is an array
    if (!Array.isArray(assignees) || assignees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Assignees must be a non-empty array'
      });
    }

    // Validate each assignee has the required fields
    for (const assignee of assignees) {
      if (!assignee.user_id || !assignee.username || !assignee.fullname) {
        return res.status(400).json({
          success: false,
          message: 'Each assignee must include user_id, username, and fullname'
        });
      }
    }

    // Create task with authenticated user's ID and organization
    const { success, task, error } = await TaskModel.createTask({
      title,
      description,
      user_id: req.user.user_id, // Creator (logged in admin)
      organization_id: req.user.organization_id,
      assignees, // Now an array of assignees
      status,
      due_date
    });

    if (!success) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    res.status(201).json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating task'
    });
  }
};

exports.getOrganizationTasks = async (req, res) => {
  try {
    const { success, tasks, error } = await TaskModel.getTasksByOrganization(
      req.user.organization_id
    );

    if (!success) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching tasks'
    });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const { task_id } = req.params;

    const { success, task, error } = await TaskModel.getTaskById(task_id);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    // Check if task belongs to user's organization
    if (task.organization_id !== req.user.organization_id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this task'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching task'
    });
  }
}; 