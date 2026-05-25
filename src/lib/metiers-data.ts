/* ═══════════════════════════════════════════════════════════
   METIERS DATA — Horizon Emplois
   Quiz questions, métiers cards, témoignages, parcours
   ═══════════════════════════════════════════════════════════ */

export type MetierCategory = 'btp' | 'social' | 'numerique' | 'formation' | 'entrepreneuriat'

export interface QuizQuestion {
  id: number
  text: string
  options: string[]
  scores: number[][] // 4 options × N competencies
}

export interface QuizResult {
  title: string
  description: string
  match: number
}

export interface MetierCard {
  title: string
  salary: string
  training: string
  demand: 'très élevée' | 'élevée' | 'croissante'
  evolution: string
  icon: string
}

export interface Temoignage {
  name: string
  age: number
  before: string
  after: string
  metier: string
  initials: string
}

export interface ParcoursOption {
  title: string
  description: string
  icon: string
  duration: string
}

export interface CategoryData {
  slug: MetierCategory
  title: string
  subtitle: string
  heroTitle: string
  heroSubtitle: string
  heroCta: string
  color: string
  accentColor: string
  bgGradient: string
  competencies: string[]
  quizTitle: string
  quizQuestions: QuizQuestion[]
  quizResults: QuizResult[]
  metiers: MetierCard[]
  temoignages: Temoignage[]
  parcours: ParcoursOption[]
  stats: { label: string; value: string; suffix?: string }[]
}

/* ─────────────────────────────────────────────
   BTP
   ───────────────────────────────────────────── */
