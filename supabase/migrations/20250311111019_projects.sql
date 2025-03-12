-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    project_id TEXT NOT NULL UNIQUE,
    user_id TEXT UNIQUE,
    organization_id UUID,
    status VARCHAR(50),
    date_created DATE DEFAULT CURRENT_DATE,
    time_created TIME DEFAULT CURRENT_TIME
);

-- Create index on project_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_project_id ON projects(project_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Create index on organization_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);