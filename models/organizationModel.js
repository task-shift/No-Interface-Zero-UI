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

  /**
   * Check if a user is already a member or has been invited to an organization
   * @param {string} organization_id - The organization ID
   * @param {string} email - Email address of the user
   * @returns {object} - Object containing membership status information
   */
  static async checkMembershipStatus(organization_id, email) {
    try {
      // First check if user with this email already exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id, organization_id')
        .eq('email', email)
        .single();
      
      if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found" which is ok
        throw userError;
      }
      
      // If user exists, check if they are already in the organization
      if (userData && userData.organization_id) {
        const organizationIds = Array.isArray(userData.organization_id) 
          ? userData.organization_id 
          : [userData.organization_id];
          
        if (organizationIds.includes(organization_id)) {
          return { 
            success: true, 
            isMember: true,
            isInvited: false,
            user_id: userData.user_id
          };
        }
      }
      
      // Check if user has been invited already
      const { data: inviteData, error: inviteError } = await supabase
        .from('organization_members')
        .select('id, status')
        .eq('organization_id', organization_id)
        .eq('email', email)
        .single();
        
      if (inviteError && inviteError.code !== 'PGRST116') { // Not found is ok
        throw inviteError;
      }
      
      return {
        success: true,
        isMember: false,
        isInvited: !!inviteData,
        inviteDetails: inviteData || null,
        user_id: userData?.user_id || null
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Invite a team member to join an organization
   * @param {Object} params - Parameters
   * @param {string} params.organization_id - ID of the organization
   * @param {string} params.email - Email of the person to invite
   * @param {string} params.fullname - Full name of the person to invite
   * @param {string} params.role - Role to assign (default: 'user')
   * @param {string} params.permission - Permission level (default: 'standard')
   * @param {string} params.inviter_id - User ID of the person sending the invitation
   * @returns {Object} - Object containing success status and invitation data
   */
  static async inviteTeamMember({ 
    organization_id, 
    email, 
    fullname, 
    role = 'user', 
    permission = 'teamate',
    inviter_id
  }) {
    try {
      // Check if organization exists
      const { success: orgSuccess, organization, error: orgError } = 
        await this.getOrganizationById(organization_id);
        
      if (!orgSuccess) {
        throw new Error(orgError || 'Organization not found');
      }
      
      // Check if user is already a member or invited
      const { 
        success: statusSuccess, 
        isMember, 
        isInvited, 
        error: statusError 
      } = await this.checkMembershipStatus(organization_id, email);
      
      if (!statusSuccess) {
        throw new Error(statusError || 'Failed to check membership status');
      }
      
      if (isMember) {
        throw new Error('This user is already a member of the organization');
      }
      
      if (isInvited) {
        throw new Error('This user has already been invited to the organization');
      }
      
      // Generate a unique invite code
      const invite_code = uuidv4();
      
      // Create the invitation record
      const { data, error } = await supabase
        .from('organization_members')
        .insert([
          {
            organization_id,
            email,
            fullname,
            role,
            permission,
            status: 'invited',
            invite_code,
            invited_by: inviter_id
          }
        ])
        .select('*')
        .single();
        
      if (error) throw error;
      
      return { 
        success: true, 
        invitation: data, 
        organization_name: organization.organization_name 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = OrganizationModel; 