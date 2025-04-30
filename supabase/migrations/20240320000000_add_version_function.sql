-- Create a function to increment version atomically
CREATE OR REPLACE FUNCTION increment_version(current_version integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN COALESCE(current_version, 0) + 1;
END;
$$; 