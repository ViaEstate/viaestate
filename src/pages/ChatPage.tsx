import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send, ArrowLeft, Loader2, User } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export function ChatPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { 
    currentConversation, 
    messages, 
    isLoading, 
    error,
    loadConversation,
    sendMessage,
    leadEmail,
    clearChat,
  } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ladda konversation vid mount
  useEffect(() => {
    if (token) {
      loadConversation(token);
    }
  }, [token, loadConversation]);

  // Scroll till botten när nya meddelanden
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Hämta message-sändare (lead eller broker)
  const getSenderLabel = (senderType: 'lead' | 'broker') => {
    return senderType === 'lead' ? 'Du' : (currentConversation?.broker_name || 'Mäklaren');
  };

  // Formatera tid
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const senderType = user && profile?.role === 'broker' ? 'broker' : 'lead';
    await sendMessage(newMessage, senderType, user?.id);
    setNewMessage('');
    setIsSending(false);
  };

  const handleLeaveChat = () => {
    clearChat();
    navigate('/');
  };

  // Laddar
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Laddar konversation...</p>
        </div>
      </div>
    );
  }

  // Fel
  if (error || !currentConversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-red-500">Kunde inte ladda chatten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {error || 'Länken är ogiltig eller har gått ut.'}
            </p>
            <Button onClick={handleLeaveChat} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka till startsidan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleLeaveChat}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-semibold">{currentConversation.property_title}</h1>
              <p className="text-xs text-muted-foreground">
                Ref: {currentConversation.property_ref || 'N/A'} · {currentConversation.broker_name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {user ? `Inloggad som ${profile?.full_name}` : leadEmail}
            </p>
          </div>
        </div>
      </header>

      {/* Meddelanden */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Inga meddelanden ännu. Skicka ett meddelande för att börja chatten!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isLead = msg.sender_type === 'lead';
              const isMe = isLead 
                ? (!user || profile?.role !== 'broker')
                : (user && profile?.role === 'broker');
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      isMe
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 opacity-70 ${
                      isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {getSenderLabel(msg.sender_type)} · {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form 
          onSubmit={handleSend}
          className="max-w-3xl mx-auto flex gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Skriv ett meddelande..."
            disabled={isSending}
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;