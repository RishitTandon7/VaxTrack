/*
  # Fix Users Table RLS Policies for Signup

  1. Problem
    - Multiple conflicting INSERT policies on users table
    - RLS violations during user signup process

  2. Solution
    - Remove all conflicting INSERT policies
    - Create single comprehensive policy for user creation
    - Handle signup flow properly with correct auth functions

  3. Security
    - Maintain security while allowing proper signup
    - Users can only create their own profiles
    - Service role can perform system operations
*/

-- Drop existing INSERT policies that are causing conflicts
DROP POLICY IF EXISTS "Allow INSERT for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert during signup" ON users;
DROP POLICY IF EXISTS "Users can insert profiles during signup" ON users;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON users;

-- Create a single, comprehensive INSERT policy for user creation
CREATE POLICY "Enable user profile creation"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Allow service role operations
    (auth.jwt() ->> 'role'::text) = 'service_role'::text
    OR
    -- Allow users to create their own profile during signup
    auth.uid() = id
  );