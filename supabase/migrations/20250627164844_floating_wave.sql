/*
  # Fix Row Level Security Policies

  1. Security Updates
    - Update all RLS policies to use auth.uid() instead of uid()
    - Ensure proper permissions for users, doctors, and patients tables
    - Fix authentication and authorization issues

  2. Changes
    - Drop existing policies that use uid()
    - Create new policies using auth.uid()
    - Maintain same security model but with correct function calls
*/

-- Drop existing policies for users table
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new policies for users table using auth.uid()
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Drop existing policies for doctors table
DROP POLICY IF EXISTS "Doctors can insert own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can read own data" ON doctors;
DROP POLICY IF EXISTS "Doctors can update own data" ON doctors;

-- Create new policies for doctors table using auth.uid()
CREATE POLICY "Doctors can insert own profile"
  ON doctors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Doctors can read own data"
  ON doctors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Doctors can update own data"
  ON doctors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Drop existing policies for patients table
DROP POLICY IF EXISTS "Patients can insert own profile" ON patients;
DROP POLICY IF EXISTS "Patients can read own data" ON patients;
DROP POLICY IF EXISTS "Patients can update own data" ON patients;
DROP POLICY IF EXISTS "Doctors can read their patients" ON patients;

-- Create new policies for patients table using auth.uid()
CREATE POLICY "Patients can insert own profile"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Patients can read own data"
  ON patients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Patients can update own data"
  ON patients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Doctors can read their patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (doctor_id = auth.uid());

-- Update connection_codes policies to use auth.uid()
DROP POLICY IF EXISTS "Doctors can manage connection codes" ON connection_codes;
DROP POLICY IF EXISTS "System can update connection code usage" ON connection_codes;
DROP POLICY IF EXISTS "Anyone can read valid connection codes" ON connection_codes;

CREATE POLICY "Doctors can manage connection codes"
  ON connection_codes
  FOR ALL
  TO authenticated
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "System can update connection code usage"
  ON connection_codes
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can read valid connection codes"
  ON connection_codes
  FOR SELECT
  TO anon, authenticated
  USING (
    (expires_at > now() AND NOT used) OR 
    (doctor_id = auth.uid()) OR 
    (used_by = auth.uid())
  );

-- Update vaccination_records policies to use auth.uid()
DROP POLICY IF EXISTS "Doctors can insert records for their patients" ON vaccination_records;
DROP POLICY IF EXISTS "Doctors can read their patients' records" ON vaccination_records;
DROP POLICY IF EXISTS "Doctors can update records for their patients" ON vaccination_records;
DROP POLICY IF EXISTS "Doctors can delete records for their patients" ON vaccination_records;
DROP POLICY IF EXISTS "Patients can read own records" ON vaccination_records;

CREATE POLICY "Doctors can insert records for their patients"
  ON vaccination_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can read their patients' records"
  ON vaccination_records
  FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update records for their patients"
  ON vaccination_records
  FOR UPDATE
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = auth.uid()
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can delete records for their patients"
  ON vaccination_records
  FOR DELETE
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = auth.uid()
    )
  );

CREATE POLICY "Patients can read own records"
  ON vaccination_records
  FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());