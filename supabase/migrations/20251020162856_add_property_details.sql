-- Add missing property detail fields to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS area INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS property_type_detail TEXT,
ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'sale' CHECK (listing_type IN ('sale', 'rent'));

-- Add comments for documentation
COMMENT ON COLUMN public.properties.bedrooms IS 'Number of bedrooms in the property';
COMMENT ON COLUMN public.properties.bathrooms IS 'Number of bathrooms in the property';
COMMENT ON COLUMN public.properties.area IS 'Area of the property in square feet';
COMMENT ON COLUMN public.properties.property_type_detail IS 'Detailed property type (apartment, villa, house, etc.)';
COMMENT ON COLUMN public.properties.listing_type IS 'Whether the property is for sale or rent';