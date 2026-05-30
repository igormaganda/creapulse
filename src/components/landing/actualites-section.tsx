'use client'

import { useState, useEffect, useCallback } from 'react'
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
} from 'lucide-react'
import { fadeInUp, staggerContainer, scaleIn } from './landing-shared'

const ARTICLE_CATEGORIES = ['Tous', 'Financement', 'Juridique', 'Marketing', 'Île-de-France', 'Inspiration', 'Outils numériques', 'Événements'] as const
type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]

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

export function ActualitesSection() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<ArticleCategory>('Tous')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [articleOpen, setArticleOpen] = useState(false)

  const fetchArticles = useCallback(async (cat: ArticleCategory, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '9' })
      if (cat !== 'Tous') params.set('category', cat)
      const res = await fetch(`/api/articles?${params}`)
      const data = await res.json()
      if (data.success) {
        setArticles(data.data.articles)
        setTotalPages(data.data.pagination.totalPages)
        setPage(p)
      }
    } catch {
      setArticles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchArticles(category, 1) }, [category, fetchArticles])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <section id="actualites" className="bg-muted/50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="text-center"
        >
          <Badge variant="secondary" className="mb-3">
            <BookOpen className="mr-1 h-3 w-3" />
            Actualités
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Actualités{' '}
            <span className="text-gradient-teal">entrepreneuriales</span>
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Suivez les dernières tendances et actualités pour créateurs d&apos;entreprise
          </p>
        </motion.div>

        {/* Category tabs */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {ARTICLE_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => fetchArticles(cat, 1)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Articles grid */}
        {loading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <CardHeader className="pb-2">
                  <Skeleton className="mb-2 h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="mt-10 text-center">
            <p className="text-muted-foreground">Aucun article dans cette catégorie pour le moment.</p>
          </div>
        ) : (
          <>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer}
              className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {articles.map((article) => (
                <motion.div key={article.id} variants={scaleIn}>
                  <Card
                    className="group h-full cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    onClick={() => { setSelectedArticle(article); setArticleOpen(true) }}
                  >
                    <div className="relative h-36 w-full overflow-hidden">
                      {article.imageUrl ? (
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${article.imageGradient || 'from-teal-600 to-teal-400'}`}
                        >
                          <BookOpen className="h-14 w-14 text-white/70" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="w-fit text-xs">
                          {article.category}
                        </Badge>
                        {article.isFeatured && (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40">
                            <Star className="mr-0.5 h-2.5 w-2.5" />
                            À la une
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="mt-1 text-base leading-snug line-clamp-2">
                        {article.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
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
              <div className="mt-10 text-center">
                <Button variant="outline" onClick={() => fetchArticles(category, page + 1)}>
                  Voir plus d&apos;articles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Article reader sheet */}
        <Sheet open={articleOpen} onOpenChange={setArticleOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            {selectedArticle && (
              <>
                <SheetHeader>
                  <SheetTitle className="pr-4 text-lg leading-snug">
                    {selectedArticle.title}
                  </SheetTitle>
                  <SheetDescription className="pr-4">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge variant="secondary">{selectedArticle.category}</Badge>
                      <span>{formatDate(selectedArticle.publishedAt)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{selectedArticle.readTime} min de lecture</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Par {selectedArticle.authorName} — {selectedArticle.authorRole}</p>
                  </SheetDescription>
                </SheetHeader>
                {selectedArticle.imageUrl && (
                  <div className="mx-6 mt-2 overflow-hidden rounded-lg">
                    <img
                      src={selectedArticle.imageUrl}
                      alt={selectedArticle.title}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                )}
                <div className="px-6 pb-8 prose prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_li]:text-muted-foreground [&_p]:text-muted-foreground [&_a]:text-primary [&_a]:underline">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedArticle.content || '') }} />
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </section>
  )
}
