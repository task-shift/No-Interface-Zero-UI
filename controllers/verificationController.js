const VerificationModel = require('../models/verificationModel');
const supabase = require('../config/supabase');

// Verify an email using the verification code
exports.verifyEmail = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    // Validate input
    if (!email || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    // Check if user is already verified - Handle potential multiple users with same email
    const { data: users, error: userCheckError } = await supabase
      .from('users')
      .select('user_id, status')
      .eq('email', email);

    if (userCheckError) {
      console.error('User check error:', userCheckError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check user status',
        error: userCheckError.message
      });
    }

    // If no users found
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address'
      });
    }

    // Check if any user with this email is already verified
    const alreadyVerifiedUser = users.find(user => user.status === 'verified');
    if (alreadyVerifiedUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified and cannot be verified again',
        alreadyVerified: true
      });
    }

    // Verify the code
    const { success, error } = await VerificationModel.validateVerification(
      email, 
      verificationCode
    );

    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
        error
      });
    }

    // Update status for all users with this email to verified
    const updatePromises = users.map(user => {
      return supabase
        .from('users')
        .update({ status: 'verified' })
        .eq('user_id', user.user_id);
    });

    const updateResults = await Promise.all(updatePromises);
    
    // Check if any update failed
    const updateErrors = updateResults
      .filter(result => result.error)
      .map(result => result.error.message);
      
    if (updateErrors.length > 0) {
      console.error('User verification update errors:', updateErrors);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user verification status for some users',
        errors: updateErrors
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification',
      error: error.message
    });
  }
};

// Check verification status
exports.checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.query;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Get verification status
    const { success, status, verification, error } = await VerificationModel.getVerificationStatus(email);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch verification status',
        error
      });
    }

    res.status(200).json({
      success: true,
      status,
      verified: status === 'verified'
    });
  } catch (error) {
    console.error('Verification status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking verification status',
      error: error.message
    });
  }
}; 