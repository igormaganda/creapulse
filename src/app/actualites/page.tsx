'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import DOMPurify from 'dompurify'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  BookOpen,
  Star,
  Clock,
  ArrowRight,
  Search,
  Home,
  Newspaper,
  X,
} from 'lucide-react'
import { fadeInUp, staggerContainer, scaleIn } from '@/components/landing/landing-shared'

/* ═══════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════ */
const ARTICLE_CATEGORIES = [
  'Tous',
  'Financement',
  'Juridique',
  'Marketing',
  'Île-de-France',
  'Inspiration',
  'Outils numériques',
  'Événements',
] as const
type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]

const PAGE_SIZE = 9

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */
interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  imageGradient: string | null
  imageUrl: string | null
  authorName: string
  authorRole: string
  isFeatured: boolean
  readTime: number
  viewCount: number
  publishedAt: string
}

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */
function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/* ═══════════════════════════════════════════════════════════
   Skeleton loader
   ═══════════════════════════════════════════════════════════ */
function ArticleCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-44 w-full" />
      <CardHeader className="pb-2">
        <Skeleton className="mb-2 h-5 w-24" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="mt-1 h-5 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-4 h-3 w-28" />
      </CardContent>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════ */
export default function ActualitesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<ArticleCategory>('Tous')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [articleOpen, setArticleOpen] = useState(false)

  /* ---------- Fetch ---------- */
  const fetchArticles = useCallback(
    async (cat: ArticleCategory, p: number, q = '') => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(PAGE_SIZE),
        })
        if (cat !== 'Tous') params.set('category', cat)
        if (q.trim()) params.set('search', q.trim())

        const res = await fetch(`/api/articles?${params}`)
        const data = await res.json()

        if (data.success) {
          // If loading page > 1, append; otherwise replace
          setArticles((prev) => (p > 1 ? [...prev, ...data.data.articles] : data.data.articles))
          setTotalPages(data.data.pagination.totalPages)
          setPage(p)
        }
      } catch {
        if (p === 1) setArticles([])
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    fetchArticles(category, 1, search)
  }, [category, search, fetchArticles])

  /* ---------- Handlers ---------- */
  const handleCategoryChange = (cat: ArticleCategory) => {
    setCategory(cat)
    setPage(1)
    setArticles([])
  }

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
    setArticles([])
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
    setArticles([])
  }

  const handleLoadMore = () => {
    fetchArticles(category, page + 1, search)
  }

  const openArticle = (article: Article) => {
    setSelectedArticle(article)
    setArticleOpen(true)
  }

  /* ---------- Render ---------- */
  return (
    <div className="min-h-screen bg-background">
      {/* ─── Hero banner ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent py-16 md:py-24">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mb-6"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <Home className="h-4 w-4" />
              Retour à l&apos;accueil
            </Link>
          </motion.div>

          {/* Title */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center"
          >
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <Newspaper className="h-3.5 w-3.5" />
              Actualités
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Actualités{' '}
              <span className="text-gradient-teal">entrepreneuriales</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Restez informé des dernières tendances, conseils et actualités
              pour les créateurs d&apos;entreprise en Île-de-France.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Filters + Search ─── */}
      <section className="sticky top-16 z-40 border-b border-border/60 glass-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2">
              {ARTICLE_CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Search input */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un article..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-48 pl-8 text-sm sm:w-64"
                />
              </div>
              {(searchInput || search) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearSearch}
                  className="h-9 w-9 shrink-0"
                  title="Effacer la recherche"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Article grid ─── */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading && articles.length === 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(PAGE_SIZE)].map((_, i) => (
                <ArticleCardSkeleton key={i} />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <Newspaper className="mb-4 h-16 w-16 text-muted-foreground/40" />
              <h3 className="text-xl font-semibold text-foreground">
                Aucun article trouvé
              </h3>
              <p className="mt-2 max-w-md text-muted-foreground">
                {search
                  ? `Aucun résultat pour "${search}". Essayez avec d'autres mots-clés.`
                  : 'Il n\'y a pas encore d\'article dans cette catégorie.'}
              </p>
              {(search || category !== 'Tous') && (
                <Button variant="outline" className="mt-6" onClick={handleClearSearch}>
                  Réinitialiser les filtres
                </Button>
              )}
            </motion.div>
          ) : (
            <>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {articles.map((article) => (
                  <motion.div key={article.id} variants={scaleIn}>
                    <Card
                      className="group h-full cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                      onClick={() => openArticle(article)}
                    >
                      {/* Image / Gradient */}
                      <div className="relative h-44 w-full overflow-hidden">
                        {article.imageUrl ? (
                          <Image
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            unoptimized
                          />
                        ) : (
                          <div
                            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${article.imageGradient || 'from-teal-600 to-teal-400'}`}
                          >
                            <BookOpen className="h-16 w-16 text-white/70" />
                          </div>
                        )}
                        {/* Category badge overlay */}
                        <div className="absolute left-3 top-3">
                          <Badge
                            variant="secondary"
                            className="bg-white/90 text-xs backdrop-blur-sm dark:bg-black/60"
                          >
                            {article.category}
                          </Badge>
                        </div>
                        {/* Featured star */}
                        {article.isFeatured && (
                          <div className="absolute right-3 top-3">
                            <Badge className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40">
                              <Star className="h-3 w-3 fill-current" />
                              À la une
                            </Badge>
                          </div>
                        )}
                      </div>

                      <CardHeader className="pb-2">
                        <CardTitle className="text-base leading-snug line-clamp-2">
                          {article.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {article.excerpt}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatDate(article.publishedAt)}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {article.readTime} min
                          </span>
                        </div>
                        <div className="mt-3 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          Lire l&apos;article
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {/* Load more */}
              {page < totalPages && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  className="mt-10 text-center"
                >
                  <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                    {loading ? (
                      'Chargement…'
                    ) : (
                      <>
                        Voir plus d&apos;articles
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ─── Article reader Sheet ─── */}
      <Sheet open={articleOpen} onOpenChange={setArticleOpen}>
        <SheetContent className="w-full overflow-y-auto bg-background p-0 sm:max-w-2xl">
          {selectedArticle && (
            <>
              {/* Header image */}
              {selectedArticle.imageUrl ? (
                <div className="relative h-56 w-full overflow-hidden sm:h-72">
                  <Image
                    src={selectedArticle.imageUrl}
                    alt={selectedArticle.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                </div>
              ) : (
                <div
                  className={`flex h-40 items-center justify-center bg-gradient-to-br ${selectedArticle.imageGradient || 'from-teal-600 to-teal-400'}`}
                >
                  <BookOpen className="h-20 w-20 text-white/70" />
                </div>
              )}

              <SheetHeader className="px-6 pt-4">
                <SheetTitle className="pr-8 text-xl leading-snug">
                  {selectedArticle.title}
                </SheetTitle>
                <SheetDescription className="pr-8">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="secondary">{selectedArticle.category}</Badge>
                    {selectedArticle.isFeatured && (
                      <Badge className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        À la une
                      </Badge>
                    )}
                    <span>{formatDate(selectedArticle.publishedAt)}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {selectedArticle.readTime} min de lecture
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-xs">
                      <span className="font-medium text-foreground">
                        {selectedArticle.authorName}
                      </span>
                      <span className="text-muted-foreground">
                        {' — '}
                        {selectedArticle.authorRole}
                      </span>
                    </div>
                  </div>
                </SheetDescription>
              </SheetHeader>

              <div className="px-6 pb-8 pt-4 prose prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:text-muted-foreground [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_img]:rounded-lg [&_img]:my-4 [&_strong]:text-foreground">
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(selectedArticle.content || ''),
                  }}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
