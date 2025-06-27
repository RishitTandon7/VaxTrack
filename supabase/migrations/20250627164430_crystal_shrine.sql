/*
  # Fix Users Table RLS Policies

  1. Policy Updates
    - Drop all existing policies on users table
    - Create new policies that allow proper signup flow
    - Ensure authenticated users can manage their own profiles

  2. Security
    - Maintain security by ensuring users can only access their own data
    - Allow proper INSERT/UPDATE/SELECT operations for authenticated users
*/

-- Drop ALL existing policies on users table to avoid conflicts
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Allow SELECT for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow reading user profiles during signup" ON users;
DROP POLICY IF EXISTS "Users can insert profiles during signup" ON users;
DROP POLICY IF EXISTS "Enable insert during signup" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON users;

-- Create new comprehensive policies for users table
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);