const btpData: CategoryData = {
  slug: 'btp',
  title: 'Métiers du BTP',
  subtitle: 'Construis ton avenir sur le terrain',
  heroTitle: 'Et si ton avenir était sur le terrain ?',
  heroSubtitle: 'Découvre les métiers du BTP qui recrutent massivement. Des formations courtes, des salaires compétitifs, un avenir concret.',
  heroCta: 'Découvrir mon profil BTP',
  color: 'amber',
  accentColor: 'amber-600',
  bgGradient: 'from-amber-500 via-orange-500 to-amber-600',
  competencies: ['Mobilité', 'Endurance', 'Logique', 'Esprit équipe', 'Travail manuel', 'Résistance au stress', 'Autonomie'],
  quizTitle: 'Quel métier terrain est fait pour toi ?',
  quizQuestions: [
    {
      id: 1,
      text: 'Comment tu réagis face à un travail physique intensif ?',
      options: ["J'adore, je préfère être debout et actif", 'Ça me va si c\'est varié', 'Je préfère modérer mon effort', 'Je cherche surtout du travail technique'],
      scores: [[5,5,2,3,4,3,4],[4,4,3,4,3,4,3],[2,2,4,3,2,2,3],[3,2,5,2,5,2,4]],
    },
    {
      id: 2,
      text: 'Tu es en équipe sur un chantier. Quel est ton rôle naturel ?',
      options: ['Je coordonne et organise le groupe', 'Je suis le moteur de l\'équipe', 'Je suis le spécialiste technique', 'Je m\'adapte à ce qu\'on me demande'],
      scores: [[4,3,3,5,2,4,5],[3,4,2,5,3,3,3],[3,2,5,2,5,2,4],[2,3,3,4,3,3,2]],
    },
    {
      id: 3,
      text: 'Qu\'est-ce qui te motive le plus dans un métier ?',
      options: ['Voir le résultat concret de mon travail', 'Travailler en équipe', 'Résoudre des problèmes techniques', 'La variété des chantiers'],
      scores: [[3,3,3,3,5,2,4],[2,4,3,5,3,2,3],[4,2,5,2,4,3,3],[5,3,2,3,3,4,5]],
    },
    {
      id: 4,
      text: 'Comment tu gères les délais serrés et la pression ?',
      options: ['Je reste concentré et efficace', 'Ça me stimule encore plus', 'Je prends le temps de bien faire', 'Je demande de l\'aide si besoin'],
      scores: [[3,4,3,3,3,5,4],[4,5,3,3,3,5,3],[2,2,4,2,4,2,3],[3,3,3,4,3,3,2]],
    },
    {
      id: 5,
      text: 'Quel type de projet t\'attire le plus ?',
      options: ['Rénover une maison de A à Z', 'Construire un immeuble neuf', 'Installer des systèmes techniques', 'Travailler sur des chantiers extérieurs'],
      scores: [[4,3,3,3,5,3,4],[3,4,2,4,4,3,3],[3,2,5,2,4,2,5],[5,5,2,3,3,4,5]],
    },
    {
      id: 6,
      text: 'Tu es prêt à te déplacer pour le travail ?',
      options: ['Oui, sans problème', 'Si c\'est dans ma région', 'Je préfère rester proche de chez moi', 'Ça dépend du projet'],
      scores: [[5,3,3,2,2,3,5],[4,3,3,3,2,2,4],[1,2,3,2,2,2,1],[3,3,3,3,2,3,3]],
    },
    {
      id: 7,
      text: 'Quelle est ta relation avec les outils et machines ?',
      options: ["J'aime les gros engins", 'Je préfère les outils à main', 'Les systèmes tech me passionnent', 'Je suis polyvalent'],
      scores: [[3,3,3,2,3,2,4],[2,3,3,3,5,2,3],[4,2,5,2,4,3,4],[3,3,3,4,4,3,3]],
    },
  ],
  quizResults: [
    { title: 'Électricien', description: 'Tu as un profil technique et méthodique. L\'électricité est un secteur en pleine mutation avec la transition énergétique.', match: 92 },
    { title: 'Plaquiste', description: 'Tu es précis, patient et methodique. Le plaquisterie est un métier essentiel sur tout chantier.', match: 85 },
    { title: 'Conducteur d\'engins', description: 'Tu aimes le travail en extérieur et la manipulation de machines. Les engins de chantier te correspondent.', match: 80 },
    { title: 'Peintre en bâtiment', description: 'Tu as le sens du détail et de l\'esthétique. La peinture offre une grande autonomie professionnelle.', match: 78 },
    { title: 'Technicien maintenance', description: 'Tu es logique et curieux. La maintenance industrielle combine technique et résolution de problèmes.', match: 88 },
    { title: 'Rénovation énergétique', description: 'Tu es conscient des enjeux environnementaux. La réno énergétique est LE métier d\'avenir du BTP.', match: 90 },
  ],
  metiers: [
    { title: 'Électricien du bâtiment', salary: '1 800 - 2 800 €', training: '6 - 12 mois', demand: 'très élevée', evolution: 'Chef d\'équipe → Chef d\'entreprise', icon: 'Zap' },
    { title: 'Plaquiste', salary: '1 700 - 2 500 €', training: '3 - 6 mois', demand: 'très élevée', evolution: 'Compagnon → Artisan', icon: 'Home' },
    { title: 'Conducteur d\'engins', salary: '2 000 - 3 200 €', training: '6 - 10 mois', demand: 'élevée', evolution: 'Chef de chantier → Conducteur senior', icon: 'Truck' },
    { title: 'Peintre en bâtiment', salary: '1 700 - 2 600 €', training: '3 - 6 mois', demand: 'élevée', evolution: 'Décorateur → Chef d\'entreprise', icon: 'Paintbrush' },
    { title: 'Technicien maintenance', salary: '1 900 - 3 000 €', training: '1 - 2 ans', demand: 'très élevée', evolution: 'Responsable maintenance → Ingénieur', icon: 'Wrench' },
    { title: 'Technicien rénovation énergétique', salary: '2 000 - 3 200 €', training: '6 - 12 mois', demand: 'très élevée', evolution: 'Auditeur énergie → Chef de projet', icon: 'Leaf' },
  ],
  temoignages: [
    { name: 'Mamadou D.', age: 22, before: 'Sans diplôme, je galérais à trouver un premier emploi. Personne ne me donnait ma chance.', after: 'En 8 mois de formation électricité, j\'ai décroché mon premier CDI à 2 100€. Aujourd\'hui je gère mes propres chantiers.', metier: 'Électricien', initials: 'MD' },
    { name: 'Sarah L.', age: 19, before: 'J\'ai arrêté mes études et je ne savais pas quoi faire. J\'avais l\'impression d\'être bonne à rien.', after: 'Un conseiller m\'orientée vers le plaquisterie. J\'aime créer du concret, voir le résultat. En 6 mois j\'étais en alternance.', metier: 'Plaquiste', initials: 'SL' },
    { name: 'Karim B.', age: 28, before: 'Après 5 ans en entrepôt, je voulais un métier plus technique et mieux payé.', after: 'La formation conducteur d\'engins a changé ma vie. Je gagne 2 800€ et j\'adore mon travail en extérieur.', metier: 'Conducteur d\'engins', initials: 'KB' },
  ],
  parcours: [
    { title: 'Emploi direct', description: 'Accès rapide à l\'emploi après une courte formation qualifiante', icon: 'Briefcase', duration: '3-6 mois' },
    { title: 'Alternance', description: 'Formation rémunérée en entreprise avec un CDD d\'alternance', icon: 'BookOpen', duration: '6-12 mois' },
    { title: 'Formation certifiante', description: 'Diplôme reconnu (CAP, BP, Bac Pro) pour progresser', icon: 'Award', duration: '1-2 ans' },
    { title: 'Entrepreneuriat', description: 'Devenir artisan et créer sa propre entreprise du BTP', icon: 'Rocket', duration: 'Variable' },
    { title: 'Insertion', description: 'Parcours accompagné pour les publics éloignés de l\'emploi', icon: 'Handshake', duration: '6-12 mois' },
  ],
  stats: [
    { label: 'Postes vacants en IDF', value: '45 000', suffix: '+' },
    { label: 'Salaire moyen débutant', value: '1 850', suffix: '€/mois' },
    { label: 'Durée formation moyenne', value: '8', suffix: 'mois' },
    { label: 'Taux d\'insertion', value: '92', suffix: '%' },
  ],
}

/* ─────────────────────────────────────────────
   SOCIAL
   ───────────────────────────────────────────── */
