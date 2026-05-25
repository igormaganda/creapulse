// ============================================
// CreaPulse V2 — Annuaire (Directory) API
// GET /api/annuaire — List actors with filters
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, handleApiError } from '@/lib/api-response'
import type { ActorType } from '@prisma/client'

// ─── GET: List actors with filters ──────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as ActorType | null
    const city = searchParams.get('city')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)

    // Build where clause
    const where: Record<string, unknown> = {}

    if (type && Object.values(ActorType).includes(type)) {
      where.type = type
    }

    if (city && city.trim()) {
      where.city = { contains: city.trim(), mode: 'insensitive' }
    }

    if (featured === 'true') {
      where.featured = true
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { city: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ]
    }

    // Fetch actors
    const [actors, total] = await Promise.all([
      db.actor.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.actor.count({ where }),
    ])

    return success({
      actors: actors.map((a) => {
        // Safely parse services — Prisma Json? may return a string, array, or null
        let parsedServices: string[] | null = null
        if (a.services != null) {
          if (Array.isArray(a.services)) {
            parsedServices = a.services
          } else if (typeof a.services === 'string') {
            try { parsedServices = JSON.parse(a.services) } catch { parsedServices = null }
          }
        }
        return {
          id: a.id,
          name: a.name,
          type: a.type,
          category: a.category,
          city: a.city,
          region: a.region,
          address: a.address,
          phone: a.phone,
          email: a.email,
          website: a.website,
          description: a.description,
          services: parsedServices,
          featured: a.featured,
          successRate: a.successRate,
          createdAt: a.createdAt,
        }
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
