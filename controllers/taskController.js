const TaskModel = require('../models/taskModel');
const supabase = require('../config/supabase');

exports.createTask = async (req, res) => {
  try {
    console.log('Received task creation request:', req.body);
    
    const { 
      title, 
      description, 
      assignees, 
      status, 
      due_date 
    } = req.body;

    // Check if user has organizations
    if (!req.user.organization_id || !req.user.organization_id.length) {
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

    // Get organization ID from current_organization_id, with fallback to the first organization_id
    let orgId = req.user.current_organization_id;
    
    // If current_organization_id is not set, fall back to the first one in the array
    if (!orgId && req.user.organization_id && req.user.organization_id.length > 0) {
      orgId = req.user.organization_id[0];
      console.log(`No current_organization_id set, falling back to first organization: ${orgId}`);
    }

    // Log the organization_id for debugging
    console.log(`Using organization_id: ${orgId} (type: ${typeof orgId})`);

    // Clean up organization_id if it contains commas (legacy support)
    if (typeof orgId === 'string' && orgId.includes(',')) {
      orgId = orgId.split(',')[0];
      console.log(`Found comma in organization_id, using first value: ${orgId}`);
    }

    // Create task with authenticated user's ID and organization
    const { success, task, error } = await TaskModel.createTask({
      title,
      description,
      user_id: req.user.user_id, // Creator (logged in admin)
      organization_id: orgId, // Use the current organization ID
      assignees, // Now an array of assignees
      status,
      due_date
    });

    if (!success) {
      console.error('Error creating task:', error);
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
      message: 'Server error creating task',
      detailedError: error.message
    });
  }
};

exports.getOrganizationTasks = async (req, res) => {
  try {
    // Get organization ID from current_organization_id, with fallback to the first organization_id
    let orgId = req.user.current_organization_id;
    
    // If current_organization_id is not set, fall back to the first one in the array
    if (!orgId && req.user.organization_id && req.user.organization_id.length > 0) {
      orgId = req.user.organization_id[0];
      console.log(`No current_organization_id set for task listing, falling back to first organization: ${orgId}`);
    }

    // Clean up organization_id if it contains commas (legacy support)
    if (typeof orgId === 'string' && orgId.includes(',')) {
      orgId = orgId.split(',')[0];
    }

    // Return error if no organization is available
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'No organization context found. Please set a current organization or join an organization.'
      });
    }

    console.log(`Fetching tasks for organization: ${orgId}`);

    const { success, tasks, error } = await TaskModel.getTasksByOrganization(orgId);

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

    // Get organization ID from current_organization_id, with fallback to the first organization_id
    let userOrgId = req.user.current_organization_id;
    
    // If current_organization_id is not set, fall back to the first one in the array
    if (!userOrgId && req.user.organization_id && req.user.organization_id.length > 0) {
      userOrgId = req.user.organization_id[0];
    }

    // Clean up organization_id if it contains commas (legacy support)
    if (typeof userOrgId === 'string' && userOrgId.includes(',')) {
      userOrgId = userOrgId.split(',')[0];
    }
    
    // Get the task's organization_id and clean it if needed
    let taskOrgId = task.organization_id;
    if (typeof taskOrgId === 'string' && taskOrgId.includes(',')) {
      taskOrgId = taskOrgId.split(',')[0];
    }
    
    // For admin users, allow access to any task
    const isAdmin = req.user.role === 'admin' || req.user.role === 'adminx';
    
    // Check if task belongs to user's current organization
    if (!isAdmin && taskOrgId !== userOrgId) {
      console.log(`Access denied: Task org (${taskOrgId}) doesn't match user's current org (${userOrgId})`);
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
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching task'
    });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const { task_id } = req.params;
    const { title, description, assignees, status, due_date } = req.body;
    
    // First get the task to check permissions
    const { success: getSuccess, task: existingTask, error: getError } = 
      await TaskModel.getTaskById(task_id);
    
    if (!getSuccess) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Get organization ID from current_organization_id, with fallback to the first organization_id
    let userOrgId = req.user.current_organization_id;
    
    // If current_organization_id is not set, fall back to the first one in the array
    if (!userOrgId && req.user.organization_id && req.user.organization_id.length > 0) {
      userOrgId = req.user.organization_id[0];
    }

    // Clean up organization_id if it contains commas (legacy support)
    if (typeof userOrgId === 'string' && userOrgId.includes(',')) {
      userOrgId = userOrgId.split(',')[0];
    }
    
    // Get the task's organization_id and clean it if needed
    let taskOrgId = existingTask.organization_id;
    if (typeof taskOrgId === 'string' && taskOrgId.includes(',')) {
      taskOrgId = taskOrgId.split(',')[0];
    }
    
    // For admin users, allow updating any task
    const isAdmin = req.user.role === 'admin' || req.user.role === 'adminx';
    
    // Check if task belongs to user's current organization
    if (!isAdmin && taskOrgId !== userOrgId) {
      console.log(`Update denied: Task org (${taskOrgId}) doesn't match user's current org (${userOrgId})`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }
    
    // Check if user has admin privileges for the organization
    if (req.user.role !== 'admin' && req.user.role !== 'adminx') {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required to update tasks'
      });
    }
    
    // Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    if (due_date) updateData.due_date = due_date;
    
    // Handle assignees update with proper validation
    if (assignees) {
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
      
      updateData.assignees = assignees;
    }
    
    // Update the task
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('task_id', task_id)
      .select()
      .single();
      
    if (error) {
      console.error('Task update error:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.json({
      success: true,
      task: data,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating task',
      detailedError: error.message
    });
  }
}; 