const socialData: CategoryData = {
  slug: 'social',
  title: 'Métiers du Social',
  subtitle: 'Ton empathie peut devenir un métier',
  heroTitle: 'Ton empathie peut devenir un vrai métier.',
  heroSubtitle: 'Les métiers du social recrutent massivement. Si tu as le sens de l\'écoute et le goût de l\'accompagnement, des carrières t\'attendent.',
  heroCta: 'Découvrir mon profil Social',
  color: 'rose',
  accentColor: 'rose-500',
  bgGradient: 'from-rose-500 via-pink-500 to-rose-600',
  competencies: ['Empathie', 'Patience', 'Communication', 'Gestion émotionnelle', 'Écoute', 'Stabilité émotionnelle'],
  quizTitle: 'Ton profil humain vaut-il de l\'or dans le social ?',
  quizQuestions: [
    {
      id: 1,
      text: 'Un ami te confie un problème personnel. Ta première réaction ?',
      options: ['Je l\'écoute sans interrompre', 'Je cherche des solutions concrètes', 'Je ressens fortement ce qu\'il vit', 'Je lui pose des questions pour comprendre'],
      scores: [[3,3,3,2,5,4],[3,2,4,3,3,3],[5,2,2,2,5,2],[3,3,3,4,4,4]],
    },
    {
      id: 2,
      text: 'Face à une situation de conflit, comment tu réagis ?',
      options: ['Je reste calme et j\'écoute chaque partie', 'Je cherche un compromis rapidement', 'Je prends du recul avant d\'intervenir', 'Je m\'implique émotionnellement'],
      scores: [[3,3,4,3,4,5],[4,2,3,4,3,3],[2,4,3,4,3,5],[3,2,2,2,5,2]],
    },
    {
      id: 3,
      text: 'Quelle situation te motive le plus ?',
      options: ['Aider une personne en difficulté', 'Accompagner un groupe vers un objectif', 'Médier entre des personnes en désaccord', 'Soutenir au quotidien une personne fragile'],
      scores: [[4,3,2,3,5,3],[3,3,4,4,3,3],[3,3,4,4,4,4],[5,4,2,3,5,4]],
    },
    {
      id: 4,
      text: 'Comment tu gères le stress émotionnel ?',
      options: ['Je sais le canaliser et rester professionnel', 'J\'en parle avec mes proches', 'Je pratique une activité pour me ressourcer', 'J\'ai parfois du mal à le gérer'],
      scores: [[3,2,4,4,3,5],[3,3,3,3,4,3],[3,3,4,3,3,4],[2,2,2,2,3,1]],
    },
    {
      id: 5,
      text: 'Tu travailles avec des enfants ou ados en difficulté. Ton atout ?',
      options: ['Ma patience à toute épreuve', 'Ma capacité à me mettre à leur place', 'Ma communication claire et bienveillante', 'Mon énergie et ma créativité'],
      scores: [[3,5,3,3,4,4],[5,3,3,3,5,3],[3,3,5,4,3,3],[3,2,4,3,3,3]],
    },
    {
      id: 6,
      text: 'Quel est ton plus grand trait de caractère ?',
      options: ['Mon sens de l\'écoute', 'Ma tolérance et patience', 'Ma capacité d\'adaptation', 'Ma détermination à aider'],
      scores: [[4,3,3,3,5,3],[3,5,3,3,3,5],[3,3,4,4,4,3],[4,3,3,4,4,4]],
    },
    {
      id: 7,
      text: 'Pour toi, le métier idéal c\'est un métier qui... ?',
      options: ['Donne du sens à chaque journée', 'Permet de créer du lien humain', 'Offre de la stabilité professionnelle', 'Permet d\'accompagner des personnes vers l\'autonomie'],
      scores: [[4,4,3,3,4,3],[4,3,3,4,5,4],[3,3,4,3,3,4],[5,4,3,4,5,4]],
    },
  ],
  quizResults: [
    { title: 'Médiateur social', description: 'Tu as le sens du dialogue et de la résolution de conflits. La médiation est faite pour toi.', match: 90 },
    { title: 'Aide à domicile', description: 'Tu es patient, bienveillant et fiable. L\'aide à domicile permet un accompagnement personnalisé.', match: 85 },
    { title: 'Animateur socioculturel', description: 'Tu es créatif, énergique et tu aimes le travail en groupe. L\'animation te correspond parfaitement.', match: 82 },
    { title: 'AESH', description: 'Tu as une grande patience et le désir d\'aider les élèves en difficulté. L\'AESH est un métier noble.', match: 88 },
    { title: 'Accompagnant éducatif et social', description: 'Tu es stable, empathique et déterminé. L\'accompagnement des personnes fragiles est ta voie.', match: 92 },
    { title: 'Éducateur spécialisé', description: 'Tu as une grande capacité d\'adaptation et une forte résilience émotionnelle. L\'éducation spécialisée te correspond.', match: 86 },
  ],
  metiers: [
    { title: 'Médiateur social', salary: '1 700 - 2 500 €', training: '6 - 12 mois', demand: 'élevée', evolution: 'Médiateur senior → Coordinateur', icon: 'Users' },
    { title: 'Aide à domicile', salary: '1 600 - 2 200 €', training: '2 - 4 mois', demand: 'très élevée', evolution: 'Auxiliaire → Conseiller en autonomie', icon: 'Heart' },
    { title: 'Animateur socioculturel', salary: '1 650 - 2 400 €', training: '6 - 12 mois', demand: 'élevée', evolution: 'Animateur → Directeur de centre', icon: 'Smile' },
    { title: 'AESH', salary: '1 550 - 2 000 €', training: '1 - 3 mois', demand: 'très élevée', evolution: 'AESH → Éducateur spécialisé', icon: 'GraduationCap' },
    { title: 'Accompagnant éducatif et social', salary: '1 700 - 2 400 €', training: '6 - 12 mois', demand: 'très élevée', evolution: 'Accompagnant → Responsable de structure', icon: 'Handshake' },
    { title: 'Éducateur spécialisé', salary: '1 900 - 2 800 €', training: '1 - 3 ans', demand: 'élevée', evolution: 'Éducateur → Chef de service', icon: 'BookOpen' },
  ],
  temoignages: [
    { name: 'Aïcha M.', age: 24, before: 'Je travaillais dans la vente mais je ressentais un manque de sens. Je voulais aider les gens.', after: 'La formation d\'AESH a été une révélation. Aujourd\'hui j\'accompagne un enfant autiste et chaque journée compte.', metier: 'AESH', initials: 'AM' },
    { name: 'Lucas P.', age: 21, before: 'Je n\'avais pas de diplôme et je me sentais inutile. Les centres d\'intérêt me manquaient.', after: 'L\'animation socioculturelle m\'a redonné confiance. Maintenant j\'anime des ateliers pour jeunes dans mon quartier.', metier: 'Animateur', initials: 'LP' },
    { name: 'Fatima Z.', age: 32, before: 'Mère au foyer depuis 8 ans, je pensais ne plus pouvoir retravailler.', after: 'La formation d\'aide à domicile en 3 mois m\'a permis de reprendre une activité. Je suis épanouie.', metier: 'Aide à domicile', initials: 'FZ' },
  ],
  parcours: [
    { title: 'Emploi direct', description: 'Aide à domicile, AESH — recrutement rapide sans diplôme requis', icon: 'Briefcase', duration: '2-4 mois' },
    { title: 'Formation diplômante', description: 'DEAES, DEES, Bac Pro ASSP pour évoluer dans le social', icon: 'GraduationCap', duration: '1-3 ans' },
    { title: 'Alternance', description: 'Formation en entreprise dans le secteur social ou médicosocial', icon: 'BookOpen', duration: '1-2 ans' },
    { title: 'VAE', description: 'Valider ses acquis d\'expérience pour obtenir un diplôme du social', icon: 'Award', duration: '6-12 mois' },
    { title: 'Bénévolat + formation', description: 'S\'investir dans une association puis se former', icon: 'Heart', duration: 'Variable' },
  ],
  stats: [
    { label: 'Postes vacants en IDF', value: '38 000', suffix: '+' },
    { label: 'Salaire moyen débutant', value: '1 650', suffix: '€/mois' },
    { label: 'Durée formation moyenne', value: '6', suffix: 'mois' },
    { label: 'Taux d\'insertion', value: '89', suffix: '%' },
  ],
}

