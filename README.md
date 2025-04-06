# No Interface Zero UI - API Documentation


## Base URL

All API endpoints are available under the base URL of your deployed server: `http://localhost:3000` for local development.

## Authorization

Most endpoints require authorization via a JWT token provided in the `Authorization` header:

```
Authorization: Bearer your_jwt_token
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- Authentication endpoints: 10 requests/hour per IP
- Email verification endpoints: 5 requests/hour per IP
- General API endpoints: 100 requests/15 minutes per IP
- Global limit: 500 requests/15 minutes per IP

## Common Response Formats

### Success Response

```json
{
    "success": true,
    "message": "Operation completed successfully",
    "data": { ... }
}
```

### Error Response

```json
{
    "success": false,
    "message": "Description of the error"
}
```

## API Endpoints

## Authentication Endpoints

### Register a New User

Creates a new user account with optional organization creation.

```http
POST /api/auth/register
Content-Type: application/json

{
    "username": "johndoe",
    "email": "john.doe@example.com",
    "fullname": "John Doe",
    "password": "securepassword123",
    "organization_name": "Acme Corp",  // Optional - if provided, creates an organization
    "type": "adminx"  // Optional - if "adminx", creates admin user
}
```

#### Response (Success)

```json
{
    "success": true,
    "token": "jwt_token_here",
    "user": {
        "id": 1,
        "fullname": "John Doe",
        "username": "johndoe",
        "email": "john.doe@example.com",
        "avatar": null,
        "user_id": "uuid_here",
        "role": "admin",
        "organization_id": ["org_uuid_here"],  // Array of organization IDs
        "status": "active",
        "organization": {  // Only present if organization was created
            "organization_id": "org_uuid_here",
            "organization_name": "Acme Corp"
        }
    }
}
```

#### Response (Error - Duplicate Username)

```json
{
    "success": false,
    "message": "Username already exists"
}
```

### Login

Authenticates a user using username/email and password.

```http
POST /api/auth/login
Content-Type: application/json

{
    "login": "johndoe",  // Can be username or email
    "password": "securepassword123"
}
```

#### Response (Success)

```json
{
    "success": true,
    "token": "jwt_token_here",
    "user": {
        "id": 1,
        "fullname": "John Doe",
        "username": "johndoe",
        "email": "john.doe@example.com",
        "avatar": null,
        "user_id": "uuid_here",
        "role": "admin",
        "organization_id": ["org_uuid_here"],
        "current_organization_id": "org_uuid_here",
        "status": "verified",
        "online": true
    }
}
```

#### Response (Error - Unverified Email)

```json
{
    "success": false,
    "message": "Please verify your email before logging in",
    "verificationRequired": true,
    "email": "john.doe@example.com"
}
```

### Logout

Logs out the current user.

```http
POST /api/auth/logout
Authorization: Bearer jwt_token_here
```

#### Response

```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

### Get Current User

Retrieves the current authenticated user's information.

```http
GET /api/auth/me
Authorization: Bearer jwt_token_here
```

#### Response (Success)

```json
{
    "success": true,
    "user": {
        "id": 1,
        "fullname": "John Doe",
        "username": "johndoe",
        "email": "john.doe@example.com",
        "avatar": null,
        "user_id": "uuid_here",
        "role": "admin",
        "organization_id": ["org_uuid_here"],
        "current_organization_id": "org_uuid_here",
        "status": "verified",
        "online": true
    }
}
```

#### Response (Error - Verification Required)

```json
{
    "success": false,
    "message": "Email verification required. Please verify your email to access this resource.",
    "verificationRequired": true
}
```

## Email Verification Endpoints

### Send Verification Email (Auth Route)

Sends a verification code to the user's email.

```http
POST /api/auth/send-verification
Content-Type: application/json

{
    "email": "user@example.com"  // Email address to verify
}
```

#### Response

```json
{
    "success": true,
    "message": "Verification email sent successfully",
    "data": {
        "id": "email_123456789"
    }
}
```

### Send Verification Email (Email Route)

Alternative route for sending verification emails.

```http
POST /api/email/send-verification
Content-Type: application/json

{
    "email": "user@example.com"  // Email address to verify
}
```

#### Response

```json
{
    "success": true,
    "message": "Verification email sent successfully",
    "data": {
        "id": "email_123456789"
    }
}
```

### Resend Verification Email

Resends a verification email for users who didn't receive the first one or whose code expired.

```http
POST /api/email/resend-verification
Content-Type: application/json

{
    "email": "user@example.com"  // Email address to verify
}
```

#### Response

