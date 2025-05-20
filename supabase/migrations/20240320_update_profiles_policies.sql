-- Drop existing overlapping policies for profiles table
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow logged-in insert" ON profiles;
DROP POLICY IF EXISTS "Allow logged-in read access" ON profiles;
DROP POLICY IF EXISTS "Allow profile insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow viewers and filmmakers to read profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable profile insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable read access to own profile" ON profiles;
DROP POLICY IF EXISTS "Enable users to update their own data only" ON profiles;
DROP POLICY IF EXISTS "Enable users to view their own data only" ON profiles;
DROP POLICY IF EXISTS "Insert own profile" ON profiles;
DROP POLICY IF EXISTS "Read own profile" ON profiles;

-- Create new simplified policies
CREATE POLICY "Enable users to read their own profile" ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable users to insert their own profile" ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable users to update their own profile" ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id); 