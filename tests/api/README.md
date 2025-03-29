# API Tests

This directory contains comprehensive tests for the API endpoints of the TaskShift application.

## Overview

The test suite is divided into several categories:

1. **User Tests** - Tests for user registration, authentication, and profile management
2. **Organization Tests** - Tests for creating and managing organizations and user memberships
3. **Task Tests** - Tests for creating, listing, updating, and deleting tasks
4. **Email Tests** - Tests for email verification and notification functionality

## Prerequisites

Before running the tests, make sure you have:

1. A local development environment with Node.js installed
2. Proper environment variables set up in your `.env` file
3. A running Supabase instance (either local or remote for testing)

## Running the Tests

You can run the tests using npm:

```bash
# Run all API tests
npm run test:api

# Run specific test categories
npm run test:api:user
npm run test:api:organization
npm run test:api:task
npm run test:api:email
```

## Important Notes

1. **Database Cleanup**: The tests are designed to clean up after themselves. However, if tests are interrupted, some test data might remain in your database.

2. **Email Testing**: For email tests, actual emails are not sent in test mode. The system verifies that the correct functions are called with the correct parameters.

3. **Test Database**: It's recommended to use a separate database for testing to avoid polluting your development or production data.

## Test Structure

Each test file follows a similar structure:

1. **Setup** - Creating necessary test data (users, organizations, etc.)
2. **Test Execution** - Running the actual tests
3. **Cleanup** - Removing test data from the database

The tests use the `setup.js` file which contains helper functions for creating test users, organizations, and other common tasks.

## Extending the Tests

When adding new API endpoints, make sure to:

1. Add corresponding tests
2. Ensure tests cover both success and error cases
3. Clean up any test data created during your tests

## Multi-Organization Testing

The organization tests include verification of multi-organization support, ensuring that:

1. A user can create multiple organizations
2. A user can join organizations created by others
3. Organization-specific operations are properly scoped 