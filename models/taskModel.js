const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

class TaskModel {
  static async createTask({ 
    title, 
    description, 
    user_id, 
    organization_id, 
    assignees, 
    status, 
    due_date 
  }) {
    try {
      // Generate a unique task_id
      const task_id = uuidv4();

      // Validate and clean organization_id - handle comma-separated UUIDs
      let cleanOrgId = organization_id;
      if (typeof organization_id === 'string' && organization_id.includes(',')) {
        // If it's a comma-separated list, take only the first UUID
        cleanOrgId = organization_id.split(',')[0];
        console.log(`Fixed comma-separated UUIDs in organization_id. Using first UUID: ${cleanOrgId}`);
      } else if (typeof organization_id !== 'string') {
        throw new Error(`Invalid organization_id format: ${organization_id}. Must be a UUID string.`);
      }

      // Validate assignees format - ensure it's a proper object for JSONB
      const assigneesData = Array.isArray(assignees) ? assignees : [assignees];
      
      // Log the data being sent to Supabase (for debugging)
      console.log('Creating task with data:', {
        title,
        description,
        task_id,
        user_id,
        originalOrgId: organization_id,
        cleanOrgId,
        assigneesData
      });

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title,
            description,
            task_id,
            user_id,             // Creator's user_id
            organization_id: cleanOrgId, // Clean UUID string
            assignees: assigneesData, // Ensure proper JSON format
            status: status || 'pending',
            due_date,
            date_created: new Date(),
            time_created: new Date().toLocaleTimeString()
          }
        ])
        .select('*')
        .single();

      if (error) {
        console.error('Supabase error creating task:', error);
        throw error;
      }
      
      return { success: true, task: data };
    } catch (error) {
      console.error('Error in createTask:', error);
      return { success: false, error: error.message };
    }
  }

  static async getTasksByOrganization(organization_id) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', organization_id);

      if (error) throw error;
      return { success: true, tasks: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getTaskById(task_id) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('task_id', task_id)
        .single();

      if (error) throw error;
      return { success: true, task: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getTasksAssignedToUser(user_id, organization_id) {
    try {
      console.log(`Fetching tasks assigned to user_id: ${user_id} in organization: ${organization_id}`);
      
      // First, get all tasks for the organization
      const { data: allOrgTasks, error: orgTasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', organization_id);
        
      if (orgTasksError) {
        console.error('Error fetching organization tasks:', orgTasksError);
        throw orgTasksError;
      }
      
      console.log(`Total organization tasks: ${allOrgTasks?.length || 0}`);
      
      if (allOrgTasks && allOrgTasks.length > 0) {
        // Log the first task's full structure for debugging
        console.log('First task structure:', JSON.stringify(allOrgTasks[0], null, 2));
        
        // Log all tasks' assignees for debugging
        console.log('All tasks assignees:');
        allOrgTasks.forEach((task, i) => {
          console.log(`Task ${i+1} (${task.title}) assignees:`, JSON.stringify(task.assignees, null, 2));
        });
      }
      
      // Filter tasks using JavaScript (most reliable method)
      let userTasks = [];
      if (allOrgTasks && allOrgTasks.length > 0) {
        userTasks = allOrgTasks.filter(task => {
          console.log(`Checking task "${task.title}" (${task.task_id}) for assignee with user_id ${user_id}`);
          
          // Skip tasks with no assignees
          if (!task.assignees || !Array.isArray(task.assignees) || task.assignees.length === 0) {
            console.log(`- Task has no assignees or invalid assignees format`);
            return false;
          }
          
          // Check each assignee
          const isAssigned = task.assignees.some(assignee => {
            if (typeof assignee === 'object' && assignee !== null) {
              const match = assignee.user_id === user_id;
              console.log(`- Checking assignee object:`, JSON.stringify(assignee), 
                        `user_id match: ${match}`);
              return match;
            } else if (typeof assignee === 'string') {
              const match = assignee === user_id;
              console.log(`- Checking assignee string:`, assignee, 
                        `direct match: ${match}`);
              return match;
            }
            return false;
          });
          
          console.log(`- Result: User ${isAssigned ? 'IS' : 'is NOT'} assigned to this task`);
          return isAssigned;
        });
      }
      
      console.log(`Final result: ${userTasks.length} tasks assigned to user`);
      
      // Output task IDs and titles for matched tasks
      if (userTasks.length > 0) {
        console.log('Assigned tasks:');
        userTasks.forEach((task, i) => {
          console.log(`${i+1}. ${task.title} (${task.task_id})`);
        });
      }
      
      return { success: true, tasks: userTasks };
    } catch (error) {
      console.error('Error in getTasksAssignedToUser:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = TaskModel; 