// Chat hook with real-time subscription
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import * as chatApi from '@/lib/chat-api';
import type { 
  Conversation, 
  Message, 
  CreateConversationParams, 
  SendMessageParams 
} from '@/lib/chat';

// Local storage keys
const LEAD_EMAIL_KEY = 'viaestate_lead_email';
const LEAD_TOKEN_KEY = 'viaestate_lead_token';

export function useChat() {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadEmail, setLeadEmail] = useState<string | null>(null);
  const [leadToken, setLeadToken] = useState<string | null>(null);
  
  const subscriptionRef = useRef<any>(null);

  // Ladda lead credentials från localStorage vid init
  useEffect(() => {
    const storedEmail = localStorage.getItem(LEAD_EMAIL_KEY);
    const storedToken = localStorage.getItem(LEAD_TOKEN_KEY);
    if (storedEmail) setLeadEmail(storedEmail);
    if (storedToken) setLeadToken(storedToken);
  }, []);

  // Spara lead credentials till localStorage
  const saveLeadCredentials = useCallback((email: string, token: string) => {
    setLeadEmail(email);
    setLeadToken(token);
    localStorage.setItem(LEAD_EMAIL_KEY, email);
    localStorage.setItem(LEAD_TOKEN_KEY, token);
  }, []);

  // Skapa ny konversation
  const createConversation = useCallback(async (
    params: CreateConversationParams
  ): Promise<Conversation | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await chatApi.createOrGetConversation(params);
      
      if (result.conversation) {
        setCurrentConversation(result.conversation);
        saveLeadCredentials(params.lead_email, result.conversation.lead_token);
        
        // Ladda meddelanden för den nya konversationen
        const msgs = await chatApi.getMessages(result.conversation.id);
        setMessages(msgs);
        
        // Prenumerera på real-time
        subscribeToMessages(result.conversation.id);
        
        return result.conversation;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Kunde inte skapa konversation');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [saveLeadCredentials]);

  // Ladda konversation via token
  const loadConversation = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const conversation = await chatApi.getConversationByToken(token);
      
      if (conversation) {
        setCurrentConversation(conversation);
        saveLeadCredentials(conversation.lead_email, token);
        
        // Ladda meddelanden
        const msgs = await chatApi.getMessages(conversation.id);
        setMessages(msgs);
        
        // Prenumerera på real-time
        subscribeToMessages(conversation.id);
        
        return conversation;
      } else {
        setError('Konversation hittades inte');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Kunde inte ladda konversation');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [saveLeadCredentials]);

  // Ladda meddelanden för en konversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const msgs = await chatApi.getMessages(conversationId);
      setMessages(msgs);
    } catch (err: any) {
      console.error('Kunde inte ladda meddelanden:', err);
    }
  }, []);

  // Skicka ett meddelande
  const sendMessage = useCallback(async (
    content: string,
    senderType: 'lead' | 'broker' = 'lead',
    senderId?: string
  ): Promise<Message | null> => {
    if (!currentConversation) {
      setError('Ingen aktiv konversation');
      return null;
    }

    try {
      const message = await chatApi.sendMessage({
        conversation_id: currentConversation.id,
        content,
        sender_type: senderType,
        sender_id: senderId,
      });
      
      // Ladda om meddelanden för att få uppdaterad lista
      await loadMessages(currentConversation.id);
      
      return message;
    } catch (err: any) {
      setError(err.message || 'Kunde inte skicka meddelande');
      return null;
    }
  }, [currentConversation, loadMessages]);

  // Prenumerera på real-time meddelanden
  const subscribeToMessages = useCallback((conversationId: string) => {
    // Avb现有订阅
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    const subscription = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    subscriptionRef.current = subscription;
  }, []);

  // Avbryt real-time prenumeration
  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  }, []);

  // Rensa all state
  const clearChat = useCallback(() => {
    unsubscribe();
    setCurrentConversation(null);
    setMessages([]);
    setError(null);
    setLeadEmail(null);
    setLeadToken(null);
    localStorage.removeItem(LEAD_EMAIL_KEY);
    localStorage.removeItem(LEAD_TOKEN_KEY);
  }, [unsubscribe]);

  // Cleanup vid unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    // State
    currentConversation,
    messages,
    isLoading,
    error,
    leadEmail,
    leadToken,
    
    // Actions
    createConversation,
    loadConversation,
    loadMessages,
    sendMessage,
    subscribeToMessages,
    unsubscribe,
    saveLeadCredentials,
    clearChat,
  };
}

export default useChat;