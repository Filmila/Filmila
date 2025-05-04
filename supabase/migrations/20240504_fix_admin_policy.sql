-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can update film status and details" ON films;

-- Create the correct policy
CREATE POLICY "Admins can update film status and details"
ON films
FOR UPDATE
TO public
USING (
  LOWER(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR LOWER(auth.jwt() ->> 'role') = 'admin'
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND LOWER(profiles.role) = 'admin'
  )
)
WITH CHECK (
  LOWER(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR LOWER(auth.jwt() ->> 'role') = 'admin'
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND LOWER(profiles.role) = 'admin'
  )
); 