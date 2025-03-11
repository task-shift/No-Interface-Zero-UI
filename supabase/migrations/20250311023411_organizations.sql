-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    organization_name TEXT NOT NULL,
    organization_id TEXT NOT NULL UNIQUE,
    user_id TEXT UNIQUE,
    organization_id UUID,
    status VARCHAR(50),
    date_created DATE DEFAULT CURRENT_DATE,
    time_created TIME DEFAULT CURRENT_TIME
);

-- Create index on organization_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_organization_id ON organizations(organization_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON organizations(user_id);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);