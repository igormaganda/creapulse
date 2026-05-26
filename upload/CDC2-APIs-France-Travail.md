# Cahier des Charges #2 — Intégration Complète des APIs France Travail

> **Projet** : CreaPulse V2 — Echo Entreprendre (BGE Bretagne)  
> **Version** : 2.0  
> **Date** : Juillet 2025  
> **Statut** : Spécification fonctionnelle, technique et d'intégration

---

## 1. Contexte & Objectifs

### 1.1 Contexte

France Travail (ex-Pôle Emploi) expose un ensemble d'**APIs REST** permettant aux partenaires (BGE, CCI, Régions) d'accéder en temps réel aux données du marché du travail. CreaPulse V2, en tant que plateforme d'accompagnement à la création d'entreprise, doit intégrer nativement ces APIs pour :

- **Enrichir les parcours** des porteurs de projet avec des données réelles du marché
- **Alimenter les modules IA** (Business Plan, CréaBot, ConseillerIA) avec des données contextuelles
- **Faciliter la recherche** d'aides financières, formations, événements, mentors
- **Automatiser les recommandations** personnalisées via croisement de données

### 1.2 Objectifs stratégiques

1. **Interopérabilité complète** avec l'écosystème France Travail
2. **Contextualisation IA** : toutes les requêtes IA sont enrichies avec des données FT temps réel
3. **Recommandations intelligentes** : aides adaptées au profil, formations ciblées, événements pertinents
4. **Reporting DGEFP** : export de données conformes aux exigences ITI4
5. **Passeport Entrepreneurial** : synchronisation avec les outils France Travail

---

## 2. État Actuel (Audit)

### 2.1 APIs déjà intégrées (9 endpoints)

| # | API France Travail | Route proxy | Composant frontend | Statut |
|---|-------------------|-------------|--------------------|----:|
| 1 | **Événements MEE** | `/api/evenements` | `evenements-tab.tsx` | ✅ Opérationnel |
| 2 | **Offres d'emploi v2** | `/api/france-travail/offres` | `offres-emploi-tab.tsx` | ✅ Opérationnel |
| 3 | **Métiers v1** | `/api/france-travail/metiers` | `metiers-tab.tsx` | ✅ Opérationnel |
| 4 | **Entreprises (InfoNet)** | `/api/france-travail/entreprises` | `entreprises-tab.tsx` | ✅ Opérationnel |
| 5 | **Aides financières** | `/api/france-travail/aides` | `aides-tab.tsx` | ✅ Opérationnel |
| 6 | **Statistiques régionales** | `/api/france-travail/statistiques` | `statistiques-tab.tsx` | ✅ Opérationnel |
| 7 | **Référentiel agences** | `/api/france-travail/agences` | `agences-tab.tsx` | ✅ Opérationnel |
| 8 | **Communautés bénévoles** | `/api/france-travail/communautes` | `benevoles-tab.tsx` | ✅ Opérationnel |
| 9 | **Formations v1** | `/api/france-travail/formations` | `formations-tab.tsx` | ✅ Opérationnel |

### 2.2 Infrastructure existante

| Fichier | Contenu |
|---------|---------|
| `src/lib/france-travail.ts` | OAuth2 token management (cache par scope) + constantes |
| `FT_SCOPES` | 9 scopes OAuth2 configurés |
| `FT_API` | 9 URLs de base configurées |
| `getFTToken(scope)` | Fonction centralisée avec cache 60s safety margin |
| `ftHeaders(token)` | Headers standardisés |

### 2.3 Credentials

- **FT_CLIENT_ID** : `PAR_echoentreprendre_...` (configuré dans `.env`)
- **FT_SECRET** : Configuré dans `.env`
- **Auth** : OAuth2 `client_credentials` flow

### 2.4 APIs France Travail disponibles (non encore intégrées)

| # | API | Description | Priorité |
|---|-----|-------------|----------|
| 10 | **Communes** | Référentiel géographique (open data) | P2 |
| 11 | **Rome** | Répertoire Opérationnel des Métiers et Emplois | P1 |
| 12 | **LBB (La Bonne Boîte)** | Entreprises recruteuses par zone | P1 |
| 13 | **PE Connect** | Connecteur utilisateur France Travail | P3 |
| 14 | **Horaires Collectifs** | Offres avec horaires spécifiques | P3 |

---

## 3. Intégrations Actuelles — Détail par Module

### 3.1 Module « Offres d'Emploi »

