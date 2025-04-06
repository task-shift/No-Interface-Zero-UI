const OrganizationModel = require('../models/organizationModel');
const UserModel = require('../models/userModel');
const supabase = require('../config/supabase');
const emailController = require('../controllers/emailController');
const { generateToken } = require('../middleware/auth');

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

    // Add the creator as an organization member with their role
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('email, fullname, role, username')
        .eq('user_id', req.user.user_id)
        .single();

      if (userData) {
        // Add the user to organization_members with their current role and admin permission
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert([{
            organization_id: organization.organization_id,
            email: userData.email,
            fullname: userData.fullname || req.user.username,
            username: userData.username || req.user.username,
            user_id: req.user.user_id,
            role: userData.role || req.user.role || 'user', // Use the user's role
            permission: 'admin', // Always give admin permission in the organization they create
            status: 'active'
          }]);

        if (memberError) {
          console.error('Failed to add user as organization member:', memberError);
          // Continue anyway as organization was created and user was linked
        }
      }
    } catch (memberError) {
      console.error('Error adding creator as organization member:', memberError);
      // Continue anyway as the organization was created and the user was linked
    }

    // Set this as the user's current organization
    try {
      await UserModel.setCurrentOrganization(req.user.user_id, organization.organization_id);
    } catch (currentOrgError) {
      console.error('Error setting current organization:', currentOrgError);
      // Continue anyway as the organization was created
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
    if (!req.user.organization_id || !req.user.organization_id.includes(targetOrgId)) {
      // Check if user is an admin in any organization (admins can access all organizations)
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('permission')
        .eq('user_id', req.user.user_id)
        .eq('status', 'active')
        .eq('permission', 'admin')
        .limit(1);
      
      if (memberError || !memberData || memberData.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this organization'
        });
      }
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
    // Check if user has admin permission in any organization
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('permission')
      .eq('user_id', req.user.user_id)
      .eq('status', 'active')
      .eq('permission', 'admin')
      .limit(1);
    
    if (memberError || !memberData || memberData.length === 0) {
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

// Invite a team member to an organization
exports.inviteTeamMember = async (req, res) => {
  try {
    // Use the user's current organization ID instead of getting it from parameters
    const organization_id = req.user.current_organization_id;
    const { email, fullname, role, permission } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    if (!fullname) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if user has a current organization set
    if (!organization_id) {
      return res.status(400).json({
        success: false,
        message: 'No current organization set. Please set a current organization before inviting team members.'
      });
    }

    // Check if user has access to this organization
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('role, permission')
      .eq('organization_id', organization_id)
      .eq('user_id', req.user.user_id)
      .eq('status', 'active')
      .single();
    
    if (memberError || !memberData) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this organization'
      });
    }
    
    // Get the current user's details for the invitation
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('fullname')
      .eq('user_id', req.user.user_id)
      .single();
      
    if (userError) {
      console.error('Error fetching inviter details:', userError);
    }
    
    const inviterName = userData?.fullname || req.user.username || 'A team member';

    // Send the invitation
    const { success, invitation, organization_name, error } = await OrganizationModel.inviteTeamMember({
      organization_id,
      email,
      fullname,
      role: role || 'user',
      permission: permission || 'standard',
      inviter_id: req.user.user_id
    });

    if (!success) {
      // Check if the error is about already being a member
      if (error.includes('already a member')) {
        return res.status(409).json({
          success: false,
          message: 'This user is already a member of the organization',
          error: 'ALREADY_MEMBER'
        });
      }
      
      // Check if the error is about already being invited
      if (error.includes('already been invited')) {
        return res.status(409).json({
          success: false,
          message: 'This user has already been invited to the organization',
          error: 'ALREADY_INVITED'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    // Send invitation email
    const emailResult = await emailController.sendOrganizationInviteEmail({
      email,
      fullname,
      organization_name,
      inviter_name: inviterName
    });

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      // Continue anyway as the invitation was created successfully
    }

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      invitation
    });
  } catch (error) {
    console.error('Invite team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending invitation'
    });
  }
};

// Activate a user's invitation to an organization
exports.activateInvitation = async (req, res) => {
  try {
    const { email, organization_id } = req.body;
    const user_id = req.user.user_id;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    if (!organization_id) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    // We no longer check if the email matches the authenticated user's email
    // This allows users to activate invitations for any organization they have access to

    // Activate the invitation
    const { success, activation, organization, error } = await OrganizationModel.activateInvitation({
      email,
      organization_id,
      user_id,
      username: req.user.username
    });

    if (!success) {
      return res.status(404).json({
        success: false,
        message: error || 'Failed to activate invitation'
      });
    }

    // Add the organization to the user's organization list
    const { success: userUpdateSuccess, error: userUpdateError } = 
      await UserModel.addUserToOrganization(user_id, organization_id);
    
    if (!userUpdateSuccess) {
      console.error('Failed to update user\'s organization list:', userUpdateError);
      // Continue anyway as the activation was successful
    }

    // Set this as the user's current organization
    const { success: currentOrgSuccess, error: currentOrgError } = 
      await UserModel.setCurrentOrganization(user_id, organization_id);
    
    if (!currentOrgSuccess) {
      console.error('Failed to set as current organization:', currentOrgError);
      // Continue anyway as the activation was successful
    }

    // Get the updated user information
    const { success: userSuccess, user, error: userError } = await UserModel.getUserById(user_id);

    res.status(200).json({
      success: true,
      message: 'Invitation activated successfully',
      activation,
      organization,
      user: userSuccess ? user : null
    });
  } catch (error) {
    console.error('Activate invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error activating invitation'
    });
  }
};

