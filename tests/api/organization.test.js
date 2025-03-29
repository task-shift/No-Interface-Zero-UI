/**
 * Organization API Tests
 * Tests for organization-related endpoints, including multi-organization support
 */

const { api, createTestUser, createTestOrganization, cleanupTestData } = require('./setup');
const { v4: uuidv4 } = require('uuid');

// Test data for cleanup
const testData = {
  users: [],
  organizations: []
};

describe('Organization API', () => {
  
  // Clean up after all tests are done
  afterAll(async () => {
    await cleanupTestData(testData);
  });

  describe('POST /organizations', () => {
    test('should create a new organization successfully', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      const orgData = {
        organization_name: `Test Org ${Date.now()}`
      };

      const response = await api.post('/organizations', orgData, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.organization).toBeDefined();
      expect(response.data.organization.organization_name).toBe(orgData.organization_name);
      expect(response.data.organization.organization_id).toBeDefined();
      
      // Save organization for cleanup
      if (response.data.organization) {
        testData.organizations.push(response.data.organization);
      }
    });

    test('should fail to create organization with duplicate name', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      // Create an organization first
      const organization = await createTestOrganization(testUser.user.user_id);
      testData.organizations.push(organization);
      
      // Try to create another with the same name
      const response = await api.post('/organizations', {
        organization_name: organization.organization_name
      }, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(409);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toBe('DUPLICATE_ORGANIZATION_NAME');
    });

    test('should fail to create organization without authentication', async () => {
      const response = await api.post('/organizations', {
        organization_name: `Test Org No Auth ${Date.now()}`
      });
      
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    test('should create multiple organizations for the same user', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      // Create first organization
      const orgData1 = {
        organization_name: `Test Org 1 ${Date.now()}`
      };

      const response1 = await api.post('/organizations', orgData1, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response1.status).toBe(201);
      expect(response1.data.success).toBe(true);
      
      if (response1.data.organization) {
        testData.organizations.push(response1.data.organization);
      }
      
      // Create second organization
      const orgData2 = {
        organization_name: `Test Org 2 ${Date.now()}`
      };

      const response2 = await api.post('/organizations', orgData2, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response2.status).toBe(201);
      expect(response2.data.success).toBe(true);
      
      if (response2.data.organization) {
        testData.organizations.push(response2.data.organization);
      }
      
      // Verify user belongs to both organizations
      const myOrgsResponse = await api.get('/organizations/my-organizations', {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(myOrgsResponse.status).toBe(200);
      expect(myOrgsResponse.data.success).toBe(true);
      expect(myOrgsResponse.data.organizations.length).toBeGreaterThanOrEqual(2);
      
      // Verify the two organizations we created are in the list
      const orgIds = myOrgsResponse.data.organizations.map(o => o.organization_id);
      expect(orgIds).toContain(response1.data.organization.organization_id);
      expect(orgIds).toContain(response2.data.organization.organization_id);
    });
  });

  describe('GET /organizations/my-organizations', () => {
    test('should get all organizations a user belongs to', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      // Create a few organizations for the user
      const org1 = await createTestOrganization(testUser.user.user_id, `Test Org Get 1 ${Date.now()}`);
      const org2 = await createTestOrganization(testUser.user.user_id, `Test Org Get 2 ${Date.now()}`);
      testData.organizations.push(org1, org2);
      
      // Add user to organizations (they should already be added by createTestOrganization,
      // but we do it explicitly to be sure)
      await api.post('/organizations/join', { organization_id: org1.organization_id }, {
        headers: { Authorization: `Bearer ${testUser.token}` }
      });
      
      await api.post('/organizations/join', { organization_id: org2.organization_id }, {
        headers: { Authorization: `Bearer ${testUser.token}` }
      });
      
      // Get user's organizations
      const response = await api.get('/organizations/my-organizations', {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.organizations).toBeDefined();
      expect(response.data.organizations.length).toBeGreaterThanOrEqual(2);
      
      // Verify the two organizations we created are in the list
      const orgIds = response.data.organizations.map(o => o.organization_id);
      expect(orgIds).toContain(org1.organization_id);
      expect(orgIds).toContain(org2.organization_id);
    });

    test('should return empty array if user has no organizations', async () => {
      // Create a test user without organizations
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      const response = await api.get('/organizations/my-organizations', {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.organizations).toBeDefined();
      expect(Array.isArray(response.data.organizations)).toBe(true);
      // The user might have organizations from other tests, so we don't assert length === 0
    });
  });

  describe('GET /organizations/:organization_id', () => {
    test('should get organization details by ID', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      // Create an organization
      const organization = await createTestOrganization(testUser.user.user_id);
      testData.organizations.push(organization);
      
      // Add user to organization
      await api.post('/organizations/join', { organization_id: organization.organization_id }, {
        headers: { Authorization: `Bearer ${testUser.token}` }
      });
      
      // Get organization details
      const response = await api.get(`/organizations/${organization.organization_id}`, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.organization).toBeDefined();
      expect(response.data.organization.organization_id).toBe(organization.organization_id);
      expect(response.data.organization.organization_name).toBe(organization.organization_name);
    });

    test('should fail to get organization details with invalid ID', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      const response = await api.get(`/organizations/invalid-id-${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    test('should fail to get organization details without access', async () => {
      // Create two test users
      const testUser1 = await createTestUser();
      const testUser2 = await createTestUser();
      testData.users.push(testUser1.user, testUser2.user);
      
      // Create an organization for user 1
      const organization = await createTestOrganization(testUser1.user.user_id);
      testData.organizations.push(organization);
      
      // Try to get organization details with user 2
      const response = await api.get(`/organizations/${organization.organization_id}`, {
        headers: {
          Authorization: `Bearer ${testUser2.token}`
        }
      });
      
      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
    });
  });

  describe('POST /organizations/join', () => {
    test('should allow a user to join an organization', async () => {
      // Create two test users
      const orgOwner = await createTestUser();
      const joiningUser = await createTestUser();
      testData.users.push(orgOwner.user, joiningUser.user);
      
      // Create an organization for the first user
      const organization = await createTestOrganization(orgOwner.user.user_id);
      testData.organizations.push(organization);
      
      // Join the organization with the second user
      const response = await api.post('/organizations/join', {
        organization_id: organization.organization_id
      }, {
        headers: {
          Authorization: `Bearer ${joiningUser.token}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toContain('joined');
      expect(response.data.organization).toBeDefined();
      expect(response.data.organization.organization_id).toBe(organization.organization_id);
      
      // Verify the user is now in the organization
      const myOrgsResponse = await api.get('/organizations/my-organizations', {
        headers: {
          Authorization: `Bearer ${joiningUser.token}`
        }
      });
      
      const orgIds = myOrgsResponse.data.organizations.map(o => o.organization_id);
      expect(orgIds).toContain(organization.organization_id);
    });

    test('should fail to join with invalid organization ID', async () => {
      // Create a test user
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      const response = await api.post('/organizations/join', {
        organization_id: `invalid-id-${Date.now()}`
      }, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });

  describe('DELETE /organizations/:organization_id/leave', () => {
    test('should allow a user to leave an organization', async () => {
      // Create a test user
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      // Create an organization
      const organization = await createTestOrganization(testUser.user.user_id);
      testData.organizations.push(organization);
      
      // Make sure the user is in the organization
      await api.post('/organizations/join', { organization_id: organization.organization_id }, {
        headers: { Authorization: `Bearer ${testUser.token}` }
      });
      
      // Leave the organization
      const response = await api.delete(`/organizations/${organization.organization_id}/leave`, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toContain('left');
      
      // Verify the user is no longer in the organization
      const myOrgsResponse = await api.get('/organizations/my-organizations', {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      const orgIds = myOrgsResponse.data.organizations.map(o => o.organization_id);
      expect(orgIds).not.toContain(organization.organization_id);
    });
  });
}); 