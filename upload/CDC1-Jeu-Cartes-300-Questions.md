# Cahier des Charges #1 — Jeu de Cartes « Pépites » & Banque de 300 Questions

> **Projet** : CreaPulse V2 — Echo Entreprendre (BGE Bretagne)  
> **Version** : 2.0  
> **Date** : Juillet 2025  
> **Statut** : Spécification fonctionnelle et technique

---

## 1. Contexte & Objectifs

### 1.1 Contexte

CreaPulse V2 est une plateforme SaaS multi-tenant d'accompagnement à la création/reprise d'entreprise. Dans le cadre de la prestation **CréaScope** (diagnostic expert de 3h), le porteur de projet passe par un parcours structuré en 5 étapes.

Le **Jeu de Cartes « Pépites »** est un module clé de l'**Étape 2 — Découverte**. Il s'inspire du principe Tinder-style (swipe gauche/droite) pour identifier les **soft skills** (compétences comportementales) du porteur. Les résultats alimentent automatiquement le **Radar Kiviat** (diagramme à 6 axes) utilisé par le conseiller lors de l'entretien de 3 heures.

### 1.2 Objectifs

1. **Ludifier** l'identification des compétences entrepreneuriales
2. **Alimenter automatiquement** le Radar Kiviat avec des scores pondérés
3. **Fournir au conseiller** une base objective pour l'entretien diagnostic
4. **Disposer d'une banque de 300 questions** couvrant les 6 dimensions du profil entrepreneurial

---

## 2. État Actuel (Audit)

### 2.1 Composant existant : `swipe-game.tsx`

| Élément | Détail |
|---------|--------|
| **Fichier** | `src/components/creapulse/swipe-game.tsx` (324 lignes) |
| **Techno** | React + Framer Motion (drag gesture) |
| **Cartes actuelles** | 5 compétences uniquement |
| **Interactions** | Swipe gauche (pass) / droite (pépite) + boutons |
| **Persistance** | API `POST /api/modules/pepites` → `SwipeGameResult` |
| **Kiviat auto** | Via `computeKiviatFromSwipes()` dans `modules/pepites/route.ts` |

### 2.2 Compétences actuelles (5 cartes)

| ID | Compétence | Description |
|----|-----------|-------------|
| `leadership` | Leadership | Inspirer, motiver et guider une équipe |
| `creativite` | Créativité | Idées innovantes, penser hors des sentiers |
| `stress` | Gestion du stress | Rester calme et performant sous pression |
| `communication` | Communication | Transmettre clairement, écouter activement |
| `resolution` | Résolution de problèmes | Analyser, identifier causes, solutions structurées |

### 2.3 Limites identifiées

- **Seulement 5 cartes** — Le cahier des charges initial mentionne **40+ compétences**
- **Aucune question contextuelle** — Pas de questionnaire approfondi
- **Pas de modes de jeu variés** — Un seul flux swipe
- **Pas de catégorie/thème** — Toutes les cartes sont en vrac
- **Pas de scoring granulaire** — Binaire oui/non au lieu d'échelle

---

## 3. Spécifications Fonctionnelles

### 3.1 Architecture des Données

#### 3.1.1 Modèle de données Prisma

```prisma
model SwipeCard {
  id          String   @id @default(cuid())
  code        String   @unique          // ex: "ldr-01"
  title       String                    // ex: "Leadership"
  description String                    // Description détaillée
  icon        String                    // Emoji ou Lucide icon
  category    String                    // Dimension Kiviat
  subcategory String?                  // Sous-catégorie
  difficulty  Int      @default(1)     // 1-3 (facile, moyen, expert)
  weight      Float    @default(1.0)   // Poids dans le calcul Kiviat
  sortOrder   Int      @default(0)     // Ordre d'affichage
  isActive    Boolean  @default(true)  // Actif/désactivé
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  swipeResults SwipeGameResult[]
}

model SwipeGameResult {
  id          String   @id @default(cuid())
  userId      String
  cardId      String
  cardCode    String
  cardTitle   String
  kept        Boolean                  // true = pépite, false = pass
  confidence  Int?                     // 1-5 auto-évaluation
  swipedAt    DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
  card        SwipeCard @relation(fields: [cardId], references: [id])

  @@unique([userId, cardId])
}

model SwipeQuestion {
  id          String   @id @default(cuid())
  code        String   @unique
  question    String                    // Texte de la question
  category    String                    // Dimension Kiviat
  subcategory String?
  type        String   @default("scale") // scale | choice | scenario | ranking
  options     Json?                     // Options pour type choice
  helpText    String?                   // Texte d'aide
  difficulty  Int      @default(1)
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  answers     SwipeAnswer[]
}

model SwipeAnswer {
  id          String   @id @default(cuid())
  userId      String
  questionId  String
  value       String                    // Réponse (texte ou JSON)
  confidence  Int?                     // 1-5
  answeredAt  DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
  question    SwipeQuestion @relation(fields: [questionId], references: [id])

  @@unique([userId, questionId])
}
```

