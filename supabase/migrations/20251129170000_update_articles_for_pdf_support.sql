-- Update Articles Table for PDF Support
-- This migration adds PDF support to the articles system

-- Make excerpt optional (not required for PDF articles)
ALTER TABLE articles ALTER COLUMN excerpt DROP NOT NULL;

-- Add pdf_url column for PDF articles
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add pdf_title column for PDF articles (optional title for PDF files)
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS pdf_title TEXT;

-- Add pdf_file_size column for PDF metadata
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS pdf_file_size BIGINT;

-- Create storage bucket for article PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('article-pdfs', 'article-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for article-pdfs
CREATE POLICY "Anyone can view article PDFs" ON storage.objects
  FOR SELECT USING (bucket_id = 'article-pdfs');

CREATE POLICY "Authenticated users can upload article PDFs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'article-pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own article PDF uploads" ON storage.objects
  FOR UPDATE USING (bucket_id = 'article-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own article PDF uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'article-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update the fulltext search function to include PDF titles
CREATE OR REPLACE FUNCTION update_article_tsv()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tsv = setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C') ||
            setweight(to_tsvector('english', COALESCE(NEW.pdf_title, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update existing articles to have the new tsv values
UPDATE articles SET updated_at = NOW() WHERE id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.articles.pdf_url IS 'URL to PDF file in storage (for PDF articles)';
COMMENT ON COLUMN public.articles.pdf_title IS 'Title of the PDF document (optional)';
COMMENT ON COLUMN public.articles.pdf_file_size IS 'File size of the PDF in bytes';