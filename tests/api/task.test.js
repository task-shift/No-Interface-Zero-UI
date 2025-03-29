/**
 * Task API Tests
 * Tests for task-related endpoints
 */

const { api, createTestUser, createTestOrganization, cleanupTestData } = require('./setup');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../../config/supabase');

// Test data for cleanup
const testData = {
  users: [],
  organizations: [],
  tasks: []
};

/**
 * Create a test task in the database
 */
async function createTestTask(userId, organizationId, title = null) {
  const taskId = uuidv4();
  const taskTitle = title || `Test Task ${Date.now()}`;
  
  const { data: task, error } = await supabase
    .from('tasks')
    .insert([{
      title: taskTitle,
      description: 'Task created for testing',
      task_id: taskId,
      user_id: userId,
      organization_id: organizationId,
      assignees: [userId],
      status: 'pending'
    }])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test task: ${error.message}`);
  }
  
  return task;
}

describe('Task API', () => {
  
  // Clean up after all tests are done
  afterAll(async () => {
    // Clean up tasks first
    for (const task of testData.tasks) {
      if (task && task.task_id) {
        await supabase
          .from('tasks')
          .delete()
          .eq('task_id', task.task_id);
      }
    }
    
    // Then clean up other data
    await cleanupTestData(testData);
  });

  describe('POST /tasks', () => {
    test('should create a new task successfully', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      // Create an organization
      const organization = await createTestOrganization(testUser.user.user_id);
      testData.organizations.push(organization);
      
      // Create a task
      const taskData = {
        title: `Test Task Creation ${Date.now()}`,
        description: 'This is a test task',
        organization_id: organization.organization_id,
        assignees: [testUser.user.user_id]
      };

      const response = await api.post('/tasks', taskData, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.task).toBeDefined();
      expect(response.data.task.title).toBe(taskData.title);
      expect(response.data.task.description).toBe(taskData.description);
      expect(response.data.task.organization_id).toBe(taskData.organization_id);
      expect(response.data.task.task_id).toBeDefined();
      
      // Save task for cleanup
      if (response.data.task) {
        testData.tasks.push(response.data.task);
      }
    });

    test('should fail to create task without authentication', async () => {
      const response = await api.post('/tasks', {
        title: `Unauthorized Task ${Date.now()}`,
        description: 'This task should not be created',
        organization_id: uuidv4(),
        assignees: [uuidv4()]
      });
      
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    test('should fail to create task without required fields', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      const response = await api.post('/tasks', {
        // Missing title and organization_id
        description: 'This task is missing required fields'
      }, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /tasks', () => {
    test('should get all tasks for a user', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      // Create an organization
      const organization = await createTestOrganization(testUser.user.user_id);
      testData.organizations.push(organization);
      
      // Create a few tasks
      const task1 = await createTestTask(testUser.user.user_id, organization.organization_id, `Task List 1 ${Date.now()}`);
      const task2 = await createTestTask(testUser.user.user_id, organization.organization_id, `Task List 2 ${Date.now()}`);
      testData.tasks.push(task1, task2);
      
      // Get all tasks
      const response = await api.get('/tasks', {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.tasks).toBeDefined();
      expect(Array.isArray(response.data.tasks)).toBe(true);
      
      // Verify the two tasks we created are in the list (they might have tasks from other tests)
      const taskIds = response.data.tasks.map(t => t.task_id);
      expect(taskIds).toContain(task1.task_id);
      expect(taskIds).toContain(task2.task_id);
    });
  });

  describe('GET /tasks/:task_id', () => {
    test('should get a specific task by ID', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      // Create an organization
      const organization = await createTestOrganization(testUser.user.user_id);
      testData.organizations.push(organization);
      
      // Create a task
      const task = await createTestTask(testUser.user.user_id, organization.organization_id);
      testData.tasks.push(task);
      
      // Get the task by ID
      const response = await api.get(`/tasks/${task.task_id}`, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.task).toBeDefined();
      expect(response.data.task.task_id).toBe(task.task_id);
      expect(response.data.task.title).toBe(task.title);
    });

    test('should fail to get task with invalid ID', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      const response = await api.get(`/tasks/invalid-id-${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });

  describe('PUT /tasks/:task_id', () => {
    test('should update a task successfully', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      // Create an organization
      const organization = await createTestOrganization(testUser.user.user_id);
      testData.organizations.push(organization);
      
      // Create a task
      const task = await createTestTask(testUser.user.user_id, organization.organization_id);
      testData.tasks.push(task);
      
      // Update the task
      const updateData = {
        title: `Updated Task ${Date.now()}`,
        description: 'This task has been updated',
        status: 'completed'
      };

      const response = await api.put(`/tasks/${task.task_id}`, updateData, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.task).toBeDefined();
      expect(response.data.task.task_id).toBe(task.task_id);
      expect(response.data.task.title).toBe(updateData.title);
      expect(response.data.task.description).toBe(updateData.description);
      expect(response.data.task.status).toBe(updateData.status);
    });
  });

  describe('DELETE /tasks/:task_id', () => {
    test('should delete a task successfully', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      // Create an organization
      const organization = await createTestOrganization(testUser.user.user_id);
      testData.organizations.push(organization);
      
      // Create a task
      const task = await createTestTask(testUser.user.user_id, organization.organization_id);
      // Don't add to testData.tasks since we're deleting it in the test
      
      // Delete the task
      const response = await api.delete(`/tasks/${task.task_id}`, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the task is deleted
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('task_id', task.task_id)
        .single();
      
      expect(data).toBeNull();
    });

    test('should fail to delete task with invalid ID', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      const response = await api.delete(`/tasks/invalid-id-${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });
}); 