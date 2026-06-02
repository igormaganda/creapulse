# CreaPulse V2 — Pipeline Stratégie Optimisé : Proposition d'Architecture V3

> **Version** : 3.0 (Proposition)  
> **Date** : Juillet 2025  
> **Référence** : Basé sur l'analyse de `download/STRATEGIE-PIPELINE.md` (V2)  
> **Objectif** : Identifier les failles du pipeline actuel et proposer une architecture optimisée

---

## Table des matières

1. [Diagnostic : 12 failles identifiées dans le pipeline V2](#1-diagnostic--12-failles-identifiées-dans-le-pipeline-v2)
2. [Vision du pipeline optimisé](#2-vision-du-pipeline-optimisé)
3. [Refonte de l'architecture : 3 principes fondateurs](#3-refonte-de-larchitecture--3-principes-fondateurs)
4. [Nouveau pipeline de données](#4-nouveau-pipeline-de-données)
5. [Refonte des modules simulateurs](#5-refonte-des-modules-simulateurs)
6. [Refonte du Business Plan (Hub Central)](#6-refonte-du-business-plan-hub-central)
7. [Refonte de la synchronisation inter-modules](#7-refonte-de-la-synchronisation-inter-modules)
8. [Nouveau système de progression et de score](#8-nouveau-système-de-progression-et-de-score)
9. [Intégration IA optimisée](#9-intégration-ia-optimisée)
10. [Workflow guidé intelligent](#10-workflow-guidé-intelligent)
11. [Exports et livrables enrichis](#11-exports-et-livrables-enrichis)
12. [Impact sur le modèle de données](#12-impact-sur-le-modèle-de-données)
13. [Plan de migration V2 → V3](#13-plan-de-migration-v2--v3)

---

## 1. Diagnostic : 12 failles identifiées dans le pipeline V2

### Faille n°1 — Redondance Financier / CreaSim

**Problème** : Deux modules financiers indépendants couvrent des domaines qui se chevauchent :
- **Financier** : Projections 3 ans (CA, charges, investissement), seuil de rentabilité
- **CreaSim** : Simulation mensuelle (CA mensuel, charges fixes/variables, marges), seuil de rentabilité

Les deux calculent un seuil de rentabilité et des projections 3 ans, mais **ne communiquent pas entre eux**. L'utilisateur doit saisir deux fois des données similaires (CA, charges, investissement), et les résultats peuvent être contradictoires dans le BP.

**Impact** : Confusion utilisateur, données incohérentes dans le BP, double saisie, perte de confiance.

---

### Faille n°2 — Synchronisation inefficace (N+1 reads)

**Problème** : Chaque simulateur (Marché, Juridique, Financier, CreaSim) déclenche indépendamment `sync-simulators` après chaque sauvegarde. Cet endpoint lit **les 5 tables simulateurs en parallèle** (`Promise.all`), même si seule 1 table a changé.

```typescript
// Actuel : chaque save() déclenche un sync qui lit TOUT
Marché.save()  → sync-simulators() → reads: Market, Financial, CreaSim, Juridique, BMC
CreaSim.save() → sync-simulators() → reads: Market, Financial, CreaSim, Juridique, BMC
```

**Impact** : Surcharge inutile de la base de données (4/5 lectures inutiles par sync), latence ajoutée à chaque sauvegarde.

---

### Faille n°3 — Flux unidirectionnel (pas de feedback)

**Problème** : Les données circulent uniquement dans un sens : `Simulateur → BP`. Si l'utilisateur modifie directement une section financière dans le BP (ex : ajuste le CA année 2), cette modification ne remonte **jamais** vers le simulateur Financier.

Conséquence : le simulateur affiche des valeurs obsolètes par rapport au BP, et le prochain `sync-simulators` écrasera la modification manuelle.

**Impact** : Conflits silenciques, écrasement de données manuelles, confusion.

---

### Faille n°4 — BP monolithique (JSON blob unique)

**Problème** : Les 24 sections du BP sont stockées dans un seul champ JSON `CreatorJourney.bpSections` (`Record<string, unknown>`). Cela empêche :
- Le **tracking granulaire** des modifications (qui a modifié quoi, quand)
- La **résolution de conflits** lors de syncs simultanés
- Le **versioning** (pas d'historique des versions)
- La **détection de source** sans lire toutes les tables externes

**Impact** : Perte de données possible, pas de undo/redo, audit impossible.

---

### Faille n°5 — Pipeline linéaire sans parallélisme

**Problème** : Le pipeline est conçu comme un flux strictement séquentiel :

```
Parcours → Marché → Juridique → Financier → CreaSim → BP → BMC → Pitch
```

Or, Marché, Juridique, Financier et CreaSim sont **indépendants entre eux**. L'utilisateur devrait pouvoir les remplir en parallèle. Actuellement, l'ordre dans le sidebar suggère implicitement une séquence qui n'existe pas techniquement.

**Impact** : Frustration, sensation de "lenteur", sous-utilisation du parallélisme.

---

### Faille n°6 — Pas de workflow guidé

**Problème** : L'utilisateur arrive sur la section Stratégie et voit 7 cartes. Aucune indication :
- De ce qu'il a **déjà fait** dans le Parcours
- De ce qui est **prêt à être synchronisé**
- De la **prochaine action recommandée**
- Des **pré-requis** non satisfaits (ex : générer le BMC alors que le BP est vide)

**Impact** : Paralysie par l'analyse, abandons en cours de route, erreurs d'ordre.

---

### Faille n°7 — Progression binaire et non qualitative

**Problème** : La progression est calculée en binaire (module complété ou non) :

```typescript
// Actuel
marche: sector && targetAudience ? true : false
bmc: filledBlocks >= 5 ? true : false
business-plan: bpStatus ∈ {DRAFT,...} && bpScore > 50 ? true : false
```

Un module est à 0% ou 100%. Pas de mesure de **qualité** ni de **profondeur**. Un SWOT rempli d'une phrase par case compte autant qu'un SWOT détaillé de 500 mots.

**Impact** : Score de progression non représentatif, fausse satisfaction.

---

### Faille n°8 — Pas de scoring de cohérence

**Problème** : Aucun mécanisme ne vérifie la **cohérence entre modules**. Par exemple :
- Le simulateur Financier projette 100K€ de CA an 1, mais le simulateur Marché estime un marché de 1M€ avec 5% de part = 50K€
- Le BP mentionne 3 associés, mais le Juridique recommande EURL (1 associé max)
- Le BMC indique "Abonnements mensuels" comme source de revenus, mais le Financier ne prévoit aucun revenu récurrent

**Impact** : BP incohérent, perte de crédibilité devant les banques/investisseurs.

---

### Faille n°9 — Sections Finances sans IA

**Problème** : Les 6 sections Finances du BP (`financement`, `compte-resultat`, `tresorerie`, `seuil-rentabilite`, `investissements`, `bilan`) n'ont **pas de suggestion IA** (`hasAiSuggestion: false`). Seuls les 13 sections texte disposent de suggestions.

Or, ce sont précisément les sections les plus techniques et les plus difficiles à remplir pour un porteur de projet non-financier.

**Impact** : Taux d'abandon élevé sur les sections financières, BP incomplets.

---

### Faille n°10 — BMC et Pitch Deck isolés (pas de feedback)

**Problème** : BMC et Pitch Deck sont des **terminaisons unidirectionnelles**. Le BMC est généré depuis le BP, et le Pitch Deck depuis le BP + BMC. Mais :
- Si l'utilisateur affine le BMC (ajoute un partenaire clé), cette info ne remonte pas au BP
- Si le Pitch Deck révèle une incohérence (ex : pas de données financières), l'utilisateur doit retourner manuellement au BP

**Impact** : Expérience en silo, itérations manuelles.

---

### Faille n°11 — Pas de versionnage ni d'historique

**Problème** : Le BP n'a **aucun historique de versions**. Chaque `PUT /api/business-plan` écrase la totalité des sections. Si l'utilisateur ou l'IA écrase une section par erreur, la donnée est perdue.

**Impact** : Risque de perte de données, pas de comparaison avant/après IA, pas de reprise en cas d'erreur.

---

### Faille n°12 — Pipeline Status passif

**Problème** : La barre de statut Pipeline dans le BP (`[Parcours ✓] [Marché ✓] [Financier ○] [Juridique ✓] [CreaSim ○]`) est purement **informative**. Elle ne déclenche aucune action :
- Pas de warning : "Vous générez le BMC alors que Financier et CreaSim ne sont pas synchronisés"
- Pas de suggestion : "CreaSim est vide, voulez-vous le synchroniser avant d'exporter ?"
- Pas de blocage : on peut exporter un BP à 8/24 sections

**Impact** : Livrables de mauvaise qualité possibles, pas de garde-fou.

---

## 2. Vision du pipeline optimisé

### Les 3 objectifs stratégiques

| # | Objectif | Métrique cible |
|---|----------|---------------|
| 1 | **Éliminer la redondance** | 1 module financier unique au lieu de 2 |
| 2 | **Rendre le pipeline intelligent** | Workflow guidé + scoring de cohérence |
| 3 | **Assurer la qualité des livrables** | Versioning + IA sur toutes les sections + garde-fous |

### Pipeline V3 — Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                      PARCOURS (Amont)                             │
│  Mon Projet ──→ Vision ──→ Profil Créateur ──→ Bilan IA         │
└──────────────────────┬──────────────────────────────────────────┘
                       │  Auto-alimentation du BP
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              STRATÉGIE — 3 simulateurs (parallèles)               │
│                                                                 │
│   ┌──────────┐    ┌──────────────┐    ┌──────────────┐           │
│   │  MARCHÉ   │    │  FINANCE UNI │    │  JURIDIQUE   │           │
│   │ Analyse   │    │  3 ans+mois  │    │  Statut légal│           │
│   │ + SWOT   │    │  CreaSim inté│    │  + Charges   │           │
│   └─────┬─────┘    └──────┬───────┘    └──────┬───────┘           │
│         │                 │                    │                   │
│         └────────┬────────┴────────────────────┘                   │
│                  │  Sync ciblé (seul le module modifié)            │
│                  ▼                                                │
│         ┌────────────────────┐                                    │
│         │ COHÉRENCE ENGINE   │  Vérifie les incohérences           │
│         │ (nouveau)          │  Alerte l'utilisateur               │
│         └────────┬───────────┘                                    │
└──────────────────┼──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│          BUSINESS PLAN (Hub Central — 24 sections)                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Versionning : v1 → v2 → v3 (historique complet)        │     │
│  │ Source tracking : chaque section ↔ source + timestamp  │     │
│  │ IA universelle : suggestion sur TOUTES les sections     │     │
│  │ Garde-fous : export bloqué si score cohérence < 60      │     │
│  └────────────────────────────────────────────────────────┘     │
│                  │           │           │                        │
│         ┌────────┴───┐ ┌─────┴─────┐ ┌──┴──────────────┐         │
│         │ BMC Canvas │ │ Pitch Deck│ │ Export PDF/PPTX │         │
│         │ Feedback ↺ │ │ Feedback ↺│ │ Garde-fous ✓    │         │
│         └────────────┘ └───────────┘ └─────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Refonte de l'architecture : 3 principes fondateurs

### Principe 1 — Single Source of Truth par domaine

Chaque donnée n'existe que dans **un seul endroit**. Pas de duplication.

| Domaine | Source unique | Partager avec |
|---------|---------------|---------------|
| Projet (titre, secteur, description) | `CreatorJourney` | BP (lecture) |
| Vision (objectifs, valeurs, jalons) | `CreatorJourney.visionAnswers` | BP (lecture) |
| Analyse de marché + SWOT | `MarketAnalysis` | BP via sync |
| Statut juridique + charges | `JuridiqueAnalysis` | BP via sync |
| Données financières | `FinancialForecast` (fusion Financier + CreaSim) | BP via sync |
| Sections BP textuelles | `CreatorJourney.bpSections` | — |
| BMC | `BusinessModelCanvas` | BP (lecture) |
| Pitch Deck | `ZeroDraft` | BP + BMC (lecture) |

### Principe 2 — Sync ciblé (event-driven)

Remplacer le sync global (`sync-simulators` lit tout) par un **sync ciblé** qui ne met à jour que les sections impactées.

```typescript
// V2 (actuel) — Sync global
simulateur.save() → POST /api/business-plan { action: 'sync-simulators' }
                    → lit MarketAnalysis + FinancialForecast + CreaSimSimulation + JuridiqueAnalysis + BMC
                    → met à jour toutes les sections BP

// V3 (proposé) — Sync ciblé
simulateur.save() → POST /api/business-plan { action: 'sync-target', source: 'marche' }
                    → lit uniquement MarketAnalysis
                    → met à jour uniquement les 6 sections marché
```

**Réduction** : de 5 lectures DB par sync → 1 seule lecture. 4x moins de charge.

### Principe 3 — Feedback bidirectionnel

Quand une section BP est modifiée manuellement, le système :
1. **Détecte** que la source originale est périmée (via timestamps)
2. **Propose** à l'utilisateur : "Le simulateur Marché a des données plus récentes. Voulez-vous les appliquer ou conserver votre version manuelle ?"
3. **Marque** la section comme "manuellement modifiée" (ne plus écraser par sync automatique)

```typescript
interface BpSectionMeta {
  source: 'parcours' | 'marche' | 'juridique' | 'financier' | 'manual'
  syncedAt: Date
  manuallyEditedAt: Date | null  // Si ≠ null → protégée contre le sync auto
  version: number               // Pour le versioning
}
```

---

## 4. Nouveau pipeline de données

### Réorganisation des modules : de 7 à 6

Le pipeline V3 supprime le module CreaSim standalone et le **fusionne dans Financier** :

```
V2 (7 modules)                    V3 (6 modules)
─────────────                      ──────────────
1. Marché          ─────────→     1. Marché (inchangé)
2. Juridique       ─────────→     2. Juridique (inchangé)
3. Financier        \             3. Finance Unifié (Financier + CreaSim)
4. CreaSim          /             ← Supprimé comme module standalone
5. BMC             ─────────→     4. BMC (inchangé, + feedback)
6. Business Plan    ─────────→     5. Business Plan (amélioré)
7. Pitch Deck      ─────────→     6. Pitch Deck (amélioré, + feedback)
```

### Nouvel ordre dans le sidebar

```
📚 STRATÉGIE
├── 📊 1. Marché & Analyse         ← Comprendre le terrain
├── ⚖️  2. Juridique & Statut      ← Choisir sa structure
├── 💰 3. Finance Unifié           ← Projections 3 ans + simulation mensuelle
├── 🧩 4. Modèle Économique (BMC)  ← Synthétiser le business model
├── 📄 5. Business Plan            ← Rédiger le document complet
└── 🎤 6. Pitch Deck               ← Préparer la présentation
```

### Diagramme de flux V3

```
     ┌──────────────┐
     │  MON PROJET  │
     │  (Parcours)  │
     └──────┬───────┘
            │
     ┌──────┴───────┐
     │    VISION    │
     │  (Parcours)  │
     └──────┬───────┘
            │
            │  Auto-sync au chargement du BP
            ▼
  ┌─────────────────────────────────┐
  │     WORKFLOW GUIDÉ (nouveau)    │
  │                                 │
  │  Étape 1 ✅ Mon Projet rempli   │
  │  Étape 2 ✅ Vision remplie      │
  │  Étape 3 ⬜ Marché (recommandé)  │
  │  Étape 4 ⬜ Juridique            │
  │  Étape 5 ⬜ Finance Unifié       │
  │  → Prochaine action : Marché     │
  └────────────┬────────────────────┘
               │
   ┌───────────┼───────────┐
   ▼           ▼           ▼
┌──────┐  ┌─────────┐  ┌──────┐
│Marché│  │Juridique│  │Finance│  ← Parallèles, indépendants
└──┬───┘  └────┬────┘  └──┬───┘
   │           │           │
   │  Sync ciblé (uniquement le module modifié)
   │           │           │
   └─────┬─────┴───────────┘
         ▼
  ┌──────────────────┐
  │ COHÉRENCE ENGINE  │  ← Vérifie les incohérences inter-modules
  │ Score : 0-100     │  ← Alerte si < 60
  └────────┬─────────┘
           ▼
  ┌──────────────────┐
  │  BUSINESS PLAN    │  ← Versioning + IA universelle
  │  24 sections      │  ← Source tracking par section
  │  Garde-fous       │  ← Export conditionnel
  └────┬─────────┬───┘
       │         │
   ┌───┴──┐  ┌──┴──────┐
   │ BMC  │  │Pitch Deck│  ← Feedback bidirectionnel
   │ ↺    │  │ ↺        │
   └──────┘  └─────────┘
```

---

## 5. Refonte des modules simulateurs

### 5.1 Marché — Améliorations

| Aspect | V2 (actuel) | V3 (proposé) |
|--------|-------------|--------------|
| **SWOT** | 4 textareas basiques | IA enrichit : propositions de forces/faiblesses par rapport au secteur |
| **Données concurrents** | Nombre only (slider) | Fiches concurrents détaillées (nom, forces, faiblesses, part de marché) |
| **KPI** | 4 cartes génériques | KPI contextuels basés sur le secteur du projet |
| **IA** | Analyse + autofill | + "Analyse comparative" : compare avec standards du secteur |
| **Sync** | 6 sections BP | 6 sections BP (inchangé) + métadonnées de source |

**Nouveau : KPI Sectoriels IA**

```
┌─────────────────────────────────────────────┐
│  📊 Analyse sectorielle — Restauration rapide │
│                                             │
│  CA moyen/restaurant en France  : 253K€     │
│  Marge nette moyenne secteur     : 8.2%      │
│  Taux de survie à 3 ans         : 62%       │
│  Votre position estimée         : Top 30%   │
│                                             │
│  [En savoir plus via IA]                     │
└─────────────────────────────────────────────┘
```

### 5.2 Juridique — Améliorations

| Aspect | V2 (actuel) | V3 (proposé) |
|--------|-------------|--------------|
| **Recommandation** | Basée sur règles (7 critères) | Règles + IA (contexte projet) |
| **Détail statut** | Avantages/Désavantages génériques | Avantages/Désavantages **personnalisés** au projet |
| **Charges sociales** | Taux fixes par statut | Calcul détaillé : URSSAF, retraite, prévoyance, formation |
| **Timeline** | Aucune | "Feuille de route juridique" : étapes de création (3-6 mois) |

**Nouveau : Recommandation personnalisée IA**

```
┌──────────────────────────────────────────────────┐
│  ⚖️  Recommandation pour votre projet            │
│                                                  │
│  Projet : Restaurant de cuisine fusion           │
│  CA prévu : 120K€ · 2 associés · Croissance     │
│                                                  │
│  ✅ RECOMMANDÉ : SAS                             │
│  • Avantages pour VOTRE cas :                    │
│    - TVA non récupérable OK pour restauration    │
│    - 2 associés possible avec gérance majoritaire │
│    - Régime assimilé-salarié (protection sociale)│
│  • Points de vigilance :                         │
│    - Charges sociales élevées (~65% du brut)     │
│    - Formalités de création plus lourdes         │
│                                                  │
│  [Accepter] [Voir SARL] [Demander IA]            │
└──────────────────────────────────────────────────┘
```

### 5.3 Finance Unifié (fusion Financier + CreaSim)

**Le changement majeur du pipeline V3.**

Actuellement, 2 modules couvrent la finance avec des chevauchements :
- **Financier** : 4 sliders (CA A1, croissance, charges A1, investissement) → projections 3 ans
- **CreaSim** : 7 sliders (CA mensuel, charges fixes, charges variables, prix, coût, investissement, marge cible) → simulation mensuelle

**V3 : 1 module "Finance Unifié" avec 2 onglets**

```
┌──────────────────────────────────────────────────────────┐
│  💰 Finance Unifié                                        │
│                                                           │
│  [Projections 3 ans]  [Simulation mensuelle]  [IA]       │
│  ──────────────────  ──────────────────────  ────        │
│                                                           │
│  === Onglet PROJECTIONS 3 ANS ===                        │
│                                                           │
│  Chiffre d'affaires Année 1     [████████░░] 100 000 €   │
│  Taux de croissance annuel      [████░░░░░░] 15 %        │
│  Charges Année 1               [███████░░░] 70 000 €    │
│  Investissement initial         [███░░░░░░░] 30 000 €    │
│                                                           │
│  ──────────────────────────────────────────────           │
│  Résultats calculés :                                     │
│  CA Année 2 : 115 000 €  |  CA Année 3 : 132 250 €     │
│  Résultat A1 : 30 000 €   |  Marge nette A1 : 30%       │
│  Seuil rentabilité : 14 mois                            │
│  ──────────────────────────────────────────────           │
│                                                           │
│  === Onglet SIMULATION MENSUELLE ===                     │
│  (Pré-rempli depuis les projections 3 ans)                │
│                                                           │
│  CA mensuel                    [████░░░░░░] 8 333 €     │
│  Charges fixes                 [████░░░░░░] 4 500 €     │
│    ├ Loyer                    [███░░░░░░░] 2 000 €      │
│    ├ Assurances                [█░░░░░░░░░] 350 €       │
│    └ Abonnements              [█░░░░░░░░░] 200 €       │
│    [+ Ajouter une charge fixe]                           │
│  Taux charges variables        [███░░░░░░░] 25 %         │
│  Seuil de rentabilité          8 333 €/mois              │
│  Mois pour atteindre le seuil   6 mois                   │
│                                                           │
│  ──────────────────────────────────────────────           │
│  ⚠️ Alerte cohérence :                                   │
│  "Votre simulation mensuelle (8 333€/mois = 100K€/an)     │
│   ne correspond pas à votre projection Année 1 (100 000€).│
│   [Ajuster projections] [Ajuster simulation]"             │
│  ──────────────────────────────────────────────           │
└──────────────────────────────────────────────────────────┘
```

**Points clés de la fusion :**

1. **Pré-remplissage automatique** : L'onglet mensuel se pré-remplit depuis les projections 3 ans (CA mensuel = CA annuel / 12)
2. **Alertes de cohérence** : Si la simulation mensuelle diverge des projections annuelles, une alerte s'affiche
3. **Sync unifié** : Un seul sync vers le BP, pas deux
4. **IA sur les sections financières** : L'IA peut désormais suggérer des ajustements sur les tableaux financiers

**Mapping Financier V2 → Finance Unifié V3 :**

| Donnée V2 Financier | Donnée V2 CreaSim | Emplacement V3 |
|---------------------|-------------------|----------------|
| `year1Revenue` | `monthlyRevenue × 12` | Onglet Projections |
| `growthRate` | — | Onglet Projections |
| `year1Expenses` | `(fixedCharges × 12) + (variableChargesAmount × 12)` | Onglet Projections |
| `initialInvestment` | `initialInvestment` | Onglet Projections (source unique) |
| — | `fixedCharges[]` | Onglet Simulation |
| — | `variableChargesRate` | Onglet Simulation |
| — | `averageSellingPrice` | Onglet Simulation |
| — | `unitCost` | Onglet Simulation |
| — | `targetMarginRate` | Onglet Simulation |

---

## 6. Refonte du Business Plan (Hub Central)

### 6.1 Versioning

Chaque modification du BP crée une **nouvelle version** avec un snapshot complet.

```typescript
// Nouveau modèle Prisma
model BpVersion {
  id          String   @id @default(cuid())
  userId      String
  version     Int      // 1, 2, 3...
  sections    Json     // Snapshot complet des 24 sections
  bpScore     Int
  label       String?  // "Brouillon initial", "Après sync Marché", "Version finale"
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, version])
}
```

**Fonctionnalités :**
- `bpScore` calculé et stocké par version
- Comparaison entre versions (diff)
- Restauration d'une version antérieure
- Label automatique ou manuel

### 6.2 Source tracking par section

Chaque section du BP conserve des **métadonnées de provenance** :

```typescript
// Extension du bpSections JSON
interface BpSectionWithMeta {
  content: unknown                    // Le contenu de la section
  meta: {
    source: 'parcours' | 'marche' | 'juridique' | 'financier' | 'manual' | 'ai'
    syncedAt: string                 // ISO date du dernier sync
    manuallyEditedAt: string | null  // Si modifié manuellement après sync
    wordCount: number               // Pour scoring qualitatif
    version: number                 // Version du BP quand la section a été modifiée
  }
}
```

**Exemple :**

```json
{
  "etude-marche": {
    "content": "Le marché de la restauration rapide en Île-de-France...",
    "meta": {
      "source": "marche",
      "syncedAt": "2025-07-10T14:30:00Z",
      "manuallyEditedAt": "2025-07-11T09:15:00Z",
      "wordCount": 342,
      "version": 3
    }
  }
}
```

### 6.3 IA universelle sur toutes les sections

**V2** : 13 sections avec IA, 11 sans  
**V3** : **24/24 sections avec IA**

Pour les sections financières (tableaux), l'IA propose :
- Des **lignes de tableau suggestionnelles** ("Voici 5 sources de financement typiques pour votre secteur")
- Des **analyses** ("Votre marge nette de 30% est supérieure à la moyenne secteur de 8%")
- Des **corrections** ("Votre trésorerie de janvier est négative (-2 000€), voici comment ajuster")

```typescript
// Nouvelles actions IA pour sections financières
POST /api/business-plan {
  action: 'ai-suggest',
  sectionId: 'financement',
  sectionType: 'financing-table',  // Type de rendu
  existingRows: [...],              // Lignes existantes
  projectContext: { ... }
}

// → Retourne des lignes suggestionnelles à insérer
{
  "suggestedRows": [
    { "source": "Apport personnel", "montant": 20000 },
    { "source": "Prêt d'honneur Initiative France", "montant": 5000 },
    { "source": "Prêt bancaire BPI France", "montant": 25000 }
  ],
  "analysis": "Votre besoin de financement de 50K€ est cohérent avec votre secteur..."
}
```

### 6.4 Garde-fous d'export

**V2** : L'utilisateur peut exporter un BP à tout moment, même vide  
**V3** : L'export est conditionnel

```typescript
interface ExportReadiness {
  canExport: boolean
  score: number           // Score global 0-100
  minScore: number        // Seuil minimum (60 par défaut)
  warnings: string[]     // ["Section ' finances' vide", "CreaSim non synchronisé"]
  blocked: string[]      // ["Score de cohérence trop faible (42/100)"]
}
```

**Seuils :**

| Condition | Seuil | Action |
|-----------|-------|--------|
| Score de complétion | < 40% | ⛔ Export bloqué |
| Score de cohérence | < 50% | ⛔ Export bloqué |
| Sections critiques vides | > 3 | ⚠️ Warning (export possible avec confirmation) |
| Score global | < 60% | ⚠️ Warning |

---

## 7. Refonte de la synchronisation inter-modules

### 7.1 Sync ciblé

```typescript
// V2 — Sync global
POST /api/business-plan { action: 'sync-simulators' }
→ Lecture : MarketAnalysis + FinancialForecast + CreaSimSimulation + JuridiqueAnalysis
→ Écriture : toutes les sections BP impactées

// V3 — Sync ciblé
POST /api/business-plan { action: 'sync-target', source: 'marche' }
→ Lecture : MarketAnalysis UNIQUEMENT
→ Écriture : 6 sections marché uniquement
→ Durée : ~50ms au lieu de ~200ms
```

### 7.2 Matrice de sync V3

| Source | Sections BP mises à jour | Tables lues |
|--------|--------------------------|-------------|
| `parcours` | resume, equipe, historique, vision, valeurs, calendrier | CreatorJourney |
| `marche` | etude-marche, segmentation, concurrence, strategie-marketing, plan-commercial, swot | MarketAnalysis |
| `juridique` | statut-juridique | JuridiqueAnalysis |
| `financier` | financement, compte-resultat, tresorerie, seuil-rentabilite, investissements, bilan | FinancialForecast |
| `bmc` | (lecture seule, pas de sync) | BusinessModelCanvas |

### 7.3 Protection contre l'écrasement

```typescript
function mergeSection(existing: BpSectionWithMeta, incoming: unknown): BpSectionWithMeta {
  // Si la section a été modifiée manuellement → ne pas écraser
  if (existing.meta.manuallyEditedAt && 
      existing.meta.manuallyEditedAt > existing.meta.syncedAt) {
    return existing; // Protégée
  }
  
  // Sinon → mettre à jour
  return {
    content: incoming,
    meta: {
      ...existing.meta,
      source: determineSource(incoming),
      syncedAt: new Date().toISOString(),
      manuallyEditedAt: null,
      version: existing.meta.version + 1
    }
  };
}
```

### 7.4 Feedback bidirectionnel

Quand l'utilisateur modifie une section BP manuellement :

```
┌─────────────────────────────────────────────────────────┐
│  Section "seuil-rentabilite" modifiée manuellement       │
│                                                         │
│  ⚠️ Cette section est normalement synchronisée avec       │
│     le module Finance Unifié.                            │
│                                                         │
│  Données du simulateur (syncées le 10/07) :             │
│  "Le seuil est atteint au bout de 6 mois avec un CA..."  │
│                                                         │
│  Votre version manuelle (modifiée le 12/07) :           │
│  "Avec la stratégie de lancement progressive, nous..."  │
│                                                         │
│  [Conserver ma version] [Restaurer depuis simulateur]    │
│  [Voir le simulateur]                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Nouveau système de progression et de score

### 8.1 Progression qualitative (V3)

Remplacer le scoring binaire par un **scoring pondéré par qualité** :

```typescript
// V2 — Binaire
marche: sector && targetAudience ? true : false  // 0% ou 100%

// V3 — Qualitatif
function scoreModule(module: string): number {
  switch (module) {
    case 'marche': {
      let score = 0;
      score += sector ? 20 : 0;      // 20 pts pour le secteur
      score += targetAudience ? 20 : 0;  // 20 pts pour la cible
      score += swotCompleteness * 30;   // 0-30 pts selon remplissage SWOT
      score += aiSynthesis ? 15 : 0;    // 15 pts pour la synthèse IA
      score += concurrentsCount > 2 ? 15 : 0; // 15 pts pour les concurrents
      return Math.min(score, 100);
    }
    case 'financier': {
      let score = 0;
      score += year1Revenue ? 20 : 0;
      score += hasYear2Year3 ? 20 : 0;
      score += simulationMensuelle ? 25 : 0;
      score += seuilRentabilite ? 15 : 0;
      score += aiAnalysis ? 20 : 0;
      return Math.min(score, 100);
    }
    // ... etc
  }
}
```

### 8.2 Score de cohérence inter-modules (NOUVEAU)

Un nouveau score évalue la **cohérence globale** du pipeline :

```typescript
interface CoherenceScore {
  global: number        // 0-100
  alerts: CoherenceAlert[]

  checks: {
    // Vérifications effectuées
    financialConsistency: boolean  // Financier 3 ans ≈ CreaSim mensuel × 12
    marketSizeVsRevenue: boolean   // Part de marché × taille marché ≈ CA prévu
    juridiqueVsTeam: boolean       // Statut juridique compatible avec nb associés
    bmcVsBp: boolean              // BMC cohérent avec sections BP
    bpCompleteness: boolean        // Pas de section critique vide
  }
}

interface CoherenceAlert {
  severity: 'error' | 'warning' | 'info'
  source1: string    // 'financier'
  source2: string    // 'creasim'
  message: string    // "Le CA mensuel × 12 (100K€) ne correspond pas au CA Année 1 (115K€)"
  suggestion: string // "Ajustez la simulation mensuelle ou les projections annuelles"
}
```

**Exemples de vérifications de cohérence :**

| Check | Condition | Sévérité |
|-------|-----------|----------|
| Financier vs Marché | `CA_A1` ≤ `tailleMarché × partMarché × 2` | warning |
| Juridique vs BP | Statut juridique compatible avec nb associés dans BP | error |
| BMC vs BP | BMC "Sources de Revenus" ≠ vide si BP "financement" rempli | info |
| Finance mensuelle vs annuelle | `CA_mensuel × 12` ∈ `[CA_A1 × 0.9, CA_A1 × 1.1]` | warning |
| CreaSim vs Financier | `charges_fixes_mensuel × 12` ∈ `[charges_A1 × 0.8, charges_A1 × 1.2]` | info |

### 8.3 Dashboard de progression V3

```
┌─────────────────────────────────────────────────────────────┐
│  STRATÉGIE — Progression                                     │
│                                                             │
│  ╭──────────────────────╮  Score global : 67%              │
│  │    ██████████░░░░░░░░ │  ─────────────────                │
│  ╰──────────────────────╯  Parcours: 80% · Stratégie: 58%   │
│                                                             │
│  Module        Progression  Score   État                    │
│  ───────────────────────────────────────────────────         │
│  Marché        ████████░░   78%    ✅ Complété              │
│  Juridique     ██████░░░░   62%    ⚠️ SWOT manquant          │
│  Finance       ████░░░░░░   45%    ⬜ En cours              │
│  BMC           ░░░░░░░░░░   0%     ⬜ Non démarré           │
│  Business Plan █████░░░░░   52%    ⚠️ 12/24 sections       │
│  Pitch Deck    ░░░░░░░░░░   0%     ⬜ Non démarré           │
│  ───────────────────────────────────────────────────         │
│                                                             │
│  COHÉRENCE PIPELINE                                         │
│  ╭──────────────────────╮                                    │
│  │    ████████████░░░░░ │  Score : 72%                      │
│  ╰──────────────────────╯                                    │
│                                                             │
│  ⚠️ Le CA Année 1 (100K€) est supérieur à la part de       │
│     marché estimée (50K€). Vérifiez vos hypothèses.          │
│                                                             │
│  Prochaine action recommandée : Finance Unifié              │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Intégration IA optimisée

### 9.1 IA sur toutes les sections

| Type de section | Mode IA V2 | Mode IA V3 |
|----------------|------------|------------|
| `textarea` | Suggestion texte | Suggestion texte + enrichissement contextuel |
| `swot` | ❌ Pas de suggest | ✅ Suggestion par quadrant + analyse croisée |
| `financing-table` | ❌ Pas de suggest | ✅ Suggestion de lignes + analyse |
| `result-table` | ❌ Pas de suggest | ✅ Vérification des chiffres + alertes |
| `treasury-table` | ❌ Pas de suggest | ✅ Génération plan de trésorerie + alertes négatifs |
| `investments-list` | ❌ Pas de suggest | ✅ Suggestions d'investissements par secteur |
| `bilan-table` | ❌ Pas de suggest | ✅ Vérification équilibre actif/passif |
| `select` | ❌ Pas de suggest | ✅ Confirmation argumentée du choix |
| `timeline` | ❌ Pas de suggest | ✅ Génération de jalons depuis le secteur |
| `products-list` | ❌ Pas de suggest | ✅ Suggestions produits + calcul marges |
| `associates-list` | ❌ Pas de suggest | ✅ Modèles de répartition du capital |
| `cogerants-list` | ❌ Pas de suggest | ✅ Suggestions de profils |

### 9.2 IA contextuelle en lot

Au lieu de 24 appels LLM individuels, proposer un **mode "Génération complète IA"** en un seul appel :

```typescript
POST /api/business-plan {
  action: 'ai-generate-all',
  sectionsToGenerate: ['etude-marche', 'segmentation', 'concurrence', 'swot', 'localisation', 'organisation']
}

// → 1 seul appel LLM avec prompt structuré
// → Retourne les 6 sections en JSON
// → Ne surcharge pas les sections existantes
```

### 9.3 Réduction des tokens

| Stratégie | Économie |
|-----------|---------|
| Prompt avec contexte minimal (titre + secteur seulement) | -30% tokens |
| Réponse en JSON structuré (pas de markdown inutile) | -20% tokens |
| Cache des sections générées (même contexte = même résultat) | -40% appels |
| Température 0.3 pour les sections factuelles (plus déterministe) | Varié |

---

## 10. Workflow guidé intelligent

### 10.1 Étapes avec pré-requis

```typescript
const WORKFLOW_STEPS = [
  {
    id: 'mon-projet',
    label: 'Définir mon projet',
    section: 'parcours',
    prerequisite: null,
    unlocks: ['marche', 'juridique', 'financier']
  },
  {
    id: 'vision',
    label: 'Clarifier ma vision',
    section: 'parcours',
    prerequisite: 'mon-projet',
    unlocks: ['business-plan']
  },
  {
    id: 'marche',
    label: 'Analyser mon marché',
    section: 'strategie',
    prerequisite: 'mon-projet',
    unlocks: ['bmc', 'business-plan']
  },
  {
    id: 'juridique',
    label: 'Choisir mon statut',
    section: 'strategie',
    prerequisite: 'mon-projet',
    unlocks: ['business-plan']
  },
  {
    id: 'financier',
    label: 'Projeter mes finances',
    section: 'strategie',
    prerequisite: 'mon-projet',
    unlocks: ['business-plan']
  },
  {
    id: 'bmc',
    label: 'Synthétiser mon modèle économique',
    section: 'strategie',
    prerequisite: null, // Peut être fait en parallèle
    requires: { bmcMinSource: 3 }, // Mais recommande au moins 3 sources sync
    unlocks: ['pitch-deck']
  },
  {
    id: 'business-plan',
    label: 'Rédiger mon Business Plan',
    section: 'strategie',
    prerequisite: null, // Peut être fait en parallèle
    recommends: { minScore: 40 }, // Recommande un score min de 40
    unlocks: ['pitch-deck']
  },
  {
    id: 'pitch-deck',
    label: 'Préparer mon Pitch Deck',
    section: 'strategie',
    prerequisite: 'business-plan',
    recommends: { bpMinScore: 60 }, // Recommande BP à 60+
    unlocks: ['export']
  }
];
```

### 10.2 Smart Suggestions

Le système propose en permanence la **prochaine action optimale** :

```
┌──────────────────────────────────────────────────────┐
│  💡 Suggestion                                         │
│                                                       │
│  Vous avez rempli Mon Projet et Vision.              │
│  3 simulateurs sont disponibles et prêts à être       │
│  synchronisés avec votre Business Plan.                │
│                                                       │
│  ⭐ Recommandation : Commencez par Marché              │
│  Les données de marché alimenteront 6 sections du BP.  │
│                                                       │
│  [Aller à Marché] [Voir Juridique] [Voir Finance]     │
└──────────────────────────────────────────────────────┘
```

### 10.3 Ordre flexible vs. recommandé

Le V3 propose **2 modes** :

| Mode | Description |
|------|-------------|
| **Libre** | L'utilisateur navigue librement entre les modules (comme V2) |
| **Guidé** | L'utilisateur suit les étapes recommandées une par une, avec des suggestions de prochaine action |

Le mode guidé est **recommandé pour les débutants**, le mode libre pour les utilisateurs expérimentés.

---

## 11. Exports et livrables enrichis

### 11.1 Page de pré-export

Avant chaque export, une page récapitulative affiche :

```
┌─────────────────────────────────────────────────────────────┐
│  📄 Export Business Plan                                   │
│                                                             │
│  Qualité du document                                       │
│  ╭───────────────────────────╮                             │
│  │ Complétion : ████████░░ 72% │                            │
│  │ Cohérence  : █████████░ 85% │                            │
│  │ Qualité IA : ██████░░░░ 58% │                            │
│  ╰───────────────────────────╯                             │
│                                                             │
│  ⚠️ 5 sections sont vides :                                │
│  • seuil-rentabilite                                      │
│  • localisation                                           │
│  • organisation                                          │
│  • associes                                              │
│  • calendrier                                            │
│                                                             │
│  ⚠️ Le simulateur Finance n'est pas synchronisé.           │
│  [Synchroniser maintenant]                                 │
│                                                             │
│  [Exporter le BP quand même]  [Annuler]  [Synchroniser]   │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Nouveaux formats d'export

| Format | Description | Statut |
|--------|-------------|--------|
| **PDF** | Document complet avec mise en page | ✅ Existait |
| **DOCX** | Document Word éditable | 🆕 Nouveau |
| **HTML** | Page web consultable | 🆕 Nouveau |
| **Markdown** | Format texte brut | 🆕 Nouveau |
| **PPTX** | Pitch Deck | ✅ Existait |
| **BMC PDF** | Canvas A4 paysage | ✅ Existait |
| **Données JSON** | Toutes les données brutes | ✅ Existait |
| **BP + BMC combiné** | PDF avec BMC en page 2 | 🆕 Nouveau |

---

## 12. Impact sur le modèle de données

### Tables modifiées

```prisma
// NOUVEAU — Versioning du BP
model BpVersion {
  id        String   @id @default(cuid())
  userId    String
  version   Int
  sections  Json
  bpScore   Int
  label     String?
  createdAt DateTime @default(now())
  user      User     @relation("BpVersions", fields: [userId], references: [id], onDelete: Cascade)
}

// MODIFIÉ — CreatorJourney
model CreatorJourney {
  // ... existant ...
  bpSections        Json?           // RENOMMÉ en bpSectionsV2 (rétrocompat)
  bpSectionsV3     Json?           // NOUVEAU : format BpSectionWithMeta
  coherenceScore   Int?            // NOUVEAU : score 0-100
  lastSyncAt       DateTime?       // NOUVEAU : date du dernier sync
}

// MODIFIÉ — FinancialForecast (fusion Financier + CreaSim)
model FinancialForecast {
  // ... existant (projections 3 ans) ...
  
  // AJOUTÉ — Données mensuelles (ex-CreaSim)
  monthlyRevenue       Float?
  fixedCharges         Json?    // [{name, amount}]
  variableChargesRate  Float?
  averageSellingPrice  Float?
  unitCost             Float?
  targetMarginRate     Float?
  
  // AJOUTÉ — Méta
  simulationMode       String?  // 'annual' | 'monthly' | 'both'
}
```

### Tables supprimées (à terme)

```prisma
// SUPPRIMÉ — Fusionné dans FinancialForecast
model CreaSimSimulation { ... }  // → migré vers FinancialForecast

// SUPPRIMÉ — Remplacé par BpVersion
// (pas de table existante pour le versioning actuellement)
```

### Tables nouvelles

```prisma
model BpVersion {
  id        String   @id @default(cuid())
  userId    String
  version   Int
  sections  Json
  bpScore   Int
  label     String?
  createdAt DateTime @default(now())
}

model CoherenceCheck {
  id           String   @id @default(cuid())
  userId       String
  checkType    String   // 'financial-consistency', 'market-revenue', 'juridique-team', ...
  passed       Boolean
  score        Float?
  details      Json?
  createdAt    DateTime @default(now())
}
```

---

## 13. Plan de migration V2 → V3

### Phase 1 : Fondations (Semaine 1-2)

| Tâche | Effort | Impact |
|-------|--------|--------|
| Créer `BpVersion` dans Prisma | 2h | Versioning |
| Ajouter `bpSectionsV3` (format BpSectionWithMeta) | 3h | Source tracking |
| Implémenter `sync-target` (sync ciblé) | 4h | Performance |
| Ajouter `CoherenceCheck` dans Prisma | 2h | Score cohérence |

### Phase 2 : Fusion Finance (Semaine 3-4)

| Tâche | Effort | Impact |
|-------|--------|--------|
| Migrer `CreaSimSimulation` → `FinancialForecast` | 6h | Unification |
| Refaire l'UI Finance Unifié (2 onglets) | 8h | UX améliorée |
| Ajouter les alertes de cohérence finance | 3h | Qualité |
| Implémenter IA sur sections financières | 6h | IA universelle |

### Phase 3 : Qualité & Workflow (Semaine 5-6)

| Tâche | Effort | Impact |
|-------|--------|--------|
| Implémenter le workflow guidé | 6h | Guidage utilisateur |
| Scoring qualitatif (remplacer binaire) | 4h | Progression réaliste |
| Engine de cohérence inter-modules | 8h | Garde-fous |
| Page de pré-export avec checks | 3h | Qualité livrables |

### Phase 4 : Feedback & Finitions (Semaine 7-8)

| Tâche | Effort | Impact |
|-------|--------|--------|
| Feedback bidirectionnel BP → Simulateurs | 6h | Consistance |
| IA en lot (generate-all) | 4h | Performance IA |
| Nouveaux formats d'export (DOCX, HTML, MD) | 4h | Livrables |
| Tests E2E + migration données existantes | 6h | Stabilité |

### Estimation totale

| Phase | Durée |
|-------|-------|
| Phase 1 | 2 semaines |
| Phase 2 | 2 semaines |
| Phase 3 | 2 semaines |
| Phase 4 | 2 semaines |
| **Total** | **8 semaines** |

---

## Résumé des améliorations

| # | Amélioration | Faille résolue | Impact |
|---|-------------|---------------|--------|
| 1 | Fusion Financier + CreaSim | F1 Redondance | -1 module, -double saisie |
| 2 | Sync ciblé | F2 N+1 reads | -75% lectures DB |
| 3 | Feedback bidirectionnel | F3 Flux unidirectionnel | 0 conflits silencieux |
| 4 | Versioning du BP | F4 BP monolithique | Undo/redo, historique |
| 5 | Modules parallèles | F5 Pipeline linéaire | Flexibilité, rapidité |
| 6 | Workflow guidé | F6 Pas de guidage | -40% abandons estimé |
| 7 | Progression qualitative | F7 Progression binaire | Score représentatif |
| 8 | Score de cohérence | F8 Pas de scoring | BP cohérents |
| 9 | IA sur 24/24 sections | F9 Sections sans IA | -50% taux abandon finances |
| 10 | Feedback BMC/Pitch | F10 BMC/Pitch isolés | Itérations rapides |
| 11 | Versioning | F11 Pas d'historique | 0 perte de données |
| 12 | Garde-fous export | F12 Pipeline passif | Qualité livrables |

---

> **Fin du document** — CreaPulse V3 Pipeline Stratégie Optimisé  
> Proposition d'évolution de l'architecture, soumise à validation.
