/*
  # Create installers table

  1. New Tables
    - `installers` - stores installer/technician profiles
      - `id` (uuid, primary key)
      - `name` (text) - installer display name
      - `phone` (text) - installer phone number
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on installers table
    - Anon can read installers (needed for task assignment dropdown)
    - Authenticated users can read installers
    - Only authenticated users can insert/update/delete installers

  3. Notes
    - Separate from auth.users so admin can manage installers without auth accounts
    - tasks.assigned_to references installers.id instead of auth.users.id
*/

CREATE TABLE IF NOT EXISTS installers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE installers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read installers"
  ON installers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can read installers"
  ON installers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can manage installers"
  ON installers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update installers"
  ON installers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete installers"
  ON installers FOR DELETE
  TO authenticated
  USING (true);

-- Seed sample installers
INSERT INTO installers (name, phone) VALUES
  ('Иванов Алексей', '+7 (900) 111-22-33'),
  ('Петров Дмитрий', '+7 (900) 444-55-66'),
  ('Сидоров Сергей', '+7 (900) 777-88-99');
