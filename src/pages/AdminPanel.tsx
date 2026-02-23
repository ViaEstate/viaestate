import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Shield,
  Check,
  X,
  Building,
  Users,
  MessageSquare,
  Search,
  Eye,
  TrendingUp,
  AlertTriangle,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Languages,
  Trash2,
  MapPin
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { Property, Lead, ForumPost, Profile } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import PropertyCard from '@/components/PropertyCard'
import LeadDetailsModal from '@/components/LeadDetailsModal'
import HomeKpis from '@/components/HomeKpis'

const AdminPanel = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const [pendingPosts, setPendingPosts] = useState<ForumPost[]>([])
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  // Lead modal states
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [leadModalOpen, setLeadModalOpen] = useState(false)

  // Lead delete states
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null)
  const [deleteLeadDialogOpen, setDeleteLeadDialogOpen] = useState(false)
  const [leadFilter, setLeadFilter] = useState<string | null>(null)
  const [isDeletingLead, setIsDeletingLead] = useState(false)

  // XML Import states
  const [xmlUrl, setXmlUrl] = useState('')
  const [xmlImportResults, setXmlImportResults] = useState<any>(null)
  const [isImportingXml, setIsImportingXml] = useState(false)

  // Property editing states
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    country: "",
    city: "",
    price: "",
    property_type: "",
    property_type_detail: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    plot_area: "",
    distance_to_city: "",
    distance_to_sea: "",
    distance_to_lake: "",
    listing_type: "sale" as "sale" | "rent",
    status: "draft" as "draft" | "pending" | "published" | "rejected",
    owner_id: "",
  })
  const [isSavingProperty, setIsSavingProperty] = useState(false)

  // Translation states
  const [translationResults, setTranslationResults] = useState<any>(null)
  const [isTranslating, setIsTranslating] = useState(false)

  // Bulk selection states
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  // Individual property delete states
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null)
  const [deletePropertyDialogOpen, setDeletePropertyDialogOpen] = useState(false)
  const [isDeletingProperty, setIsDeletingProperty] = useState(false)

  // Country clicks state
  const [countryClicks, setCountryClicks] = useState<{ country: string; click_type: string; count: number }[]>([])
  const [countryClicksLoading, setCountryClicksLoading] = useState(false)

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchAdminData()
    }
  }, [user, profile])

  const fetchAdminData = async () => {
    try {
      // Fetch all properties with owner and package info
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          id, title, description, english_description, country, city, price, status, created_at, images, bedrooms, bathrooms, area, property_type,
          profiles!inner (
            full_name,
            email,
            role
          ),
          packages (
            name,
            price_monthly
          )
        `)
        .order('created_at', { ascending: false })

      if (propertiesError) throw propertiesError
      console.log('Fetched properties:', propertiesData?.length, 'properties');
      // Check if any properties have english_description
      const withEnglishDesc = propertiesData?.filter(p => p.english_description) || [];
      console.log('Properties with english_description:', withEnglishDesc.length);
      setAllProperties(propertiesData || [])

      // Fetch pending forum posts
      const { data: postsData, error: postsError } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (postsError) throw postsError
      setPendingPosts(postsData || [])

      // Fetch all leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (leadsError) throw leadsError
      setAllLeads(leadsData || [])

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError
      console.log('Fetched users:', usersData?.length, 'users');
      setAllUsers(usersData || [])

      // Fetch country clicks statistics
      fetchCountryClicks()

    } catch (error: any) {
      toast({
        title: "Error loading admin data",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCountryClicks = async () => {
    setCountryClicksLoading(true)
    try {
      // Get clicks grouped by country and click_type
      const { data, error } = await supabase
        .from('country_clicks')
        .select('country, click_type')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) {
        console.log('Country clicks table not available yet:', error.message)
        setCountryClicks([])
        return
      }

      if (!data || data.length === 0) {
        setCountryClicks([])
        return
      }

      // Group by country and click_type
      const grouped: Record<string, { view: number; inquiry: number }> = {}
      data.forEach((click: any) => {
        const country = click.country || 'Unknown'
        const clickType = click.click_type || 'view'
        if (!grouped[country]) {
          grouped[country] = { view: 0, inquiry: 0 }
        }
        if (clickType === 'view') {
          grouped[country].view++
        } else {
          grouped[country].inquiry++
        }
      })

      // Convert to array with total count
      const result = Object.entries(grouped).map(([country, counts]) => ({
        country,
        click_type: 'all',
        count: counts.view + counts.inquiry,
        viewCount: counts.view,
        inquiryCount: counts.inquiry
      }))

      // Sort by total count descending
      result.sort((a, b) => b.count - a.count)
      setCountryClicks(result)
    } catch (error: any) {
      console.log('Error fetching country clicks:', error)
      setCountryClicks([])
    } finally {
      setCountryClicksLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: action === 'approve' ? 'approved' : 'rejected' })
        .eq('id', userId)

      if (error) throw error

      toast({
        title: `User ${action === 'approve' ? 'approved' : 'rejected'}`,
        description: `The user account has been ${action === 'approve' ? 'approved' : 'rejected'}.`
      })

      fetchAdminData()
    } catch (error: any) {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      toast({
        title: "Role updated",
        description: `User role has been updated to ${newRole === 'admin' ? 'Admin' : newRole === 'broker' ? 'Real Estate Broker' : 'Private Seller'}.`
      })

      fetchAdminData()
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handlePropertyAction = async (propertyId: string, action: 'published' | 'rejected') => {
    try {
      const updateData: any = { status: action }
      if (action === 'rejected' && rejectionReason.trim()) {
        updateData.rejection_reason = rejectionReason
      }

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', propertyId)

      if (error) throw error

      toast({
        title: `Property ${action === 'published' ? 'approved' : 'rejected'}`,
        description: `The property has been ${action === 'published' ? 'published' : 'rejected'}.`
      })

      setSelectedProperty(null)
      setRejectionReason('')
      fetchAdminData()
    } catch (error: any) {
      toast({
        title: "Error updating property",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handlePostAction = async (postId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('forum_posts')
        .update({ status: action })
        .eq('id', postId)

      if (error) throw error

      toast({
        title: `Post ${action}`,
        description: `The forum post has been ${action}.`
      })

      fetchAdminData()
    } catch (error: any) {
      toast({
        title: "Error updating post",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setEditFormData({
      title: property.title || "",
      description: property.description || "",
      country: property.country || "",
      city: property.city || "",
      price: property.price?.toString() || "",
      property_type: property.property_type || "",
      property_type_detail: property.property_type_detail || "",
      bedrooms: property.bedrooms?.toString() || "",
      bathrooms: property.bathrooms?.toString() || "",
      area: property.area?.toString() || "",
      plot_area: property.plot_area?.toString() || "",
      distance_to_city: property.distance_to_city?.toString() || "",
      distance_to_sea: property.distance_to_sea?.toString() || "",
      distance_to_lake: property.distance_to_lake?.toString() || "",
      listing_type: (property.listing_type as "sale" | "rent") || "sale",
      status: (property.status as "draft" | "pending" | "published" | "rejected") || "draft",
      owner_id: property.owner_id || "",
    });
  };

  const handleSavePropertyEdit = async () => {
    if (!editingProperty) return;

    // Validate required fields
    if (!editFormData.title || !editFormData.description || !editFormData.country || !editFormData.city || !editFormData.price) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingProperty(true);

      const updateData: any = {
        title: editFormData.title,
        description: editFormData.description,
        country: editFormData.country,
        city: editFormData.city,
        price: parseFloat(editFormData.price),
        property_type: editFormData.property_type || null,
        property_type_detail: editFormData.property_type_detail || null,
        bedrooms: editFormData.bedrooms ? parseInt(editFormData.bedrooms) : null,
        bathrooms: editFormData.bathrooms ? parseInt(editFormData.bathrooms) : null,
        area: editFormData.area ? parseInt(editFormData.area) : null,
        plot_area: editFormData.plot_area ? parseInt(editFormData.plot_area) : null,
        distance_to_city: editFormData.distance_to_city ? parseInt(editFormData.distance_to_city) : null,
        distance_to_sea: editFormData.distance_to_sea ? parseInt(editFormData.distance_to_sea) : null,
        distance_to_lake: editFormData.distance_to_lake ? parseInt(editFormData.distance_to_lake) : null,
        listing_type: editFormData.listing_type,
        status: editFormData.status,
        updated_at: new Date().toISOString(),
      };

      // Admins can reassign property ownership
      if (profile?.role === 'admin' && editFormData.owner_id) {
        updateData.owner_id = editFormData.owner_id;
      }

      const { error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", editingProperty.id);

      if (error) throw error;

      toast({
        title: "Property Updated",
        description: "Your property has been successfully updated.",
      });

      setEditingProperty(null);
      fetchAdminData();
    } catch (error: any) {
      console.error("Error updating property:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update property.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProperty(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProperty(null);
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadModalOpen(true);
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;

    setIsDeletingLead(true);
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadToDelete.id);

      if (error) throw error;

      toast({
        title: "Lead deleted",
        description: `Lead from ${leadToDelete.name} has been successfully deleted.`,
      });

      // Refresh the leads data
      fetchAdminData();

      // Close the dialog
      setDeleteLeadDialogOpen(false);
      setLeadToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error deleting lead",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDeletingLead(false);
    }
  };

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;

    setIsDeletingProperty(true);
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyToDelete.id);

      if (error) throw error;

      toast({
        title: "Property deleted",
        description: `Property "${propertyToDelete.title}" has been successfully deleted.`,
      });

      // Refresh the properties data
      fetchAdminData();

      // Close the dialog
      setDeletePropertyDialogOpen(false);
      setPropertyToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error deleting property",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDeletingProperty(false);
    }
  };

  const handleBulkDeleteProperties = async () => {
    if (selectedProperties.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .in('id', selectedProperties);

      if (error) throw error;

      toast({
        title: "Properties deleted",
        description: `${selectedProperties.length} propert${selectedProperties.length === 1 ? 'y has' : 'ies have'} been successfully deleted.`,
      });

      // Refresh the properties data
      fetchAdminData();

      // Clear selection and close the dialog
      setSelectedProperties([]);
      setBulkDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error deleting properties",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handlePropertySelect = (propertyId: string, index: number, event: React.MouseEvent | React.KeyboardEvent) => {
    // Prevent default checkbox behavior to avoid double state updates
    event.preventDefault();
    
    if (event.shiftKey && lastSelectedIndex !== null) {
      // Shift+click: select/deselect all properties in range
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const propertiesInRange = allProperties.slice(start, end + 1);
      
      // Determine if we're selecting or deselecting based on the clicked property's current state
      const isCurrentlySelected = selectedProperties.includes(propertyId);
      const newSelection = new Set(selectedProperties);
      
      propertiesInRange.forEach((property: any) => {
        if (isCurrentlySelected) {
          newSelection.delete(property.id);
        } else {
          newSelection.add(property.id);
        }
      });
      
      setSelectedProperties(Array.from(newSelection));
    } else {
      // Normal click: toggle individual selection
      if (selectedProperties.includes(propertyId)) {
        setSelectedProperties(selectedProperties.filter(id => id !== propertyId));
      } else {
        setSelectedProperties([...selectedProperties, propertyId]);
      }
    }
    
    // Always update the last selected index (anchor point)
    setLastSelectedIndex(index);
  };

  const handleXmlImport = async () => {
    if (!xmlUrl.trim()) {
      toast({
        title: "Missing URL",
        description: "Please provide a valid XML URL.",
        variant: "destructive",
      });
      return;
    }

    setIsImportingXml(true);
    setXmlImportResults(null);

    try {
      // Check if the function exists first
      const { data: functionExists, error: funcError } = await supabase.rpc('process_xml_properties', {
        xml_url: xmlUrl.trim(),
        owner_id: user?.id
      });

      if (funcError) {
        // If function doesn't exist, show a helpful message
        if (funcError.message?.includes('function') || funcError.message?.includes('does not exist')) {
          setXmlImportResults({
            success: false,
            error: 'XML import function not available. Please run the database migration first.'
          });
          toast({
            title: "XML Import Not Available",
            description: "The XML import function needs to be deployed to the database first.",
            variant: "destructive",
          });
          return;
        }
        throw funcError;
      }

      setXmlImportResults(functionExists);

      if (functionExists.success) {
        toast({
          title: "XML Import Completed",
          description: `Successfully imported ${functionExists.created} out of ${functionExists.processed} properties.`,
        });
        fetchAdminData();
      } else {
        toast({
          title: "XML Import Failed",
          description: functionExists.error || "Unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error importing XML:", error);
      toast({
        title: "Import Error",
        description: error?.message || "Failed to import XML properties.",
        variant: "destructive",
      });
      setXmlImportResults({ success: false, error: error?.message });
    } finally {
      setIsImportingXml(false);
    }
  };

  const handleTranslateProperties = async () => {
    setIsTranslating(true);
    setTranslationResults(null);

    try {
      // Call the Supabase Edge Function for translation
      const { data, error } = await supabase.functions.invoke('swift-api');

      if (error) throw error;

      setTranslationResults(data);

      if (data.success) {
        const message = data.wasLimited
          ? `Translated ${data.processed} properties (limited batch). Run again for more.`
          : `Successfully translated ${data.processed} properties.`;
        toast({
          title: "Translation Completed",
          description: message,
        });
        // Add a small delay to ensure database is updated, then refresh
        console.log('Translation successful, refreshing data in 2 seconds...');
        setTimeout(() => {
          console.log('Refreshing admin data...');
          fetchAdminData();
        }, 2000);
      } else {
        toast({
          title: "Translation Failed",
          description: data.error || "Unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error translating properties:", error);
      toast({
        title: "Translation Error",
        description: error?.message || "Failed to translate properties.",
        variant: "destructive",
      });
      setTranslationResults({ success: false, error: error?.message });
    } finally {
      setIsTranslating(false);
    }
  };

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">You don't have permission to access the admin panel.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <HomeKpis />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Users</p>
                  <p className="text-2xl font-bold">{allUsers.filter(u => u.status === 'pending').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Building className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Properties</p>
                  <p className="text-2xl font-bold">{allProperties.filter(p => p.status === 'pending').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Posts</p>
                  <p className="text-2xl font-bold">{pendingPosts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{allUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="properties" className="space-y-6">
           <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="manage-properties">Manage Properties</TabsTrigger>
              <TabsTrigger value="xml-import">XML Import</TabsTrigger>
              <TabsTrigger value="translations">Translations</TabsTrigger>
              <TabsTrigger value="articles">Articles</TabsTrigger>
              <TabsTrigger value="leads">Ongoing Leads</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="forum">Forum</TabsTrigger>
            </TabsList>

          <TabsContent value="properties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Management</CardTitle>
                <CardDescription>
                  Review, approve, or reject property listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allProperties.length > 0 ? (
                    <div>
                      <h4 className="font-semibold mb-4">All Properties</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {allProperties.map((property: any) => (
                          <Card key={property.id} className="flex flex-col">
                            <PropertyCard
                              property={property}
                              onClick={() => {}}
                            />
                            <CardContent className="p-4 flex-grow flex flex-col">
                              <div className="flex-grow">
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <span className="font-semibold">Owner:</span>
                                  <span>{property.profiles.full_name}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <span className="font-semibold">Status:</span>
                                  <Badge 
                                    variant={
                                      property.status === 'published' 
                                        ? 'default' 
                                        : property.status === 'pending' 
                                          ? 'secondary'
                                          : 'destructive'
                                    }
                                  >
                                    {property.status?.charAt(0).toUpperCase() + property.status?.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                              {property.status === 'pending' && (
                                <div className="flex space-x-2 mt-4">
                                  <Button
                                    size="sm"
                                    onClick={() => handlePropertyAction(property.id, 'published')}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedProperty(property)
                                      setIsRejecting(true)
                                      setDialogOpen(true)
                                    }}
                                    className="w-full"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No properties found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage-properties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Management</CardTitle>
                <CardDescription>
                  Create new properties or edit existing ones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button
                      onClick={() => navigate('/list-property')}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create New Property
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/admin')}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Existing Properties
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-4">Quick Actions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4">
                        <h5 className="font-medium mb-2">Property Creation</h5>
                        <p className="text-sm text-muted-foreground mb-3">
                          Add new properties to the platform with full details, images, and pricing.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => navigate('/list-property')}
                          className="w-full"
                        >
                          Start Creating
                        </Button>
                      </Card>

                      <Card className="p-4">
                        <h5 className="font-medium mb-2">Bulk Property Import</h5>
                        <p className="text-sm text-muted-foreground mb-3">
                          Import multiple properties at once using XML files from external sources.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const tabsList = document.querySelector('[role="tablist"]');
                            const xmlTab = tabsList?.querySelector('[value="xml-import"]') as HTMLElement;
                            xmlTab?.click();
                          }}
                          className="w-full"
                        >
                          Go to XML Import
                        </Button>
                      </Card>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-4">Property Editor</h4>

                    {editingProperty ? (
                      <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-lg font-semibold">Editing: {editingProperty.title}</h5>
                          <Button variant="outline" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label htmlFor="edit-title">Title *</Label>
                            <Input
                              id="edit-title"
                              value={editFormData.title}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Property title"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Label htmlFor="edit-description">Description *</Label>
                            <Textarea
                              id="edit-description"
                              value={editFormData.description}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Property description"
                              rows={3}
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-country">Country *</Label>
                            <Input
                              id="edit-country"
                              value={editFormData.country}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, country: e.target.value }))}
                              placeholder="Country"
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-city">City *</Label>
                            <Input
                              id="edit-city"
                              value={editFormData.city}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                              placeholder="City"
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-price">Price *</Label>
                            <Input
                              id="edit-price"
                              type="number"
                              value={editFormData.price}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, price: e.target.value }))}
                              placeholder="Price"
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-property-type">Property Type</Label>
                            <Input
                              id="edit-property-type"
                              value={editFormData.property_type}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, property_type: e.target.value }))}
                              placeholder="e.g., Apartment, House, Villa"
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-bedrooms">Bedrooms</Label>
                            <Input
                              id="edit-bedrooms"
                              type="number"
                              value={editFormData.bedrooms}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                              placeholder="Number of bedrooms"
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-bathrooms">Bathrooms</Label>
                            <Input
                              id="edit-bathrooms"
                              type="number"
                              value={editFormData.bathrooms}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                              placeholder="Number of bathrooms"
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-area">Living Area (m²)</Label>
                            <Input
                              id="edit-area"
                              type="number"
                              value={editFormData.area}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, area: e.target.value }))}
                              placeholder="Living area in square meters"
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-status">Status</Label>
                            <Select
                              value={editFormData.status}
                              onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value as any }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {profile?.role === 'admin' && (
                            <div>
                              <Label htmlFor="edit-owner">Property Owner</Label>
                              <Select
                                value={editFormData.owner_id}
                                onValueChange={(value) => setEditFormData(prev => ({ ...prev, owner_id: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select property owner" />
                                </SelectTrigger>
                                <SelectContent>
                                  {allUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.full_name || user.email} ({user.role})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-4 mt-6">
                          <Button variant="outline" onClick={handleCancelEdit} disabled={isSavingProperty}>
                            Cancel
                          </Button>
                          <Button onClick={handleSavePropertyEdit} disabled={isSavingProperty}>
                            {isSavingProperty ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm text-muted-foreground">
                            Select a property below to edit it directly in the admin panel.
                          </p>
                          {selectedProperties.length > 0 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setBulkDeleteDialogOpen(true)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete Selected ({selectedProperties.length})
                            </Button>
                          )}
                        </div>
                        {allProperties.map((property: any, index: number) => (
                          <div 
                            key={property.id} 
                            className={`flex items-center justify-between p-3 border rounded-lg transition-colors cursor-pointer ${
                              lastSelectedIndex !== null && index >= Math.min(lastSelectedIndex, index) && index <= Math.max(lastSelectedIndex, index) && selectedProperties.length > 1
                                ? 'bg-muted/50' 
                                : ''
                            }`}
                            onClick={(e) => handlePropertySelect(property.id, index, e)}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedProperties.includes(property.id)}
                                readOnly
                              />
                              <div>
                                <h5 className="font-medium">{property.title}</h5>
                                <p className="text-sm text-muted-foreground">
                                  {property.city}, {property.country} • €{property.price?.toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 items-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditProperty(property)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit Here
                              </Button>
                              <Badge variant={property.status === 'published' ? 'default' : 'secondary'}>
                                {property.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setPropertyToDelete(property);
                                  setDeletePropertyDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="xml-import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>XML Property Import</CardTitle>
                <CardDescription>
                  Import multiple properties from an XML file hosted at a URL.
                  Supports both standard format and extended real estate format (xml2u.com compatible).{' '}
                  <a
                    href="/xml-property-schema.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View XML schema documentation
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="xml-url">XML File URL</Label>
                    <Input
                      id="xml-url"
                      type="url"
                      placeholder="https://example.com/properties.xml"
                      value={xmlUrl}
                      onChange={(e) => setXmlUrl(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter the full URL to an XML file containing property data
                    </p>
                  </div>

                  <Button
                    onClick={handleXmlImport}
                    disabled={isImportingXml || !xmlUrl.trim()}
                    className="w-full"
                  >
                    {isImportingXml ? 'Importing...' : 'Import Properties from XML'}
                  </Button>
                </div>

                {/* Import Results */}
                {xmlImportResults && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Import Results</h3>
                    {xmlImportResults.success ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span>Import completed successfully</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Properties processed: {xmlImportResults.processed}</p>
                          <p>Properties created: {xmlImportResults.created}</p>
                          {xmlImportResults.property_ids && xmlImportResults.property_ids.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium">Created property IDs:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {xmlImportResults.property_ids.map((id: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {id.slice(0, 8)}...
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-red-600">
                        <XCircle className="h-5 w-5" />
                        <span>Import failed: {xmlImportResults.error}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Sample XML Format */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-semibold mb-2">Sample XML Format</h4>
                  <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
{`<properties>
 <property>
   <title>Luxury Villa with Sea View</title>
   <description>A beautiful luxury villa...</description>
   <country>Spain</country>
   <city>Barcelona</city>
   <price>850000</price>
   <property_type>villa</property_type>
   <images>
     <image>https://example.com/image1.jpg</image>
   </images>
 </property>
</properties>`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Translations Tab */}
          <TabsContent value="translations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Translations</CardTitle>
                <CardDescription>
                  Translate property descriptions to English for better user experience.
                  This will automatically detect non-English descriptions and create English translations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    Free AI Translation
                  </h4>
                  <p className="text-sm text-green-700 mb-3">
                    Uses smart language detection and client-side translation (Browser API + Google Translate) to automatically translate property descriptions to English.
                    Detects Spanish, French, German, Swedish, Italian and other languages. Translations happen in real-time on property cards.
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={handleTranslateProperties}
                    disabled={isTranslating}
                    className="w-full"
                    size="lg"
                  >
                    {isTranslating ? (
                      <>
                        <Languages className="h-5 w-5 mr-2 animate-spin" />
                        Translating Properties...
                      </>
                    ) : (
                      <>
                        <Languages className="h-5 w-5 mr-2" />
                        Translate All Properties
                      </>
                    )}
                  </Button>
                </div>

                {/* Translation Results */}
                {translationResults && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Translation Results</h3>
                    {translationResults.success ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span>Translation completed successfully</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Total properties: {translationResults.total}</p>
                          <p>Properties translated: {translationResults.processed}</p>
                          <p>Errors: {translationResults.errors}</p>
                          {translationResults.wasLimited && (
                            <p className="text-orange-600 font-medium mt-1">
                              ⚠️ Limited to 10 properties per run. Click again for more.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-red-600">
                        <XCircle className="h-5 w-5" />
                        <span>Translation failed: {translationResults.error}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Migration Instructions */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-semibold mb-2">Manual Database Setup</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    If you need to set up the translation feature manually in Supabase:
                  </p>
                  <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                    <li>Go to your Supabase project dashboard</li>
                    <li>Open the SQL Editor</li>
                    <li>Run the SQL from <code className="bg-background px-1 py-0.5 rounded text-xs">supabase-manual-migration.sql</code></li>
                    <li>Deploy the Edge Function from <code className="bg-background px-1 py-0.5 rounded text-xs">supabase/functions/translate-properties/</code></li>
                    <li>No API keys needed - uses free LibreTranslate service</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="articles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Article Management</CardTitle>
                <CardDescription>
                  Create, edit, and manage blog articles and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button
                      onClick={() => navigate('/admin/articles/new')}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create New Article
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/admin/articles')}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Manage Articles
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-4">Article Types</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-4">
                        <h5 className="font-medium mb-2">Blog Articles</h5>
                        <p className="text-sm text-muted-foreground mb-3">
                          Create rich blog posts with images, formatting, and SEO optimization.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => navigate('/admin/articles/new')}
                          className="w-full"
                        >
                          Create Blog Post
                        </Button>
                      </Card>

                      <Card className="p-4">
                        <h5 className="font-medium mb-2">PDF Articles</h5>
                        <p className="text-sm text-muted-foreground mb-3">
                          Upload PDF documents that will be automatically processed and made searchable.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate('/admin/articles/new')}
                          className="w-full"
                        >
                          Upload PDF
                        </Button>
                      </Card>

                      <Card className="p-4">
                        <h5 className="font-medium mb-2">Combined Content</h5>
                        <p className="text-sm text-muted-foreground mb-3">
                          Create articles with both written content and PDF attachments.
                        </p>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate('/admin/articles/new')}
                          className="w-full"
                        >
                          Create Combined
                        </Button>
                      </Card>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-4">Quick Actions</h4>
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => navigate('/admin/articles')}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Existing Articles
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/articles')}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Public Articles
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Total Properties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{allProperties.length}</div>
                  <p className="text-sm text-muted-foreground">
                    {allProperties.filter(p => p.status === 'published').length} published
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{allUsers.length}</div>
                  <p className="text-sm text-muted-foreground">
                    {allUsers.filter(u => u.status === 'approved').length} approved
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    Forum Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{pendingPosts.length}</div>
                  <p className="text-sm text-muted-foreground">
                    Pending posts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-yellow-600" />
                    Leads Generated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{allLeads.length}</div>
                  <p className="text-sm text-muted-foreground">
                    Total inquiries
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Growth Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Properties this month</span>
                      <span className="font-semibold">
                        {allProperties.filter(p =>
                          new Date(p.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        ).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Users this month</span>
                      <span className="font-semibold">
                        {allUsers.filter(u =>
                          new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        ).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Database: Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">API: Operational</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Storage: Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Country Clicks Statistics */}
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-amber-600" />
                    Europe Map Country Clicks
                  </CardTitle>
                  <CardDescription>
                    Statistics on which countries users click on the interactive Europe map
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {countryClicksLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : countryClicks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No country clicks recorded yet.</p>
                      <p className="text-sm">Clicks will appear here when users interact with the Europe map.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-4 font-semibold text-sm border-b pb-2">
                        <div>Country</div>
                        <div className="text-center">Total Clicks</div>
                        <div className="text-center">Property Views</div>
                        <div className="text-center">Inquiry Requests</div>
                      </div>
                      {countryClicks.slice(0, 15).map((item, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4 text-sm items-center">
                          <div className="font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-amber-600" />
                            {item.country}
                          </div>
                          <div className="text-center">
                            <span className="font-bold text-lg">{item.count}</span>
                          </div>
                          <div className="text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                              {item.viewCount || 0} views
                            </span>
                          </div>
                          <div className="text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs">
                              {item.inquiryCount || 0} inquiries
                            </span>
                          </div>
                        </div>
                      ))}
                      {countryClicks.length > 15 && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          Showing top 15 of {countryClicks.length} countries
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Approve, reject, or manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers.filter(user => user.status === 'pending').length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-4 text-yellow-600">Pending Approvals</h4>
                      <div className="grid gap-4">
                        {allUsers.filter(user => user.status === 'pending').map((user) => (
                          <Card key={user.id} className="border-yellow-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-semibold">{user.full_name}</h5>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                  <Badge variant="secondary" className="mt-1">
                                    {user.role === 'broker' ? 'Real Estate Broker' : 'Private Seller'}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Registered: {new Date(user.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUserAction(user.id, 'approve')}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleUserAction(user.id, 'reject')}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-4">Admin Users</h4>
                    <div className="grid gap-4">
                      {allUsers.filter(user => user.role === 'admin').map((user) => (
                        <Card key={user.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-semibold">{user.full_name}</h5>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="secondary">
                                    Admin
                                  </Badge>
                                  <Badge
                                    variant={
                                      user.status === 'approved'
                                        ? 'default'
                                        : user.status === 'pending'
                                          ? 'secondary'
                                          : 'destructive'
                                    }
                                  >
                                    {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Registered: {new Date(user.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">All Users</h4>
                    <div className="grid gap-4">
                      {allUsers.map((user) => (
                        <Card key={user.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-semibold">{user.full_name}</h5>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Select
                                    value={user.role}
                                    onValueChange={(value) => handleRoleChange(user.id, value)}
                                  >
                                    <SelectTrigger className="w-[180px] h-6 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="broker">Real Estate Broker</SelectItem>
                                      <SelectItem value="private_user">Private Seller</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Badge
                                    variant={
                                      user.status === 'approved'
                                        ? 'default'
                                        : user.status === 'pending'
                                          ? 'secondary'
                                          : 'destructive'
                                    }
                                  >
                                    {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Registered: {new Date(user.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forum" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Forum Posts</CardTitle>
                <CardDescription>
                  Review and manage pending forum posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingPosts.length > 0 ? (
                    <div className="grid gap-4">
                      {pendingPosts.map((post) => (
                        <Card key={post.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-semibold">{post.title}</h5>
                                <p className="text-sm text-muted-foreground mt-1">{post.content.substring(0, 100)}...</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Author: {post.user_id ? 'User' : 'Anonymous'} | Submitted: {new Date(post.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex space-x-2 ml-4">
                                <Button
                                  size="sm"
                                  onClick={() => handlePostAction(post.id, 'approved')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handlePostAction(post.id, 'rejected')}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No pending forum posts.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Leads Management</CardTitle>
                <CardDescription>
                  View and manage property leads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <Select
                    value={leadFilter || 'all'}
                    onValueChange={(value) => setLeadFilter(value === 'all' ? null : value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="inspection">Inspection Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  {allLeads.length > 0 ? (
                    <div className="grid gap-4">
                      {allLeads
                        .filter(lead => !leadFilter || lead.inquiry_type === leadFilter)
                        .map((lead) => (
                        <Card key={lead.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-semibold">{lead.name}</h5>
                                  {lead.inquiry_type === 'inspection' && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                      Inspection
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{lead.email}</p>
                                <p className="text-sm text-muted-foreground">{lead.phone}</p>
                                <p className="text-sm text-muted-foreground mt-1">{lead.message.substring(0, 100)}...</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Property ID: {lead.property_id || 'N/A'} | Submitted: {new Date(lead.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex space-x-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewLead(lead)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setLeadToDelete(lead);
                                    setDeleteLeadDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No leads found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Property</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this property listing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Enter the reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (selectedProperty) {
                    setIsRejecting(true)
                    await handlePropertyAction(selectedProperty.id, 'rejected')
                    setIsRejecting(false)
                    setDialogOpen(false)
                  }
                }}
                disabled={isRejecting || !rejectionReason.trim()}
              >
                {isRejecting ? 'Rejecting...' : 'Reject Property'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Lead Confirmation Dialog */}
        <Dialog open={deleteLeadDialogOpen} onOpenChange={setDeleteLeadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Lead</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this lead? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {leadToDelete && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="space-y-2">
                  <p className="font-medium">{leadToDelete.name}</p>
                  <p className="text-sm text-muted-foreground">{leadToDelete.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Submitted: {new Date(leadToDelete.created_at).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteLeadDialogOpen(false);
                  setLeadToDelete(null);
                }}
                disabled={isDeletingLead}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteLead}
                disabled={isDeletingLead}
              >
                {isDeletingLead ? 'Deleting...' : 'Delete Lead'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Property Confirmation Dialog */}
        <Dialog open={deletePropertyDialogOpen} onOpenChange={setDeletePropertyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Property</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this property? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {propertyToDelete && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="space-y-2">
                  <p className="font-medium">{propertyToDelete.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {propertyToDelete.city}, {propertyToDelete.country} • €{propertyToDelete.price?.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status: {propertyToDelete.status}
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeletePropertyDialogOpen(false);
                  setPropertyToDelete(null);
                }}
                disabled={isDeletingProperty}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProperty}
                disabled={isDeletingProperty}
              >
                {isDeletingProperty ? 'Deleting...' : 'Delete Property'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Properties Confirmation Dialog */}
        <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Multiple Properties</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedProperties.length} propert{selectedProperties.length === 1 ? 'y' : 'ies'}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">
                {selectedProperties.length} propert{selectedProperties.length === 1 ? 'y' : 'ies'} selected for deletion
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This will permanently remove all selected properties from the database.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setBulkDeleteDialogOpen(false);
                }}
                disabled={isBulkDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDeleteProperties}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? 'Deleting...' : `Delete ${selectedProperties.length} Propert${selectedProperties.length === 1 ? 'y' : 'ies'}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <LeadDetailsModal
          lead={selectedLead}
          isOpen={leadModalOpen}
          onClose={() => {
            setLeadModalOpen(false);
            setSelectedLead(null);
          }}
        />
      </main>
    </div>
  )
}

export default AdminPanel