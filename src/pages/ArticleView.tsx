import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { ArticleWithAuthor, ArticleFile } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Calendar, User, ArrowLeft, Eye, Download, FileText, ExternalLink } from 'lucide-react'
import TopHeaders from '@/components/TopHeaders'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ArticleView() {
  const { t, lang } = useLanguage();
  const { slug } = useParams()
  const [article, setArticle] = useState<ArticleWithAuthor | null>(null)
  const [files, setFiles] = useState<ArticleFile[]>([])
  const [loading, setLoading] = useState(true)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('')
  const [showPdfModal, setShowPdfModal] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (slug) {
      fetchArticle()
    }
  }, [slug])

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          author_profile:profiles!articles_author_fkey(full_name)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (error) throw error

      setArticle(data)

      // Fetch associated files
      await fetchArticleFiles(data.id)
    } catch (error) {
      console.error('Error fetching article:', error)
      toast({
        title: t("article_view.error", "Error"),
        description: t("article_view.article_not_found", "Article not found or not published"),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchArticleFiles = async (articleId: string) => {
    try {
      // First get the file metadata
      const { data: filesData, error } = await supabase
        .from('article_files')
        .select('*')
        .eq('article_id', articleId)
        .order('is_primary', { ascending: false })
        .order('uploaded_at', { ascending: false })

      if (error) throw error

      // Generate signed URLs for each file
      const filesWithUrls = await Promise.all(
        (filesData || []).map(async (file) => {
          try {
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('article-files')
              .createSignedUrl(file.storage_path, 3600) // 1 hour

            if (signedUrlError) {
              console.error('Error generating signed URL for file:', file.id, signedUrlError)
              return { ...file, signed_url: null }
            }

            return { ...file, signed_url: signedUrlData.signedUrl }
          } catch (error) {
            console.error('Error generating signed URL for file:', file.id, error)
            return { ...file, signed_url: null }
          }
        })
      )

      setFiles(filesWithUrls)
    } catch (error) {
      console.error('Error fetching article files:', error)
    }
  }

  const handlePdfPreview = async (file: ArticleFile) => {
    try {
      setPdfPreviewUrl(file.signed_url || '')
      setShowPdfModal(true)
    } catch (error) {
      console.error('Error generating PDF preview:', error)
      toast({
        title: t("article_view.error", "Error"),
        description: t("article_view.pdf_preview_failed", "Failed to load PDF preview"),
        variant: 'destructive'
      })
    }
  }

  const handlePdfDownload = (file: ArticleFile) => {
    if (file.signed_url) {
      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = file.signed_url
      link.download = file.file_name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: t("article_view.download_started", "Download Started"),
        description: t("article_view.downloading_file", "Downloading {fileName}", { fileName: file.file_name })
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Get language-specific article field
  const getArticleField = (article: ArticleWithAuthor, field: string, fallback: string): string => {
    const languageMap: Record<string, string> = {
      en: "english",
      sv: "swedish",
      fi: "finnish",
      da: "danish",
      nb: "norwegian",
      de: "german",
      fr: "french",
      es: "spanish",
      it: "italian",
      hr: "croatian"
    };

    const languageSuffix = languageMap[lang];
    if (languageSuffix) {
      const translatedField = article[`${languageSuffix}_${field}` as keyof ArticleWithAuthor];
      if (translatedField && typeof translatedField === "string") {
        return translatedField;
      }
    }
    return fallback;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopHeaders showFilters={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <TopHeaders showFilters={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">{t("article_view.article_not_found_title", "Article Not Found")}</h1>
            <p className="text-muted-foreground mb-4">
              {t("article_view.article_not_found_desc", "The article you're looking for doesn't exist or has been removed.")}
            </p>
            <Button asChild>
              <Link to={`/${lang}/articles`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("article_view.back_to_articles", "Back to Articles")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to={`/${lang}/articles`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("article_view.back_to_articles", "Back to Articles")}
            </Link>
          </Button>
        </div>

        {/* Article Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center gap-2 mb-4">
            {article.is_featured && (
              <Badge variant="default" className="text-sm">{t("article_view.featured_article", "Featured Article")}</Badge>
            )}
            <Badge variant="secondary" className="text-sm">{t("article_view.published", "Published")}</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4 leading-tight">
            {getArticleField(article, 'title', article.title)}
          </h1>

          <p className="text-xl text-muted-foreground mb-6">
            {getArticleField(article, 'description', article.excerpt || '')}
          </p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground border-b border-border pb-6">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>
                {t("article_view.by", "By")} {article.author_profile?.full_name || t("article_view.viaestate_team", "ViaEstate Team")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(article.published_at || article.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Article Cover Image */}
        {article.cover_url && (
          <div className="max-w-4xl mx-auto mb-8">
            <img
              src={article.cover_url}
              alt={article.title}
              className="w-full max-h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Article Content */}
        {article.content && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="prose prose-lg max-w-none">
              <div
                className="text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: article.content.replace(/\n/g, '<br>')
                }}
              />
            </div>
          </div>
        )}

        {/* PDF Display */}
        {article.pdf_url && (
          <div className="max-w-4xl mx-auto mb-12">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="h-6 w-6 text-red-500" />
                    {t("article_view.pdf_document", "PDF Document")}
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open(article.pdf_url, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {t("article_view.open_new_tab", "Open in New Tab")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = article.pdf_url!;
                        link.download = article.pdf_title || article.title + '.pdf';
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t("article_view.download", "Download")}
                    </Button>
                  </div>
                </div>

                {/* Embedded PDF Viewer */}
                <div className="overflow-hidden">
                  <iframe
                    src={`${article.pdf_url}#toolbar=0&navpanes=0&zoom=page-fit`}
                    className="w-full h-[800px] border-0"
                    title={`PDF: ${article.pdf_title || article.title}`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional PDF Documents Section (for combined articles) */}
        {files.filter(f => !f.is_primary).length > 0 && (
          <div className="max-w-4xl mx-auto mb-12">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  {t("article_view.additional_documents", "Additional Documents")}
                </h2>

                <div className="space-y-4">
                  {files.filter(f => !f.is_primary).map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-red-500" />
                        <div>
                          <p className="font-medium">{file.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.file_size_bytes)} • PDF Document
                            {file.is_primary && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Primary
                              </Badge>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Dialog open={showPdfModal && pdfPreviewUrl === file.signed_url} onOpenChange={setShowPdfModal}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePdfPreview(file)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {t("article_view.preview", "Preview")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh]">
                            <DialogHeader>
                              <DialogTitle>{file.file_name}</DialogTitle>
                            </DialogHeader>
                            <div className="w-full h-[70vh]">
                              <iframe
                                src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&zoom=page-fit`}
                                className="w-full h-full border-0 rounded"
                                title={`Preview of ${file.file_name}`}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePdfDownload(file)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {t("article_view.download", "Download")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Related Articles / Footer */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="border-t border-border pt-8">
            <p className="text-muted-foreground mb-4">
              {t("article_view.enjoyed_article", "Enjoyed this article? Check out more content on our blog.")}
            </p>
            <Button asChild>
              <Link to="/articles">
                <FileText className="h-4 w-4 mr-2" />
                {t("article_view.browse_all_articles", "Browse All Articles")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}