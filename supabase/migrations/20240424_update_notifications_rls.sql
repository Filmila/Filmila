-- Drop existing insert policy
DROP POLICY IF EXISTS "Only authenticated users can create notifications" ON notifications;

-- Create new insert policy that allows authenticated users to create notifications
CREATE POLICY "Allow authenticated users to create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for service role
CREATE POLICY "Allow service role to manage notifications"
  ON notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true); 