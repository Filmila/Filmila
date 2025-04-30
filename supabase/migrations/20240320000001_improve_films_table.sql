-- Add constraints and defaults to films table
ALTER TABLE films
  -- Make id auto-incrementing
  ALTER COLUMN id SET DEFAULT nextval('films_id_seq'),
  
  -- Add NOT NULL constraints
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN filmmaker SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN upload_date SET NOT NULL,
  ALTER COLUMN video_url SET NOT NULL,
  
  -- Add default values
  ALTER COLUMN views SET DEFAULT 0,
  ALTER COLUMN revenue SET DEFAULT 0,
  ALTER COLUMN price SET DEFAULT 0,
  ALTER COLUMN version SET DEFAULT 1,
  
  -- Add check constraints
  ADD CONSTRAINT films_status_check CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD CONSTRAINT films_price_check CHECK (price >= 0),
  ADD CONSTRAINT films_views_check CHECK (views >= 0),
  ADD CONSTRAINT films_revenue_check CHECK (revenue >= 0),
  ADD CONSTRAINT films_version_check CHECK (version >= 1);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS films_status_idx ON films(status);
CREATE INDEX IF NOT EXISTS films_filmmaker_idx ON films(filmmaker);
CREATE INDEX IF NOT EXISTS films_upload_date_idx ON films(upload_date);

-- Add comment to table
COMMENT ON TABLE films IS 'Stores information about uploaded films including their status, metadata, and statistics'; 