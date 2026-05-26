// ============================================
// CreaPulse V2 — Quiz Leads API
// POST /api/metiers/leads — Save quiz lead form
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'

// ─── Validation schema ─────────────────────

const frenchPhoneRegex = /^0[1-9]\d{8}$/

const LeadBodySchema = z.object({
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  telephone: z
    .string()
    .regex(frenchPhoneRegex, 'Numéro de téléphone invalide (format: 06 XX XX XX XX)')
    .nullable()
    .optional()
    .or(z.literal('')),
  ville: z
    .string()
    .min(2, 'La ville doit contenir au moins 2 caractères')
    .nullable()
    .optional()
    .or(z.literal('')),
  age: z
    .number()
    .int('L\'âge doit être un nombre entier')
    .min(16, 'L\'âge minimum est de 16 ans')
    .max(99, 'L\'âge maximum est de 99 ans')
    .nullable()
    .optional(),
  metierCategory: z.string().min(1, 'La catégorie métier est requise'),
  quizResults: z
    .record(z.unknown())
    .nullable()
    .optional(),
})

// ─── POST: Save quiz lead ──────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = LeadBodySchema.parse(body)

    // Normalize empty strings to null
    const telephone = data.telephone === '' ? null : data.telephone
    const ville = data.ville === '' ? null : data.ville

    // Save to database
    const lead = await db.quizLead.create({
      data: {
        prenom: data.prenom,
        email: data.email,
        telephone,
        ville,
        age: data.age ?? null,
        category: data.metierCategory,
        quizResults: data.quizResults ?? null,
      },
    })

    return success(
      { id: lead.id, prenom: lead.prenom },
      'Vos résultats ont été enregistrés avec succès'
    )
  } catch (err) {
    return handleApiError(err)
  }
}
