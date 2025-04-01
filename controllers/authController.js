const UserModel = require('../models/userModel');
const { generateToken } = require('../middleware/auth');

exports.register = async (req, res) => {
  try {
    const { username, email, fullname, organization_name, password, type } = req.body;

    // Validate input
    if (!username || !email || !fullname || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: username, email, fullname, and password'
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

    // Create user with optional organization
    const { success, user, error } = await UserModel.createUser({
      username,
      email,
      fullname,
      organization_name, // This is now optional
      password,
      type
    });

    if (!success) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    // Generate JWT token
    const token = generateToken(user.user_id);

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;  // login can be either username or email

    // Validate input
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide login (username or email) and password'
      });
    }

    // Authenticate user
    const { success, user, error } = await UserModel.authenticateUser(login, password);

    if (!success) {
      return res.status(401).json({
        success: false,
        message: error
      });
    }

    // Check if user has verified their email
    if (user.status !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        verificationRequired: true,
        email: user.email
      });
    }

    // Generate JWT token
    const token = generateToken(user.user_id);

    res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const { success, error } = await UserModel.logoutUser(req.user.user_id);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    // Get the user details
    const { success, user, error } = await UserModel.getUserById(req.user.user_id);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }
    
    // If user has no current_organization_id set but belongs to organizations, set the first one
    if (!user.current_organization_id && user.organization_id && user.organization_id.length > 0) {
      const { success: updateSuccess, error: updateError } = 
        await UserModel.setCurrentOrganization(user.user_id, user.organization_id[0]);
      
      if (updateSuccess) {
        // Refresh the user data to include the current_organization_id
        const { success: refreshSuccess, user: refreshedUser } = 
          await UserModel.getUserById(req.user.user_id);
          
        if (refreshSuccess) {
          user.current_organization_id = refreshedUser.current_organization_id;
        }
      }
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 