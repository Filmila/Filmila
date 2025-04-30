-- Add version column to films table
ALTER TABLE films
    ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Backfill version for existing rows
UPDATE films SET version = 1 WHERE version IS NULL;

-- Make version column NOT NULL
ALTER TABLE films
    ALTER COLUMN version SET NOT NULL; 