import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Article, Tag, ArticleFile } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Save, Eye, Upload, X, Plus, FileText } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { extractTextFromPDF } from '@/lib/pdfUtils'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ArticleEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const { t } = useLanguage()
  const isEditing = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [article, setArticle] = useState<Partial<Article>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_url: '',
    status: 'draft',
    is_featured: false
  })

  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [articleFiles, setArticleFiles] = useState<ArticleFile[]>([])
  const [uploadingPdf, setUploadingPdf] = useState(false)

  useEffect(() => {
    fetchTags()
    if (isEditing) {
      fetchArticle()
    }
  }, [id])

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

      setArticleFiles(filesWithUrls)

      // Set PDF fields for primary file
      const primaryFile = filesWithUrls.find(f => f.is_primary)
      if (primaryFile && primaryFile.signed_url) {
        setArticle(prev => ({
          ...prev,
          pdf_url: primaryFile.signed_url,
          pdf_title: primaryFile.file_name,
          pdf_file_size: primaryFile.file_size_bytes
        }))
      }
    } catch (error) {
      console.error('Error fetching article files:', error)
    }
  }

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          article_tags(tag_id, tags(*))
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      setArticle(data)
      setSelectedTags(data.article_tags?.map((at: any) => at.tags) || [])

      // Fetch associated files
      await fetchArticleFiles(data.id)
    } catch (error) {
      console.error('Error fetching article:', error)
      toast({
        title: t("common.error", "Error"),
        description: t("article_editor.error_loading", "Failed to load article"),
        variant: 'destructive'
      })
    }
  }

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name')

      if (error) throw error
      setAvailableTags(data || [])
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 100)
  }

  const handleTitleChange = (title: string) => {
    setArticle(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }))
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: t("common.error", "Error"),
        description: t("article_editor.image_type_error", "Only JPEG, PNG, and WebP images are allowed"),
        variant: 'destructive'
      })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("common.error", "Error"),
        description: t("article_editor.image_size_error", "Image must be less than 5MB"),
        variant: 'destructive'
      })
      return
    }

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `covers/${user?.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath)

      setArticle(prev => ({ ...prev, cover_url: data.publicUrl }))
      toast({
        title: t("common.success", "Success"),
        description: t("article_editor.image_uploaded", "Image uploaded successfully")
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: t("common.error", "Error"),
        description: t("article_editor.image_error", "Failed to upload image"),
        variant: 'destructive'
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handlePdfUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: t("common.error", "Error"),
        description: t("article_editor.pdf_type_error", "Only PDF files are allowed"),
        variant: 'destructive'
      })
      return
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: t("common.error", "Error"),
        description: t("article_editor.pdf_size_error", "File must be less than 20MB"),
        variant: 'destructive'
      })
      return
    }

    setUploadingPdf(true)
    try {
      const timestamp = Date.now()
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = `pdfs/${article.id || 'temp'}/${fileName}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('article-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Create database record
      const fileData = {
        article_id: article.id, // Will be set when article is saved
        file_name: file.name,
        storage_path: filePath,
        content_type: file.type,
        file_size_bytes: file.size,
        uploaded_by: user?.id,
        is_primary: articleFiles.length === 0 // First file is primary by default
      }

      const { data, error } = await supabase
        .from('article_files')
        .insert([fileData])
        .select()
        .single()

      if (error) throw error

      const newFiles = [...articleFiles, data]
      setArticleFiles(newFiles)

      // If this is the first file or it's set as primary, update article PDF fields
      if (data.is_primary) {
        // Generate signed URL for the new primary file
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('article-files')
          .createSignedUrl(data.storage_path, 3600) // 1 hour

        if (signedUrlError) throw signedUrlError

        setArticle(prev => ({
          ...prev,
          pdf_url: signedUrlData.signedUrl,
          pdf_title: data.file_name,
          pdf_file_size: data.file_size_bytes
        }))
      }

      toast({
        title: t("common.success", "Success"),
        description: t("article_editor.pdf_uploaded", "PDF uploaded successfully")
      })
    } catch (error) {
      console.error('Error uploading PDF:', error)
      toast({
        title: t("common.error", "Error"),
        description: t("article_editor.pdf_error", "Failed to upload PDF"),
        variant: 'destructive'
      })
    } finally {
      setUploadingPdf(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      const fileToDelete = articleFiles.find(f => f.id === fileId)
      const wasPrimary = fileToDelete?.is_primary

      const { error } = await supabase
        .from('article_files')
        .delete()
        .eq('id', fileId)

      if (error) throw error

      const remainingFiles = articleFiles.filter(f => f.id !== fileId)
      setArticleFiles(remainingFiles)

      // If the deleted file was primary, handle PDF fields
      if (wasPrimary) {
        if (remainingFiles.length > 0) {
          // Set the first remaining file as primary
          const newPrimaryFile = remainingFiles[0]
          await togglePrimaryFile(newPrimaryFile.id)
        } else {
          // No files left, clear PDF fields
          setArticle(prev => ({
            ...prev,
            pdf_url: undefined,
            pdf_title: undefined,
            pdf_file_size: undefined
          }))
        }
      }

      toast({
        title: t("common.success", "Success"),
        description: t("article_editor.file_deleted", "File deleted successfully")
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: t("common.error", "Error"),
        description: t("article_editor.error_deleting", "Failed to delete file"),
        variant: 'destructive'
      })
    }
  }

  const togglePrimaryFile = async (fileId: string) => {
    try {
      // First, set all files to non-primary
      await supabase
        .from('article_files')
        .update({ is_primary: false })
        .eq('article_id', article.id)

      // Then set the selected file as primary
      const { error } = await supabase
        .from('article_files')
        .update({ is_primary: true })
        .eq('id', fileId)

      if (error) throw error

      const updatedFiles = articleFiles.map(f => ({ ...f, is_primary: f.id === fileId }))
      setArticleFiles(updatedFiles)

      // Update article pdf_url, pdf_title, and pdf_file_size for the primary file
      const primaryFile = updatedFiles.find(f => f.is_primary)
      if (primaryFile) {
        // Generate signed URL for the primary file
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('article-files')
          .createSignedUrl(primaryFile.storage_path, 3600) // 1 hour

        if (signedUrlError) throw signedUrlError

        setArticle(prev => ({
          ...prev,
          pdf_url: signedUrlData.signedUrl,
          pdf_title: primaryFile.file_name,
          pdf_file_size: primaryFile.file_size_bytes
        }))
      } else {
        // No primary file, clear PDF fields
        setArticle(prev => ({
          ...prev,
          pdf_url: undefined,
          pdf_title: undefined,
          pdf_file_size: undefined
        }))
      }

      toast({
        title: t("common.success", "Success"),
        description: t("article_editor.primary_file_updated", "Primary file updated")
      })
    } catch (error) {
      console.error('Error updating primary file:', error)
      toast({
        title: t("common.error", "Error"),
        description: t("article_editor.error_updating_primary", "Failed to update primary file"),
        variant: 'destructive'
      })
    }
  }

  const handleSave = async (publish: boolean = false) => {
    if (!article.title) {
      toast({
        title: t("common.error", "Error"),
        description: t("article_editor.title_required", "Title is required"),
        variant: 'destructive'
      })
      return
    }

    // If no content but PDF files exist, try to extract text from primary PDF
    let contentToUse = article.content
    if (!contentToUse && articleFiles.length > 0) {
      const primaryFile = articleFiles.find(f => f.is_primary) || articleFiles[0]
      if (primaryFile) {
        try {
          setSaving(true)
          toast({
            title: t("article_editor.extracting_text", "Extracting PDF text"),
            description: t("article_editor.extracting_text_desc", "Please wait while we extract text from your PDF...")
          })

          // Get the file from storage to extract text
          const { data, error } = await supabase.storage
            .from('article-files')
            .download(primaryFile.storage_path)

          if (error) throw error

          const extractedText = await extractTextFromPDF(new File([data], primaryFile.file_name))

          if (extractedText.trim()) {
            contentToUse = extractedText
            toast({
              title: t("article_editor.text_extracted", "Text extracted"),
              description: t("article_editor.text_extracted_desc", "PDF text has been extracted and will be used as article content")
            })
          } else {
            toast({
              title: t("article_editor.extraction_failed", "Text extraction failed"),
              description: t("article_editor.extraction_failed_desc", "Could not extract text from PDF. Article will be saved without content."),
              variant: 'destructive'
            })
            // Continue with empty content - user can edit later
            contentToUse = ''
          }
        } catch (error) {
          console.error('Error extracting PDF text:', error)
      toast({
        title: t("article_editor.extraction_failed", "Text extraction failed"),
        description: t("article_editor.extraction_failed_desc", "Could not extract text from PDF. Article will be saved without content."),
        variant: 'destructive'
      })
          // Continue with empty content - user can edit later
          contentToUse = ''
        }
      }
    }

    if (!contentToUse && articleFiles.length === 0) {
      toast({
        title: 'Error',
        description: 'Content is required. Please provide content or upload a PDF file.',
        variant: 'destructive'
      })
      return
    }

    setSaving(true)
    try {
      const articleData = {
        ...article,
        content: contentToUse,
        status: publish ? 'published' : 'draft',
        published_at: publish && !article.published_at ? new Date().toISOString() : article.published_at,
        author: user?.id
      }

      let savedArticle
      if (isEditing) {
        const { data, error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        savedArticle = data
      } else {
        const { data, error } = await supabase
          .from('articles')
          .insert(articleData)
          .select()
          .single()

        if (error) throw error
        savedArticle = data
      }

      // Update tags
      if (isEditing) {
        await supabase
          .from('article_tags')
          .delete()
          .eq('article_id', savedArticle.id)
      }

      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tag => ({
          article_id: savedArticle.id,
          tag_id: tag.id
        }))

        const { error: tagError } = await supabase
          .from('article_tags')
          .insert(tagInserts)

        if (tagError) throw tagError
      }

      // Update file article_id if this was a new article
      if (!isEditing && articleFiles.length > 0) {
        const { error: fileUpdateError } = await supabase
          .from('article_files')
          .update({ article_id: savedArticle.id })
          .is('article_id', null)

        if (fileUpdateError) throw fileUpdateError
      }

      // Log the action
      await supabase.rpc('log_article_action', {
        p_article_id: savedArticle.id,
        p_action: isEditing ? 'update' : 'create'
      })

      toast({
        title: t("common.success", "Success"),
        description: t(isEditing ? "article_editor.success_updated" : "article_editor.success_created", `Article ${isEditing ? 'updated' : 'created'} successfully`)
      })

      if (!isEditing) {
        navigate(`/admin/articles/${savedArticle.id}/edit`)
      }
    } catch (error) {
      console.error('Error saving article:', error)
      toast({
        title: t("common.error", "Error"),
        description: t("article_editor.error_saving", "Failed to save article"),
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddTag = async () => {
    if (!newTagName.trim()) return

    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({ name: newTagName.trim() })
        .select()
        .single()

      if (error) throw error

      setAvailableTags(prev => [...prev, data])
      setSelectedTags(prev => [...prev, data])
      setNewTagName('')
    } catch (error) {
      console.error('Error creating tag:', error)
      toast({
        title: t("common.error", "Error"),
        description: t("article_editor.error_creating_tag", "Failed to create tag"),
        variant: 'destructive'
      })
    }
  }

  const toggleTag = (tag: Tag) => {
    setSelectedTags(prev =>
      prev.find(t => t.id === tag.id)
        ? prev.filter(t => t.id !== tag.id)
        : [...prev, tag]
    )
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? t("article_editor.edit_title", "Edit Article") : t("article_editor.create_title", "Create New Article")}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? t("article_editor.edit_description", "Update your article content") : t("article_editor.create_description", "Write a new article for your blog")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
              <a href={`/articles/${article.slug}`} target="_blank" rel="noopener noreferrer">
                <Eye className="w-4 h-4 mr-2" />
                {t("article_editor.preview", "Preview")}
              </a>
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {t("article_editor.save_draft", "Save Draft")}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            {article.status === 'published' ? t("article_editor.update", "Update") : t("article_editor.publish", "Publish")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("article_editor.basic_info", "Basic Information")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={article.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={t("article_editor.title_placeholder", "Enter article title")}
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={article.slug}
                onChange={(e) => setArticle(prev => ({ ...prev, slug: e.target.value }))}
                placeholder={t("article_editor.slug_placeholder", "url-friendly-slug")}
              />
            </div>
            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={article.excerpt}
                onChange={(e) => setArticle(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder={t("article_editor.excerpt_placeholder", "Brief description of the article")}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={article.is_featured}
                onCheckedChange={(checked) =>
                  setArticle(prev => ({ ...prev, is_featured: checked as boolean }))
                }
              />
               <Label htmlFor="featured">{t("article_editor.featured", "Featured article")}</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("article_editor.cover_image", "Cover Image")}</CardTitle>
          </CardHeader>
          <CardContent>
            {article.cover_url ? (
              <div className="space-y-4">
                <img
                  src={article.cover_url}
                  alt="Cover"
                  className="w-full max-w-md h-48 object-cover rounded-lg"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {t("article_editor.change_image", "Change Image")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setArticle(prev => ({ ...prev, cover_url: '' }))}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t("article_editor.remove", "Remove")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">{t("article_editor.upload_cover_image", "Upload a cover image")}</p>
                <Button
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={uploadingImage}
                >
                  {t("article_editor.choose_file", "Choose File")}
                </Button>
              </div>
            )}
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="hidden"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("article_editor.content", "Content")} {articleFiles.length === 0 ? '*' : '(' + t("article_editor.optional", "optional if PDF uploaded") + ')'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={article.content}
              onChange={(e) => setArticle(prev => ({ ...prev, content: e.target.value }))}
              placeholder={articleFiles.length > 0
                ? t("article_editor.content_placeholder_pdf", "Write your article content here, or leave blank to use extracted PDF text...")
                : t("article_editor.content_placeholder", "Write your article content here...")
              }
              rows={20}
              className="font-mono"
            />
            {articleFiles.length > 0 && !article.content && (
               <p className="text-sm text-muted-foreground mt-2">
               {t("article_editor.content_extraction_info", "Content will be automatically extracted from your uploaded PDF file.")}
               </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("article_editor.tags", "Tags")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder={t("article_editor.add_tag_placeholder", "Add new tag")}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button onClick={handleAddTag} disabled={!newTagName.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.find(t => t.id === tag.id) ? 'default' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("article_editor.documents_attachments", "Documents & Attachments (PDF)")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* PDF Upload Section */}
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  {t("article_editor.upload_pdf_description", "Upload PDF documents to attach to this article")}
                </p>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePdfUpload(file)
                  }}
                  className="hidden"
                  id="pdf-upload"
                  disabled={uploadingPdf}
                />
                <label htmlFor="pdf-upload">
                  <Button variant="outline" disabled={uploadingPdf} asChild>
                    <span>
                      {uploadingPdf ? t("article_editor.uploading", "Uploading...") : t("article_editor.choose_pdf_file", "Choose PDF File")}
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                 {t("article_editor.max_file_size", "Maximum file size: 20 MB")}
                </p>
              </div>

              {/* Uploaded Files List */}
              {articleFiles.length > 0 && (
                <div className="space-y-3">
                   <h4 className="font-medium">{t("article_editor.uploaded_files", "Uploaded Files")}</h4>
                  {articleFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-red-500" />
                        <div>
                          <p className="font-medium">{file.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {file.file_size_bytes < 1024 * 1024
                              ? `${Math.round(file.file_size_bytes / 1024)} KB`
                              : `${(file.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
                            } • PDF Document
                            {file.is_primary && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {t("article_editor.primary", "Primary")}
                              </Badge>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!file.is_primary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePrimaryFile(file.id)}
                          >
                              {t("article_editor.set_primary", "Set Primary")}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(file.signed_url, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                            {t("article_editor.preview", "Preview")}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}