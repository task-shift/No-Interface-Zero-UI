-- Alter the organization_id column to use JSONB instead of UUID
ALTER TABLE users
ALTER COLUMN organization_id TYPE JSONB USING jsonb_build_array(organization_id);

-- Update any existing users to convert single organization_id values to arrays
UPDATE users
SET organization_id = jsonb_build_array(organization_id)
WHERE organization_id IS NOT NULL AND jsonb_typeof(organization_id) != 'array';

-- Add comment to the column
COMMENT ON COLUMN users.organization_id IS 'JSONB array containing the organization IDs the user belongs to'; 