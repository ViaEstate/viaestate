-- Add additional property fields for complete XML import
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS terrace TEXT,
ADD COLUMN IF NOT EXISTS ibi_fees TEXT,
ADD COLUMN IF NOT EXISTS community_fees TEXT,
ADD COLUMN IF NOT EXISTS basura_tax TEXT,
ADD COLUMN IF NOT EXISTS reference TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.properties.terrace IS 'Terrace area information';
COMMENT ON COLUMN public.properties.ibi_fees IS 'IBI (property tax) fees';
COMMENT ON COLUMN public.properties.community_fees IS 'Community fees';
COMMENT ON COLUMN public.properties.basura_tax IS 'Basura (waste) tax';
COMMENT ON COLUMN public.properties.reference IS 'Property reference number';