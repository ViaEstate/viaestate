-- Fix PDF Upload Policies
-- This migration fixes the incorrect is_admin field reference in PDF upload policies
-- The policies were checking for profiles.is_admin but the table uses profiles.role = 'admin'

-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Admins can upload article files" ON article_files;
DROP POLICY IF EXISTS "Admins can update article files" ON article_files;
DROP POLICY IF EXISTS "Admins can delete article files" ON article_files;
DROP POLICY IF EXISTS "Admins can upload article files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update their article file uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete their article file uploads" ON storage.objects;

-- Recreate policies with correct role check
CREATE POLICY "Admins can upload article files" ON article_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update article files" ON article_files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete article files" ON article_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

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