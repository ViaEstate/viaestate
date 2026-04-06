# Chattfunktionalitet Plan - Estate Connect AI

## Översikt

Bygga en chattfunktion mellan mäklare och privatkunder med följande funktioner:
- Unika chattlänkar som kan skapas av mäklare
- Länken kan öppnas på hemsidan
- Gäst-autentisering via länken (skapa konto/fortsätt som gäst)
- Stöd för både fastighetsspecifik chatt och generell chatt

---

## 1. Databasschema

### Tabeller att skapa:

```sql
-- Chat sessions (konversationer)
CREATE TABLE chat_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  broker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  guest_email TEXT,
  guest_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sender_type TEXT CHECK (sender_type IN ('broker', 'guest')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat links (unika länkpar)
CREATE TABLE chat_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token UUID DEFAULT uuid_generate_v4() UNIQUE,
  broker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. RLS Policies

```sql
-- Chat sessions policies
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Brokers can view their own sessions
CREATE POLICY "Brokers can view own sessions" ON chat_sessions
  FOR SELECT USING (
    broker_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Guests can view their own session
CREATE POLICY "Guests can view own session" ON chat_sessions
  FOR SELECT USING (guest_id = auth.uid());

-- Chat messages policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Both parties can view messages in their session
CREATE POLICY "Session participants can view messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND (chat_sessions.broker_id = auth.uid() OR chat_sessions.guest_id = auth.uid())
    )
  );

-- Both parties can insert messages
CREATE POLICY "Session participants can insert messages" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.broker_id = auth.uid()
    )
  );

-- Chat links policies
ALTER TABLE chat_links ENABLE ROW LEVEL SECURITY;

-- Anyone with link token can access
CREATE POLICY "Anyone with valid token can use link" ON chat_links
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));
```

---

## 3. Systemarkitektur

### Flöde 1: Skapa chattlänk (Mäklare)

```
Mäklare → AgentPanel → Skapa länk
         → Välj fastighet (valfritt)
         → Spara → Generera unik token
         → Kopiera länk → Skicka till kund
```

### Flöde 2: Öppna chattlänk (Gäst)

```
Gäst → Öppnar länk /chat/{token}
     → Kontrollera token validity
     → Om inloggad → Gå till chattrum
     → Om inte inloggad → Visa gäst-formulär
       → Alternativ 1: Logga in
       → Alternativ 2: Skapa konto
       → Alternativ 3: Fortsätt som gäst (ange namn + email)
```

### Flöde 3: Chatt

```
Chattrum → Ladda meddelanden
        → Realtids-uppdatering via Supabase Realtime
        → Skicka/ta emot meddelanden
        → Markera som läst
```

---

## 4. Komponentstruktur

```
src/
├── components/
│   ├── ChatLink.tsx          # Öppna chattlänk-sida
│   ├── ChatRoom.tsx          # Chattgränssnitt
│   ├── ChatManager.tsx       # Hantera chattlänkar (mäklare)
│   ├── ChatMessage.tsx       # Enskilt meddelande
│   ├── ChatInput.tsx         # Input för nya meddelanden
│   └── GuestAuthModal.tsx    # Gäst-autentisering
├── pages/
│   └── Chat.tsx              # Huvud-chattsida
├── hooks/
│   └── useChat.ts           # Chat-logik hook
└── lib/
    └── chat.ts               # Chat-hjälpfunktioner
```

---

## 5. Rutter att lägga till

```tsx
// App.tsx
<Route path="/chat/:token" element={<Chat />} />

// Inom :lang prefix
<Route path="chat" element={
  <ProtectedRoute allowedRoles={['broker', 'admin']}>
    <ChatManager />
  </ProtectedRoute>
} />
```

---

## 6. API Funktioner (Supabase RPC)

```sql
-- Skapa ny chattlänk
CREATE OR REPLACE FUNCTION create_chat_link(
  p_broker_id UUID,
  p_property_id UUID DEFAULT NULL,
  p_max_uses INTEGER DEFAULT 1,
  p_expires_in_hours INTEGER DEFAULT 168
) RETURNS UUID;

-- Verifiera och använd chattlänk
CREATE OR REPLACE FUNCTION use_chat_link(
  p_token UUID
) RETURNS JSONB;

-- Skapa chatt-session från länk
CREATE OR REPLACE FUNCTION create_chat_session(
  p_link_token UUID,
  p_guest_id UUID DEFAULT NULL,
  p_guest_name TEXT,
  p_guest_email TEXT
) RETURNS UUID;
```

---

## 7. Tekniska detaljer

### Realtidsuppdateringar
- Använd Supabase Realtime för `chat_messages`
- Subscribe på sessionens ID vid öppning av chatt

### Länkformat
```
https://viaestate.eu/chat/abc123-def456-ghi789
eller
https://viaestate.eu/en/chat/abc123-def456-ghi789
```

### Säkerhet
- Länker har begränsad livslängd (valfritt)
- Max antal användningar (valfritt)
- RLS säkerställer att endast rätt personer kan se meddelanden

---

## 8. UI/UX Design

### För Mäklare (AgentPanel)
- Dashboard med aktiva chattar
- Lista över skapade chattlänkar
- Knapp: "Skapa ny chattlänk"
- Kopia-länk funktion
- Välj fastighet (valfritt)

### För Gäst
- Chatt-fönster med meddelanden
- Input för att skicka meddelanden
- Profil-info (gästens namn syns för mäklare)
- Om kopplad till fastighet: visa fastighetsinfo

---

## 9. Översättningar (locales)

Nycklar att lägga till:
```json
{
  "chat": {
    "title": "Chat",
    "new_link": "Create Chat Link",
    "copy_link": "Copy Link",
    "link_copied": "Link copied!",
    "send_message": "Send message...",
    "no_messages": "No messages yet",
    "type_message": "Type your message...",
    "guest_continue": "Continue as Guest",
    "guest_name": "Your Name",
    "guest_email": "Your Email",
    "select_property": "Select Property (Optional)",
    "expires": "Expires",
    "uses": "Uses"
  }
}
```

---

## 10. Implementationsordning

1. **Databas** - Tabeller, policies, funktioner
2. **Grundläggande komponenter** - ChatRoom, ChatMessage, ChatInput
3. **Länkhantering** - ChatLink-sida, GuestAuthModal
4. **Mäklarverktyg** - ChatManager i AgentPanel
5. **Routing** - Lägg till rutter
6. **Realtime** - Aktivera realtime för meddelanden
7. **Tester** - Testa hela flödet
