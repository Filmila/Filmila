-- Remove version column and related constraints
ALTER TABLE films
  DROP COLUMN IF EXISTS version;

-- Drop the increment_version function since we're not using it
DROP FUNCTION IF EXISTS increment_version(); 