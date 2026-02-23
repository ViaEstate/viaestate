import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Article, ArticleSearchResult } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Search, Calendar, User, ChevronRight, FileText } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Articles() {
  const { t, lang } = useLanguage()
  const [articles, setArticles] = useState<Article[]>([])
  const [searchResults, setSearchResults] = useState<ArticleSearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const { toast } = useToast()

  const ARTICLES_PER_PAGE = 10

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async (page = 1, append = false) => {
    try {
      const from = (page - 1) * ARTICLES_PER_PAGE
      const to = from + ARTICLES_PER_PAGE - 1

      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          author_profile:profiles!articles_author_fkey(full_name)
        `, { count: 'exact' })
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      if (append) {
        setArticles(prev => [...prev, ...(data || [])])
      } else {
        setArticles(data || [])
      }

      // Check if there are more articles
      setHasMore((data?.length || 0) === ARTICLES_PER_PAGE)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast({
        title: t("common.error", "Error"),
        description: t("articles.load_failed", "Failed to load articles"),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      setCurrentPage(1)
      setHasMore(true)
      fetchArticles(1, false)
      return
    }

    setIsSearching(true)
    setCurrentPage(1)
    setHasMore(false) // Disable load more during search
    try {
      const { data, error } = await supabase.rpc('search_articles', {
        q: query.trim(),
        lim: 50 // Higher limit for search results
      })

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching articles:', error)
      toast({
        title: 'Search Error',
        description: 'Failed to search articles',
        variant: 'destructive'
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(searchQuery)
  }

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value)
    if (!value.trim()) {
      setSearchResults([])
      setIsSearching(false)
      setCurrentPage(1)
      setHasMore(true)
      fetchArticles(1, false)
    }
  }

  const loadMoreArticles = () => {
    if (!loadingMore && hasMore && !isSearching) {
      setLoadingMore(true)
      fetchArticles(currentPage + 1, true)
    }
  }

  // Get language-specific article field
  const getArticleField = (article: Article, field: string, fallback: string): string => {
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
      const translatedField = article[`${languageSuffix}_${field}` as keyof Article];
      if (translatedField && typeof translatedField === "string") {
        return translatedField;
      }
    }
    return fallback;
  }

  const displayArticles = searchResults.length > 0 ? searchResults : articles

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder={t("articles.search_placeholder", "Search articles...")}
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? t("articles.searching", "Searching...") : t("articles.search", "Search")}
            </Button>
          </form>
          {searchResults.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {t("articles.found_results", "Found")} {searchResults.length} {t("articles.results", "result")}{searchResults.length !== 1 ? t("articles.results_plural", "s") : ''} {t("articles.for_query", "for")} "{searchQuery}"
            </p>
          )}
        </div>

        {/* Articles Feed */}
        {displayArticles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-2xl font-semibold mb-2">
              {searchQuery ? t("articles.no_found", "No articles found") : t("articles.no_published", "No articles published yet")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? t("articles.try_adjust", "Try adjusting your search terms or browse all articles.")
                : t("articles.check_back", "Check back later for new content.")
              }
            </p>
            {searchQuery && (
              <Button onClick={() => {
                setSearchQuery('')
                setSearchResults([])
                setIsSearching(false)
                setCurrentPage(1)
                setHasMore(true)
                fetchArticles(1, false)
              }}>
                {t("articles.view_all", "View All Articles")}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-8">
              {displayArticles.map((article) => (
                <Card key={article.id} className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="md:flex">
                      {/* Article Image or PDF Icon */}
                      <div className="md:w-1/3">
                        {article.cover_url ? (
                          <div className="aspect-video md:aspect-square overflow-hidden">
                            <img
                              src={article.cover_url}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        ) : article.pdf_url ? (
                          <div className="aspect-video md:aspect-square bg-muted flex items-center justify-center">
                            <div className="text-center">
                              <FileText className="h-16 w-16 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm font-medium text-foreground">{t("articles.pdf_document", "PDF Document")}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video md:aspect-square bg-muted flex items-center justify-center">
                            <FileText className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Article Content */}
                      <div className="md:w-2/3 p-6">
                        {/* Article Meta */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {article.is_featured && (
                            <Badge variant="default">{t("articles.featured", "Featured")}</Badge>
                          )}
                          {article.pdf_url && (
                            <Badge variant="secondary">
                              {t("articles.pdf_article", "PDF Article")}
                            </Badge>
                          )}
                          {'rank' in article && (
                            <Badge variant="secondary">
                              {t("articles.match", "Match")}: {(article as ArticleSearchResult).rank.toFixed(1)}
                            </Badge>
                          )}
                        </div>

                        {/* Article Title */}
                        <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                          <Link to={`/${lang}/articles/${article.slug}`}>
                            {getArticleField(article, 'title', article.title)}
                          </Link>
                        </h3>

                        {/* Article Excerpt */}
                        {article.excerpt && (
                          <p className="text-muted-foreground mb-4 line-clamp-3 text-lg leading-relaxed">
                            {getArticleField(article, 'description', article.excerpt)}
                          </p>
                        )}

                        {/* PDF Info */}
                        {article.pdf_url && (
                          <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-foreground">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">{t("articles.pdf_available", "PDF Document Available")}</span>
                            </div>
                            {article.pdf_title && (
                              <p className="text-sm text-muted-foreground mt-1">{article.pdf_title}</p>
                            )}
                            {article.pdf_file_size && (
                              <p className="text-xs text-muted-foreground">
                                {(article.pdf_file_size / 1024 / 1024).toFixed(1)} MB
                              </p>
                            )}
                          </div>
                        )}

                        {/* Article Footer */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {'author_profile' in article && article.author_profile?.full_name
                                ? article.author_profile.full_name
                                : t("articles.viaestate_team", "ViaEstate Team")
                              }
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(article.published_at || article.created_at)}
                            </div>
                          </div>

                          {/* Read More Link */}
                          <Link
                            to={`/${lang}/articles/${article.slug}`}
                            className="inline-flex items-center text-primary hover:text-primary/80 font-medium"
                          >
                            {article.pdf_url && !article.content ? t("articles.view_pdf", "View PDF") : t("articles.read_more", "Read More")}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && !isSearching && !loading && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMoreArticles}
                  disabled={loadingMore}
                  variant="outline"
                  size="lg"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      {t("common.loading", "Loading...")}
                    </>
                  ) : (
                    t("articles.load_more", "Load More Articles")
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Load More / Pagination could be added here */}
        {displayArticles.length > 0 && !searchQuery && (
          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              {t("articles.showing", "Showing")} {displayArticles.length} {t("articles.article", "article")}{displayArticles.length !== 1 ? t("articles.articles", "s") : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}