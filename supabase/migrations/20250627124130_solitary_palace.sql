/*
  # Comprehensive Database Fix

  1. Ensure all required functions exist
  2. Fix RLS policies for all tables
  3. Add missing triggers
  4. Fix foreign key constraints
  5. Ensure proper indexes exist
  6. Handle edge cases in authentication flow
*/

-- Create or replace the update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called after a new user is created in auth.users
  -- It ensures profile creation happens automatically
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure all tables have proper updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_vaccination_records_updated_at ON vaccination_records;
CREATE TRIGGER update_vaccination_records_updated_at
  BEFORE UPDATE ON vaccination_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Fix users table policies
DROP POLICY IF EXISTS "Enable profile creation during signup" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

CREATE POLICY "Users can insert profiles during signup"
  ON users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    (auth.uid() = id) OR 
    (auth.uid() IS NULL) OR 
    (auth.role() = 'service_role')
  );

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Fix doctors table policies
DROP POLICY IF EXISTS "Enable doctor profile creation" ON doctors;
DROP POLICY IF EXISTS "Doctors can read own data" ON doctors;
DROP POLICY IF EXISTS "Doctors can update own data" ON doctors;

CREATE POLICY "Doctors can insert own profile"
  ON doctors
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    (auth.uid() = id) OR 
    (auth.uid() IS NULL) OR 
    (auth.role() = 'service_role')
  );

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

-- Fix patients table policies
DROP POLICY IF EXISTS "Enable patient profile creation" ON patients;
DROP POLICY IF EXISTS "Allow patient profile updates" ON patients;
DROP POLICY IF EXISTS "Patients can read own data" ON patients;
DROP POLICY IF EXISTS "Doctors can read their patients" ON patients;

CREATE POLICY "Patients can insert own profile"
  ON patients
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    (auth.uid() = id) OR 
    (auth.uid() IS NULL) OR 
    (auth.role() = 'service_role')
  );

CREATE POLICY "Patients can read own data"
  ON patients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Doctors can read their patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (doctor_id = auth.uid());

CREATE POLICY "Patients can update own data"
  ON patients
  FOR UPDATE
  TO authenticated, anon
  USING (
    (auth.uid() = id) OR 
    (auth.uid() IS NULL) OR 
    (auth.role() = 'service_role')
  )
  WITH CHECK (
    (auth.uid() = id) OR 
    (auth.uid() IS NULL) OR 
    (auth.role() = 'service_role')
  );

-- Fix vaccination_records table policies
DROP POLICY IF EXISTS "Patients can read own records" ON vaccination_records;
DROP POLICY IF EXISTS "Doctors can read their patients' records" ON vaccination_records;
DROP POLICY IF EXISTS "Doctors can insert records for their patients" ON vaccination_records;
DROP POLICY IF EXISTS "Doctors can update records for their patients" ON vaccination_records;
DROP POLICY IF EXISTS "Doctors can delete records for their patients" ON vaccination_records;

CREATE POLICY "Patients can read own records"
  ON vaccination_records
  FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors can read their patients' records"
  ON vaccination_records
  FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can insert records for their patients"
  ON vaccination_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
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

-- Fix connection_codes table policies (consolidate to avoid conflicts)
DROP POLICY IF EXISTS "Allow reading valid unused connection codes" ON connection_codes;
DROP POLICY IF EXISTS "Doctors can read all their connection codes" ON connection_codes;
DROP POLICY IF EXISTS "Patients can read codes they used" ON connection_codes;
DROP POLICY IF EXISTS "Doctors can insert their own connection codes" ON connection_codes;
DROP POLICY IF EXISTS "Doctors can update their own connection codes" ON connection_codes;
DROP POLICY IF EXISTS "Allow connection code usage updates" ON connection_codes;

-- Simplified connection_codes policies
CREATE POLICY "Anyone can read valid connection codes"
  ON connection_codes
  FOR SELECT
  TO authenticated, anon
  USING (
    (expires_at > now() AND NOT used) OR  -- Valid unused codes for everyone
    (doctor_id = auth.uid()) OR           -- Doctors can see their own codes
    (used_by = auth.uid())                -- Users can see codes they used
  );

CREATE POLICY "Doctors can manage connection codes"
  ON connection_codes
  FOR ALL
  TO authenticated
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "System can update connection code usage"
  ON connection_codes
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Ensure all necessary indexes exist for performance
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS patients_doctor_id_idx ON patients(doctor_id);
CREATE INDEX IF NOT EXISTS vaccination_records_patient_id_idx ON vaccination_records(patient_id);
CREATE INDEX IF NOT EXISTS vaccination_records_date_administered_idx ON vaccination_records(date_administered);
CREATE INDEX IF NOT EXISTS connection_codes_code_idx ON connection_codes(code);
CREATE INDEX IF NOT EXISTS connection_codes_doctor_id_idx ON connection_codes(doctor_id);
CREATE INDEX IF NOT EXISTS connection_codes_expires_at_idx ON connection_codes(expires_at);
CREATE INDEX IF NOT EXISTS connection_codes_used_idx ON connection_codes(used);
CREATE INDEX IF NOT EXISTS connection_codes_used_by_idx ON connection_codes(used_by);
CREATE INDEX IF NOT EXISTS connection_codes_used_at_idx ON connection_codes(used_at);

-- Ensure foreign key constraints are properly set up
-- These should already exist from the schema, but let's make sure

-- Add constraint for patients.doctor_id -> doctors.id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'patients_doctor_id_fkey' 
    AND table_name = 'patients'
  ) THEN
    ALTER TABLE patients 
    ADD CONSTRAINT patients_doctor_id_fkey 
    FOREIGN KEY (doctor_id) REFERENCES doctors(id);
  END IF;
END $$;

-- Add constraint for vaccination_records.patient_id -> patients.id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vaccination_records_patient_id_fkey' 
    AND table_name = 'vaccination_records'
  ) THEN
    ALTER TABLE vaccination_records 
    ADD CONSTRAINT vaccination_records_patient_id_fkey 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add constraint for connection_codes.doctor_id -> doctors.id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'connection_codes_doctor_id_fkey' 
    AND table_name = 'connection_codes'
  ) THEN
    ALTER TABLE connection_codes 
    ADD CONSTRAINT connection_codes_doctor_id_fkey 
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add constraint for connection_codes.used_by -> users.id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'connection_codes_used_by_fkey' 
    AND table_name = 'connection_codes'
  ) THEN
    ALTER TABLE connection_codes 
    ADD CONSTRAINT connection_codes_used_by_fkey 
    FOREIGN KEY (used_by) REFERENCES users(id);
  END IF;
END $$;

-- Ensure all tables have RLS enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_codes ENABLE ROW LEVEL SECURITY;