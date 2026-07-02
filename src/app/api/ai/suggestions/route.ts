// ============================================
// Mon Projet — AI Suggestions API
// POST   /api/ai/suggestions  — Sector-based suggestions (z.ai powered + fallback)
// ============================================

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'
import { aiRateLimit } from '@/lib/rate-limit'
import { callZAI, getZAIErrorMessage } from '@/lib/zai-helper'

// ─── Types ───────────────────────────────────

interface SectorSuggestions {
  clients: string[]
  problems: string[]
  advantages: string[]
}

// ─── Hardcoded suggestions by sector (fallback) ─────────

const SECTOR_SUGGESTIONS: Record<string, SectorSuggestions> = {
  'Restauration': {
    clients: ['Restaurants indépendants', 'Chaînes hôtelières et restaurants', 'Traiteurs et entreprises de restauration collective', 'Épiceries fines et boutiques gourmandes', 'Food trucks et cantines d\'entreprise', 'Particuliers passionnés de gastronomie'],
    problems: ['Gestion des stocks et réduction des pertes alimentaires', 'Optimisation des coûts d\'approvisionnement face à l\'inflation', 'Recrutement et fidélisation du personnel en cuisine', 'Mise en conformité avec les normes sanitaires et HACCP', 'Développer une présence en ligne et la livraison'],
    advantages: ['Concept unique et expérience culinaire différenciante', 'Approvisionnement local et circuit court certifié', 'Menu 100% fait maison avec des produits de saison', 'Service ultra-rapide adapté au déjeuner professionnel', 'Concept zéro-déchet et engagement durable'],
  },
  'Restauration / Alimentation': {
    clients: ['Restaurants indépendants', 'Chaînes hôtelières', 'Traiteurs et collectivités', 'Épiceries fines et boutiques gourmandes', 'Food trucks et cantines d\'entreprise', 'Particuliers passionnés de gastronomie'],
    problems: ['Gestion des stocks et pertes alimentaires', 'Optimisation des coûts d\'approvisionnement', 'Recrutement et fidélisation du personnel', 'Conformité aux normes sanitaires et HACCP', 'Développer la présence en ligne et la livraison'],
    advantages: ['Concept unique et expérience culinaire différenciante', 'Approvisionnement local et circuit court', 'Menu 100% fait maison avec produits de saison', 'Service ultra-rapide pour le déjeuner professionnel', 'Engagement zéro-déchet et durable'],
  },
  'Commerce': {
    clients: ['Consommateurs locaux et habitants du quartier', 'E-commerçants en recherche de fournisseurs', 'Commerçants de centre-ville et zones commerciales', 'Professionnels et entreprises locales', 'Collectivités et marchés publics', 'Touristes de passage'],
    problems: ['Faire face à la concurrence des grandes surfaces et du e-commerce', 'Gérer la saisonnalité des ventes et les stocks', 'Assurer la visibilité et l\'attractivité du point de vente', 'Optimiser les marges face à la hausse des coûts', 'Créer une expérience d\'achat différenciante en boutique'],
    advantages: ['Produits locaux et savoir-faire artisanal', 'Conseil personnalisé et proximité avec le client', 'Concept omnicanal (boutique + click-and-collect)', 'Gamme exclusive et produits introuvables ailleurs', 'Programme de fidélité et événements en magasin'],
  },
  'Commerce / Retail': {
    clients: ['Consommateurs locaux', 'E-commerçants en recherche de fournisseurs', 'Commerçants de centre-ville', 'Professionnels et entreprises locales', 'Collectivités et marchés publics', 'Touristes de passage'],
    problems: ['Concurrence des grandes surfaces et du e-commerce', 'Gérer la saisonnalité des ventes et les stocks', 'Visibilité et attractivité du point de vente', 'Optimisation des marges face à la hausse des coûts', 'Créer une expérience d\'achat différenciante'],
    advantages: ['Produits locaux et savoir-faire artisanal', 'Conseil personnalisé et proximité client', 'Concept omnicanal (boutique + click-and-collect)', 'Gamme exclusive et produits introuvables ailleurs', 'Programme de fidélité et événements en magasin'],
  },
  'Services': {
    clients: ['PME en transformation digitale', 'Startups en phase de lancement', 'Entreprises en recherche d\'externalisation', 'Associations et ONG', 'Indépendants et freelances', 'Collectivités territoriales'],
    problems: ['Difficulté à prouver la valeur ajoutée des services proposés', 'Standardisation et packaging des prestations', 'Gérer la dépendance au fondateur et la scalabilité', 'Trouver des clients réguliers et fidéliser la clientèle', 'Se démarquer dans un marché de services saturé'],
    advantages: ['Expertise pointue dans un créneau spécifique', 'Réseau professionnel étendu et référencement clients', 'Approche personnalisée et sur-mesure', 'Tarification transparente et résultats mesurables', 'Certifications et labels de qualité reconnus'],
  },
  'Services / Conseil': {
    clients: ['PME en transformation digitale', 'Startups en phase de lancement', 'Entreprises en recherche d\'externalisation', 'Associations et ONG', 'Indépendants et freelances', 'Collectivités territoriales'],
    problems: ['Prouver la valeur ajoutée des services proposés', 'Standardiser et packager les prestations', 'Gérer la dépendance au fondateur', 'Trouver des clients réguliers', 'Se démarquer dans un marché saturé'],
    advantages: ['Expertise pointue dans un créneau spécifique', 'Réseau professionnel étendu', 'Approche personnalisée et sur-mesure', 'Tarification transparente et résultats mesurables', 'Certifications et labels reconnus'],
  },
  'Tech': {
    clients: ['PME traditionnelles en digitalisation', 'Administrations publiques et collectivités', 'Startups et entreprises innovantes', 'E-commerçants et acteurs du retail', 'Professionnels libéraux et cabinets', 'Grandes entreprises en recherche de solutions sur mesure'],
    problems: ['L\'adoption des nouvelles technologies par les utilisateurs non-techniques', 'La sécurité des données et conformité RGPD', 'L\'intégration avec les systèmes existants des clients', 'L\'obsolescence rapide des technologies', 'Le financement de la R&D et la gestion de la trésorerie'],
    advantages: ['Technologie propriétaire brevetée ou innovante', 'Interface utilisateur intuitive et facile à adopter', 'Support technique réactif 24/7 en français', 'Architecture scalable et performante', 'Intégration native avec les outils du marché (CRM, ERP)'],
  },
  'Technologie / Numérique': {
    clients: ['PME traditionnelles', 'Administrations publiques', 'Startups et entreprises innovantes', 'E-commerçants et acteurs du retail', 'Professionnels libéraux et cabinets', 'Grandes entreprises en recherche de solutions sur mesure'],
    problems: ['Adoption des technologies par les non-techniques', 'Sécurité des données et conformité RGPD', 'Intégration avec les systèmes existants', 'Obsolescence rapide des technologies', 'Financement de la R&D et trésorerie'],
    advantages: ['Technologie propriétaire et innovante', 'Interface intuitive et facile à adopter', 'Support technique 24/7 en français', 'Architecture scalable et performante', 'Intégration native avec les outils du marché'],
  },
  'BTP / Construction': {
    clients: ['Promoteurs immobiliers', 'Particuliers en rénovation', 'Entreprises en construction de locaux professionnels', 'Collectivités en aménagement urbain', 'Architectes et bureaux d\'études', 'Investisseurs immobiliers'],
    problems: ['La pénurie de main-d\'œuvre qualifiée dans le BTP', 'La gestion des délais et des aléas de chantier', 'La hausse du coût des matériaux de construction', 'La mise en conformité aux normes environnementales (RE2020)', 'La concurrence accrue et les prix basés sur les appels d\'offres'],
    advantages: ['Expertise technique certifiée et qualifications reconnues (RGE, etc.)', 'Délais de réalisation respectés et transparence sur le suivi', 'Engagement écologique : matériaux biosourcés et bas carbone', 'Réseau de fournisseurs fiables et prix négociés', 'Innovation : utilisation de la modélisation BIM'],
  },
  'Santé': {
    clients: ['Professionnels de santé (médecins, infirmiers)', 'Centres de soins et cliniques', 'Établissements de santé et hôpitaux', 'Personnes âgées et structures d\'hébergement', 'Entreprises pour la santé au travail', 'Particuliers soucieux de leur bien-être'],
    problems: ['L\'accès aux soins dans les zones sous-dotées', 'La charge administrative et la gestion des dossiers patients', 'Le coût des équipements médicaux et technologiques', 'L\'adaptation aux nouvelles réglementations de santé', 'La fidélisation des patients et la relation de confiance'],
    advantages: ['Approche holistique centrée sur le patient', 'Technologie innovante (téléconsultation, objets connectés)', 'Équipe multidisciplinaire qualifiée et expérimentée', 'Protocoles personnalisés et suivis sur-mesure', 'Partenariats avec les acteurs de santé locaux'],
  },
  'Santé / Bien-être': {
    clients: ['Professionnels de santé', 'Centres de soins', 'Établissements de santé et hôpitaux', 'Personnes âgées et structures d\'hébergement', 'Entreprises pour la santé au travail', 'Particuliers soucieux de leur bien-être'],
    problems: ['Accès aux soins dans les zones sous-dotées', 'Charge administrative et gestion des dossiers patients', 'Coût des équipements médicaux et technologiques', 'Adaptation aux nouvelles réglementations', 'Fidélisation des patients'],
    advantages: ['Approche holistique centrée sur le patient', 'Technologie innovante (téléconsultation, connectés)', 'Équipe multidisciplinaire qualifiée', 'Protocoles personnalisés et suivis sur-mesure', 'Partenariats avec les acteurs de santé locaux'],
  },
  'Éducation': {
    clients: ['Entreprises en formation continue', 'Particuliers en reconversion professionnelle', 'Établissements scolaires et universités', 'Organismes de formation certifiés', 'Collectivités en politique éducative', 'Parents et étudiants en quête de coaching'],
    problems: ['L\'obsolescence rapide des contenus de formation', 'La mesure de l\'efficacité et du ROI des formations', 'L\'engagement et la motivation des apprenants à distance', 'Le financement et la prise en charge par les OPCO', 'L\'adaptation aux nouveaux métiers et compétences digitales'],
    advantages: ['Pédagogie innovante et immersive (gamification, micro-learning)', 'Certifications reconnues et badge compétences', 'Contenus actualisés en temps réel par des experts métier', 'Accompagnement personnalisé avec mentorat', 'Plateforme accessible et mobile-first'],
  },
  'Éducation / Formation': {
    clients: ['Entreprises en formation continue', 'Particuliers en reconversion professionnelle', 'Établissements scolaires et universités', 'Organismes de formation certifiés', 'Collectivités en politique éducative', 'Parents et étudiants en quête de coaching'],
    problems: ['Obsolescence rapide des contenus de formation', 'Mesure de l\'efficacité et du ROI des formations', 'Engagement et motivation des apprenants à distance', 'Financement et prise en charge par les OPCO', 'Adaptation aux nouveaux métiers et compétences digitales'],
    advantages: ['Pédagogie innovante et immersive (gamification)', 'Certifications reconnues et badge compétences', 'Contenus actualisés par des experts métier', 'Accompagnement personnalisé avec mentorat', 'Plateforme accessible et mobile-first'],
  },
  'Transport / Logistique': {
    clients: ['E-commerçants et marketplaces', 'Industriels locaux et PME manufacturières', 'Commerçants en livraison de dernier kilomètre', 'Grands distributeurs et centrales d\'achat', 'Entreprises du BTP et matériaux', 'Particuliers en déménagement et livraison express'],
    problems: ['La hausse du coût des carburants et des péages', 'La gestion des tournées et l\'optimisation des itinéraires', 'Le respect des délais de livraison face aux exigences clients', 'La transition vers des véhicules propres et la logistique verte', 'Le recrutement de chauffeurs et logisticiens qualifiés'],
    advantages: ['Flotte moderne et véhicule propres (électrique, GNV)', 'Logistique optimisée par IA et traçabilité en temps réel', 'Réseau de partenaires locaux et hubs de distribution', 'Flexibilité et réactivité pour les livraisons urgentes', 'Tarifs compétitifs et transparence sur les coûts'],
  },
  'Artisanat': {
    clients: ['Particuliers en rénovation et décoration', 'Professionnels et commerçants locaux', 'Promoteurs immobiliers pour les finitions', 'Collectivités en aménagement urbain', 'Architectes d\'intérieur et décorateurs', 'Eventuels fidèles et bouche-à-oreille'],
    problems: ['La transmission du savoir-faire artisanal', 'La concurrence des industriels et produits importés', 'La gestion des commandes et des délais de fabrication', 'Le financement des équipements et matières premières', 'La visibilité et le marketing d\'un artisan local'],
    advantages: ['Savoir-faire artisanal unique et traditions locales', 'Produits sur-mesure et personnalisables', 'Qualité supérieure et durabilité des matériaux', 'Label artisan et certification de l\'entreprise', 'Proxibilité et relation de confiance avec le client'],
  },
}

