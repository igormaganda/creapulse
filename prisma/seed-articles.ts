import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: "postgresql://bureau_virtuelle_user:bureau_virtuelle_pass2026@213.199.38.41:5432/bureau_virtuelle",
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const gradients = [
  "from-teal-600 to-teal-400",
  "from-amber-500 to-amber-400",
  "from-coral-500 to-coral-400",
  "from-sky-500 to-sky-400",
  "from-emerald-600 to-emerald-400",
  "from-rose-500 to-rose-400",
  "from-violet-500 to-violet-400",
  "from-orange-500 to-orange-400",
]

// Category-specific Unsplash images (real, stable photo IDs)
const categoryImages: Record<string, string[]> = {
  "Financement": [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1554228811-9504917d4e96?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1553847573-96b3feb46c5f?w=600&h=400&fit=crop",
  ],
  "Juridique": [
    "https://images.unsplash.com/photo-1554228811-9504917d4e96?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop",
  ],
  "Marketing": [
    "https://images.unsplash.com/photo-1553847573-96b3feb46c5f?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=600&h=400&fit=crop",
  ],
  "Île-de-France": [
    "https://images.unsplash.com/photo-1502602898657-3e917605bb28?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=600&h=400&fit=crop",
  ],
  "Inspiration": [
    "https://images.unsplash.com/photo-1559136755-0692d8f5bf55?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=600&h=400&fit=crop",
  ],
  "Outils numériques": [
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1553847573-96b3feb46c5f?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop",
  ],
  "Événements": [
    "https://images.unsplash.com/photo-1540575133075-0f5a29db66a4?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=400&fit=crop",
  ],
}

function g() { return gradients[Math.floor(Math.random() * gradients.length)] }
function d(year: number, month: number, day: number) { return new Date(year, month - 1, day) }
function getImageForCategory(category: string, index: number): string {
  const urls = categoryImages[category] || categoryImages["Inspiration"]!
  return urls[index % urls.length]
}

