// ============================================
// CreaPulse V2 — Mind Map API
// GET    /api/mind-map          — List user's mind maps (or single by ?id=xxx)
// POST   /api/mind-map          — Create a new mind map
// PUT    /api/mind-map          — Update an existing mind map
// DELETE /api/mind-map          — Delete a mind map
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-auth'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { z } from 'zod'

// ─── Validation Schemas ──────────────────────

const mindMapNodeSchema = z.object({
  id: z.string(),
  text: z.string(),
  x: z.number(),
  y: z.number(),
  parentId: z.string().nullable(),
  color: z.string(),
  children: z.array(z.string()),
})

const createMindMapSchema = z.object({
  title: z.string().max(200).optional(),
  nodes: z.array(mindMapNodeSchema).min(1),
})

const updateMindMapSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(200).optional(),
  nodes: z.array(mindMapNodeSchema).optional(),
})

const deleteMindMapSchema = z.object({
  id: z.string().min(1),
})

// ─── GET: List or retrieve mind maps ─────────

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth || auth instanceof Response) return auth

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      // Return a specific mind map (full with nodes)
      const mindMap = await db.mindMap.findFirst({
        where: { id, userId: auth.userId },
      })

      if (!mindMap) {
        return Errors.notFound('Carte mentale')
      }

      return success(mindMap, 'Carte mentale chargée')
    }

    // Return all mind maps for the user (list without nodes)
    const mindMaps = await db.mindMap.findMany({
      where: { userId: auth.userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return success(mindMaps, 'Cartes mentales chargées')
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Create a new mind map ─────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth || auth instanceof Response) return auth

    const body = await request.json()
    const parsed = createMindMapSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        }))
      )
    }

    const { title, nodes } = parsed.data

    const mindMap = await db.mindMap.create({
      data: {
        userId: auth.userId,
        tenantId: auth.tenantId,
        title: title || 'Sans titre',
        nodes: nodes as unknown as Record<string, unknown>[],
      },
    })

    return success(mindMap, 'Carte mentale créée', 201)
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── PUT: Update an existing mind map ────────

export async function PUT(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth || auth instanceof Response) return auth

    const body = await request.json()
    const parsed = updateMindMapSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        }))
      )
    }

    const { id, title, nodes } = parsed.data

    // Verify ownership
    const existing = await db.mindMap.findFirst({
      where: { id, userId: auth.userId },
    })

    if (!existing) {
      return Errors.notFound('Carte mentale')
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (nodes !== undefined) updateData.nodes = nodes as unknown as Record<string, unknown>[]

    const mindMap = await db.mindMap.update({
      where: { id },
      data: updateData,
    })

    return success(mindMap, 'Carte mentale mise à jour')
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── DELETE: Delete a mind map ───────────────

export async function DELETE(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth || auth instanceof Response) return auth

    const body = await request.json()
    const parsed = deleteMindMapSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        }))
      )
    }

    const { id } = parsed.data

    // Verify ownership
    const existing = await db.mindMap.findFirst({
      where: { id, userId: auth.userId },
    })

    if (!existing) {
      return Errors.notFound('Carte mentale')
    }

    await db.mindMap.delete({
      where: { id },
    })

    return success(null, 'Carte mentale supprimée')
  } catch (err) {
    return handleApiError(err)
  }
}