const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

class OrganizationModel {
  static async createOrganization({ organization_name, user_id }) {
    try {
      const organization_id = uuidv4();
      
      const { data, error } = await supabase
        .from('organizations')
        .insert([
          {
            organization_name,
            organization_id,
            user_id,
            status: 'active'
            // date_created and time_created will be handled by default values
          }
        ])
        .select('*')
        .single();

      if (error) throw error;
      return { success: true, organization: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getOrganizationById(organization_id) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('organization_id', organization_id)
        .single();

      if (error) throw error;
      return { success: true, organization: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = OrganizationModel; 