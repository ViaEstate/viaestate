# Förbättra AgentPanel Chat-funktionalitet

## Problem
AgentPanel visar en placeholder-text "Messages will appear here. (Database table needs to be created)" istället för att visa faktiska meddelanden från konversationer.

## Lösning
Förbättra AgentPanel så att:
1. Meddelanden hämtas och visas när en konversation väljs
2. Meddelanden visas i ett scrollbart meddelandefält
3. Broker kan skicka svar till kunder
4. Real-time uppdateringar för nya meddelanden

## Ändringar som behövs

### 1. AgentPanel.tsx
- Lägg till state för att lagra meddelanden: `const [messages, setMessages] = useState<any[]>([])`
- Lägg till funktion för att hämta meddelanden: `fetchMessages(conversationId)`
- Uppdatera `setSelectedConversation` för att hämta meddelanden när en konversation väljes
- Visa meddelanden i meddelandefältet istället för placeholder-text
- Formatera meddelanden med sändare, tid och innehåll
- Lägg till real-time prenumeration för nya meddelanden

### 2. Meddelandevisning
- Visa meddelanden i ett scrollbart fält
- Visa sändarnamn (lead_email eller broker_name)
- Visa tidstämpel för varje meddelande
- Skilj på meddelanden från lead och broker (olika färger/position)

### 3. Real-time uppdateringar
- Prenumerera på nya meddelanden för vald konversation
- Uppdatera meddelandelistan automatiskt när nya meddelanden kommer

## Implementation

### Steg 1: Lägg till meddelande-hämtning
```typescript
const fetchMessages = async (conversationId: string) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    setMessages(data || []);
  } catch (error: any) {
    console.error('Error fetching messages:', error);
  }
};
```

### Steg 2: Uppdatera konversationsval
```typescript
const handleSelectConversation = (conv: any) => {
  setSelectedConversation(conv);
  fetchMessages(conv.id);
};
```

### Steg 3: Visa meddelanden
```typescript
<div className="flex-1 overflow-y-auto space-y-2 p-2 bg-muted/30 rounded">
  {messages.map((msg) => {
    const isBroker = msg.sender_type === 'broker';
    return (
      <div key={msg.id} className={`flex ${isBroker ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isBroker ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          <p className="whitespace-pre-wrap">{msg.content}</p>
          <p className={`text-xs mt-1 opacity-70 ${
            isBroker ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}>
            {isBroker ? 'Du' : (selectedConversation?.lead_name || selectedConversation?.lead_email)} · {formatDate(msg.created_at)}
          </p>
        </div>
      </div>
    );
  })}
</div>
```

### Steg 4: Real-time prenumeration
```typescript
useEffect(() => {
  if (!selectedConversation) return;

  const subscription = supabase
    .channel(`chat-${selectedConversation.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversation.id}`,
      },
      (payload: any) => {
        const newMessage = payload.new;
        setMessages(prev => [...prev, newMessage]);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [selectedConversation]);
```

## Testning
1. Logga in som broker
2. Gå till AgentPanel
3. Klicka på "Messages"-fliken
4. Välj en konversation
5. Verifiera att meddelanden visas korrekt
6. Skicka ett svar
7. Verifiera att meddelandet skickas och visas
