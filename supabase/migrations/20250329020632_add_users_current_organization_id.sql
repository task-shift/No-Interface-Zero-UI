-- Add the current_organization_id column to the users table
ALTER TABLE users 
ADD COLUMN current_organization_id TEXT DEFAULT NULL;

-- Update the column with the existing organization_id values
UPDATE users
SET current_organization_id = organization_id::TEXT
WHERE organization_id IS NOT NULL;

-- Add a comment explaining this column
COMMENT ON COLUMN users.current_organization_id IS 'Stores the current selected organization ID for the user, can be changed by the user.'; 