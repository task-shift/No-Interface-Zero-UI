-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL UNIQUE,
    user_id TEXT UNIQUE,
    organization_id UUID,
    email TEXT,
    username TEXT,
    fullname TEXT,
    avatar TEXT,
    role TEXT,
    permission TEXT,
    department TEXT,
    department_id TEXT,
    status VARCHAR(50),
    date_created DATE DEFAULT CURRENT_DATE,
    time_created TIME DEFAULT CURRENT_TIME
);

-- Create index on project_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- Create index on organization_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_members_organization_id ON project_members(organization_id);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_project_members_status ON project_members(status);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_members_email ON project_members(email);

-- Create index on department for faster filtering
CREATE INDEX IF NOT EXISTS idx_project_members_department ON project_members(department);