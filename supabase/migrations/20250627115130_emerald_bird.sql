/*
  # Update connection codes table for better tracking

  1. Schema Changes
    - Add `used_at` column to track when code was used
    - Add `used_by` column to track which patient used the code
    - Update policies to allow reading used codes for tracking

  2. Security
    - Update RLS policies to allow doctors to see all their codes (used and unused)
    - Allow patients to read codes they've used for verification
*/

-- Add tracking columns to connection_codes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'connection_codes' AND column_name = 'used_at'
  ) THEN
    ALTER TABLE connection_codes ADD COLUMN used_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'connection_codes' AND column_name = 'used_by'
  ) THEN
    ALTER TABLE connection_codes ADD COLUMN used_by uuid REFERENCES users(id);
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read valid connection codes" ON connection_codes;
DROP POLICY IF EXISTS "Doctors can manage own connection codes" ON connection_codes;

-- Create updated policies for connection codes
CREATE POLICY "Anyone can read valid unused connection codes"
  ON connection_codes
  FOR SELECT
  TO authenticated
  USING (expires_at > now() AND NOT used);

CREATE POLICY "Doctors can read all their connection codes"
  ON connection_codes
  FOR SELECT
  TO authenticated
  USING (doctor_id = auth.uid());

CREATE POLICY "Patients can read codes they used"
  ON connection_codes
  FOR SELECT
  TO authenticated
  USING (used_by = auth.uid());

CREATE POLICY "Doctors can insert their own connection codes"
  ON connection_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can update their own connection codes"
  ON connection_codes
  FOR UPDATE
  TO authenticated
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "System can update connection codes for usage tracking"
  ON connection_codes
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create index for better performance on new columns
CREATE INDEX IF NOT EXISTS connection_codes_used_by_idx ON connection_codes(used_by);
CREATE INDEX IF NOT EXISTS connection_codes_used_at_idx ON connection_codes(used_at);