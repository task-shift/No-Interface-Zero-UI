# No Interface Zero UI - Authentication System

A robust authentication and organization management system built with Node.js, Express, and Supabase.

## Features

- User registration and authentication
- Email verification system
- Organization creation and management
- JWT-based authentication
- Password encryption with bcrypt
- Role-based access control (Admin/User)
- Session management (Online/Offline status)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    fullname TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    avatar TEXT,
    user_id VARCHAR(255) UNIQUE,
    role TEXT,
    permission TEXT,
    organization_id UUID,
    status VARCHAR(50),  // When verified, this is set to 'verified'
    online BOOLEAN DEFAULT FALSE,
    date_created DATE DEFAULT CURRENT_DATE,
    time_created TIME DEFAULT CURRENT_TIME
);
```

### Organizations Table
```sql
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    organization_name TEXT NOT NULL,
    organization_id UUID NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    status VARCHAR(50),
    date_created DATE DEFAULT CURRENT_DATE,
    time_created TIME DEFAULT CURRENT_TIME
);
```

### Verification Table
```sql
CREATE TABLE verification (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT,
    verification_code VARCHAR(10),
    status VARCHAR(50) DEFAULT 'pending',
    date_created DATE DEFAULT CURRENT_DATE,
    time_created TIME DEFAULT CURRENT_TIME
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    task_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    organization_id UUID NOT NULL,
    assignees JSONB NOT NULL,  -- Array of assignees
    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE,
    date_created DATE DEFAULT CURRENT_DATE,
    time_created TIME DEFAULT CURRENT_TIME
);
```

## API Endpoints

### Authentication

#### Register a New User
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

Response:
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
        "organization_id": "org_uuid_here",  // Only present if organization was created
        "status": "active",
        "organization": {  // Only present if organization was created
            "organization_id": "org_uuid_here",
            "organization_name": "Acme Corp"
        }
    }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
    "login": "johndoe",  // Can be username or email
    "password": "securepassword123"
}
```

Response (Success):
```json
{
    "success": true,
    "token": "jwt_token_here",
    "user": {
        // User data including organization details
    }
}
```

Response (Unverified Email):
```json
{
    "success": false,
    "message": "Please verify your email before logging in",
    "verificationRequired": true,
    "email": "user@example.com"
}
```

### Email Verification Process

#### 1. Send Verification Email
Send a verification code to the user's email to verify their identity.

```http
POST /api/auth/send-verification
Content-Type: application/json

{
    "email": "user@example.com"  // Email address to verify
}
```

Response:
```json
{
    "success": true,
    "message": "Verification email sent successfully",
    "data": {
        "id": "email_123456789",
        // Other data from the email service
    }
}
```

#### 2. Verify Email with Code
After the user receives the email and enters the verification code, submit it for verification.
This will update both the verification record and the user's status to 'verified'.

```http
POST /api/auth/verify-email
Content-Type: application/json

{
    "email": "user@example.com",
    "verificationCode": "123456"
}
```

Response:
```json
{
    "success": true,
    "message": "Email verified successfully"
}
```

#### 3. Check Verification Status
You can check the verification status of an email at any time.

```http
GET /api/auth/verification-status?email=user@example.com
```

Response:
```json
{
    "success": true,
    "status": "verified",  // Can be "verified", "pending", "expired", or "not_found"
    "verified": true
}
```

### User Management

#### Get Current User
Requires a verified email.

```http
GET /api/auth/me
Authorization: Bearer jwt_token_here
```

Response:
```json
{
    "success": true,
    "user": {
        // User data
    }
}
```

Response (Unverified Email):
```json
{
    "success": false,
    "message": "Email verification required. Please verify your email to access this resource.",
    "verificationRequired": true
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer jwt_token_here
```

Response:
```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

### Tasks
All task endpoints require a verified email.

#### Create a Task (Admin/AdminX only)
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

Response:
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

#### Get All Organization Tasks
```http
GET /api/tasks
Authorization: Bearer jwt_token_here
```

Response:
```json
{
    "success": true,
    "tasks": [
        {
            // Task data
        },
        {
            // Task data
        }
    ]
}
```

#### Get Task by ID
```http
GET /api/tasks/:task_id
Authorization: Bearer jwt_token_here
```

Response:
```json
{
    "success": true,
    "task": {
        // Task data
    }
}
```

### Organizations
All organization endpoints require a verified email.

#### Create Organization
```http
POST /api/organizations
Content-Type: application/json
Authorization: Bearer jwt_token_here

