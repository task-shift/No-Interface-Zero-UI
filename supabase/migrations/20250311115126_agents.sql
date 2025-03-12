-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
    id SERIAL PRIMARY KEY,
    agent_name UUID NOT NULL UNIQUE,
    agent_id TEXT UNIQUE,
    organization_id UUID,
    organization_name TEXT,
    status VARCHAR(50),
    date_created DATE DEFAULT CURRENT_DATE,
    time_created TIME DEFAULT CURRENT_TIME
);

-- Create index on agent_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_agents_agent_name ON agents(agent_name);

-- Create index on agent_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_agents_agent_id ON agents(agent_id);

-- Create index on organization_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_agents_organization_id ON agents(organization_id);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

-- Create index on organization_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_agents_organization_name ON agents(organization_name);