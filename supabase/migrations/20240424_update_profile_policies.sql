-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable profile insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON profiles;

-- Create the insert policy with the correct name and permissions
CREATE POLICY "Enable insert for users based on user_id"
    ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK ((auth.uid() = id));

-- Ensure other necessary policies exist
CREATE POLICY IF NOT EXISTS "Enable users to view their own data only"
    ON profiles
    FOR SELECT
    TO authenticated
    USING ((auth.uid() = id));

CREATE POLICY IF NOT EXISTS "Enable users to update their own data only"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING ((auth.uid() = id))
    WITH CHECK ((auth.uid() = id)); 