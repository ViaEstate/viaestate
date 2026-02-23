-- Add last_activity column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create user_sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions"
ON public.user_sessions
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions"
ON public.user_sessions
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
ON public.user_sessions
FOR DELETE
USING (user_id = auth.uid());

-- Create function to update last_activity
CREATE OR REPLACE FUNCTION public.update_user_activity(user_id_param UUID)
RETURNS void AS $$
BEGIN
  -- Update profiles last_activity
  UPDATE public.profiles
  SET last_activity = now()
  WHERE id = user_id_param;

  -- Update user_sessions last_activity and extend expiration
  UPDATE public.user_sessions
  SET
    last_activity = now(),
    expires_at = now() + interval '30 minutes',
    updated_at = now()
  WHERE user_id = user_id_param
    AND expires_at > now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to check and expire sessions
CREATE OR REPLACE FUNCTION public.expire_inactive_sessions()
RETURNS void AS $$
BEGIN
  -- Mark sessions as expired if no activity for 30 minutes
  UPDATE public.user_sessions
  SET expires_at = now()
  WHERE last_activity < (now() - interval '30 minutes')
    AND expires_at > now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update updated_at
CREATE TRIGGER update_user_sessions_updated_at
BEFORE UPDATE ON public.user_sessions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();