/*
  # Initial VacciTracker Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `role` (text) - 'doctor' or 'patient'
      - `phone` (text, optional)
      - `profile_image` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `doctors`
      - `id` (uuid, primary key, references users)
      - `license` (text)
      - `specialization` (text)
      - `clinic` (text)
    
    - `patients`
      - `id` (uuid, primary key, references users)
      - `date_of_birth` (date)
      - `parent_name` (text)
      - `parent_phone` (text)
      - `doctor_id` (uuid, references doctors)
    
    - `vaccination_records`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `vaccine_name` (text)
      - `date_administered` (date)
      - `next_due_date` (date, optional)
      - `batch_number` (text, optional)
      - `administered_by` (text)
      - `notes` (text, optional)
      - `card_image` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `connection_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `doctor_id` (uuid, references doctors)
      - `expires_at` (timestamp)
      - `used` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Doctors can manage their patients and records
    - Patients can view their own records
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('doctor', 'patient')),
  phone text,
  profile_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  license text NOT NULL,
  specialization text NOT NULL,
  clinic text NOT NULL
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth date NOT NULL,
  parent_name text NOT NULL,
  parent_phone text NOT NULL,
  doctor_id uuid REFERENCES doctors(id)
);

-- Create vaccination_records table
CREATE TABLE IF NOT EXISTS vaccination_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  vaccine_name text NOT NULL,
  date_administered date NOT NULL,
  next_due_date date,
  batch_number text,
  administered_by text NOT NULL,
  notes text,
  card_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create connection_codes table
CREATE TABLE IF NOT EXISTS connection_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_codes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Doctors policies
CREATE POLICY "Doctors can read own data"
  ON doctors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Doctors can update own data"
  ON doctors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Patients policies
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
  TO authenticated
  USING (auth.uid() = id);

-- Vaccination records policies
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

-- Connection codes policies
CREATE POLICY "Doctors can manage own connection codes"
  ON connection_codes
  FOR ALL
  TO authenticated
  USING (doctor_id = auth.uid());

CREATE POLICY "Anyone can read valid connection codes"
  ON connection_codes
  FOR SELECT
  TO authenticated
  USING (expires_at > now() AND NOT used);

-- Insert sample data
INSERT INTO users (id, email, name, role, phone) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'sarah.johnson@hospital.com', 'Dr. Sarah Johnson', 'doctor', '+1-555-0101'),
  ('550e8400-e29b-41d4-a716-446655440001', 'parent@example.com', 'Emma Thompson', 'patient', '+1-555-0201')
ON CONFLICT (email) DO NOTHING;

INSERT INTO doctors (id, license, specialization, clinic) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'MD-12345', 'Pediatrics', 'Children''s Health Center')
ON CONFLICT (id) DO NOTHING;

INSERT INTO patients (id, date_of_birth, parent_name, parent_phone, doctor_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '2020-05-15', 'John Thompson', '+1-555-0201', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vaccination_records (patient_id, vaccine_name, date_administered, administered_by, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'BCG', '2020-05-16', 'Dr. Sarah Johnson', 'Given at birth, no adverse reactions'),
  ('550e8400-e29b-41d4-a716-446655440001', 'DPT', '2020-07-15', 'Dr. Sarah Johnson', 'First dose completed successfully')
ON CONFLICT DO NOTHING;