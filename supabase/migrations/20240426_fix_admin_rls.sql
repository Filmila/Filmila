-- Drop existing admin policy
DROP POLICY IF EXISTS "Enable admin access for admin users" ON films;

-- Create a more permissive admin policy with debug logging
CREATE POLICY "Enable admin access for admin users"
    ON films
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

-- Add debug logging function
CREATE OR REPLACE FUNCTION log_film_update()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (table_name, operation, user_id, old_data, new_data)
    VALUES (
        'films',
        TG_OP,
        auth.uid(),
        row_to_json(OLD),
        row_to_json(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add trigger for film updates
DROP TRIGGER IF EXISTS film_update_trigger ON films;
CREATE TRIGGER film_update_trigger
    AFTER UPDATE ON films
    FOR EACH ROW
    EXECUTE FUNCTION log_film_update();

-- Grant necessary permissions
GRANT ALL ON audit_logs TO authenticated;
GRANT USAGE ON SEQUENCE audit_logs_id_seq TO authenticated;

-- Ensure the admin role is properly set in profiles
UPDATE profiles
SET role = 'ADMIN'
WHERE email = 'gofilmila@gmail.com'
AND role IS NULL;

-- Add debug logging for RLS policy evaluation
CREATE OR REPLACE FUNCTION debug_rls_policy()
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    ) INTO is_admin;

    INSERT INTO audit_logs (table_name, operation, user_id, old_data, new_data)
    VALUES (
        'rls_debug',
        'policy_check',
        auth.uid(),
        jsonb_build_object('is_admin', is_admin),
        jsonb_build_object('auth_uid', auth.uid())
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for RLS policy debugging
DROP TRIGGER IF EXISTS rls_debug_trigger ON films;
CREATE TRIGGER rls_debug_trigger
    BEFORE UPDATE ON films
    FOR EACH ROW
    EXECUTE FUNCTION debug_rls_policy(); 