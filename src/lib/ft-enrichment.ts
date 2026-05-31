// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail AI Enrichment
// Construit un contexte textuel résumé pour les prompts IA
// à partir des données France Travail (offres, aides, etc.)
// ═══════════════════════════════════════════════════════════

import {
  FT_API,
  FT_SCOPES,
  cachedFetchFTAPI,
  buildQueryString,
} from './france-travail'

// ─── Types ───────────────────────────────────

export interface FTEnrichmentContext {
  offres?: string
  aides?: string
  formations?: string
  statistiques?: string
  metiers?: string
  evenements?: string
}

export interface FTEnrichmentParams {
  secteur?: string
  region?: string
  departement?: string
  codePostal?: string
  codesRome?: string[]
}

// ─── Helpers de résumé ───────────────────────

interface FTOffre {
  intitule?: string
  description?: string
  lieuTravail?: { libelle?: string }
  contratType?: string
  salaire?: { libelle?: string }
  experienceLibelle?: string
  dateCreation?: string
  romeCode?: string
  romeLibelle?: string
  nomEntreprise?: string
}

interface FTAide {
  titre?: string
  description?: string
  demarches?: { description?: string }[]
  objectifs?: string[]
  publics?: string[]
  montants?: { montant?: string }[]
  url?: string
}

interface FTFormation {
  intitule?: string
  objectif?: string
  resultat?: string
  contenu?: string
  organisme?: { nom?: string }
  lieu?: { libelle?: string }
  duree?: string
  dateDebut?: string
}

interface FTMetier {
  code?: string
  libelle?: string
  appellation?: string
  definition?: string
  competence?: { libelle?: string }[]
  acces?: { description?: string }[]
  conditionExercice?: { libelle?: string }[]
}

interface FTStatistique {
  codeRome?: string
  libelleRome?: string
  nombreOffres?: number
  nombreOffresMensuel?: number
  salaireMoyen?: number
  dureeRecherche?: number
}

interface FTEvenement {
  titre?: string
  description?: string
  lieu?: { libelle?: string }
  dateDebut?: string
  dateFin?: string
  type?: string
  inscriptionUrl?: string
}

/**
 * Résumé des offres d'emploi en français lisible
 */
function summarizeOffres(data: Record<string, unknown>, maxItems = 5): string {
  const resultats = data?.resultats as FTOffre[] | undefined
  if (!Array.isArray(resultats) || resultats.length === 0) {
    return 'Aucune offre d\'emploi correspondant aux critères de recherche.'
  }

  const total = data?.filtresPossibles as Record<string, unknown> | undefined
  const totalStr = typeof total === 'object' ? '' : ''

  const lines = resultats.slice(0, maxItems).map((offre, i) => {
    const parts = [
      `${i + 1}. ${offre.intitule || 'Sans titre'}`,
    ]
    if (offre.nomEntreprise) parts.push(`  Entreprise : ${offre.nomEntreprise}`)
    if (offre.lieuTravail?.libelle) parts.push(`  Lieu : ${offre.lieuTravail.libelle}`)
    if (offre.contratType) parts.push(`  Contrat : ${offre.contratType}`)
    if (offre.salaire?.libelle) parts.push(`  Salaire : ${offre.salaire.libelle}`)
    if (offre.experienceLibelle) parts.push(`  Expérience : ${offre.experienceLibelle}`)
    if (offre.romeLibelle) parts.push(`  Métier (ROME) : ${offre.romeLibelle}`)
    return parts.join('\n')
  })

  let summary = 'Offres d\'emploi pertinentes :\n'
  if (resultats.length > maxItems) {
    summary += `(${resultats.length} résultats trouvés, affichage des ${maxItems} premiers)\n\n`
  } else {
    summary += `(${resultats.length} résultats)\n\n`
  }

  summary += lines.join('\n\n')
  return summary
}

/**
 * Résumé des aides financières en français lisible
 */
