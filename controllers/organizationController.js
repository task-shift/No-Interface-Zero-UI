const OrganizationModel = require('../models/organizationModel');
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
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    // Update the user's organization_id
    const { error: updateError } = await supabase
      .from('users')
      .update({ organization_id: organization.organization_id })
      .eq('user_id', req.user.user_id);

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Organization created but failed to update user profile. Please try again.'
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

// Get organization details
exports.getOrganization = async (req, res) => {
  try {
    // Get the user's organization_id
    const organization_id = req.user.organization_id;

    if (!organization_id) {
      return res.status(404).json({
        success: false,
        message: 'You are not associated with any organization'
      });
    }

    const { success, organization, error } = await OrganizationModel.getOrganizationById(organization_id);

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