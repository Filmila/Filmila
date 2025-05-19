-- Create film_ratings table
CREATE TABLE IF NOT EXISTS film_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(film_id, user_id)
);

-- Enable RLS
ALTER TABLE film_ratings ENABLE ROW LEVEL SECURITY;

-- Policy for reading ratings
CREATE POLICY "Enable read access for all authenticated users"
    ON film_ratings FOR SELECT
    TO authenticated
    USING (true);

-- Policy for users to manage their own ratings
CREATE POLICY "Enable users to manage their own ratings"
    ON film_ratings
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Add average_rating column to films table
ALTER TABLE films
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0;

-- Create function to update average rating
CREATE OR REPLACE FUNCTION update_film_average_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE films
    SET average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM film_ratings
        WHERE film_id = NEW.film_id
    )
    WHERE id = NEW.film_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update average rating
CREATE TRIGGER update_film_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON film_ratings
FOR EACH ROW
EXECUTE FUNCTION update_film_average_rating(); 