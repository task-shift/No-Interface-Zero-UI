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

    // Check if user is already verified
    const { data: user, error: userCheckError } = await supabase
      .from('users')
      .select('status')
      .eq('email', email)
      .single();

    if (userCheckError) {
      console.error('User check error:', userCheckError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check user status',
        error: userCheckError.message
      });
    }

    // If user is already verified, return success but indicate already verified
    if (user && user.status === 'verified') {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified',
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

    // Update user status to verified
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ status: 'verified' })
      .eq('email', email);

    if (userUpdateError) {
      console.error('User verification update error:', userUpdateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user verification status',
        error: userUpdateError.message
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