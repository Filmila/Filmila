-- Drop existing update policy
DROP POLICY IF EXISTS "Admins can update film status" ON films;

-- Create new update policy with more specific conditions
CREATE POLICY "Admins can update film status and details"
ON films
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND LOWER(profiles.role) = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND LOWER(profiles.role) = 'admin'
  )
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