/* ─────────────────────────────────────────────
   NUMÉRIQUE
   ───────────────────────────────────────────── */
const numeriqueData: CategoryData = {
  slug: 'numerique',
  title: 'Métiers du Numérique',
  subtitle: 'Les métiers du digital recrutent maintenant',
  heroTitle: 'Les métiers du digital recrutent maintenant.',
  heroSubtitle: 'Du community manager à l\'IA assistant, les métiers du numérique offrent des opportunités incroyables. Pas besoin d\'être un geek pour réussir.',
  heroCta: 'Découvrir mon profil Numérique',
  color: 'cyan',
  accentColor: 'cyan-600',
  bgGradient: 'from-cyan-500 via-teal-500 to-cyan-600',
  competencies: ['Logique', 'Créativité', 'Autonomie', 'Curiosité', 'Communication digitale', 'Résolution problèmes'],
  quizTitle: 'Es-tu fait pour les métiers du digital ?',
  quizQuestions: [
    {
      id: 1,
      text: 'Tu passes 3h sur ton téléphone. Tu fais quoi ?',
      options: ['Je scroll les réseaux sociaux et je commente', 'Je crée du contenu (vidéos, posts, stories)', 'Je cherche à comprendre comment les apps marchent', 'Je regarde des tutos tech et AI'],
      scores: [[3,2,4,3,5,2],[2,5,2,3,4,2],[4,2,4,4,2,5],[4,2,4,5,2,5]],
    },
    {
      id: 2,
      text: 'On te demande de créer une présentation. Tu :',
      options: ['Utilises Canva ou un outil créatif', 'Rédiges un contenu structuré et clair', 'Cherches l\'outil le plus performant', 'Fais le minimum requis'],
      scores: [[2,5,3,3,4,2],[3,3,4,4,4,3],[4,2,3,3,2,5],[1,1,2,2,1,1]],
    },
    {
      id: 3,
      text: 'Face à un problème technique, tu :',
      options: ['Cherches la solution sur Google/YouTube', 'Essaies plusieurs choses jusqu\'à trouver', 'Demandes de l\'aide à quelqu\'un', 'Abandonnes et passes à autre chose'],
      scores: [[3,2,3,4,4,4],[4,3,3,3,3,5],[2,2,3,4,3,3],[0,1,1,1,1,0]],
    },
    {
      id: 4,
      text: 'Quel domaine du numérique t\'intéresse le plus ?',
      options: ['Les réseaux sociaux et le marketing', 'Le design et la création', 'La programmation et le no-code', 'L\'intelligence artificielle'],
      scores: [[2,4,3,3,5,2],[2,5,4,3,3,2],[5,3,3,5,2,5],[4,2,4,4,3,4]],
    },
    {
      id: 5,
      text: 'Tu préfères travailler :',
      options: ['En équipe créative', 'Seul devant mon ordinateur', 'En mode projet avec des deadlines', 'En contact direct avec les clients'],
      scores: [[3,3,2,3,3,3],[4,4,5,4,2,4],[3,2,3,4,4,4],[2,3,2,3,5,2]],
    },
    {
      id: 6,
      text: 'Qu\'est-ce qui t\'attire dans le digital ?',
      options: ['La créativité sans limites', 'Les possibilités de carrière', 'La liberté géographique (télétravail)', 'L\'innovation constante'],
      scores: [[3,5,3,3,4,2],[4,3,4,3,3,3],[4,2,4,4,3,3],[4,3,4,4,3,4]],
    },
    {
      id: 7,
      text: 'Ton niveau en informatique actuel ?',
      options: ['Je maîtrise les outils courants', 'Je suis très à l\'aise avec la tech', 'Je suis débutant mais motivé', 'Je n\'y connais rien mais ça m\'intéresse'],
      scores: [[3,3,3,3,4,3],[4,3,4,5,3,4],[2,3,3,2,3,3],[1,2,3,1,4,2]],
    },
  ],
  quizResults: [
    { title: 'Community Manager', description: 'Tu es créatif, communicatif et tu maîtrises les réseaux. Le CM est le métier digital le plus accessible.', match: 88 },
    { title: 'No-Code Maker', description: 'Tu es logique et créatif. Le no-code te permet de créer des sites et apps sans programmer.', match: 84 },
    { title: 'Support IT', description: 'Tu es patient, méthodique et tu aimes résoudre les problèmes techniques. Le support IT te correspond.', match: 80 },
    { title: 'Créateur de contenu', description: 'Tu es créatif et t\'as un fort esprit d\'initiative. La création de contenu (vidéo, photo, texte) est ta voie.', match: 90 },
    { title: 'IA Assistant', description: 'Tu es curieux et adaptable. L\'IA transforme le marché du travail et les profils IA sont très recherchés.', match: 86 },
    { title: 'Monteur vidéo', description: 'Tu es créatif, patient et tu as l\'œil. Le montage vidéo est un métier en pleine explosion.', match: 82 },
  ],
  metiers: [
    { title: 'Community Manager', salary: '1 800 - 2 800 €', training: '3 - 6 mois', demand: 'très élevée', evolution: 'CM Senior → Social Media Manager', icon: 'Megaphone' },
    { title: 'No-Code Maker', salary: '2 000 - 3 500 €', training: '3 - 6 mois', demand: 'élevée', evolution: 'Maker → Tech Lead → Freelance', icon: 'Blocks' },
    { title: 'Support IT', salary: '1 750 - 2 500 €', training: '3 - 9 mois', demand: 'élevée', evolution: 'Support → Technicien → Administrateur', icon: 'Monitor' },
    { title: 'Créateur de contenu', salary: '1 500 - 4 000 €', training: '1 - 3 mois', demand: 'croissante', evolution: 'Créateur → Influenceur → Agence', icon: 'Camera' },
    { title: 'Assistant IA', salary: '2 200 - 3 500 €', training: '3 - 6 mois', demand: 'très élevée', evolution: 'Assistant → Prompt Engineer → Consultant IA', icon: 'Brain' },
    { title: 'Monteur vidéo', salary: '1 800 - 3 000 €', training: '3 - 6 mois', demand: 'croissante', evolution: 'Monteur → Motion Designer → Réalisateur', icon: 'Film' },
  ],
  temoignages: [
    { name: 'Youssef K.', age: 20, before: 'Je passais mes journées sur TikTok sans but. Mes parents disaient que je perdais mon temps.', after: 'J\'ai fait une formation CM de 4 mois. Aujourd\'hui je gère les réseaux de 3 clients et je travaille en freelance.', metier: 'Community Manager', initials: 'YK' },
    { name: 'Inès R.', age: 25, before: 'Licence en philo mais aucun débouché. Je ne voyais pas comment en vivre.', after: 'Le no-code m\'a ouvert un monde. Je crée des sites web pour des artisans et je facture 2 500€/mois.', metier: 'No-Code Maker', initials: 'IR' },
    { name: 'Dylan M.', age: 18, before: 'Je n\'aimais pas l\'école classique mais j\'adorais bidouiller sur mon PC.', after: 'La formation IA assistant en 3 mois m\'a permis de trouver un CDI. Le meilleur choix de ma vie.', metier: 'Assistant IA', initials: 'DM' },
  ],
  parcours: [
    { title: 'Formation intensive', description: 'Bootcamp ou formation accélérée de 3 à 6 mois', icon: 'Zap', duration: '3-6 mois' },
    { title: 'Auto-formation', description: 'Apprendre en ligne via des tutos, YouTube et projets personnels', icon: 'Globe', duration: 'Variable' },
    { title: 'Alternance', description: 'Formation en entreprise avec rémunération', icon: 'BookOpen', duration: '6-12 mois' },
    { title: 'Freelance', description: 'Se lancer directement en proposant ses services', icon: 'Rocket', duration: 'Immediat' },
    { title: 'Certifications', description: 'Google, Meta, AWS — des certifications valorisées sur le marché', icon: 'Award', duration: '1-3 mois' },
  ],
  stats: [
    { label: 'Postes vacants en IDF', value: '52 000', suffix: '+' },
    { label: 'Salaire moyen débutant', value: '2 000', suffix: '€/mois' },
    { label: 'Durée formation moyenne', value: '4', suffix: 'mois' },
    { label: 'Taux d\'insertion', value: '87', suffix: '%' },
  ],
}

