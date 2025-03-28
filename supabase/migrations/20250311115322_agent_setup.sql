-- Create agent_setup table
CREATE TABLE IF NOT EXISTS agent_setup (
    id SERIAL PRIMARY KEY,
    agent_id UUID NOT NULL UNIQUE,
    organization_id UUID,
    setup_type TEXT,
    setup_key TEXT,
    status VARCHAR(50),
    date_created DATE DEFAULT CURRENT_DATE,
    time_created TIME DEFAULT CURRENT_TIME
);

-- Create index on agent_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_setup_agent_id ON agent_setup(agent_id);

-- Create index on organization_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_setup_organization_id ON agent_setup(organization_id);

-- Create index on setup_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_agent_setup_setup_type ON agent_setup(setup_type);

-- Create index on setup_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_setup_setup_key ON agent_setup(setup_key);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_agent_setup_status ON agent_setup(status);