-- Add inquiry_type column to leads table to track different types of inquiries
-- general = standard inquiry about property
-- inspection = request for independent inspector

ALTER TABLE leads ADD COLUMN inquiry_type TEXT DEFAULT 'general' CHECK (inquiry_type IN ('general', 'inspection'));

-- Create index for faster filtering by inquiry_type
CREATE INDEX IF NOT EXISTS idx_leads_inquiry_type ON leads(inquiry_type);
