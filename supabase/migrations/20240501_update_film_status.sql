-- Create a function to update film status
CREATE OR REPLACE FUNCTION update_film_status(
  film_id UUID,
  new_status TEXT,
  admin_email TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_film JSONB;
BEGIN
  -- Update the film status
  UPDATE films
  SET 
    status = new_status,
    updated_at = NOW(),
    last_action = jsonb_build_object(
      'type', CASE WHEN new_status = 'approved' THEN 'approve' ELSE 'reject' END,
      'date', NOW(),
      'admin', admin_email
    )
  WHERE id = film_id
  RETURNING to_jsonb(films.*) INTO updated_film;

  -- Return the updated film
  RETURN updated_film;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_film_status TO authenticated;

-- Add RLS policy for the function
ALTER FUNCTION update_film_status(UUID, TEXT, TEXT) SET SEARCH_PATH = public; 