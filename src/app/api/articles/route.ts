import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Public endpoint — articles are shared across all tenants (no tenantId in schema)
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '9', 10)
    const search = searchParams.get('search')
    const featured = searchParams.get('featured') === 'true'

    const where: Record<string, unknown> = { isPublished: true }

    if (category && category !== 'Tous') {
      where.category = category
    }
    if (featured) {
      where.isFeatured = true
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [articles, total] = await Promise.all([
      db.newsArticle.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          content: true,
          category: true,
          imageGradient: true,
          imageUrl: true,
          authorName: true,
          authorRole: true,
          isFeatured: true,
          readTime: true,
          viewCount: true,
          publishedAt: true,
        },
      }),
      db.newsArticle.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        articles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Articles fetch error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur lors du chargement des articles' } },
      { status: 500 }
    )
  }
}
