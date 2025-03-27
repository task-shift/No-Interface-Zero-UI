const TaskModel = require('../models/taskModel');

exports.createTask = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      assigned, 
      status, 
      due_date 
    } = req.body;

    // Validate required fields
    if (!title || !description || !assigned) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and assigned user'
      });
    }

    // Validate assigned JSON structure
    if (!assigned.user_id || !assigned.username || !assigned.fullname) {
      return res.status(400).json({
        success: false,
        message: 'Assigned user must include user_id, username, and fullname'
      });
    }

    // Create task with authenticated user's ID and organization
    const { success, task, error } = await TaskModel.createTask({
      title,
      description,
      user_id: req.user.user_id, // Creator (logged in admin)
      organization_id: req.user.organization_id,
      assigned,
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