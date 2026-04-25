/*
  # Add task duration tracking

  1. New Columns
    - `in_progress_at` (timestamptz) - timestamp when status changed to 'in_progress'
    - `completed_at` (timestamptz) - timestamp when status changed to 'done'
    - `duration_minutes` (integer) - calculated duration in minutes from start to completion

  2. Changes
    - Added three new columns to tasks table for tracking work duration
    - When status changes to 'in_progress', set in_progress_at to current time
    - When status changes to 'done', set completed_at and calculate duration_minutes
    - Duration is null until task is completed
    - Can be used to track performance metrics

  3. Data Integrity
    - No existing data will be affected (null defaults)
    - New tasks will have null durations until completion
    - Duration calculated as: (completed_at - in_progress_at) / 60 seconds
*/

DO $$
BEGIN
  -- Add in_progress_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'in_progress_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN in_progress_at timestamptz;
  END IF;

  -- Add completed_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN completed_at timestamptz;
  END IF;

  -- Add duration_minutes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE tasks ADD COLUMN duration_minutes integer;
  END IF;
END $$;
