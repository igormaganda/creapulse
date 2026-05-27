// ============================================================
// Pépites Game — Swipe Cards & Kiviat Dimensions
// ============================================================

export interface SwipeCardData {
  code: string
  title: string
  description: string
  icon: string
  category: string
  difficulty: 1 | 2 | 3
  weight: number
  sortOrder: number
}

export interface KiviatDimension {
  code: string
  label: string
  description: string
  color: string
  emoji: string
}

// ============================================================
// 6 Kiviat Dimensions
// ============================================================

export const KIVIAT_DIMENSIONS: KiviatDimension[] = [
  {
    code: "leadership",
    label: "Leadership & Vision",
    description:
      "Capacité à inspirer, diriger et donner une direction stratégique à un projet ou une équipe.",
    color: "amber",
    emoji: "👑",
  },
  {
    code: "stress",
    label: "Gestion du stress",
    description:
      "Aptitude à rester performant et serein face à la pression et l'incertitude.",
    color: "sky",
    emoji: "🧘",
  },
  {
    code: "communication",
    label: "Communication",
    description:
      "Art de transmettre des idées clairement, d'écouter et de créer des connexions authentiques.",
    color: "violet",
    emoji: "💬",
  },
  {
    code: "resolution",
    label: "Résolution de problèmes",
    description:
      "Savoir analyser, structurer sa pensée et trouver des solutions efficaces aux défis complexes.",
    color: "rose",
    emoji: "🧩",
  },
  {
    code: "creativity",
    label: "Créativité & Innovation",
    description:
      "Pouvoir d'imaginer des approches inédites et de transformer les idées en réalité.",
    color: "blue",
    emoji: "💡",
  },
  {
    code: "adaptability",
    label: "Adaptabilité",
    description:
      "Aptitude à évoluer dans un environnement changeant et à tirer parti de la nouveauté.",
    color: "emerald",
    emoji: "🌿",
  },
]

// ============================================================
// 60 Swipe Cards — 10 per dimension
// ============================================================

