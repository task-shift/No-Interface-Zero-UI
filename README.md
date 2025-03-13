# No Interface Zero UI - Authentication System

A robust authentication and organization management system built with Node.js, Express, and Supabase.

## Features

- User registration and authentication
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
    status VARCHAR(50),
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
    "organization_name": "Acme Corp",
    "password": "securepassword123",
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
        "organization_id": "org_uuid_here",
        "status": "active",
        "organization": {
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

Response:
```json
{
    "success": true,
    "token": "jwt_token_here",
    "user": {
        // User data including organization details
    }
}
```

#### Get Current User
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

## Authentication Flow

1. **Registration**:
   - User provides registration details including organization name
   - System creates organization
   - System creates user with organization association
   - Returns JWT token and user data

2. **Login**:
   - User provides username/email and password
   - System verifies credentials
   - Returns JWT token and user data
   - Updates user's online status

3. **Protected Routes**:
   - Client includes JWT token in Authorization header
   - Server validates token
   - Grants access to protected resources

4. **Logout**:
   - Client sends logout request with JWT token
   - Server updates user's online status
   - Client removes token from storage

## Security Features

1. **Password Security**:
   - Passwords are hashed using bcrypt
   - Salt rounds: 10
   - Never stored in plain text

2. **JWT Token**:
   - Expires after 24 hours
   - Contains encrypted user ID
   - Required for protected routes

3. **Database Security**:
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
- Server errors

## Environment Variables

Required environment variables:
```bash
JWT_SECRET=your_jwt_secret_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
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