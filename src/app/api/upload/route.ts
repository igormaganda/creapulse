// ============================================
// CreaPulse V2 — File Upload API
// Accepts multipart/form-data file uploads and returns
// a base64 data URL. Suitable for small files (avatars, docs).
// For production, integrate with S3/Blob storage.
// ============================================

import { NextRequest } from 'next/server'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth, type AuthResult } from '@/lib/api-auth'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]

export async function POST(request: NextRequest) {
  try {
    // Auth check (any authenticated user)
    const auth: AuthResult | NextResponse = await withAuth(request)
    if (!auth || 'status' in auth) return auth as NextResponse
    const { userId } = auth

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return Errors.validation({}, 'Aucun fichier fourni')
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return Errors.validation(
        { maxSize: MAX_FILE_SIZE },
        `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum : 5 Mo.`,
      )
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Errors.validation(
        { allowedTypes: ALLOWED_TYPES },
        `Type de fichier non autorisé : ${file.type}`,
      )
    }

    // Convert file to base64 data URL
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    return success({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: dataUrl,
    }, 'Fichier téléversé avec succès')
  } catch (err) {
    return handleApiError(err)
  }
}