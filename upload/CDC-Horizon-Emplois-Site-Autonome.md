# Cahier des Charges — Horizon Emplois (Site Autonome)

> **Projet** : Horizon Emplois — Plateforme d'orientation professionnelle par matching IA  
> **Porteur** : Echo Entreprendre — GIDEF Île-de-France  
> **Version** : 1.0 — Site indépendant  
> **Date** : Juillet 2025  
> **Statut** : Spécification fonctionnelle, technique, marketing et ludique

---

## 1. Vision Stratégique

### 1.1 Concept

Horizon Emplois est une **plateforme web autonome d'orientation professionnelle ludique**, basée sur un moteur de matching par questionnaire IA. Contrairement aux outils classiques (Pôle Emploi, Indeed, LinkedIn) qui partent d'une **offre d'emploi**, Horizon Emplois part du **profil de la personne** — ses soft skills, ses envies, sa situation — pour lui proposer les métiers et formations qui lui correspondent réellement.

Le site s'adresse à un public **jeune (16-35 ans), en reconversion ou éloigné de l'emploi**, souvent non diplômé ou en détachement du système scolaire classique. Le ton est **bienveillant, inclusif, inspirant et décomplexant** — jamais guilt-trip, toujours « tu as des compétences, on va les révéler ».

### 1.2 Positionnement Marketing

| Axe | Positionnement |
|-----|---------------|
| **Segment** | 16-35 ans, Île-de-France, public prioritaire (RSA, NEET, décrocheurs, reconversion) |
| **Promesse** | « Découvre les métiers qui recrutent ET qui te correspondent — en 7 minutes » |
| **Différenciateur** | Approche par les **soft skills** (pas par diplôme) + **jeu de cartes ludique** + données **France Travail temps réel** |
| **Tonalité** | « Tu » — direct, chaleureux, valorisant. Jamais « candidat », toujours « toi » |
| **Anti-positionnement** | Pas unIndeed, pas un LinkedIn, pas un Pôle Emploi. Pas de CV requis. Pas de jargon RH. |
| **Modèle économique** | Gratuit pour l'utilisateur. Monétisation par leads qualifiés (conseillers GIDEF, organismes de formation, OPCO) |

### 1.3 Personas cibles

| Persona | Âge | Situation | Motivation | Frein principal |
|---------|-----|-----------|------------|----------------|
| **Sofia, la décrocheuse** | 18 ans | Sans diplôme, aucune orientation | Veut un métier concret qui paie bien | Manque de confiance, ne se sent pas « capable » |
| **Mamadou, l'actif en reconversion** | 28 ans | Livreur, veut changer de voie | Cherche un métier avec de l'avenir | Ne sait pas par où commencer ni quelles formations existent |
| **Inès, la diplômée sans débouché** | 24 ans | Licence, chômage depuis 1 an | Besoin d'un métier concret avec insertion rapide | Le décalage entre son diplôme et le marché |
| **Fatima, la repriseuse** | 32 ans | 8 ans au foyer, reprend le travail | Veut une formation rapide compatible avec sa vie de famille | Peur de ne plus être employable, manque d'info |
| **Karim, le passionné sans cadre** | 21 ans | Auto-formé bidouilleur, pas de diplôme | Veut monétiser ses compétences numériques | Le système classique ne valorise pas son profil |

