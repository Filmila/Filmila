-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can update films" ON "public"."films";

-- Create the new policy with multiple role checks
CREATE POLICY "Admins can update films"
ON "public"."films"
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