/*
  # Fix connection codes table and policies

  1. Ensure connection_codes table exists with proper structure
  2. Add proper RLS policies for connection codes
  3. Fix any missing constraints or indexes
*/

-- Ensure the connection_codes table exists with proper structure
CREATE TABLE IF NOT EXISTS connection_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE connection_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read valid connection codes" ON connection_codes;
DROP POLICY IF EXISTS "Doctors can manage own connection codes" ON connection_codes;

-- Create policies for connection codes
CREATE POLICY "Anyone can read valid connection codes"
  ON connection_codes
  FOR SELECT
  TO authenticated
  USING (expires_at > now() AND NOT used);

CREATE POLICY "Doctors can manage own connection codes"
  ON connection_codes
  FOR ALL
  TO authenticated
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS connection_codes_code_idx ON connection_codes(code);
CREATE INDEX IF NOT EXISTS connection_codes_doctor_id_idx ON connection_codes(doctor_id);
CREATE INDEX IF NOT EXISTS connection_codes_expires_at_idx ON connection_codes(expires_at);