```json
{
    "success": true,
    "message": "Verification email sent successfully",
    "data": {
        "id": "email_123456789"
    }
}
```

### Verify Email with Code

Verifies an email using the verification code sent to the user.

```http
POST /api/auth/verify-email
Content-Type: application/json

{
    "email": "user@example.com",
    "verificationCode": "123456"  // 6-digit code from the email
}
```

#### Response (Success)

```json
{
    "success": true,
    "message": "Email verified successfully"
}
```

#### Response (Error - Invalid Code)

```json
{
    "success": false,
    "message": "Invalid verification code"
}
```

### Check Verification Status (Auth Route)

Checks if an email has been verified.

```http
GET /api/auth/verification-status?email=user@example.com
```

#### Response

```json
{
    "success": true,
    "status": "verified",  // Can be "verified", "pending", "expired", or "not_found"
    "verified": true
}
```

### Check Verification Status (Email Route)

Alternative route for checking email verification status.

```http
POST /api/email/check-verification
Content-Type: application/json

{
    "email": "user@example.com"  // Email to check
}
```

#### Response

```json
{
    "success": true,
    "status": "pending",  // Can be "verified", "pending", "expired", or "not_found"
    "verified": false
}
```

### Send Test Email (Admin Only)

Sends a test email (restricted to admin users).

```http
POST /api/email/test
Content-Type: application/json
Authorization: Bearer jwt_token_here

{
    "to": "recipient@example.com",  // Required - can be a string or array of emails
    "subject": "Test Subject",      // Optional - default: "Test Email"
    "content": "Custom content for the email", // Optional - default: "This is a test email from the API."
    "html": "<p>Test email body</p>" // Optional - override the entire email HTML
}
```

#### Response

```json
{
    "success": true,
    "message": "Test email sent successfully",
    "data": {
        "id": "email_123456789"
    }
}
```

## Organization Endpoints

All organization endpoints require a verified user (email verified).

### Create Organization

Creates a new organization.

```http
POST /api/organizations
Content-Type: application/json
Authorization: Bearer jwt_token_here

{
    "organization_name": "New Company Inc."
}
```

#### Response (Success)

```json
{
    "success": true,
    "message": "Organization created successfully",
    "organization": {
        "id": 1,
        "organization_name": "New Company Inc.",
        "organization_id": "org_uuid_here",
        "user_id": "creator_user_id",
        "status": "active",
        "date_created": "2023-08-15",
        "time_created": "14:30:00"
    }
}
```

#### Response (Error - Duplicate Organization)

```json
{
    "success": false,
    "message": "An organization with this name already exists",
    "error": "DUPLICATE_ORGANIZATION_NAME"
}
```

### Get User's Organizations

Returns all organizations the current user belongs to.

```http
GET /api/organizations/my-organizations
Authorization: Bearer jwt_token_here
```

#### Response

```json
{
    "success": true,
    "organizations": [
        {
            "id": 1,
            "organization_name": "Company A",
            "organization_id": "org_uuid_1",
            "user_id": "creator_user_id",
            "status": "active",
            "date_created": "2023-08-15",
            "time_created": "14:30:00"
        },
        {
            "id": 2,
            "organization_name": "Company B",
            "organization_id": "org_uuid_2",
            "user_id": "other_user_id",
            "status": "active",
            "date_created": "2023-08-16",
            "time_created": "10:15:00"
        }
    ]
}
```

### Get User's Primary Organization

Returns the user's primary organization (for backward compatibility).

```http
GET /api/organizations/me
Authorization: Bearer jwt_token_here
```

#### Response

```json
{
    "success": true,
    "organization": {
        "id": 1,
        "organization_name": "Company A",
        "organization_id": "org_uuid_here",
        "user_id": "creator_user_id",
        "status": "active",
        "date_created": "2023-08-15",
        "time_created": "14:30:00"
    }
}
```

### Get Organization by ID

Returns a specific organization by ID.

```http
GET /api/organizations/:organization_id
Authorization: Bearer jwt_token_here
```

#### Response

```json
{
    "success": true,
    "organization": {
        "id": 1,
        "organization_name": "Company A",
        "organization_id": "org_uuid_here",
        "user_id": "creator_user_id",
        "status": "active",
        "date_created": "2023-08-15",
        "time_created": "14:30:00"
    }
}
```

### Join Organization

Adds the current user to an organization.

```http
POST /api/organizations/join
Content-Type: application/json
Authorization: Bearer jwt_token_here

{
    "organization_id": "org_uuid_here"
}
```

#### Response

