# CreaPulse V2 — Pipeline Stratégie : Architecture Complète

> **Version** : 2.0  
> **Dernière mise à jour** : Juillet 2025  
> **Portée** : Menu Stratégie — Business Plan · BMC · Pitch Deck · Simulateurs  

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Organisation logique du menu Stratégie](#2-organisation-logique-du-menu-stratégie)
3. [Les briques d'alimentation (Parcours)](#3-les-briques-dalimentation-parcours)
4. [Les 7 modules de la section Stratégie](#4-les-7-modules-de-la-section-stratégie)
   - 4.1 [Marché (Analyse de Marché)](#41-marché-analyse-de-marché)
   - 4.2 [Juridique (Analyse Juridique)](#42-juridique-analyse-juridique)
   - 4.3 [Financier (Prévisions Financières)](#43-financier-prévisions-financières)
   - 4.4 [CreaSim (Simulateur Financier)](#44-creasim-simulateur-financier)
   - 4.5 [Business Model Canvas (BMC)](#45-business-model-canvas-bmc)
   - 4.6 [Business Plan](#46-business-plan)
   - 4.7 [Pitch Deck](#47-pitch-deck)
5. [Pipeline de données complet](#5-pipeline-de-données-complet)
6. [Le Business Plan en détail](#6-le-business-plan-en-détail)
7. [Synchronisation inter-modules](#7-synchronisation-inter-modules)
8. [Intégration IA](#8-intégration-ia)
9. [Calcul de progression](#9-calcul-de-progression)
10. [Exports et livrables](#10-exports-et-livrables)
11. [Architecture technique](#11-architecture-technique)
12. [Modèle de données (Prisma)](#12-modèle-de-données-prisma)
13. [Annexe : mapping complet des fichiers](#13-annexe--mapping-complet-des-fichiers)

---

## 1. Vue d'ensemble

### Philosophie du pipeline

Le menu **Stratégie** de CreaPulse V2 est construit autour d'un **pipeline de données en entonnoir** où chaque module produit des données qui alimentent les modules suivants :

```
┌─────────────────────────────────────────────────────────────────┐
│                     PARCOURS (Amont)                             │
│  Mon Projet ──→ Vision ──→ Profil Créateur                      │
│  (Projet, Secteur, Cible)  (Objectifs, Valeurs)                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │  "Générer depuis le Parcours"
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  STRATÉGIE — Simulateurs                         │
│  Marché ──→ Juridique ──→ Financier ──→ CreaSim                 │
│  (Marché, SWOT)   (Statut)   (3 ans)      (Marges mensuelles)   │
└──────────────────────┬──────────────────────────────────────────┘
                       │  "Synchroniser les simulateurs"
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              BUSINESS PLAN (Hub central — 24 sections)            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │Présenta. │ │  Marché  │ │ Finances │ │Opérations│           │
│  │ 5 sect.  │ │  6 sect. │ │  6 sect. │ │  7 sect. │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└──────┬───────────────────┬──────────────────────┬───────────────┘
       │                   │                      │
       ▼                   ▼                      ▼
┌──────────────┐   ┌──────────────┐       ┌──────────────┐
│  BMC Canvas   │   │  Pitch Deck  │       │  Export PDF  │
│  9 blocs IA  │   │  8 slides IA │       │  PPTX / PDF  │
└──────────────┘   └──────────────┘       └──────────────┘
```

### Flux utilisateur typique

1. **Parcours** : L'utilisateur remplit son projet (Mon Projet) et sa vision → alimentation automatique du BP
2. **Stratégie — Simulateurs** : L'utilisateur utilise les 4 simulateurs (Marché, Juridique, Financier, CreaSim) → synchronisation dans le BP
3. **Business Plan** : L'utilisateur finalise les 24 sections, avec suggestions IA par section
4. **BMC + Pitch Deck** : Génération automatique depuis le BP finalisé, avec raffinement IA
5. **Exports** : PDF du BP, HTML/PDF du BMC, PPTX du Pitch Deck

---

## 2. Organisation logique du menu Stratégie

### Navigation dans le Bureau Virtuel

Le Bureau Virtuel est organisé en **5 sections principales**, chacune contenant des modules :

| Section | Icon | Modules | Rôle |
|---------|------|---------|-----|
| **Parcours** | `Compass` | profil-createur, mon-projet, vision, pepites, riasec, kiviat, bilan-ia, creascope | Connaître le porteur et son projet |
| **Stratégie** | `Target` | marche, juridique, financier, creasim, bmc, business-plan, pitch-deck | Construire le business |
| **Écosystème** | `Network` | annuaire, forum, messages, mentorat | S'entourer |
| **Pilotage** | `Gauge` | tremplin, passeport, certifications, téléchargements, vie privée | Piloter et certifier |

### Ordre recommandé dans la section Stratégie

L'ordre des modules dans le sidebar est **intentionnellement ordonnancé** pour refléter le pipeline :

```
1. 📊 Marché         → Comprendre le marché (SWOT, concurrents, segmentation)
2. ⚖️  Juridique      → Choisir son statut légal (SAS, SARL, EURL, etc.)
3. 💰 Financier      → Projeter sur 3 ans (CA, charges, rentabilité)
4. 📈 CreaSim (IA)   → Simuler au mois le mois (marges, seuil de rentabilité)
5. 🧩 BMC            → Synthétiser en 9 blocs le modèle économique
6. 📄 Business Plan  → Rédiger le document complet (24 sections)
7. 🎤 Pitch Deck     → Préparer la présentation investisseurs (8 slides)
```

**Logique** : Les modules 1-4 sont des **simulateurs d'entrée** qui produisent des données. Les modules 5-7 sont des **documents de sortie** qui consomment ces données.

### Vue d'ensemble du menu (SectionOverview)

Quand l'utilisateur clique sur "Stratégie" sans sélectionner de module, une grille de **7 cartes** s'affiche montrant chaque module avec :
- Son nom et icône
- Son état de complétion (via l'API `/api/progress`)
- Un bouton d'accès direct

---

## 3. Les briques d'alimentation (Parcours)

Avant d'entrer dans la Stratégie, le **Parcours** du créateur alimente le pipeline avec des données fondamentales.

### 3.1 Mon Projet (`mon-projet.tsx`)

**5 étapes du formulaire :**

| Étape | Champs | Destination dans le BP |
|-------|--------|------------------------|
| 1. Identité | projectTitle, projectSector, projectDescription, projectStage | `resume`, `historique` |
| 2. Marché | primaryTarget, secondaryTarget, problemSolved, competitiveAdvantage, marketSize | `segmentation`, `etude-marche` |
| 3. Économie | revenueSources[], revenueYear1/2/3, initialInvestment, financingNeed | `financement`, `compte-resultat` |
| 4. Équipe | teamType, associateCount, motivation, keyCompetencies[] | `equipe`, `associes` |
| 5. Résumé | Score de maturité /100, récapitulatif complet | — |

**API** : `GET/PUT /api/projet` → stocké dans `CreatorJourney`

### 3.2 Vision (`vision.tsx`)

| Section | Champs | Destination dans le BP |
|---------|--------|------------------------|
| Énoncé de vision | visionStatement (vision à 5 ans) | `vision` |
| Motivation & Impact | motivation, desiredImpact | `valeurs` |
| Objectifs stratégiques | objectives[] (title, description, priority, deadline) | `vision` |
| Valeurs fondamentales | coreValues[] (max 5 parmi 15 prédéfinies) | `valeurs` |
| Jalons | milestones (6 mois, 1 an, 3 ans, 5 ans) | `calendrier` |

**API** : `GET/PUT /api/vision` → stocké dans `CreatorJourney.visionAnswers`

### 3.3 Action "Générer depuis le Parcours"

Dans l'éditeur Business Plan, le bouton **"Générer depuis le Parcours"** appelle `POST /api/business-plan` avec `action: 'generate-from-parcours'`. Cela :

1. Récupère en parallèle : `User`, `Beneficiary`, `CreatorJourney`, `RiasecResult[]`, `KiviatResult[]`, `ModuleResult[]`
2. Construit un prompt LLM avec tout ce contexte
3. Génère 8 sections BP (resume, equipe, historique, vision, valeurs, + 3 sections projet)
4. **Ne surcharge pas** les sections déjà remplies — fusion seulement

---

## 4. Les 7 modules de la section Stratégie

---

### 4.1 Marché (Analyse de Marché)

**Fichier** : `src/components/bureau/modules/marche.tsx` (~895 lignes)  
**API** : `GET/PUT/POST /api/marche`  
**LocalStorage** : `creapulse-marche`

#### Interface utilisateur

- **4 cartes KPI** : CA potentiel, Marge concurrentielle, Coût acquisition client, Score attractivité
- **Camembert (Recharts)** : Répartition des parts de marché
- **5 sliders de simulateur** : Taille du marché, Part de marché, Concurrents, Budget marketing, Potentiel de croissance
- **Jauge SVG animée** : Indicateur de croissance
- **SWOT 4 quadrants** : Forces / Faiblesses / Opportunités / Menaces (4 textareas)
- **Synthèse IA** : Carte affichant l'analyse générée par l'IA

#### Types de données

```typescript
interface SimulateurData {
  tailleMarche: number      // défaut: 1 000 000 €
  partDeMarche: number      // défaut: 5 %
  concurrents: number       // défaut: 10
  budgetMarketing: number    // défaut: 5 000 €/mois
  potentielCroissance: number // défaut: 50 %
}

interface SwotData {
  strengths: string
  weaknesses: string
  opportunities: string
  threats: string
}
```

#### Actions IA

- `POST /api/marche` avec `action: 'ai-analyze-market'` → Analyse complète du marché par l'IA
- `POST /api/marche` avec `action: 'ai-autofill'` → Remplissage automatique de tous les champs

#### Synchronisation vers le BP

À chaque sauvegarde, le module appelle `PUT /api/business-plan` avec `action: 'sync-simulators'`, ce qui injecte les données dans les sections BP :
- `etude-marche` ← secteur, taille du marché, potentiel
- `segmentation` ← cible
- `concurrence` ← nombre de concurrents, avantage compétitif
- `strategie-marketing` ← budget marketing, part de marché
- `plan-commercial` ← données commerciales
- `swot` ← les 4 quadrants SWOT

---

### 4.2 Juridique (Analyse Juridique)

**Fichier** : `src/components/bureau/modules/juridique.tsx` (~905 lignes)  
**API** : `GET/PUT/POST /api/juridique`  
**LocalStorage** : `creapulse-juridique`

#### Interface utilisateur

- **5 cartes de statut** : SAS, SARL, EURL, Auto-entrepreneur, SASU (sélection visuelle)
- **4 sliders** : CA prévisionnel, Nombre d'associés, Capital social, Réduction ACRE
- **4 cartes résultat** : Régime fiscal, Charges sociales, Plafond TVA, Éligibilité ACRE
- **Graphique comparatif (Recharts)** : Barres de comparaison des charges sociales
- **Carte détaillée** : Avantages/Désavantages du statut sélectionné

#### Types de données

```typescript
type StatutJuridique = 'SAS' | 'SARL' | 'EURL' | 'Auto-entrepreneur' | 'SASU'

interface SimulateurJuridique {
  statut: StatutJuridique      // défaut: SARL
  caPrev: number              // défaut: 50 000 €
  associes: number            // défaut: 2
  capitalSocial: number        // défaut: 1 000 €
  reductionCharges: number    // défaut: 50 %
}
```

#### Moteur de recommandation

Le module inclut un **moteur de scoring basé sur des règles** (pas d'IA) qui évalue 5 statuts selon 7 critères :

| Critère | Question |
|---------|----------|
| Type d'activité | Commerciale, artisanale, libérale, services |
| Nombre d'associés | Solo, 2-10, 10+ |
| Capital initial | <1 000 €, 1 000-10 000 €, >10 000 € |
| CA prévisionnel | <50 000 €, 50 000-150 000 €, >150 000 € |
| Préférence de responsabilité | Limitée, illimitée |
| Régime social | TNS, Assimilé-salarié |
| Plans de croissance | Stable, modéré, ambitieux |

#### Actions IA

- `POST /api/juridique` avec `action: 'ai-suggest'` → Suggestion pour une question spécifique
- `POST /api/juridique` avec `action: 'ai-autofill'` → Remplissage automatique des 7 questions

#### Synchronisation vers le BP

Le module synchronise les données juridiques dans la section BP `statut-juridique` (statut recommandé, régime fiscal, charges sociales, TVA, ACRE).

---

### 4.3 Financier (Prévisions Financières)

**Fichier** : `src/components/bureau/modules/financier.tsx` (~747 lignes)  
**API** : `GET/PUT/POST /api/financier`  
**LocalStorage** : `creapulse-financier-sim`

#### Interface utilisateur

- **5 cartes KPI** : CA Année 1/2, Charges A1, Résultat A1, Investissement, Cumulé 3 ans
- **4 sliders** : CA A1, Croissance annuelle, Charges A1, Investissement
- **Calculs en temps réel** : Marge nette A1/A3, Seuil de rentabilité
- **3 jauges de rentabilité (Recharts RadialBarChart)**
- **Graphique barres 3 ans** : CA vs Charges par année
- **Tableau de synthèse 3 ans**

#### Types de données

```typescript
// 4 entrées (sliders)
year1Revenue: number       // défaut: 100 000 €
growthRate: number         // défaut: 15 %
year1Expenses: number      // défaut: 70 000 €
initialInvestment: number  // défaut: 30 000 €

// Calculs automatiques
year2Revenue = year1Revenue × (1 + growthRate/100)
year3Revenue = year2Revenue × (1 + growthRate/100)
expenseGrowth = growthRate / 200
year2Expenses = year1Expenses × (1 + expenseGrowth)
year3Expenses = year2Expenses × (1 + expenseGrowth)
margeNetteA1 = (year1Revenue - year1Expenses) / year1Revenue × 100
seuilRentabiliteMois = initialInvestment / margeNetteMensuelle
```

#### Synchronisation vers le BP

Les projections financières synchronisent **5 sections BP** :
- `financement` ← Plan de financement (sources + montants)
- `compte-resultat` ← CA et charges année 1/2/3
- `tresorerie` ← Plan de trésorerie mensuel
- `seuil-rentabilite` ← Seuil de rentabilité calculé
- `bilan` ← Bilan prévisionnel

---

### 4.4 CreaSim (Simulateur Financier Mensuel)

**Fichier** : `src/components/bureau/modules/creasim.tsx` (~1 050 lignes)  
**API** : `GET/POST /api/creasim`  
**Badge** : `IA` dans le sidebar

#### Interface utilisateur

- **5 cartes KPI trafic** : Marge brute, Marge nette, Seuil de rentabilité, CA mensuel, Rentabilité A1
- **7 sliders** : CA mensuel, Charges fixes (ajoutables/supprimables), Taux charges variables, Prix de vente unitaire, Coût unitaire, Investissement initial, Taux de marge cible
- **4 jauges SVG circulaires**
- **Graphique aires 12 mois (Recharts)** : CA vs Charges mensuelles
- **3 cartes de rentabilité annuelle** : CA/Charges/Marge par année

#### Types de données

```typescript
interface SimulationInputs {
  monthlyRevenue: number         // défaut: 5 000 €
  fixedCharges: FixedCharge[]     // défaut: [{Loyer: 800}, {Assurances: 150}, {Abonnements: 100}]
  variableChargesRate: number    // défaut: 30 %
  averageSellingPrice: number    // défaut: 100 €
  unitCost: number               // défaut: 40 €
  initialInvestment: number      // défaut: 15 000 €
  targetMarginRate: number       // défaut: 40 %
}

interface SimulationResults {
  fixedChargesTotal: number
  variableChargesAmount: number
  totalCharges: number
  grossMarginAmount: number
  grossMarginRate: number
  netMarginAmount: number
  netMarginRate: number
  monthlyBreakeven: number       // CA minimum pour couvrir les charges
  breakevenMonths: number        // Mois pour atteindre le seuil
  profitability1Y/2Y/3Y: number  // Rentabilité cumulée
  year1/2/3Revenue: number
  year1/2/3Expenses: number
}
```

#### Synchronisation vers le BP

Le CreaSim synchronise dans la section BP `seuil-rentabilite` avec les données de marge et seuil calculés au mois le mois. Il alimente aussi les projections 3 ans dans les sections financières du BP.

---

### 4.5 Business Model Canvas (BMC)

**Fichier** : `src/components/bureau/modules/bmc.tsx` (~495 lignes)  
**API** : `GET/PUT/POST /api/bmc`  
**Badge** : `Nouveau` dans le sidebar

#### Interface utilisateur

- **Grille 9 blocs** en layout standard du BMC :
  ```
  ┌──────────────┬──────────────┬──────────────┐
  │ Partenaires  │  Activités   │  Ressources  │
  │    Clés      │    Clés      │    Clés      │
  ├──────────────┴──────────────┴──────────────┤
  │          Proposition de Valeur              │
  ├──────────────┬──────────────┬──────────────┤
  │  Relations   │   Canaux     │  Segments    │
  │   Clients    │              │   Clients    │
  ├──────────────┴──────────────┴──────────────┤
  │ Structure des Coûts │ Sources de Revenus   │
  └─────────────────────┴──────────────────────┘
  ```
- **Indicateur par bloc** : ✓ (rempli) ou ○ (vide) + compteur de caractères
- **Badge de statut** : `DRAFT` → `GENERATED` → `REFINED`
- **Auto-save** au blur avec debounce de 1.5 secondes

#### Les 9 blocs

| ID Frontend | Clé Backend | Titre |
|-------------|-------------|-------|
| `partenaires-cles` | `partenairesCles` | Partenaires Clés |
| `activites-cles` | `activitesCles` | Activités Clés |
| `ressources-cles` | `ressourcesCles` | Ressources Clés |
| `proposition-valeur` | `propositionValeur` | Proposition de Valeur |
| `relations-clients` | `relationsClients` | Relations Clients |
| `canaux` | `canaux` | Canaux |
| `segments-clients` | `segmentsClients` | Segments Clients |
| `structure-couts` | `structureCouts` | Structure des Coûts |
| `sources-revenus` | `sourcesRevenus` | Sources de Revenus |

#### États du BMC

```typescript
type BmcStatus = 'DRAFT' | 'GENERATED' | 'REFINED'
```

| État | Signification |
|------|---------------|
| `DRAFT` | Aucune génération IA effectuée |
| `GENERATED` | Canvas généré une fois depuis le BP |
| `REFINED` | Blocs individuellement raffinés par l'IA |

#### Actions IA

1. **"Générer avec l'IA"** (depuis le BP) : `POST /api/bmc` avec `action: 'generate-from-bp'`  
   → Récupère le contexte du BP + tous les simulateurs + parcours → génère les 9 blocs en un appel LLM → sauvegarde automatiquement

2. **Suggestion par bloc** : `POST /api/bmc` avec `action: 'ai-suggest-block'` + `blockId`  
   → Suggestion IA pour un seul bloc, l'utilisateur peut accepter ou modifier

#### Export

- **PDF** : `GET /api/export/bmc` → Page HTML A4 paysage (print-to-PDF) avec branding CreaPulse
- **Export démo** : `GET /api/export/demo/bmc` → Même format sans authentification

---

### 4.6 Business Plan

**Fichier** : `src/components/bureau/modules/business-plan.tsx` (~1 000+ lignes)  
**API** : `GET/PUT/POST /api/business-plan`  
**LocalStorage** : `creapulse-bp`

> **Le Business Plan est le HUB CENTRAL du pipeline Stratégie.** Toutes les données des autres modules convergent ici.

#### Architecture de l'éditeur

```
┌─────────────────────────────────────────────────────────┐
│  Sidebar gauche (sections)          │  Zone d'édition  │
│  ┌─────────────────────────┐        │  principale      │
│  │ ▼ Présentation (5)      │        │                   │
│  │   • Résumé opér.  ✓    │        │  [Titre section]  │
│  │   • Équipe        ✓    │        │                   │
│  │   • Historique    ○    │        │  [Champ éditable] │
│  │   • Vision         ✓   │        │  ou [Tableau]     │
│  │   • Valeurs        ○   │        │  ou [SWOT 4 quad] │
│  │ ▼ Marché (6)           │        │  ou [Timeline]    │
│  │   • Étude marché   ✓   │        │                   │
│  │   • Segmentation   ○   │        │  [Bouton IA]      │
│  │   • Concurrence    ✓   │        │  "Suggérer"       │
│  │   • ...               │        │                   │
│  │ ▼ Finances (6)        │        │                   │
│  │ ▼ Opérations (7)      │        │                   │
│  └─────────────────────────┘        │                   │
│  [Barre de progression]             │                   │
│  [Pipeline Status]                  │                   │
└─────────────────────────────────────────────────────────┘
```

#### Les 24 sections — Structure complète

##### Onglet PRÉSENTATION (5 sections)

| ID | Titre | Type | IA | Source pipeline |
|----|-------|------|-----|-----------------|
| `resume` | Résumé opérationnel | `textarea` | ✅ | Parcours |
| `equipe` | Présentation de l'équipe | `textarea` | ✅ | Parcours |
| `historique` | Historique et contexte | `textarea` | ✅ | Parcours |
| `vision` | Vision et mission | `textarea` | ✅ | Parcours |
| `valeurs` | Valeurs et engagements | `textarea` | ✅ | Parcours |

##### Onglet MARCHÉ (6 sections)

| ID | Titre | Type | IA | Source pipeline |
|----|-------|------|-----|-----------------|
| `etude-marche` | Étude de marché | `textarea` | ✅ | Marché |
| `segmentation` | Segmentation client | `textarea` | ✅ | Marché |
| `concurrence` | Analyse concurrentielle | `textarea` | ✅ | Marché |
| `strategie-marketing` | Stratégie marketing | `textarea` | ✅ | Marché |
| `plan-commercial` | Plan commercial | `textarea` | ✅ | Marché |
| `swot` | Analyse SWOT | `swot` (4 quadrants) | ✅ | Marché |

##### Onglet FINANCES (6 sections)

| ID | Titre | Type | IA | Source pipeline |
|----|-------|------|-----|-----------------|
| `financement` | Plan de financement initial | `financing-table` | ❌ | Financier |
| `compte-resultat` | Compte de résultat prévisionnel | `result-table` (3 ans) | ❌ | Financier |
| `tresorerie` | Plan de trésorerie | `treasury-table` (12 mois) | ❌ | Financier |
| `seuil-rentabilite` | Seuil de rentabilité | `textarea` | ❌ | CreaSim |
| `investissements` | Investissements | `investments-list` | ❌ | Financier |
| `bilan` | Bilan prévisionnel | `bilan-table` | ❌ | Financier |

##### Onglet OPÉRATIONS (7 sections)

| ID | Titre | Type | IA | Source pipeline |
|----|-------|------|-----|-----------------|
| `statut-juridique` | Statut juridique | `select` | ❌ | Juridique |
| `localisation` | Localisation et implantation | `textarea` | ✅ | Manuel |
| `organisation` | Organisation et moyens humains | `textarea` | ✅ | Manuel |
| `production` | Catalogue produits / services | `products-list` | ❌ | Manuel |
| `associes` | Associés et répartition du capital | `associates-list` | ❌ | Manuel |
| `cogerants` | Co-gérance | `cogerants-list` | ❌ | Manuel |
| `calendrier` | Calendrier de réalisation | `timeline` | ❌ | Parcours |

#### Types de rendu par section

```typescript
type SectionType =
  | 'textarea'        // Champ texte libre (Markdown)
  | 'swot'            // 4 quadrants : forces, faiblesses, opportunités, menaces
  | 'financing-table' // Tableau : { id, source, montant }
  | 'result-table'    // Tableau 3 ans : { year1, year2, year3 } chacun avec ca, charges, resultat
  | 'treasury-table'  // Tableau 12 mois : { month, encaissements, decaissements, solde }
  | 'investments-list' // Liste : { id, name, amount }
  | 'bilan-table'     // Tableau bilan : actif (immobilisations, stocks, créances, trésorerie) + passif
  | 'select'          // Sélecteur de statut juridique
  | 'timeline'        // Liste de jalons : { id, title, date, completed }
  | 'products-list'   // Liste produits : { id, nom, description, prixVente, coutUnitaire, quantiteMensuelle, marge }
  | 'associates-list' // Liste associés : { id, nom, prenom, role, nombreParts, pourcentage, apportCapital }
  | 'cogerants-list'   // Liste co-gérants : { id, nom, prenom, fonction, email, telephone }
```

#### Barre de statut Pipeline

Le BP affiche 5 badges qui indiquent quelles sources de données ont été synchronisées :

```
[Parcours ✓] [Marché ✓] [Financier ○] [Juridique ✓] [CreaSim ○]
```

Chaque badge est vert (✓) si les données de cette source sont présentes dans le BP, gris (○) sinon. La détection utilise l'API `/api/pipeline-status`.

#### Actions principales

| Action | API | Description |
|--------|-----|-------------|
| Charger | `GET /api/business-plan` | Récupère les 24 sections + projectContext |
| Sauvegarder | `PUT /api/business-plan` | Sauvegarde toutes les sections (upsert) |
| Suggérer IA | `POST` + `action: 'ai-suggest'` | Suggestion IA pour une section spécifique |
| Générer Parcours | `POST` + `action: 'generate-from-parcours'` | Remplit les 5 sections Présentation depuis Mon Projet + Vision |
| Synchroniser | `POST` + `action: 'sync-simulators'` | Fusionne les données de Marché, Juridique, Financier, CreaSim |
| Exporter PDF | `GET /api/export/business-plan` | Génère le PDF complet |

#### Score du BP

```typescript
bpScore = (sectionsRemplies / 24) × 100
```

Une section est considérée "remplie" si son contenu est non vide (string non vide, array avec ≥1 élément, object avec ≥1 clé non vide).

#### Cycle de vie du BP (BpStatus)

```
NOT_STARTED → IN_PROGRESS → GENERATING → DRAFT → REVIEW → VALIDATED → EXPORTED
```

| Statut | Signification |
|--------|---------------|
| `NOT_STARTED` | Aucune section remplie |
| `IN_PROGRESS` | Au moins 1 section en cours |
| `GENERATING` | Génération IA en cours |
| `DRAFT` | Première sauvegarde complète |
| `REVIEW` | En cours de révision |
| `VALIDATED` | Validé (par le conseiller) |
| `EXPORTED` | PDF exporté |

---

### 4.7 Pitch Deck

**Fichier** : `src/components/bureau/modules/pitch-deck.tsx` (~796 lignes)  
**API** : `GET/PUT/POST /api/pitch-deck`  
**LocalStorage** : `creapulse-pitch-deck`

#### Interface utilisateur

- **Éditeur slide par slide** : Navigation entre les 8 slides
- **Barre colorée** par slide (couleur distinctive)
- **Points de navigation** et miniatures de slides
- **Cartes de membres d'équipe** (CRUD) sur la slide Team
- **Champs Ask** : Montant de financement + Utilisation des fonds

#### Les 8 slides

| # | ID Frontend | Clé Backend | Titre | Couleur |
|---|-------------|-------------|-------|---------|
| 1 | `problem` | `probleme` | Problème | `bg-red-500` |
| 2 | `solution` | `solution` | Solution | `bg-amber-500` |
| 3 | `market` | `marche` | Marché | `bg-[#00838F]` |
| 4 | `business-model` | `businessModel` | Business Model | `bg-green-500` |
| 5 | `traction` | `traction` | Traction | `bg-purple-500` |
| 6 | `team` | `equipe` | Équipe | `bg-sky-500` |
| 7 | `financial` | `financier` | Financier | `bg-[#FF6B35]` |
| 8 | `ask` | `ask` | Ask | `bg-pink-500` |

#### Types de données

```typescript
interface SlideData {
  id: string
  title: string
  content: string              // Markdown
  teamMembers?: TeamMember[]   // Slide "team" uniquement : { id, name, role, bio }
  fundingAmount?: string       // Slide "ask" uniquement
  useOfFunds?: string          // Slide "ask" uniquement
}
```

#### Persistance

Le Pitch Deck est stocké dans le modèle **`ZeroDraft`** de Prisma :
- `content` = `JSON.stringify({ slides: [...] })`
- `wordCount` = calculé automatiquement
- `projectTitle` = titre du projet

#### Actions IA

1. **"Générer avec l'IA"** (depuis le BP) : `POST /api/pitch-deck` avec `action: 'generate-from-bp'`  
   → Récupère le contexte du BP + BMC + tous les simulateurs → génère les 8 slides en un appel LLM

2. **Suggestion par slide** : `POST /api/pitch-deck` avec `action: 'ai-suggest-slide'` + `slideKey`  
   → Suggestion IA pour une seule slide

#### Export

- **PPTX** : `GET /api/export/pitch-deck` → Présentation PowerPoint 16:9 (PptxGenJS) avec branding CreaPulse
- **TXT** : Export texte brut

---

## 5. Pipeline de données complet

### Diagramme de flux

```
                    ┌─────────────────┐
                    │   MON PROJET    │  projectTitle, sector, description
                    │   (Parcours)    │  targetAudience, revenueSources
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │     VISION      │  visionStatement, objectives
                    │   (Parcours)    │  coreValues, milestones
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │   MARCHÉ     │  │  JURIDIQUE   │  │  FINANCIER   │
   │  Simulateur  │  │  Simulateur  │  │  Simulateur  │
   │  + SWOT      │  │  5 statuts   │  │  3 ans       │
   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
          │                 │                  │
   ┌──────┴───────┐         │           ┌──────┴───────┐
   │   CREASIM    │         │           │              │
   │  Simulateur  │         │           │              │
   │  Mensuel IA  │         │           │              │
   └──────┬───────┘         │           │              │
          │                 │           │              │
          └─────────┬───────┴───────────┘              │
                    │                                │
                    ▼                                │
          ┌──────────────────┐                       │
          │  BUSINESS PLAN   │◄──────────────────────┘
          │  Hub Central     │  sync-simulators
          │  24 sections     │  + generate-from-parcours
          └────────┬─────────┘
                   │
          ┌────────┴─────────┐
          │                  │
          ▼                  ▼
   ┌──────────────┐  ┌──────────────┐
   │  BMC Canvas   │  │  PITCH DECK  │
   │  9 blocs     │  │  8 slides    │
   │  generate    │  │  generate    │
   │  -from-bp    │  │  -from-bp    │
   └──────┬───────┘  └──────┬───────┘
          │                  │
          ▼                  ▼
   ┌──────────────┐  ┌──────────────┐
   │  Export PDF  │  │  Export PPTX │
   │  / HTML      │  │              │
   └──────────────┘  └──────────────┘
```

### Mapping section BP → source de données

Ce mapping est géré par l'API `/api/pipeline-status` :

| Section BP | Source primaire | Source secondaire |
|-----------|-----------------|-------------------|
| `resume` | Parcours | IA (suggest) |
| `equipe` | Parcours | IA (suggest) |
| `historique` | Parcours | IA (suggest) |
| `vision` | Parcours | IA (suggest) |
| `valeurs` | Parcours | IA (suggest) |
| `etude-marche` | Marché | IA (suggest) |
| `segmentation` | Marché | IA (suggest) |
| `concurrence` | Marché | IA (suggest) |
| `strategie-marketing` | Marché | IA (suggest) |
| `plan-commercial` | Marché | IA (suggest) |
| `swot` | Marché | IA (suggest) |
| `financement` | Financier | Manuel |
| `compte-resultat` | Financier | Manuel |
| `tresorerie` | Financier | Manuel |
| `seuil-rentabilite` | CreaSim | IA (suggest) |
| `investissements` | Financier | Manuel |
| `bilan` | Financier | Manuel |
| `statut-juridique` | Juridique | Manuel |
| `localisation` | Manuel | IA (suggest) |
| `organisation` | Manuel | IA (suggest) |
| `production` | Manuel | — |
| `associes` | Manuel | — |
| `cogerants` | Manuel | — |
| `calendrier` | Parcours | — |

---

## 6. Le Business Plan en détail

### Structure du JSON `bpSections`

Les 24 sections sont stockées dans un seul champ JSON `CreatorJourney.bpSections` de type `Record<string, unknown>` :

```json
{
  "resume": "Texte libre du résumé opérationnel...",
  "equipe": "Description de l'équipe fondatrice...",
  "historique": "Contexte et historique du projet...",
  "vision": "Notre vision à 5 ans est de...",
  "valeurs": "Nos valeurs fondamentales sont...",
  "etude-marche": "Le marché de la restauration rapide...",
  "segmentation": "Notre client cible est...",
  "concurrence": "Les concurrents directs sont...",
  "strategie-marketing": "Notre stratégie marketing repose sur...",
  "plan-commercial": "Le plan commercial prévoit...",
  "swot": {
    "strengths": "Force 1, Force 2...",
    "weaknesses": "Faiblesse 1...",
    "opportunities": "Opportunité 1...",
    "threats": "Menace 1..."
  },
  "financement": [
    { "id": "1", "source": "Apport personnel", "montant": 15000 },
    { "id": "2", "source": "Prêt bancaire", "montant": 30000 }
  ],
  "compte-resultat": {
    "year1": { "ca": 100000, "charges": 70000, "resultat": 30000 },
    "year2": { "ca": 115000, "charges": 75250, "resultat": 39750 },
    "year3": { "ca": 132250, "charges": 80762, "resultat": 51488 }
  },
  "tresorerie": [
    { "month": "Janvier", "encaissements": 8333, "decaissements": 5833, "solde": 2500 }
  ],
  "seuil-rentabilite": "Le seuil de rentabilité est atteint au bout de 6 mois...",
  "investissements": [
    { "id": "1", "name": "Matériel informatique", "amount": 5000 }
  ],
  "bilan": {
    "actif": { "immobilisations": 15000, "stocks": 2000, "creances": 5000, "tresorerie": 8000 },
    "passif": { "capital": 20000, "emprunts": 10000, "fournisseurs": 3000, "autresDettes": 2000 }
  },
  "statut-juridique": "SARL",
  "localisation": "Paris 11e arrondissement...",
  "organisation": "L'équipe sera composée de...",
  "production": [
    { "id": "1", "nom": "Service A", "prixVente": 100, "coutUnitaire": 40, "quantiteMensuelle": 50, "marge": 60 }
  ],
  "associes": [
    { "id": "1", "nom": "Dupont", "prenom": "Marie", "role": "Gérante", "nombreParts": 50, "pourcentage": 60, "apportCapital": 15000 }
  ],
  "cogerants": [
    { "id": "1", "nom": "Martin", "prenom": "Jean", "fonction": "Directeur technique" }
  ],
  "calendrier": [
    { "id": "1", "title": "Création société", "date": "2025-01-15", "completed": false }
  ]
}
```

### API Business Plan — Détail des endpoints

#### `GET /api/business-plan`

Retourne :
```json
{
  "sections": { "...24 sections..." },
  "bpStatus": "DRAFT",
  "bpScore": 62,
  "projectContext": {
    "projectTitle": "Mon Restaurant",
    "sector": "Restauration",
    "targetAudience": "Professionnels urbains"
  }
}
```

#### `PUT /api/business-plan`

Corps : `{ "sections": {...}, "bpStatus": "DRAFT" }`  
Action : Upsert de toutes les sections dans `CreatorJourney.bpSections`. Met à jour `bpScore`.

#### `POST /api/business-plan` — Actions IA

##### Action `ai-suggest`

```json
{
  "action": "ai-suggest",
  "sectionId": "etude-marche",
  "sectionTitle": "Étude de marché",
  "existingContent": "Le marché de...",
  "projectContext": { "projectTitle": "...", "sector": "..." }
}
```

→ Retourne une suggestion IA pour cette section spécifique.

##### Action `generate-from-parcours`

```json
{ "action": "generate-from-parcours" }
```

→ Collecte TOUTES les données du parcours (User, Beneficiary, CreatorJourney, RIASEC, Kiviat, ModuleResults), construit un prompt LLM, génère les 5 sections de Présentation. **Ne surcharge pas** les sections déjà remplies.

##### Action `sync-simulators`

```json
{ "action": "sync-simulators" }
```

→ Récupère en parallèle les données de 5 simulateurs :
1. `MarketAnalysis` → sections marche
2. `FinancialForecast` → sections finances
3. `CreaSimSimulation` → seuil de rentabilité
4. `JuridiqueAnalysis` → statut juridique
5. `BusinessModelCanvas` → (lecture seule, pas de fusion)

Fusion intelligente : les données des simulateurs remplacent uniquement les sections vides ou non modifiées manuellement.

---

## 7. Synchronisation inter-modules

### Mécanisme de synchronisation

La synchronisation entre modules fonctionne via le pattern **"Producteur → Consommateur via API"** :

1. **Chaque simulateur** (Marché, Juridique, Financier, CreaSim) sauvegarde ses données dans sa propre table Prisma
2. **Après chaque sauvegarde**, le simulateur appelle `POST /api/business-plan` avec `action: 'sync-simulators'`
3. **L'API BP** récupère les données des 5 tables en parallèle (`Promise.all`) et les mappe aux sections BP
4. **Fusion non-destructive** : les sections déjà remplies manuellement ne sont pas écrasées

### Flux de synchronisation

```
┌──────────┐  save()   ┌──────────────────┐  read()   ┌──────────────┐
│  Marché   │────────→│  MarketAnalysis    │────────→│  BP Section  │
│  Module   │         │  (Prisma table)   │         │  etude-marche│
└──────────┘         └──────────────────┘         └──────────────┘
                                                           ▲
┌──────────┐  save()   ┌──────────────────┐  sync()   ┌────┴─────────┐
│Juridique │────────→│ JuridiqueAnalysis  │────────→│  Business    │
│  Module   │         │  (Prisma table)   │         │  Plan API    │
└──────────┘         └──────────────────┘         └──────────────┘
                                                           ▲
┌──────────┐  save()   ┌──────────────────┐  sync()          │
│Financier │────────→│ FinancialForecast  │────────→         │
│  Module   │         │  (Prisma table)   │                  │
└──────────┘         └──────────────────┘                  │
                                                           │
┌──────────┐  save()   ┌──────────────────┐  sync()          │
│ CreaSim  │────────→│ CreaSimSimulation  │────────→         │
│  Module   │         │  (Prisma table)   │                  │
└──────────┘         └──────────────────┘                  │
                                                           │
                                                   ┌───────┴───────┐
                                                   │ CreatorJourney │
                                                   │ bpSections JSON│
                                                   └───────────────┘
```

### Ordre recommandé de remplissage

| Étape | Action | Résultat |
|-------|--------|----------|
| 1 | Remplir Mon Projet (Parcours) | 5 sections Présentation alimentées |
| 2 | Remplir Vision (Parcours) | Sections vision, valeurs, calendrier alimentées |
| 3 | Utiliser le simulateur Marché | 6 sections Marché alimentées via sync |
| 4 | Utiliser le simulateur Juridique | Section statut-juridique alimentée |
| 5 | Utiliser le simulateur Financier | 5 sections Finances alimentées via sync |
| 6 | Utiliser CreaSim | Section seuil-rentabilite alimentée |
| 7 | Compléter les sections manuelles | localisation, organisation, production, associes, cogerants |
| 8 | Lancer les suggestions IA | Enrichissement de chaque section |
| 9 | Générer le BMC | 9 blocs depuis le BP complet |
| 10 | Générer le Pitch Deck | 8 slides depuis le BP + BMC |

---

## 8. Intégration IA

### Pattern d'intégration

Tous les modules utilisent le même pattern d'appel IA via `callZAI()` (sdk `z-ai-web-dev-sdk`) :

```typescript
// Pattern standard
const result = await callZAI({
  prompt: `...prompt avec contexte...`,
  temperature: 0.7,
  max_tokens: 2000,
});

if (result.success) {
  const content = result.content;
  // Utiliser parseJSONFromAI() pour les réponses JSON
} else {
  // Retourne un message d'indisponibilité (jamais d'erreur 500)
  return aiUnavailableResponse();
}
```

### Paramètres IA par module

| Module | Température | Max Tokens | Format réponse |
|--------|-------------|------------|---------------|
| Business Plan (section) | 0.7 | 1 200 | Markdown |
| Business Plan (parcours) | 0.7 | 3 000 | JSON |
| BMC (complet) | 0.7 | 2 500 | JSON (9 blocs) |
| BMC (par bloc) | 0.7 | 800 | Texte |
| Pitch Deck (complet) | 0.7 | 2 500 | JSON (8 slides) |
| Pitch Deck (par slide) | 0.7 | 800 | Texte |
| Marché (analyse) | 0.7 | 800-2 000 | JSON / Texte |
| Juridique (suggest) | 0.7 | 400 | JSON |
| Juridique (autofill) | 0.7 | 600 | JSON |
| Financier (synthèse) | 0.7 | 3 000 | Markdown (5 sections) |
| Bilan IA | 0.5 | 2 000 | JSON |

### Garde-fous IA

- **Aucune erreur 500** : En cas d'indisponibilité de l'IA, un message graceful est retourné
- **Non-destructif** : Les suggestions IA ne remplacent jamais le contenu existant (sauf demande explicite)
- **Parse JSON** : Utilisation de `parseJSONFromAI()` pour extraire le JSON des réponses LLM
- **Context enrichi** : Chaque prompt inclut le contexte du projet (titre, secteur, cible) pour des réponses pertinentes

---

## 9. Calcul de progression

### API `/api/progress`

L'API retourne la progression sous cette forme :

```json
{
  "parcours": {
    "progress": 60,
    "modules": {
      "profil-createur": true,
      "mon-projet": true,
      "vision": true,
      "riasec": true,
      "kiviat": true,
      "bilan-ia": false
    }
  },
  "strategie": {
    "progress": 45,
    "modules": {
      "marche": true,
      "juridique": true,
      "financier": false,
      "creasim": false,
      "bmc": false,
      "business-plan": false,
      "pitch-deck": false
    }
  },
  "global": 51
}
```

### Critères de complétion — Stratégie (7 modules)

| Module | Critère de complétion |
|--------|----------------------|
| `marche` | `sector` ET `targetAudience` non vides dans `MarketAnalysis` |
| `juridique` | `recommendedStatus` non vide dans `JuridiqueAnalysis` |
| `financier` | `year1Revenue` ET `year1Expenses` non null dans `FinancialForecast` |
| `creasim` | `monthlyRevenue` > 0 dans `CreaSimSimulation` |
| `bmc` | ≥ 5 des 9 blocs non vides dans `BusinessModelCanvas` |
| `business-plan` | `bpStatus` ∈ {DRAFT, REVIEW, VALIDATED, EXPORTED} ET `bpScore` > 50 |
| `pitch-deck` | `ZeroDraft.content` contient ≥ 8 séparateurs `---` |

### Formule de progression globale

```
progression_globale = Math.round(progression_parcours × 0.4 + progression_stratégie × 0.6)
```

**La stratégie compte pour 60%** de la progression globale, reflétant son importance dans le parcours créateur.

### Indicateurs visuels

- **Sidebar** : Cercle de progression par section (Parcours, Stratégie, etc.)
- **SectionOverview** : Cartes avec badges de complétion par module
- **Business Plan** : Barre de progression + score /100 + pipeline status badges

---

## 10. Exports et livrables

### Formats d'export disponibles

| Livrable | Format | API | Technologie |
|----------|--------|-----|-------------|
| Business Plan | PDF | `GET /api/export/business-plan` | PDFKit (`pdf-utils.ts`) |
| Business Plan (démo) | PDF | `GET /api/export/demo/business-plan` | PDFKit (utilisateur démo) |
| BMC | HTML (print-to-PDF) | `GET /api/export/bmc` | HTML statique A4 paysage |
| BMC (démo) | HTML | `GET /api/export/demo/bmc` | HTML statique |
| Pitch Deck | PPTX | `GET /api/export/pitch-deck` | PptxGenJS |
| Suivi CreaSim | PDF | `GET /api/export/suivi-creasim` | PDFKit |
| Suivi Tremplin | PDF | `GET /api/export/suivi-tremplin` | PDFKit |
| Suivi Parcours | PDF | `GET /api/export/suivi-parcours` | PDFKit |
| Suivi Kiviat | PDF | `GET /api/export/suivi-kiviat` | PDFKit |
| Bilan CréaScope | PDF | `POST /api/export/bilan-creascope` | PDFKit |
| Passeport | JSON | `GET /api/export/passeport` | JSON (data) |

### Exports démo (landing page)

La section PDF showcase sur la home page (`pdf-showcase-section.tsx`) propose 6 exports démo téléchargeables sans authentification :

| Type | Titre | Pages |
|------|-------|-------|
| `suivi-parcours` | Suivi de Parcours Complet | ~8 |
| `suivi-kiviat` | Compétences Kiviat | ~4 |
| `suivi-tremplin` | Évaluation Tremplin | ~5 |
| `suivi-creasim` | Simulation Financière | ~6 |
| `bmc` | Business Model Canvas | 1 (A4 paysage) |
| `business-plan` | Business Plan Complet | ~15-20 |

Ces exports utilisent l'utilisateur démo `beneficiaire-demo-001` avec des données pré-remplies.

---

## 11. Architecture technique

### Pattern Frontend

| Aspect | Implémentation |
|--------|---------------|
| **Framework** | Next.js 16 + App Router |
| **Routing bureau** | Zustand (`useBureauStore`) — PAS de routing fichier |
| **État local** | `useState` + `localStorage` par module |
| **Stores Zustand** | 3 stores seulement : `useBureauStore`, `useAuthStore`, `useNotificationStore` |
| **Appels API** | `fetch()` directs (pas de TanStack Query pour les modules) |
| **UI** | Tailwind CSS 4 + shadcn/ui + Recharts + Lucide icons |
| **Animations** | Framer Motion (transitions entre modules) |
| **Composants dynamiques** | `next/dynamic` avec code splitting |

### Pattern Backend

| Aspect | Implémentation |
|--------|---------------|
| **API Routes** | App Router (`src/app/api/...`) |
| **Base de données** | PostgreSQL + Prisma ORM |
| **Authentification** | JWT (jose) + bcryptjs — cookie `session` |
| **IA** | `callZAI()` via `z-ai-web-dev-sdk` |
| **PDF** | PDFKit via `@/lib/pdf-utils.ts` |
| **PPTX** | PptxGenJS |
| **Validation** | Schémas Zod inline dans chaque route |

### Clés localStorage

| Clé | Module |
|-----|--------|
| `creapulse-bp` | Business Plan |
| `creapulse-bmc` | BMC |
| `creapulse-pitch-deck` | Pitch Deck |
| `creapulse-marche` | Marché |
| `creapulse-financier-sim` | Financier |
| `creapulse-juridique` | Juridique |
| `creapulse-tremplin` | Tremplin |
| `creapulse-mon-projet` | Mon Projet |
| `creapulse-vision` | Vision |
| `creapulse-auth` | Authentification |
| `creapulse-bureau` | Navigation bureau |

---

## 12. Modèle de données (Prisma)

### Tables impliquées dans la stratégie

```
┌──────────────────┐
│  CreatorJourney   │  ← Table centrale de la stratégie
│  bpSections: Json │     Contient les 24 sections du BP
│  bpStatus: enum   │     NOT_STARTED → EXPORTED
│  bpScore: Int     │     (0-100)
│  bpGeneratedAt    │
│  bpValidatedAt    │
│  bpValidatedBy    │
│  tremplinStatus   │
│  tremplinScore    │
│  projectTitle     │
│  projectSector    │
│  visionAnswers    │
└──────────────────┘
        │ 1:1
        ▼
┌──────────────────┐
│  BusinessModel    │
│    Canvas         │  9 colonnes de blocs
│  partenairesCles  │  + status (DRAFT/GENERATED/REFINED)
│  activitesCles    │  + generatedFromBp
│  ressourcesCles   │  + generatedAt
│  propositionValeur│
│  relationsClients │
│  canaux            │
│  segmentsClients  │
│  structureCouts   │
│  sourcesRevenus   │
└──────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  MarketAnalysis   │  │FinancialForecast │  │CreaSimSimulation │
│  sector           │  │ year1/2/3Revenue │  │ monthlyRevenue   │
│  marketSize       │  │ year1/2/3Expenses│  │ fixedCharges     │
│  targetAudience   │  │ breakevenMonth   │  │ variableRate     │
│  trends: Json[]   │  │ initialInvestment│  │ breakevenMonths  │
│  competitors: Json│  │ aiSynthesis      │  │ aiAnalysis       │
│  swot: Json?      │  └──────────────────┘  └──────────────────┘
│  aiSynthesis      │
└──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│JuridiqueAnalysis │  │   ZeroDraft      │  ← Stockage du Pitch Deck
│  recommendedStatus│ │ content: JSON    │     (slides stringifiés)
│  fiscalRegime     │ │ projectTitle     │
│  legalStructure   │ │ wordCount        │
│  socialCharges    │ │ status           │
└──────────────────┘  └──────────────────┘
```

### Enums stratégiques

```prisma
enum BpStatus {
  NOT_STARTED | IN_PROGRESS | GENERATING | DRAFT | REVIEW | VALIDATED | EXPORTED
}

enum TremplinStatus {
  NOT_STARTED | IN_PROGRESS | COMPLETED | GO | NO_GO
}

enum TremplinDecision {
  GO | GO_CONDITIONAL | NO_GO | PENDING
}

enum DraftStatus {
  DRAFT | GENERATING | READY | REFINED
}

enum JourneyPhase {
  DISCOVERY | PROFILING | MODELING | STRATEGY | ECOSYSTEM | LAUNCH | POST_CREATION
}
```

---

## 13. Annexe : mapping complet des fichiers

### Composants Frontend

| Fichier | Lignes | Composant | Section |
|---------|--------|-----------|---------|
| `src/components/bureau/bureau-store.ts` | 73 | `useBureauStore` | Core |
| `src/components/bureau/sidebar.tsx` | 477 | `Sidebar`, `MobileSidebar` | Navigation |
| `src/components/bureau/topbar.tsx` | 237 | `TopBar` | Navigation |
| `src/components/bureau/bureau-layout.tsx` | 378 | `BureauLayout`, `BureauContent` | Core |
| `src/components/bureau/modules/marche.tsx` | 895 | `MarcheModule` | **Stratégie** |
| `src/components/bureau/modules/juridique.tsx` | 905 | `JuridiqueModule` | **Stratégie** |
| `src/components/bureau/modules/financier.tsx` | 747 | `FinancierModule` | **Stratégie** |
| `src/components/bureau/modules/creasim.tsx` | 1 050 | `CreaSim` | **Stratégie** |
| `src/components/bureau/modules/bmc.tsx` | 495 | `BusinessModelCanvasModule` | **Stratégie** |
| `src/components/bureau/modules/business-plan.tsx` | 1 000+ | `BusinessPlanModule` | **Stratégie** |
| `src/components/bureau/modules/pitch-deck.tsx` | 796 | `PitchDeckModule` | **Stratégie** |
| `src/components/bureau/modules/tremplin.tsx` | 799 | `Tremplin` | Pilotage |
| `src/components/bureau/modules/mon-projet.tsx` | 1 100+ | `MonProjet` | Parcours |
| `src/components/bureau/modules/vision.tsx` | 936 | `VisionModule` | Parcours |

### API Routes Stratégie

| Route | Méthodes | Fichier | Lignes |
|-------|----------|---------|---------|
| `/api/business-plan` | GET, PUT, POST | `api/business-plan/route.ts` | 868 |
| `/api/bmc` | GET, PUT, POST | `api/bmc/route.ts` | 593 |
| `/api/pitch-deck` | GET, PUT, POST | `api/pitch-deck/route.ts` | 500 |
| `/api/financier` | GET, PUT, POST | `api/financier/route.ts` | 313 |
| `/api/creasim` | GET, POST, PUT | `api/creasim/route.ts` | 211 |
| `/api/marche` | GET, PUT, POST | `api/marche/route.ts` | 388 |
| `/api/juridique` | GET, POST | `api/juridique/route.ts` | 401 |
| `/api/tremplin` | GET, POST | `api/tremplin/route.ts` | 149 |
| `/api/projet` | GET, PUT | `api/projet/route.ts` | 170 |
| `/api/vision` | GET, PUT | `api/vision/route.ts` | 135 |
| `/api/pipeline-status` | GET | `api/pipeline-status/route.ts` | 203 |
| `/api/progress` | GET | `api/progress/route.ts` | 252 |
| `/api/ia` | POST | `api/ia/route.ts` | 197 |
| `/api/bilan` | GET, POST | `api/bilan/route.ts` | 605 |

### API Routes Export

| Route | Méthode | Fichier |
|-------|---------|---------|
| `/api/export/business-plan` | GET | `api/export/business-plan/route.ts` |
| `/api/export/bmc` | GET | `api/export/bmc/route.ts` |
| `/api/export/pitch-deck` | GET | `api/export/pitch-deck/route.ts` |
| `/api/export/suivi-creasim` | GET | `api/export/suivi-creasim/route.ts` |
| `/api/export/suivi-tremplin` | GET | `api/export/suivi-tremplin/route.ts` |
| `/api/export/suivi-parcours` | GET | `api/export/suivi-parcours/route.ts` |
| `/api/export/suivi-kiviat` | GET | `api/export/suivi-kiviat/route.ts` |
| `/api/export/passeport` | GET | `api/export/passeport/route.ts` |
| `/api/export/bilan-creascope` | POST | `api/export/bilan-creascope/route.ts` |
| `/api/export/demo/[type]` | GET | `api/export/demo/[type]/route.ts` |
| `/api/export/demo/list` | GET | `api/export/demo/list/route.ts` |

---

> **Fin du document** — CreaPulse V2 Pipeline Stratégie  
> Ce document couvre l'intégralité du flux de la section Stratégie, de l'alimentation par le Parcours jusqu'à l'export final du Business Plan, BMC et Pitch Deck.
