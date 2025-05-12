-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT comment_length CHECK (char_length(comment) >= 1 AND char_length(comment) <= 1000)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS comments_film_id_idx ON comments(film_id);
CREATE INDEX IF NOT EXISTS comments_viewer_id_idx ON comments(viewer_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view comments"
    ON comments
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Viewers can create comments"
    ON comments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        viewer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'VIEWER'
        )
    );

CREATE POLICY "Users can delete their own comments"
    ON comments
    FOR DELETE
    TO authenticated
    USING (viewer_id = auth.uid());

-- Add comment
COMMENT ON TABLE comments IS 'Stores viewer comments on films'; 