const articles = [
  // SEPT 2024
  { title: "Rentrée 2024 : les nouvelles aides à la création d'entreprise en Île-de-France", slug: "rentree-2024-aides-creation-ile-de-france", category: "Financement", excerpt: "Découvrez les dispositifs mis en place pour soutenir les créateurs d'entreprise en Île-de-France pour cette rentrée 2024.", publishedAt: d(2024,9,3), readTime: 6, isFeatured: true },
  { title: "Auto-entrepreneur : les seuils de TVA en 2025, ce qui change", slug: "auto-entrepreneur-seuils-tva-2025", category: "Juridique", excerpt: "Les plafonds de chiffre d'affaires pour les auto-entrepreneurs évoluent. Voici ce que vous devez savoir.", publishedAt: d(2024,9,5), readTime: 5 },
  { title: "Comment utiliser l'IA pour rédiger votre business plan", slug: "ia-business-plan-redaction", category: "Outils numériques", excerpt: "L'intelligence artificielle peut vous aider à structurer et rédiger un business plan convaincant. Mode d'emploi.", publishedAt: d(2024,9,8), readTime: 7 },
  { title: "Les 5 erreurs fatales lors du lancement d'une startup", slug: "5-erreurs-fatales-lancement-startup", category: "Inspiration", excerpt: "Évitez les pièges classiques qui font échouer 80% des startups dès leur première année.", publishedAt: d(2024,9,10), readTime: 6 },
  { title: "France Travail : les accompagnements spécifiques pour les créateurs", slug: "france-travail-accompagnement-createurs", category: "Financement", excerpt: "France Travail propose plusieurs dispositifs pour les porteurs de projet. Tour d'horizon complet.", publishedAt: d(2024,9,12), readTime: 5 },
  { title: "Le coworking en Seine-Saint-Denis : top 5 des espaces", slug: "coworking-seine-saint-denis-top-5", category: "Île-de-France", excerpt: "Découvrez les meilleurs espaces de coworking en Seine-Saint-Denis pour lancer votre activité.", publishedAt: d(2024,9,15), readTime: 4 },
  { title: "Stratégie marketing : les bases pour un créateur avec petit budget", slug: "strategie-marketing-petit-budget", category: "Marketing", excerpt: "Pas besoin d'un gros budget pour se faire connaître. Voici des techniques accessibles à tous.", publishedAt: d(2024,9,18), readTime: 6 },
  { title: "SASU ou EURL : comment choisir le bon statut juridique", slug: "sasu-ou-eurl-comment-choisir", category: "Juridique", excerpt: "Face à la complexité des statuts juridiques, notre guide vous aide à faire le bon choix.", publishedAt: d(2024,9,20), readTime: 7 },

  // OCT 2024
  { title: "Salon de l'entrepreneuriat à Paris : nos coups de cœur", slug: "salon-entrepreneuriat-paris-2024", category: "Événements", excerpt: "Le plus grand salon de l'entrepreneuriat revient à Paris. Voici les stands à ne pas manquer.", publishedAt: d(2024,10,2), readTime: 5, isFeatured: true },
  { title: "La transition écologique : une opportunité business", slug: "transition-ecologique-opportunite-business", category: "Inspiration", excerpt: "De plus en plus de consommateurs privilégient les entreprises éco-responsables. Tour du sujet.", publishedAt: d(2024,10,5), readTime: 6 },
  { title: "BPI France : le prêt d'amorçage décrypté", slug: "bpi-france-pret-amorcage-decrypte", category: "Financement", excerpt: "Le prêt d'amorçage de BPI France est un outil essentiel pour les jeunes entreprises. Comment l'obtenir ?", publishedAt: d(2024,10,8), readTime: 7 },
  { title: "Réseaux sociaux : quel calendrier éditorial pour un créateur ?", slug: "reseaux-sociaux-calendrier-editorial-createur", category: "Marketing", excerpt: "Un calendrier éditorial bien pensé est la clé d'une présence sociale efficace. Nos conseils.", publishedAt: d(2024,10,10), readTime: 5 },
  { title: "Les incubateurs de Val-de-Marne pour votre projet", slug: "incubateurs-val-de-marne-projet", category: "Île-de-France", excerpt: "Le Val-de-Marne compte plusieurs incubateurs performants. Tour d'horizon des structures.", publishedAt: d(2024,10,12), readTime: 4 },
  { title: "L'ACRE en 2025 : conditions et démarches", slug: "acre-2025-conditions-demarches", category: "Juridique", excerpt: "L'Aide aux Créateurs et Repreneurs d'Entreprise permet d'exonérer de charges. Les conditions.", publishedAt: d(2024,10,15), readTime: 6 },
  { title: "Outils gratuits pour gérer sa comptabilité d'auto-entrepreneur", slug: "outils-gratuits-comptabilite-auto-entrepreneur", category: "Outils numériques", excerpt: "Découvrez les meilleurs outils gratuits pour suivre votre comptabilité sans être expert.", publishedAt: d(2024,10,18), readTime: 5 },
  { title: "Pitch deck : comment convaincre un investisseur en 5 minutes", slug: "pitch-deck-convaincre-investisseur", category: "Inspiration", excerpt: "Un bon pitch deck doit être concis, percutant et visuel. Voici les règles d'or.", publishedAt: d(2024,10,22), readTime: 6 },
  { title: "Événements entrepreneurship en Île-de-France en novembre 2024", slug: "evenements-entrepreneurship-ile-de-france-novembre-2024", category: "Événements", excerpt: "Calendrier des événements à ne pas manquer pour les entrepreneurs franciliens ce mois-ci.", publishedAt: d(2024,10,25), readTime: 4 },

  // NOV 2024
  { title: "Black Friday : stratégies pour les petites entreprises", slug: "black-friday-strategies-petites-entreprises", category: "Marketing", excerpt: "Le Black Friday n'est pas réservé aux grands groupes. Les TPE peuvent aussi en profiter.", publishedAt: d(2024,11,1), readTime: 5 },
  { title: "Le crowdfunding : financer son projet autrement", slug: "crowdfunding-financer-projet", category: "Financement", excerpt: "Plateformes de don, prêt participatif ou investissement : le panorama du crowdfunding en France.", publishedAt: d(2024,11,4), readTime: 7, isFeatured: true },
  { title: "Yvelines : l'écosystème entrepreneurial en pleine croissance", slug: "yvelines-ecosysteme-entrepreneurial-croissance", category: "Île-de-France", excerpt: "Les Yvelines attirent de plus en plus de créateurs. Découvrez pourquoi et comment.", publishedAt: d(2024,11,7), readTime: 5 },
  { title: "La franchise : une solution pour se lancer avec moins de risque", slug: "franchise-solution-moins-risque", category: "Juridique", excerpt: "Se lancer en franchise permet de bénéficier d'une marque existante. Explications.", publishedAt: d(2024,11,10), readTime: 6 },
  { title: "Créer son site e-commerce en 2024 : les étapes clés", slug: "creer-site-e-commerce-2024-etapes", category: "Outils numériques", excerpt: "De Shopify à WooCommerce, voici un guide complet pour créer votre boutique en ligne.", publishedAt: d(2024,11,13), readTime: 8 },
  { title: "L'entrepreneuriat au féminin en Île-de-France", slug: "entrepreneuriat-feminin-ile-de-france", category: "Inspiration", excerpt: "De plus en plus de femmes créent leur entreprise en Île-de-France. Focus sur cette dynamique.", publishedAt: d(2024,11,16), readTime: 5 },
  { title: "Comment trouver son premier client B2B", slug: "trouver-premier-client-b2b", category: "Marketing", excerpt: "Acquérir son premier client en B2B demande une approche méthodique. Nos conseils pratiques.", publishedAt: d(2024,11,19), readTime: 6 },
  { title: "ARE France Travail : maintenir ses revenus durant la création", slug: "are-france-travail-maintenir-revenus", category: "Financement", excerpt: "L'ARE permet de cumuler allocation chômage et revenus de la nouvelle activité. Les conditions.", publishedAt: d(2024,11,22), readTime: 6 },
  { title: "Hauts-de-Seine : les pépites de l'entrepreneuriat local", slug: "hauts-de-seine-pepites-entrepreneuriat", category: "Île-de-France", excerpt: "Le 92 est un terreau fertile pour les startups. Découvrez les success stories locales.", publishedAt: d(2024,11,25), readTime: 5 },

  // DEC 2024
  { title: "Bilan de fin d'année : les tendances entrepreneuriales 2024", slug: "bilan-fin-annee-tendances-entrepreneuriales-2024", category: "Inspiration", excerpt: "Retour sur les grandes tendances qui ont marqué l'année entrepreneuriale 2024 en France.", publishedAt: d(2024,12,2), readTime: 7, isFeatured: true },
  { title: "Préparer son entreprise pour le 1er janvier : checklist", slug: "preparer-entreprise-1er-janvier-checklist", category: "Juridique", excerpt: "Vous prévoyez de lancer votre activité en début d'année ? Voici la checklist complète.", publishedAt: d(2024,12,5), readTime: 5 },
  { title: "SEO local : comment être visible dans son quartier", slug: "seo-local-visible-quartier", category: "Marketing", excerpt: "Le référencement local est crucial pour les commerces de proximité. Comment l'optimiser.", publishedAt: d(2024,12,8), readTime: 6 },
  { title: "Les subventions régionales Île-de-France pour 2025", slug: "subventions-regionales-ile-de-france-2025", category: "Financement", excerpt: "La Région Île-de-France propose plusieurs aides. Tour d'horizon des dispositifs.", publishedAt: d(2024,12,10), readTime: 6 },
  { title: "Essonne : les ateliers de création d'entreprise", slug: "essonne-ateliers-creation-entreprise", category: "Île-de-France", excerpt: "L'Essonne offre de nombreux ateliers pour les créateurs. Découvrez les programmes disponibles.", publishedAt: d(2024,12,13), readTime: 4 },
  { title: "Notion, Trello ou Asana : quel outil de gestion choisir ?", slug: "notion-trello-asana-outil-gestion", category: "Outils numériques", excerpt: "Comparatif des meilleurs outils de gestion de projet pour les petites équipes.", publishedAt: d(2024,12,15), readTime: 6 },
  { title: "Les rendez-vous entrepreneurship de décembre 2024 en IDF", slug: "rendez-vous-entrepreneurship-decembre-2024-idf", category: "Événements", excerpt: "Networking, ateliers et conférences : le programme entrepreneurial de fin d'année.", publishedAt: d(2024,12,18), readTime: 4 },
  { title: "L'e-commerce éco-responsable : un marché en pleine expansion", slug: "e-commerce-eco-responsable-marche-expansion", category: "Inspiration", excerpt: "Les consommateurs sont de plus en plus sensibles à l'impact environnemental. Opportunités.", publishedAt: d(2024,12,20), readTime: 5 },
  { title: "Micro-entreprise ou SARL : quel régime fiscal choisir ?", slug: "micro-entreprise-sarl-regime-fiscal", category: "Juridique", excerpt: "Le choix du régime fiscal a un impact direct sur vos revenus. Comparatif détaillé.", publishedAt: d(2024,12,23), readTime: 7 },

  // JANVIER 2025
  { title: "Nouvelles aides à la création 2025 : le guide complet", slug: "nouvelles-aides-creation-2025-guide-complet", category: "Financement", excerpt: "L'État a annoncé de nouvelles mesures pour soutenir la création d'entreprise en 2025. Décryptage.", publishedAt: d(2025,1,3), readTime: 7, isFeatured: true },
  { title: "Le réseau GIDEF en Île-de-France : 60 agences à votre service", slug: "reseau-gidef-ile-de-france-agences", category: "Île-de-France", excerpt: "Le GIDEF dispose de 60 agences en Île-de-France. Découvrez comment en bénéficier.", publishedAt: d(2025,1,6), readTime: 5 },
  { title: "L'IA générative pour les entrepreneurs : état des lieux 2025", slug: "ia-generative-entrepreneurs-etat-lieux-2025", category: "Outils numériques", excerpt: "ChatGPT, Claude, Midjourney : comment l'IA transforme la création d'entreprise.", publishedAt: d(2025,1,9), readTime: 7 },
  { title: "Comment protéger sa marque : les bases de la PI", slug: "proteger-marque-bases-propriete-intellectuelle", category: "Juridique", excerpt: "Protéger votre marque, vos designs et vos innovations est essentiel. Guide pratique.", publishedAt: d(2025,1,12), readTime: 6 },
  { title: "5 idées d'entreprise rentables pour 2025", slug: "5-idees-entreprise-rentables-2025", category: "Inspiration", excerpt: "Le marché évolue constamment. Voici 5 secteurs porteurs pour se lancer cette année.", publishedAt: d(2025,1,15), readTime: 6 },
  { title: "Google My Business : l'outil indispensable des commerces locaux", slug: "google-my-business-outil-commerces-locaux", category: "Marketing", excerpt: "Optimiser votre fiche Google My Business est gratuit et très efficace. Mode d'emploi.", publishedAt: d(2025,1,18), readTime: 5 },
  { title: "Ateliers entrepreneurship à Paris en janvier 2025", slug: "ateliers-entrepreneurship-paris-janvier-2025", category: "Événements", excerpt: "Programme des ateliers et formations entrepreneuriales à Paris ce mois-ci.", publishedAt: d(2025,1,21), readTime: 4 },
  { title: "Le NACRE : l'aide à la reprise et à la création d'entreprise", slug: "nacre-aide-reprise-creation-entreprise", category: "Financement", excerpt: "Le dispositif NACRE offre un prêt à taux zéro pour les créateurs. Conditions et démarches.", publishedAt: d(2025,1,24), readTime: 6 },

  // FÉVRIER 2025
  { title: "Seine-et-Marne : les success stories de la création", slug: "seine-et-marne-success-stories-creation", category: "Île-de-France", excerpt: "Focus sur les entrepreneurs qui ont réussi en Seine-et-Marne. Leurs parcours inspirants.", publishedAt: d(2025,2,1), readTime: 5 },
  { title: "Les réseaux sociaux en 2025 : TikTok, Threads et au-delà", slug: "reseaux-sociaux-2025-tiktok-threads", category: "Marketing", excerpt: "Le paysage social media évolue vite. Quelles plateformes privilégier pour votre business ?", publishedAt: d(2025,2,4), readTime: 6, isFeatured: true },
  { title: "La SARL : avantages, inconvénients et procédure de création", slug: "sarl-avantages-inconvenients-procedure-creation", category: "Juridique", excerpt: "La SARL reste un statut très populaire. Découvrez ses forces et ses limites.", publishedAt: d(2025,2,7), readTime: 7 },
  { title: "Le mentorat entrepreneurial : pourquoi c'est crucial", slug: "mentorat-entrepreneurial-pourquoi-crucial", category: "Inspiration", excerpt: "Un mentor peut faire toute la différence dans la réussite de votre projet. Témoignages.", publishedAt: d(2025,2,10), readTime: 5 },
  { title: "Outils de facturation gratuits : notre sélection 2025", slug: "outils-facturation-gratuits-selection-2025", category: "Outils numériques", excerpt: "Facturer ses clients est obligatoire. Découvrez les meilleurs outils gratuits du marché.", publishedAt: d(2025,2,13), readTime: 6 },
  { title: "Les aides de la Région Île-de-France aux jeunes entrepreneurs", slug: "aides-region-ile-de-france-jeunes-entrepreneurs", category: "Financement", excerpt: "La Région propose des aides spécifiques pour les moins de 30 ans. Détails et conditions.", publishedAt: d(2025,2,16), readTime: 6 },
  { title: "Networking en Île-de-France : les événements de février 2025", slug: "networking-ile-de-france-evenements-fevrier-2025", category: "Événements", excerpt: "Les meilleurs événements de networking pour entrepreneurs en Île-de-France ce mois-ci.", publishedAt: d(2025,2,19), readTime: 4 },
  { title: "Val-d'Oise : l'entrepreneuriat rural en plein essor", slug: "val-d-oise-entrepreneuriat-rural-plein-essor", category: "Île-de-France", excerpt: "Le Val-d'Oise développe de nombreuses initiatives pour l'entrepreneuriat rural. Décryptage.", publishedAt: d(2025,2,22), readTime: 5 },

  // MARS 2025
  { title: "L'étude de marché : guide complet pour les débutants", slug: "etude-marche-guide-complet-debutants", category: "Inspiration", excerpt: "Réaliser une étude de marché est indispensable. Méthodologie et outils pour bien faire.", publishedAt: d(2025,3,1), readTime: 8, isFeatured: true },
  { title: "La fiscalité de l'auto-entrepreneur : tout comprendre en 10 questions", slug: "fiscalite-auto-entrepreneur-10-questions", category: "Juridique", excerpt: "Impôts, charges sociales, TVA... Tout ce que l'auto-entrepreneur doit savoir.", publishedAt: d(2025,3,4), readTime: 7 },
  { title: "Content marketing : créer du contenu qui convertit", slug: "content-marketing-contenu-qui-convertit", category: "Marketing", excerpt: "Le contenu est roi, mais encore faut-il qu'il génère des leads. Nos stratégies.", publishedAt: d(2025,3,7), readTime: 6 },
  { title: "Le concours de création d'entreprise de la CCI Île-de-France", slug: "concours-creation-entreprise-cci-ile-de-france", category: "Événements", excerpt: "La CCI Île-de-France lance son concours annuel. Conditions de participation et prix.", publishedAt: d(2025,3,10), readTime: 4 },
  { title: "Les plateformes de financement participatif en France", slug: "plateformes-financement-participatif-france", category: "Financement", excerpt: "Ulule, Lendopolis, KissKissBankBank : comparatif des principales plateformes.", publishedAt: d(2025,3,13), readTime: 7 },
  { title: "Canva et le design graphique pour entrepreneurs", slug: "canva-design-graphique-entrepreneurs", category: "Outils numériques", excerpt: "Canva permet de créer des visuels professionnels sans compétences en design. Astuces.", publishedAt: d(2025,3,16), readTime: 5 },
  { title: "L'écosystème entrepreneurial de Paris intra-muros", slug: "ecosysteme-entrepreneurial-paris-intra-muros", category: "Île-de-France", excerpt: "Paris intra-muros regorge de ressources pour les créateurs. Tour d'horizon.", publishedAt: d(2025,3,19), readTime: 6 },
  { title: "Les assurances indispensables pour un créateur d'entreprise", slug: "assurances-indispensables-createur-entreprise", category: "Juridique", excerpt: "RC Pro, multirisque, assurance-chômage... Les assurances à ne pas négliger.", publishedAt: d(2025,3,22), readTime: 6 },

  // AVRIL 2025
  { title: "Préparer sa demande de prêt bancaire : le dossier parfait", slug: "preparer-demande-pret-bancaire-dossier-parfait", category: "Financement", excerpt: "Un dossier bien préparé maximise vos chances d'obtenir un prêt. Nos conseils.", publishedAt: d(2025,4,1), readTime: 7, isFeatured: true },
  { title: "Le marketing d'influence : opportunité ou piège ?", slug: "marketing-influence-opportunite-piege", category: "Marketing", excerpt: "L'influence peut booster votre business, mais attention aux pratiques douteuses.", publishedAt: d(2025,4,4), readTime: 5 },
  { title: "Les incubateurs parisiens pour startups tech", slug: "incubateurs-parisiens-startups-tech", category: "Île-de-France", excerpt: "Station F, Agoranov, Paris&Co... Les meilleurs incubateurs pour votre startup.", publishedAt: d(2025,4,7), readTime: 6 },
  { title: "Gérer sa trésorerie : les indicateurs à surveiller", slug: "gerer-tresorerie-indicateurs-surveiller", category: "Outils numériques", excerpt: "BFR, DSO, DPO... Les ratios clés pour une trésorerie saine.", publishedAt: d(2025,4,10), readTime: 6 },
  { title: "La micro-entreprise en 2025 : plafonds et avantages", slug: "micro-entreprise-2025-plafonds-avantages", category: "Juridique", excerpt: "Les plafonds de la micro-entreprise sont réévalués chaque année. Point complet.", publishedAt: d(2025,4,13), readTime: 5 },
  { title: "L'entrepreneuriat social en Île-de-France : enjeux et solutions", slug: "entrepreneuriat-social-ile-de-france-enjeux", category: "Inspiration", excerpt: "L'entrepreneuriat social répond à des besoins sociétaux tout en créant de l'emploi.", publishedAt: d(2025,4,16), readTime: 6 },
  { title: "Salon des entrepreneurs à Créteil : programme et infos pratiques", slug: "salon-entrepreneurs-creteil-programme", category: "Événements", excerpt: "Le salon des entrepreneurs fait étape à Créteil. Programme et informations pratiques.", publishedAt: d(2025,4,19), readTime: 4 },
  { title: "Les aides à l'embauche pour les jeunes entreprises", slug: "aides-embauche-jeunes-entreprises", category: "Financement", excerpt: "Embaucher quand on débute est un défi. Découvrez les aides existantes.", publishedAt: d(2025,4,22), readTime: 6 },

  // MAI 2025
  { title: "Sommet GIDEF Île-de-France 2025 : les temps forts", slug: "sommet-gidef-ile-de-france-2025-temps-forts", category: "Événements", excerpt: "Le sommet annuel du GIDEF réunit les acteurs de l'entrepreneuriat en Île-de-France.", publishedAt: d(2025,5,1), readTime: 5, isFeatured: true },
  { title: "Déléguez efficacement : les outils pour dirigeants", slug: "deleguer-efficacement-outils-dirigeants", category: "Outils numériques", excerpt: "Quand on débute, tout faire soi-même est impossible. Les outils pour déléguer.", publishedAt: d(2025,5,4), readTime: 5 },
  { title: "Seine-Saint-Denis : les projets qui transforment le territoire", slug: "seine-saint-denis-projets-transforment-territoire", category: "Île-de-France", excerpt: "Des initiatives entrepreneuriales changent la donne en Seine-Saint-Denis. Découvertes.", publishedAt: d(2025,5,7), readTime: 5 },
  { title: "L'emailing reste le canal d'acquisition le plus rentable", slug: "emailing-canal-acquisition-plus-rentable", category: "Marketing", excerpt: "Malgré l'essor des réseaux sociaux, l'emailing conserve la première place en ROI.", publishedAt: d(2025,5,10), readTime: 5 },
  { title: "Réforme des retraites : impact sur les auto-entrepreneurs", slug: "reforme-retraites-impact-auto-entrepreneurs", category: "Juridique", excerpt: "La réforme des retraites modifie les calculs pour les travailleurs indépendants. Explications.", publishedAt: d(2025,5,13), readTime: 6 },
  { title: "Trouver un local commercial en Île-de-France : les astuces", slug: "trouver-local-commercial-ile-de-france-astuces", category: "Financement", excerpt: "Trouver un local à un prix raisonnable en Île-de-France est un défi. Nos conseils.", publishedAt: d(2025,5,16), readTime: 5 },
  { title: "L'intelligence artificielle pour le service client", slug: "intelligence-artificielle-service-client", category: "Outils numériques", excerpt: "Les chatbots IA révolutionnent le service client. Comment les implémenter facilement.", publishedAt: d(2025,5,19), readTime: 5 },
  { title: "De créateur à chef d'entreprise : le passage à l'échelle", slug: "createur-a-chef-entreprise-passage-echelle", category: "Inspiration", excerpt: "Passer de créateur à chef d'entreprise demande de nouvelles compétences. Guide.", publishedAt: d(2025,5,22), readTime: 6 },
  { title: "Le business model canvas : outil incontournable pour structurer son projet", slug: "business-model-canvas-outil-incontournable", category: "Financement", excerpt: "Le BMC permet de visualiser votre modèle économique en une seule page. Mode d'emploi.", publishedAt: d(2025,5,23), readTime: 6, isFeatured: true },
]

