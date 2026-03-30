-- ViaEstate Chat System
-- Conversations between leads and brokers for specific properties
-- Run in Supabase SQL Editor

-- =====================================================
-- STEP 1: Create conversations table
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: conversations (one conversation per lead/property)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    property_title TEXT NOT NULL,
    property_ref TEXT,
    broker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    broker_name TEXT NOT NULL,
    broker_email TEXT,
    lead_email TEXT NOT NULL,
    lead_token UUID NOT NULL DEFAULT uuid_generate_v4(),
    lead_name TEXT,
    lead_phone TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'archived', 'closed')) DEFAULT 'active',
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 2: Create messages table
-- =====================================================

-- Table: messages (messages in a conversation)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('lead', 'broker')),
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 3: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_conversations_lead_token ON conversations(lead_token);
CREATE INDEX IF NOT EXISTS idx_conversations_broker_id ON conversations(broker_id);
CREATE INDEX IF NOT EXISTS idx_conversations_property_id ON conversations(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- =====================================================
-- STEP 4: Enable Real-time for messages (OPTIONAL - Skip if causing errors)
-- Uncomment the line below only if you need real-time updates
-- The chat will work without this, just no live updates
-- =====================================================

-- This will fail if messages is already in the publication:
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- =====================================================
-- STEP 5: Row Level Security (RLS)
-- =====================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Conversations Policies (Use OR REPLACE)
-- =====================================================

-- Anyone can create a new conversation (lead initiates)
DROP POLICY IF EXISTS "Anyone can create conversation" ON conversations;
CREATE POLICY "Anyone can create conversation"
    ON conversations FOR INSERT
    WITH CHECK (true);

-- Allow public read access to conversations for now (can be tightened later)
-- This allows leads to access via token passed in request
DROP POLICY IF EXISTS "Public read conversations" ON conversations;
CREATE POLICY "Public read conversations"
    ON conversations FOR SELECT
    USING (true);

-- Anyone can update conversation (for last_activity tracking)
DROP POLICY IF EXISTS "Anyone can update conversation" ON conversations;
CREATE POLICY "Anyone can update conversation"
    ON conversations FOR UPDATE
    USING (true);

-- =====================================================
-- Messages Policies
-- =====================================================

-- Anyone can insert a message (both lead and broker)
DROP POLICY IF EXISTS "Anyone can send message" ON messages;
CREATE POLICY "Anyone can send message"
    ON messages FOR INSERT
    WITH CHECK (true);

-- Allow public read access to messages (can be tightened later)
DROP POLICY IF EXISTS "Public read messages" ON messages;
CREATE POLICY "Public read messages"
    ON messages FOR SELECT
    USING (true);

-- =====================================================
-- Function to update last_activity_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_conversation_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at = NOW();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on each update
DROP TRIGGER IF EXISTS update_conversation_timestamp ON conversations;
CREATE TRIGGER update_conversation_timestamp
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_activity();

-- =====================================================
-- Verification: Check that tables were created
-- =====================================================

-- Run: SELECT * FROM conversations LIMIT 0;
-- Run: SELECT * FROM messages LIMIT 0;