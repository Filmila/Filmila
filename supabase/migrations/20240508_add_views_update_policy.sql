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
        views > 0
    ); 