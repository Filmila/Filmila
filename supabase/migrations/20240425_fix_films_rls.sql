-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON films;
DROP POLICY IF EXISTS "Enable write access for filmmakers" ON films;
DROP POLICY IF EXISTS "Enable admin access for admin users" ON films;

-- Enable RLS on films table if not already enabled
ALTER TABLE films ENABLE ROW LEVEL SECURITY;

-- Policy for reading films
CREATE POLICY "Enable read access for authenticated users"
    ON films FOR SELECT
    TO authenticated
    USING (true);

-- Policy for filmmakers to manage their own films
CREATE POLICY "Enable write access for filmmakers"
    ON films
    FOR ALL
    TO authenticated
    USING (filmmaker = auth.jwt()->>'email')
    WITH CHECK (filmmaker = auth.jwt()->>'email');

-- Policy for admin users to manage all films
CREATE POLICY "Enable admin access for admin users"
    ON films
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Ensure the status column has a default value and check constraint
ALTER TABLE films 
    ALTER COLUMN status SET DEFAULT 'pending',
    ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')); 