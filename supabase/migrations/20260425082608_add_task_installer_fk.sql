/*
  # Add foreign key from tasks.assigned_to to installers

  1. Changes
    - Add foreign key constraint: tasks.assigned_to → installers.id
    - This allows the admin panel to assign tasks to specific installers

  2. Notes
    - assigned_to remains nullable (tasks can be unassigned)
    - ON DELETE SET NULL preserves tasks if an installer is removed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'tasks' AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'tasks_assigned_to_fkey'
  ) THEN
    ALTER TABLE tasks
    ADD CONSTRAINT tasks_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES installers(id)
    ON DELETE SET NULL;
  END IF;
END $$;