### 1.4 Core Loop (Parcours Utilisateur)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Landing    │────▶│  Test IA     │────▶│  Résultats   │────▶│  Action !    │
│   Page       │     │  7 questions │     │  Matching    │     │  Formation   │
│              │     │  3 minutes   │     │  Radar       │     │  Conseiller  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Explorer   │     │  Jeu de      │     │  Offres FT   │
│  par secteur│     │  Cartes      │     │  Formations  │
│  (5 fiches) │     │  Pépites     │     │  Aides       │
└─────────────┘     └──────────────┘     └──────────────┘
```

---

## 2. Contenu Éditorial

### 2.1 Arborescence du Site

```
/                           → Landing Page (hero + secteurs + preuve sociale)
/test-ia                    → Hub Test IA (les 5 domaines)
/test-ia/btp                → Test BTP + fiche complète
/test-ia/social             → Test Social + fiche complète  
/test-ia/numerique          → Test Numérique + fiche complète
/test-ia/formation          → Test Formation + fiche complète
/test-ia/entrepreneuriat    → Test Entrepreneuriat + fiche complète
/jeu-cartes                 → Jeu de Cartes « Pépites Compétences »
/offres-emploi              → Offres d'emploi (France Travail) — filtres géoloc
/formations                 → Formations disponibles — filtres
/aides                      → Aides financières — filtres profil
/mon-profil                 → Profil utilisateur (mes résultats, parcours sauvegardé)
/contact                    → Formulaire de contact / être recontacté
/mentions-legales           → Mentions légales RGPD
```

### 2.2 Landing Page — Structure et Contenu

#### Section 1 : Hero Principal
| Élément | Contenu |
|---------|---------|
| **Badge** | ✨ Propulsé par GIDEF Île-de-France |
| **H1** | Les métiers qui recrutent ne sont pas ceux que tu crois. |
| **Sous-titre** | Réponds à 7 questions. L'IA analyse tes compétences cachées et te révèle les métiers qui te correspondent — avec les formations et les salaires. |
| **CTA principal** | « Faire le test IA » → `/test-ia` |
| **CTA secondaire** | « Jouer aux cartes compétences » → `/jeu-cartes` |
| **Social proof** | « 12 400 personnes ont déjà découvert leur métier idéal » |
| **Visuel** | Illustration animée (personnages divers, bulles compétences, flèches vers métiers) |

#### Section 2 : « Comment ça marche ? »
4 étapes visuelles (timeline horizontale) :

| Étape | Icône | Titre | Description |
|-------|-------|-------|-------------|
| 1 | 🎯 | Tu réponds à 7 questions | Questions rapides sur tes envies, ta personnalité et ton mode de travail |
| 2 | 🧠 | L'IA analyse ton profil | Notre algorithme évalue tes soft skills et compétences comportementales |
| 3 | 🔗 | Matching intelligent | On croise ton profil avec les métiers qui recrutent et les formations disponibles |
| 4 | 🚀 | Orientation sur mesure | Tu reçois tes résultats, tes métiers compatibles et un plan d'action concret |

#### Section 3 : 5 Domaines (Cards Grid)
Grille de 5 cartes cliquables, chaque carte contient :

| Domaine | Couleur | Icône | Accroche | Stats clés |
|---------|--------|-------|----------|------------|
| **BTP** | Amber | 🏗️ | « Et si ton avenir était sur le terrain ? » | 45 000 postes vacants IDF — 92% insertion |
| **Social** | Rose | 🤝 | « Ton empathie peut devenir un vrai métier » | 38 000 postes vacants IDF — 89% insertion |
| **Numérique** | Cyan | 💻 | « Les métiers du digital recrutent maintenant » | 52 000 postes vacants IDF — 87% insertion |
| **Formation** | Emerald | 📚 | « Trouve la formation qui transforme ta carrière » | 120 000 formations/an — 78% reconversion |
| **Entrepreneuriat** | Orange | 🚀 | « Tu as peut-être un profil de créateur sans le savoir » | 850 000 créations/an — 3 200€/mois freelance |

Chaque card a un bouton « Découvrir » → `/test-ia/{slug}`

#### Section 4 : Témoignages Impactants
Carousel de témoignages « avant/après ». 10 témoignages minimum, diversifiés :

> **Mamadou D., 22 ans — Électricien**  
> *« Sans diplôme, je galérais. En 8 mois de formation électricité, j'ai décroché mon premier CDI à 2 100€. Aujourd'hui je gère mes propres chantiers. »*

> **Inès R., 25 ans — No-Code Maker**  
> *« Licence en philo mais aucun débouché. Le no-code m'a ouvert un monde. Je crée des sites web pour des artisans et je facture 2 500€/mois. »*

> **Fatima Z., 32 ans — Aide à domicile**  
> *« Mère au foyer depuis 8 ans, je pensais ne plus pouvoir retravailler. La formation de 3 mois m'a permis de reprendre une activité. Je suis épanouie. »*

> **Youssef K., 20 ans — Community Manager**  
> *« Je passais mes journées sur TikTok sans but. Formation CM de 4 mois. Aujourd'hui je gère les réseaux de 3 clients en freelance. »*

> **Omar S., 26 ans — Freelance Développeur**  
> *« Salarié sous-utilisé. En 6 mois, freelance. Je gagne 2x plus et je choisis mes missions. »*

> **Sarah L., 19 ans — Plaquiste**  
> *« J'ai arrêté mes études et je me sentais nulle. La plaquisterie m'a redonné confiance. En 6 mois j'étais en alternance. »*

> **Aïcha M., 24 ans — AESH**  
> *« La vente me vidait de mon sens. L'AESH a été une révélation. J'accompagne un enfant autiste et chaque journée compte. »*

> **Dylan M., 18 ans — Assistant IA**  
> *« Je n'aimais pas l'école classique mais j'adorais bidouiller. Formation IA 3 mois → CDI. Le meilleur choix de ma vie. »*

> **Rachid T., 35 ans — Développeur Web**  
> *« 15 ans en restauration, douleurs physiques. CPF → formation dev web 5 mois → premier poste en startup. »*

> **Camille D., 31 ans — E-commerçant**  
> *« Après 8 ans dans le commerce. Mon e-commerce dépasse mes attentes dès le 1er mois. »*

#### Section 5 : Chiffres Clés (Barre animée)
| Indicateur | Valeur |
|-----------|--------|
| Métiers en tension en IDF | 287 000+ |
| Formations financées / an | 120 000+ |
| Taux d'insertion moyen | 89% |
| Satisfaction utilisateurs | 94% |
| Tests réalisés | 35 000+ |

#### Section 6 : Preuve Partenariale
Logos + noms : France Travail, Région Île-de-France, BPI France, CCI IDF, OPCO, GIDEF

#### Section 7 : FAQ
10 questions fréquentes avec réponses :
1. « Est-ce vraiment gratuit ? » → Oui, 100% financé par GIDEF et ses partenaires
2. « Je n'ai pas de diplôme, c'est pour moi ? » → Absolument, on valorise les compétences pas les diplômes
3. « Combien de temps dure le test ? » → 3 à 5 minutes maximum
4. « Mes données sont-elles protégées ? » → Oui, conformité RGPD totale
5. « Qu'est-ce que le jeu de cartes ? » → Un mode ludique pour découvrir tes soft skills en swipant
6. « Les offres d'emploi sont-elles mises à jour ? » → Oui, en temps réel via France Travail
7. « Comment être recontacté par un conseiller ? » → Après le test, laisse tes coordonnées
8. « Je suis déjà en poste, c'est pour moi ? » → Oui, parfait pour une reconversion
9. « Le site fonctionne sur mobile ? » → Oui, optimisé mobile-first
10. « Quelle différence avec Pôle Emploi ? » → On part de TON profil, pas des offres. On révèle tes compétences cachées.

#### Section 8 : CTA Final
| Élément | Contenu |
|---------|---------|
| **Titre** | Prêt à découvrir ton métier idéal ? |
| **Sous-titre** | 7 minutes. 7 questions. Un avenir qui te correspond. |
| **CTA** | « Commencer le test — C'est gratuit » |

---

## 3. Fonctionnalités Détaillées

### 3.1 Moteur de Test IA (Quiz par domaine)

#### 3.1.1 Logique de scoring
Chaque domaine dispose de :
- **7 questions** à choix multiple (4 options par question)
- **6-7 compétences** mesurées par domaine
- **Matrice de scores** : chaque option attribue un score (1-5) à chaque compétence

**Algorithme de calcul :**
```
Pour chaque compétence c:
  score_brut[c] = Σ (question.scores[answer][c]) pour chaque question répondue
  score_normalisé[c] = (score_brut[c] / (nb_questions × 5)) × 100

