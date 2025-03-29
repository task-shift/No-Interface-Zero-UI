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
      const { data: existingVerifications, error: queryError } = await supabase
        .from('verification')
        .select('*')
        .eq('email', email)
        .order('date_created', { ascending: false })
        .limit(1); // Get the most recent verification

      if (queryError) throw queryError;

      // Check if user is already verified based on the most recent verification
      if (existingVerifications && 
          existingVerifications.length > 0 && 
          existingVerifications[0].status === 'verified') {
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
      if (existingVerifications && existingVerifications.length > 0) {
        const existingVerification = existingVerifications[0];
        const { data, error } = await supabase
          .from('verification')
          .update({
            token,
            verification_code: verificationCode,
            status: 'pending',
            date_created: new Date(),
            time_created: new Date().toLocaleTimeString()
          })
          .eq('id', existingVerification.id)
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
      // Get verification records - might have multiple for the same email
      const { data: verifications, error } = await supabase
        .from('verification')
        .select('*')
        .eq('email', email)
        .order('date_created', { ascending: false })
        .limit(1); // Get the most recent verification record

      if (error || !verifications || verifications.length === 0) {
        throw new Error('Verification record not found');
      }

      // Use the most recent verification
      const verification = verifications[0];

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
      // Get verification records - might have multiple for the same email
      const { data: verifications, error } = await supabase
        .from('verification')
        .select('*')
        .eq('email', email)
        .order('date_created', { ascending: false })
        .limit(1); // Get the most recent verification record

      if (error) throw error;

      // If no verification record found
      if (!verifications || verifications.length === 0) {
        return { 
          success: true, 
          status: 'not_found',
          verification: null
        };
      }

      // Use the most recent verification
      const verification = verifications[0];

      return { 
        success: true, 
        status: verification.status,
        verification 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = VerificationModel; 