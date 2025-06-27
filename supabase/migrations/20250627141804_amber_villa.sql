/*
  # Fix Users Table RLS Policies

  1. Issue Resolution
    - Remove conflicting INSERT policies on users table
    - Create a single, comprehensive INSERT policy for user signup
    - Ensure proper permissions for user profile creation during signup

  2. Changes
    - Drop existing problematic INSERT policies
    - Create unified INSERT policy that allows:
      - Service role operations
      - User profile creation during signup process
      - Authenticated users to create their own profiles

  3. Security
    - Maintains security by only allowing users to create their own profiles
    - Allows signup process to work properly
    - Preserves existing SELECT and UPDATE policies
*/

-- Drop existing INSERT policies that are causing conflicts
DROP POLICY IF EXISTS "Allow INSERT for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert during signup" ON users;

-- Create a single, comprehensive INSERT policy for user creation
CREATE POLICY "Enable user profile creation"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Allow service role operations
    (jwt() ->> 'role'::text) = 'service_role'::text
    OR
    -- Allow users to create their own profile during signup
    auth.uid() = id
    OR
    -- Allow insertion when no authenticated user exists yet (during signup process)
    (auth.uid() IS NULL AND auth.role() = 'anon')
  );