const { Resend } = require('resend');
// Import email templates
const { getVerificationEmailTemplate, getTestEmailTemplate } = require('../templates/emails');
// Import verification model
const VerificationModel = require('../models/verificationModel');

// Initialize Resend with API key (should be in env variables in production)
const resend = new Resend(process.env.RESEND_API_KEY);

// Send a test email
exports.sendTestEmail = async (req, res) => {
  try {
    const { to, subject, html, content } = req.body;

    // Validate input
    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email (to) is required'
      });
    }

    // Use the test email template if no HTML is provided
    // Otherwise use the provided HTML
    const emailSubject = subject || 'Test Email';
    const emailHtml = html || getTestEmailTemplate(subject, content);
    
    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'TaskShift <support@taskshift.xyz>',
      to: Array.isArray(to) ? to : [to], // Accept single email or array
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error('Email sending error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to send email',
        error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      data
    });
  } catch (error) {
    console.error('Email controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending email',
      error: error.message
    });
  }
};

// Send a verification email
exports.sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Create verification record and get verification code
    const { success, verificationCode, error: verificationError } = 
      await VerificationModel.createVerification(email);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create verification code',
        error: verificationError
      });
    }

    // Use the verification email template
    const emailHtml = getVerificationEmailTemplate(verificationCode);
    
    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'TaskShift <verify@taskshift.xyz>',
      to: email,
      subject: 'Verify your email address',
      html: emailHtml,
    });

    if (error) {
      console.error('Email sending error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to send verification email',
        error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
      data
    });
  } catch (error) {
    console.error('Email controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending verification email',
      error: error.message
    });
  }
}; 