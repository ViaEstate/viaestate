-- Clean up existing Croatia properties for re-import with image download
-- This removes all properties imported from XML feeds so they can be re-imported with proper images

-- Delete all properties that have xml_object_id (imported from XML)
DELETE FROM properties WHERE xml_object_id IS NOT NULL;

-- Alternative: Delete only Croatia properties
-- DELETE FROM properties WHERE country = 'Croatia';

-- Reset any sequences if needed (optional)
-- SELECT setval('properties_id_seq', (SELECT COALESCE(MAX(id), 1) FROM properties));

-- Note: This will also delete any associated leads, but since these are imported properties,
-- they shouldn't have real leads yet.