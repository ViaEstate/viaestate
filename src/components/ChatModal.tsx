// Chat Modal - Trigger button + email input for starting a conversation
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  propertyRef?: string;
  brokerId: string;
  brokerName: string;
  brokerEmail?: string;
}

export function ChatModal({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  propertyRef,
  brokerId,
  brokerName,
  brokerEmail,
}: ChatModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { createConversation, leadToken } = useChat();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setErrorMessage('Ange en giltig e-postadress');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const conversation = await createConversation({
        property_id: propertyId,
        property_title: propertyTitle,
        property_ref: propertyRef,
        broker_id: brokerId,
        broker_name: brokerName,
        broker_email: brokerEmail,
        lead_email: email,
        lead_name: name || undefined,
        lead_phone: phone || undefined,
        first_message: firstMessage || undefined,
      });

      if (conversation && leadToken) {
        setStatus('success');
        // Redirect to chat page after short delay
        setTimeout(() => {
          onClose();
          navigate(`/${lang}/chat/${leadToken}`);
        }, 1500);
      } else {
        setStatus('error');
        setErrorMessage('Kunde inte skapa konversation. Försök igen.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Ett fel uppstod. Försök igen.');
    }
  };

  const handleClose = () => {
    setEmail('');
    setName('');
    setPhone('');
    setFirstMessage('');
    setStatus('idle');
    setErrorMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Kontakta mäklaren
          </DialogTitle>
          <DialogDescription>
            Skicka ett privat meddelande om <strong>{propertyTitle}</strong>
            {propertyRef && <span className="text-muted-foreground"> (Ref: {propertyRef})</span>}
          </DialogDescription>
        </DialogHeader>

        {status === 'success' ? (
          <div className="py-6 text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Send className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium">Konversation skapad!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Du omdirigeras till chatten...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Property info chip */}
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{propertyTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    Ansvarig: {brokerName}
                  </p>
                </div>
              </div>
            </div>

            {/* Email - required */}
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Din e-postadress <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="din@email.se"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === 'loading'}
              />
            </div>

            {/* Name - optional */}
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Ditt namn (valfritt)
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Ditt namn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={status === 'loading'}
              />
            </div>

            {/* Phone - optional */}
            <div>
              <label htmlFor="phone" className="text-sm font-medium">
                Telefon (valfritt)
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="+46 70 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={status === 'loading'}
              />
            </div>

            {/* First message - optional */}
            <div>
              <label htmlFor="message" className="text-sm font-medium">
                Meddelande (valfritt)
              </label>
              <Textarea
                id="message"
                placeholder="Hej! Jag är intresserad av denna fastighet..."
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                rows={3}
                disabled={status === 'loading'}
              />
            </div>

            {/* Error message */}
            {errorMessage && (
              <p className="text-sm text-red-500">{errorMessage}</p>
            )}

            {/* Privacy note */}
            <p className="text-xs text-muted-foreground">
              Vi delar aldrig din e-post med tredje part. Länken till chatten sparas i din webbläsare.
            </p>

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Skickar...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Öppna chatt
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ChatModal;