{
    "organization_name": "New Company Inc."
}
```

Response:
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

#### Get User's Organization
```http
GET /api/organizations/me
Authorization: Bearer jwt_token_here
```

Response:
```json
{
    "success": true,
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

#### List All Organizations (Admin only)
```http
GET /api/organizations
Authorization: Bearer jwt_token_here
```

Response:
```json
{
    "success": true,
    "organizations": [
        {
            // Organization data
        },
        {
            // Organization data
        }
    ]
}
```

### Test Endpoints

#### Send Test Email
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

Response:
```json
{
    "success": true,
    "message": "Test email sent successfully",
    "data": {
        "id": "email_123456789",
        // Other data from the email service
    }
}
```

#### Send Verification Email (Test)
```http
POST /test/verification-email
Content-Type: application/json

{
    "to": "recipient@example.com",  // Required - can be a string or array of emails
    "verificationCode": "ABC123"    // Required - the verification code to include in the email
}
```

Response:
```json
{
    "success": true,
    "message": "Verification email sent successfully",
    "data": {
        "id": "email_123456789",
        // Other data from the email service
    }
}
```

## Process Flows

### Authentication Flow

1. **Registration**:
   - User provides registration details
   - If organization name is provided, system creates organization (optional)
   - System creates user with optional organization association
   - Returns JWT token and user data

2. **Email Verification**:
   - After registration, user receives a verification email 
   - User enters the code to verify their email
   - User status is updated to 'verified'

3. **Login**:
   - User provides username/email and password
   - System verifies credentials
   - System checks if user has verified their email
   - If verified, returns JWT token and user data
   - If not verified, returns error with verification required flag

4. **Protected Routes**:
   - Client includes JWT token in Authorization header
   - Server validates token
   - Server checks if user has verified their email
   - If verified, grants access to protected resources
   - If not verified, returns 403 with verification required message

5. **Logout**:
   - Client sends logout request with JWT token
   - Server updates user's online status
   - Client removes token from storage

### Email Verification Flow

1. **Initiate Verification**:
   - Client calls the send-verification endpoint with the user's email
   - Server generates a unique verification code
   - Server stores the code in the verification table
   - Server sends an email with the verification code to the user

2. **User Verification**:
   - User receives the email with the verification code
   - User enters the code in the application
   - Client sends the code and email to the verify-email endpoint
   - Server validates the code against the stored record for that email
   - Server updates the verification status to "verified" if valid

3. **Status Checking** (optional):
   - Client can check the verification status at any time
   - Server retrieves the current status from the verification table
   - Server returns the status and a boolean indicating if verification is complete

4. **Expiration Handling**:
   - Verification codes automatically expire after 24 hours
   - If a user attempts to verify with an expired code, they receive an error
   - Users can request a new code by calling the send-verification endpoint again

## Security Features

1. **Password Security**:
   - Passwords are hashed using bcrypt
   - Salt rounds: 10
   - Never stored in plain text

2. **JWT Token**:
   - Expires after 24 hours
   - Contains encrypted user ID
   - Required for protected routes

3. **Email Verification Security**:
   - Unique verification codes generated for each request
   - Token-based verification prevents brute force attempts
   - 24-hour expiration period for verification codes
   - Status tracking prevents reuse of verification codes
   - Protected routes require verified email status
   - Login requires email verification

4. **Database Security**:
   - Unique constraints on username and email
   - UUID for user and organization IDs
   - Status tracking for users and organizations

## Error Handling

The API returns consistent error responses:

```json
{
    "success": false,
    "message": "Error description here"
}
```

Common error scenarios:
- Invalid credentials
- Missing required fields
- Duplicate username/email
- Invalid token
- Invalid or expired verification code
- Server errors

## Environment Variables

Required environment variables:
```bash
JWT_SECRET=your_jwt_secret_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
RESEND_API_KEY=your_resend_api_key
PORT=3000  # Optional, defaults to 3000
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/no-interface-zero-ui.git
cd no-interface-zero-ui
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

4. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Dependencies

- express: Web framework
- @supabase/supabase-js: Database client
- bcryptjs: Password hashing
- jsonwebtoken: JWT token handling
- uuid: UUID generation
- resend: Email service
- dotenv: Environment variable management

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

ISC License

## Support

For support, email support@example.com or create an issue in the repository.