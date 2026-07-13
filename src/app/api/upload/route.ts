// ============================================
// CreaPulse V2 — File Upload API
// POST /api/upload  — Upload file + optional CV analysis
//
// Vercel-compatible: NO pdf-parse, NO pdfjs-dist, NO canvas, NO DOMMatrix.
// CV analysis uses VLM (Vision Language Model) via z-ai-web-dev-sdk.
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-auth'
import { Errors, handleApiError } from '@/lib/api-response'

// ─── Allowed MIME types ─────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const CV_MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB for CVs

// ─── POST: Upload file ─────────────────────

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const auth = await withAuth(request)
    if (!auth) return auth // Response already sent

    const userId = auth.userId

    // Parse multipart form
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = (formData.get('category') as string) || 'document'

    if (!file) {
      return Errors.badRequest('Aucun fichier fourni.')
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return Errors.badRequest(`Type de fichier non autorisé : ${file.type}. Types acceptés : PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, WebP.`)
    }

    // Validate size
    const isCv = category === 'cv' || file.name.toLowerCase().includes('cv')
    const maxSize = isCv ? CV_MAX_FILE_SIZE : MAX_FILE_SIZE
    if (file.size > maxSize) {
      return Errors.badRequest(
        `Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} Mo). Maximum : ${(maxSize / (1024 * 1024)).toFixed(0)} Mo.`
      )
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    // Store file in database
    const userFile = await db.userFile.create({
      data: {
        userId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        category: isCv ? 'cv' : category,
        fileData: base64Data,
      },
    })

    // ─── CV Analysis with VLM (async, non-blocking) ───
    // Uses GLM Plan (api.z.ai) — pure HTTP, no native deps
    let cvAnalysisResult: { success: boolean; skills?: string[]; summary?: string } | null = null

    if (isCv && file.type === 'application/pdf') {
      cvAnalysisResult = await analyzeCvWithVLM(base64Data, file.name)
    }

    // If CV analysis succeeded, store parsed data
    if (cvAnalysisResult?.success) {
      try {
        await db.cVUpload.create({
          data: {
            userId,
            fileName: file.name,
            cvText: cvAnalysisResult.summary || null,
            parsedSkills: cvAnalysisResult.skills ? JSON.stringify(cvAnalysisResult.skills) : null,
            fileUrl: `/api/upload/${userFile.id}`,
            fileKey: userFile.id,
          },
        })
      } catch (dbErr) {
        console.warn('[Upload] Failed to store CV analysis:', dbErr instanceof Error ? dbErr.message : dbErr)
      }
    }

    // Return success response (compatible with FileUpload component expectations)
    return Response.json({
      success: true,
      data: {
        id: userFile.id,
        name: userFile.fileName,
        size: userFile.fileSize,
        type: userFile.mimeType,
        url: `/api/upload/${userFile.id}`,
        uploadedAt: userFile.createdAt.toISOString(),
        ...(cvAnalysisResult?.success && cvAnalysisResult.skills
          ? { cvAnalysis: { skills: cvAnalysisResult.skills, summary: cvAnalysisResult.summary } }
          : {}),
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── CV Analysis via VLM ──────────────────
// Uses file_url type in z-ai-web-dev-sdk — pure HTTP, no native deps.
// 100% Vercel serverless compatible.

async function analyzeCvWithVLM(
  base64Pdf: string,
  fileName: string,
): Promise<{ success: boolean; skills?: string[]; summary?: string }> {
  try {
    const ZAI = await import('z-ai-web-dev-sdk').then((m) => m.default || m)
    const zai = await ZAI.create()

    const dataUrl = `data:application/pdf;base64,${base64Pdf}`

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyse ce CV (${fileName}) et extrais les informations structurées suivantes :
1. Un résumé professionnel en 2-3 phrases
2. La liste des compétences techniques et soft skills identifiées

Réponds UNIQUEMENT au format JSON suivant, sans markdown, sans explication :
{
  "summary": "Résumé professionnel...",
  "skills": ["Compétence 1", "Compétence 2", "Compétence 3"]
}

Si le fichier n'est pas un CV ou si tu ne peux pas l'analyser, réponds :
{ "error": true, "message": "Description du problème" }`,
            },
            {
              type: 'file_url',
              file_url: { url: dataUrl },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    })

    const content = response.choices?.[0]?.message?.content
    if (!content) {
      console.warn('[CV Analysis] VLM returned empty content')
      return { success: false }
    }

    const clean = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (parsed.error) {
      console.warn('[CV Analysis] VLM detected issue:', parsed.message)
      return { success: false }
    }

    const skills = Array.isArray(parsed.skills) ? parsed.skills.slice(0, 20) : []
    const summary = typeof parsed.summary === 'string' ? parsed.summary : undefined

    console.log(`[CV Analysis] Extracted ${skills.length} skills from ${fileName}`)

    return { success: true, skills, summary }
  } catch (err) {
    console.warn('[CV Analysis] VLM analysis failed (non-blocking):', err instanceof Error ? err.message : err)
    return { success: false }
  }
}