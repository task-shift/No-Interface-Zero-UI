const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const OrganizationModel = require('./organizationModel');

class UserModel {
  static async createUser({ username, email, fullname, organization_name, password, type }) {
    try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Generate a unique user_id
      const user_id = uuidv4();

      let organization = null;

      // Only create organization if organization_name is provided
      if (organization_name) {
        // Create organization first
        const { success: orgSuccess, organization: orgData, error: orgError } = 
          await OrganizationModel.createOrganization({
            organization_name,
            user_id
          });

        if (!orgSuccess) {
          throw new Error(orgError);
        }
        
        organization = orgData;
      }

      // Create user with optional organization_id
      const userData = {
        username,
        email,
        fullname,
        user_id,
        password: hashedPassword,
        role: type === 'adminx' ? 'admin' : 'user',
        status: 'active',
        online: true
        // date_created and time_created will be handled by default values
      };

      // Only add organization_id if an organization was created, store as a JSON array
      if (organization) {
        userData.organization_id = [organization.organization_id];
      }

      // Now create the user
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select('id, fullname, username, email, avatar, user_id, role, organization_id, status')
        .single();

      if (error) throw error;

      // Return user data with optional organization info
      const response = {
        success: true,
        user: { ...data }
      };

      // Include organization info if available
      if (organization) {
        response.user.organization = {
          organization_id: organization.organization_id,
          organization_name: organization.organization_name
        };
      }

      return response;
    } catch (error) {
      // If anything fails, return the error
      return { success: false, error: error.message };
    }
  }

  // Add a user to an organization
  static async addUserToOrganization(userId, organizationId) {
    try {
      // Get the user first
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('user_id', userId)
        .single();

      if (userError) throw new Error('User not found');

      // Initialize organization_id array if null
      let organizationIds = user.organization_id || [];
      
      // Add the new organization ID if it doesn't already exist
      if (!organizationIds.includes(organizationId)) {
        organizationIds.push(organizationId);
      }

      // Update the user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ organization_id: organizationIds })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Remove a user from an organization
  static async removeUserFromOrganization(userId, organizationId) {
    try {
      // Get the user first
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('user_id', userId)
        .single();

      if (userError) throw new Error('User not found');
      
      // Return early if user doesn't have any organizations
      if (!user.organization_id) {
        return { success: true, message: 'User is not in any organization' };
      }

      // Remove the organization ID
      const organizationIds = user.organization_id.filter(id => id !== organizationId);

      // Update the user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ organization_id: organizationIds.length ? organizationIds : null })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all organizations a user belongs to
  static async getUserOrganizations(userId) {
    try {
      // Get the user's organization IDs
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('user_id', userId)
        .single();

      if (userError) throw new Error('User not found');
      
      // If user is not in any organization, return empty array
      if (!user.organization_id || user.organization_id.length === 0) {
        return { success: true, organizations: [] };
      }

      // Get all organizations the user belongs to
      const { data: organizations, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .in('organization_id', user.organization_id);

      if (orgError) throw orgError;

      return { success: true, organizations };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async authenticateUser(login, password) {
    try {
      // Get user with password using either username or email
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.eq.${login},email.eq.${login}`)
        .single();

      if (error || !user) {
        throw new Error('User not found');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // Update online status
      await supabase
        .from('users')
        .update({ online: true })
        .eq('id', user.id);

      // Don't send password back
      delete user.password;
      
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async logoutUser(userId) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ online: false })
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, fullname, username, email, avatar, user_id, role, organization_id, status, online')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return { success: true, user: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = UserModel; 