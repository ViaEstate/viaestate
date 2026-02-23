-- Add Articles/Blog Feature Migration
-- This migration adds the complete articles/blog system with tables, RLS policies, search functionality, and storage

-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Update existing admins to have is_admin = true
UPDATE profiles SET is_admin = true WHERE role = 'admin';

-- Modify the first admin trigger to also set is_admin
CREATE OR REPLACE FUNCTION create_first_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is the first user, make them admin and approved
  IF (SELECT COUNT(*) FROM profiles) = 0 THEN
    NEW.role := 'admin';
    NEW.status := 'approved';
    NEW.is_admin := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create tags table
CREATE TABLE tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create articles table
CREATE TABLE articles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_url TEXT,
  author UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT false,
  tsv TSVECTOR
);

-- Create article_tags junction table
CREATE TABLE article_tags (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_author ON articles(author);
CREATE INDEX idx_articles_tsv ON articles USING gin(tsv);
CREATE INDEX idx_tags_name ON tags(name);

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Function to update tsv (fulltext search vector)
CREATE OR REPLACE FUNCTION update_article_tsv()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tsv = setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tsv on insert/update
CREATE TRIGGER update_article_tsv_trigger
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_article_tsv();

-- Trigger for updated_at on articles
CREATE TRIGGER handle_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS on all tables
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for articles
-- Select for public (anonymous users can read published articles)
CREATE POLICY "Published articles are viewable by everyone" ON articles
  FOR SELECT USING (status = 'published');

-- Select for authenticated users (non-admins can read published, admins can read all)
CREATE POLICY "Authenticated users can view published articles" ON articles
  FOR SELECT USING (
    auth.role() = 'authenticated' AND status = 'published'
  );

CREATE POLICY "Admins can view all articles" ON articles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Insert: only admins
CREATE POLICY "Admins can create articles" ON articles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Update: only admins
CREATE POLICY "Admins can update articles" ON articles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Delete: only admins
CREATE POLICY "Admins can delete articles" ON articles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- RLS Policies for tags
-- Tags are viewable by everyone
CREATE POLICY "Tags are viewable by everyone" ON tags
  FOR SELECT USING (true);

-- Admins can manage tags
CREATE POLICY "Admins can manage tags" ON tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- RLS Policies for article_tags
-- Viewable by everyone (for reading articles with tags)
CREATE POLICY "Article tags are viewable by everyone" ON article_tags
  FOR SELECT USING (true);

-- Admins can manage article_tags
CREATE POLICY "Admins can manage article tags" ON article_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for article-images
CREATE POLICY "Anyone can view article images" ON storage.objects
  FOR SELECT USING (bucket_id = 'article-images');

CREATE POLICY "Authenticated users can upload article images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'article-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own article uploads" ON storage.objects
  FOR UPDATE USING (bucket_id = 'article-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own article uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'article-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RPC function for article search
CREATE OR REPLACE FUNCTION search_articles(
  q TEXT,
  lim INTEGER DEFAULT 10,
  offs INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  excerpt TEXT,
  slug TEXT,
  cover_url TEXT,
  published_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.excerpt,
    a.slug,
    a.cover_url,
    a.published_at,
    ts_rank(a.tsv, plainto_tsquery('english', q)) AS rank
  FROM articles a
  WHERE a.status = 'published'
    AND a.tsv @@ plainto_tsquery('english', q)
  ORDER BY rank DESC, a.published_at DESC
  LIMIT lim
  OFFSET offs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create audit table for article actions (recommended)
CREATE TABLE article_audit (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'publish', 'unpublish', 'delete')),
  by_user UUID REFERENCES profiles(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  diff JSONB
);

-- RLS for audit (admins only)
ALTER TABLE article_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view article audit" ON article_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "System can insert audit logs" ON article_audit
  FOR INSERT WITH CHECK (true);

-- Function to log article actions (call this in your application logic)
CREATE OR REPLACE FUNCTION log_article_action(
  p_article_id UUID,
  p_action TEXT,
  p_by_user UUID DEFAULT auth.uid(),
  p_diff JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO article_audit (article_id, action, by_user, diff)
  VALUES (p_article_id, p_action, p_by_user, p_diff);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
