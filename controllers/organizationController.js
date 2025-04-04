const OrganizationModel = require('../models/organizationModel');
const UserModel = require('../models/userModel');
const supabase = require('../config/supabase');

// Create a new organization
exports.createOrganization = async (req, res) => {
  try {
    const { organization_name } = req.body;

    // Validate input
    if (!organization_name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an organization name'
      });
    }

    // Create organization
    const { success, organization, error } = await OrganizationModel.createOrganization({
      organization_name,
      user_id: req.user.user_id
    });

    if (!success) {
      // Check if the error is about duplicate organization name
      if (error.includes('organization with this name already exists')) {
        return res.status(409).json({
          success: false,
          message: 'An organization with this name already exists',
          error: 'DUPLICATE_ORGANIZATION_NAME'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    // Add the organization to the user's organization list
    const { success: userUpdateSuccess, error: userUpdateError } = 
      await UserModel.addUserToOrganization(req.user.user_id, organization.organization_id);
    
    if (!userUpdateSuccess) {
      return res.status(500).json({
        success: false,
        message: 'Organization created but failed to update user profile',
        error: userUpdateError
      });
    }

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      organization
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating organization'
    });
  }
};

// Get organization details by ID
exports.getOrganization = async (req, res) => {
  try {
    const { organization_id } = req.params;
    
    // If no organization ID is provided in the route, use the user's primary organization
    const targetOrgId = organization_id || req.user.organization_id?.[0];

    if (!targetOrgId) {
      return res.status(404).json({
        success: false,
        message: 'No organization ID provided and user is not associated with any organization'
      });
    }

    // Verify the user has access to this organization
    if (req.user.role !== 'admin' && 
       (!req.user.organization_id || !req.user.organization_id.includes(targetOrgId))) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this organization'
      });
    }

    const { success, organization, error } = await OrganizationModel.getOrganizationById(targetOrgId);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    res.json({
      success: true,
      organization
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching organization details'
    });
  }
};

// Get all organizations for the current user
exports.getUserOrganizations = async (req, res) => {
  try {
    const { success, organizations, error } = await UserModel.getUserOrganizations(req.user.user_id);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    res.json({
      success: true,
      organizations
    });
  } catch (error) {
    console.error('Get user organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user organizations'
    });
  }
};

// List all organizations (admin only)
exports.listOrganizations = async (req, res) => {
  try {
    // Only admins can list all organizations
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required for this action'
      });
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('organization_name', { ascending: true });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      organizations: data
    });
  } catch (error) {
    console.error('List organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error listing organizations'
    });
  }
};

// Join an organization
exports.joinOrganization = async (req, res) => {
  try {
    const { organization_id } = req.body;

    if (!organization_id) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    // Check if organization exists
    const { success: orgExists, organization, error: orgError } = 
      await OrganizationModel.getOrganizationById(organization_id);
    
    if (!orgExists) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Add user to the organization
    const { success, error } = await UserModel.addUserToOrganization(
      req.user.user_id, 
      organization_id
    );

    if (!success) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully joined organization',
      organization
    });
  } catch (error) {
    console.error('Join organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error joining organization'
    });
  }
};

// Leave an organization
exports.leaveOrganization = async (req, res) => {
  try {
    const { organization_id } = req.params;

    if (!organization_id) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    // Remove user from the organization
    const { success, error } = await UserModel.removeUserFromOrganization(
      req.user.user_id, 
      organization_id
    );

    if (!success) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully left organization'
    });
  } catch (error) {
    console.error('Leave organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error leaving organization'
    });
  }
};

// Set current organization
exports.setCurrentOrganization = async (req, res) => {
  try {
    const { organization_id } = req.body;

    if (!organization_id) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    // Set the current organization
    const { success, error, organizationId } = await UserModel.setCurrentOrganization(
      req.user.user_id,
      organization_id
    );

    if (!success) {
      // Check if the error is about permissions
      if (error.includes('not a member')) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this organization',
          error: 'NOT_MEMBER'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    // Get the updated user information
    const { success: userSuccess, user, error: userError } = await UserModel.getUserById(req.user.user_id);

    if (!userSuccess) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve updated user information',
        error: userError
      });
    }

    res.status(200).json({
      success: true,
      message: 'Current organization set successfully',
      user
    });
  } catch (error) {
    console.error('Set current organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error setting current organization'
    });
  }
}; 