export const SWIPE_CARDS: SwipeCardData[] = [
  // ──────────────────────────────────────────────────────────
  // LEADERSHIP & VISION (ldr-01 → ldr-10)
  // ──────────────────────────────────────────────────────────
  {
    code: "ldr-01",
    title: "Leadership",
    description:
      "Inspirer, motiver et guider une équipe vers un objectif commun. Le vrai leader ne se contente pas de donner des ordres — il allume un feu intérieur chez chaque membre.",
    icon: "🚀",
    category: "leadership",
    difficulty: 2,
    weight: 1.0,
    sortOrder: 1,
  },
  {
    code: "ldr-02",
    title: "Vision stratégique",
    description:
      "Anticiper les tendances, définir une direction claire et donner du sens à chaque action. C'est l'art de voir l'invisible et de le rendre tangible pour tous.",
    icon: "🔭",
    category: "leadership",
    difficulty: 3,
    weight: 1.1,
    sortOrder: 2,
  },
  {
    code: "ldr-03",
    title: "Prise de décision",
    description:
      "Choisir rapidement et avec assurance, même lorsque les informations sont incomplètes. Le meilleur moment pour une bonne décision, c'est maintenant.",
    icon: "⚡",
    category: "leadership",
    difficulty: 2,
    weight: 1.0,
    sortOrder: 3,
  },
  {
    code: "ldr-04",
    title: "Délégation",
    description:
      "Confier les bonnes tâches aux bonnes personnes en faisant confiance. Déléguer intelligemment, c'est multiplier son impact tout en développant les talents de chacun.",
    icon: "🤝",
    category: "leadership",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 4,
  },
  {
    code: "ldr-05",
    title: "Gestion de conflits",
    description:
      "Résoudre les tensions avec diplomatie et maintenir la cohésion d'équipe. Transformer le friction en énergie créatrice, voilà le défi.",
    icon: "🛡️",
    category: "leadership",
    difficulty: 3,
    weight: 1.0,
    sortOrder: 5,
  },
  {
    code: "ldr-06",
    title: "Mentorat",
    description:
      "Accompagner et former les autres dans leur développement professionnel et personnel. Le meilleur héritage d'un leader est le talent qu'il a su cultiver.",
    icon: "🎓",
    category: "leadership",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 6,
  },
  {
    code: "ldr-07",
    title: "Esprit d'initiative",
    description:
      "Proposer et mettre en œuvre des actions sans attendre qu'on vous les demande. Les entrepreneurs ne se contentent pas d'identifier les opportunités — ils les créent.",
    icon: "🔥",
    category: "leadership",
    difficulty: 1,
    weight: 0.8,
    sortOrder: 7,
  },
  {
    code: "ldr-08",
    title: "Persuasion",
    description:
      "Convaincre et influencer positivement ses interlocuteurs. L'art de la persuasion repose sur l'authenticité, la logique et la capacité à se mettre à la place de l'autre.",
    icon: "🎯",
    category: "leadership",
    difficulty: 3,
    weight: 1.0,
    sortOrder: 8,
  },
  {
    code: "ldr-09",
    title: "Orientation résultat",
    description:
      "Se concentrer sur l'atteinte d'objectifs mesurables avec détermination. La vision donne la direction, l'orientation résultat donne le moteur.",
    icon: "📊",
    category: "leadership",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 9,
  },
  {
    code: "ldr-10",
    title: "Responsabilité",
    description:
      "Assumer pleinement ses décisions et leurs conséquences, bonnes ou mauvaises. La responsabilité est le socle de toute confiance et de toute crédibilité.",
    icon: "⚖️",
    category: "leadership",
    difficulty: 2,
    weight: 1.0,
    sortOrder: 10,
  },

  // ──────────────────────────────────────────────────────────
  // GESTION DU STRESS (str-01 → str-10)
  // ──────────────────────────────────────────────────────────
  {
    code: "str-01",
    title: "Résilience",
    description:
      "Rebondir après un échec ou un coup dur, plus fort qu'avant. La résilience n'est pas l'absence de chocs — c'est la capacité à transformer l'adversité en tremplin.",
    icon: "💪",
    category: "stress",
    difficulty: 2,
    weight: 1.0,
    sortOrder: 1,
  },
  {
    code: "str-02",
    title: "Gestion émotionnelle",
    description:
      "Reconnaître, comprendre et réguler ses émotions pour rester maître de soi. Ce n'est pas supprimer ce qu'on ressent, c'est choisir comment y répondre.",
    icon: "🌊",
    category: "stress",
    difficulty: 3,
    weight: 1.0,
    sortOrder: 2,
  },
  {
    code: "str-03",
    title: "Performance sous pression",
    description:
      "Livrer le meilleur de soi-même lorsque les enjeux sont élevés et le temps limité. Ceux qui brillent sous pression sont ceux qui l'apprivoisent au quotidien.",
    icon: "🏆",
    category: "stress",
    difficulty: 3,
    weight: 1.1,
    sortOrder: 3,
  },
  {
    code: "str-04",
    title: "Gestion du temps",
    description:
      "Organiser son temps avec méthode pour maximiser la productivité sans s'épuiser. Le temps est la seule ressource que personne ne peut acheter — investissons-le avec sagesse.",
    icon: "⏳",
    category: "stress",
    difficulty: 1,
    weight: 0.9,
    sortOrder: 4,
  },
  {
    code: "str-05",
    title: "Équilibre pro/perso",
    description:
      "Maintenir un équilibre sain entre sa vie professionnelle et personnelle. L'équilibre n'est pas une ligne fixe — c'est une danse consciente entre passion et récupération.",
    icon: "⚖️",
    category: "stress",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 5,
  },
  {
    code: "str-06",
    title: "Patience",
    description:
      "Cultiver la capacité à attendre sans frustration et à laisser les choses mûrir. La patience stratégique est une force redoutable : elle permet de frapper au bon moment.",
    icon: "🕰️",
    category: "stress",
    difficulty: 2,
    weight: 0.8,
    sortOrder: 6,
  },
  {
    code: "str-07",
    title: "Mindfulness",
    description:
      "Pratiquer la pleine conscience pour ancrer son esprit dans le présent. Un esprit ancré dans l'instant prend de meilleures décisions et ressent moins le stress.",
    icon: "🧘",
    category: "stress",
    difficulty: 1,
    weight: 0.8,
    sortOrder: 7,
  },
  {
    code: "str-08",
    title: "Gestion de l'incertitude",
    description:
      "Naviguer avec confiance dans des situations floues et imprévisibles. L'incertitude n'est pas l'ennemi — c'est le terrain de jeu de ceux qui osent avancer.",
    icon: "🌌",
    category: "stress",
    difficulty: 3,
    weight: 1.0,
    sortOrder: 8,
  },
  {
    code: "str-09",
    title: "Discipline personnelle",
    description:
      "Maintenir des habitudes et une rigueur qui nourrissent la performance sur le long terme. La motivation te fait démarrer, la discipline te fait avancer.",
    icon: "🎯",
    category: "stress",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 9,
  },
  {
    code: "str-10",
    title: "Sourire et positivité",
    description:
      "Cultiver un état d'esprit optimiste qui booste le moral et l'énergie de l'équipe. Un sourire ne coûte rien, mais il peut tout changer dans une salle de réunion.",
    icon: "😊",
    category: "stress",
    difficulty: 1,
    weight: 0.7,
    sortOrder: 10,
  },

  // ──────────────────────────────────────────────────────────
  // COMMUNICATION (com-01 → com-10)
  // ──────────────────────────────────────────────────────────
  {
    code: "com-01",
    title: "Écoute active",
    description:
      "Écouter avec attention et empathie pour vraiment comprendre l'autre. L'écoute active est un super-pouvoir : elle transforme les conversations en véritables connexions humaines.",
    icon: "👂",
    category: "communication",
    difficulty: 2,
    weight: 1.0,
    sortOrder: 1,
  },
  {
    code: "com-02",
    title: "Expression orale",
    description:
      "S'exprimer avec clarté, conviction et charisme à l'oral. Chaque mot que vous prononcez est une opportunité d'inspirer, de convaincre ou de rassurer.",
    icon: "🎤",
    category: "communication",
    difficulty: 2,
    weight: 1.0,
    sortOrder: 2,
  },
  {
    code: "com-03",
    title: "Expression écrite",
    description:
      "Rédiger des messages clairs, concis et percutants. L'écrit est votre carte de visite silencieuse — chaque e-mail, chaque post, chaque pitch doit être soigné.",
    icon: "✍️",
    category: "communication",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 3,
  },
  {
    code: "com-04",
    title: "Négociation",
    description:
      "Trouver un terrain d'entente gagnant-gagnant dans les situations complexes. Le bon négociateur ne gagne pas contre l'autre — il gagne avec l'autre.",
    icon: "🤝",
    category: "communication",
    difficulty: 3,
    weight: 1.1,
    sortOrder: 4,
  },
  {
    code: "com-05",
    title: "Présentation publique",
    description:
      "Captiver un auditoire et transmettre ses idées avec impact sur scène. La scène est votre alliée — transformez votre trac en énergie et votre message en récit.",
    icon: "🎬",
    category: "communication",
    difficulty: 3,
    weight: 1.1,
    sortOrder: 5,
  },
  {
    code: "com-06",
    title: "Empathie",
    description:
      "Comprendre et partager les émotions des autres pour créer des liens profonds. L'empathie est le pont invisible qui connecte les êtres humains au-delà des mots.",
    icon: "❤️",
    category: "communication",
    difficulty: 2,
    weight: 1.0,
    sortOrder: 6,
  },
  {
    code: "com-07",
    title: "Feedback",
    description:
      "Donner et recevoir des retours constructifs avec bienveillance et honnêteté. Un feedback de qualité est un cadeau rare — offrez-le avec soin et recevez-le avec gratitude.",
    icon: "💬",
    category: "communication",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 7,
  },
  {
    code: "com-08",
    title: "Networking",
    description:
      "Construire et entretenir un réseau de relations professionnelles authentiques et mutuellement bénéfiques. Votre réseau n'est pas une liste de contacts — c'est un capital social vivant.",
    icon: "🌐",
    category: "communication",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 8,
  },
  {
    code: "com-09",
    title: "Adaptation langage",
    description:
      "Ajuster son vocabulaire et son style pour se faire comprendre de tout public. Parler le langage de votre interlocuteur, c'est lui montrer que vous le respectez.",
    icon: "🗣️",
    category: "communication",
    difficulty: 2,
    weight: 0.8,
    sortOrder: 9,
  },
  {
    code: "com-10",
    title: "Storytelling",
    description:
      "Raconter des histoires captivantes pour transmettre un message mémorable. Les faits informent, les histoires transforment — maîtrisez l'art du récit et votre message voyagera loin.",
    icon: "📖",
    category: "communication",
    difficulty: 3,
    weight: 1.0,
    sortOrder: 10,
  },

  // ──────────────────────────────────────────────────────────
  // RÉSOLUTION DE PROBLÈMES (res-01 → res-10)
  // ──────────────────────────────────────────────────────────
  {
    code: "res-01",
    title: "Analyse",
    description:
      "Décomposer un problème complexe en éléments compréhensibles pour identifier les causes profondes. Tout problème devient gérable quand on le découpe avec méthode.",
    icon: "🔍",
    category: "resolution",
    difficulty: 2,
    weight: 1.0,
    sortOrder: 1,
  },
  {
    code: "res-02",
    title: "Pensée critique",
    description:
      "Évaluer les informations avec objectivité et remettre en question les évidences. Ne croyez rien sur parole — posez les bonnes questions et suivez la logique.",
    icon: "🧠",
    category: "resolution",
    difficulty: 3,
    weight: 1.0,
    sortOrder: 2,
  },
  {
    code: "res-03",
    title: "Pensée structurée",
    description:
      "Organiser ses idées de manière logique et hiérarchique pour résoudre efficacement. La clarté mentale naît d'une pensée structurée comme un arbre bien ramifié.",
    icon: "🏗️",
    category: "resolution",
    difficulty: 3,
    weight: 1.0,
    sortOrder: 3,
  },
  {
    code: "res-04",
    title: "Recherche de solutions",
    description:
      "Explorer activement et créativement des pistes pour surmonter les obstacles. Pour chaque problème, il existe au moins une solution — il suffit de la chercher avec méthode.",
    icon: "🛠️",
    category: "resolution",
    difficulty: 2,
    weight: 1.0,
    sortOrder: 4,
  },
  {
    code: "res-05",
    title: "Anticipation",
    description:
      "Identifier les risques et opportunités avant qu'ils ne se manifestent. Le meilleur solveur de problèmes est celui qui l'évite avant même qu'il n'apparaisse.",
    icon: "🔮",
    category: "resolution",
    difficulty: 3,
    weight: 1.1,
    sortOrder: 5,
  },
  {
    code: "res-06",
    title: "Gestion de crise",
    description:
      "Agir avec lucidité et efficacité en situation d'urgence. La crise ne révèle pas le caractère — elle le forge. Restez calme, agissez vite, communiquez clairement.",
    icon: "🚨",
    category: "resolution",
    difficulty: 3,
    weight: 1.1,
    sortOrder: 6,
  },
  {
    code: "res-07",
    title: "Planification",
    description:
      "Élaborer un plan d'action structuré avec des étapes claires et des jalons. Un bon plan n'est pas gravé dans le marbre — c'est une boussole qui vous guide tout en s'adaptant.",
    icon: "📋",
    category: "resolution",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 7,
  },
  {
    code: "res-08",
    title: "Priorisation",
    description:
      "Identifier et traiter en premier ce qui a le plus grand impact. Tout n'est pas urgent — distinguer l'essentiel de l'accessoire est la clé de l'efficacité.",
    icon: "📌",
    category: "resolution",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 8,
  },
  {
    code: "res-09",
    title: "Jugement",
    description:
      "Évaluer les options avec discernement et prendre des décisions éclairées. Le bon jugement est le fruit de l'expérience, de la réflexion et de l'intégrité.",
    icon: "⚖️",
    category: "resolution",
    difficulty: 3,
    weight: 1.0,
    sortOrder: 9,
  },
  {
    code: "res-10",
    title: "Pragmatisme",
    description:
      "Privilégier les solutions concrètes et actionnables plutôt que la théorie parfaite. Le pragmatisme, c'est l'art de transformer les bonnes idées en résultats tangibles.",
    icon: "🧰",
    category: "resolution",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 10,
  },

  // ──────────────────────────────────────────────────────────
  // CRÉATIVITÉ & INNOVATION (cre-01 → cre-10)
  // ──────────────────────────────────────────────────────────
  {
    code: "cre-01",
    title: "Pensée latérale",
    description:
      "Explorer des chemins de pensée inhabituels pour trouver des solutions originales. La pensée latérale contourne les barrières mentales là où la logique linéaire bute.",
    icon: "🌀",
    category: "creativity",
    difficulty: 3,
    weight: 1.0,
    sortOrder: 1,
  },
  {
    code: "cre-02",
    title: "Observation",
    description:
      "Porter une attention fine au monde qui vous entoure pour repérer détails, tendances et opportunités. Les meilleures idées naissent souvent d'une observation attentive du quotidien.",
    icon: "👁️",
    category: "creativity",
    difficulty: 1,
    weight: 0.8,
    sortOrder: 2,
  },
  {
    code: "cre-03",
    title: "Expérimentation",
    description:
      "Tester, itérer et apprendre par la pratique plutôt que par la théorie. Chaque expérience, réussie ou non, est un pas en avant vers l'innovation.",
    icon: "🧪",
    category: "creativity",
    difficulty: 2,
    weight: 1.0,
    sortOrder: 3,
  },
  {
    code: "cre-04",
    title: "Remise en question",
    description:
      "Challenger les certitudes et les modèles établis pour repousser les limites. « C'est comme ça qu'on fait » sont les cinq mots les plus dangereux pour l'innovation.",
    icon: "❓",
    category: "creativity",
    difficulty: 3,
    weight: 1.0,
    sortOrder: 4,
  },
  {
    code: "cre-05",
    title: "Inspiration croisée",
    description:
      "Puiser des idées dans des domaines apparemment éloignés pour créer des solutions hybrides. Les innovations les plus disruptives naissent à l'intersection des disciplines.",
    icon: "🔮",
    category: "creativity",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 5,
  },
  {
    code: "cre-06",
    title: "Design thinking",
    description:
      "Placer l'utilisateur au cœur de sa démarche créative pour concevoir des solutions pertinentes et désirables. Penser comme un designer, c'est résoudre comme un innovateur.",
    icon: "✏️",
    category: "creativity",
    difficulty: 3,
    weight: 1.1,
    sortOrder: 6,
  },
  {
    code: "cre-07",
    title: "Intuition",
    description:
      "Faire confiance à son ressenti pour guider les décisions créatives face à l'inconnu. L'intuition est l'intelligence qui prend un raccourci — apprenez à l'écouter.",
    icon: "✨",
    category: "creativity",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 7,
  },
  {
    code: "cre-08",
    title: "Curiosité",
    description:
      "Cultiver un désir insatiable d'apprendre, de comprendre et de découvrir. La curiosité est l'étincelle de toute innovation — gardez-la vivante et vous ne serez jamais à court d'idées.",
    icon: "🔮",
    category: "creativity",
    difficulty: 1,
    weight: 0.8,
    sortOrder: 8,
  },
  {
    code: "cre-09",
    title: "Visualisation",
    description:
      "Imaginer et représenter mentalement des concepts avant même qu'ils n'existent. Ce que vous pouvez visualiser clairement, vous pouvez le créer concrètement.",
    icon: "🎨",
    category: "creativity",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 9,
  },
  {
    code: "cre-10",
    title: "Innovation produit",
    description:
      "Transformer une idée novatrice en un produit ou service qui répond à un vrai besoin du marché. L'innovation sans valeur utilisateur n'est qu'une invention — visez l'impact.",
    icon: "🚀",
    category: "creativity",
    difficulty: 3,
    weight: 1.1,
    sortOrder: 10,
  },

  // ──────────────────────────────────────────────────────────
  // ADAPTABILITÉ (ada-01 → ada-10)
  // ──────────────────────────────────────────────────────────
  {
    code: "ada-01",
    title: "Flexibilité",
    description:
      "S'adapter facilement aux changements de contexte sans perdre son cap. La flexibilité n'est pas de la faiblesse — c'est l'intelligence qui sait plier sans rompre.",
    icon: "🌊",
    category: "adaptability",
    difficulty: 2,
    weight: 1.0,
    sortOrder: 1,
  },
  {
    code: "ada-02",
    title: "Veille continue",
    description:
      "Surveiller activement les évolutions de son secteur pour rester à la pointe. Dans un monde qui bouge vite, ceux qui s'informent en permanence ont un avantage décisif.",
    icon: "📡",
    category: "adaptability",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 2,
  },
  {
    code: "ada-03",
    title: "Apprentissage rapide",
    description:
      "Acquérir de nouvelles compétences et connaissances en un temps record. La capacité à apprendre vite est la compétence ultime — elle vous rend inévitablement adaptable.",
    icon: "📚",
    category: "adaptability",
    difficulty: 2,
    weight: 1.0,
    sortOrder: 3,
  },
  {
    code: "ada-04",
    title: "Ouverture d'esprit",
    description:
      "Accueillir les perspectives, cultures et idées différentes avec curiosité et respect. L'ouverture d'esprit élargit votre horizon et enrichit votre vision du monde.",
    icon: "🌍",
    category: "adaptability",
    difficulty: 1,
    weight: 0.8,
    sortOrder: 4,
  },
  {
    code: "ada-05",
    title: "Gestion du changement",
    description:
      "Piloter et accompagner les transitions avec agilité et sérénité. Le changement n'est pas une menace — c'est une invitation à évoluer et à se réinventer.",
    icon: "🔄",
    category: "adaptability",
    difficulty: 3,
    weight: 1.0,
    sortOrder: 5,
  },
  {
    code: "ada-06",
    title: "Polyvalence",
    description:
      "Maîtriser plusieurs domaines et savoir basculer d'un rôle à l'autre selon les besoins. Le profil T — large en compétences et profond en expertise — est le modèle de l'adaptabilité.",
    icon: "🛠️",
    category: "adaptability",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 6,
  },
  {
    code: "ada-07",
    title: "Tolérance à l'ambiguïté",
    description:
      "Rester efficace et serein face à des situations floues ou non définies. L'ambiguïté est le terrain de jeu des innovateurs — apprenez à l'apprivoiser.",
    icon: "🌫️",
    category: "adaptability",
    difficulty: 3,
    weight: 1.0,
    sortOrder: 7,
  },
  {
    code: "ada-08",
    title: "Collaboration",
    description:
      "Travailler efficacement avec des profils divers et complémentaires pour atteindre un objectif commun. Seul on va plus vite, ensemble on va plus loin.",
    icon: "🤝",
    category: "adaptability",
    difficulty: 2,
    weight: 0.9,
    sortOrder: 8,
  },
  {
    code: "ada-09",
    title: "Humilité",
    description:
      "Reconnaître ses limites et rester ouvert à l'apprentissage permanent. L'humilité intellectuelle est le début de toute véritable croissance — et le meilleur antidote à l'arrogance.",
    icon: "🌱",
    category: "adaptability",
    difficulty: 1,
    weight: 0.8,
    sortOrder: 9,
  },
  {
    code: "ada-10",
    title: "Persévérance",
    description:
      "Continuer d'avancer malgré les obstacles, les doutes et les revers. Le succès n'est pas une ligne droite — c'est un chemin de persévérance éclairée par la passion.",
    icon: "⛰️",
    category: "adaptability",
    difficulty: 2,
    weight: 1.0,
    sortOrder: 10,
  },
]

// ============================================================
// Helpers
// ============================================================

/** Get cards grouped by dimension code */
export function getCardsByDimension(): Record<string, SwipeCardData[]> {
  return SWIPE_CARDS.reduce<Record<string, SwipeCardData[]>>((acc, card) => {
    if (!acc[card.category]) acc[card.category] = []
    acc[card.category].push(card)
    return acc
  }, {})
}

/** Get a dimension's metadata by code */
export function getDimension(code: string): KiviatDimension | undefined {
  return KIVIAT_DIMENSIONS.find((d) => d.code === code)
}