#### 3.1.2 Les 6 Dimensions Kiviat

| # | Dimension | Code | Description | Couleur |
|---|-----------|------|-------------|--------|
| 1 | Leadership & Vision | `leadership` | Capacité à diriger, inspirer, prendre des décisions | `amber-500` |
| 2 | Gestion du stress | `stress` | Résilience, gestion émotionnelle, performance sous pression | `sky-500` |
| 3 | Communication | `communication` | Expression claire, écoute active, négociation | `violet-500` |
| 4 | Résolution de problèmes | `resolution` | Analyse, créativité solution, pensée structurée | `rose-500` |
| 5 | Créativité & Innovation | `creativity` | Innovation, pensée latérale, originalité | `blue-500` |
| 6 | Adaptabilité | `adaptability` | Flexibilité, agilité, gestion du changement | `emerald-500` |

### 3.2 Banque de Cartes — 60 Compétences

Chaque dimension contient **10 compétences** (soit 60 cartes au total).

#### 3.2.1 Leadership & Vision (10 cartes)

| # | Code | Compétence | Description |
|---|------|-----------|-------------|
| 1 | `ldr-01` | Leadership | Inspirer, motiver et guider une équipe vers un objectif commun |
| 2 | `ldr-02` | Vision stratégique | Anticiper les tendances, définir une direction claire |
| 3 | `ldr-03` | Prise de décision | Choisir rapidement avec des informations incomplètes |
| 4 | `ldr-04` | Délégation | Confier les bonnes tâches aux bonnes personnes |
| 5 | `ldr-05` | Gestion de conflits | Résoudre les tensions et maintenir la cohésion d'équipe |
| 6 | `ldr-06` | Mentorat | Accompagner et former les autres dans leur développement |
| 7 | `ldr-07` | Esprit d'initiative | Proposer et mettre en œuvre des actions sans attendre |
| 8 | `ldr-08` | Persuasion | Convaincre et influencer positivement ses interlocuteurs |
| 9 | `ldr-09` | Orientation résultat | Se concentrer sur l'atteinte d'objectifs mesurables |
| 10 | `ldr-10` | Responsibility | Assumer ses décisions et leurs conséquences |

#### 3.2.2 Gestion du Stress (10 cartes)

| # | Code | Compétence | Description |
|---|------|-----------|-------------|
| 1 | `str-01` | Résilience | Rebondir après un échec ou un imprévu |
| 2 | `str-02` | Gestion émotionnelle | Reconnaître et maîtriser ses émotions |
| 3 | `str-03` | Performance sous pression | Maintenir la qualité dans les situations tendues |
| 4 | `str-04` | Gestion du temps | Organiser et prioriser ses activités efficacement |
| 5 | `str-05` | Équilibre pro/perso | Maintenir un équilibre durable entre vie privée et travail |
| 6 | `str-06` | Patience | Accepter que certains processus prennent du temps |
| 7 | `str-07` | Mindfulness | Être présent et concentré sur l'instant |
| 8 | `str-08` | Gestion de l'incertitude | Agir malgré le manque de visibilité |
| 9 | `str-09` | Discipline personnelle | Maintenir des habitudes productives régulièrement |
| 10 | `str-10` | Sourire et positivité | Garder une attitude constructive face aux difficultés |

#### 3.2.3 Communication (10 cartes)

| # | Code | Compétence | Description |
|---|------|-----------|-------------|
| 1 | `com-01` | Écoute active | Comprendre profondément le message de son interlocuteur |
| 2 | `com-02` | Expression orale | Parler clairement et de manière convaincante |
| 3 | `com-03` | Expression écrite | Rédiger des messages clairs et professionnels |
| 4 | `com-04` | Négociation | Trouver des accords gagnant-gagnant |
| 5 | `com-05` | Présentation publique | Animer et captiver un auditoire |
| 6 | `com-06` | Empathie | Comprendre et partager les émotions des autres |
| 7 | `com-07` | Feedback | Donner et recevoir des retours constructifs |
| 8 | `com-08` | Networking | Créer et entretenir un réseau professionnel |
| 9 | `com-09` | Adaptation langage | Ajuster son discours au profil de l'interlocuteur |
| 10 | `com-10` | Storytelling | Raconter une histoire engageante et mémorable |