```json
{
    "success": true,
    "message": "Successfully joined organization",
    "organization": {
        "id": 1,
        "organization_name": "Company A",
        "organization_id": "org_uuid_here",
        "user_id": "creator_user_id",
        "status": "active",
        "date_created": "2023-08-15",
        "time_created": "14:30:00"
    }
}
```

### Leave Organization

Removes the current user from an organization.

```http
DELETE /api/organizations/:organization_id/leave
Authorization: Bearer jwt_token_here
```

#### Response

```json
{
    "success": true,
    "message": "Successfully left organization"
}
```

### Set Current Organization

Sets a specific organization as the user's current active organization.

```http
POST /api/organizations/set-current
Content-Type: application/json
Authorization: Bearer jwt_token_here

{
    "organization_id": "org_uuid_here"  // UUID of the organization to set as current
}
```

#### Response (Success)

```json
{
    "success": true,
    "message": "Current organization set successfully",
    "user": {
        "id": 1,
        "fullname": "John Doe",
        "username": "johndoe",
        "email": "john.doe@example.com",
        "avatar": null,
        "user_id": "uuid_here",
        "role": "admin",
        "organization_id": ["org_uuid_1", "org_uuid_2"],  // All organizations the user belongs to
        "current_organization_id": "org_uuid_here",  // The newly set current organization
        "status": "verified"
    }
}
```

#### Response (Error - Not Member)

```json
{
    "success": false,
    "message": "You are not a member of this organization",
    "error": "NOT_MEMBER"
}
```

### Invite Team Member

Invites a new user to join the user's current active organization by email.

```http
POST /api/organizations/invite
Content-Type: application/json
Authorization: Bearer jwt_token_here

{
    "email": "newmember@example.com",
    "fullname": "Jane Smith",
    "role": "user",              // Optional - defaults to "user"
    "permission": "standard"     // Optional - defaults to "standard"
}
```

#### Response (Success)

```json
{
    "success": true,
    "message": "Invitation sent successfully",
    "invitation": {
        "id": 1,
        "organization_id": "org_uuid_here",
        "email": "newmember@example.com",
        "fullname": "Jane Smith",
        "role": "user",
        "permission": "standard",
        "status": "invited",
        "date_created": "2023-08-15",
        "time_created": "14:30:00"
    }
}
```

#### Response (Error - No Current Organization)

```json
{
    "success": false,
    "message": "No current organization set. Please set a current organization before inviting team members."
}
```

#### Response (Error - Already Invited)

```json
{
    "success": false,
    "message": "This user has already been invited to the organization",
    "error": "ALREADY_INVITED"
}
```

#### Response (Error - Already a Member)

```json
{
    "success": false,
    "message": "This user is already a member of the organization",
    "error": "ALREADY_MEMBER"
}
```

### Activate Organization Invitation

Activates a pending invitation for the authenticated user, changing their status from "invited" to "active" in the organization_members table, adds the organization to the user's organization list, and sets it as their current active organization.

```http
POST /api/organizations/activate-invitation
Content-Type: application/json
Authorization: Bearer jwt_token_here

{
    "email": "john.doe@example.com",
    "organization_id": "org_uuid_here"
}
```

#### Response (Success)

```json
{
    "success": true,
    "message": "Invitation activated successfully",
    "activation": {
        "id": 1,
        "organization_id": "org_uuid_here",
        "email": "john.doe@example.com",
        "fullname": "John Doe",
        "role": "user",
        "permission": "standard",
        "status": "active",
        "user_id": "user_uuid_here",
        "date_created": "2023-08-15",
        "time_created": "14:30:00"
    },
    "organization": {
        "organization_id": "org_uuid_here",
        "organization_name": "Acme Corp",
        "created_at": "2023-08-15T14:30:00Z"
    },
    "user": {
        "id": 1,
        "fullname": "John Doe",
        "username": "johndoe",
        "email": "john.doe@example.com",
        "organization_id": ["org_uuid_here"],
        "current_organization_id": "org_uuid_here",
        "status": "verified"
    }
}
```

#### Response (Error - No Invitation Found)

```json
{
    "success": false,
    "message": "No pending invitation found for this email and organization"
}
```

#### Response (Error - Email Mismatch)

```json
{
    "success": false,
    "message": "You can only activate invitations sent to your own email address"
}
```

### Activate Organization Invitation with Registration

Activates a pending invitation and simultaneously registers a new user account. This endpoint is designed for new users who have been invited to join an organization but don't have an account yet. The user will be automatically verified and added to the organization.