function summarizeAides(data: Record<string, unknown>, maxItems = 5): string {
  const aides = data?.resultats as FTAide[] | undefined
  if (!Array.isArray(aides) || aides.length === 0) {
    return 'Aucune aide financière correspondant aux critères de recherche.'
  }

  const lines = aides.slice(0, maxItems).map((aide, i) => {
    const parts = [
      `${i + 1}. ${aide.titre || 'Sans titre'}`,
    ]
    if (aide.description) parts.push(`  Description : ${aide.description.slice(0, 200)}`)
    if (Array.isArray(aide.publics) && aide.publics.length > 0) {
      parts.push(`  Publics : ${aide.publics.slice(0, 3).join(', ')}`)
    }
    if (Array.isArray(aide.montants) && aide.montants.length > 0 && aide.montants[0]?.montant) {
      parts.push(`  Montant : ${aide.montants[0].montant}`)
    }
    if (aide.url) parts.push(`  Lien : ${aide.url}`)
    return parts.join('\n')
  })

  let summary = 'Aides financières disponibles :\n'
  if (aides.length > maxItems) {
    summary += `(${aides.length} résultats trouvés, affichage des ${maxItems} premières)\n\n`
  } else {
    summary += `(${aides.length} résultats)\n\n`
  }

  summary += lines.join('\n\n')
  return summary
}

/**
 * Résumé des formations en français lisible
 */
function summarizeFormations(data: Record<string, unknown>, maxItems = 5): string {
  const formations = data?.resultats as FTFormation[] | undefined
  if (!Array.isArray(formations) || formations.length === 0) {
    return 'Aucune formation correspondant aux critères de recherche.'
  }

  const lines = formations.slice(0, maxItems).map((f, i) => {
    const parts = [
      `${i + 1}. ${f.intitule || 'Sans titre'}`,
    ]
    if (f.objectif) parts.push(`  Objectif : ${f.objectif.slice(0, 200)}`)
    if (f.organisme?.nom) parts.push(`  Organisme : ${f.organisme.nom}`)
    if (f.lieu?.libelle) parts.push(`  Lieu : ${f.lieu.libelle}`)
    if (f.duree) parts.push(`  Durée : ${f.duree}`)
    if (f.dateDebut) parts.push(`  Date début : ${f.dateDebut}`)
    return parts.join('\n')
  })

  let summary = 'Formations disponibles :\n'
  if (formations.length > maxItems) {
    summary += `(${formations.length} résultats trouvés, affichage des ${maxItems} premières)\n\n`
  } else {
    summary += `(${formations.length} résultats)\n\n`
  }

  summary += lines.join('\n\n')
  return summary
}

/**
 * Résumé des métiers ROME en français lisible
 */
function summarizeMetiers(data: Record<string, unknown>, maxItems = 5): string {
  const metiers = data?.resultats as FTMetier[] | undefined
  if (!Array.isArray(metiers) || metiers.length === 0) {
    // Peut aussi être une fiche unique
    if (data?.libelle) {
      const m = data as unknown as FTMetier
      const parts = [`Métier : ${m.libelle}`]
      if (m.definition) parts.push(`Définition : ${m.definition.slice(0, 300)}`)
      if (Array.isArray(m.competence)) {
        const compLabels = m.competence.map(c => c.libelle).filter(Boolean)
        if (compLabels.length > 0) parts.push(`Compétences clés : ${compLabels.slice(0, 6).join(', ')}`)
      }
      if (Array.isArray(m.acces) && m.acces.length > 0) {
        const accessDescs = m.acces.map(a => a.description).filter(Boolean)
        if (accessDescs.length > 0) parts.push(`Accès au métier : ${accessDescs.slice(0, 2).join(' ; ')}`)
      }
      return parts.join('\n')
    }
    return 'Aucun métier correspondant aux critères de recherche.'
  }

  const lines = metiers.slice(0, maxItems).map((m, i) => {
    const parts = [
      `${i + 1}. ${m.libelle || m.appellation || 'Sans nom'}`,
    ]
    if (m.code) parts.push(`  Code ROME : ${m.code}`)
    if (m.definition) parts.push(`  Définition : ${m.definition.slice(0, 150)}`)
    return parts.join('\n')
  })

  let summary = 'Métiers pertinents :\n'
  if (metiers.length > maxItems) {
    summary += `(${metiers.length} résultats trouvés, affichage des ${maxItems} premiers)\n\n`
  } else {
    summary += `(${metiers.length} résultats)\n\n`
  }

  summary += lines.join('\n\n')
  return summary
}

