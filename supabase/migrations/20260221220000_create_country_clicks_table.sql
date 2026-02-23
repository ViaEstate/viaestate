-- Create table to track country clicks on the map
CREATE TABLE IF NOT EXISTS country_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(255) NOT NULL,
  click_type VARCHAR(50) NOT NULL CHECK (click_type IN ('view', 'inquiry')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for querying
CREATE INDEX IF NOT EXISTS idx_country_clicks_country ON country_clicks(country);
CREATE INDEX IF NOT EXISTS idx_country_clicks_created_at ON country_clicks(created_at);

-- Enable RLS
ALTER TABLE country_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for tracking)
CREATE POLICY "Allow anyone to insert country clicks" 
ON country_clicks FOR INSERT 
TO authenticated, anon, service_role 
WITH CHECK (true);

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read country clicks" 
ON country_clicks FOR SELECT 
TO authenticated 
USING (true);

COMMENT ON TABLE country_clicks IS 'Tracks clicks on countries in the Europe map - used for business analytics';
COMMENT ON COLUMN country_clicks.country IS 'The country that was clicked';
COMMENT ON COLUMN country_clicks.click_type IS 'Type of click: view (has properties) or inquiry (no properties)';