function generateContent(article: { title: string; category: string; excerpt: string }) {
  const categoryIntros: Record<string, string> = {
    "Financement": "Le financement est souvent le premier obstacle des créateurs d'entreprise. Entre les prêts bancaires, les aides publiques et le crowdfunding, il existe de multiples solutions pour financer son projet.",
    "Juridique": "Le cadre juridique français offre de nombreuses possibilités pour les entrepreneurs. Choisir le bon statut et comprendre ses obligations est fondamental.",
    "Marketing": "Le marketing est essentiel pour attirer et fidéliser ses clients. À l'ère du numérique, les stratégies évoluent constamment.",
    "Île-de-France": "L'Île-de-France est la première région économique de France. Son écosystème entrepreneurial est l'un des plus denses d'Europe.",
    "Inspiration": "Se lancer dans l'entrepreneuriat est une aventure passionnante. Retrouvez ici des histoires inspirantes et des conseils pratiques.",
    "Outils numériques": "Les outils numériques facilitent grandement la gestion d'une entreprise. Découvrez les solutions qui font la différence.",
    "Événements": "Les événements entrepreneuriaux sont des occasions uniques de réseauter et de se former. Ne manquez pas les rendez-vous clés.",
  }
  
  const intro = categoryIntros[article.category] || "Le monde de l'entrepreneuriat est en constante évolution."
  
  const paragraphs = [
    `<h2>Pourquoi c'est important</h2><p>${intro}</p>`,
    `<h2>Les points clés à retenir</h2><ul><li>Premièrement, il est essentiel de bien comprendre les enjeux liés à ${article.title.toLowerCase()}.</li><li>Deuxièmement, les créateurs doivent prendre en compte les spécificités de leur marché et de leur secteur d'activité.</li><li>Troisièmement, l'accompagnement par des professionnels peut faire toute la différence dans la réussite du projet.</li></ul>`,
    `<h2>Nos recommandations</h2><p> Pour aller plus loin, nous recommandons de consulter les ressources mises à disposition par le réseau GIDEF en Île-de-France. Les conseillers spécialisés peuvent vous accompagner dans chaque étape de votre projet.</p><p>N'hésitez pas à contacter votre agence GIDEF la plus proche pour bénéficier d'un accompagnement personnalisé et gratuit.</p>`,
    `<h2>En résumé</h2><p>${article.excerpt} Restez informé des dernières actualités entrepreneuriales en suivant nos publications régulières.</p>`
  ]
  
  return `<div>${paragraphs.join('\n')}</div>`
}

