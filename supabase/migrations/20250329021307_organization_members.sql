-- Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
    id SERIAL PRIMARY KEY,
    organization_id UUID,
    user_id UUID,
    username TEXT,
    email TEXT,
    fullname TEXT,
    avatar TEXT,
    status VARCHAR(50),
    role TEXT,
    permission TEXT,
    date_created DATE DEFAULT CURRENT_DATE,
    time_created TIME DEFAULT CURRENT_TIME
);

-- Create index on organization_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON organization_members(organization_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_email ON organization_members(email);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_username ON organization_members(username);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_organization_members_status ON organization_members(status);