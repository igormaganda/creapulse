// ============================================
// CreaPulse V2 — File Upload API
// POST /api/upload — Upload files (multipart/form-data)
// Validates type, size, saves to disk, creates DB record
// ============================================

import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { createLogger } from '@/lib/logger'

const logger = createLogger('UploadAPI')

// ─── Configuration ──────────────────────────

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
]

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.jpg', '.jpeg', '.png', '.webp',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const UPLOAD_DIR = '/home/z/my-project/upload'

// ─── POST Handler ───────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Optional auth: try to get user from token
    let userId: string | null = null
    try {
      const token = getTokenFromHeader(request)
      if (token) {
        const payload = await verifyToken(token)
        userId = payload.userId
      }
    } catch {
      // Proceed without auth (public upload allowed)
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      logger.warn('Aucun fichier reçu dans la requête')
      return Errors.validation(null, 'Aucun fichier trouvé dans la requête. Utilisez le champ "file".')
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type) && !isValidExtension(file.name)) {
      logger.warn('Type de fichier non autorisé', { fileName: file.name, fileType: file.type })
      return Errors.validation(
        { allowedTypes: ALLOWED_EXTENSIONS },
        `Type de fichier non autorisé. Types acceptés : ${ALLOWED_EXTENSIONS.join(', ')}`,
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      logger.warn('Fichier trop volumineux', { fileName: file.name, fileSize: file.size })
      return Errors.validation(
        { maxSize: MAX_FILE_SIZE, actualSize: file.size },
        `Fichier trop volumineux. Taille maximale : 10 Mo.`,
      )
    }

    // Reject empty files
    if (file.size === 0) {
      return Errors.validation(null, 'Le fichier est vide.')
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true })

    // Generate unique filename (sanitize extension)
    const timestamp = Date.now()
    const ext = getExtension(file.name)
    const uniqueName = `${timestamp}-${randomUUID()}${ext}`
    const filePath = join(UPLOAD_DIR, uniqueName)

    // Double-check path stays within upload directory
    const resolvedPath = join(process.cwd(), filePath)
    if (!resolvedPath.startsWith(UPLOAD_DIR)) {
      logger.warn('Tentative de path traversal bloquée', { fileName: file.name, resolvedPath })
      return Errors.validation(null, 'Nom de fichier invalide.')
    }

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Build file URL
    const fileUrl = `/upload/${uniqueName}`

    // Determine file category
    const fileType = categorizeFile(file.name, file.type)

    // Create database record if user is authenticated
    if (userId) {
      try {
        if (fileType === 'cv') {
          await db.cvUpload.create({
            data: {
              userId,
              fileName: file.name,
              fileUrl,
              fileKey: uniqueName,
            },
          })
          logger.info('CV uploadé avec succès', { userId, fileName: file.name, fileKey: uniqueName })
        } else {
          // Create a generic livrable record for other file types
          await db.livrable.create({
            data: {
              userId,
              type: 'OTHER',
              title: file.name,
              fileUrl,
              fileName: file.name,
              status: 'READY',
              generatedBy: 'UPLOAD',
            },
          })
          logger.info('Fichier uploadé avec succès', { userId, fileName: file.name, fileKey: uniqueName })
        }
      } catch (dbErr) {
        logger.error('Erreur lors de l\'enregistrement en base', { error: String(dbErr) })
        // File is already saved on disk, continue even if DB fails
      }
    } else {
      logger.info('Fichier uploadé (sans authentification)', { fileName: file.name, fileKey: uniqueName })
    }

    return success(
      {
        id: randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        category: fileType,
        url: fileUrl,
        uploadedAt: new Date().toISOString(),
      },
      'Fichier téléchargé avec succès',
    )
  } catch (err) {
    logger.error('Erreur lors de l\'upload', { error: String(err) })
    return handleApiError(err)
  }
}

// ─── Helpers ────────────────────────────────

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return ''
  const ext = filename.substring(lastDot).toLowerCase()
  // Extra safety: strip any non-alphanumeric characters (prevent path traversal)
  return ext.replace(/[^a-z0-9.]/g, '')
}

function isValidExtension(filename: string): boolean {
  const ext = getExtension(filename)
  return ALLOWED_EXTENSIONS.includes(ext)
}

function categorizeFile(filename: string, mimeType: string): string {
  const lower = filename.toLowerCase()

  // CV detection by name pattern
  if (lower.includes('cv') || lower.includes('curriculum') || lower.includes('resume')) {
    return 'cv'
  }

  // Categorize by extension
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.includes('pdf')) return 'document'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet'

  return 'other'
}