**Route** : `POST /api/france-travail/offres`  
**Composant** : `offres-emploi-tab.tsx`

**Filtres disponibles** :
- `motsCles` (recherche textuelle)
- `codePostal`, `commune`, `departement`, `region` (géolocalisation)
- `typeContrat` (CDI, CDD, Intérim, etc.)
- `experienceExige` (D, E, F, S)
- `tempsPlein` (1 = temps plein uniquement)
- `range` (pagination, ex: "0-24")
- `sort` (tri)

**Intégration avec d'autres modules** :

| Module cible | Intégration | Description |
|--------------|-----------|-------------|
| **Business Plan** | Section « Marché » | Nombre d'offres par secteur = indicateur de dynamique |
| **Go/No-Go** | Score viabilité | Offres dans le secteur du projet = signal positif |
| **IA CréaBot** | Contexte prompt | Injections des offres pertinentes dans le contexte utilisateur |
| **Tremplin** | Bilan viabilité | Croisement offres/métiers avec le projet |
| **Financing** | Pas d'intégration directe | — |

### 3.2 Module « Aides Financières »

**Route** : `GET /api/france-travail/aides`  
**Composant** : `aides-tab.tsx` + `financing-panel.tsx`

**Filtres disponibles** :
- `motsCles`, `codePostal`, `departement`, `region`, `typeAide`

**Intégrations avec d'autres modules** :

| Module cible | Intégration | Description |
|--------------|-----------|-------------|
| **Financing Panel** | Sources de financement | Aides FT injectées dans le plan de financement |
| **Business Plan** | Section « Finances » | Aides calculées dans les prévisions |
| **CréaSim** | Scénarios financiers | Aides incluses dans les hypothèses |
| **IA CréaBot** | Contexte prompt | Aides disponibles enrichissent les recommandations |
| **IA ConseillerIA** | Contexte bénéficiaire | Profil d'aides accessibles au porteur |

**⚠️ Intégration manquante à implémenter** :
- [ ] **Auto-détection** : selon le profil utilisateur (RSA, RQTH, jeune <26, zone QPV), filtrer automatiquement les aides éligibles
- [ ] **Montant estimé** : calcul automatique des montants (ARCE, ACCRE, ARE) selon la situation
- [ ] **Workflow** : bouton « Demander cette aide » → redirection vers le portail FT

### 3.3 Module « Formations »

**Route** : `GET /api/france-travail/formations`  
**Composant** : `formations-tab.tsx`

**Intégrations avec d'autres modules** :

| Module cible | Intégration | Description |
|--------------|-----------|-------------|
| **Competence Bridge** | Skill Gap analysis | Formations recommandées pour combler les lacunes |
| **Business Plan** | Section « Équipe » | Plan de formation intégré au BP |
| **Certifications** | RS 5508, RS 6216 | Formations certifiantes = progression certifications |
| **IA ConseillerIA** | Recommandations | Formations ciblées selon le profil + projet |
| **Parcours Créateur** | Feuille de route | Formations planifiées dans les jalons M+1 à M+6 |

**⚠️ Intégrations manquantes** :
- [ ] **Matching compétences** : croisement RIASEC + CV analysé → formations recommandées
- [ ] **Planification temporelle** : intégration dans la roadmap à 6 mois
- [ ] **Suivi completion** : tracker les formations suivies par le porteur

### 3.4 Module « Événements MEE »

**Route** : `POST /api/evenements`  
**Composant** : `evenements-tab.tsx` + `/actualites/evenements/page.tsx`

**Filtres disponibles** :
- `objectifs` (33=Emploi, 34=Création)
- `codePostal`, `departement`
- `dateDebut`, `dateFin`
- `typeEvenement`, `motsCles`
- Pagination

**Intégrations** :

| Module cible | Intégration | Description |
|--------------|-----------|-------------|
| **Passeport** | Activités | Événements suivis = progression |
| **Parcours Créateur** | Jalons | Événements intégrés au planning |
| **Newsletter** | Veille | Alertes événements pertinents par email |

### 3.5 Module « Métiers »

**Route** : `GET /api/france-travail/metiers`  
**Composant** : `metiers-tab.tsx`

**Intégrations** :

| Module cible | Intégration | Description |
|--------------|-----------|-------------|
| **RIASEC** | Matching métiers | Codes ROME associés aux profils RIASEC |
| **Mon Projet** | Secteur d'activité | Métiers liés au projet du porteur |
| **BP Editor** | Section « Marché » | Données métiers dans l'analyse de marché |
| **IA ConseillerIA** | Contexte | Métiers recommandés selon profil |

