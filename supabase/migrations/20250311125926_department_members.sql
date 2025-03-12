-- Create agent_contacts table
CREATE TABLE IF NOT EXISTS department_members (
    id SERIAL PRIMARY KEY,
    department_id UUID NOT NULL UNIQUE,
    organization_id UUID,
    user_id UUID,
    username TEXT,
    email TEXT,
    fullname TEXT,
    avatar TEXT,
    status VARCHAR(50),
    date_created DATE DEFAULT CURRENT_DATE,
    time_created TIME DEFAULT CURRENT_TIME
);

-- Create index on agent_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_contacts_agent_id ON agent_contacts(agent_id);

-- Create index on organization_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_contacts_organization_id ON agent_contacts(organization_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_contacts_user_id ON agent_contacts(user_id);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_contacts_email ON agent_contacts(email);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_contacts_username ON agent_contacts(username);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_agent_contacts_status ON agent_contacts(status);