// Chat-specific TypeScript types
// These supplement the auto-generated Supabase types

export interface Conversation {
  id: string;
  property_id: string;
  property_title: string;
  property_ref: string | null;
  broker_id: string;
  broker_name: string;
  broker_email: string | null;
  lead_email: string;
  lead_token: string;
  lead_name: string | null;
  lead_phone: string | null;
  status: 'active' | 'archived' | 'closed';
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'lead' | 'broker';
  sender_id: string | null;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface ChatProperty {
  id: string;
  title: string;
  property_type: string | null;
  city: string | null;
  country: string | null;
  price: number | null;
  images: string[] | null;
}

export interface ChatBroker {
  id: string;
  full_name: string;
  email: string | null;
}

export interface CreateConversationParams {
  property_id: string;
  property_title: string;
  property_ref?: string;
  broker_id: string;
  broker_name: string;
  broker_email?: string;
  lead_email: string;
  lead_name?: string;
  lead_phone?: string;
  first_message?: string;
}

export interface SendMessageParams {
  conversation_id: string;
  content: string;
  sender_type: 'lead' | 'broker';
  sender_id?: string;
}

// Chat context state
export interface ChatState {
  // Active conversation
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
  // Real-time subscription
  subscription: any | null;
  
  // Lead email (stored in localStorage for anonymous leads)
  leadEmail: string | null;
  leadToken: string | null;
}

export interface ChatActions {
  // Create new conversation
  createConversation: (params: CreateConversationParams) => Promise<Conversation | null>;
  
  // Load existing conversation by token
  loadConversation: (token: string) => Promise<void>;
  
  // Send a message
  sendMessage: (params: SendMessageParams) => Promise<Message | null>;
  
  // Load messages for a conversation
  loadMessages: (conversationId: string) => Promise<void>;
  
  // Subscribe to real-time messages
  subscribeToMessages: (conversationId: string) => void;
  
  // Unsubscribe from real-time
  unsubscribe: () => void;
  
  // Set lead credentials
  setLeadCredentials: (email: string, token: string) => void;
  
  // Clear chat state
  clearChat: () => void;
}

// Property card with broker info
export interface PropertyWithBroker {
  property: ChatProperty;
  broker: ChatBroker;
}