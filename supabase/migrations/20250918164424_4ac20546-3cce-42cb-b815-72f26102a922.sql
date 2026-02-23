-- Create property_requests table for customer submissions
CREATE TABLE IF NOT EXISTS public.property_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  estimated_price NUMERIC,
  property_type TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'completed', 'cancelled')),
  claimed_by UUID REFERENCES public.profiles(id),
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add status column to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
    ALTER TABLE public.profiles ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Update forum_posts to link with properties and property_requests
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS property_request_id UUID REFERENCES public.property_requests(id) ON DELETE CASCADE;
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS author_email TEXT;
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE;

-- Make user_id nullable in forum_posts for guest posts
ALTER TABLE public.forum_posts ALTER COLUMN user_id DROP NOT NULL;

-- Enable RLS
ALTER TABLE public.property_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_requests
CREATE POLICY "Anyone can view open property requests" 
ON public.property_requests 
FOR SELECT 
USING (status = 'open');

CREATE POLICY "Anyone can create property requests" 
ON public.property_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Brokers can view their claimed requests" 
ON public.property_requests 
FOR SELECT 
USING (claimed_by = auth.uid());

CREATE POLICY "Brokers can claim open requests" 
ON public.property_requests 
FOR UPDATE 
USING (status = 'open' AND claimed_by IS NULL AND 
       EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'broker'));

CREATE POLICY "Admins can manage all property requests" 
ON public.property_requests 
FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Updated forum_posts policies
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can view their own posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.forum_posts;

CREATE POLICY "Anyone can create forum posts" 
ON public.forum_posts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view approved posts" 
ON public.forum_posts 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Users can view their own posts" 
ON public.forum_posts 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own posts" 
ON public.forum_posts 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all forum posts" 
ON public.forum_posts 
FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Update properties policies for broker management
CREATE POLICY "Brokers can view their own properties" 
ON public.properties 
FOR SELECT 
USING (owner_id = auth.uid() AND 
       EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'broker'));

-- Update profiles policies for admin management
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_property_requests_updated_at
BEFORE UPDATE ON public.property_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create function to auto-approve first admin user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- If this is the first user, make them admin
  IF user_count = 0 THEN
    NEW.role := 'admin';
    NEW.status := 'approved';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();