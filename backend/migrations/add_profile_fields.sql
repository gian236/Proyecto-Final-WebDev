-- Migration: Add profile picture and location to users table
-- Date: 2025-11-18

-- Add profile_picture_url column (stores URL or path to image)
ALTER TABLE users ADD COLUMN profile_picture_url TEXT;

-- Add location column
ALTER TABLE users ADD COLUMN location VARCHAR(200);

-- Add bio column if not exists (for profile description)
ALTER TABLE users ADD COLUMN bio TEXT;

-- Create index for faster location searches (optional but recommended)
CREATE INDEX idx_users_location ON users(location);

-- Comments for documentation
COMMENT ON COLUMN users.profile_picture_url IS 'URL or path to user profile picture';
COMMENT ON COLUMN users.location IS 'User location (city, state, country)';
COMMENT ON COLUMN users.bio IS 'User biography or description';
