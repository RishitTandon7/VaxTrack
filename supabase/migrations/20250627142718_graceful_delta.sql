/*
  # Fix User Creation RLS Policy

  1. Policy Updates
    - Update the INSERT policy for users table to handle signup process properly
    - Allow user creation during signup by checking the inserted ID matches the authenticated user
    - Maintain security while enabling successful user registration

  2. Security
    - Ensure users can only create profiles for themselves
    - Maintain existing security constraints
*/

-- Drop the existing INSERT policy for users
DROP POLICY IF EXISTS "Enable user profile creation" ON users;

-- Create a new INSERT policy that handles signup properly
CREATE POLICY "Enable user profile creation"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Allow service role to insert any user
    (auth.jwt() ->> 'role' = 'service_role') 
    OR 
    -- Allow authenticated users to create their own profile
    (auth.uid() = id)
    OR
    -- Allow during signup process when user is authenticated but profile doesn't exist yet
    (
      auth.uid() IS NOT NULL 
      AND id = auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()
      )
    )
  );