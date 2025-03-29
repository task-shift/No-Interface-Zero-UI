/**
 * Email API Tests
 * Tests for email sending and verification functionality
 */

const { api, createTestUser, cleanupTestData } = require('./setup');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../../config/supabase');

// Test data for cleanup
const testData = {
  users: [],
  organizations: []
};

// Mock for environment variables
const ORIGINAL_ENV = process.env;

describe('Email API', () => {
  // Setup before tests
  beforeAll(() => {
    // Mock environment variables for testing
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'test',
      // Mock the Resend API Key if needed
      // RESEND_API_KEY: 'test_key'
    };
  });

  // Restore environment after tests
  afterAll(async () => {
    process.env = ORIGINAL_ENV;
    await cleanupTestData(testData);
  });

  describe('POST /email/send-verification', () => {
    test('should send verification email to user', async () => {
      // Create a test user
      const testUser = await createTestUser(false); // Create unverified user
      testData.users.push(testUser.user);
      
      // Set user status to pending (unverified)
      await supabase
        .from('users')
        .update({ status: 'pending' })
        .eq('user_id', testUser.user.user_id);
      
      const response = await api.post('/email/send-verification', {
        email: testUser.user.email
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toContain('verification email sent');
      
      // Verify a verification record was created
      const { data: verification } = await supabase
        .from('verification')
        .select('*')
        .eq('email', testUser.user.email)
        .order('created_at', { ascending: false })
        .limit(1);
      
      expect(verification).toBeDefined();
      expect(verification.length).toBe(1);
      expect(verification[0].type).toBe('email_verification');
      expect(verification[0].code).toBeDefined();
    });

    test('should fail to send verification email to non-existent user', async () => {
      const response = await api.post('/email/send-verification', {
        email: `nonexistent_${Date.now()}@example.com`
      });
      
      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    test('should not send verification email to already verified user', async () => {
      // Create a verified test user
      const testUser = await createTestUser(true); // Create verified user
      testData.users.push(testUser.user);
      
      // Ensure user is verified
      await supabase
        .from('users')
        .update({ status: 'verified' })
        .eq('user_id', testUser.user.user_id);
      
      const response = await api.post('/email/send-verification', {
        email: testUser.user.email
      });
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('already verified');
    });
  });

  describe('POST /email/test', () => {
    test('should send a test email when authenticated as admin', async () => {
      // Create an admin test user
      const email = `admin_${uuidv4().substring(0, 8)}@example.com`;
      const password = 'Test123!@#';
      
      // Register the user directly in the database
      const { data: authUser, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        throw new Error(`Failed to create test user: ${error.message}`);
      }
      
      // Get the user from the database and make them an admin
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (!dbUser) {
        throw new Error('Failed to retrieve test user from database');
      }
      
      // Update user role to admin and verify them
      await supabase
        .from('users')
        .update({ 
          role: 'admin',
          status: 'verified'
        })
        .eq('user_id', dbUser.user_id);
      
      // Login to get token
      const loginResponse = await api.post('/users/login', {
        email,
        password
      });
      
      const adminToken = loginResponse.data.token;
      
      // Now send test email
      const response = await api.post('/email/test', {
        to: email
      }, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toContain('Test email sent');
      
      // Add user to testData for cleanup
      testData.users.push(dbUser);
    });

    test('should fail to send test email without admin privileges', async () => {
      // Create a regular user
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      const response = await api.post('/email/test', {
        to: testUser.user.email
      }, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('Admin access required');
    });

    test('should fail to send test email without authentication', async () => {
      const response = await api.post('/email/test', {
        to: 'test@example.com'
      });
      
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });

  describe('POST /email/resend-verification', () => {
    test('should resend verification email successfully', async () => {
      // Create an unverified user
      const email = `resend_test_${uuidv4().substring(0, 8)}@example.com`;
      const password = 'Test123!@#';
      
      // Register the user directly in the database
      const { data: authUser, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        throw new Error(`Failed to create test user: ${error.message}`);
      }
      
      // Get the user from the database
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (!dbUser) {
        throw new Error('Failed to retrieve test user from database');
      }
      
      // Ensure user is unverified
      await supabase
        .from('users')
        .update({ status: 'pending' })
        .eq('user_id', dbUser.user_id);
      
      // Now try to resend verification
      const response = await api.post('/email/resend-verification', {
        email
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toContain('verification email sent');
      
      // Add user to testData for cleanup
      testData.users.push(dbUser);
    });

    test('should fail to resend verification for non-existent email', async () => {
      const response = await api.post('/email/resend-verification', {
        email: `nonexistent_${Date.now()}@example.com`
      });
      
      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });

  describe('POST /email/check-verification', () => {
    test('should check verification status correctly for verified user', async () => {
      // Create a verified test user
      const testUser = await createTestUser(true);
      testData.users.push(testUser.user);
      
      // Ensure user is verified
      await supabase
        .from('users')
        .update({ status: 'verified' })
        .eq('user_id', testUser.user.user_id);
      
      const response = await api.post('/email/check-verification', {
        email: testUser.user.email
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.verified).toBe(true);
    });

    test('should check verification status correctly for unverified user', async () => {
      // Create an unverified test user
      const testUser = await createTestUser(false);
      testData.users.push(testUser.user);
      
      // Ensure user is unverified
      await supabase
        .from('users')
        .update({ status: 'pending' })
        .eq('user_id', testUser.user.user_id);
      
      const response = await api.post('/email/check-verification', {
        email: testUser.user.email
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.verified).toBe(false);
    });

    test('should fail for non-existent email', async () => {
      const response = await api.post('/email/check-verification', {
        email: `nonexistent_${Date.now()}@example.com`
      });
      
      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });
}); 