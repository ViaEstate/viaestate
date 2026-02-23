-- Add additional property detail fields to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS plot_area INTEGER,
ADD COLUMN IF NOT EXISTS distance_to_city INTEGER,
ADD COLUMN IF NOT EXISTS distance_to_sea INTEGER,
ADD COLUMN IF NOT EXISTS distance_to_lake INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN public.properties.plot_area IS 'Plot area of the property in square meters';
COMMENT ON COLUMN public.properties.distance_to_city IS 'Distance to nearest city center in meters';
COMMENT ON COLUMN public.properties.distance_to_sea IS 'Distance to nearest sea in meters';
COMMENT ON COLUMN public.properties.distance_to_lake IS 'Distance to nearest lake in meters';