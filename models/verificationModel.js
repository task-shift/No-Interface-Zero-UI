const supabase = require('../config/supabase');
const crypto = require('crypto');

class VerificationModel {
  /**
   * Generate a random verification code
   * @param {number} length - Length of the verification code 
   * @returns {string} - The generated verification code
   */
  static generateVerificationCode(length = 6) {
    // Generate a random numeric code
    return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
  }

  /**
   * Create a new verification entry
   * @param {string} email - User's email address
   * @returns {object} - Object containing success status and verification code
   */
  static async createVerification(email) {
    try {
      // Check if there's an existing verification for this email
      const { data: existingVerification } = await supabase
        .from('verification')
        .select('*')
        .eq('email', email)
        .single();

      // If verification already exists and is verified, don't create a new one
      if (existingVerification && existingVerification.status === 'verified') {
        return { 
          success: false, 
          error: 'Email is already verified',
          alreadyVerified: true
        };
      }
      
      // Generate verification code
      const verificationCode = this.generateVerificationCode();
      
      // Generate a unique token for this verification (still used internally)
      const token = crypto.randomBytes(32).toString('hex');

      // If verification already exists (but not verified), update it
      if (existingVerification) {
        const { data, error } = await supabase
          .from('verification')
          .update({
            token,
            verification_code: verificationCode,
            status: 'pending',
            date_created: new Date(),
            time_created: new Date().toLocaleTimeString()
          })
          .eq('email', email)
          .select()
          .single();

        if (error) throw error;
        
        return { 
          success: true, 
          verificationCode,
          isNewVerification: false
        };
      }

      // Create new verification entry
      const { data, error } = await supabase
        .from('verification')
        .insert([{
          email,
          token,
          verification_code: verificationCode,
          status: 'pending',
          // date_created and time_created will be handled by default values
        }])
        .select()
        .single();

      if (error) throw error;

      return { 
        success: true, 
        verificationCode,
        isNewVerification: true
      };
    } catch (error) {
      console.error('Verification creation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate a verification code
   * @param {string} email - User's email address
   * @param {string} verificationCode - The verification code to validate
   * @returns {object} - Object containing success status
   */
  static async validateVerification(email, verificationCode) {
    try {
      // Get verification record
      const { data: verification, error } = await supabase
        .from('verification')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !verification) {
        throw new Error('Verification record not found');
      }

      // Check if the verification code matches
      if (verification.verification_code !== verificationCode) {
        throw new Error('Invalid verification code');
      }

      // Check if verification is expired (24 hours)
      const createdDate = new Date(verification.date_created);
      const now = new Date();
      const hoursDiff = Math.abs(now - createdDate) / 36e5; // 36e5 is the number of milliseconds in an hour

      if (hoursDiff > 24) {
        // Update verification status to expired
        await supabase
          .from('verification')
          .update({ status: 'expired' })
          .eq('id', verification.id);
          
        throw new Error('Verification code has expired');
      }

      // Update verification status to verified
      await supabase
        .from('verification')
        .update({ status: 'verified' })
        .eq('id', verification.id);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get verification status
   * @param {string} email - User's email address
   * @returns {object} - Object containing success status and verification status
   */
  static async getVerificationStatus(email) {
    try {
      // Get verification record
      const { data: verification, error } = await supabase
        .from('verification')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;

      return { 
        success: true, 
        status: verification?.status || 'not_found',
        verification 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = VerificationModel; 