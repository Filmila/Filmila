-- Create a function to increment version atomically
CREATE OR REPLACE FUNCTION increment_version()
RETURNS integer
LANGUAGE sql
AS $$
  SELECT COALESCE(version, 0) + 1 FROM films WHERE id = NEW.id;
$$; 