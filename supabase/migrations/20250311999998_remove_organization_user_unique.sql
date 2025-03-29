-- Remove the unique constraint on user_id to allow a user to create multiple organizations
ALTER TABLE organizations
DROP CONSTRAINT IF EXISTS organizations_user_id_key;

-- Update the user_id column documentation
COMMENT ON COLUMN organizations.user_id IS 'The ID of the user who created the organization. Not unique since users can create multiple organizations'; 