// ─── Default / fallback suggestions ──────────

const DEFAULT_SUGGESTIONS: SectorSuggestions = {
  clients: ['PME et entrepreneurs locaux', 'Particuliers et consommateurs finaux', 'Grands groupes et entreprises', 'Associations et organisations', 'Administrations et collectivités', 'Startups et entreprises innovantes'],
  problems: ['Un besoin non satisfait par l\'offre actuelle du marché', 'Un processus manuel qui pourrait être automatisé', 'Un manque de visibilité ou d\'accessibilité pour les clients', 'Des coûts trop élevés dans la chaîne de valeur', 'Une expérience client insatisfaisante'],
  advantages: ['Proposition de valeur unique et différenciante', 'Tarification compétitive ou modèle économique innovant', 'Expertise métier approfondie dans le domaine', 'Réseau de partenaires solides', 'Technologie ou processus propriétaire'],
}

// ─── Lookup helper for hardcoded fallback ───

function getSuggestionsForSector(sector: string): SectorSuggestions {
  if (SECTOR_SUGGESTIONS[sector]) return SECTOR_SUGGESTIONS[sector]
  for (const [key, suggestions] of Object.entries(SECTOR_SUGGESTIONS)) {
    if (sector.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(sector.toLowerCase())) return suggestions
  }
  const firstWord = sector.split(/[\s/]/)[0].toLowerCase()
  for (const [key, suggestions] of Object.entries(SECTOR_SUGGESTIONS)) {
    const keyFirstWord = key.split(/[\s/]/)[0].toLowerCase()
    if (firstWord === keyFirstWord) return suggestions
  }
  return DEFAULT_SUGGESTIONS
}

