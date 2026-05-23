import { NextResponse } from 'next/server'

/* ─── Mock center settings ─── */
const centerSettings = {
  center: {
    name: 'GIDEF Créteil',
    siret: '123 456 789 00012',
    address: '12 Rue de la République',
    city: 'Créteil',
    postalCode: '94000',
    region: 'Île-de-France',
    phone: '01 43 77 50 00',
    email: 'contact@lidef-creteil.fr',
    website: 'www.lidef-creteil.fr',
  },
  preferences: {
    language: 'Français',
    timezone: 'Europe/Paris',
    dateFormat: 'JJ/MM/AAAA',
    currency: 'EUR (€)',
    notifications: true,
    emailNotifications: true,
    autoBackup: 'Quotidien',
    theme: 'Système',
  },
  modules: {
    active: [
      'mon-projet', 'riasec', 'parcours-steps', 'tremplin',
      'creasim', 'business-plan', 'juridique',
      'annuaire', 'forum', 'mentorat',
      'dashboard', 'planning', 'livrables',
    ],
    total: 16,
  },
  dataRetention: '3-annees',
  dbStats: {
    totalRecords: 4256,
    storageUsed: '247 Mo',
    beneficiaires: 130,
    conseillers: 7,
    entretiens: 48,
    documents: 342,
  },
}

/* ─── GET: Return center settings ─── */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: centerSettings,
  })
}

/* ─── PUT: Update center settings ─── */
export async function PUT(request: Request) {
  try {
    const body = await request.json()

    // Merge incoming settings with existing
    const updated = {
      ...centerSettings,
      ...(body.center && { center: { ...centerSettings.center, ...body.center } }),
      ...(body.preferences && { preferences: { ...centerSettings.preferences, ...body.preferences } }),
      ...(body.dataRetention && { dataRetention: body.dataRetention }),
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Paramètres mis à jour avec succès',
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Requête invalide' },
      { status: 400 }
    )
  }
}
