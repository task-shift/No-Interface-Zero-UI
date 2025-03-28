-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    department_id UUID NOT NULL UNIQUE,
    organization_id UUID,
    department_name TEXT,
    department_description TEXT,
    status VARCHAR(50),
    date_created DATE DEFAULT CURRENT_DATE,
    time_created TIME DEFAULT CURRENT_TIME
);

-- Create index on department_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_departments_department_id ON departments(department_id);

-- Create index on organization_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_departments_organization_id ON departments(organization_id);

-- Create index on department_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_departments_department_name ON departments(department_name);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);