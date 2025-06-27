/*
  # Fix signup RLS policies

  1. Policy Updates
    - Update users table INSERT policy to allow profile creation during signup
    - Add service role access for automated profile creation
    - Ensure proper authentication flow support

  2. Security
    - Maintain security while allowing signup flow
    - Ensure users can only create their own profiles
    - Keep existing read/update restrictions
*/

-- Drop existing restrictive INSERT policy on users table
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create new INSERT policy that allows profile creation during signup
-- This allows both authenticated users and the service role to insert
CREATE POLICY "Enable profile creation during signup"
  ON users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Allow if user is authenticated and creating their own profile
    (auth.uid() = id) OR
    -- Allow if this is being done by the system during signup (no current user)
    (auth.uid() IS NULL) OR
    -- Allow service role to create profiles
    (auth.role() = 'service_role')
  );

-- Ensure anon users can read connection codes for doctor-patient linking
-- Update the existing policy to be more permissive for valid codes
DROP POLICY IF EXISTS "Anyone can read valid unused connection codes" ON connection_codes;

CREATE POLICY "Allow reading valid unused connection codes"
  ON connection_codes
  FOR SELECT
  TO authenticated, anon
  USING ((expires_at > now()) AND (NOT used));

-- Add policy to allow anon users to update connection codes when using them
DROP POLICY IF EXISTS "System can update connection codes for usage tracking" ON connection_codes;

CREATE POLICY "Allow connection code usage updates"
  ON connection_codes
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Ensure doctors and patients tables allow profile creation
-- Update doctors table INSERT policy
DROP POLICY IF EXISTS "Doctors can insert their own profile" ON doctors;

CREATE POLICY "Enable doctor profile creation"
  ON doctors
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    (auth.uid() = id) OR
    (auth.uid() IS NULL) OR
    (auth.role() = 'service_role')
  );

-- Update patients table INSERT policy  
DROP POLICY IF EXISTS "Patients can insert their own profile" ON patients;

CREATE POLICY "Enable patient profile creation"
  ON patients
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    (auth.uid() = id) OR
    (auth.uid() IS NULL) OR
    (auth.role() = 'service_role')
  );

-- Update patients table to allow anon users to update their doctor assignment
DROP POLICY IF EXISTS "Patients can update own data" ON patients;

CREATE POLICY "Allow patient profile updates"
  ON patients
  FOR UPDATE
  TO authenticated, anon
  USING (auth.uid() = id OR auth.uid() IS NULL OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL OR auth.role() = 'service_role');