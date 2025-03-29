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
}

module.exports = TaskModel; 