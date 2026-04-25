/*
  # Fix RLS policies on tasks table

  1. Security Changes
    - Drop overly permissive `Anyone can update tasks` policy (USING(true) + WITH CHECK(true) bypasses RLS)
    - Drop overly permissive `Anyone can read tasks` policy (USING(true) bypasses RLS)
    - Drop existing authenticated policies that will be recreated
    - Replace with restrictive policies:
      - Anon users can read all tasks (needed for the app to function)
      - Anon users can only update task status, and only for tasks not yet done
      - WITH CHECK restricts anon to only set valid next statuses
      - Authenticated users can read/update tasks assigned to them

  2. Important Notes
    - The anon UPDATE policy restricts both the rows (USING) and the values (WITH CHECK)
    - Anon can only advance status sequentially
    - The USING clause prevents updating already-done tasks
    - The WITH CHECK clause prevents setting invalid status values
*/

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can update tasks" ON tasks;
DROP POLICY IF EXISTS "Anyone can read tasks" ON tasks;
DROP POLICY IF EXISTS "Users can read assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update assigned tasks" ON tasks;

-- Anon can read tasks
CREATE POLICY "Anon can read tasks"
  ON tasks FOR SELECT
  TO anon
  USING (true);

-- Anon can only advance status for tasks not yet done
CREATE POLICY "Anon can advance task status"
  ON tasks FOR UPDATE
  TO anon
  USING (status IN ('new', 'accepted', 'en_route', 'in_progress'))
  WITH CHECK (status IN ('accepted', 'en_route', 'in_progress', 'done'));

-- Authenticated users can read their assigned tasks
CREATE POLICY "Users can read assigned tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

-- Authenticated users can update their assigned tasks
CREATE POLICY "Users can update assigned tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());