#### 3.2.4 Résolution de Problèmes (10 cartes)

| # | Code | Compétence | Description |
|---|------|-----------|-------------|
| 1 | `res-01` | Analyse | Décomposer un problème complexe en éléments simples |
| 2 | `res-02` | Pensée critique | Évaluer objectivement les informations et arguments |
| 3 | `res-03` | Pensée structurée | Organiser ses idées de manière logique |
| 4 | `res-04` | Recherche de solutions | Explorer plusieurs pistes avant de trancher |
| 5 | `res-05` | Anticipation | Prévoir les risques et obstacles potentiels |
| 6 | `res-06` | Gestion de crise | Prendre les bonnes décisions en situation d'urgence |
| 7 | `res-07` | Planification | Organiser les étapes pour atteindre un objectif |
| 8 | `res-08` | Priorisation | Identifier ce qui est le plus important |
| 9 | `res-09` | Jugement | Évaluer la qualité et la pertinence des options |
| 10 | `res-10` | Pragmatisme | Choisir des solutions réalistes et applicables |

#### 3.2.5 Créativité & Innovation (10 cartes)

| # | Code | Compétence | Description |
|---|------|-----------|-------------|
| 1 | `cre-01` | Pensée latérale | Trouver des solutions originales hors des sentiers battus |
| 2 | `cre-02` | Observation | Repérer les opportunités là où d'autres ne voient rien |
| 3 | `cre-03` | Expérimentation | Tester et itérer rapidement |
| 4 | `cre-04` | Remise en question | Challengé le statu quo et les idées reçues |
| 5 | `cre-05` | Inspiration croisée | Appliquer des idées d'un domaine à un autre |
| 6 | `cre-06` | Design thinking | Résoudre les problèmes avec une approche centrée utilisateur |
| 7 | `cre-07` | Intuition | Faire confiance à son instinct dans la prise de décision |
| 8 | `cre-08` | Curiosité | Explorer activement de nouveaux domaines et connaissances |
| 9 | `cre-09` | Visualisation | Imaginer des concepts et les matérialiser |
| 10 | `cre-10` | Innovation produit | Créer des offres qui se démarquent sur le marché |

#### 3.2.6 Adaptabilité (10 cartes)

| # | Code | Compétence | Description |
|---|------|-----------|-------------|
| 1 | `ada-01` | Flexibilité | S'adapter rapidement aux changements de contexte |
| 2 | `ada-02` | Veille continue | Surveiller les évolutions de son secteur |
| 3 | `ada-03` | Apprentissage rapide | Maîtriser de nouvelles compétences en peu de temps |
| 4 | `ada-04` | Ouverture d'esprit | Accepter les idées et perspectives différentes |
| 5 | `ada-05` | Gestion du changement | Accompagner et mener des transformations |
| 6 | `ada-06` | Polyvalence | Être compétent dans plusieurs domaines |
| 7 | `ada-07` | Tolérance à l'ambiguïté | Agir sans avoir toutes les réponses |
| 8 | `ada-08` | Collaboration | Travailler efficacement avec des profils divers |
| 9 | `ada-09` | Humilité | Reconnaître ses erreurs et apprendre des autres |
| 10 | `ada-10` | Persévérance | Continuer malgré les obstacles et les rechutes |

---

### 3.3 Banque de 300 Questions

Les 300 questions sont réparties en **6 types** par dimension :

| Dimension | Q. Échelle (1-10) | Q. Scénario | Q. Choix multiple | Q. Classement | Q. Ouverte | Q. Comportementale | **Total** |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Leadership & Vision | 15 | 10 | 10 | 5 | 10 | 5 | **55** |
| Gestion du stress | 15 | 10 | 10 | 5 | 10 | 5 | **55** |
| Communication | 15 | 10 | 10 | 5 | 10 | 5 | **55** |
| Résolution de problèmes | 15 | 10 | 10 | 5 | 10 | 5 | **55** |
| Créativité & Innovation | 15 | 10 | 10 | 5 | 10 | 5 | **55** |
| Adaptabilité | 15 | 10 | 10 | 5 | 10 | 5 | **55** |
| **Transverses** | 10 | 0 | 0 | 0 | 0 | 0 | **10** |
| **TOTAL** | **100** | **50** | **50** | **25** | **50** | **25** | **300** |