/**
 * Résumé des statistiques en français lisible
 */
function summarizeStatistiques(data: Record<string, unknown>, maxItems = 5): string {
  const stats = data?.resultats as FTStatistique[] | undefined
  if (!Array.isArray(stats) || stats.length === 0) {
    return 'Aucune statistique disponible pour les critères demandés.'
  }

  const lines = stats.slice(0, maxItems).map((s, i) => {
    const parts = [
      `${i + 1}. ${s.libelleRome || 'Sans nom'} (ROME ${s.codeRome || '?'})`,
    ]
    if (s.nombreOffres !== undefined) parts.push(`  Offres disponibles : ${s.nombreOffres}`)
    if (s.nombreOffresMensuel !== undefined) parts.push(`  Offres mensuelles : ${s.nombreOffresMensuel}`)
    if (s.salaireMoyen !== undefined) parts.push(`  Salaire moyen : ${s.salaireMoyen} €`)
    if (s.dureeRecherche !== undefined) parts.push(`  Durée moyenne de recherche : ${s.dureeRecherche} jours`)
    return parts.join('\n')
  })

  let summary = 'Statistiques du marché du travail :\n\n'
  summary += lines.join('\n\n')
  return summary
}

/**
 * Résumé des événements en français lisible
 */
function summarizeEvenements(data: Record<string, unknown>, maxItems = 5): string {
  const events = data?.resultats as FTEvenement[] | undefined
  if (!Array.isArray(events) || events.length === 0) {
    return 'Aucun événement correspondant aux critères de recherche.'
  }

  const lines = events.slice(0, maxItems).map((e, i) => {
    const parts = [
      `${i + 1}. ${e.titre || 'Sans titre'}`,
    ]
    if (e.description) parts.push(`  Description : ${e.description.slice(0, 200)}`)
    if (e.lieu?.libelle) parts.push(`  Lieu : ${e.lieu.libelle}`)
    if (e.dateDebut) parts.push(`  Date début : ${e.dateDebut}`)
    if (e.type) parts.push(`  Type : ${e.type}`)
    if (e.inscriptionUrl) parts.push(`  Inscription : ${e.inscriptionUrl}`)
    return parts.join('\n')
  })

  let summary = 'Événements à venir :\n'
  if (events.length > maxItems) {
    summary += `(${events.length} résultats trouvés, affichage des ${maxItems} premiers)\n\n`
  } else {
    summary += `(${events.length} résultats)\n\n`
  }

  summary += lines.join('\n\n')
  return summary
}

// ─── Fonction principale ─────────────────────

/**
 * Construit un contexte d'enrichissement France Travail pour les prompts IA.
 * Chaque champ est un texte résumé en français, prêt à être injecté dans un prompt.
 * Les appels API sont faits en parallèle pour la performance.
 * En cas d'erreur avec l'API FT, le champ correspondant est omis (jamais d'erreur levée).
 */
