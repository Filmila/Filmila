-- Create film_payments table
CREATE TABLE IF NOT EXISTS film_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(film_id, viewer_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS film_payments_film_id_idx ON film_payments(film_id);
CREATE INDEX IF NOT EXISTS film_payments_viewer_id_idx ON film_payments(viewer_id);
CREATE INDEX IF NOT EXISTS film_payments_status_idx ON film_payments(status);

-- Enable RLS
ALTER TABLE film_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Viewers can view their own payments"
    ON film_payments
    FOR SELECT
    TO authenticated
    USING (viewer_id = auth.uid());

CREATE POLICY "Filmmakers can view payments for their films"
    ON film_payments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM films
            WHERE films.id = film_payments.film_id
            AND films.filmmaker = auth.jwt()->>'email'
        )
    );

-- Add comment
COMMENT ON TABLE film_payments IS 'Tracks payments made by viewers to access films'; 