/* ─────────────────────────────────────────────
   FORMATION & RECONVERSION
   ───────────────────────────────────────────── */
const formationData: CategoryData = {
  slug: 'formation',
  title: 'Formation & Reconversion',
  subtitle: 'Trouve la formation qui transforme ta carrière',
  heroTitle: 'Trouve la formation qui transforme ta carrière.',
  heroSubtitle: 'Que tu sois en reconversion, en recherche d\'emploi ou sorti du système scolaire, il existe une formation faite pour toi.',
  heroCta: 'Découvrir ma formation idéale',
  color: 'emerald',
  accentColor: 'emerald-600',
  bgGradient: 'from-emerald-500 via-teal-500 to-emerald-600',
  competencies: ['Motivation', 'Capacité d\'apprentissage', 'Orientation pratique', 'Persévérance', 'Adaptabilité', 'Projet professionnel'],
  quizTitle: 'Quelle formation est faite pour toi ?',
  quizQuestions: [
    {
      id: 1,
      text: 'Quel type de travail te correspond le plus ?',
      options: ['Un travail manuel et concret', 'Un travail de contact humain', 'Un travail derrière un écran', 'Un travail de gestion et organisation'],
      scores: [[3,3,4,2,2,4],[3,3,2,4,3,3],[3,2,2,3,3,4],[3,2,2,2,3,3]],
    },
    {
      id: 2,
      text: 'Quelle est ta situation actuelle ?',
      options: ['En recherche d\'emploi depuis plus de 6 mois', 'En reconversion professionnelle', 'Je viens de terminer mes études', 'En poste mais je veux changer'],
      scores: [[4,3,3,3,3,5],[5,4,3,3,4,4],[2,4,3,2,4,3],[3,3,4,3,4,4]],
    },
    {
      id: 3,
      text: 'Combien de temps es-tu prêt à te former ?',
      options: ['Moins de 3 mois', '3 à 6 mois', '6 mois à 1 an', 'Plus d\'un an si le projet est solide'],
      scores: [[3,2,3,2,2,3],[4,3,4,3,3,4],[4,4,4,4,3,4],[4,4,4,4,4,5]],
    },
    {
      id: 4,
      text: 'Comment tu apprends le mieux ?',
      options: ['En pratiquant directement', 'En échangeant avec des formateurs', 'Seul avec des ressources en ligne', 'En alternance théorie/pratique'],
      scores: [[3,2,5,2,2,3],[3,3,3,4,3,3],[3,2,3,2,4,3],[4,4,4,4,4,4]],
    },
    {
      id: 5,
      text: 'Quel est ton objectif principal ?',
      options: ['Trouver un emploi rapidement', 'Acquérir de nouvelles compétences', 'Obtenir un diplôme reconnu', 'Changer radicalement de métier'],
      scores: [[4,3,3,3,2,5],[3,4,4,3,3,4],[3,3,3,4,3,3],[5,4,4,3,4,5]],
    },
    {
      id: 6,
      text: 'As-tu déjà une idée du domaine qui t\'intéresse ?',
      options: ['Oui, le BTP ou l\'artisanat', 'Oui, le social ou l\'éducation', 'Oui, le numérique ou la tech', 'Non, je cherche encore'],
      scores: [[4,3,4,2,3,4],[3,4,3,4,3,4],[4,3,3,3,3,4],[2,2,2,2,3,2]],
    },
    {
      id: 7,
      text: 'Quel financement envisages-tu ?',
      options: ['CPF ou Pôle Emploi', 'Financement par la Région', 'Auto-financement', 'Je ne sais pas encore'],
      scores: [[3,3,3,3,3,4],[3,3,3,3,3,4],[3,3,4,3,2,4],[2,2,2,2,2,2]],
    },
  ],
  quizResults: [
    { title: 'Formation BTP', description: 'Le BTP offre des formations courtes avec un fort taux d\'insertion. Idéal pour un retour rapide à l\'emploi.', match: 88 },
    { title: 'Formation Social', description: 'Les formations du social (DEAES, DEES) permettent d\'accompagner les autres. Forte demande.', match: 85 },
    { title: 'Formation Numérique', description: 'Bootcamps, certifications Google/Meta — les formations digitales sont les plus dynamiques.', match: 90 },
    { title: 'Formation Commerce', description: 'La vente, la gestion, le commerce offrent de nombreuses opportunités en IDF.', match: 82 },
    { title: 'Formation Artistique', description: 'Design graphique, montage vidéo, photographie — la créativité est un vrai métier.', match: 80 },
    { title: 'Formation Indépendante', description: 'Tu es prêt à créer ta propre activité. Entrepreneuriat et freelance sont des voies viables.', match: 86 },
  ],
  metiers: [
    { title: 'CAP BTP (Électricité, Plomberie)', salary: '1 700 - 2 500 €', training: '6 - 12 mois', demand: 'très élevée', evolution: 'Compagnon → Artisan', icon: 'HardHat' },
    { title: 'DEAES (Aide à domicile)', salary: '1 600 - 2 200 €', training: '6 - 12 mois', demand: 'très élevée', evolution: 'Auxiliaire → Coordinateur', icon: 'Heart' },
    { title: 'Bootcamp Développement Web', salary: '2 000 - 3 500 €', training: '3 - 6 mois', demand: 'élevée', evolution: 'Développeur → Tech Lead', icon: 'Code' },
    { title: 'BTS NDRC (Commerce)', salary: '1 800 - 2 800 €', training: '2 ans', demand: 'élevée', evolution: 'Commercial → Responsable', icon: 'TrendingUp' },
    { title: 'Formation Design Graphique', salary: '1 800 - 3 000 €', training: '6 - 12 mois', demand: 'croissante', evolution: 'Designer → Directeur artistique', icon: 'Palette' },
    { title: 'Formation IA & Data', salary: '2 500 - 4 000 €', training: '3 - 6 mois', demand: 'très élevée', evolution: 'Analyste → Data Scientist', icon: 'Brain' },
  ],
  temoignages: [
    { name: 'Rachid T.', age: 35, before: '15 ans dans la restauration, des douleurs physiques, envie de changer de vie.', after: 'Mon CPF a financé une formation développeur web. En 5 mois, j\'ai trouvé mon premier poste en startup.', metier: 'Développeur Web', initials: 'RT' },
    { name: 'Nadia H.', age: 29, before: 'Femme au foyer, je n\'avais pas travaillé depuis 7 ans. Je manquais de confiance.', after: 'La formation DEAES financée par la Région m\'a redonné ma place. Je travaille en aide à domicile et je suis épanouie.', metier: 'Aide à domicile', initials: 'NH' },
    { name: 'Thomas G.', age: 22, before: 'Bac sans suite, en recherche d\'emploi depuis 1 an, Pôle Emploi ne proposait rien.', after: 'Une formation électricien en 8 mois et j\'ai décroché un CDI. Mon conseiller m\'a orienté vers la bonne formation.', metier: 'Électricien', initials: 'TG' },
  ],
  parcours: [
    { title: 'CPF', description: 'Compte Personnel de Formation — jusqu\'à 5 000€ pour se former', icon: 'Wallet', duration: 'Variable' },
    { title: 'Pôle Emploi', description: 'Formations financées et accompagnement personnalisé', icon: 'Briefcase', duration: 'Variable' },
    { title: 'Région IDF', description: 'Aides régionales pour les formations prioritaires', icon: 'MapPin', duration: 'Variable' },
    { title: 'Alternance', description: 'Formation rémunérée en entreprise', icon: 'BookOpen', duration: '6-24 mois' },
    { title: 'Bootcamp intensif', description: 'Formation accélérée en 3-6 mois', icon: 'Zap', duration: '3-6 mois' },
  ],
  stats: [
    { label: 'Formations financées/an', value: '120 000', suffix: '+' },
    { label: 'Montant CPF moyen', value: '3 500', suffix: '€' },
    { label: 'Taux de réussite reconversion', value: '78', suffix: '%' },
    { label: 'Salaire moyen après formation', value: '2 100', suffix: '€/mois' },
  ],
}

