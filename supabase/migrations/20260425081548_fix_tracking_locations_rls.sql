/*
  # Fix RLS policy on tracking_locations table

  1. Security Changes
    - Drop overly permissive `Anon can insert tracking locations` policy (WITH CHECK(true) bypasses RLS)
    - Replace with restrictive policy:
      - Anon can only insert tracking locations for tasks that exist
      - Anon cannot modify/read existing tracking data
      - Authenticated users can read tracking data for their assigned tasks
      - Authenticated users can insert tracking data for their assigned tasks

  2. Important Notes
    - The new WITH CHECK clause ensures the task_id actually exists
    - Anon users can contribute to tracking but cannot see or modify existing data
    - Only task-assigned users can view and manage their own tracking data
*/

DROP POLICY IF EXISTS "Anon can insert tracking locations" ON tracking_locations;

-- Anon can only insert if the task exists (prevents inserting for non-existent tasks)
CREATE POLICY "Anon can insert valid tracking locations"
  ON tracking_locations FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_id
    )
  );

-- Anon cannot select tracking data
CREATE POLICY "Authenticated users can view assigned task tracking"
  ON tracking_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = tracking_locations.task_id
      AND tasks.assigned_to = auth.uid()
    )
  );

-- Authenticated users can insert for their assigned tasks
CREATE POLICY "Authenticated users can track assigned tasks"
  ON tracking_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_id
      AND tasks.assigned_to = auth.uid()
    )
  );
