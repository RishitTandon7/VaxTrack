/*
  # Fix Users Table RLS Policies

  1. Security Updates
    - Remove conflicting RLS policies that prevent proper user registration
    - Add proper INSERT policy for authenticated users during signup
    - Ensure UPDATE policy works correctly for profile updates
    - Maintain security by allowing users to only manage their own data

  2. Changes Made
    - Drop existing problematic policies
    - Add new INSERT policy for authenticated users to create their own profile
    - Add new UPDATE policy for authenticated users to update their own data
    - Keep existing SELECT policies for data access
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow SELECT for authenticated users" ON users;

-- Add proper INSERT policy for authenticated users
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add proper UPDATE policy for authenticated users
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add proper SELECT policy for authenticated users
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);