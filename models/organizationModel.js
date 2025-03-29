const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

class OrganizationModel {
  /**
   * Check if an organization with the given name already exists
   * @param {string} organization_name - The name to check
   * @returns {object} - Object containing success status and exists flag
   */
  static async checkOrganizationExists(organization_name) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('organization_id')
        .ilike('organization_name', organization_name)
        .limit(1);

      if (error) throw error;
      
      return { 
        success: true, 
        exists: data && data.length > 0 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new organization for a user
   * @param {Object} params - Parameters
   * @param {string} params.organization_name - Name of the organization
   * @param {string} params.user_id - ID of the user creating the organization
   * @returns {Object} - Object containing success status and organization data
   */
  static async createOrganization({ organization_name, user_id }) {
    try {
      // Check if organization name already exists
      const { success: checkSuccess, exists, error: checkError } = 
        await this.checkOrganizationExists(organization_name);
      
      if (!checkSuccess) {
        throw new Error(checkError || 'Failed to check if organization exists');
      }
      
      if (exists) {
        throw new Error('An organization with this name already exists');
      }
      
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

  /**
   * Get an organization by its ID
   * @param {string} organization_id - ID of the organization
   * @returns {Object} - Object containing success status and organization data
   */
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

  /**
   * Get all organizations created by a user
   * @param {string} user_id - ID of the user
   * @returns {Object} - Object containing success status and array of organizations
   */
  static async getOrganizationsByUser(user_id) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user_id)
        .order('date_created', { ascending: false });

      if (error) throw error;
      return { success: true, organizations: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = OrganizationModel; 