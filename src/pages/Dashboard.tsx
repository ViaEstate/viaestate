import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Building,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  MessageSquare,
  TrendingUp,
  Calendar,
  Euro,
  Building2
} from 'lucide-react'
import { Tables } from '@/integrations/supabase/types';

type Property = Tables<"properties">;
type Lead = Tables<"leads">;
import TopHeaders from '@/components/TopHeaders'

import PropertyDetailModal from '@/components/PropertyDetailModal'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const Dashboard = () => {
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [properties, setProperties] = useState<Property[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      // Fetch user's properties with defensive field selection
      // Only select fields that exist in current schema
      const selectFields = `
        id, title, description, country, city, price, property_type,
        images, seller_id, seller_type, status, created_at, updated_at
      `

      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(selectFields)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError)
        // If it's a column error, try with basic fields only
        if (propertiesError.message.includes('column') || propertiesError.message.includes('does not exist')) {
          const basicQuery = supabase
            .from('properties')
            .select('id, title, description, country, city, price, images, seller_type, status, created_at')
            .eq('seller_id', user.id)
            .order('created_at', { ascending: false })

          const { data: basicData, error: basicError } = await basicQuery
          if (basicError) throw basicError
          setProperties((basicData as Property[]) || [])
        } else {
          throw propertiesError
        }
      } else {
        setProperties((propertiesData as Property[]) || [])
      }

      // Fetch leads for user's properties
      const propertyIds = propertiesData?.map(p => p.id) || []
      if (propertyIds.length > 0) {
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .in('property_id', propertyIds)
          .order('created_at', { ascending: false })

        if (leadsError) throw leadsError
        setLeads(leadsData || [])
      }
    } catch (error: any) {
      toast({
        title: t("dashboard.error_loading", "Error loading dashboard"),
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  
  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyToDelete.id);

      if (error) throw error;

      setProperties(properties.filter(p => p.id !== propertyToDelete.id));
      toast({
        title: t("dashboard.property_deleted", "Property Deleted"),
        description: t("dashboard.property_deleted_desc", `"${propertyToDelete?.title}" has been successfully deleted.`),
      });
    } catch (error: any) {
      toast({
        title: "Error deleting property",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPropertyToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPrice = (price: number) => {
    return `€${price.toLocaleString('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <TopHeaders />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">{t("dashboard.please_sign_in", "Please Sign In")}</h1>
          <p className="text-muted-foreground mb-8">{t("dashboard.sign_in_required", "You need to be logged in to access the dashboard.")}</p>
          <Button onClick={() => navigate('/login')}>{t("dashboard.sign_in", "Sign In")}</Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopHeaders />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t("dashboard.loading", "Loading dashboard...")}</p>
        </div>
      </div>
    )
  }

  const publishedProperties = properties.filter(p => p.status === 'published')
  const pendingProperties = properties.filter(p => p.status === 'pending')
  const totalLeads = leads.length
  const recentLeads = leads.slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      <TopHeaders />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-10 w-10 text-primary" />
              <span className="text-3xl font-bold">
                <span className="text-muted-foreground">Via</span>
                <span className="text-primary">Estate</span>
              </span>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{t("dashboard.dashboard", "Dashboard")}</h1>
              <p className="text-xl text-muted-foreground">
                {t("dashboard.welcome_back", "Welcome back,")} {profile?.full_name}
              </p>
              <Badge variant="secondary" className="mt-2">
                {profile?.role === 'broker' ? t("dashboard.professional_broker", "Professional Broker") : t("dashboard.private_seller", "Private Seller")}
              </Badge>
            </div>
          </div>
          <Button onClick={() => navigate('/list-property')}>
            <Plus className="h-4 w-4 mr-2" />
            {t("dashboard.list_new_property", "List New Property")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Building className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("dashboard.total_properties", "Total Properties")}</p>
                  <p className="text-2xl font-bold">{properties.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Eye className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("dashboard.published", "Published")}</p>
                  <p className="text-2xl font-bold">{publishedProperties.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("dashboard.pending_approval", "Pending Approval")}</p>
                  <p className="text-2xl font-bold">{pendingProperties.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("dashboard.total_leads", "Total Leads")}</p>
                  <p className="text-2xl font-bold">{totalLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList>
            <TabsTrigger value="properties">{t("dashboard.my_properties", "My Properties")}</TabsTrigger>
            <TabsTrigger value="ongoing">{t("dashboard.ongoing", "Ongoing")}</TabsTrigger>
            <TabsTrigger value="leads">{t("dashboard.leads", "Leads")}</TabsTrigger>
            <TabsTrigger value="analytics">{t("dashboard.analytics", "Analytics")}</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.property_management", "Property Management")}</CardTitle>
                <CardDescription>
                  {t("dashboard.manage_listings", "Manage your property listings and track their status")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {properties.length === 0 ? (
                  <div className="text-center py-12">
                    <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Get started by listing your first property
                    </p>
                    <Button onClick={() => navigate('/list-property')}>
                      <Plus className="h-4 w-4 mr-2" />
                      List Your First Property
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {properties.map((property) => (
                      <Card key={property.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex space-x-4">
                              <div className="w-24 h-16 bg-muted rounded-lg flex-shrink-0">
                                {property.images && property.images.length > 0 ? (
                                  <img
                                    src={property.images[0]}
                                    alt={property.title}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Building className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{property.title}</h3>
                                <p className="text-muted-foreground">
                                  {property.city}, {property.country}
                                </p>
                                <p className="text-lg font-bold text-primary">
                                  {formatPrice(property.price)}
                                </p>
                                <div className="flex flex-col items-start space-y-1">
                                  <Badge className={getStatusColor(property.status)}>
                                    {property.status}
                                  </Badge>
                                  {property.status === 'rejected' && property.rejection_reason && (
                                    <p className="text-xs text-red-600 mt-1">
                                      Reason: {property.rejection_reason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => setSelectedProperty(property)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => navigate(`/edit-property/${property.id}`)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-destructive" onClick={() => setPropertyToDelete(property)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          
          <TabsContent value="ongoing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ongoing Matters</CardTitle>
                <CardDescription>Pending approvals and newest leads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Pending Properties
                    </h4>
                    {pendingProperties.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No pending properties.</p>
                    ) : (
                      <div className="space-y-3">
                        {pendingProperties.map((p) => (
                          <div key={p.id} className="flex items-center justify-between p-3 rounded border">
                            <div>
                              <p className="font-medium">{p.title}</p>
                              <p className="text-xs text-muted-foreground">{p.city}, {p.country}</p>
                            </div>
                            <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Newest Leads
                    </h4>
                    {recentLeads.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No leads yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {recentLeads.slice(0, 5).map((lead) => (
                          <div key={lead.id} className="p-3 rounded border">
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.email}</p>
                            <p className="text-sm mt-1 line-clamp-2">{lead.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>
                  People interested in your properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentLeads.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
                    <p className="text-muted-foreground">
                      Leads will appear here when people contact you about your properties
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentLeads.map((lead) => (
                      <Card key={lead.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{lead.name}</h4>
                              <p className="text-sm text-muted-foreground">{lead.email}</p>
                              {lead.phone && (
                                <p className="text-sm text-muted-foreground">{lead.phone}</p>
                              )}
                              <p className="text-sm mt-2">{lead.message}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {new Date(lead.created_at).toLocaleDateString()}
                              </p>
                              <Button
                                size="sm"
                                className="mt-2"
                                onClick={() => window.open(`mailto:${lead.email}?subject=Regarding your property inquiry&body=Hi ${lead.name},%0A%0AThank you for your interest in my property. I'd be happy to discuss the details with you.%0A%0ABest regards,%0A${profile?.full_name || 'Property Owner'}`, '_blank')}
                              >
                                Contact Lead
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Performance Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Property Views</span>
                      <span className="font-semibold">2,341</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Leads This Month</span>
                      <span className="font-semibold">{totalLeads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Response Time</span>
                      <span className="font-semibold">2.3 hours</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Euro className="h-5 w-5" />
                    <span>Financial Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Coming soon...</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      
      <AlertDialog open={!!propertyToDelete} onOpenChange={(open) => !open && setPropertyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this property?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the property
              "{propertyToDelete?.title}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProperty} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PropertyDetailModal
        property={selectedProperty}
        isOpen={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </div>
  )
}

export default Dashboard