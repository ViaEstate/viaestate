-- Add inquiry threading and response tracking to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS thread_id UUID DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES leads(id),
ADD COLUMN IF NOT EXISTS thread_status TEXT DEFAULT 'active' CHECK (thread_status IN ('active', 'closed', 'converted')),
ADD COLUMN IF NOT EXISTS last_response_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS response_count INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.leads.thread_id IS 'Groups related inquiries into threads';
COMMENT ON COLUMN public.leads.parent_id IS 'References the original inquiry in a thread';
COMMENT ON COLUMN public.leads.thread_status IS 'Status of the inquiry thread (active, closed, converted)';
COMMENT ON COLUMN public.leads.last_response_at IS 'Timestamp of the last response in the thread';
COMMENT ON COLUMN public.leads.response_count IS 'Number of responses in the thread';