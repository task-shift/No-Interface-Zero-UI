const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

class TaskModel {
  static async createTask({ 
    title, 
    description, 
    user_id, 
    organization_id, 
    assigned, 
    status, 
    due_date 
  }) {
    try {
      // Generate a unique task_id
      const task_id = uuidv4();

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title,
            description,
            task_id,
            user_id,             // Creator's user_id
            organization_id,
            assigned,            // JSON object with assignee details
            status: status || 'pending',
            due_date,
            date_created: new Date(),
            time_created: new Date().toLocaleTimeString()
          }
        ])
        .select('*')
        .single();

      if (error) throw error;
      return { success: true, task: data };
    } catch (error) {
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