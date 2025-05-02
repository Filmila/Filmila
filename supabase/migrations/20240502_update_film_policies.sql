-- Drop existing update policy
DROP POLICY IF EXISTS "Admins can update film status" ON films;
DROP POLICY IF EXISTS "Admins can update film status and details" ON films;
DROP POLICY IF EXISTS "Filmmakers can update their own films" ON films;

-- Create new update policy with more specific conditions
CREATE POLICY "Admins can update film status and details"
ON films
FOR UPDATE
TO public
USING (
  LOWER(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  LOWER(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Add policy for filmmakers to update their own films
CREATE POLICY "Filmmakers can update their own films"
ON films
FOR UPDATE
TO public
USING (
  filmmaker = auth.email()
  AND status = 'pending'
)
WITH CHECK (
  filmmaker = auth.email()
  AND status = 'pending'
);

-- Remove version column if it exists
ALTER TABLE films
DROP COLUMN IF EXISTS version;

-- Drop version-related triggers and functions
DROP TRIGGER IF EXISTS film_version_trigger ON films;
DROP FUNCTION IF EXISTS handle_film_update(); 