#### 3.3.1 Types de questions

**Type 1 — Échelle (1-10)** : « À quel point cette affirmation vous décrit-elle ? »  
Exemple : *« Je suis capable de prendre des décisions difficiles rapidement »* — 1 (pas du tout) à 10 (tout à fait)

**Type 2 — Scénario** : Situations concrètes d'entrepreneuriat  
Exemple : *« Un client important menace de partir. Que faites-vous ? »* — 4 choix de réponse avec scoring différent

**Type 3 — Choix multiple** : QCM avec 1 ou plusieurs bonnes réponses  
Exemple : *« Quelles sont les 3 qualités essentielles d'un bon leader ? »*

**Type 4 — Classement** : Ordonner des éléments par priorité  
Exemple : *« Classez ces 5 actions de gestion de crise par ordre de priorité »*

**Type 5 — Ouverte** : Réponse libre (évaluée par le conseiller ou l'IA)  
Exemple : *« Décrivez une situation où vous avez dû adapter votre plan en cours de route »*

**Type 6 — Comportementale** : Réflexion sur un comportement passé  
Exemple : *« La dernière fois que vous avez dû convaincre quelqu'un, quelle approche avez-vous utilisée ? »*

#### 3.3.2 Exemples par dimension (échantillon)

**Leadership & Vision (10 questions d'exemple)**

| # | Type | Question | Scoring |
|---|------|----------|---------|
| L-01 | Scale | Je suis capable de motiver une équipe | 1-10 → leadership |
| L-02 | Scenario | Un collaborateur ne respecte pas les délais. Votre réaction ? | A=8, B=5, C=3, D=6 → leadership |
| L-03 | Choice | Quels sont les piliers d'une vision stratégique ? | Multi-select → leadership |
| L-04 | Ranking | Classez ces actions de lancement | Ordre → leadership |
| L-05 | Open | Décrivez votre plus grande réussite en tant que leader | IA/note manuelle |
| L-06 | Behavioral | Comment avez-vous délégué une tâche importante ? | IA/note manuelle |

*(Même structure pour les 5 autres dimensions)*

---

### 3.4 Modes de Jeu

#### Mode 1 — « Flash Swipe » (actuel, amélioré)
- **60 cartes** à swipper rapidement
- Swipe droite = pépite (je maîtrise cette compétence)
- Swipe gauche = pass (pas encore acquis)
- Double tap = super-pépite (je suis expert)
- **Durée estimée** : 5-8 minutes
- **Résultat** : alimente le Radar Kiviat immédiatement

#### Mode 2 — « Questionnaire Approfondi »
- **50 questions** adaptatives par session (aléatoires dans les 300)
- Questions tirées en fonction des résultats du Mode 1 (focus sur les dimensions faibles)
- Échelle + scénarios + QCM
- **Durée estimée** : 15-20 minutes
- **Résultat** : affine les scores Kiviat avec plus de précision

#### Mode 3 — « Challenge Scénario »
- **10 scénarios** d'entrepreneuriat réalistes
- Chaque scénario couvre 3-4 dimensions
- Choix multiples avec scoring pondéré
- **Durée estimée** : 10-15 minutes
- **Résultat** : évaluation de la prise de décision en situation

#### Mode 4 — « Bilan Complet » (recommandé)
- Enchaîne les 3 modes séquentiellement
- Score final sur 100 par dimension
- **Durée estimée** : 35-45 minutes
- **Résultat** : profil complet pour l'entretien diagnostic

---

### 3.5 Calcul des Scores Kiviat

```
Score_Dimension = (
  (Swipe_Weight × Swipe_Ratio) +
  (Question_Weight × Question_Moyenne) +
  (Scenario_Weight × Scenario_Moyenne)
) × Coefficient_Dimension
```

| Source | Poids | Plage |
|--------|-------|-------|
| Swipe (Mode 1) | 40% | 0-100 |
| Questions (Mode 2) | 35% | 0-100 |
| Scénarios (Mode 3) | 25% | 0-100 |

---

### 3.6 Intégrations Existantes

| Module | Intégration | Description |
|--------|-----------|-------------|
| **Radar Kiviat** | Auto-alimentation | Scores mis à jour en temps réel après chaque swipe |
| **CreatorSession** | `kiviatAspirations` | Stockage JSON des résultats |
| **Entretien conseiller** | `/api/chat/conseiller` | Le contexte Kiviat est injecté dans le prompt IA du conseiller |
| **Passeport entrepreneurial** | `/api/passeport` | Progression du module Pépites affichée |
| **Go/No-Go** | `/api/go-nogo` | Scores Kiviat utilisés dans la décision de poursuite |
| **Bilan parcours** | `/api/parcours-creteur/bilan` | Résultats intégrés au bilan global |

---

## 4. Spécifications Techniques

### 4.1 Stack technique

| Couche | Technologie |
|-------|-------------|
| Frontend | React + TypeScript + Framer Motion |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Next.js App Router (API routes) |
| Base de données | Prisma ORM + PostgreSQL |
| Auth | authenticateRequest (JWT) |
| IA | z-ai-web-dev-sdk (analyse réponses ouvertes) |

### 4.2 Fichiers à créer/modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `prisma/schema.prisma` | MODIFY | Ajout SwipeCard, SwipeQuestion, SwipeAnswer |
| `src/data/swipe-cards.ts` | CREATE | 60 compétences avec métadonnées |
| `src/data/swipe-questions.ts` | CREATE | 300 questions structurées |
| `src/components/creapulse/swipe-game.tsx` | REWRITE | 4 modes de jeu, 60 cartes, UX enrichie |
| `src/components/creapulse/swipe-questionnaire.tsx` | CREATE | Mode Questionnaire Approfondi |
| `src/components/creapulse/swipe-scenario.tsx` | CREATE | Mode Challenge Scénario |
| `src/app/api/modules/pepites/route.ts` | REWRITE | Gestion des 3 nouveaux modèles |
| `src/app/api/modules/seed/route.ts` | MODIFY | Seed des 60 cartes + 300 questions |
| `src/components/creapulse/kiviat-chart.tsx` | MODIFY | Affichage des scores multi-sources |

### 4.3 UX/UI

- **Mobile-first** : swipe natif sur tactile, boutons sur desktop
- **Animations** : Framer Motion pour les transitions carte, confetti à la fin
- **Progression** : barre de progression + compteur (ex: 12/60)
- **Accessibilité** : labels ARIA, navigation clavier, contrastes AA
- **Dark mode** : support natif via next-themes

---

## 5. Livrables

| # | Livrable | Détail |
|---|----------|--------|
| 1 | Schéma Prisma | 3 modèles (SwipeCard, SwipeQuestion, SwipeAnswer) |
| 2 | Seed data | 60 cartes + 300 questions |
| 3 | Composant Swipe Game réécrit | 4 modes, 60 cartes, animations |
| 4 | Composant Questionnaire | 50 questions adaptatives par session |
| 5 | Composant Scénario | 10 scénarios interactifs |
| 6 | API routes | GET + POST pour chaque modèle |
| 7 | Algorithme de scoring | Formule de calcul Kiviat 3-sources |
| 8 | Tests manuels | Parcours complet des 4 modes |

---

## 6. Planning Estimé

| Phase | Durée | Contenu |
|-------|-------|---------|
| Phase 1 | 2 jours | Schéma Prisma + seed data (60 cartes + 300 questions) |
| Phase 2 | 3 jours | Réécriture swipe-game.tsx (4 modes) |
| Phase 3 | 2 jours | Composants questionnaire + scénario |
| Phase 4 | 1 jour | API routes + algorithme scoring |
| Phase 5 | 1 jour | Intégrations (Kiviat, passeport, conseiller) |
| **Total** | **9 jours** | |

---

## 7. Critères d'Acceptation

- [ ] 60 cartes de compétences swipables (10 par dimension)
- [ ] 300 questions en base de données (6 types, 6 dimensions)
- [ ] 4 modes de jeu fonctionnels (Flash, Questionnaire, Scénario, Complet)
- [ ] Scores Kiviat calculés à partir de 3 sources (swipe, questions, scénarios)
- [ ] Résultats persistés en base et affichés dans le Radar Kiviat
- [ ] Contexte Kiviat injecté dans les prompts IA conseiller/porteur
- [ ] Accessibilité WCAG 2.1 AA
- [ ] Responsive mobile/desktop
- [ ] 0 nouvelle erreur lint
