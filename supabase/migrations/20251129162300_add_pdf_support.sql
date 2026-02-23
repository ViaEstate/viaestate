-- Add PDF Support Migration
-- This migration adds complete PDF file management for articles

-- Create article_files table for PDF metadata
CREATE TABLE article_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  content_type TEXT NOT NULL CHECK (content_type = 'application/pdf'),
  file_size_bytes INTEGER NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  is_primary BOOLEAN DEFAULT false,
  pdf_text TEXT -- Optional: extracted text for search
);

-- Create indexes for performance
CREATE INDEX idx_article_files_article_id ON article_files(article_id);
CREATE INDEX idx_article_files_uploaded_by ON article_files(uploaded_by);
CREATE INDEX idx_article_files_is_primary ON article_files(is_primary);

-- Enable RLS on article_files
ALTER TABLE article_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for article_files
-- Select: Everyone can read file metadata (for displaying file lists)
CREATE POLICY "Article files are viewable by everyone" ON article_files
  FOR SELECT USING (true);

-- Insert: Only admins can upload files
CREATE POLICY "Admins can upload article files" ON article_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Update: Only admins can update file metadata
CREATE POLICY "Admins can update article files" ON article_files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Delete: Only admins can delete files
CREATE POLICY "Admins can delete article files" ON article_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create storage bucket for article files (PDFs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-files', 'article-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for article-files (private bucket)
CREATE POLICY "Authenticated users can view article files" ON storage.objects
  FOR SELECT USING (bucket_id = 'article-files' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can upload article files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'article-files' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update their article file uploads" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'article-files' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete their article file uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'article-files' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RPC function to generate signed URLs for private PDF files
CREATE OR REPLACE FUNCTION get_pdf_signed_url(
  p_file_path TEXT,
  p_expires_in INTEGER DEFAULT 300 -- 5 minutes default
)
RETURNS TEXT AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- Generate signed URL for the PDF file
  SELECT supabase.storage.create_signed_url(p_file_path, p_expires_in)
  INTO signed_url;

  RETURN signed_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get file metadata with signed URL
CREATE OR REPLACE FUNCTION get_article_files_with_urls(p_article_id UUID)
RETURNS TABLE(
  id UUID,
  file_name TEXT,
  storage_path TEXT,
  content_type TEXT,
  file_size_bytes INTEGER,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ,
  is_primary BOOLEAN,
  signed_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    af.id,
    af.file_name,
    af.storage_path,
    af.content_type,
    af.file_size_bytes,
    af.uploaded_by,
    af.uploaded_at,
    af.is_primary,
    get_pdf_signed_url(af.storage_path, 300) as signed_url
  FROM article_files af
  WHERE af.article_id = p_article_id
  ORDER BY af.is_primary DESC, af.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to format file size for display
CREATE OR REPLACE FUNCTION format_file_size(bytes INTEGER)
RETURNS TEXT AS $$
DECLARE
  size_kb INTEGER;
  size_mb NUMERIC;
BEGIN
  IF bytes < 1024 THEN
    RETURN bytes || ' B';
  ELSIF bytes < 1024 * 1024 THEN
    size_kb := bytes / 1024;
    RETURN size_kb || ' KB';
  ELSE
    size_mb := ROUND((bytes::NUMERIC / (1024 * 1024)), 1);
    RETURN size_mb || ' MB';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Optional: Function to extract text from PDF (placeholder for advanced implementation)
-- This would require external tools like pdftotext or OCR services
CREATE OR REPLACE FUNCTION extract_pdf_text(p_file_path TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Placeholder for PDF text extraction
  -- In a real implementation, this would:
  -- 1. Download the file from storage
  -- 2. Use pdftotext or similar tool to extract text
  -- 3. Return the extracted text
  -- 4. Update the article_files.pdf_text column

  -- For now, return a placeholder
  RETURN 'PDF text extraction not yet implemented. File: ' || p_file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