/* ─────────────────────────────────────────────
   ENTREPRENEURIAT
   ───────────────────────────────────────────── */
const entrepreneuriatData: CategoryData = {
  slug: 'entrepreneuriat',
  title: 'Entrepreneuriat',
  subtitle: 'Tu as peut-être un profil de créateur',
  heroTitle: 'Tu as peut-être un profil de créateur sans le savoir.',
  heroSubtitle: 'Entrepreneur, freelance, intrapreneur — il existe de nombreuses façons de prendre son destin en main. Découvre ton profil entrepreneurial.',
  heroCta: 'Découvrir mon profil entrepreneur',
  color: 'orange',
  accentColor: 'orange-500',
  bgGradient: 'from-orange-500 via-amber-500 to-orange-600',
  competencies: ['Leadership', 'Prise de risque', 'Autonomie', 'Créativité', 'Organisation', 'Résilience'],
  quizTitle: 'Tu as un profil entrepreneur ou salarié ?',
  quizQuestions: [
    {
      id: 1,
      text: 'Tu as une idée de projet. Ta première action ?',
      options: ['Je lance tout de suite un MVP', 'Je fais une étude de marché', 'J\'en parle à des experts', 'Je réfléchis longuement avant d\'agir'],
      scores: [[3,3,4,2,5,3],[4,4,3,3,3,4],[3,3,3,3,4,3],[2,2,2,3,2,2]],
    },
    {
      id: 2,
      text: 'Face à un échec, tu :',
      options: ['Tu te relèves immédiatement', 'Tu analyses ce qui n\'a pas marché', 'Tu cherches du soutien', 'Tu remets en question tout le projet'],
      scores: [[3,2,3,2,4,5],[4,3,3,3,4,4],[2,2,3,3,3,3],[2,2,2,2,2,1]],
    },
    {
      id: 3,
      text: 'Dans une équipe, tu es naturellement :',
      options: ['Le leader qui prend les décisions', 'Le créatif qui propose des idées', 'L\'organisateur qui structure', 'Le collaborateur qui exécute'],
      scores: [[5,3,3,3,4,4],[3,5,3,3,4,3],[4,3,5,3,4,4],[1,1,2,3,1,1]],
    },
    {
      id: 4,
      text: 'Quel est ton rapport au risque ?',
      options: ['J\'assume les risques calculés', 'Je prends des risques quand j\'y crois', 'Je préfère minimiser les risques', 'Le risque me fait peur'],
      scores: [[5,3,3,3,3,5],[4,3,4,3,4,4],[2,3,3,4,4,2],[0,1,1,2,1,0]],
    },
    {
      id: 5,
      text: 'Tu préfères :',
      options: ['Créer quelque chose de nouveau', 'Améliorer ce qui existe', 'Travailler dans une structure établie', 'Suivre un parcours défini'],
      scores: [[4,4,5,3,3,4],[3,3,3,4,3,3],[1,1,1,3,2,1],[0,0,1,2,1,0]],
    },
    {
      id: 6,
      text: 'Comment tu gères ton temps et ton organisation ?',
      options: ['Je suis très organisé et discipliné', 'Je m\'adapte selon les priorités', 'J\'ai parfois du mal avec la rigueur', 'Je fonctionne au feeling'],
      scores: [[4,3,5,3,4,4],[3,3,3,4,4,3],[2,2,3,2,2,2],[2,3,2,2,2,2]],
    },
    {
      id: 7,
      text: 'Si tu devais décrire ton profil en un mot :',
      options: ['Visionnaire', 'Créatif', 'Organisateur', 'Persévérant'],
      scores: [[5,4,3,4,3,4],[4,5,4,3,3,4],[4,3,4,5,4,4],[3,3,3,4,3,5]],
    },
  ],
  quizResults: [
    { title: 'Entrepreneur', description: 'Tu as un fort potentiel entrepreneurial. Le leadership, la prise de risque et la vision sont tes atouts.', match: 94 },
    { title: 'Freelance', description: 'Tu es autonome et compétent dans un domaine. Le freelance te permet d\'être ton propre patron.', match: 88 },
    { title: 'Intrapreneur', description: 'Tu as l\'esprit entrepreneurial mais préfères la sécurité d\'une structure. L\'intrapreneuriat est fait pour toi.', match: 82 },
    { title: 'Manager', description: 'Tu as des qualités de leadership et d\'organisation. Tu peux évoluer vers des postes de management.', match: 80 },
    { title: 'Profil hybride', description: 'Tu combines créativité et organisation. Tu pourrais être un entrepreneur salarié ou un porteur de projet à temps partiel.', match: 86 },
  ],
  metiers: [
    { title: 'Créateur d\'entreprise', salary: 'Variable', training: 'Accompagnement', demand: 'croissante', evolution: 'Startup → PME → ETI', icon: 'Rocket' },
    { title: 'Auto-entrepreneur / Freelance', salary: '2 000 - 5 000 €', training: 'Variable', demand: 'très élevée', evolution: 'Freelance → Agence', icon: 'User' },
    { title: 'Consultant indépendant', salary: '2 500 - 6 000 €', training: 'Expérience + formation', demand: 'élevée', evolution: 'Consultant → Cabinet', icon: 'Briefcase' },
    { title: 'Franchisé', salary: '2 000 - 4 000 €', training: 'Formation franchise', demand: 'élevée', evolution: '1 point → Réseau', icon: 'Building2' },
    { title: 'E-commerçant', salary: '1 500 - 4 000 €', training: '2 - 6 mois', demand: 'croissante', evolution: 'Boutique → Marque', icon: 'ShoppingCart' },
    { title: 'Coach / Formateur', salary: '2 000 - 5 000 €', training: 'Certification', demand: 'croissante', evolution: 'Coach → Agence de coaching', icon: 'GraduationCap' },
  ],
  temoignages: [
    { name: 'Omar S.', age: 26, before: 'Salarié dans une boîte, je me sentais limité et sous-utilisé. Je rêvais de liberté.', after: 'En 6 mois, j\'ai lancé mon activité de freelance développeur. Je gagne 2x plus et je choisis mes missions.', metier: 'Freelance', initials: 'OS' },
    { name: 'Camille D.', age: 31, before: 'En reconversion après 8 ans dans le commerce. Je voulais créer ma propre affaire.', after: 'L\'accompagnement entrepreneurial m\'a permis de lancer mon e-commerce. Le CA du 1er mois a dépassé mes attentes.', metier: 'E-commerçant', initials: 'CD' },
    { name: 'Bilal A.', age: 23, before: 'Étudiant, j\'avais des idées mais aucune notion de business. Je me sentais perdu.', after: 'Le programme entrepreneurial m\'a donné les clés. Mon association est devenue une startup en 1 an.', metier: 'Entrepreneur', initials: 'BA' },
  ],
  parcours: [
    { title: 'Incubateur', description: 'Accompagnement structuré pour lancer son projet avec des experts', icon: 'Rocket', duration: '6-12 mois' },
    { title: 'Auto-entrepreneur', description: 'Lancer une activité indépendante rapidement et à faible coût', icon: 'Zap', duration: 'Immediat' },
    { title: 'Réseau GIDEF', description: 'Accompagnement personnalisé par le réseau GIDEF', icon: 'Users', duration: 'Variable' },
    { title: 'Formation entrepreneuriale', description: 'Acquérir les compétences de gestion, marketing et finance', icon: 'BookOpen', duration: '3-6 mois' },
    { title: 'Micro-crédit', description: 'Obtenir un financement pour lancer son projet', icon: 'Wallet', duration: '1-3 mois' },
  ],
  stats: [
    { label: 'Créations d\'entreprise/an', value: '850 000', suffix: '+' },
    { label: 'Taux de survie à 3 ans', value: '66', suffix: '%' },
    { label: 'Revenu moyen freelance', value: '3 200', suffix: '€/mois' },
    { label: 'Accompagnements GIDEF', value: '15 000', suffix: '/an' },
  ],
}

/* ─────────────────────────────────────────────
   EXPORT ALL DATA
   ───────────────────────────────────────────── */
export const metiersCategories: CategoryData[] = [btpData, socialData, numeriqueData, formationData, entrepreneuriatData]

export function getCategoryBySlug(slug: MetierCategory): CategoryData | undefined {
  return metiersCategories.find(c => c.slug === slug)
}

export default metiersCategories