**⚠️ Intégrations manquantes** :
- [ ] **Codes ROME** : mapping RIASEC → codes ROME → appel API métiers
- [ ] **Fiches détaillées** : afficher compétences requises, conditions d'accès, salaires

### 3.6 Module « Entreprises (InfoNet) »

**Route** : `GET /api/france-travail/entreprises`  
**Composant** : `entreprises-tab.tsx`

**Intégrations** :

| Module cible | Intégration | Description |
|--------------|-----------|-------------|
| **Business Plan** | Section « Concurrence » | Données entreprises concurrentes |
| **BP Audit** | Analyse marché | Vérification données SIRET, effectifs, CA |
| **Tremplin** | Viabilité | Croisement entreprises locales et projet |

### 3.7 Module « Statistiques Régionales »

**Route** : `GET /api/france-travail/statistiques`  
**Composant** : `statistiques-tab.tsx`

**Intégrations** :

| Module cible | Intégration | Description |
|--------------|-----------|-------------|
| **BP Editor** | Section « Marché » | Taux de chômage, création d'entreprises par région |
| **Admin Dashboard** | KPIs | Statistiques globales de la zone d'implémentation |
| **Reporting DGEFP** | Données macro | Chiffres-clés pour rapports trimestriels |

### 3.8 Module « Agences France Travail »

**Route** : `GET /api/france-travail/agences`  
**Composant** : `agences-tab.tsx`

**Intégrations** :

| Module cible | Intégration | Description |
|--------------|-----------|-------------|
| **Passeport** | Contacts | Agence FT du porteur affichée sur le passeport |
| **Parcours Créateur** | Jalons | RDV agence planifiés dans la roadmap |
| **Admin Dashboard** | Réseau | Cartographie des agences partenaires |

### 3.9 Module « Communautés Bénévoles »

**Route** : `GET /api/france-travail/communautes`  
**Composant** : `benevoles-tab.tsx`

**Intégrations** :

| Module cible | Intégration | Description |
|--------------|-----------|-------------|
| **Mentorat** | Mentors | Bénévoles comme mentors potentiels |
| **Réseau** | Networking | Communautés locales dans l'annuaire |
| **Parcours Créateur** | Étape 4 | Réseau intégré au parcours |

---

## 4. APIs à Ajouter

### 4.1 ROME — Répertoire Opérationnel des Métiers et Emplois (P1)

**Description** : Base de référence des métiers, compétences, formations associées  
**Scope** : `api_rome`  
**URL** : `https://api.francetravail.io/partenaire/rome/v1/metiers`

**Intérêt pour CreaPulse** :
- Mapping **RIASEC → ROME** pour recommandations de métiers personnalisées
- **Compétences requises** par métier → input pour Competence Bridge
- **Conditions d'accès** → parcours de formation recommandé

**Route à créer** : `GET /api/france-travail/rome`

**Intégrations** :
- `riasec/route.ts` : après le test RIASEC, proposer les métiers ROME correspondants
- `competence-bridge.tsx` : afficher les compétences du métier cible
- `business-plan/route.ts` : enrichir la section « Équipe & Compétences » du BP

### 4.2 La Bonne Boîte (LBB) — Entreprises Recruteuses (P1)

**Description** : Entreprises qui recrutent, filtrées par zone géographique  
**Scope** : `api_lbbcompanies`  
**URL** : `https://api.francetravail.io/partenaire/lbbcompanies/v1/entreprises`

**Intérêt pour CreaPulse** :
- **Clients potentiels** pour le porteur (B2B)
- **Concurrence locale** pour l'analyse de marché
- **Partenariats** possibles

**Route à créer** : `GET /api/france-travail/lbb`

**Intégrations** :
- `bp-editor.tsx` : section « Concurrence / Clients potentiels »
- `offres-emploi-tab.tsx` : enrichir avec les entreprises recruteuses
- `tremplin.tsx` : données de marché local

### 4.3 Communes — Référentiel Géographique (P2)

