-- Drop existing update policy
DROP POLICY IF EXISTS "Admins can update film status" ON films;

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