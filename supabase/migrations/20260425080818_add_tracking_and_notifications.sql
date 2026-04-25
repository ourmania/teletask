/*
  # Add tracking and notification support

  1. New Tables
    - `tracking_locations` - Stores GPS coordinates for task tracking
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `latitude` (float)
      - `longitude` (float)
      - `accuracy` (float, in meters)
      - `timestamp` (timestamptz)
      - `created_at` (timestamptz)
    
    - `device_tokens` - Stores FCM device tokens per user
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `token` (text, unique)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Anon users can insert tracking locations for any task
    - Authenticated users can read their own tracking locations
    - Users can manage their own device tokens

  3. Indexes
    - Index on task_id for fast lookups
    - Index on user_id for device token lookups
*/

-- Create tracking_locations table
CREATE TABLE IF NOT EXISTS tracking_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  latitude float NOT NULL,
  longitude float NOT NULL,
  accuracy float DEFAULT 0,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create device_tokens table
CREATE TABLE IF NOT EXISTS device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS tracking_locations_task_id_idx ON tracking_locations(task_id);
CREATE INDEX IF NOT EXISTS tracking_locations_created_at_idx ON tracking_locations(created_at DESC);
CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx ON device_tokens(user_id);

-- Enable RLS
ALTER TABLE tracking_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Tracking locations RLS policies
CREATE POLICY "Anon can insert tracking locations"
  ON tracking_locations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read task tracking"
  ON tracking_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = tracking_locations.task_id
      AND tasks.assigned_to = auth.uid()
    )
  );

-- Device tokens RLS policies
CREATE POLICY "Users can insert own tokens"
  ON device_tokens FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own tokens"
  ON device_tokens FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tokens"
  ON device_tokens FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