```http
POST /api/organizations/activate-invitation-with-registration
Content-Type: application/json

{
    "email": "john.doe@example.com",
    "organization_id": "org_uuid_here",
    "username": "johndoe",
    "fullname": "John Doe",
    "password": "securepassword123"
}
```

#### Response (Success)

```json
{
    "success": true,
    "message": "Registration successful and invitation activated",
    "token": "jwt_token_here",
    "user": {
        "id": 1,
        "fullname": "John Doe",
        "username": "johndoe",
        "email": "john.doe@example.com",
        "avatar": null,
        "user_id": "user_uuid_here",
        "role": "user",
        "organization_id": ["org_uuid_here"],
        "current_organization_id": "org_uuid_here",
        "status": "verified"
    },
    "organization": {
        "organization_id": "org_uuid_here",
        "organization_name": "Acme Corp",
        "created_at": "2023-08-15T14:30:00Z"
    },
    "activation": {
        "id": 1,
        "organization_id": "org_uuid_here",
        "email": "john.doe@example.com",
        "fullname": "John Doe",
        "role": "user",
        "permission": "standard",
        "status": "active",
        "user_id": "user_uuid_here",
        "date_created": "2023-08-15",
        "time_created": "14:30:00"
    }
}
```

#### Response (Error - No Invitation Found)

```json
{
    "success": false,
    "message": "No pending invitation found for this email and organization"
}
```

#### Response (Error - Username Already Exists)

```json
{
    "success": false,
    "message": "Username already exists",
    "error": "USERNAME_EXISTS"
}
```

#### Response (Error - Email Already Exists)

```json
{
    "success": false,
    "message": "Email already exists",
    "error": "EMAIL_EXISTS"
}
```

### List All Organizations (Admin Only)

Returns a list of all organizations (restricted to admin users).

```http
GET /api/organizations
Authorization: Bearer jwt_token_here
```

#### Response

```json
{
    "success": true,
    "organizations": [
        {
            "id": 1,
            "organization_name": "Company A",
            "organization_id": "org_uuid_1",
            "user_id": "user_id_1",
            "status": "active",
            "date_created": "2023-08-15",
            "time_created": "14:30:00"
        },
        {
            "id": 2,
            "organization_name": "Company B",
            "organization_id": "org_uuid_2",
            "user_id": "user_id_2",
            "status": "active",
            "date_created": "2023-08-16",
            "time_created": "10:15:00"
        }
    ]
}
```

## Task Endpoints

All task endpoints require a verified user (email verified).

### Create Task (Admin/AdminX Only)

Creates a new task in the user's current organization.

```http
POST /api/tasks
Content-Type: application/json
Authorization: Bearer jwt_token_here

{
    "title": "Complete Project Plan",
    "description": "Create a comprehensive project plan including timelines and resource allocation",
    "assignees": [
        {
            "user_id": "user1_uuid_here",
            "username": "janesmith",
            "fullname": "Jane Smith",
            "email": "jane.smith@example.com",
            "avatar": "avatar_url_here"
        },
        {
            "user_id": "user2_uuid_here",
            "username": "johndoe",
            "fullname": "John Doe",
            "email": "john.doe@example.com",
            "avatar": "avatar_url_here"
        }
    ],
    "status": "pending",
    "due_date": "2023-12-31"
}
```

#### Response

```json
{
    "success": true,
    "task": {
        "id": 1,
        "title": "Complete Project Plan",
        "description": "Create a comprehensive project plan including timelines and resource allocation",
        "task_id": "task_uuid_here",
        "user_id": "admin_user_uuid_here",
        "organization_id": "org_uuid_here",
        "assignees": [
            {
                "user_id": "user1_uuid_here",
                "username": "janesmith",
                "fullname": "Jane Smith",
                "email": "jane.smith@example.com",
                "avatar": "avatar_url_here"
            },
            {
                "user_id": "user2_uuid_here",
                "username": "johndoe",
                "fullname": "John Doe",
                "email": "john.doe@example.com",
                "avatar": "avatar_url_here"
            }
        ],
        "status": "pending",
        "due_date": "2023-12-31",
        "date_created": "2023-08-15",
        "time_created": "14:30:00"
    }
}
```

### Get All Organization Tasks

Returns all tasks for the user's current organization.

```http
GET /api/tasks
Authorization: Bearer jwt_token_here
```

#### Response

