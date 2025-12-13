-- infrastructure/db/migrations/002_add_tenants_table.sql

-- Create the tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- Used for subdomain or path-based routing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    owner_id UUID NOT NULL, -- Reference to the user who owns the tenant

    -- Add any other tenant-specific configurations here, e.g.,
    -- theme VARCHAR(255) DEFAULT 'default',
    -- timezone VARCHAR(255) DEFAULT 'UTC'
    -- Add foreign key constraint to the users table (assuming a users table exists)
    -- FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Add an index on the slug column for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants (slug);

-- Optionally, add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();