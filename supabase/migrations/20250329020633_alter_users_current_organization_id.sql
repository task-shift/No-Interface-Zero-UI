-- Alter the organization_id column to use JSONB instead of UUID
ALTER TABLE users
ADD COLUMN current_organization_id UUID;