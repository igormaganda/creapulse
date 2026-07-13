// ============================================
// CreaPulse V2 — File Retrieval API
// GET /api/upload/[id]  — Retrieve uploaded file by ID
// Vercel-compatible: reads base64 from DB, no filesystem
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-auth'
import { Errors, handleApiError } from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await withAuth(request)
    if (!auth) return auth

    const { id } = await params

    const userFile = await db.userFile.findUnique({
      where: { id },
    })

    if (!userFile) {
      return Errors.notFound('Fichier introuvable.')
    }

    // Users can only access their own files (unless admin/counselor)
    if (userFile.userId !== auth.userId && auth.role !== 'ADMIN' && auth.role !== 'COUNSELOR') {
      return Errors.forbidden('Accès refusé à ce fichier.')
    }

    const buffer = Buffer.from(userFile.fileData, 'base64')

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': userFile.mimeType,
        'Content-Disposition': `inline; filename="${userFile.fileName}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'private, max-age=86400',
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}