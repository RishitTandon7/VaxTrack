/*
  # Add INSERT policies for user registration

  1. Security Changes
    - Add INSERT policies for users table to allow authenticated users to create their own profile
    - Add INSERT policies for doctors table to allow doctors to create their own profile  
    - Add INSERT policies for patients table to allow patients to create their own profile

  This fixes the "Database error granting user" issue during signup by allowing
  newly authenticated users to insert their profile data into the respective tables.
*/

-- Allow authenticated users to insert their own user profile
CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow doctors to insert their own doctor profile
CREATE POLICY "Doctors can insert their own profile"
  ON doctors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow patients to insert their own patient profile
CREATE POLICY "Patients can insert their own profile"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);