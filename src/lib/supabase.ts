import { Json } from '@/integrations/supabase/types';

// Remove supabase client creation, keep only types and interfaces

// Types for our database
export type UserRole = 'admin' | 'broker' | 'private_user';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: 'pending' | 'approved' | 'rejected';
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  country: string;
  city: string;
  price: number;
  property_type?: string;
  property_type_detail?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  plot_area?: number;
  distance_to_city?: number;
  distance_to_sea?: number;
  distance_to_lake?: number;
  listing_type?: 'sale' | 'rent';
  images: string[];
  videos: string[];
  owner_id: string;
  owner_type: 'broker' | 'private';
  status: 'draft' | 'pending' | 'published' | 'rejected';
  package_id?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  features: Json | null;
  is_custom: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  property_id?: string;
  status: 'new' | 'contacted' | 'converted' | 'lost';
  created_at: string;
}

export interface ForumPost {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  property_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  selected_features: Json | null;
  total_additional_cost?: number;
  status: 'pending' | 'contacted' | 'quoted' | 'converted' | 'lost';
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string; // Made optional for PDF articles
  content?: string; // Made optional for PDF-only articles
  cover_url?: string;
  pdf_url?: string; // URL to PDF file
  pdf_title?: string; // Title of PDF document
  pdf_file_size?: number; // File size in bytes
  author: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  tsv: string;
  author_profile?: {
    full_name: string;
  };
}

export interface ArticleTag {
  article_id: string;
  tag_id: string;
}

export interface ArticleWithAuthor extends Article {
  author_profile?: {
    full_name: string;
  };
}

export interface ArticleSearchResult {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  cover_url?: string;
  published_at?: string;
  rank: number;
}

export interface ArticleFile {
  id: string;
  article_id: string | null;
  file_name: string;
  storage_path: string;
  public_url?: string;
  content_type: string;
  file_size_bytes: number;
  uploaded_by?: string;
  uploaded_at: string;
  is_primary: boolean;
  pdf_text?: string;
  signed_url?: string;
}