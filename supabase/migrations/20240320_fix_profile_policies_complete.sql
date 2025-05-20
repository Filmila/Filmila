-- First, ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable users to read their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable users to insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Enable users to view their own data only" ON profiles;
DROP POLICY IF EXISTS "Enable users to update their own data only" ON profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable profile insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow logged-in insert" ON profiles;
DROP POLICY IF EXISTS "Allow logged-in read access" ON profiles;
DROP POLICY IF EXISTS "Allow profile insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow viewers and filmmakers to read profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access to own profile" ON profiles;
DROP POLICY IF EXISTS "Insert own profile" ON profiles;
DROP POLICY IF EXISTS "Read own profile" ON profiles;

-- Create new policies
-- Allow all authenticated users to read profiles (needed for registration)
CREATE POLICY "profiles_select_policy"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow users to insert their own profile
CREATE POLICY "profiles_insert_policy"
    ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_policy"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Ensure the trigger for new user creation is working
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get the role from user metadata, default to 'VIEWER' if not set
    user_role := COALESCE(
        (new.raw_user_meta_data->>'role')::TEXT,
        'VIEWER'
    );
    
    -- Ensure the role is either 'FILMMAKER' or 'VIEWER'
    IF user_role NOT IN ('FILMMAKER', 'VIEWER') THEN
        user_role := 'VIEWER';
    END IF;

    INSERT INTO public.profiles (id, email, role)
    VALUES (new.id, new.email, user_role)
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 