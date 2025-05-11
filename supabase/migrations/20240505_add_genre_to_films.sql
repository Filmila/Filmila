-- Add genre column to films table
ALTER TABLE films
    ADD COLUMN genre TEXT NOT NULL DEFAULT 'Drama'
    CHECK (genre IN ('Drama', 'Comedy', 'Action', 'Romance', 'Thriller', 'Documentary', 'Horror', 'Sci-Fi', 'Animation', 'Other'));

-- Add index for genre
CREATE INDEX IF NOT EXISTS films_genre_idx ON films(genre);

-- Add comment to genre column
COMMENT ON COLUMN films.genre IS 'The primary genre of the film'; 