DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

CREATE POLICY "profiles_select_policy"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (true); 