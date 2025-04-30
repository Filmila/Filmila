-- Create a function to increment version atomically
CREATE OR REPLACE FUNCTION increment_version()
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN COALESCE(version, 0) + 1;
END;
$$; 