**Description** : Données géographiques open data (code postal → coordonnées, région)  
**Méthode** : Open data (pas d'authentification nécessaire)

**Intérêt pour CreaPulse** :
- **Autocomplétion géographique** dans tous les formulaires
- **Géolocalisation** des offres, formations, événements
- **Filtres croisés** région/département

**Route à créer** : `GET /api/geo/communes`

---

## 5. Intégrations IA — Enrichissement des Prompts

### 5.1 Architecture d'enrichissement

```
┌──────────────────┐
│   Porteur de     │
│   Projet         │
│  (données DB)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│         FT Data Enrichment Layer         │
│                                          │
│  1. Recherche offres par secteur projet  │
│  2. Aides financières éligibles          │
│  3. Formations recommandées              │
│  4. Statistiques marché (région)          │
│  5. Événements à venir                   │
│  6. Métiers liés (ROME)                  │
└────────┬─────────────────────────────────┘
         │ (JSON context)
         ▼
┌──────────────────────────────────────────┐
│              IA Prompt Builder            │
│                                          │
│  System Prompt + User Context +          │
│  FT Enrichment → Appel LLM               │
└──────────────────────────────────────────┘
```

### 5.2 Prompts impactés

| Route IA | Données FT injectées | Scopes FT requis |
|----------|---------------------|-----------------|
| `/api/chat/porteur` | Aides éligibles, offres secteur, formations, stats marché | OFFRES, AIDES, FORMATIONS, STATISTIQUES |
| `/api/chat/conseiller` | Profil complet bénéficiaire + aides + formations + stats | AIDES, FORMATIONS, STATISTIQUES, AGENCES |
| `/api/business-plan` | Offres secteur, stats région, aides financières | OFFRES, STATISTIQUES, AIDES |
| `/api/zero-draft` | Aides financières, formations, stats marché | AIDES, FORMATIONS, STATISTIQUES |
| `/api/tremplin` | Aides éligibles, stats création par région | AIDES, STATISTIQUES |
| `/api/strategy` | Tendances marché, stats concurrentielles | STATISTIQUES, METIERS |
| `/api/roadmap` | Formations disponibles, événements, agences FT | FORMATIONS, EVENEMENTS, AGENCES |
| `/api/marketing-ia` | Offres secteur (ciblage), stats région | OFFRES, STATISTIQUES |

### 5.3 Exemple de contexte enrichi

```typescript
// Dans /api/chat/porteur/route.ts
const ftContext = await buildFTContext({
  secteur: session.answers.monProjet?.secteur,
  region: session.answers.monProjet?.region,
  codesRome: riasecResults.map(r => r.codeRome),
})

// ftContext contient :
// {
//   offres: "15 offres CDI dans le secteur restauration en Bretagne",
//   aides: "ACCRE (exonération charges 1an), ARCE (45% du reliquat ARE = 8100€)",
//   formations: "3 formations gestion restaurant à Rennes (CFA, Gretha, Afpa)",
//   stats: "Taux création restauration Bretagne: +12%/an, taux pérennité 3ans: 68%",
//   metiers: "Restaurateur (ROME H3102), Traiteur (H3104), Gérant café (H3106)"
// }
```

---

## 6. Intégrations par Module CreaPulse

### 6.1 Matrice d'Intégration Complète

| Module CreaPulse | Offres | Aides | Formations | Événements | Métiers | Entreprises | Stats | Agences | Communautés | ROME | LBB |
|-----------------|:------:|:-----:|:----------:|:----------:|:-------:|:-----------:|:-----:|:-------:|:-----------:|:----:|:---:|
| **Offres Emploi** | ✅ | — | — | — | — | — | — | — | — | — | — |
| **Aides Tab** | — | ✅ | — | — | — | — | — | — | — | — | — |
| **Formations** | — | — | ✅ | — | — | — | — | — | — | — | — |
| **Événements** | — | — | — | ✅ | — | — | — | — | — | — | — |
| **Métiers** | — | — | — | — | ✅ | — | — | — | — | ➕ | — |
| **Entreprises** | — | — | — | — | — | ✅ | — | — | — | — | ➕ |
| **Statistiques** | — | — | — | — | — | — | ✅ | — | — | — | — |
| **Agences** | — | — | — | — | — | — | — | ✅ | — | — | — |
| **Bénévoles** | — | — | — | — | — | — | — | — | ✅ | — | — |
| **BP Editor** | ➕ | ➕ | ➕ | — | ➕ | ➕ | ➕ | — | — | ➕ | — |
| **Tremplin** | ➕ | ➕ | — | — | — | — | ➕ | — | — | — | — |
| **Financing** | — | ✅ | — | — | — | — | — | — | — | — | — |
| **Go/No-Go** | ➕ | — | — | — | — | — | ➕ | — | — | — | — |
| **CréaSim** | — | ➕ | — | — | — | — | — | — | — | — | — |
| **Gestion Quotidienne** | — | — | — | — | — | — | — | — | — | — | — |
| **Certifications** | — | — | ➕ | — | — | — | — | — | — | ➕ | — |
| **Competence Bridge** | — | — | ➕ | — | — | — | — | — | — | ➕ | — |
| **Passeport** | — | — | — | ➕ | — | — | — | ➕ | — | — | — |
| **Parcours Créateur** | — | — | ➕ | ➕ | — | — | — | ➕ | — | — | — |
| **RIASEC** | — | — | — | — | ➕ | — | — | — | — | ➕ | — |
| **IA CréaBot** | ➕ | ➕ | ➕ | — | ➕ | — | ➕ | — | — | — | — |
| **IA ConseillerIA** | — | ➕ | ➕ | — | — | — | ➕ | ➕ | — | — | — |
| **Zero Draft BP** | — | ➕ | ➕ | — | — | — | ➕ | — | — | — | — |
| **Strategy** | — | — | — | — | — | — | ➕ | — | — | — | — |
| **Roadmap** | — | — | ➕ | ➕ | — | — | — | ➕ | — | — | — |
| **Marketing IA** | ➕ | — | — | — | — | — | ➕ | — | — | — | — |
| **Admin Dashboard** | ➕ | ➕ | ➕ | ➕ | ➕ | ➕ | ➕ | ➕ | ➕ | — | — |

**Légende** : ✅ Déjà intégré | ➕ À implémenter | — Non applicable

---

## 7. Spécifications Techniques

### 7.1 Architecture des routes proxy

```
Client (Browser)
    │
    ▼
/api/france-travail/{endpoint}
    │
    ▼ (Next.js API Route)
┌─────────────────────────┐
│  1. Authentification     │
│  2. Rate limiting        │
│  3. Validation params   │
│  4. getFTToken(scope)   │
│  5. fetch FT API         │
│  6. Transform response   │
│  7. Cache (optionnel)   │
│  8. Return JSON          │
└─────────────────────────┘
```

### 7.2 Nouvelles constantes à ajouter

```typescript
// Dans src/lib/france-travail.ts
export const FT_SCOPES = {
  // ... existants ...
  ROME:      'api_rome',           // NOUVEAU
  LBB:       'api_lbbcompanies',   // NOUVEAU
} as const;

export const FT_API = {
  // ... existants ...
  ROME:      'https://api.francetravail.io/partenaire/rome/v1/metiers',           // NOUVEAU
  LBB:       'https://api.francetravail.io/partenaire/lbbcompanies/v1/entreprises', // NOUVEAU
} as const;
```

### 7.3 Routes à créer

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/france-travail/rome` | GET | Recherche métiers ROME par code ou mots-clés |
| `/api/france-travail/rome/{code}` | GET | Détail d'un métier (compétences, formations) |
| `/api/france-travail/lbb` | GET | Entreprises recruteuses par zone |
| `/api/geo/communes` | GET | Autocomplétion géographique (open data) |

### 7.4 Fonction utilitaire d'enrichissement

```typescript
// src/lib/ft-enrichment.ts

export async function buildFTContext(params: {
  secteur?: string
  region?: string
  departement?: string
  codePostal?: string
  codesRome?: string[]
  userId?: string
}): Promise<FTEnrichmentContext> {
  const results = await Promise.allSettled([
    params.secteur 
      ? fetchFTOffres({ motsCles: params.secteur, region: params.region })
      : Promise.resolve(null),
    fetchFTAides({ departement: params.departement }),
    fetchFTFormations({ region: params.region }),
    fetchFTStats({ region: params.region }),
  ])

  return {
    offres: formatOffres(results[0]),
    aides: formatAides(results[1]),
    formations: formatFormations(results[2]),
    statistiques: formatStats(results[3]),
  }
}
```

---

## 8. Reporting DGEFP (Intégration ITI4)

### 8.1 Données à exporter

Les données France Travail intégrées à CreaPulse doivent alimenter le reporting trimestriel DGEFP :

| Champ DGEFP | Source FT | Route CreaPulse |
|-------------|-----------|-----------------|
| Actions effectuées | — | `/api/admin/reporting/iti4-export` |
| Secteur d'activité | Métiers ROME | `/api/france-travail/metiers` |
| Statut de sortie | — | `/api/parcours-creteur/bilan` |
| Créations d'emplois | Entreprises | `/api/france-travail/entreprises` |
| Formations suivies | Formations | `/api/france-travail/formations` |

### 8.2 Route d'export

```typescript
// GET /api/admin/reporting/iti4-export
// Génère un fichier CSV/XLSX conforme aux colonnes de l'annexe DGEFP
```

---

## 9. Plan d'Intégration

### Phase 1 — Enrichissement IA (5 jours)

| Tâche | Description | Fichiers |
|-------|-------------|---------|
| 1.1 | Créer `ft-enrichment.ts` | `src/lib/ft-enrichment.ts` |
| 1.2 | Enrichir CréaBot context | `/api/chat/porteur/route.ts` |
| 1.3 | Enrichir ConseillerIA context | `/api/chat/conseiller/route.ts` |
| 1.4 | Enrichir BP generation | `/api/business-plan/route.ts` |
| 1.5 | Enrichir Tremplin | `/api/tremplin/route.ts` |

### Phase 2 — Nouvelles APIs (3 jours)

| Tâche | Description | Fichiers |
|-------|-------------|---------|
| 2.1 | Route ROME | `/api/france-travail/rome/route.ts` |
| 2.2 | Route LBB | `/api/france-travail/lbb/route.ts` |
| 2.3 | Route Communes (open data) | `/api/geo/communes/route.ts` |
| 2.4 | Update constantes | `src/lib/france-travail.ts` |

### Phase 3 — Intégrations Frontend (4 jours)

| Tâche | Description | Fichiers |
|-------|-------------|---------|
| 3.1 | BP Editor — onglet « Marché » enrichi | `bp-editor.tsx` |
| 3.2 | Competence Bridge — formations ROME | `competence-bridge.tsx` |
| 3.3 | RIASEC — métiers recommandés | Dashboard RIASEC |
| 3.4 | Financing — aides auto-détectées | `financing-panel.tsx` |
| 3.5 | Certifications — formations certifiantes | `certifications.tsx` |

### Phase 4 — Reporting & Cross-modules (3 jours)

| Tâche | Description | Fichiers |
|-------|-------------|---------|
| 4.1 | Export DGEFP | `/api/admin/reporting/iti4-export` |
| 4.2 | Admin dashboard — stats FT | `admin-dashboard.tsx` |
| 4.3 | Passeport — données FT | `passeport.tsx` |
| 4.4 | Parcours Créateur — jalons FT | `personalized-path.tsx` |

### Phase 5 — Tests & Documentation (2 jours)

| Tâche | Description |
|-------|-------------|
| 5.1 | Tests manuels de toutes les routes FT |
| 5.2 | Vérification enrichissement IA |
| 5.3 | Documentation technique |

---

## 10. Critères d'Acceptation

- [ ] Toutes les 9 APIs existantes opérationnelles (déjà fait)
- [ ] 3 nouvelles APIs intégrées (ROME, LBB, Communes)
- [ ] Fonction `buildFTContext()` opérationnelle et réutilisable
- [ ] 6 prompts IA enrichis avec données FT temps réel
- [ ] BP Editor enrichi avec données marché FT
- [ ] Competence Bridge enrichi avec formations ROME
- [ ] RIASEC → métiers ROME fonctionnel
- [ ] Aides auto-détectées selon profil utilisateur
- [ ] Export DGEFP opérationnel
- [ ] Admin Dashboard avec KPIs FT
- [ ] 0 nouvelle erreur lint
- [ ] Temps de réponse API < 2s (cache inclus)

---

## 11. Risques & Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|:-----------:|:------:|------------|
| Rate limiting FT API | Moyen | Élevé | Cache local + batch requests |
| Indisponibilité FT | Faible | Élevé | Graceful degradation + données en cache |
| Credentials expirés | Faible | Moyen | Monitoring + alerte + renouvellement auto |
| Incohérence données FT | Moyen | Moyen | Validation + logging + fallback |
| Changement d'API FT | Faible | Moyen | Abstraction layer + versioning |

---

## 12. Suivi des Tokens

Le système de gestion des tokens doit être monitoré :

| Métrique | Seuil | Action |
|----------|-------|--------|
| Taux d'échec token | > 5% | Alert + rotation credentials |
| Temps de réponse token | > 2s | Cache étendu |
| Utilisation quota | > 80% | Alert admin |
| Hits cache | < 50% | Augmenter durée cache |
