/*
  # Fix User Signup RLS Policy

  1. Policy Updates
    - Drop conflicting INSERT policies on users table
    - Create simplified INSERT policy for user profile creation
    - Ensure proper signup flow support

  2. Security
    - Allow users to create their own profiles during signup
    - Maintain service role access for administrative operations
    - Keep existing read/update restrictions intact
*/

-- Drop any existing INSERT policies on users table to avoid conflicts
DROP POLICY IF EXISTS "Enable user profile creation" ON users;
DROP POLICY IF EXISTS "Enable insert during signup" ON users;
DROP POLICY IF EXISTS "Users can insert profiles during signup" ON users;
DROP POLICY IF EXISTS "Allow INSERT for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON users;

-- Create a simplified and robust INSERT policy for user profile creation
CREATE POLICY "Enable user profile creation"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Allow users to create their own profile (auth.uid() = id)
    (auth.uid() = id) 
    OR 
    -- Allow service role for administrative operations
    (auth.role() = 'service_role')
  );

-- Ensure doctors and patients tables have compatible INSERT policies
DROP POLICY IF EXISTS "Enable doctor profile creation" ON doctors;
CREATE POLICY "Enable doctor profile creation"
  ON doctors
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() = id) OR (auth.role() = 'service_role')
  );

DROP POLICY IF EXISTS "Enable patient profile creation" ON patients;
CREATE POLICY "Enable patient profile creation"
  ON patients
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() = id) OR (auth.role() = 'service_role')
  );

-- Grant necessary permissions for the signup flow
GRANT SELECT, INSERT ON users TO anon, authenticated;
GRANT SELECT, INSERT ON doctors TO anon, authenticated;
GRANT SELECT, INSERT ON patients TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;