export async function buildFTContext(params: FTEnrichmentParams): Promise<FTEnrichmentContext> {
  const { secteur, region, departement, codePostal, codesRome } = params

  const locationFilters = {
    region: region || undefined,
    departement: departement || undefined,
    codePostal: codePostal || undefined,
  }

  // Construire les requêtes en parallèle
  const promises: Promise<void>[] = []
  const context: FTEnrichmentContext = {}

  // 1. Offres d'emploi
  const offreFilters = {
    motsCles: secteur || undefined,
    ...locationFilters,
    per_page: '5',
    sort: '1',
  }
  const offreQS = buildQueryString(offreFilters)
  promises.push(
    cachedFetchFTAPI<Record<string, unknown>>(`${FT_API.OFFRES}${offreQS}`, FT_SCOPES.OFFRES, {
      method: 'POST',
    }).then((data) => {
      if (data) context.offres = summarizeOffres(data)
    }),
  )

  // 2. Aides financières
  const aideFilters = {
    motsCles: secteur || undefined,
    ...locationFilters,
    per_page: '5',
  }
  const aideQS = buildQueryString(aideFilters)
  promises.push(
    cachedFetchFTAPI<Record<string, unknown>>(`${FT_API.AIDES}${aideQS}`, FT_SCOPES.AIDES).then(
      (data) => {
        if (data) context.aides = summarizeAides(data)
      },
    ),
  )

  // 3. Formations
  const formationFilters = {
    motsCles: secteur || undefined,
    ...locationFilters,
    per_page: '5',
  }
  const formationQS = buildQueryString(formationFilters)
  promises.push(
    cachedFetchFTAPI<Record<string, unknown>>(
      `${FT_API.FORMATIONS}${formationQS}`,
      FT_SCOPES.FORMATIONS,
    ).then((data) => {
      if (data) context.formations = summarizeFormations(data)
    }),
  )

  // 4. Statistiques
  const statFilters = {
    codeRome: codesRome?.[0] || undefined,
    codeDepartement: departement || undefined,
    codeRegion: region || undefined,
  }
  const statQS = buildQueryString(statFilters)
  promises.push(
    cachedFetchFTAPI<Record<string, unknown>>(
      `${FT_API.STATISTIQUES}${statQS}`,
      FT_SCOPES.STATISTIQUES,
    ).then((data) => {
      if (data) context.statistiques = summarizeStatistiques(data)
    }),
  )

  // 5. Métiers
  const metierQS = buildQueryString({
    motsCles: secteur || undefined,
    per_page: '5',
  })
  promises.push(
    cachedFetchFTAPI<Record<string, unknown>>(`${FT_API.METIERS}${metierQS}`, FT_SCOPES.METIERS).then(
      (data) => {
        if (data) context.metiers = summarizeMetiers(data)
      },
    ),
  )

  // 6. Événements
  if (codePostal || departement || region) {
    const eventQS = buildQueryString({
      motsCles: secteur || undefined,
      ...locationFilters,
      per_page: '5',
    })
    promises.push(
      cachedFetchFTAPI<Record<string, unknown>>(
        `${FT_API.EVENEMENTS}${eventQS}`,
        FT_SCOPES.EVENEMENTS,
        {
          method: 'POST',
        },
      ).then((data) => {
        if (data) context.evenements = summarizeEvenements(data)
      }),
    )
  }

  // Attendre toutes les requêtes en parallèle
  await Promise.allSettled(promises)

  return context
}

/**
 * Convertit le contexte d'enrichissement en un seul bloc de texte
 * prêt à être injecté dans un prompt IA.
 */
export function contextToPrompt(ctx: FTEnrichmentContext): string {
  const sections: string[] = []

  if (ctx.offres) {
    sections.push(`## Offres d'emploi\n${ctx.offres}`)
  }
  if (ctx.aides) {
    sections.push(`## Aides financières\n${ctx.aides}`)
  }
  if (ctx.formations) {
    sections.push(`## Formations\n${ctx.formations}`)
  }
  if (ctx.metiers) {
    sections.push(`## Métiers\n${ctx.metiers}`)
  }
  if (ctx.statistiques) {
    sections.push(`## Statistiques du marché\n${ctx.statistiques}`)
  }
  if (ctx.evenements) {
    sections.push(`## Événements\n${ctx.evenements}`)
  }

  if (sections.length === 0) {
    return 'Aucune donnée France Travail disponible pour enrichir la réponse.'
  }

  return `---\nDonnées France Travail (contexte réel) :\n\n${sections.join('\n\n')}\n---`
}
