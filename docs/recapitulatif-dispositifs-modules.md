# CreaPulse — Récapitulatif par Dispositif : Modules & Fonctionnalités

> **Document synthétique** — Version 1.0
> Plateforme CreaPulse | GIDEF Île-de-France & France Travail

---

## Vue d'ensemble

CreaPulse articule **15 dispositifs** autour de 37 modules interactifs répartis en 4 sections du Bureau Virtuel.

| Catégorie | Dispositifs | Modules associés |
|-----------|-------------|-----------------|
| **Intégrés (natifs)** | 8 | 37 modules implémentés dans la plateforme |
| **Externes (accompagnés)** | 7 | Couverts via simulateurs, APIs, articles, annuaire |

---

## PARTIE A — Dispositifs Intégrés

Ces dispositifs sont **digitalisés nativement** dans CreaPulse avec persistance des données, API dédiées, exports et IA.

---

### 1. CréaScope — Pipeline Diagnostique SOP

**Nature :** Pipeline diagnostique structuré (3-4h) | **Section Bureau :** Parcours
**Fichier principal :** `creascope-pipeline.tsx` + 11 sous-composants dans `creascope/`

Le CréaScope est la procédure opérationnelle standardisée (SOP) du GIDEF pour le premier entretien diagnostique. Il **orchestre d'autres dispositifs** en les intégrant dans ses phases.

#### Modules intégrés au pipeline

