-- Add property_requests table (used by Submit Property flow + AgentPanel)
-- Matches UI expectations in [`src/components/CustomerPropertyRequest.tsx:33`](src/components/CustomerPropertyRequest.tsx:33)

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
  images TEXT[] DEFAULT '{}'::text[],
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'completed', 'cancelled')),
  claimed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_requests_status ON public.property_requests(status);
CREATE INDEX IF NOT EXISTS idx_property_requests_claimed_by ON public.property_requests(claimed_by);

-- Enable RLS
ALTER TABLE public.property_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
DO $$
BEGIN
  -- Anyone can create property requests (public intake form)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'property_requests'
      AND policyname = 'Anyone can create property requests'
  ) THEN
    CREATE POLICY "Anyone can create property requests"
    ON public.property_requests
    FOR INSERT
    WITH CHECK (true);
  END IF;

  -- Anyone can view open property requests
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'property_requests'
      AND policyname = 'Anyone can view open property requests'
  ) THEN
    CREATE POLICY "Anyone can view open property requests"
    ON public.property_requests
    FOR SELECT
    USING (status = 'open');
  END IF;

  -- Brokers can view requests they claimed
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'property_requests'
      AND policyname = 'Brokers can view their claimed requests'
  ) THEN
    CREATE POLICY "Brokers can view their claimed requests"
    ON public.property_requests
    FOR SELECT
    USING (
      claimed_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'broker'
      )
    );
  END IF;

  -- Brokers can claim open requests
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'property_requests'
      AND policyname = 'Brokers can claim open requests'
  ) THEN
    CREATE POLICY "Brokers can claim open requests"
    ON public.property_requests
    FOR UPDATE
    USING (
      status = 'open'
      AND claimed_by IS NULL
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'broker'
      )
    );
  END IF;

  -- Admins can manage all requests
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'property_requests'
      AND policyname = 'Admins can manage all property requests'
  ) THEN
    CREATE POLICY "Admins can manage all property requests"
    ON public.property_requests
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
      )
    );
  END IF;
END $$;

-- Keep updated_at current (requires public.handle_updated_at())
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_property_requests_updated_at'
  ) THEN
    CREATE TRIGGER update_property_requests_updated_at
    BEFORE UPDATE ON public.property_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

