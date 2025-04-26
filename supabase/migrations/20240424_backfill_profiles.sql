-- Backfill profiles for existing filmmakers
INSERT INTO public.profiles (id, email, role)
SELECT 
    au.id,
    au.email,
    'FILMMAKER' as role
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
AND au.email IN (
    SELECT DISTINCT filmmaker 
    FROM public.films
);

-- Create index on email for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update the handle_new_user function to properly handle email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(
            (SELECT role FROM public.profiles WHERE email = new.email LIMIT 1),
            'FILMMAKER'
        )
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 