// Activate invitation with user registration
exports.activateInvitationWithRegistration = async (req, res) => {
  try {
    const { email, organization_id, username, fullname, password } = req.body;

    // Validate required fields
    if (!email || !organization_id || !username || !fullname || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: email, organization_id, username, fullname, and password'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // First check if the invitation exists
    const { data: invitation, error: invitationError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('email', email)
      .eq('organization_id', organization_id)
      .eq('status', 'invited')
      .single();

    if (invitationError) {
      if (invitationError.code === 'PGRST116') { // Not found
        return res.status(404).json({
          success: false,
          message: 'No pending invitation found for this email and organization'
        });
      }
      throw invitationError;
    }

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'No pending invitation found for this email and organization'
      });
    }

    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('user_id, email, username')
      .or(`email.eq.${email},username.eq.${username}`)
      .limit(1);

    if (userCheckError) {
      throw userCheckError;
    }

    if (existingUser && existingUser.length > 0) {
      // Check if it's a username conflict
      if (existingUser[0].username === username) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists',
          error: 'USERNAME_EXISTS'
        });
      }
      
      // Check if it's an email conflict
      if (existingUser[0].email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
          error: 'EMAIL_EXISTS'
        });
      }
    }

    // Register the new user
    const { success: registrationSuccess, user, error: registrationError } = await UserModel.createUser({
      username,
      email,
      fullname,
      password,
      status: 'verified' // Auto-verify the user since they came through an invitation
    });

    if (!registrationSuccess) {
      return res.status(400).json({
        success: false,
        message: registrationError || 'Failed to register user'
      });
    }

    // Update the invitation status to 'active' and link to the new user
    const { data: updatedInvitation, error: updateError } = await supabase
      .from('organization_members')
      .update({ 
        status: 'active',
        user_id: user.user_id,
        username: username
      })
      .eq('email', email)
      .eq('organization_id', organization_id)
      .eq('status', 'invited')
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      // Continue anyway as the user was created successfully
    }

    // Add the organization to the user's organization list
    const { success: userUpdateSuccess, error: userUpdateError } = 
      await UserModel.addUserToOrganization(user.user_id, organization_id);
    
    if (!userUpdateSuccess) {
      console.error('Failed to update user\'s organization list:', userUpdateError);
      // Continue anyway as the user was created successfully
    }

    // Set this as the user's current organization
    const { success: currentOrgSuccess, error: currentOrgError } = 
      await UserModel.setCurrentOrganization(user.user_id, organization_id);
    
    if (!currentOrgSuccess) {
      console.error('Failed to set as current organization:', currentOrgError);
      // Continue anyway as the user was created successfully
    }

    // Get the organization details
    const { organization } = await OrganizationModel.getOrganizationById(organization_id);

    // Generate JWT token for the new user
    const token = generateToken(user.user_id);

    res.status(201).json({
      success: true,
      message: 'Registration successful and invitation activated',
      token,
      user,
      organization,
      activation: updatedInvitation || invitation
    });
  } catch (error) {
    console.error('Activate invitation with registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing invitation and registration',
      error: error.message
    });
  }
};

// Get all members of the user's current organization
exports.getOrganizationMembers = async (req, res) => {
  try {
    // Get the user's current organization ID
    const organizationId = req.user.current_organization_id;

    // Check if user has a current organization set
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'No current organization set. Please set a current organization first.'
      });
    }

    // Check if user is a member of this organization
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('role, permission')
      .eq('organization_id', organizationId)
      .eq('user_id', req.user.user_id)
      .eq('status', 'active')
      .single();

    if (memberError || !memberData) {
      console.error('Error checking member status:', memberError || 'Not a member');
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this organization'
      });
    }

    // Get all members of this organization
    const { data: members, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('fullname', { ascending: true });

    if (error) {
      console.error('Error fetching organization members:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch organization members',
        error: error.message
      });
    }

    // Fetch organization details
    const { success: orgSuccess, organization, error: orgError } = 
      await OrganizationModel.getOrganizationById(organizationId);

    if (!orgSuccess) {
      console.error('Error fetching organization details:', orgError);
    }

    res.status(200).json({
      success: true,
      members,
      organization: orgSuccess ? organization : { organization_id: organizationId }
    });
  } catch (error) {
    console.error('Get organization members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching organization members',
      error: error.message
    });
  }
}; 