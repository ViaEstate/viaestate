import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://csksrfsvhkfslvwudccu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNza3NyZnN2aGtmc2x2d3VkY2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDk5NTUsImV4cCI6MjA3MzUyNTk1NX0.pLRzNOUf4UAeddE4OTuL97rMpbtq2R7kvw4ea_Yc6Kg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export type UserRole = 'admin' | 'broker' | 'private_user'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface Property {
  id: string
  title: string
  description: string
  country: string
  city: string
  price: number
  images: string[]
  videos: string[]
  owner_id: string
  owner_type: 'broker' | 'private'
  status: 'draft' | 'pending' | 'published' | 'rejected'
  package_id?: string
  created_at: string
}

export interface Package {
  id: string
  name: string
  description: string
  price_monthly: number
  features: Record<string, any>
  is_custom: boolean
}

export interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  message: string
  property_id?: string
  created_at: string
}

export interface ForumPost {
  id: string
  user_id: string
  title: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}