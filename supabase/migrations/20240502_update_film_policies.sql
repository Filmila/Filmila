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

-- Add version column if it doesn't exist
ALTER TABLE films
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create a function to handle version updates
CREATE OR REPLACE FUNCTION handle_film_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment version
  NEW.version = OLD.version + 1;
  -- Set updated_at timestamp
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for version updates
DROP TRIGGER IF EXISTS film_version_trigger ON films;
CREATE TRIGGER film_version_trigger
  BEFORE UPDATE ON films
  FOR EACH ROW
  EXECUTE FUNCTION handle_film_update(); 