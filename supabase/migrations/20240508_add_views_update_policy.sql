-- Add policy for updating film views
CREATE POLICY "Allow updating film views"
    ON films
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM film_payments
            WHERE film_payments.film_id = films.id
            AND film_payments.viewer_id = auth.uid()
            AND film_payments.status = 'completed'
        )
    )
    WITH CHECK (
        -- Only allow updating the views column
        OLD.* IS DISTINCT FROM NEW.* AND
        OLD.views IS DISTINCT FROM NEW.views AND
        -- Ensure all other columns remain unchanged
        OLD.id = NEW.id AND
        OLD.title = NEW.title AND
        OLD.description = NEW.description AND
        OLD.filmmaker = NEW.filmmaker AND
        OLD.status = NEW.status AND
        OLD.revenue = NEW.revenue AND
        OLD.upload_date = NEW.upload_date AND
        OLD.video_url = NEW.video_url AND
        OLD.thumbnail_url = NEW.thumbnail_url AND
        OLD.price = NEW.price AND
        OLD.genre = NEW.genre
    ); 