import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Article, ArticleWithAuthor } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'
import { Plus, Edit, Eye, Trash2, Calendar, User, Building2 } from 'lucide-react'

export default function AdminArticles() {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { lang } = useLanguage()

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          author_profile:profiles!articles_author_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setArticles(data || [])
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast({
        title: 'Error',
        description: 'Failed to load articles',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (articleId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published'
      const updateData: any = { status: newStatus }

      if (newStatus === 'published' && !articles.find(a => a.id === articleId)?.published_at) {
        updateData.published_at = new Date().toISOString()
      } else if (newStatus === 'draft') {
        updateData.published_at = null
      }

      const { error } = await supabase
        .from('articles')
        .update(updateData)
        .eq('id', articleId)

      if (error) throw error

      // Log the action
      await supabase.rpc('log_article_action', {
        p_article_id: articleId,
        p_action: newStatus === 'published' ? 'publish' : 'unpublish'
      })

      toast({
        title: 'Success',
        description: `Article ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`
      })

      fetchArticles()
    } catch (error) {
      console.error('Error updating article:', error)
      toast({
        title: 'Error',
        description: 'Failed to update article status',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId)

      if (error) throw error

      // Log the action
      await supabase.rpc('log_article_action', {
        p_article_id: articleId,
        p_action: 'delete'
      })

      toast({
        title: 'Success',
        description: 'Article deleted successfully'
      })

      fetchArticles()
    } catch (error) {
      console.error('Error deleting article:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete article',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'archived':
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">
              <span className="text-muted-foreground">Via</span>
              <span className="text-primary">Estate</span>
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Articles Management</h1>
            <p className="text-muted-foreground">Manage your blog articles</p>
          </div>
        </div>
        <Button asChild>
          <Link to="/admin/articles/new">
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Link>
        </Button>
      </div>

      {articles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
              <p className="text-muted-foreground mb-4">Create your first article to get started</p>
              <Button asChild>
                <Link to="/admin/articles/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Article
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{article.title}</h3>
                      {getStatusBadge(article.status)}
                      {article.is_featured && (
                        <Badge variant="default">Featured</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {article.author_profile?.full_name || 'Unknown'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {article.published_at
                          ? new Date(article.published_at).toLocaleDateString()
                          : 'Not published'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/${lang}/articles/${article.slug}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/articles/${article.id}/edit`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant={article.status === 'published' ? 'secondary' : 'default'}
                      size="sm"
                      onClick={() => handlePublish(article.id, article.status)}
                    >
                      {article.status === 'published' ? 'Unpublish' : 'Publish'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Article</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{article.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(article.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}