// ─── AI-powered suggestion generator ──────────

async function generateAISuggestions(sector: string, activity?: string): Promise<SectorSuggestions | null> {
  const contextInfo = activity ? `Activité : ${activity}` : ''
  const prompt = `Tu es un expert en création d'entreprise en France. Pour le secteur "${sector}". ${contextInfo}

Génère exactement 5 suggestions pour chacune des 3 catégories suivantes, sous forme de phrases courtes et concises (max 15 mots chacune) :

1. **Clients cibles** — Types de clients potentiels pour ce secteur
2. **Problèmes résolus** — Problèmes concrets que ce type d'entreprise peut résoudre
3. **Avantages concurrentiels** — Atouts différenciants possibles

Réponds UNIQUEMENT au format JSON suivant, sans texte supplémentaire :
{
  "clients": ["client 1", "client 2", "client 3", "client 4", "client 5"],
  "problems": ["problème 1", "problème 2", "problème 3", "problème 4", "problème 5"],
  "advantages": ["avantage 1", "avantage 2", "avantage 3", "avantage 4", "avantage 5"]
}`

  const result = await callZAI(
    [
      { role: 'system', content: 'Tu es un conseiller en création d\'entreprise expert du marché français. Tu fournis des suggestions concrètes et actionnables. Tu réponds uniquement en JSON valide.' },
      { role: 'user', content: prompt },
    ],
    {
      temperature: 0.7,
      max_tokens: 600,
    },
  )

  if (!result.success) return null

  // Parse JSON from the AI response
  const jsonMatch = result.content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null

  try {
    const parsed = JSON.parse(jsonMatch[0])
    if (
      Array.isArray(parsed.clients) && parsed.clients.length >= 3 &&
      Array.isArray(parsed.problems) && parsed.problems.length >= 3 &&
      Array.isArray(parsed.advantages) && parsed.advantages.length >= 3
    ) {
      return {
        clients: parsed.clients.slice(0, 6),
        problems: parsed.problems.slice(0, 5),
        advantages: parsed.advantages.slice(0, 5),
      }
    }
  } catch {}

  return null
}

// ─── POST Handler ─────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Auth required — AI calls have cost implications
    const auth = await withAuth(request)

    // Rate limit: 20 AI requests per minute per user
    const rl = aiRateLimit.check(auth.userId)
    if (!rl.allowed) {
      return Response.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Trop de requêtes IA. Réessayez dans une minute.' } },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        },
      )
    }

    const body = await request.json()
    const { sector, activity, useAI } = body

    if (!sector || typeof sector !== 'string') {
      return success(DEFAULT_SUGGESTIONS, 'Aucun secteur fourni, suggestions par défaut')
    }

    const trimmedSector = sector.trim()

    // Try AI-powered suggestions first (unless explicitly disabled)
    if (useAI !== false) {
      try {
        const aiSuggestions = await generateAISuggestions(trimmedSector, activity)
        if (aiSuggestions) {
          return success(aiSuggestions, 'Suggestions générées par IA')
        }
      } catch {
        // Fall through to hardcoded suggestions
      }
    }

    // Fallback to hardcoded suggestions
    const suggestions = getSuggestionsForSector(trimmedSector)
    return success(suggestions, 'Suggestions sectorielles')
  } catch {
    return success(DEFAULT_SUGGESTIONS, 'Suggestions chargées (par défaut)')
  }
}
