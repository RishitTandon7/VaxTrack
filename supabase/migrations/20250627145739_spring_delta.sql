/*
  # Fix Signup RLS Policy with Database Trigger

  1. Database Trigger Approach
    - Update handle_new_user function to automatically create basic user profile
    - Function runs with SECURITY DEFINER to bypass RLS
    - Creates initial profile when user is created in auth.users
    - Client application then updates this profile with specific details

  2. Security
    - Trigger runs with elevated privileges for initial profile creation only
    - All subsequent operations go through normal RLS policies
    - Maintains security while fixing signup flow
*/

-- Update the handle_new_user function to automatically create a basic user profile
-- This function runs with SECURITY DEFINER to bypass RLS for this specific operation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert a basic user profile that will be updated by the client application
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'), -- Use name from metadata if available
    'patient' -- Default to patient role, will be updated by client
  )
  ON CONFLICT (id) DO NOTHING; -- Prevents errors if the row somehow already exists
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger on auth.users is correctly set up to call handle_new_user
-- This trigger fires AFTER a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;

-- Update the RLS policies to work with the new trigger-based approach
-- Drop existing conflicting INSERT policies on users table
DROP POLICY IF EXISTS "Enable user profile creation" ON users;
DROP POLICY IF EXISTS "Enable insert during signup" ON users;
DROP POLICY IF EXISTS "Users can insert profiles during signup" ON users;

-- Since the trigger creates the initial profile, we now focus on UPDATE permissions
-- Users can UPDATE their own profile (which is what the signup process will do)
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can read their own data
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow SELECT during signup process (needed for the client to check if profile exists)
CREATE POLICY "Allow reading user profiles during signup"
  ON users
  FOR SELECT
  TO anon
  USING (true);

-- Keep INSERT policy minimal - only for service role operations
CREATE POLICY "Service role can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'service_role');

-- Update doctors table policies to work with the new approach
DROP POLICY IF EXISTS "Enable doctor profile creation" ON doctors;
CREATE POLICY "Doctors can insert own profile"
  ON doctors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update patients table policies to work with the new approach  
DROP POLICY IF EXISTS "Enable patient profile creation" ON patients;
CREATE POLICY "Patients can insert own profile"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions for the new flow
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT ON doctors TO authenticated;
GRANT SELECT, INSERT ON patients TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Allow anon users to read users table (needed for checking if profile exists during signup)
GRANT SELECT ON users TO anon;