import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import TopHeaders from "@/components/TopHeaders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, MapPin, Euro, Calendar, User, Clock, CheckCircle } from "lucide-react";

const AgentPanel = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [myProperties, setMyProperties] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [claimedRequests, setClaimedRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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

      setMyProperties(properties || []);
      setOpenRequests(openReqs || []);
      setClaimedRequests(claimedReqs || []);
    } catch (error: any) {
      console.error('Error fetching agent data:', error);
      toast({
        title: "Error",
        description: "Failed to load agent data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
      day: 'numeric'
    });
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="properties">My Properties</TabsTrigger>
            <TabsTrigger value="requests">Available Requests</TabsTrigger>
            <TabsTrigger value="claimed">My Claimed Requests</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
};

export default AgentPanel;