async function main() {
  console.log(`Seeding ${articles.length} articles with images...`)
  
  let created = 0
  let updated = 0
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]
    const imageUrl = getImageForCategory(article.category, i)
    try {
      await prisma.newsArticle.upsert({
        where: { slug: article.slug },
        create: {
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          content: generateContent(article),
          category: article.category,
          imageGradient: g(),
          imageUrl,
          authorName: article.category === "Île-de-France" ? "Rédaction GIDEF" : "Équipe CreaPulse",
          authorRole: "GIDEF Île-de-France",
          isPublished: true,
          isFeatured: article.isFeatured || false,
          readTime: article.readTime,
          publishedAt: article.publishedAt,
        },
        update: {
          imageUrl,
        },
      })
      created++
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('Unique constraint')) {
        // Fallback: try updating by slug
        try {
          await prisma.newsArticle.update({
            where: { slug: article.slug },
            data: { imageUrl },
          })
          updated++
        } catch {
          console.error(`  ❌ Error updating "${article.slug}":`, msg)
        }
      } else {
        console.error(`  ❌ Error on "${article.slug}":`, msg)
      }
    }
  }
  
  console.log(`\n✅ Done! ${created} upserted, ${updated} updated out of ${articles.length}`)
  await prisma.$disconnect()
}

main().catch(console.error)
