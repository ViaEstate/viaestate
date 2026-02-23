-- ViaEstate Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable Row Level Security (RLS)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'broker', 'private_user')) DEFAULT 'private_user',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties table
CREATE TABLE properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  price NUMERIC NOT NULL,
  property_type TEXT,
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('broker', 'private')) DEFAULT 'broker',
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'published', 'rejected')) DEFAULT 'pending',
  package_id UUID,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packages table
CREATE TABLE packages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_monthly NUMERIC NOT NULL,
  features JSONB DEFAULT '{}',
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table
CREATE TABLE leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum posts table
CREATE TABLE forum_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote requests table
CREATE TABLE quote_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT,
  selected_features JSONB DEFAULT '{}',
  total_additional_cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quoted', 'converted', 'lost')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create storage bucket for property media
INSERT INTO storage.buckets (id, name, public) VALUES ('properties', 'properties', true);

-- Row Level Security Policies

-- Profiles policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Properties policies
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published properties are viewable by everyone" ON properties
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users can view their own properties" ON properties
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all properties" ON properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own properties" ON properties
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Admins can update all properties" ON properties
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Leads policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Property owners can view leads for their properties" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = leads.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can create leads" ON leads
  FOR INSERT WITH CHECK (true);

-- Forum posts policies
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved posts are viewable by everyone" ON forum_posts
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view their own posts" ON forum_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all posts" ON forum_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create posts" ON forum_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all posts" ON forum_posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Quote requests policies
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all quote requests" ON quote_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can create quote requests" ON quote_requests
  FOR INSERT WITH CHECK (true);

-- Packages policies
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packages are viewable by everyone" ON packages
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage packages" ON packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Storage policies
CREATE POLICY "Anyone can view property images" ON storage.objects
  FOR SELECT USING (bucket_id = 'properties');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'properties' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own uploads" ON storage.objects
  FOR UPDATE USING (bucket_id = 'properties' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'properties' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Functions to automatically handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_forum_posts_updated_at
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Insert default packages
INSERT INTO packages (name, description, price_monthly, features) VALUES
  ('Basic - Starter Package', 'Property listing on ViaEstate.eu, Lead forwarding via contact form, Visibility in search filters, Professional photography, Basic photo editing', 199, '{"photography": "standard", "lead_forwarding": true, "search_visibility": true, "photo_editing": "basic"}'::jsonb),
  ('Standard - Growth Package', 'Everything in Basic plus social media promotion, notifications, video presentation, advanced photo editing, featured placement', 399, '{"photography": "standard", "lead_forwarding": true, "search_visibility": true, "photo_editing": "advanced", "social_media": 2, "video_presentation": "short", "featured_placement": true}'::jsonb),
  ('Premium - Exclusive Exposure', 'Everything in Standard plus priority homepage placement, drone photography, professional video, lifestyle photography, custom ad campaigns, CRM access', 799, '{"photography": ["standard", "drone", "lifestyle"], "lead_forwarding": true, "search_visibility": true, "photo_editing": "advanced", "social_media": 5, "video_presentation": "professional", "featured_placement": true, "homepage_priority": true, "custom_ads": true, "crm_access": true}'::jsonb),
  ('Custom Quote - Tailored Solution', 'Fully customized package based on client needs including 360° tours, VR viewings, voice-over, custom campaigns, PR articles, exclusive strategies, personal meetings', 0, '{"custom": true, "360_tours": true, "vr_viewings": true, "voice_over": true, "custom_campaigns": true, "pr_articles": true, "exclusive_strategies": true, "personal_meetings": true}'::jsonb);

-- Create an admin user function (call this after creating your first user)
-- Replace 'your-email@example.com' with your actual email
/*
CREATE OR REPLACE FUNCTION make_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET role = 'admin', status = 'approved'
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage: SELECT make_admin('your-email@example.com');
*/

-- Create first admin trigger (automatically makes first user admin and approved)
CREATE OR REPLACE FUNCTION create_first_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is the first user, make them admin and approved
  IF (SELECT COUNT(*) FROM profiles) = 0 THEN
    NEW.role = 'admin';
    NEW.status = 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER first_user_admin_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_first_admin();