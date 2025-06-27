/*
  # Fix RLS policies for user signup

  1. Policy Updates
    - Update RLS policies for users table to allow signup flow
    - Update RLS policies for doctors and patients tables  
    - Ensure proper permissions during auth user creation

  2. Security
    - Maintain security while allowing proper signup flow
    - Ensure users can only access their own data
*/

-- First, let's update the RLS policies for the users table to handle signup properly
DROP POLICY IF EXISTS "Users can insert profiles during signup" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

CREATE POLICY "Enable insert during signup" ON users
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (
    -- Allow if the user ID matches the authenticated user ID
    -- or if this is during the signup process (auth.uid() might be null initially)
    auth.uid() = id OR 
    -- Allow service role for system operations
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update RLS policies for doctors table
DROP POLICY IF EXISTS "Doctors can insert own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can read own data" ON doctors;
DROP POLICY IF EXISTS "Doctors can update own data" ON doctors;

CREATE POLICY "Enable doctor profile creation" ON doctors
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    auth.uid() = id OR
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Doctors can read own data" ON doctors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Doctors can update own data" ON doctors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update RLS policies for patients table
DROP POLICY IF EXISTS "Patients can insert own profile" ON patients;
DROP POLICY IF EXISTS "Patients can read own data" ON patients;
DROP POLICY IF EXISTS "Patients can update own data" ON patients;
DROP POLICY IF EXISTS "Doctors can read their patients" ON patients;

CREATE POLICY "Enable patient profile creation" ON patients
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    auth.uid() = id OR
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Patients can read own data" ON patients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Patients can update own data" ON patients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Doctors can read their patients" ON patients
  FOR SELECT
  TO authenticated
  USING (doctor_id = auth.uid());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;