Pour chaque métier résultat r:
  match[r] = r.match_base + ((avg_score - 65) × 0.3) + variance_aléatoire(-4, +4)
  match[r] = clamp(match[r], 55, 98)
  Trier les résultats par match décroissant
```

#### 3.1.2 Parcours Quiz (5 étapes)

| Étape | Écran | Description |
|-------|-------|-------------|
| **Intro** | Card de présentation | Titre du quiz, badges compétences, infos (N questions, résultats instantanés, gratuit), bouton « Commencer » |
| **Playing** | Question animée | Barre de progression (question X/7), carte question avec 4 options A/B/C/D, navigation précédent/suivant, animation Framer Motion |
| **Results Preview** | Teaser flouté | Radar chart SVG (6-7 axes), Top 3 résultats (seul le #1 visible, les autres floutés), CTA « Recevoir mon analyse complète » |
| **Lead Form** | Formulaire coordonnées | Prénom, Âge, Email, Téléphone, Ville — avec validation et loader d'envoi |
| **Results Full** | Résultats complets | Radar chart agrandi, barres de compétences animées (0-100%), ranking complet des métiers avec match %, description de chaque métier, CTA « Être recontacté » + « Refaire le test » |

#### 3.1.3 Données par domaine (5 secteurs)

**BTP — Métiers du BTP** (7 compétences, 7 questions, 6 résultats)
- Compétences : Mobilité, Endurance, Logique, Esprit d'équipe, Travail manuel, Résistance au stress, Autonomie
- Résultats : Électricien (92%), Rénovation énergétique (90%), Technicien maintenance (88%), Plaquiste (85%), Conducteur d'engins (80%), Peintre (78%)
- 6 fiches métiers : salaire, formation, demande, évolution
- 3 témoignages avant/après
- 5 parcours d'accès : Emploi direct, Alternance, Formation certifiante, Entrepreneuriat, Insertion
- Stats : 45 000+ postes, 1 850€/mois, 8 mois formation, 92% insertion

**Social — Métiers du Social** (6 compétences, 7 questions, 6 résultats)
- Compétences : Empathie, Patience, Communication, Gestion émotionnelle, Écoute, Stabilité émotionnelle
- Résultats : Accompagnant éducatif (92%), Médiateur social (90%), AESH (88%), Éducateur spécialisé (86%), Aide à domicile (85%), Animateur (82%)
- 6 fiches métiers, 3 témoignages, 5 parcours
- Stats : 38 000+ postes, 1 650€/mois, 6 mois formation, 89% insertion

**Numérique — Métiers du Numérique** (6 compétences, 7 questions, 6 résultats)
- Compétences : Logique, Créativité, Autonomie, Curiosité, Communication digitale, Résolution problèmes
- Résultats : Créateur de contenu (90%), Community Manager (88%), IA Assistant (86%), No-Code Maker (84%), Monteur vidéo (82%), Support IT (80%)
- 6 fiches métiers, 3 témoignages, 5 parcours
- Stats : 52 000+ postes, 2 000€/mois, 4 mois formation, 87% insertion

**Formation & Reconversion** (6 compétences, 7 questions, 6 résultats)
- Compétences : Motivation, Capacité d'apprentissage, Orientation pratique, Persévérance, Adaptabilité, Projet professionnel
- Résultats : Formation Numérique (90%), Formation BTP (88%), Formation Indépendante (86%), Formation Social (85%), Formation Commerce (82%), Formation Artistique (80%)
- 6 fiches métiers, 3 témoignages, 5 parcours
- Stats : 120 000+ formations/an, 3 500€ CPF, 78% reconversion, 2 100€/mois

**Entrepreneuriat** (6 compétences, 7 questions, 5 résultats)
- Compétences : Leadership, Prise de risque, Autonomie, Créativité, Organisation, Résilience
- Résultats : Entrepreneur (94%), Freelance (88%), Profil hybride (86%), Intrapreneur (82%), Manager (80%)
- 6 fiches métiers, 3 témoignages, 5 parcours
- Stats : 850 000+ créations/an, 66% survie 3 ans, 3 200€/mois freelance, 15 000 GIDEF/an

### 3.2 Jeu de Cartes « Pépites Compétences »

#### 3.2.1 Concept
Un jeu de swipe **Tinder-style** (gauche/droite) pour identifier ses soft skills de manière ludique. L'utilisateur swipe 60 cartes de compétences :

- **Swipe droite** ✅ = « Ça c'est moi ! » (compétence acquise / naturelle)
- **Swipe gauche** ❌ = « Pas encore » (compétence à développer)
- **Double tap** ⭐ = « Je suis expert ! » (super-pépite)

#### 3.2.2 Les 60 Cartes — 6 Dimensions × 10 Compétences

| Dimension | Couleur | Emoji | Compétences (10) |
|-----------|---------|-------|------------------|
| **Leadership & Vision** | Amber | 👑 | Leadership, Vision stratégique, Prise de décision, Délégation, Gestion de conflits, Mentorat, Esprit d'initiative, Persuasion, Orientation résultat, Responsabilité |
| **Gestion du Stress** | Sky | 🧘 | Résilience, Gestion émotionnelle, Performance sous pression, Gestion du temps, Équilibre pro/perso, Patience, Mindfulness, Gestion de l'incertitude, Discipline personnelle, Sourire et positivité |
| **Communication** | Violet | 💬 | Écoute active, Expression orale, Expression écrite, Négociation, Présentation publique, Empathie, Feedback, Networking, Adaptation langage, Storytelling |
| **Résolution de Problèmes** | Rose | 🧩 | Analyse, Pensée critique, Pensée structurée, Recherche de solutions, Anticipation, Gestion de crise, Planification, Priorisation, Jugement, Pragmatisme |
| **Créativité & Innovation** | Blue | 💡 | Pensée latérale, Observation, Expérimentation, Remise en question, Inspiration croisée, Design thinking, Intuition, Curiosité, Visualisation, Innovation produit |
| **Adaptabilité** | Emerald | 🌿 | Flexibilité, Veille continue, Apprentissage rapide, Ouverture d'esprit, Gestion du changement, Polyvalence, Tolérance à l'ambiguïté, Collaboration, Humilité, Persévérance |

#### 3.2.3 Parcours du Jeu

| Étape | Description |
|-------|-------------|
| **Intro** | Explication du jeu (60 cartes, 5-8 min), aperçu des 6 dimensions, bouton « Jouer » |
| **Swipe** | Carte centrale avec compétence + description + icône. Swipe tactile ou boutons. Compteur (X/60). Barre de progression par dimension. |
| **Auto-évaluation** | Après chaque swipe, optionnel : « Tu te donnes quel niveau de confiance ? » (1-5 étoiles) |
| **Résultats** | Radar Kiviat 6 axes avec scores, répartition Pépites/À développer, correspondance métiers suggérés |
| **Action** | Lien vers le test IA du domaine le plus fort, partage réseaux sociaux |

#### 3.2.4 Scoring

```
Score_Dimension = (Pépite_simple × 1 + Super_pépite × 1.5) / Total_cartes_dimension × 100

