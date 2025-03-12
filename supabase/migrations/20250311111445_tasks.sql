-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    task_id TEXT NOT NULL UNIQUE,
    user_id TEXT UNIQUE,
    organization_id UUID,
    assigned JSONB,
    status VARCHAR(50),
    due_date DATE,
    date_created DATE DEFAULT CURRENT_DATE,
    time_created TIME DEFAULT CURRENT_TIME
);

-- Create index on task_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON tasks(task_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Create index on organization_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON tasks(organization_id);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Create index on due_date for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);