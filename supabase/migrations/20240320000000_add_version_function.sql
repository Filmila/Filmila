-- Create a function to increment version atomically
CREATE OR REPLACE FUNCTION increment_version()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  current_version integer;
BEGIN
  SELECT version INTO current_version FROM films WHERE id = NEW.id;
  RETURN COALESCE(current_version, 0) + 1;
END;
$$; 