Radar Kiviat : 6 axes, score 0-100 par dimension
Profil : Dimension dominante = recommandation métier
```

### 3.3 Offres d'Emploi en Temps Réel (France Travail)

#### 3.3.1 Source de données
API France Travail — endpoint `api_offresdemploiv2` (OAuth2 client_credentials)

#### 3.3.2 Fonctionnalités
| Fonctionnalité | Description |
|---------------|-------------|
| **Recherche textuelle** | Mots-clés libres (ex: "électricien", "community manager") |
| **Filtres** | Code postal, département, région, type de contrat (CDI/CDD/Intérim), expérience, temps plein/partiel |
| **Géolocalisation** | Auto-détection IP + proposition de commune (via API geo.api.gouv.fr) |
| **Résultats** | Liste paginée avec : titre, entreprise, lieu, salaire, type contrat, date publication, lien vers offre FT |
| **Tri** | Par pertinence ou date de publication |
| **Suggestion** | Après le test IA : « Voici les offres qui correspondent à ton profil [métier] dans ta zone » |

### 3.4 Formations Disponibles

| Fonctionnalité | Description |
|---------------|-------------|
| **Recherche** | Mots-clés + localisation |
| **Filtres** | Domaine, niveau, certification, durée |
| **Résultats** | Intitulé, organisme, lieu, durée, date début, financement possible |
| **Matching** | Après le test IA : formations recommandées selon le profil |

### 3.5 Aides Financières

| Fonctionnalité | Description |
|---------------|-------------|
| **Recherche** | Par profil (RSA, jeune <26, RQTH, demandeur d'emploi) |
| **Filtres** | Type d'aide, localisation |
| **Résultats** | Titre, description, montants, eligibility, lien démarche |
| **Auto-détection** | Selon les infos du lead form (âge, situation), filtrer les aides éligibles automatiquement |

### 3.6 Profil Utilisateur

| Fonctionnalité | Description |
|---------------|-------------|
| **Sauvegarde locale** | Résultats de quiz + jeu de cartes en localStorage |
| **Historique** | Quiz réalisés, scores par domaine, progression |
| **Export PDF** | « Mon bilan compétences » téléchargeable |
| **Partage** | Générer un lien de partage ou poster sur réseaux sociaux |
| **Recontact** | Être rappelé par un conseiller GIDEF |

### 3.7 Lead Management (Back-office)

| Fonctionnalité | Description |
|---------------|-------------|
| **Collecte** | Formulaire lead : prénom, âge, email, téléphone, ville, domaine testé |
| **Stockage** | Base de données (Prisma) + notification webhook Slack/Email |
| **Tableau de bord** | Liste des leads avec filtres (date, domaine, score), export CSV |
| **Statistiques** | Nombre de tests/jour, taux de conversion lead, domaines populaires |
| **RGPD** | Consentement explicite, droit d'oubli, durée de rétention 24 mois |

---

## 4. Positionnement Marketing Détaillé

### 4.1 Axes de communication

| Axe | Message | Canal |
|-----|---------|-------|
| **Inspirant** | « Tu as des compétences cachées. On va les révéler. » | Réseaux sociaux (TikTok, Instagram Reels) |
| **Concret** | « 45 000 postes vacants dans le BTP. 92% d'insertion. » | Google Ads, SEO local |
| **Inclusif** | « Pas besoin de diplôme. Pas besoin de CV. Juste toi. » | Affichage métro/bus IDF, partenaires associatifs |
| **Urgent** | « Les formations sont financées. Les places sont limitées. » | Retargeting, email |
| **Social** | « 12 400 personnes ont déjà trouvé leur métier. » | Preuve sociale, témoignages vidéo |

### 4.2 Stratégie SEO

| Mots-clés cibles | Volume estimé | Intention |
|-----------------|:---:|-----------|
| test orientation professionnelle gratuit | 8 000/mois | Transactionnel |
| métiers qui recrutent sans diplôme | 5 000/mois | Informationnel |
| reconversion professionnelle IDF | 3 500/mois | Transactionnel |
| formation courte qui recrute | 2 800/mois | Informationnel |
| test compétences soft skills | 2 000/mois | Informationnel |
| quels métiers pour moi | 6 500/mois | Informationnel |
| jeu orientation professionnelle | 1 500/mois | Navigationnel |
| aide financière formation | 4 000/mois | Transactionnel |

### 4.3 Acquisition

| Canal | Action | Budget mensuel |
|-------|--------|:---:|
| **TikTok** | 3 vidéos/semaine (témoignages, before/after, quiz interactif) | 500€ |
| **Instagram** | Reels + Stories + carrousel métiers | 300€ |
| **Google Ads** | Search « test orientation », « métiers sans diplôme » IDF | 800€ |
| **Facebook** | Retargeting visiteurs + lookalike audiences | 400€ |
| **Partenariats** | Missions locales, PLIE, centres sociaux, collèges/lycées | 0€ |
| **SEO** | Blog « Le guide des métiers qui recrutent » + fiches par métier | 0€ |
| **Bouche-à-oreille** | Partage des résultats sur réseaux sociaux (UGC) | 0€ |

### 4.4 Branding

| Élément | Spécification |
|---------|--------------|
| **Nom** | Horizon Emplois |
| **Baseline** | « Tes compétences valent de l'or. Découvre-les. » |
| **Logo** | Typo moderne + icône horizon/compas. Déclinaison compacte (favicon) et étendue (navbar) |
| **Palette** | Gradient principal : Teal → Cyan. Accents : Coral, Amber. Dark mode : Slate/Indigo |
| **Typography** | Inter (corps) + Space Grotesk (titres) |
| **Tone of voice** | Direct (tu), valorisant, pas guilt-trip, accessible (Flesch > 60), inclusif |
| **Illustrations** | Flat design, personnages divers (ethnies, âges, styles), pas de stock photos cliché |

---

## 5. Architecture Technique

### 5.1 Stack

| Couche | Technologie | Justification |
|-------|-------------|--------------|
| Framework | Next.js 16 (App Router) | SEO, performances, déploiement facile |
| Styling | Tailwind CSS 4 + shadcn/ui | Cohérence design, composants accessibles |
| Animations | Framer Motion | Quiz flow, transitions, micro-interactions |
| Charts | SVG natif (radar) + Recharts (futur dashboard) | Léger, customisable |
| Base de données | Prisma ORM + PostgreSQL | Leads, résultats, analytics |
| Auth | JWT stateless (optionnel) | Profil utilisateur sauvegardé |
| APIs externes | France Travail OAuth2 + Geo API | Offres, formations, aides, géolocalisation |
| Analytics | Plausible/Umami | Respectueux RGPD, pas de cookies tiers |
| Déploiement | Vercel | Edge, preview, rollback instantané |
| Email | Resend / Nodemailer | Notifications conseiller, export résultats |

### 5.2 Pages et Routes

| Route | Type | SSR/CSR | Auth |
|-------|------|---------|------|
| `/` | Landing | SSR | Non |
| `/test-ia` | Hub quiz | SSR | Non |
| `/test-ia/[slug]` | Quiz domaine | CSR | Non |
| `/jeu-cartes` | Jeu de cartes | CSR | Non |
| `/offres-emploi` | Offres FT | CSR | Non |
| `/formations` | Formations FT | CSR | Non |
| `/aides` | Aides financières | CSR | Non |
| `/mon-profil` | Profil | CSR | Optionnel |
| `/api/leads` | POST lead | — | Non |
| `/api/quiz/results` | POST sauvegarde | — | Non |
| `/api/france-travail/*` | Proxy FT | — | Non |
| `/api/geo/communes` | Geo autocomplete | — | Non |

### 5.3 Performance

| Métrique | Cible |
|---------|-------|
| LCP (Largest Contentful Paint) | < 2s |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| Time to Interactive | < 3s |
| Lighthouse Mobile | > 90 |
| Core Web Vitals | Pass |

### 5.4 Modèles de Données (Prisma)

```prisma
model Lead {
  id          String   @id @default(cuid())
  prenom      String
  age         Int?
  email       String
  telephone   String?
  ville       String?
  domaine     String?  // btp, social, numerique, formation, entrepreneuriat
  quizScores  Json?    // Compétences normalisées
  topResults  Json?    // Résultats de matching
  source      String   @default("web") // web, tiktok, referral
  consent     Boolean  @default(false)
  contacted   Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model QuizAttempt {
  id           String   @id @default(cuid())
  sessionId    String   // localStorage ID ou user ID
  domaine      String
  answers      Json     // [{questionId, optionIndex}]
  scores       Json     // {competence: score}
  topResults   Json     // [{title, match, description}]
  completedAt  DateTime @default(now())
}

model SwipeSession {
  id           String   @id @default(cuid())
  sessionId    String
  results      Json     // [{cardCode, kept, superPepite, confidence}]
  dimensionScores Json  // {leadership: 75, stress: 60, ...}
  completedAt  DateTime @default(now())
}

model PageView {
  id        String   @id @default(cuid())
  path      String
  referrer  String?
  sessionId String?
  createdAt DateTime @default(now())
}
```

---

## 6. Jeu de Cartes — Spécification Détaillée

### 6.1 UX du Swipe

| Élément | Spécification |
|---------|--------------|
| **Carte** | 340×480px, coins arrondis 24px, ombre portée, glassmorphism subtil |
| **Contenu** | Icône emoji (48px), Titre compétence (bold), Description (2-3 lignes), Badge dimension (colore) |
| **Swipe droit** | Carte part vers la droite avec rotation 15° + checkmark vert + « Pépite ! » toast |
| **Swipe gauche** | Carte part vers la gauche avec rotation -15° + croix rouge + « À développer » toast |
| **Double tap** | Confetti + badge étoile dorée + « Super pépite ! » toast + flash doré |
| **Boutons desktop** | ❌ Pass (gauche) / ⭐ Expert (centre) / ✅ Pépite (droite) |
| **Progression** | Barre globale (X/60) + mini barres par dimension |
| **Retour** | Possible de revenir sur les 3 dernières cartes (undo stack) |

### 6.2 Écrans du Jeu

#### Écran 1 : Introduction
- Titre : « Découvre tes compétences cachées »
- Explication : 60 cartes, 6 dimensions, 5-8 minutes
- Aperçu visuel : 6 cartes empilées en perspective
- Bouton : « Jouer maintenant »

#### Écran 2 : Swipe
- Carte frontale avec animation spring
- Compteur : « Carte 23/60 »
- Progression : barre circulaire avec %
- Badges : « 12 pépites » / « 5 super-pépites » / « Dimension : Créativité (7/10 traitées) »
- Undo : bouton retour (max 3)

#### Écran 3 : Bilan
- Radar Kiviat SVG animé (6 axes)
- Compteurs : X pépites / Y à développer / Z super-pépites
- Top 3 compétences « pépites » avec étoiles
- Top 3 compétences « à développer » avec cibles
- « Ton profil type : [Leadership / Créatif / Communicant / etc.] »
- Boutons : « Voir les métiers liés à mon profil » / « Recommencer » / « Partager »

### 6.3 Données des 60 Cartes

*(Voir annexe A — listing complet avec codes, descriptions, emojis)*

### 6.4 Intégration Test IA

Après le jeu de cartes :
1. Les 3 dimensions les plus fortes sont identifiées
2. Le domaine le plus proche est recommandé (ex: Créativité forte → Test Numérique)
3. Un CTA personnalisé : « Tu es plutôt [domaine] ! Fais le test pour affiner → »

---

## 7. Critères d'Acceptation

### 7.1 Fonctionnels
- [ ] Landing page complète avec toutes les sections (hero, comment ça marche, 5 domaines, témoignages, FAQ, CTA)
- [ ] 5 quiz fonctionnels (BTP, Social, Numérique, Formation, Entrepreneuriat) avec scoring
- [ ] Jeu de cartes 60 cartes avec swipe + double tap + undo
- [ ] Résultats quiz avec radar chart + ranking + lead form
- [ ] Résultats jeu avec radar Kiviat + recommandation domaine
- [ ] Offres d'emploi en temps réel (France Travail API)
- [ ] Formations disponibles (France Travail API)
- [ ] Aides financières filtrées par profil
- [ ] Géolocalisation + autocomplétion communes
- [ ] Profil utilisateur avec sauvegarde locale + export PDF
- [ ] Lead capture + stockage DB

### 7.2 Non-fonctionnels
- [ ] Mobile-first, responsive
- [ ] Lighthouse > 90 mobile
- [ ] Temps de chargement < 3s
- [ ] Accessibilité WCAG 2.1 AA (navigation clavier, contrastes, aria-labels)
- [ ] SEO optimisé (meta tags, structured data, sitemap)
- [ ] RGPD (banner cookies, consentement, politique confidentialité)
- [ ] Dark mode supporté

### 7.3 Marketing
- [ ] Contenu rédactionnel complet (copywriting validated)
- [ ] 10 témoignages avant/après intégrés
- [ ] FAQ de 10 questions
- [ ] Meta Open Graph + Twitter Cards pour le partage
- [ ] Lien de partage de résultats personnalisé

---

## 8. Planning Prévisionnel

| Phase | Durée | Contenu |
|-------|-------|---------|
| **Phase 1** | 3 jours | Landing page + 5 quiz + moteur de scoring |
| **Phase 2** | 2 jours | Jeu de cartes 60 cartes + swipe + résultats Kiviat |
| **Phase 3** | 2 jours | Intégration France Travail (offres, formations, aides, geo) |
| **Phase 4** | 1 jour | Lead management + profil utilisateur + export PDF |
| **Phase 5** | 1 jour | SEO, RGPD, analytics, dark mode, accessibilité |
| **Phase 6** | 1 jour | Tests cross-browser, performance, content review |
| **Total** | **10 jours** | |

---

## 9. Annexes

### Annexe A — 60 Cartes Pépites (Résumé)

| # | Code | Compétence | Dimension | Emoji | Difficulté |
|---|------|-----------|-----------|-------|:---:|
| 1 | ldr-01 | Leadership | Leadership | 👑 | 2 |
| 2 | ldr-02 | Vision stratégique | Leadership | 🔭 | 3 |
| 3 | ldr-03 | Prise de décision | Leadership | ⚡ | 3 |
| 4 | ldr-04 | Délégation | Leadership | 🤝 | 2 |
| 5 | ldr-05 | Gestion de conflits | Leadership | ⚖️ | 2 |
| 6 | ldr-06 | Mentorat | Leadership | 📚 | 2 |
| 7 | ldr-07 | Esprit d'initiative | Leadership | 🚀 | 2 |
| 8 | ldr-08 | Persuasion | Leadership | 🎯 | 2 |
| 9 | ldr-09 | Orientation résultat | Leadership | 📈 | 2 |
| 10 | ldr-10 | Responsabilité | Leadership | 🛡️ | 3 |
| 11 | str-01 | Résilience | Stress | 💪 | 3 |
| 12 | str-02 | Gestion émotionnelle | Stress | 🧠 | 2 |
| 13 | str-03 | Performance sous pression | Stress | 🔥 | 3 |
| 14 | str-04 | Gestion du temps | Stress | ⏰ | 1 |
| 15 | str-05 | Équilibre pro/perso | Stress | ⚖️ | 2 |
| 16 | str-06 | Patience | Stress | 🌸 | 2 |
| 17 | str-07 | Mindfulness | Stress | 🧘 | 2 |
| 18 | str-08 | Gestion de l'incertitude | Stress | 🌫️ | 3 |
| 19 | str-09 | Discipline personnelle | Stress | 📋 | 2 |
| 20 | str-10 | Sourire et positivité | Stress | ☀️ | 1 |
| 21 | com-01 | Écoute active | Communication | 👂 | 2 |
| 22 | com-02 | Expression orale | Communication | 🎙️ | 2 |
| 23 | com-03 | Expression écrite | Communication | ✍️ | 2 |
| 24 | com-04 | Négociation | Communication | 🤝 | 3 |
| 25 | com-05 | Présentation publique | Communication | 🎤 | 3 |
| 26 | com-06 | Empathie | Communication | ❤️ | 2 |
| 27 | com-07 | Feedback | Communication | 💬 | 2 |
| 28 | com-08 | Networking | Communication | 🌐 | 2 |
| 29 | com-09 | Adaptation langage | Communication | 🗣️ | 2 |
| 30 | com-10 | Storytelling | Communication | 📖 | 2 |
| 31 | res-01 | Analyse | Résolution | 🔍 | 2 |
| 32 | res-02 | Pensée critique | Résolution | 🧩 | 3 |
| 33 | res-03 | Pensée structurée | Résolution | 📐 | 2 |
| 34 | res-04 | Recherche de solutions | Résolution | 💡 | 2 |
| 35 | res-05 | Anticipation | Résolution | 👁️ | 3 |
| 36 | res-06 | Gestion de crise | Résolution | 🚨 | 3 |
| 37 | res-07 | Planification | Résolution | 📅 | 2 |
| 38 | res-08 | Priorisation | Résolution | 📊 | 2 |
| 39 | res-09 | Jugement | Résolution | ⚖️ | 2 |
| 40 | res-10 | Pragmatisme | Résolution | 🔧 | 2 |
| 41 | cre-01 | Pensée latérale | Créativité | 🌀 | 3 |
| 42 | cre-02 | Observation | Créativité | 👀 | 2 |
| 43 | cre-03 | Expérimentation | Créativité | 🧪 | 2 |
| 44 | cre-04 | Remise en question | Créativité | ❓ | 2 |
| 45 | cre-05 | Inspiration croisée | Créativité | 🔗 | 3 |
| 46 | cre-06 | Design thinking | Créativité | 💎 | 3 |
| 47 | cre-07 | Intuition | Créativité | ✨ | 2 |
| 48 | cre-08 | Curiosité | Créativité | 🔬 | 1 |
| 49 | cre-09 | Visualisation | Créativité | 🎨 | 2 |
| 50 | cre-10 | Innovation produit | Créativité | 🚀 | 3 |
| 51 | ada-01 | Flexibilité | Adaptabilité | 🌊 | 2 |
| 52 | ada-02 | Veille continue | Adaptabilité | 📡 | 2 |
| 53 | ada-03 | Apprentissage rapide | Adaptabilité | 🧠 | 2 |
| 54 | ada-04 | Ouverture d'esprit | Adaptabilité | 🌈 | 1 |
| 55 | ada-05 | Gestion du changement | Adaptabilité | 🔄 | 3 |
| 56 | ada-06 | Polyvalence | Adaptabilité | 🛠️ | 2 |
| 57 | ada-07 | Tolérance à l'ambiguïté | Adaptabilité | 🌫️ | 3 |
| 58 | ada-08 | Collaboration | Adaptabilité | 👥 | 2 |
| 59 | ada-09 | Humilité | Adaptabilité | 🙏 | 2 |
| 60 | ada-10 | Persévérance | Adaptabilité | 🏔️ | 2 |

### Annexe B — Glossaire

| Terme | Définition |
|-------|-----------|
| **Soft skills** | Compétences comportementales et transversales (communication, leadership, etc.) |
| **Kiviat** | Diagramme radar à N axes pour visualiser un profil multidimensionnel |
| **Match** | Pourcentage de compatibilité entre le profil utilisateur et un métier |
| **Pépite** | Compétence identifiée comme acquise/naturelle via le swipe |
| **Lead** | Prospect ayant rempli le formulaire de contact après un quiz |
| **ROME** | Répertoire Opérationnel des Métiers et Emplois (France Travail) |
| **FT** | France Travail (ex-Pôle Emploi) |
| **GIDEF** | Groupement pour le Développement de l'Entrepreneuriat en France |

### Annexe C — KPIs de Suivi

| KPI | Cible Mois 1 | Cible Mois 3 | Cible Mois 6 |
|-----|:---:|:---:|:---:|
| Visiteurs uniques | 2 000 | 8 000 | 20 000 |
| Quiz complétés | 500 | 3 000 | 10 000 |
| Jeu de cartes complété | 300 | 1 500 | 5 000 |
| Leads capturés | 100 | 600 | 2 000 |
| Taux de conversion lead | 20% | 20% | 20% |
| Taux de rebond | < 40% | < 35% | < 30% |
| Temps moyen sur site | 4 min | 5 min | 6 min |
| Partages résultats | 50 | 300 | 1 000 |
| Conseillers recontactés | 10 | 60 | 200 |
| NPS | > 40 | > 50 | > 60 |