```json
{
    "success": true,
    "tasks": [
        {
            "id": 1,
            "title": "Task 1",
            "description": "Task 1 description",
            "task_id": "task_uuid_1",
            "user_id": "creator_user_id",
            "organization_id": "org_uuid_here",
            "assignees": [
                {
                    "user_id": "user1_uuid_here",
                    "username": "janesmith",
                    "fullname": "Jane Smith"
                }
            ],
            "status": "pending",
            "due_date": "2023-12-15",
            "date_created": "2023-08-15",
            "time_created": "14:30:00"
        },
        {
            "id": 2,
            "title": "Task 2",
            "description": "Task 2 description",
            "task_id": "task_uuid_2",
            "user_id": "creator_user_id",
            "organization_id": "org_uuid_here",
            "assignees": [
                {
                    "user_id": "user2_uuid_here",
                    "username": "johndoe",
                    "fullname": "John Doe"
                }
            ],
            "status": "in_progress",
            "due_date": "2023-12-20",
            "date_created": "2023-08-16",
            "time_created": "09:15:00"
        }
    ]
}
```

### Get Task by ID

Returns a specific task by ID.

```http
GET /api/tasks/:task_id
Authorization: Bearer jwt_token_here
```

#### Response

```json
{
    "success": true,
    "task": {
        "id": 1,
        "title": "Task 1",
        "description": "Task 1 description",
        "task_id": "task_uuid_1",
        "user_id": "creator_user_id",
        "organization_id": "org_uuid_here",
        "assignees": [
            {
                "user_id": "user1_uuid_here",
                "username": "janesmith",
                "fullname": "Jane Smith"
            }
        ],
        "status": "pending",
        "due_date": "2023-12-15",
        "date_created": "2023-08-15",
        "time_created": "14:30:00"
    }
}
```

### Update Task (Admin/AdminX Only)

Updates an existing task.

```http
PUT /api/tasks/:task_id
Content-Type: application/json
Authorization: Bearer jwt_token_here

{
    "title": "Updated Task Title",
    "description": "Updated task description",
    "status": "in_progress",
    "due_date": "2023-12-25",
    "assignees": [
        {
            "user_id": "user1_uuid_here",
            "username": "janesmith",
            "fullname": "Jane Smith"
        },
        {
            "user_id": "user3_uuid_here",
            "username": "maryjohnson",
            "fullname": "Mary Johnson"
        }
    ]
}
```

#### Response

```json
{
    "success": true,
    "task": {
        "id": 1,
        "title": "Updated Task Title",
        "description": "Updated task description",
        "task_id": "task_uuid_1",
        "user_id": "creator_user_id",
        "organization_id": "org_uuid_here",
        "assignees": [
            {
                "user_id": "user1_uuid_here",
                "username": "janesmith",
                "fullname": "Jane Smith"
            },
            {
                "user_id": "user3_uuid_here",
                "username": "maryjohnson",
                "fullname": "Mary Johnson"
            }
        ],
        "status": "in_progress",
        "due_date": "2023-12-25",
        "date_created": "2023-08-15",
        "time_created": "14:30:00"
    },
    "message": "Task updated successfully"
}
```

## Test Endpoints

These endpoints are intended for testing purposes only and should not be used in production.

### Send Test Email

Sends a test email without requiring authentication.

```http
POST /test/emails
Content-Type: application/json

{
    "to": "recipient@example.com",  // Required - can be a string or array of emails
    "subject": "Test Subject",      // Optional - default: "Test Email"
    "content": "Custom content for the email", // Optional - default: "This is a test email from the API."
    "html": "<p>Test email body</p>" // Optional - override the entire email HTML
}
```

#### Response

```json
{
    "success": true,
    "message": "Test email sent successfully",
    "data": {
        "id": "email_123456789"
    }
}
```

### Send Verification Email (Test)

Sends a verification email without requiring authentication.

```http
POST /test/verification-email
Content-Type: application/json

{
    "to": "recipient@example.com",  // Required - can be a string or array of emails
    "verificationCode": "ABC123"    // Required - the verification code to include in the email
}
```

#### Response

```json
{
    "success": true,
    "message": "Verification email sent successfully",
    "data": {
        "id": "email_123456789"
    }
}
```

## Error Status Codes

- **400 Bad Request**: Invalid input, missing required fields
- **401 Unauthorized**: Invalid or missing authentication token
- **403 Forbidden**: Not enough permissions to access the resource
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists (e.g., duplicate username)
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

## Authentication Errors

When authentication is required but not provided or invalid:

```json
{
    "success": false,
    "message": "Authentication required. Please log in."
}
```

## Verification Errors

When email verification is required but not completed:

```json
{
    "success": false,
    "message": "Email verification required. Please verify your email to access this resource.",
    "verificationRequired": true
}
```