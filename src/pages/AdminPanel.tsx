import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  AlertTriangle
} from 'lucide-react'
import Navigation from '@/components/Navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Property, Lead, ForumPost, Profile } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'

const AdminPanel = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [pendingProperties, setPendingProperties] = useState<Property[]>([])
  const [pendingPosts, setPendingPosts] = useState<ForumPost[]>([])
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchAdminData()
    }
  }, [user, profile])

  const fetchAdminData = async () => {
    try {
      // Fetch pending properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (propertiesError) throw propertiesError
      setPendingProperties(propertiesData || [])

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
      setAllUsers(usersData || [])

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

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
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
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-4xl font-bold">Admin Panel</h1>
            <p className="text-xl text-muted-foreground">
              Manage users, properties, and content moderation
            </p>
          </div>
        </div>

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
                  <p className="text-2xl font-bold">{pendingProperties.length}</p>
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

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="posts">Forum Posts</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
          </TabsList>

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
                                  <Badge variant="secondary">
                                    {user.role === 'admin' 
                                      ? 'Admin' 
                                      : user.role === 'broker' 
                                        ? 'Real Estate Broker' 
                                        : 'Private Seller'
                                    }
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default AdminPanel