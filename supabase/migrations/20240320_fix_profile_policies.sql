-- Drop existing policies
DROP POLICY IF EXISTS "Enable users to read their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable users to insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable users to update their own profile" ON profiles;

-- Create new policies that allow profile creation during registration
CREATE POLICY "Enable users to read profiles"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable users to insert their own profile"
    ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable users to update their own profile"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id); 