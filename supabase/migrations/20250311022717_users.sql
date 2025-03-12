-- Create users table
CREATE TABLE IF NOT EXISTS users (
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

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);

-- Create index on organization_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

