-- SQL to remove ALL Bild1.png images from ALL properties
-- Run this in your Supabase SQL Editor

-- First, let's see how many properties have Bild1.png:
SELECT 
  id, 
  title,
  (SELECT unnest(images) FROM properties p WHERE p.id = properties.id LIMIT 1) as first_image
FROM properties 
WHERE images::text LIKE '%Bild1.png%';

-- Count how many properties will be affected:
SELECT COUNT(*) as properties_with_bild1 FROM properties 
WHERE images::text LIKE '%Bild1.png%';

-- ============================================
-- Remove ALL Bild1.png images from ALL properties
-- ============================================

-- This removes ALL occurrences of Bild1.png from all properties
UPDATE properties
SET images = array(
  SELECT img 
  FROM unnest(images) AS img 
  WHERE img NOT LIKE '%Bild1.png%'
)
WHERE images::text LIKE '%Bild1.png%';

-- Verify the result - should show 0 rows:
SELECT COUNT(*) as properties_still_with_bild1 FROM properties 
WHERE images::text LIKE '%Bild1.png%';
