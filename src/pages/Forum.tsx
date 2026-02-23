import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MessageSquare, Plus, Search, Clock, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient';
import { ForumPost } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'

const Forum = () => {
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newPost, setNewPost] = useState({
    title: '',
    content: ''
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('forum_posts')
        .select(`
          *,
          profiles:user_id (
            full_name,
            role
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setPosts(data || [])
    } catch (error: any) {
      toast({
        title: t("forum.error_fetching", "Error fetching posts"),
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: t("forum.please_sign_in", "Please sign in"),
        description: t("forum.login_required", "You need to be logged in to create a post."),
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert({
          title: newPost.title,
          content: newPost.content,
          user_id: user.id,
          status: 'pending'
        })

      if (error) throw error

      toast({
        title: t("forum.post_submitted", "Post submitted!"),
        description: t("forum.post_submitted_desc", "Your post has been submitted for review and will be published soon.")
      })

      setNewPost({ title: '', content: '' })
      setIsCreateDialogOpen(false)
    } catch (error: any) {
      toast({
        title: t("forum.error_creating", "Error creating post"),
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return t("forum.just_now", "Just now")
    if (diffInSeconds < 3600) return t("forum.minutes_ago", "{count} minutes ago").replace("{count}", Math.floor(diffInSeconds / 60).toString())
    if (diffInSeconds < 86400) return t("forum.hours_ago", "{count} hours ago").replace("{count}", Math.floor(diffInSeconds / 3600).toString())
    if (diffInSeconds < 2592000) return t("forum.days_ago", "{count} days ago").replace("{count}", Math.floor(diffInSeconds / 86400).toString())
    
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("forum.new_post", "New Post")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("forum.create_new_post", "Create New Post")}</DialogTitle>
                <DialogDescription>
                  {t("forum.dialog_description", "Share your thoughts, ask questions, or start a discussion with the community. Your post will be reviewed before being published.")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <Label htmlFor="post-title">{t("forum.title", "Title")} *</Label>
                  <Input
                    id="post-title"
                    placeholder={t("forum.title_placeholder", "What's your post about?")}
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="post-content">{t("forum.content", "Content")} *</Label>
                  <Textarea
                    id="post-content"
                    placeholder={t("forum.content_placeholder", "Share your thoughts...")}
                    rows={6}
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    required
                  />
                </div>
                {!user && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {t("forum.please_sign_in_desc", "Please sign in to create a post.")}
                    </p>
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    {t("common.cancel", "Cancel")}
                  </Button>
                  <Button type="submit" disabled={!user}>
                    {t("forum.submit_review", "Submit for Review")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("forum.search_placeholder", "Search forum posts...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t("forum.no_posts_found", "No posts found")}</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? t("forum.try_adjusting_search", "Try adjusting your search terms or browse all posts.")
                  : t("forum.be_first_to_discuss", "Be the first to start a discussion in our community!")
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("forum.create_first_post", "Create First Post")}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post: any) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{post.profiles?.full_name || 'Anonymous'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTimeAgo(post.created_at)}</span>
                        </div>
                        {post.profiles?.role && (
                          <Badge variant="outline">
                            {post.profiles.role === 'broker' ? 'Professional' : 'Community Member'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {post.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Forum