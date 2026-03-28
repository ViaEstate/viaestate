// Chat API functions for Supabase
import { supabase } from './supabaseClient';
import type { 
  Conversation, 
  Message, 
  CreateConversationParams, 
  SendMessageParams 
} from './chat';

/**
 * Skapa en ny konversation
 * Om det redan finns en aktiv konversation för samma lead/property, returnera den istället
 */
export async function createOrGetConversation(
  params: CreateConversationParams
): Promise<{ conversation: Conversation; isNew: boolean }> {
  const { property_id, lead_email, first_message } = params;

  // Kolla om det redan finns en aktiv konversation för denna lead och property
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('property_id', property_id)
    .eq('lead_email', lead_email)
    .eq('status', 'active')
    .single();

  if (existing) {
    // Skicka first_message om det finns och om konversationen är ny (inga meddelanden)
    if (first_message) {
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', existing.id)
        .limit(1);

      if (!messages || messages.length === 0) {
        await sendMessage({
          conversation_id: existing.id,
          content: first_message,
          sender_type: 'lead',
        });
      }
    }

    return { conversation: existing as Conversation, isNew: false };
  }

  // Skapa ny konversation
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      property_id: params.property_id,
      property_title: params.property_title,
      property_ref: params.property_ref || null,
      broker_id: params.broker_id,
      broker_name: params.broker_name,
      broker_email: params.broker_email || null,
      lead_email: params.lead_email,
      lead_name: params.lead_name || null,
      lead_phone: params.lead_phone || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Skicka första meddelandet om det finns
  if (first_message && conversation) {
    await sendMessage({
      conversation_id: conversation.id,
      content: first_message,
      sender_type: 'lead',
    });
  }

  return { conversation: conversation as Conversation, isNew: true };
}

/**
 * Hämta en konversation via lead_token
 */
export async function getConversationByToken(
  token: string
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('lead_token', token)
    .single();

  if (error) return null;
  return data as Conversation;
}

/**
 * Hämta alla konversationer för en lead (via email)
 */
export async function getLeadConversations(
  leadEmail: string
): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('lead_email', leadEmail)
    .order('last_activity_at', { ascending: false });

  if (error) return [];
  return (data || []) as Conversation[];
}

/**
 * Hämta alla konversationer för en mäklare (broker)
 */
export async function getBrokerConversations(
  brokerId: string
): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, profiles!conversations_broker_id_fkey(full_name, email)')
    .eq('broker_id', brokerId)
    .order('last_activity_at', { ascending: false });

  if (error) return [];
  return (data || []) as Conversation[];
}

/**
 * Skicka ett meddelande
 */
export async function sendMessage(
  params: SendMessageParams
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: params.conversation_id,
      sender_type: params.sender_type,
      sender_id: params.sender_id || null,
      content: params.content,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Uppdatera last_activity_at på konversationen
  await supabase
    .from('conversations')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', params.conversation_id);

  return data as Message;
}

/**
 * Hämta alla meddelanden för en konversation
 */
export async function getMessages(
  conversationId: string
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) return [];
  return (data || []) as Message[];
}

/**
 * Markera meddelanden som lästa
 */
export async function markMessagesAsRead(
  conversationId: string
): Promise<void> {
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .is('read_at', null)
    .eq('sender_type', 'lead');
}

/**
 * Hämta oblästa meddelanden för en konversation
 */
export async function getUnreadMessagesCount(
  conversationId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .is('read_at', null)
    .eq('sender_type', 'lead');

  if (error) return 0;
  return count || 0;
}

/**
 * Stäng en konversation
 */
export async function closeConversation(
  conversationId: string
): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ status: 'closed' })
    .eq('id', conversationId);

  if (error) throw new Error(error.message);
}

/**
 * Arkivera en konversation
 */
export async function archiveConversation(
  conversationId: string
): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ status: 'archived' })
    .eq('id', conversationId);

  if (error) throw new Error(error.message);
}