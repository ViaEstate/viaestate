-- Add missing translation columns to properties table
-- This extends the existing translation support for properties

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS german_title TEXT,
ADD COLUMN IF NOT EXISTS german_description TEXT,
ADD COLUMN IF NOT EXISTS french_title TEXT,
ADD COLUMN IF NOT EXISTS french_description TEXT,
ADD COLUMN IF NOT EXISTS spanish_title TEXT,
ADD COLUMN IF NOT EXISTS spanish_description TEXT,
ADD COLUMN IF NOT EXISTS italian_title TEXT,
ADD COLUMN IF NOT EXISTS italian_description TEXT;

-- Add translation columns to articles table
-- Articles currently have no translation support

ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS swedish_title TEXT,
ADD COLUMN IF NOT EXISTS swedish_description TEXT,
ADD COLUMN IF NOT EXISTS german_title TEXT,
ADD COLUMN IF NOT EXISTS german_description TEXT,
ADD COLUMN IF NOT EXISTS french_title TEXT,
ADD COLUMN IF NOT EXISTS french_description TEXT,
ADD COLUMN IF NOT EXISTS finnish_title TEXT,
ADD COLUMN IF NOT EXISTS finnish_description TEXT,
ADD COLUMN IF NOT EXISTS danish_title TEXT,
ADD COLUMN IF NOT EXISTS danish_description TEXT,
ADD COLUMN IF NOT EXISTS norwegian_title TEXT,
ADD COLUMN IF NOT EXISTS norwegian_description TEXT,
ADD COLUMN IF NOT EXISTS italian_title TEXT,
ADD COLUMN IF NOT EXISTS italian_description TEXT,
ADD COLUMN IF NOT EXISTS spanish_title TEXT,
ADD COLUMN IF NOT EXISTS spanish_description TEXT,
ADD COLUMN IF NOT EXISTS croatian_title TEXT,
ADD COLUMN IF NOT EXISTS croatian_description TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_german_title ON properties(german_title) WHERE german_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_french_title ON properties(french_title) WHERE french_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_spanish_title ON properties(spanish_title) WHERE spanish_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_italian_title ON properties(italian_title) WHERE italian_title IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_articles_swedish_title ON articles(swedish_title) WHERE swedish_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_german_title ON articles(german_title) WHERE german_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_french_title ON articles(french_title) WHERE french_title IS NOT NULL;

COMMENT ON COLUMN properties.german_title IS 'German translation of property title';
COMMENT ON COLUMN properties.german_description IS 'German translation of property description';
COMMENT ON COLUMN properties.french_title IS 'French translation of property title';
COMMENT ON COLUMN properties.french_description IS 'French translation of property description';
COMMENT ON COLUMN properties.spanish_title IS 'Spanish translation of property title';
COMMENT ON COLUMN properties.spanish_description IS 'Spanish translation of property description';
COMMENT ON COLUMN properties.italian_title IS 'Italian translation of property title';
COMMENT ON COLUMN properties.italian_description IS 'Italian translation of property description';

COMMENT ON COLUMN articles.swedish_title IS 'Swedish translation of article title';
COMMENT ON COLUMN articles.swedish translation of article excerpt_description IS 'Swedish';
COMMENT ON COLUMN articles.german_title IS 'German translation of article title';
COMMENT ON COLUMN articles.german_description IS 'German translation of article excerpt';
