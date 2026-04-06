import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import TopHeaders from "@/components/TopHeaders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, MapPin, Euro, Calendar, User, Clock, CheckCircle, MessageSquare, Send } from "lucide-react";

const AgentPanel = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [myProperties, setMyProperties] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [claimedRequests, setClaimedRequests] = useState([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (profile && profile.role !== 'broker') {
      navigate('/dashboard');
      return;
    }

    if (profile) {
      fetchAgentData();
    }
  }, [user, profile, navigate]);

  const fetchAgentData = async () => {
    try {
      // Fetch my properties
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        // Properties are keyed by seller_id (profiles.id) in our schema
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;

      // Fetch open property requests
      const { data: openReqs, error: openError } = await supabase
        .from('property_requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (openError) throw openError;

      // Fetch my claimed requests
      const { data: claimedReqs, error: claimedError } = await supabase
        .from('property_requests')
        .select('*')
        .eq('claimed_by', user?.id)
        .order('created_at', { ascending: false });

      if (claimedError) throw claimedError;

      // Fetch conversations for this broker
      const { data: convs, error: convsError } = await supabase
        .from('conversations')
        .select('*')
        .eq('broker_id', user?.id)
        .order('last_activity_at', { ascending: false });

      if (convsError) {
        console.warn('No conversations table yet - this is expected if migration not run');
      } else {
        setConversations(convs || []);
      }

      setMyProperties(properties || []);
      setOpenRequests(openReqs || []);
      setClaimedRequests(claimedReqs || []);
    } catch (error: any) {
      console.error('Error fetching agent data:', error);
      // Don't show error toast for missing conversations table
      if (!error.message?.includes('conversations')) {
        toast({
          title: "Error",
          description: "Failed to load agent data.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a conversation
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

  // Handle conversation selection
  const handleSelectConversation = (conv: any) => {
    setSelectedConversation(conv);
    fetchMessages(conv.id);
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to real-time messages for selected conversation
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

  const handleClaimRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('property_requests')
        .update({ 
          status: 'claimed', 
          claimed_by: user?.id,
          claimed_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('status', 'open'); // Ensure it's still open

      if (error) throw error;

      toast({
        title: "Request Claimed",
        description: "You have successfully claimed this property request."
      });

      fetchAgentData(); // Refresh data
    } catch (error: any) {
      console.error('Error claiming request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to claim request. It may have been claimed by another agent.",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price: number) => {
    return `€${price.toLocaleString('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedConversation || sendingReply) return;

    setSendingReply(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          content: replyMessage,
          sender_type: 'broker',
          sender_id: user?.id,
        });

      if (error) throw error;

      // Update conversation last activity
      await supabase
        .from('conversations')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      setReplyMessage('');
      // Refresh conversations and messages
      fetchAgentData();
      if (selectedConversation) {
        fetchMessages(selectedConversation.id);
      }

      toast({
        title: "Message Sent",
        description: "Your reply has been sent to the customer.",
      });
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reply.",
        variant: "destructive"
      });
    } finally {
      setSendingReply(false);
    }
  };

  if (!user || (profile && profile.role !== 'broker')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You need to be logged in as a broker to access this panel.
            </p>
            <Button onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopHeaders />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading agent panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopHeaders />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Agent Panel</h1>
          <p className="text-muted-foreground">
            Manage your properties and claim new customer requests
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">My Properties</p>
                  <p className="text-2xl font-bold">{myProperties.length}</p>
                </div>
                <Building className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open Requests</p>
                  <p className="text-2xl font-bold">{openRequests.length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Claimed Requests</p>
                  <p className="text-2xl font-bold">{claimedRequests.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="properties">My Properties</TabsTrigger>
            <TabsTrigger value="requests">Available Requests</TabsTrigger>
            <TabsTrigger value="claimed">My Claimed Requests</TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
              {conversations.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {conversations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <CardTitle>My Properties</CardTitle>
              </CardHeader>
              <CardContent>
                {myProperties.length > 0 ? (
                  <div className="space-y-4">
                    {myProperties.map((property: any) => (
                      <Card key={property.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{property.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {property.city}, {property.country}
                              </span>
                              <span className="flex items-center gap-1">
                                <Euro className="h-4 w-4" />
                                {formatPrice(property.price)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(property.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {property.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge variant={property.status === 'published' ? 'default' : 'secondary'}>
                              {property.status}
                            </Badge>
                            <Button size="sm" variant="outline">
                              Edit
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No properties listed yet. Start by adding a property!
                    </p>
                    <Button className="mt-4" onClick={() => navigate('/list-property')}>
                      Add Property
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Available Property Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {openRequests.length > 0 ? (
                  <div className="space-y-4">
                    {openRequests.map((request: any) => (
                      <Card key={request.id} className="p-4 border-l-4 border-l-orange-500">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{request.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {request.customer_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {request.city}, {request.country}
                              </span>
                              {request.estimated_price && (
                                <span className="flex items-center gap-1">
                                  <Euro className="h-4 w-4" />
                                  {formatPrice(request.estimated_price)}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(request.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              {request.description}
                            </p>
                            <Badge variant="secondary" className="mt-2">
                              {request.property_type}
                            </Badge>
                          </div>
                          <Button 
                            onClick={() => handleClaimRequest(request.id)}
                            className="ml-4"
                          >
                            Claim Request
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No open property requests available at the moment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claimed">
            <Card>
              <CardHeader>
                <CardTitle>My Claimed Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {claimedRequests.length > 0 ? (
                  <div className="space-y-4">
                    {claimedRequests.map((request: any) => (
                      <Card key={request.id} className="p-4 border-l-4 border-l-green-500">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{request.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {request.customer_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {request.city}, {request.country}
                              </span>
                              {request.estimated_price && (
                                <span className="flex items-center gap-1">
                                  <Euro className="h-4 w-4" />
                                  {formatPrice(request.estimated_price)}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Claimed: {formatDate(request.claimed_at)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              {request.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">{request.property_type}</Badge>
                              <Badge variant="default">{request.status}</Badge>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Button size="sm" variant="outline">
                              Contact Customer
                            </Button>
                            <Button size="sm">
                              Mark Complete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No claimed requests yet. Check the available requests to get started!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Customer Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conversations.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Conversation List */}
                    <div className="lg:col-span-1 space-y-2">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedConversation?.id === conv.id
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">
                              {conv.lead_name || conv.lead_email}
                            </p>
                            <Badge variant={conv.status === 'active' ? 'default' : 'secondary'}>
                              {conv.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {conv.property_title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(conv.last_activity_at)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Message Thread */}
                    <div className="lg:col-span-2">
                      {selectedConversation ? (
                        <div className="flex flex-col h-[400px]">
                          <div className="border-b pb-2 mb-2">
                            <h3 className="font-semibold">{selectedConversation.property_title}</h3>
                            <p className="text-xs text-muted-foreground">
                              Customer: {selectedConversation.lead_name || selectedConversation.lead_email}
                            </p>
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-muted/30 rounded">
                            {messages.length > 0 ? (
                              messages.map((msg) => {
                                const isBroker = msg.sender_type === 'broker';
                                return (
                                  <div
                                    key={msg.id}
                                    className={`flex ${isBroker ? 'justify-end' : 'justify-start'}`}
                                  >
                                    <div
                                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                        isBroker
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted'
                                      }`}
                                    >
                                      <p className="whitespace-pre-wrap">{msg.content}</p>
                                      <p className={`text-xs mt-1 opacity-70 ${
                                        isBroker ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                      }`}>
                                        {isBroker ? 'Du' : (selectedConversation.lead_name || selectedConversation.lead_email)} · {formatDate(msg.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center text-sm text-muted-foreground py-4">
                                Inga meddelanden ännu. Skicka ett meddelande för att börja konversationen!
                              </div>
                            )}
                            <div ref={messagesEndRef} />
                          </div>
                          <form onSubmit={handleSendReply} className="mt-2 flex gap-2">
                            <input
                              type="text"
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder="Type a reply..."
                              className="flex-1"
                            />
                            <Button type="submit" disabled={sendingReply || !replyMessage.trim()}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      ) : (
                        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                          <p>Select a conversation to view messages</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No messages yet. Customers will message you from property pages.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Note: Make sure the chat database migration has been run.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentPanel;