| Phase | Nom | Durée | Modules/fonctionnalités appelés |
|-------|------|-------|---------------------------------|
| 1 | **Accueil & Acculturation** | 20 min | Vérification profil créateur, présentation projet, explication du déroulé |
| 2 | **Découverte (Pépites)** | 45 min | **Pépites Game (Activ'Créa)** — 60 cartes, 6 dimensions Kiviat |
| 3 | **Approfondissement** | 60 min | RIASEC, Kiviat, Analyse marché, Simulation financière, Statut juridique |
| 4 | **Synthèse & Recommandations** | 40 min | Bilan IA automatisé, **Tremplin GO/NO-GO**, Recommandations |
| 5 | **Plan d'Action** | 25 min | Actions prioritaires, **Passeport Entrepreneurial**, Feedback, Clôture |

#### Fonctionnalités propres au module CréaScope

- Gestion de sessions diagnostiques (CRUD) pour conseillers et admins
- 5 phases séquentielles avec chronométrage et progression
- Gestion de statuts de session : PLANIFIEE, EN_COURS, PAUSEE, TERMINEE, ANNULEE
- Suivi temps et notes par étape
- Suggestions IA contextuelles par phase (panneau dédié)
- Historique des sessions (vue liste)
- Export PDF de synthèse CréaScope
- Export PDF Bilan CréaScope

#### API dédiées

| Route | Méthode | Usage |
|-------|---------|-------|
| `/api/creascope/sessions` | GET, POST | Liste et création de sessions |
| `/api/creascope/sessions/[id]` | GET, PUT, DELETE | Gestion d'une session |
| `/api/creascope/ai-suggest` | POST | Suggestions IA contextuelles |
| `/api/export/creascope-pdf` | GET | Export PDF synthèse |
| `/api/export/bilan-creascope` | GET | Export PDF bilan complet |

---

### 2. Pépites Game (Activ'Créa) — Détection des Compétences

**Nature :** Outil ludique de détection de compétences entrepreneuriales | **Section Bureau :** Parcours
**Fichier principal :** `pepites-game.tsx` + 4 sous-composants dans `pepites/`

Digitalisation complète du dispositif **Activ'Créa** du GIDEF. Fonctionne en mode **standalone** ET intégré comme Phase 2 du CréaScope.

#### 4 modes de jeu

| Mode | Nom | Durée | Mécanique |
|------|------|-------|-----------|
| 1 | **Flash Swipe** | 5-8 min | 60 cartes à swipper (pass / pépite / super pépite) sur 6 dimensions |
| 2 | **Questionnaire Approfondi** | 10-15 min | 15 questions adaptatives pour affiner le profil |
| 3 | **Challenge Scénario** | 15-20 min | 10 scénarios entrepreneuriaux réalistes avec choix multiples |
| 4 | **Bilan Complet** | 15-20 min | Les 3 modes séquentiels pour un profil exhaustif |

#### 6 dimensions Kiviat mesurées

| Dimension | Description |
|-----------|-------------|
| Créativité & Innovation | Imaginer, innover, penser hors cadre |
| Leadership & Vision | Inspirer, diriger, donner une direction stratégique |
| Gestion du Stress | Performer face à la pression et l'incertitude |
| Communication | Transmettre clairement, écouter, créer des connexions |
| Résolution de Problèmes | Analyser, décider, surmonter les obstacles |
| Adaptabilité | S'adapter aux changements, pivoter, apprendre |

#### Fonctionnalités

- Animations Framer Motion sur les swipes de cartes
- Radar chart Kiviat des résultats
- Score summary avec classement par dimension
- Sauvegarde des résultats (localStorage + API)
- Suggestions IA pour le développement

#### API dédiées

| Route | Méthode | Usage |
|-------|---------|-------|
| `/api/swipe` | GET, POST | Sauvegarde/chargement des scores |
| `/api/swipe/questions` | GET | Questions adaptatives et scénarios |

---

### 3. PAA — Parcours d'Accompagnement des Actifs

**Nature :** Programme structuré 60 jours (cofinancé France Travail / GIDEF) | **Sections Bureau :** Stratégie + Pilotage
**Fichier principal :** `parcours-paa.tsx` + 8 sous-modules

Le PAA est un **système modulaire** qui fédère 9 sous-modules avec un timeline commun et un tableau de bord dédié. Activable/désactivable globalement par l'admin.

#### Parcours structuré en 4 phases

| Période | Phase | Modules mobilisés |
|---------|-------|-------------------|
| J0-J10 | **DIAGNOSTIC** | Profil créateur, RIASEC, Kiviat, Bilan IA, CréaScope |
| J10-J30 | **STRATÉGIE** | Marché, Juridique, Financier, BMC, Business Plan, SWOT |
| J30-J60 | **STRUCTURATION** | Marketing, Gestion du Temps, Objectifs SMART, Mind Map |
| J60-J90 | **LANCEMENT** | Tremplin, Passeport, Clôture & Rebond, Satisfaction |

#### 9 sous-modules du PAA

##### 3.1 Timeline PAA (`parcours-paa.tsx`)
- Visualisation 60 jours avec jalons (J0 → J10 → J30 → J60 → J90)
- Progression circulaire globale
- Suivi des ateliers avec complétion
- Stats : jours restants/écoulés, objectifs, progression moyenne, score de satisfaction
- 3 onglets : Vue d'ensemble, Jalons, Ateliers

##### 3.2 Matrice SWOT (`swot.tsx`)
- Matrice 4 quadrants interactive (Forces, Faiblesses, Opportunités, Menaces)
- CRUD d'items par quadrant
- Génération IA par quadrant
- Export image

##### 3.3 Objectifs SMART (`objectifs-smart.tsx`)
- CRUD d'objectifs (Spécifique, Mesurable, Atteignable, Pertinent, Temporel)
- Barre de progression manuelle
- Statuts : en_cours, atteint, abandonné
- Suggestions IA pour chaque composante S-M-A-R-T

##### 3.4 Gestion du Temps (`gestion-temps.tsx`)
- Matrice d'Eisenhower (4 quadrants urgent/important)
- Planificateur hebdomadaire (7 jours, créneaux)
- Timer Pomodoro configurable (travail/pause/pause longue)
- Statistiques de sessions Pomodoro
- Diagnostic textuel de gestion du temps

##### 3.5 Gestion de Crise (`gestion-crise.tsx`)
- Registre des risques (CRUD) avec probabilité/impact
- Mesures d'atténuation par risque
- Tableau des indicateurs d'alerte (trésorerie, clients, CA, marge, dettes)
- Conseils de résilience
- IA pour suggestions de risques

##### 3.6 Stratégie Marketing (`marketing-commerciale.tsx`)
- Marketing Mix 4P (Produit, Prix, Place, Promotion)
- Personas (CRUD) : nom, âge, genre, localisation, revenus, pain points
- Canaux de distribution (CRUD) : type online/offline, priorité, budget
- KPIs (CRUD) : nom, cible, actuel, unité
- Budget total

##### 3.7 Carte Mentale (`mind-map.tsx`)
- Éditeur interactif sur canvas SVG
- CRUD de nœuds (ajout, suppression, édition, déplacement)
- 3 templates : Mon Projet, Offre Commerciale, Réseau
- 8 couleurs de branches
- Zoom, centrer, réinitialiser
- Export JSON / import

##### 3.8 Clôture & Rebond (`cloture-rebond.tsx`)
- Bilan de fin d'activité (texte libre)
- Checklist formelle de clôture (10 items : URSSAF, impôts, RCS, banque, etc.)
- Inventaire de compétences acquises (CRUD)
- Options de rebond : salariat, formation, reconversion, freelance, nouveau projet
- IA pour suggestions

##### 3.9 Satisfaction & Feedback (`satisfaction-feedback.tsx`)
- Enquête NPS (0-10) avec catégories Promoteur/Passif/Détracteur
- Ratings par catégorie : Formation, Accompagnement, Outils, Plateau (1-5 étoiles)
- Commentaire libre
- Historique des retours

#### API dédiées

| Route | Méthode | Usage |
|-------|---------|-------|
| `/api/paa/dashboard` | GET | Tableau de bord PAA |
| `/api/paa/program` | GET, PUT | Programme et paramètres |
| `/api/paa/milestones` | GET, PUT | Jalons du parcours |
| `/api/paa/ateliers` | GET, PUT | Ateliers PAA |
| `/api/paa/objectifs` | GET, PUT | Objectifs SMART |
| `/api/paa/satisfaction` | GET, POST | Feedback et NPS |

---

### 4. Tremplin — Évaluation GO / NO-GO

**Nature :** Évaluation structurée de faisabilité | **Section Bureau :** Pilotage
**Fichier principal :** `tremplin.tsx`

Module standalone ET intégré comme Phase 4 du CréaScope.

#### 7 étapes d'évaluation

| Étape | Critère | Contenu |
|-------|---------|---------|
| 1 | **Viabilité du projet** | Validation marché, identification du besoin, early adopters |
| 2 | **Modèle économique** | Sources de revenus, différenciation, viabilité à 3 ans |
| 3 | **Plan financier** | Budget, seuil de rentabilité, sources de financement |
| 4 | **Compétences clés** | Auto-évaluation management, commercial, technique, financier |
| 5 | **Réseau & Soutien** | Mentor, conseillers, réseau entrepreneurial |
| 6 | **Motivation & Engagement** | Temps consacré, tolérance au risque, résilience |
| 7 | **Synthèse** | Score final, recommandation, plan d'action |

#### Fonctionnalités

- Questions pondérées (yes_no, select, échelle de Likert)
- Score final sur 100
- Décision : GO / GO_CONDITIONNEL / NO_GO
- Recommandations personnalisées selon le score
- Progression sauvegardée
- Export PDF avec page de couverture, badge de décision, détail par étape
- IA intégrant les dispositifs d'aide (ARE, ACCRE, BPI) dans les recommandations

#### API dédiées

| Route | Méthode | Usage |
|-------|---------|-------|
| `/api/tremplin` | GET, PUT | Sauvegarde/chargement de l'évaluation |
| `/api/export/tremplin-pdf` | GET | Export PDF du rapport |
| `/api/export/suivi-tremplin` | GET | Suivi de l'évaluation |

---

### 5. Passeport Entrepreneurial — Certification GIDEF

**Nature :** Certification du parcours entrepreneurial | **Section Bureau :** Pilotage
**Fichier principal :** `passeport.tsx`

Module standalone ET intégré comme Phase 5 du CréaScope.

#### 9 modules tracés pour la certification

| Compétence certifiée | Module Bureau | Icône |
|---------------------|---------------|-------|
| Profil entrepreneurial | `profil-createur` | User |
| Diagnostic comportemental | `riasec` | GraduationCap |
| Compétences clés | `kiviat` | Pentagon |
| Définition du projet | `mon-projet` | Lightbulb |
| Analyse de marché | `marche` | Globe |
| Choix juridique | `juridique` | Scale |
| Plan financier | `financier` | Calculator |
| Business Plan | `business-plan` | FileText |
| Évaluation Tremplin | `tremplin` | Rocket |

#### 5 niveaux de certification

| Niveau | Modules requis | Couleur |
|--------|---------------|---------|
| **Aucun** | 0 | — |
| **Bronze** | 2 | 🥉 |
| **Argent** | 4 | 🥈 |
| **Or** | 7 | 🥇 |
| **Platine** | 9 | 💎 |

#### Fonctionnalités

- Suivi de progression par module (completed, in_progress, not_started) avec scores
- Timeline des accomplissements
- Liste de compétences acquises
- Export PDF du passeport avec cachet GIDEF
- Attestations par module
- Credential ID unique par certification

#### API dédiées

| Route | Méthode | Usage |
|-------|---------|-------|
| `/api/passeport` | GET, PUT | Certification et progression |
| `/api/export/passeport` | GET | Export PDF du passeport |

---

### 6. RIASEC — Test de Personnalité

**Nature :** Test psychométrique standardisé | **Section Bureau :** Parcours
**Fichier principal :** `riasec.tsx`

Module standalone ET intégré comme Phase 3.2 du CréaScope.

#### 6 types de personnalité

| Type | Lettre | Description |
|------|--------|-------------|
| Réaliste | R | Travail concret, manipulation d'outils, activités physiques |
| Investigateur | I | Analyse, recherche, résolution de problèmes abstraits |
| Artistique | A | Créativité, expression, originalité |
| Social | S | Aide, enseignement, relations humaines |
| Entreprenant | E | Leadership, persuasion, prise de décision |
| Conventionnel | C | Organisation, précision, travail structuré |

#### Fonctionnalités

- 42 questions (7 par type), une à la fois
- Navigation précédent/suivant
- Radar chart des résultats
- Profil dominant avec description détaillée
- Pourcentages par type
- Progression sauvegardée (localStorage + API)

#### API dédiées

| Route | Méthode | Usage |
|-------|---------|-------|
| `/api/riasec` | GET, PUT | Sauvegarde/chargement des résultats |

---

### 7. Kiviat — Radar de Compétences

**Nature :** Auto-évaluation multidimensionnelle | **Section Bureau :** Parcours
**Fichier principal :** `kiviat.tsx`

Module standalone ET alimenté par les résultats des Pépites (Phase 2) dans le CréaScope.

#### 8 dimensions évaluées

| Dimension | Description |
|-----------|-------------|
| Créativité | Innovation, imagination, pensée latérale |
| Leadership | Direction, influence, prise de décision |
| Gestion financière | Budget, comptabilité, rentabilité |
| Communication | Expression, écoute, négociation |
| Résolution de problèmes | Analyse, logique, adaptabilité |
| Persévérance | Ténacité, résilience, engagement |
| Adaptabilité | Flexibilité, pivot, apprentissage continu |
| Organisation | Planification, priorisation, gestion du temps |

#### Fonctionnalités

- Auto-évaluation par slider (0-100) sur chaque dimension
- Radar chart interactif
- Score global calculé
- Suggestions IA de développement personnalisé
- Export PDF du radar
- Historique de suivi (comparaison dans le temps)

#### API dédiées

| Route | Méthode | Usage |
|-------|---------|-------|
| `/api/kiviat` | GET, PUT | Sauvegarde/chargement des scores |
| `/api/export/kiviat-pdf` | GET | Export PDF du radar |
| `/api/export/suivi-kiviat` | GET | Historique de suivi |

---

### 8. Bilan IA — Synthèse Intelligente Multi-Sources

**Nature :** Bilan automatisé par intelligence artificielle | **Section Bureau :** Parcours
**Fichier principal :** `bilan-ia.tsx`

Module standalone ET intégré comme Phase 4.1 du CréaScope.

#### Sources de données agrégées

| Source | Module | Données exploitées |
|--------|--------|-------------------|
| Profil Créateur | `profil-createur` | Identité, situation, compétences, motivations |
| Projet | `mon-projet` | Description, stade, secteur, marché cible |
| RIASEC | `riasec` | Scores 6 types, profil dominant |
| Kiviat | `kiviat` | Scores 8 dimensions |
| Vision | `vision` | Objectifs, jalons, valeurs, mission |
| Pépites | `pepites` | Scores 6 dimensions comportementales |

#### Fonctionnalités

- Synthèse IA complète avec radar
- Analyse par domaine : identité, projet, compétences, motivation, plan d'action
- Génération / rafraîchissement IA
- Export PDF du bilan
- Recommandations personnalisées

#### API dédiées

| Route | Méthode | Usage |
|-------|---------|-------|
| `/api/bilan` | GET, POST | Génération et récupération du bilan |
| `/api/export/bilan-pdf` | GET | Export PDF du bilan |
| `/api/export/bilan-creascope` | GET | Export bilan format CréaScope |

---

## PARTIE B — Dispositifs Externes (Accompagnés)

Ces dispositifs existent hors de la plateforme. CreaPulse **informe, connecte, simule et guide** vers eux.

---

### 9. ACRE — Aide à la Création ou Reprise d'Entreprise

**Nature :** Exonération partielle de charges sociales (1ère année) | **Montant :** jusqu'à 4 916 € d'économie

#### Points d'entrée dans CreaPulse

| Module | Fonctionnalité |
|--------|---------------|
| **Juridique** | Simulateur interactif : slider ACRE, calcul automatique d'éligibilité selon le statut, indicateur vert/rouge |
| **E-Learning** | Leçon BFR listant l'ACRE parmi les solutions de financement |
| **Clôture & Rebond** | Information : « Éligibilité ARE/ACRE » listé comme avantage du rebond |
| **Admin Contenus** | Fiche structurée ACRE (titre, description, éligibilité, montant) |
| **Articles** | Contenu éditorial : « L'ACRE en 2025 : conditions et démarches » |
| **Forum** | Retours d'expérience sur l'ACRE |
| **IA Copilote** | Guidance personnalisée avec calcul d'éligibilité |

---

### 10. ARE / ARCE — Allocation et Aide au Retour à l'Emploi

**Nature :** Maintien de revenus durant la création | **Montant ARCE :** jusqu'à 10 800 € (2 × 45% des droits ARE)

#### Points d'entrée dans CreaPulse

| Module | Fonctionnalité |
|--------|---------------|
| **API France Travail** | Route `GET /api/france-travail/aides` avec filtres (code postal, type d'aide) — données temps réel |
| **E-Learning** | Leçon BFR listant ARE parmi les sources de financement |
| **Clôture & Rebond** | Information : « Éligibilité ARE/ACRE » comme avantage du rebond |
| **Articles** | « ARE France Travail : maintenir ses revenus durant la création » |
| **Forum** | 4+ discussions ARCE/ARE avec retours d'expérience |
| **IA Copilote** | Calcul automatique du montant ARCE, guidance de demande |

---

### 11. NACRE — Nouvel Accompagnement pour la Création et la Reprise

**Nature :** Accompagnement 3 ans + prêt d'honneur taux zéro | **Montant prêt :** jusqu'à 10 000 €

#### Points d'entrée dans CreaPulse

| Module | Fonctionnalité |
|--------|---------------|
| **API France Travail** | Accessible via `GET /api/france-travail/aides` avec filtre par type |
| **Annuaire** | Réseau Initiative France référencé (type SUPPORT) |
| **Articles** | « Le NACRE : l'aide à la reprise et à la création d'entreprise » |
| **Forum** | Discussions mentionnant NACRE avec détail « accompagnement + prêt à taux zéro » |

---

### 12. Bpifrance — Banque Publique d'Investissement

**Nature :** Financement et accompagnement | **Prêt d'amorçage :** jusqu'à 50 000 €

#### Points d'entrée dans CreaPulse

| Module | Fonctionnalité |
|--------|---------------|
| **Annuaire** | Fiche Bpifrance IDF : adresse, services (Prêt d'amorçage, Innovation, Garantie, Investissement), taux de réussite 88% |
| **Forum** | Discussion « Obtenir un prêt d'honneur : mon expérience avec BPI France » — cas réel 30 000 € |
| **E-Learning** | « Prêt d'honneur (Initiative France, BPI) » comme source de financement |
| **Business Plan** | Source de financement type « Prêt bancaire Bpifrance » dans le générateur |
| **Articles** | « BPI France : le prêt d'amorçage décrypté » |
| **IA Copilote** | « Quels financements BPI France pour mon secteur ? » |
| **Bilan IA** | Recommandation auto de financement d'amorçage |

---

### 13. Aides Régionales et Locales

**Nature :** Aides complémentaires IDF et mairies | **Exemples :** Prêt Initiative IDF (5 000 €), Bourses BGE Paris (3 000 €)

#### Points d'entrée dans CreaPulse

| Module | Fonctionnalité |
|--------|---------------|
| **Admin Contenus** | Onglet « Aides » : formulaire structuré (Titre, Description, Éligibilité, Montant) |
| **Articles** | 12 articles catégorie « Financement » (IDF, BPI, NACRE, crowdfunding, subventions) |
| **Forum** | Discussion « Aides à la création en Île-de-France » |
| **Financier** | Tableau de plan de financement avec lignes « Aides & Subventions » |
| **E-Learning** | Leçon BFR : Fonds propres, ACRE/ARE, Prêt d'honneur, Affacturage |
| **IA Copilote** | Identification automatique des aides adaptées à la situation |

---

### 14. France Travail — APIs et Données Institutionnelles

**Nature :** Pont de données temps réel | **11 routes API dédiées**

#### Routes API et usages

| Route API | Données | Modules alimentés |
|-----------|---------|-------------------|
| `/api/france-travail/metiers` | Référentiel ROME | RIASEC, Diagnostic IA, Quiz métiers |
| `/api/france-travail/formations` | Catalogue formations | E-Learning, Recommandations IA |
| `/api/france-travail/offres` | Offres d'emploi | Section Horizon Emplois, IA Copilote |
| `/api/france-travail/aides` | Aides financières | Juridique (ACRE), Tremplin, Business Plan |
| `/api/france-travail/agences` | Agences FT | Annuaire, Carte des agences |
| `/api/france-travail/entreprises` | InfoNet | Analyse marché, Concurrents |
| `/api/france-travail/communautes` | Communautés pro | Forum, Mise en réseau |
| `/api/france-travail/evenements` | Événements MEE | Calendrier, Ateliers |
| `/api/france-travail/statistiques` | Stats marché du travail | Dashboard, Analyses sectorielles |
| `/api/france-travail/lbb` | La Bonne Boîte | Module Marché, Opportunités |
| `/api/france-travail/rome` | Codes ROME | Mapping compétences, Fiches métiers |

#### Fonctionnalités techniques

- Authentification OAuth2 complète avec gestion de token
- Rate limiting et cache
- Enrichissement automatique des prompts IA (bibliothèque `ft-enrichment.ts`)
- Validation Zod des réponses (guard `ft-guard.ts`)

---

### 15. Réseau GIDEF — Identité Institutionnelle

**Nature :** Identité de la plateforme (pas un dispositif externe) | **60+ agences en IDF**

#### Implémentation dans CreaPulse

| Aspect | Détail |
|--------|--------|
| **Branding** | Logos GIDEF + CreaPulse sur chaque page, co-branding |
| **Tenant principal** | « GIDEF Île-de-France » (slug `gidef`) |
| **Agences** | Modèle Prisma `Agency`, agences seed (Paris Centre 14e, Paris 20e) |
| **Passeport** | « Passeport Entrepreneurial GIDEF » avec cachet officiel sur exports PDF |
| **CréaScope** | Le pipeline diagnostique EST la SOP GIDEF digitalisée |
| **PAA** | Co-branding République Française / France Travail / GIDEF |
| **Forum** | Conseillers GIDEF comme référents |
| **Articles** | « Le réseau GIDEF en Île-de-France : 60 agences à votre service » |

---

## PARTIE C — Modules Transverses (non rattachés à un dispositif spécifique)

Ces modules complètent l'écosystème sans être identifiés à un dispositif institutionnel particulier.

---

### Modules Stratégie (transverses)

| Module | Fonctionnalités clés |
|--------|---------------------|
| **Marché** | Étude de marché, mini-simulateur SWOT, simulateur de potentiel avec CA estimé, pie chart concurrentiel, suggestions IA |
| **Juridique** | Comparatif 5 statuts (SAS, SARL, EURL, Auto-entrepreneur, SASU), simulateur charges sociales, bar charts, recommandation IA |
| **Financier** | Simulateur avec 6 sliders, jauge de rentabilité, calculs (marge brute/nette, seuil de rentabilité), projections 3 ans, export PDF |
| **CreaSim** | Simulateur avancé 36 mois, charges fixes CRUD, scénarios multiples, area chart, analyse IA, export PDF |
| **BMC** | Canvas 9 blocs interactif, génération IA par bloc, statut DRAFT→GENERATED→REFINED, export HTML |
| **Business Plan** | Rédacteur multi-onglets (17+ sections), tables financières, aperçu markdown, export PDF |
| **Pitch Deck** | Éditeur 8 slides, gestion équipe CRUD, génération IA par slide, export PPTX |
| **Trésorerie** | Flux transactions CRUD, 8 catégories, scénarios prévisionnels, graphiques, solde temps réel |
| **Pipeline V3** | Vue d'ensemble 4 phases (Parcours → Simulateurs → Hub Central → Livrables) avec progression |

### Modules Écosystème (transverses)

| Module | Fonctionnalités clés |
|--------|---------------------|
| **Annuaire** | Réseau GIDEF, 9 types d'acteurs, recherche/filtres, favoris, recherche IA |
| **Forum** | 7 catégories, discussions threadées, likes, épinglage, recherche |
| **Messages** | Messagerie temps réel, indicateur non-lus, double check, emoji, « en train d'écrire » |
| **Mentorat** | Catalogue mentors, filtres (expertise, secteur, note), demandes de mentorat avec suivi |
| **CRM** | Contacts CRUD, pipeline Kanban 4 étapes, interactions, KPIs, suggestions IA |

### Modules Pilotage (transverses)

| Module | Fonctionnalités clés |
|--------|---------------------|
| **Certifications** | 5 certifications (Basic → Expert), prérequis modules, badges visuels, credential ID |
| **Téléchargements** | Hub central 13 exports (PDF, PPTX, HTML), vérification disponibilité données |
| **E-Learning** | 6+ formations entrepreneuriales, leçons avec contenu, progression, badges, streak, XP |
| **Gamification** | XP et niveaux, 12 achievements, défis hebdomadaires, leaderboard, statistiques |
| **Vie Privée** | Consentements RGPD, export données personnelles, demande suppression, historique |

---

## Matrice de Croisement Dispositifs × Sections

| | Parcours | Stratégie | Écosystème | Pilotage |
|---|:---:|:---:|:---:|:---:|
| **CréaScope** | Pipeline (conteneur) | — | — | — |
| **Pépites (Activ'Créa)** | Standalone + Phase 2 | — | — | — |
| **PAA** | Phase 1 (Diagnostic) | Phase 2-3 (Stratégie) | — | Phase 4 (Lancement) |
| **Tremplin** | — | — | — | Standalone + Phase 4 CS |
| **Passeport** | — | — | — | Standalone + Phase 5 CS |
| **RIASEC** | Standalone + Phase 3 CS | — | — | — |
| **Kiviat** | Standalone + Phase 2-3 CS | — | — | — |
| **Bilan IA** | Standalone + Phase 4 CS | — | — | — |

> **CS** = intégré dans le pipeline CréaScope à la phase indiquée

---

## Chiffres Clés

| Indicateur | Valeur |
|-----------|--------|
| Dispositifs intégrés | **8** |
| Dispositifs externes accompagnés | **7** |
| Modules Bureau Virtuel | **37** |
| Routes API France Travail | **11** |
| Routes API totales | **70+** |
| Fichiers composants modules | **~55** |
| Niveaux de certification Passeport | **5** (Aucun → Platine) |
| Sous-modules PAA | **9** |
| Phases CréaScope | **5** |
| Étapes Tremplin | **7** |

---

> *Document synthétique CreaPulse V2 — Généré automatiquement à partir du codebase*