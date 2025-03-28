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

      // Only add organization_id if an organization was created
      if (organization) {
        userData.organization_id = organization.organization_id;
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