-- Fix article_files table to allow null article_id for temporary files
-- This allows PDF uploads before article is saved

ALTER TABLE article_files ALTER COLUMN article_id DROP NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN article_files.article_id IS 'Article ID (null for temporary files before article is saved)';