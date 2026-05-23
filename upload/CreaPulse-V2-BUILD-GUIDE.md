# CreaPulse V2 — Guide de Reconstruction Intégral (From Scratch)

> **Version** : 2.0 — Reconception totale  
> **Date** : Janvier 2025  
> **Cible** : 100 000+ créateurs d'entreprise / an  
> **Client** : BGE Bretagne  
> **Stack** : Next.js 16 + React 19 + TypeScript 5 + Prisma 6 + PostgreSQL + Tailwind CSS 4 + shadcn/ui  

---

## Table des matières

1. [Vision & Objectifs](#1-vision--objectifs)
2. [Leçons apprises — Analyse rétrospective du V1](#2-lecons-apprises--analyse-retrospective-du-v1)
3. [Architecture cible — Bureau Virtuel](#3-architecture-cible--bureau-virtuel)
4. [Design system & Home Page](#4-design-system--home-page)
5. [Schéma de données — Prisma (V2)](#5-schema-de-donnees--prisma-v2)
6. [Système de modules (V2)](#6-systeme-de-modules-v2)
7. [API Routes — Architecture propre](#7-api-routes--architecture-propre)
8. [Authentification & Sécurité (V2)](#8-authentification--securite-v2)
9. [UI/UX — Navigation & Flux](#9-uiux--navigation--flux)
10. [Scaling — 100k+ utilisateurs](#10-scaling--100k-utilisateurs)
11. [Équipe d'agents — Composition idéale](#11-equipe-dagents--composition-ideale)
12. [Phases de développement](#12-phases-de-developpement)
13. [Checklist qualité & Gates](#13-checklist-qualite--gates)
14. [Risques & Mitigation](#14-risques--mitigation)

---

## 1. Vision & Objectifs

### 1.1 Mission

CreaPulse est le **bureau virtuel de l'entrepreneur** — une plateforme SaaS multi-tenant qui accompagne le créateur d'entreprise de l'idée à l'immatriculation, puis dans les 3 premières années de gestion.

### 1.2 Objectifs quantitatifs

| Métrique | Cible V1 | Cible V2 |
|----------|----------|----------|
| Créateurs accompagnés / an | ~5 000 | **100 000+** |
| Conseillers connectés | ~50 | **1 000+** |
| Organisations BGE | ~5 | **50+** |
| Temps de chargement (P95) | ~4s | **< 1.5s** |
| Uptime SLA | 95% | **99.9%** |
| Modules activables | 32 | **50+** |
| Taux de complétion parcours | ~15% | **60%+** |

### 1.3 Principe directeur

> **Du CRM au Bureau Virtuel** — L'utilisateur ne remplit plus des formulaires dans un pipeline linéaire. Il dispose d'un espace de travail personnel, avec des outils contextuels, un tableau de bord intelligent, et un accompagnement adaptatif piloté par l'IA.

### 1.4 Différenciateurs clés

1. **IA conversationnelle intégrée** dans chaque outil (pas un chat séparé)
2. **Pipeline visuel** type Kanban du parcours entrepreneurial
3. **Prédiction de réussite** basée sur les données diagnostic
4. **Intégration France Travail** native (9 APIs)
5. **Multi-tenant SaaS** pour les réseaux BGE
6. **Passeport Entrepreneurial** unifié (export attestations)
7. **Simulateurs interactifs** (CréaSim, juridique, financier)
8. **Accessibilité RGAA** complète (handicap visuel, cognitif, moteur)

---

## 2. Leçons apprises — Analyse rétrospective du V1

> ⚠️ **Cette section est critique** — Chaque point documente une erreur réelle rencontrée lors du développement V1, avec la cause racine et la correction à appliquer en V2.

### 2.1 Erreurs architecturales majeures

#### ERREUR #1 : SPA monolithique dans un seul `page.tsx`

**Problème V1** : Tout le dashboard (40+ composants, 3 rôles, 30+ onglets) était rendu via un Zustand state machine dans `src/app/page.tsx`. Les "routes" étaient en réalité des changements de state (`setUserTab('riasec')`). Le routing Next.js était totalement court-circuité.

**Impact** :
- Pas de URLs partageables (impossible de lier `/dashboard/mon-projet`)
- Le SSR/SEO est impossible sur le dashboard
- Les transitions entre pages utilisent `AnimatePresence` au lieu du router natif
- Impossible de faire du code splitting par route
- Le bundle client contient TOUS les 40+ composants
- Les métriques analytics sont faussées (tout est `/`)

**Correction V2** :
```
✅ Utiliser le App Router de Next.js 16 correctement
✅ Chaque module = une route réelle : /bureau/mon-projet, /bureau/business-plan
✅ Layout avec sidebar partagée via layout.tsx
✅ Les transitions utilisent le router natif (view transitions API)
✅ Chaque route fait son propre code splitting via dynamic imports
✅ Les URLs sont partageables et bookmarquables
```

#### ERREUR #2 : Double système d'authentification (JWT + NextAuth)

**Problème V1** : Deux systèmes d'auth coexistaient — un JWT custom (`cp_token` cookie) pour le SPA, et NextAuth v4 pour `/dashboard` et `/admin`. Les deux avaient leurs propres middleware, stores, et helpers. Les cookies avaient des noms différents (`cp_token` vs `next-auth.session-token`).

**Impact** :
- Confusion constante sur quel système utiliser
- Bugs de déconnexion partielle (un système loggé, l'autre pas)
- Le middleware devait gérer les deux cas
- Impossibilité de partager la session entre SPA et pages Next.js

**Correction V2** :
```
✅ Un seul système d'auth : NextAuth v5 (Auth.js) avec JWT strategy
✅ Extensions NextAuth pour injecter les données BGE (tenantId, organizationId)
✅ Un seul cookie de session : next-auth.session-token (httpOnly, secure)
✅ Server-side session check via getServerSession() dans les layouts
✅ Client-side session via useSession() hook
✅ Role-based access via middleware matcher par groupe de routes
```

#### ERREUR #3 : 47 modèles Prisma dont 23 orphelins

**Problème V1** : Le schéma contenait 64 modèles. 23 n'étaient référencés par aucun code. La création du schéma s'était faite par ajouts successifs sans jamais nettoyer. Les relations en cascade rendaient la suppression risquée.

**Impact** :
- La DB est 2x plus lourde que nécessaire
- Les migrations sont lentes (2-3 min)
- Prisma generate prend 15s
- L'intellisense est pollué par des types inutiles
- Les jointures par erreur sur des tables orphelines créent des bugs silencieux

**Correction V2** :
```
✅ Concevoir le schéma FINAL avant d'écrire une ligne de code
✅ Documenter chaque modèle avec son cas d'usage
✅ Noms de tables et colonnes cohérents (snake_case en DB, camelCase en code)
✅ Tester le schéma avec des données réelles AVANT le développement
✅ Utiliser les enums Prisma au lieu de String avec commentaires
✅ Limiter les Json fields (avoir des colonnes typées quand c'est possible)
✅ Procédure de suppression : vérifier les dépendances, tester, puis supprimer
```

#### ERREUR #4 : 150+ routes API sans architecture cohérente

**Problème V1** : Chaque développeur (ou agent IA) créait ses routes avec ses propres conventions. Certaines utilisaient `req.json()`, d'autres `safeParseBody()`. Certaines vérifiaient l'auth via `authenticateRequest()`, d'autres via le middleware seul. Les réponses utilisaient `{ success, data }` ou `{ error }` ou `{ success: false, message }` indifféremment.

**Impact** :
- Chaque route est un cas particulier
- Impossible de factoriser le code
- Les erreurs sont incohérentes (certains retournent 200 avec `{ error }`, d'autres 400/500)
- La documentation API est impossible à générer automatiquement

**Correction V2** :
```
✅ Créer un router factory avec validation Zod automatique
✅ Format de réponse standardisé : { data?: T, error?: { code, message, details } }
✅ Middleware d'auth unique injectant user/tenant dans l'objet request
✅ Every API route wrapped in try/catch with structured error responses
✅ OpenAPI/TSDoc pour auto-génération de la doc API
✅ Versionning des endpoints (/api/v1/...)
✅ Rate limiting par endpoint (pas global)
```

#### ERREUR #5 : Middleware JWT évalué à l'import (crash serveur)

**Problème V1** : `src/middleware.ts` importait `verifyToken()` qui appelait `jwt.verify()` avec `process.env.JWT_SECRET`. Si la variable n'était pas définie, le middleware plantait au démarrage avec une erreur fatale, rendant l'ensemble du serveur inutilisable.

**Impact** :
- Le serveur crash au démarrage si JWT_SECRET manque
- Le message d'erreur est cryptique
- Impossible de lancer en mode développement sans configurer l'environnement

**Correction V2** :
```
✅ Lazy evaluation : vérifier le token uniquement quand une requête arrive
✅ Graceful degradation : si le secret manque, logger un warning (pas crash)
✅ Validation de l'environnement au build time (pas runtime)
✅ Script de health check au démarrage (/api/health) qui vérifie les variables
```

### 2.2 Erreurs de données

#### ERREUR #6 : Noms de champs Prisma incorrects dans le code

**Problème V1** : Plusieurs composants et API utilisaient des noms de champs qui n'existaient pas dans le schéma. Exemples : `k.dimension` (au lieu de `k.category`), `k.value` (au lieu de `k.score`), `tremplin.recommendations` (n'existe pas, c'est `tremplin.responses`).

**Impact** :
- Crashes silencieux en production (les données sont undefined)
- L'intellisense TypeScript ne catche pas les erreurs sur les champs Json
- Les bugs ne sont découverts que lorsqu'un utilisateur atteint la fonctionnalité

**Correction V2** :
```
✅ Créer un fichier types/generated.ts qui définit les interfaces TypeScript pour chaque Json field
✅ Utiliser Zod schemas pour valider les données Json au runtime
✅ Tests unitaires qui vérifient les types de retour Prisma vs les types attendus
✅ Utiliser Prisma.JsonObject pour les champs Json complexes
✅ ESLint rule : interdire l'accès direct aux champs Json sans type assertion
```

#### ERREUR #7 : Promise.all sur des requêtes DB parallèles

**Problème V1** : De nombreuses API routes utilisaient `Promise.all([req1, req2, ...])` pour charger des données en parallèle. Si UNE requête échouait, TOUTES les données étaient perdues (reject fast).

**Impact** :
- L'utilisateur perd toutes ses données si une seule sous-requête échoue
- Les erreurs partielles ne sont pas gérées
- L'UX se dégrade (tout ou rien au lieu de dégradation progressive)

**Correction V2** :
```
✅ Toujours utiliser Promise.allSettled() pour les requêtes parallèles
✅ Logger les erreurs partielles (console.error, Sentry)
✅ Retourner les données disponibles + les erreurs dans la réponse
✅ Afficher les sections disponibles + un message "données partiellement indisponibles"
```

### 2.3 Erreurs de sécurité

#### ERREUR #8 : Jetons JWT falsifiables (base64)

**Problème V1** : Un fichier `auth-utils.ts` générait des "tokens" en encodant simplement `{ userId, email }` en base64 — sans signature cryptographique. N'importe qui pouvait créer un token valide avec n'importe quel userId.

**Impact** :
- **Vulnérabilité critique** : n'importe qui pouvait usurper n'importe quel compte
- Le système d'auth était une façade

**Correction V2** :
```
✅ TOUJOURS utiliser jsonwebtoken avec un secret cryptographique fort (>= 32 chars)
✅ Jamais de "token" maison (base64, XOR, etc.)
✅ Audit de sécurité automatique à chaque commit (git hooks + CI)
✅ Code review obligatoire pour tout fichier dans src/lib/auth/
```

#### ERREUR #9 : CSRF token jamais vérifié côté serveur

**Problème V1** : Un système de double-submit cookie CSRF était implémenté (`X-CSRF-Token` header + `csrf_token` cookie), mais aucun endpoint ne vérifiait réellement la correspondance. Le token était généré mais ignoré.

**Impact** :
- Protection CSRF inexistante malgré le code
- Faux sentiment de sécurité

**Correction V2** :
```
✅ Utiliser le framework CSRF de NextAuth (built-in avec SameSite cookies)
✅ Pour les API state-changing : vérifier Origin header ou utiliser CSRF token
✅ Test automatisé : envoyer un POST sans CSRF token → doit retourner 403
```

#### ERREUR #10 : XSS dans le rendu Markdown du chat IA

**Problème V1** : Le chatbot IA retournait du Markdown qui était converti en HTML. Les prompts des utilisateurs n'étaient pas échappés, permettant l'injection de balises `<script>` via le chat.

**Impact** :
- Attaque XSS possible via le chatbot
- Vol de session ou redirection malveillante

**Correction V2** :
```
✅ Sanitiser TOUJOURS le contenu HTML généré (DOMPurify ou équivalent)
✅ Utiliser react-markdown avec les options sécurisées par défaut
✅ Jamais utiliser dangerouslySetInnerHTML sauf avec sanitization
✅ Content Security Policy (CSP) headers restrictifs
```

#### ERREUR #11 : Rate limiting en mémoire (perd au restart)

**Problème V1** : Le rate limiting utilisait un Map en mémoire pour compter les requêtes par IP. Au restart du serveur, tout l'état est perdu. En multi-instance, chaque instance a son propre compteur.

**Impact** :
- Un attaquant peut bypasser le rate limit en attendant un restart
- En production multi-instance, le rate limit est divisé par le nombre d'instances

**Correction V2** :
```
✅ Utiliser Redis ou Upstash pour le rate limiting distribué
✅ Fallback en mémoire si Redis indisponible (graceful degradation)
✅ Sliding window algorithm (pas fixed window)
✅ Rate limits différents par endpoint (read=100/min, write=30/min, AI=5/min)
```

### 2.4 Erreurs UX/UI

#### ERREUR #12 : Onglets fantômes (ghost routes)

**Problème V1** : Le switch-case du dashboard référençait 36+ onglets. Certains n'avaient aucun composant associé (ex: `bilan-coherence`, `export-bp`, `rapport-diagnostic`). Cliquer dessus affichait un écran vide sans explication.

**Impact** :
- L'utilisateur voit un espace vide et pense que l'appli est cassée
- Les analytics montrent des "page views" sur des pages vides

**Correction V2** :
```
✅ TypeScript discriminated union pour les onglets (impossible d'ajouter un cas sans composant)
✅ Chaque route a son propre layout.tsx avec metadata
✅ Les composants manquants lèvent une erreur au build time (next/dynamic with loading)
✅ 404 custom pour les routes invalides
```

#### ERREUR #13 : useEffect sans try-catch (spinners infinis)

**Problème V1** : Plusieurs composants utilisaient `useEffect` pour charger des données via fetch. Si la requête échouait (erreur réseau, 500), l'état `isLoading` restait `true` et le spinner tournait indéfiniment.

**Impact** :
- L'utilisateur est bloqué sur un spinner infini
- Pas de bouton "retry"
- Les erreurs ne sont jamais rapportées

**Correction V2** :
```
✅ Utiliser TanStack Query (React Query) pour TOUTES les requêtes serveur
✅ Gestion automatique du loading/error/success
✅ Retry automatique avec backoff exponentiel
✅ Error boundaries React pour les erreurs de rendu
✅ Toast notifications pour les erreurs réseau
```

#### ERREUR #14 : Pas de responsive design sur le dashboard

**Problème V1** : Le dashboard était conçu desktop-first. La sidebar était fixe à 272px. Sur mobile, le contenu déborde, les tableaux sont illisibles, et les modals ne s'adaptent pas.

**Correction V2** :
```
✅ Mobile-first design system
✅ Sidebar = drawer sur mobile (< 1024px)
✅ Tableaux → cards empilées sur mobile
✅ Touch targets minimum 44px
✅ Bottom navigation bar sur mobile
✅ Testing sur 320px, 375px, 768px, 1024px, 1440px
```

### 2.5 Erreurs de développement

#### ERREUR #15 : Imports cassés après suppression de fichiers

**Problème V1** : La suppression de fichiers "morts" (dead code cleanup de ~30 000 lignes) a parfois cassé des imports silencieusement. TypeScript ne détecte pas les imports de fichiers supprimés si `isolatedModules` n'est pas activé.

**Correction V2** :
```
✅ Activer "isolatedModules": true dans tsconfig
✅ Linting strict à chaque commit (husky + lint-staged)
✅ CI pipeline avec TypeScript strict + tests
✅ Suppression de fichier = d'abord vérifier les consommateurs (rg), puis supprimer
```

#### ERREUR #16 : Packages npm inutilisés

**Problème V1** : Le package.json contenait des packages installés mais jamais utilisés (ou utilisés dans du code supprimé). Certains packages ajoutaient 50MB+ au node_modules.

**Correction V2** :
```
✅ npm audit + depcheck en CI
✅ Supprimer les dépendances inutilisées avant chaque release
✅ Lock file commité et versionné
✅ bundle analyzer en CI pour surveiller la taille
```

#### ERREUR #17 : TypeScript ignoreBuildErrors: false mais lint permissif

**Problème V1** : `next.config.ts` avait `typescript.ignoreBuildErrors: false` (bon), mais le lint était trop permissif. Les erreurs de type dans les fichiers standalone (scripts/) polluaient la sortie mais n'étaient jamais corrigées.

**Correction V2** :
```
✅ Séparer les scripts du code applicatif (dossier scripts/ avec tsconfig séparé)
✅ ESLint config stricte : no-explicit-any, no-unsafe-return, strict-null-checks
✅ CI fail on any lint error
✅ Biome ou prettier pour le formattage automatique
```

### 2.6 Erreurs de performance

#### ERREUR #18 : Toutes les dépendances chargées côté client

**Problème V1** : Des bibliothèques lourdes (pdf-parse, mammoth, xlsx, docx) étaient importées dans des composants React, même si elles n'étaient utilisées que côté serveur.

**Impact** :
- Le bundle client contient des bibliothèques Node.js (pdf-parse = 2MB, mammoth = 500KB)
- Le temps de chargement initial est dégradé
- Des erreurs de runtime côté client ("fs is not defined")

**Correction V2** :
```
✅ Séparer clairement les imports client vs server
✅ Utiliser 'use server' directives pour les fonctions serveur
✅ Les libs Node-only (pdf-parse, mammoth, sharp) ne doivent JAMAIS être importées côté client
✅ Vérifier avec @next/bundle-analyzer
```

#### ERREUR #19 : Pas de cache ni de revalidation

**Problème V1** : Chaque page visitée faisait des requêtes API fraîches. Les données de référence (liste des métiers, aides, statuts juridiques) étaient rechargées à chaque visite.

**Correction V2** :
```
✅ ISR (Incremental Static Regeneration) pour les données publiques peu changeantes
✅ TanStack Query avec staleTime pour les données utilisateur
✅ Cache HTTP (Cache-Control headers) sur les API publiques
✅ React Cache API pour les données serveur partagées
✅ Optimistic updates pour les opérations d'écriture
```

### 2.7 Synthèse des corrections obligatoires

| # | Erreur | Sévérité | Statut V2 |
|---|--------|----------|-----------|
| 1 | SPA monolithique page.tsx | Critique | ✅ Routes App Router |
| 2 | Double auth (JWT + NextAuth) | Critique | ✅ NextAuth v5 unique |
| 3 | 23 modèles Prisma orphelins | Haute | ✅ Schema design first |
| 4 | 150+ routes sans convention | Haute | ✅ Router factory + Zod |
| 5 | Middleware crash sans JWT_SECRET | Critique | ✅ Lazy evaluation |
| 6 | Champs Prisma incorrects | Haute | ✅ Types générés + Zod |
| 7 | Promise.all reject-fast | Moyenne | ✅ Promise.allSettled |
| 8 | JWT falsifiables (base64) | Critique | ✅ jsonwebtoken only |
| 9 | CSRF jamais vérifié | Haute | ✅ SameSite + Origin |
| 10 | XSS dans chat Markdown | Critique | ✅ DOMPurify + CSP |
| 11 | Rate limiting en mémoire | Moyenne | ✅ Redis/Upstash |
| 12 | Onglets fantômes | Moyenne | ✅ Discriminated unions |
| 13 | useEffect sans try-catch | Moyenne | ✅ TanStack Query |
| 14 | Pas de responsive | Haute | ✅ Mobile-first |
| 15 | Imports cassés silencieux | Moyenne | ✅ isolatedModules |
| 16 | Packages npm inutilisés | Basse | ✅ depcheck en CI |
| 17 | Lint permissif | Moyenne | ✅ Strict + CI fail |
| 18 | Libs Node côté client | Haute | ✅ 'use server' |
| 19 | Pas de cache | Moyenne | ✅ ISR + React Query |

---

## 3. Architecture cible — Bureau Virtuel

### 3.1 Philosophie

Le V2 abandonne l'approche "CRM/parcours linéaire" au profit d'une **expérience de bureau virtuel**. L'utilisateur entre dans un espace de travail personnalisé, semblable à un tableau de bord Notion ou Linear, où chaque outil est accessible contextuellement.

### 3.2 Principes d'architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LANDING PAGE (publique)               │
│  Hero + Parcours découverte + Outils + Témoignages      │
└──────────────────────┬──────────────────────────────────┘
                       │ Inscription / Connexion
                       ▼
┌─────────────────────────────────────────────────────────┐
│              ONBOARDING (3 étapes max)                   │
│  1. Profil créateur (nom, projet, secteur, étape)       │
│  2. Choix du parcours (création / reprise / développement)│
│  3. Sélection des outils recommandés                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  BUREAU VIRTUEL                          │
│  ┌──────────┐  ┌──────────────────────────────────────┐ │
│  │ SIDEBAR  │  │         MAIN CONTENT AREA            │ │
│  │          │  │  ┌────────────────────────────────┐  │ │
│  │ ◉ Accueil│  │  │   Dashboard (vue d'ensemble)   │  │ │
│  │          │  │  └────────────────────────────────┘  │ │
│  │ ▼ Parcours│  │                                      │ │
│  │  ├ Profil │  │  ┌─────────┐ ┌─────────┐ ┌───────┐ │ │
│  │  ├ Projet │  │  │ KPIs    │ │Pipeline │ │ Chat  │ │ │
│  │  ├ Marché │  │  │ Card    │ │Visuel   │ │ IA    │ │ │
│  │  ├ BP     │  │  └─────────┘ └─────────┘ └───────┘ │ │
│  │  └ ...   │  │                                      │ │
│  │          │  │  ┌────────────────────────────────┐  │ │
│  │ ▼ Outils  │  │  │   Outil actif (route courante) │  │ │
│  │  ├ Simu   │  │  │   ou                         │  │ │
│  │  ├ Docs   │  │  │   Parcours d'étapes           │  │ │
│  │  └ ...   │  │  └────────────────────────────────┘  │ │
│  │          │  │                                      │ │
│  │ ▼ Ecosyst.│  │  ┌────────────────────────────────┐  │ │
│  │  ├ Réseau │  │  │   IA Assistant (contextuel)   │  │ │
│  │  ├ Forum  │  │  │   barre flottante en bas     │  │ │
│  │  └ ...   │  │  └────────────────────────────────┘  │ │
│  └──────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Structure des routes (App Router)

```
src/app/
├── layout.tsx                          # Root layout (fonts, providers, toaster)
├── page.tsx                            # Landing page (publique)
├── (auth)/
│   ├── login/page.tsx                  # Connexion
│   ├── register/page.tsx               # Inscription
│   ├── forgot-password/page.tsx        # Mot de passe oublié
│   └── reset-password/page.tsx         # Reset mot de passe
├── (public)/
│   ├── blog/[slug]/page.tsx            # Articles
│   ├── actualites/page.tsx             # Actualités
│   ├── accompagnement/page.tsx         # Services
│   ├── outils/page.tsx                 # Outils publics
│   ├── tarifs/page.tsx                 # Tarification
│   ├── contact/page.tsx                # Contact
│   ├── mentions-legales/page.tsx       # Legal
│   └── politique-de-confidentialite/page.tsx
├── (bureau)/                           # = Bureau Virtuel (protégé)
│   ├── layout.tsx                      # Layout avec sidebar + topbar
│   ├── page.tsx                        # Dashboard d'accueil
│   ├── onboarding/page.tsx             # Onboarding (si nouveau)
│   │
│   ├── parcours/
│   │   ├── profil/page.tsx             # Mon profil créateur
│   │   ├── projet/page.tsx             # Mon projet (questionnaire)
│   │   ├── vision/page.tsx             # Vision & aspirations
│   │   ├── riasec/page.tsx             # Test RIASEC
│   │   ├── kiviat/page.tsx             # Radar compétences
│   │   ├── motivations/page.tsx        # Motivations
│   │   └── zero-draft/page.tsx         # Brouillon IA
│   │
│   ├── strategie/
│   │   ├── marche/page.tsx             # Analyse de marché
│   │   ├── juridique/page.tsx          # Statut juridique
│   │   ├── financier/page.tsx          # Prévisions financières
│   │   ├── creasim/page.tsx            # Simulateur interactif
│   │   ├── bmc/page.tsx               # Business Model Canvas
│   │   ├── business-plan/page.tsx      # Business Plan éditeur
│   │   ├── executive-summary/page.tsx  # Résumé opérationnel
│   │   ├── pitch-deck/page.tsx         # Pitch Deck
│   │   ├── bp-audit/page.tsx           # Audit BP
│   │   └── financement/page.tsx        # Plan de financement
│   │
│   ├── ecosysteme/
│   │   ├── annuaire/page.tsx           # Annuaire acteurs
│   │   ├── forum/page.tsx              # Forum communautaire
│   │   ├── mentorat/page.tsx           # Mentorat
│   │   ├── evenements/page.tsx         # Événements FT
│   │   ├── offres/page.tsx             # Offres d'emploi FT
│   │   ├── metiers/page.tsx            # Répertoire métiers FT
│   │   ├── entreprises/page.tsx        # Répertoire entreprises FT
│   │   ├── aides/page.tsx              # Aides financières FT
│   │   ├── formations/page.tsx         # Formations FT
│   │   └── agences/page.tsx            # Agences FT
│   │
│   ├── pilotage/
│   │   ├── tremplin/page.tsx           # Bilan final Go/No-Go
│   │   ├── passeport/page.tsx          # Passeport entrepreneurial
│   │   ├── certifications/page.tsx     # Certifications
│   │   ├── gestion/page.tsx            # Gestion quotidienne (post-création)
│   │   ├── marketing/page.tsx          # IA Marketing
│   │   └── competence-bridge/page.tsx  # Pont de compétences
│   │
│   └── parametres/
│       ├── compte/page.tsx             # Mon compte
│       ├── accessibilite/page.tsx      # Paramètres accessibilité
│       └── notifications/page.tsx      # Préférences notifications
│
├── (conseiller)/                       # = Espace Conseiller (protégé)
│   ├── layout.tsx                      # Layout conseiller
│   ├── page.tsx                        # Vue d'ensemble
│   ├── beneficiaires/page.tsx          # Liste bénéficiaires
│   ├── beneficiaires/[id]/page.tsx     # Fiche bénéficiaire
│   ├── entretiens/page.tsx             # Entretiens
│   ├── livrables/page.tsx              # Livrables
│   └── rapport/page.tsx                # Rapports & analytics
│
├── (admin)/                            # = Espace Admin (protégé)
│   ├── layout.tsx                      # Layout admin
│   ├── page.tsx                        # Dashboard admin
│   ├── organisations/page.tsx          # Gestion organisations
│   ├── utilisateurs/page.tsx           # Gestion utilisateurs
│   ├── modules/page.tsx                # Gestion modules
│   ├── contenus/page.tsx               # Gestion contenus (CMS)
│   ├── facturation/page.tsx            # Facturation & abonnements
│   └── analytics/page.tsx              # Analytics globaux
│
└── api/
    ├── auth/[...nextauth]/route.ts     # NextAuth v5
    ├── v1/
    │   ├── user/route.ts
    │   ├── modules/route.ts
    │   ├── parcours/...
    │   ├── strategie/...
    │   ├── ecosysteme/...
    │   ├── pilotage/...
    │   ├── ai/route.ts
    │   ├── export/route.ts
    │   └── admin/...
    └── webhooks/
        └── stripe/route.ts
```

### 3.4 Composant Layout Bureau Virtuel

```
(bureau)/layout.tsx
├── TopBar
│   ├── Logo CreaPulse
│   ├── Breadcrumb (route-based, auto)
│   ├── Search (Cmd+K)
│   ├── Notifications Bell
│   ├── IA Assistant FAB (flottant)
│   └── User Menu (avatar, role, logout)
├── Sidebar (collapsible)
│   ├── Navigation par groupe (Accordéon)
│   ├── Indicateur de progression par groupe
│   ├── Badge "Nouveau" sur les modules récents
│   └── Raccourcis favoris (épinglés par l'utilisateur)
└── Main Content
    ├── Page Header (titre, actions contextuelles)
    ├── Content Area (route-based)
    └── IA Assistant Panel (slide-in, contextuel)
```

---

## 4. Design System & Home Page

### 4.1 Identité visuelle

**Inspirée de** : bge.asso.fr (chaleur humaine) + bpifrance-creation.fr (complétude encyclopédique)

| Token | Valeur | Usage |
|-------|--------|-------|
| `--color-primary` | `#00838F` (Teal profond) | Navigation, boutons principaux |
| `--color-primary-light` | `#E0F7FA` | Surfaces, backgrounds |
| `--color-accent` | `#FF6B35` (Coral) | CTAs, badges, alertes |
| `--color-accent-warm` | `#FFB74D` (Ambre) | Hover states, highlights |
| `--color-success` | `#2E7D32` | Validation, succès |
| `--color-warning` | `#F57F17` | Alertes, warnings |
| `--color-danger` | `#C62828` | Erreurs, suppressions |
| `--color-neutral-50` | `#FAFAFA` | Background page |
| `--color-neutral-100` | `#F5F5F5` | Card backgrounds |
| `--color-neutral-900` | `#1A1A2E` | Texte principal |

**Typographie** :
- Titres : Inter / Manrope (geometric sans-serif)
- Body : Inter (excellente lisibilité)
- Monospace : JetBrains Mono (bloc de code)
- Scale : 14/16/18/20/24/30/36/48/60px

**Imagery** :
- Photos : Professionnelles, naturelles, diversité entrepreneuriale
- Illustrations : Système d'illustrations custom (style "duotone geometric")
- Icônes : Lucide React (déjà utilisé en V1)
- Pas de stock photos génériques

### 4.2 Home Page — Structure détaillée

```
┌─────────────────────────────────────────────────────────────────────┐
│  TOP BAR UTILITY                                                    │
│  [Logo] [Mon Besoin ▾] [Trouver ma BGE] [Contraste] [Se connecter]│
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  HERO SECTION                                                       │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐   │
│  │                      │  │  "Accompagnez votre idée         │   │
│  │  [Photo portrait     │  │   jusqu'à l'entreprise"          │   │
│  │   entrepreneur·se    │  │                                  │   │
│  │   avec nom + bio]    │  │  Le bureau virtuel qui guide     │   │
│  │                      │  │  100 000 créateurs par an        │   │
│  │                      │  │                                  │   │
│  │                      │  │  [Commencer mon parcours]        │   │
│  │                      │  │  [Découvrir les outils]          │   │
│  └──────────────────────┘  └──────────────────────────────────┘   │
│                                                                     │
│  Chiffres clés :                                                    │
│  [68 000 accompagnés] [549 lieux] [1 350 conseillers] [19K créées] │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  "MON BESOIN" — Profilage interactif                                │
│  3 cartes cliquables :                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ 💡 Je découvre│  │ 🚀 Je crée   │  │ 📈 Je développe│            │
│  │ une idée     │  │ mon entreprise│  │ mon activité   │            │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  → Redirige vers l'onboarding adapté                               │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  PARCOURS VISUEL — 4 étapes                                        │
│                                                                     │
│  ① Idée & Vision        ② Structurer          ③ Financer           │
│     [icone]     ───→        [icone]      ───→      [icone]          │
│                                                                     │
│  ④ Lancer & Développer                                                │
│     [icone]                                                          │
│                                                                     │
│  Chaque étape : titre + description + nombre d'outils              │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  OUTILS PHARES                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ CréaSim  │  │ Business │  │ Pass     │  │ IA       │           │
│  │ Simulateur│  │ Plan IA  │  │ Porteur  │  │ Marketing│           │
│  │ Financier │  │ Éditeur  │  │          │  │ Générateur│          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  TÉMOIGNAGES — Carousel                                            │
│                                                                     │
│  [←]  ┌─────────────────────────┐  [→]                             │
│       │ [Photo] "Marie a créé   │                                   │
│       │  sa boulangerie grâce   │                                   │
│       │  au simulateur CréaSim  │                                   │
│       │  et à l'accompagnement  │                                   │
│       │  BGE Rennes"            │                                   │
│       │ — Marie D., Rennes      │                                   │
│       └─────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  RÉSEAU BGE — Recherche locale                                     │
│                                                                     │
│  [Code postal: _____] [Rechercher]                                  │
│                                                                     │
│  → Affiche la BGE la plus proche avec horaires, téléphone, carte   │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  ACTUALITÉS                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                         │
│  │ Article 1│  │ Article 2│  │ Article 3│                         │
│  │ [img]    │  │ [img]    │  │ [img]    │                         │
│  │ Titre    │  │ Titre    │  │ Titre    │                         │
│  │ Excerpt  │  │ Excerpt  │  │ Excerpt  │                         │
│  └──────────┘  └──────────┘  └──────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  PARTENAIRES — Logo carousel                                        │
│  [BPI France] [France Travail] [Région Bretagne] [UE] [Banques]   │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  CTA FINAL                                                          │
│  "Prêt à créer votre entreprise ?"                                 │
│  [Commencer gratuitement]  [Demander une démo]                      │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  FOOTER                                                             │
│  [Logo + tagline]                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Solution │  │Ressources│  │ Entreprise│  │ Légal    │           │
│  │ Parcours │  │ Blog     │  │ À propos │  │ CGU      │           │
│  │ Outils   │  │ Guides   │  │ Part.    │  │ Confidentialité│     │
│  │ Tarifs   │  │ FAQ      │  │ Contact  │  │ Cookies  │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│  [Newsletter: email ____] [S'inscrire]                             │
│  © 2025 CreaPulse — Réseau BGE Bretagne                           │
│  [Facebook] [LinkedIn] [Instagram]                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.3 Animations & Micro-interactions

- **Scroll reveal** : Sections apparaissent au scroll (framer-motion `whileInView`)
- **Compteurs animés** : Chiffres clés s'incrémentent au viewport entry
- **Parallax subtil** : Photo hero avec parallax léger (3-5px)
- **Hover states** : Cartes avec elevation + scale(1.02)
- **Loading skeleton** : Shimmer animation sur tous les contenus en chargement
- **Page transitions** : View Transitions API (si supporté) ou fade+slide
- **Confetti** : À la complétion d'une étape majeure

### 4.4 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile S | 320px | Single column, bottom nav |
| Mobile | 375px | Single column, hamburger menu |
| Tablet | 768px | Two columns, collapsible sidebar |
| Desktop | 1024px | Full sidebar + main content |
| Wide | 1440px | Max-width container (1280px) |

---

## 5. Schéma de données — Prisma (V2)

### 5.1 Principes du V2

1. **Enums au lieu de String** pour les champs catégoriels
2. **Json minimal** — Préférer des colonnes typées
3. **Relations explicites** — Pas de Json avec des IDs
4. **Indexes stratégiques** — Sur tous les champs de filtrage/jointure
5. **Soft delete** — `deletedAt` au lieu de CASCADE sur les données métier
6. **Timestamps standard** — `createdAt` + `updatedAt` sur chaque modèle

### 5.2 Models du V2 (35 modèles, optimisé depuis 47)

```prisma
// ============================================
// MULTI-TENANT
// ============================================
model Tenant {
  id               String   @id @default(cuid())
  name             String   @unique
  slug             String   @unique
  logoUrl          String?
  primaryColor     String?  @default("#00838F")
  domain           String?  @unique
  plan             TenantPlan @default(STARTER)
  isActive         Boolean  @default(true)
  settings         Json     @default("{}")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  organizations    Organization[]
  users            User[]
  modules          AppModule[]
  auditLogs        AuditLog[]

  @@map("tenants")
}

enum TenantPlan {
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

model Organization {
  id               String   @id @default(cuid())
  tenantId         String
  name             String
  siret            String?  @unique
  type             OrgType  @default(FORMATION_CENTER)
  address          String?
  city             String?
  postalCode       String?
  region           String?
  phone            String?
  email            String?
  website          String?
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  tenant           Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  counselors       Counselor[]

  @@index([tenantId])
  @@map("organizations")
}

enum OrgType {
  FORMATION_CENTER
  BGE_AGENCY
  INCUBATOR
  PEPITE
  CO_WORKING
}

// ============================================
// AUTHENTIFICATION
// ============================================
model User {
  id               String    @id @default(cuid())
  tenantId         String
  email            String
  passwordHash     String
  firstName        String?
  lastName         String?
  avatarUrl        String?
  role             UserRole  @default(BENEFICIARY)
  isActive         Boolean   @default(true)
  emailVerified    Boolean   @default(false)
  lastLoginAt      DateTime?
  deletedAt        DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  tenant           Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  counselorProfile Counselor?
  beneficiaryProfile Beneficiary?
  creatorJourney   CreatorJourney?
  accounts         Account[]
  sessions         Session[]
  notifications    Notification[]
  auditLogs        AuditLog[]
  moduleResults    ModuleResult[]
  kiviatResults    KiviatResult[]
  riasecResults    RiasecResult[]
  motivations      MotivationAssessment?
  cvUploads        CvUpload[]
  financialForecast FinancialForecast?
  juridiqueAnalysis JuridiqueAnalysis?
  marketAnalysis   MarketAnalysis?
  tremplin         Tremplin?
  zeroDraft        ZeroDraft?
  networks         Network[]
  discussions      Discussion[]
  replies          Reply[]
  favorites        Favorite[]
  savedNews        SavedNews[]
  mentorProfile    Mentor?
  mentorships      Mentorship[]  @relation("MenteeMentorships")
  mentorRequests   MentorshipRequest[] @relation("MenteeRequests")
  personalPaths    PersonalizedPath[]
  swipeResults     SwipeGameResult[]
  registrations    Registration[]
  accessibility    AccessibilitySetting?
  livrables        Livrable[] @relation("LivrableOwner")

  @@unique([tenantId, email])
  @@index([tenantId, role])
  @@map("users")
}

enum UserRole {
  ADMIN
  COUNSELOR
  BENEFICIARY
}

model Account {
  id               String   @id @default(cuid())
  userId           String
  provider         String   // "credentials", "france-connect", etc.
  providerId       String?
  createdAt        DateTime @default(now())

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("accounts")
}

model Session {
  id               String   @id @default(cuid())
  userId           String
  token            String   @unique
  ipAddress        String?
  userAgent        String?
  expiresAt        DateTime
  createdAt        DateTime @default(now())

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}

// ============================================
// PROFILS
// ============================================
model Counselor {
  id               String   @id @default(cuid())
  userId           String   @unique
  organizationId   String
  name             String
  specialities     String[]
  certifications   String[]
  maxBeneficiaries Int      @default(30)
  isAvailable      Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization     Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  assignments      CounselorAssignment[]
  appointments     Appointment[]
  interviews       InterviewSession[]
  livrables        Livrable[] @relation("CounselorLivrables")

  @@index([organizationId])
  @@map("counselors")
}

model Beneficiary {
  id               String   @id @default(cuid())
  userId           String   @unique
  organizationId   String?
  externalId       String?  // ID France Travail, etc.

  employmentStatus EmploymentStatus?
  educationLevel   String?
  lastDiploma      String?
  skills           Json     @default("[]")
  hasDisability    Boolean  @default(false)
  disabilityRate   Int?
  rqthStatus       Boolean  @default(false)
  progressScore    Int      @default(0)

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization     Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  assignments      CounselorAssignment[]
  appointments     Appointment[]
  interviews       InterviewSession[]

  @@index([organizationId])
  @@map("beneficiaries")
}

enum EmploymentStatus {
  EMPLOYED
  UNEMPLOYED
  SELF_EMPLOYED
  STUDENT
  RETIRED
  INACTIVE
  OTHER
}

model CounselorAssignment {
  id               String    @id @default(cuid())
  counselorId      String
  beneficiaryId    String
  role             AssignmentRole @default(PRIMARY)
  status           AssignmentStatus @default(ACTIVE)
  assignedAt       DateTime  @default(now())
  unassignedAt     DateTime?
  notes            String?

  counselor        Counselor   @relation(fields: [counselorId], references: [id], onDelete: Cascade)
  beneficiary      Beneficiary @relation(fields: [beneficiaryId], references: [id], onDelete: Cascade)

  @@unique([counselorId, beneficiaryId])
  @@index([counselorId])
  @@index([beneficiaryId])
  @@map("counselor_assignments")
}

enum AssignmentRole {
  PRIMARY
  SECONDARY
  SUBSTITUTE
}

enum AssignmentStatus {
  ACTIVE
  PAUSED
  ENDED
}

// ============================================
// PARCOURS CRÉATEUR (Unified)
// ============================================
model CreatorJourney {
  id               String   @id @default(cuid())
  userId           String   @unique
  currentPhase     JourneyPhase @default(DISCOVERY)
  progressPercent  Int      @default(0)

  // Questionnaire Mon Projet (structuré, pas Json)
  projectTitle     String?
  projectDescription String?
  projectSector    String?
  projectStage     String?  // "idea", "validation", "structuring", "launching"
  creationMotivation String?
  targetAudience   String?
  valueProposition String?
  estimatedRevenue String?
  estimatedInvestment String?

  // Vision & aspirations
  visionAnswers    Json?    @default("{}")

  // Business Plan (structuré)
  bpStatus         BpStatus @default(NOT_STARTED)
  bpSections       Json?    // 22 sections du BP
  bpScore          Int?
  bpGeneratedAt    DateTime?
  bpValidatedAt    DateTime?
  bpValidatedBy    String?  // counselorId

  // Tremplin
  tremplinStatus   TremplinStatus @default(NOT_STARTED)
  tremplinScore    Int?

  // Passeport
  passportGeneratedAt DateTime?
  passportAttestations Json? @default("[]")

  status           JourneyStatus @default(ACTIVE)
  startedAt        DateTime @default(now())
  completedAt      DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("creator_journeys")
}

enum JourneyPhase {
  DISCOVERY
  PROFILING
  MODELING
  STRATEGY
  ECOSYSTEM
  LAUNCH
  POST_CREATION
}

enum BpStatus {
  NOT_STARTED
  IN_PROGRESS
  GENERATING
  DRAFT
  REVIEW
  VALIDATED
  EXPORTED
}

enum TremplinStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  GO
  NO_GO
}

enum JourneyStatus {
  ACTIVE
  PAUSED
  COMPLETED
  ABANDONED
}

// ============================================
// DIAGNOSTICS & RÉSULTATS
// ============================================
model ModuleResult {
  id               String   @id @default(cuid())
  userId           String
  moduleCode       String
  score            Int      @default(0)
  maxScore         Int      @default(100)
  answers          Json     @default("{}")
  feedback         String?
  completedAt      DateTime?
  createdAt        DateTime @default(now())

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, moduleCode])
  @@index([userId])
  @@index([moduleCode])
  @@map("module_results")
}

model KiviatResult {
  id               String   @id @default(cuid())
  userId           String
  category         String
  score            Float    @default(0)
  maxScore         Float    @default(10)
  createdAt        DateTime @default(now())

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, category])
  @@index([userId])
  @@map("kiviat_results")
}

model RiasecResult {
  id               String   @id @default(cuid())
  userId           String
  profileType      String   // R, I, A, S, E, C
  score            Float    @default(0)
  isDominant       Boolean  @default(false)
  createdAt        DateTime @default(now())

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, profileType])
  @@index([userId])
  @@map("riasec_results")
}

model MotivationAssessment {
  id               String   @id @default(cuid())
  userId           String   @unique
  scores           Json     @default("{}")
  summary          String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("motivation_assessments")
}

// ============================================
// ANALYSES & DOCUMENTS
// ============================================
model FinancialForecast {
  id               String   @id @default(cuid())
  userId           String   @unique
  sector           String?
  year1Revenue     Float?
  year2Revenue     Float?
  year3Revenue     Float?
  year1Expenses    Float?
  year2Expenses    Float?
  year3Expenses    Float?
  breakevenMonth   Int?
  initialInvestment Float?
  aiSynthesis      String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("financial_forecasts")
}

model JuridiqueAnalysis {
  id               String   @id @default(cuid())
  userId           String   @unique
  recommendedStatus String?
  fiscalRegime     String?
  legalStructure   String?
  socialCharges    Json?    @default("{}")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("juridique_analyses")
}

model MarketAnalysis {
  id               String   @id @default(cuid())
  userId           String   @unique
  sector           String?
  marketSize       String?
  targetAudience   String?
  trends           Json?    @default("[]")
  competitors      Json?    @default("[]")
  opportunities    String?
  threats          String?
  aiSynthesis      String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("market_analyses")
}

model Tremplin {
  id               String   @id @default(cuid())
  userId           String   @unique
  currentStep      Int      @default(0)
  responses        Json     @default("{}")
  isCompleted      Boolean  @default(false)
  completedAt      DateTime?
  score            Int?
  decision         TremplinDecision?
  summary          String?
  recommendations  Json     @default("[]")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("tremplins")
}

enum TremplinDecision {
  GO
  GO_CONDITIONAL
  NO_GO
  PENDING
}

model ZeroDraft {
  id               String   @id @default(cuid())
  userId           String   @unique
  projectTitle     String?
  content          String   @default("")
  wordCount        Int      @default(0)
  status           DraftStatus @default(DRAFT)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("zero_drafts")
}

enum DraftStatus {
  DRAFT
  GENERATING
  READY
  REFINED
}

// ============================================
// ÉCOSYSTÈME & COMMUNAUTÉ
// ============================================
model Actor {
  id               String   @id @default(cuid())
  tenantId         String?
  name             String
  type             ActorType
  category         String?
  city             String
  region           String?
  address          String?
  phone            String?
  email            String?
  website          String?
  description      String?
  services         Json?
  featured         Boolean  @default(false)
  successRate      Float?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  favorites        Favorite[]
  tenant           Tenant?  @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  @@index([tenantId, type])
  @@index([city])
  @@map("actors")
}

enum ActorType {
  BGE
  INCUBATOR
  PEPITE
  CHAMBER_COMMERCE
  CCI
  BANK
  INVESTOR
  MENTOR
  FORMATION
  OTHER
}

model Favorite {
  id               String   @id @default(cuid())
  userId           String
  actorId          String
  createdAt        DateTime @default(now())

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  actor            Actor    @relation(fields: [actorId], references: [id], onDelete: Cascade)

  @@unique([userId, actorId])
  @@index([userId])
  @@map("favorites")
}

model DiscussionCategory {
  id               String   @id @default(cuid())
  name             String
  slug             String   @unique
  description      String?
  icon             String?
  color            String?
  sortOrder        Int      @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  discussions      Discussion[]

  @@map("discussion_categories")
}

model Discussion {
  id               String   @id @default(cuid())
  authorId         String
  categoryId       String
  title            String
  content          String
  tags             String[] @default([])
  isPinned         Boolean  @default(false)
  isLocked         Boolean  @default(false)
  viewCount        Int      @default(0)
  likesCount       Int      @default(0)
  replyCount       Int      @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  author           User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  category         DiscussionCategory @relation(fields: [categoryId], references: [id])
  replies          Reply[]

  @@index([categoryId])
  @@index([authorId])
  @@map("discussions")
}

model Reply {
  id               String   @id @default(cuid())
  discussionId     String
  authorId         String
  parentId         String?
  content          String
  isEdited         Boolean  @default(false)
  likesCount       Int      @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  discussion       Discussion @relation(fields: [discussionId], references: [id], onDelete: Cascade)
  author           User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent           Reply?   @relation("ReplyTree", fields: [parentId], references: [id], onDelete: Cascade)
  children         Reply[]  @relation("ReplyTree")

  @@index([discussionId])
  @@index([authorId])
  @@map("replies")
}

model Mentor {
  id               String   @id @default(cuid())
  userId           String   @unique
  bio              String   @default("")
  expertise        String[] @default([])
  sectors          String[] @default([])
  location         String   @default("")
  availability     MentorAvailability @default(AVAILABLE)
  maxMentees       Int      @default(3)
  rating           Float    @default(0)
  reviewCount      Int      @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  mentorships      Mentorship[]
  requests         MentorshipRequest[]

  @@map("mentors")
}

enum MentorAvailability {
  AVAILABLE
  LIMITED
  UNAVAILABLE
}

model MentorshipRequest {
  id               String   @id @default(cuid())
  mentorId         String
  menteeId         String
  message          String   @default("")
  objectives       String[] @default([])
  status           MentorRequestStatus @default(PENDING)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  mentor           Mentor   @relation(fields: [mentorId], references: [id], onDelete: Cascade)
  mentee           User     @relation("MenteeRequests", fields: [menteeId], references: [id], onDelete: Cascade)

  @@index([mentorId])
  @@map("mentorship_requests")
}

enum MentorRequestStatus {
  PENDING
  ACCEPTED
  REJECTED
  CANCELLED
}

model Mentorship {
  id               String   @id @default(cuid())
  mentorId         String
  menteeId         String
  status           MentorshipStatus @default(ACTIVE)
  startedAt        DateTime @default(now())
  endedAt          DateTime?
  rating           Float?
  review           String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  mentor           Mentor   @relation(fields: [mentorId], references: [id], onDelete: Cascade)
  mentee           User     @relation("MenteeMentorships", fields: [menteeId], references: [id], onDelete: Cascade)

  @@unique([mentorId, menteeId])
  @@index([mentorId])
  @@map("mentorships")
}

enum MentorshipStatus {
  ACTIVE
  PAUSED
  ENDED
}

// ============================================
// INFRASTRUCTURE
// ============================================
model AppModule {
  id               String   @id @default(cuid())
  tenantId         String
  code             String
  name             String
  description      String?
  category         ModuleCategory @default(DIAGNOSTIC)
  phase            JourneyPhase @default(DISCOVERY)
  isActive         Boolean  @default(true)
  sortOrder        Int      @default(0)
  config           Json     @default("{}")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  tenant           Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, code])
  @@index([tenantId, isActive])
  @@map("modules")
}

enum ModuleCategory {
  DIAGNOSTIC
  MODELING
  STRATEGY
  ECOSYSTEM
  PILOTAGE
  TOOL
}

model Notification {
  id               String   @id @default(cuid())
  userId           String
  title            String
  content          String
  type             NotificationType @default(INFO)
  link             String?
  isRead           Boolean  @default(false)
  createdAt        DateTime @default(now())

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([userId, createdAt])
  @@map("notifications")
}

enum NotificationType {
  INFO
  SUCCESS
  WARNING
  ACTION_REQUIRED
  MILESTONE
}

model AuditLog {
  id               String   @id @default(cuid())
  tenantId         String?
  userId           String?
  action           AuditAction
  entityType       String?
  entityId         String?
  details          Json     @default("{}")
  ipAddress        String?
  userAgent        String?
  createdAt        DateTime @default(now())

  tenant           Tenant?  @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  @@index([tenantId, createdAt])
  @@index([userId, createdAt])
  @@index([entityType, entityId])
  @@map("audit_logs")
}

enum AuditAction {
  LOGIN
  LOGOUT
  MODULE_COMPLETE
  BP_GENERATE
  BP_VALIDATE
  PASSPORT_EXPORT
  USER_CREATE
  USER_UPDATE
  USER_DELETE
  MODULE_TOGGLE
  DATA_EXPORT
  SETTINGS_UPDATE
}

model CvUpload {
  id               String   @id @default(cuid())
  userId           String
  fileName         String?
  cvText           String?
  parsedSkills     Json?    @default("{}")
  fileUrl          String?
  fileKey          String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("cv_uploads")
}

model Livrable {
  id               String   @id @default(cuid())
  userId           String?
  counselorId      String?
  type             LivrableType
  title            String
  content          Json     @default("{}")
  fileUrl          String?
  fileName         String?
  status           LivrableStatus @default(DRAFT)
  generatedBy      String?
  generatedAt      DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  owner            User?     @relation("LivrableOwner", fields: [userId], references: [id], onDelete: Cascade)
  counselor        Counselor? @relation("CounselorLivrables", fields: [counselorId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([counselorId])
  @@map("livrables")
}

enum LivrableType {
  BUSINESS_PLAN
  EXECUTIVE_SUMMARY
  PITCH_DECK
  FINANCIAL_FORECAST
  PASSPORT
  CERTIFICATE
  ATTESTATION
  REPORT
  OTHER
}

enum LivrableStatus {
  DRAFT
  GENERATING
  READY
  VALIDATED
  EXPORTED
}

model Appointment {
  id               String   @id @default(cuid())
  counselorId      String
  beneficiaryId    String
  title            String
  description      String?
  type             AppointmentType @default(FOLLOW_UP)
  mode             AppointmentMode @default(PHYSICAL)
  scheduledAt      DateTime
  durationMinutes  Int      @default(60)
  status           AppointmentStatus @default(SCHEDULED)
  location         String?
  videoLink        String?
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  counselor        Counselor   @relation(fields: [counselorId], references: [id], onDelete: Cascade)
  beneficiary      Beneficiary @relation(fields: [beneficiaryId], references: [id], onDelete: Cascade)

  @@index([counselorId, scheduledAt])
  @@index([beneficiaryId, scheduledAt])
  @@map("appointments")
}

enum AppointmentType { BILAN, FOLLOW_UP, WORKSHOP, OTHER }
enum AppointmentMode { PHYSICAL, VIDEO, PHONE }
enum AppointmentStatus { SCHEDULED, CONFIRMED, COMPLETED, CANCELLED }

model InterviewSession {
  id               String   @id @default(cuid())
  counselorId      String
  beneficiaryId    String
  type             String   @default("bilan")
  phase            String?
  scheduledAt      DateTime
  startedAt        DateTime?
  completedAt      DateTime?
  status           String   @default("scheduled")
  synthesis        String?
  recommendations  String[] @default([])
  notes            InterviewNote[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  counselor        Counselor   @relation(fields: [counselorId], references: [id])
  beneficiary      Beneficiary @relation(fields: [beneficiaryId], references: [id], onDelete: Cascade)

  @@index([counselorId])
  @@index([beneficiaryId])
  @@map("interview_sessions")
}

model InterviewNote {
  id               String   @id @default(cuid())
  interviewId      String
  phase            String   @default("general")
  category         String   @default("observation")
  content          String
  isKeyPoint       Boolean  @default(false)
  isActionItem     Boolean  @default(false)
  createdAt        DateTime @default(now())

  interview        InterviewSession @relation(fields: [interviewId], references: [id], onDelete: Cascade)

  @@index([interviewId])
  @@map("interview_notes")
}

// ============================================
// SECONDARY TABLES
// ============================================
model AccessibilitySetting {
  id               String   @id @default(cuid())
  userId           String   @unique
  textSize         Int      @default(100)
  highContrast     Boolean  @default(false)
  readingLine      Boolean  @default(false)
  dyslexicFont     Boolean  @default(false)
  pauseAnimations  Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("accessibility_settings")
}

model Network {
  id               String   @id @default(cuid())
  userId           String
  name             String
  type             String
  contact          String?
  email            String?
  phone            String?
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("networks")
}

model PersonalizedPath {
  id               String   @id @default(cuid())
  userId           String
  title            String
  steps            Json     @default("[]")
  status           String   @default("active")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("personalized_paths")
}

model Registration {
  id               String   @id @default(cuid())
  userId           String
  projectType      String?
  projectDescription String?
  projectStage     String?
  motivations      String?
  needs            String[] @default([])
  supportType      String?
  createdAt        DateTime @default(now())

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("registrations")
}

model SwipeGameResult {
  id               String   @id @default(cuid())
  userId           String
  cardId           String
  direction        String
  createdAt        DateTime @default(now())

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("swipe_game_results")
}

model SavedNews {
  id               String   @id @default(cuid())
  userId           String
  newsId           String   // External ID (not a FK)
  title            String?
  excerpt          String?
  sourceUrl        String?
  createdAt        DateTime @default(now())

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, newsId])
  @@index([userId])
  @@map("saved_news")
}
```

### 5.3 Différences clés V1 → V2

| Aspect | V1 (47 modèles) | V2 (35 modèles) |
|--------|------------------|------------------|
| Enums | String avec commentaires | Vrais enums Prisma |
| JSON fields | Partout | Minimal (seulement pour données dynamiques) |
| CreatorSession | Stocke TOUT en Json | Remplacé par CreatorJourney structuré |
| BpAudit | Modèle séparé | Intégré dans CreatorJourney |
| NewsItem | Modèle DB avec userId | Supprimé (données externes FT) |
| AiConversation | Modèles DB | Supprimé (stateless via IA) |
| DiagnosisSession | Modèle complexe | Simplifié dans ModuleResult |
| DisabilityRequest | Modèle dédié | Intégré dans Beneficiary |

---

## 6. Système de modules (V2)

### 6.1 Architecture

Chaque module est une **route Next.js** + un **composant page** + une **config en DB** + des **API routes**. Le système de modules est un feature flag system avec :

- Activation/désactivation par tenant
- Paramètres configurables par module
- Prérequis entre modules (gating)
- Ordre de tri personnalisable

### 6.2 Modules V2 (50 modules)

| Phase | Code | Nom | Catégorie | Dépendances |
|-------|------|-----|-----------|-------------|
| Discovery | `profil` | Mon Profil | diagnostic | — |
| Discovery | `parcours` | Mon Parcours | diagnostic | profil |
| Discovery | `riasec` | Test RIASEC | diagnostic | profil |
| Discovery | `kiviat` | Radar Compétences | diagnostic | profil |
| Discovery | `motivations` | Motivations | diagnostic | profil |
| Discovery | `swipe-game` | Jeu d'aspirations | diagnostic | profil |
| Profiling | `vision` | Vision & Aspirations | modeling | parcours |
| Profiling | `mon-projet` | Mon Projet | modeling | vision |
| Profiling | `cv-upload` | Mon CV | modeling | profil |
| Profiling | `zero-draft` | Brouillon IA | modeling | mon-projet |
| Profiling | `bmc` | Business Model Canvas | modeling | mon-projet |
| Strategy | `marche` | Analyse de Marché | strategy | mon-projet |
| Strategy | `juridique` | Statut Juridique | strategy | mon-projet |
| Strategy | `financier` | Prévisions Financières | strategy | marche |
| Strategy | `creasim` | Simulateur CréaSim | strategy | financier |
| Strategy | `business-plan` | Business Plan IA | strategy | marche, financier |
| Strategy | `executive-summary` | Résumé Opérationnel | strategy | business-plan |
| Strategy | `pitch-deck` | Pitch Deck | strategy | business-plan |
| Strategy | `bp-audit` | Audit BP | strategy | business-plan |
| Strategy | `financement` | Plan de Financement | strategy | business-plan |
| Strategy | `go-nogo` | Décision Go/No-Go | strategy | bp-audit |
| Ecosystem | `annuaire` | Annuaire Acteurs | ecosystem | — |
| Ecosystem | `forum` | Forum Communautaire | ecosystem | — |
| Ecosystem | `mentorat` | Mentorat | ecosystem | — |
| Ecosystem | `evenements` | Événements | ecosystem | — |
| Ecosystem | `offres` | Offres d'Emploi | ecosystem | — |
| Ecosystem | `metiers` | Répertoire Métiers | ecosystem | — |
| Ecosystem | `entreprises` | Répertoire Entreprises | ecosystem | — |
| Ecosystem | `aides` | Aides Financières | ecosystem | — |
| Ecosystem | `formations` | Formations | ecosystem | — |
| Ecosystem | `agences` | Agences FT | ecosystem | — |
| Ecosystem | `statistiques` | Statistiques Marché | ecosystem | — |
| Ecosystem | `benevoles` | Communautés Bénévoles | ecosystem | — |
| Ecosystem | `actualites` | Actualités | ecosystem | — |
| Pilotage | `tremplin` | Bilan Tremplin | pilotage | bp-audit, go-nogo |
| Pilotage | `passeport` | Passeport Entrepreneurial | pilotage | tremplin |
| Pilotage | `competence-bridge` | Pont de Compétences | pilotage | tremplin |
| Pilotage | `certifications` | Certifications | pilotage | competence-bridge |
| Pilotage | `tableau-de-bord` | Tableau de Bord | pilotage | — |
| Tools | `gestion` | Gestion Quotidienne | tool | tremplin |
| Tools | `marketing-ia` | IA Marketing | tool | business-plan |
| Tools | `porteur-chat` | Assistant IA | tool | — |
| Tools | `network` | Mon Réseau | tool | — |
| Tools | `personalized-path` | Parcours Personnalisé | tool | parcours |
| Tools | `smart-roadmap` | Roadmap IA | tool | mon-projet |
| Tools | `bp-label` | Labellisation BP | tool | business-plan |

### 6.3 Gating logic

```
Module accessible SI :
  1. isActive === true dans AppModule (pour le tenant courant)
  2. Tous les modules dans requires[] ont un ModuleResult.completedAt != null
  3. L'utilisateur a le rôle requis (certains modules sont conseiller-only)
```

### 6.4 Store module (Zustand)

```typescript
interface ModuleStore {
  modules: AppModule[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchModules: () => Promise<void>
  isModuleEnabled: (code: string) => boolean
  isModuleAccessible: (code: string) => boolean
  getModulesByPhase: (phase: JourneyPhase) => AppModule[]
  getProgressByPhase: (phase: JourneyPhase) => number
  getNextRecommendedModule: () => AppModule | null
  toggleFavorite: (code: string) => void
}
```

---

## 7. API Routes — Architecture propre

### 7.1 Router Factory

Chaque API route utilise un factory qui automatise :

```typescript
// src/lib/api-router.ts
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

type Handler<TInput, TOutput> = (
  input: TInput,
  context: { userId: string; tenantId: string; role: string; req: NextRequest }
) => Promise<{ data: TOutput } | { error: ApiError }>

interface ApiError {
  code: string
  message: string
  details?: unknown
  status: number
}

export function createRoute<TInput, TOutput>(config: {
  schema?: z.ZodSchema<TInput>
  requireAuth?: boolean
  requireRole?: string[]
  rateLimit?: { windowMs: number; maxRequests: number }
  handlers: {
    GET?: Handler<TInput, TOutput>
    POST?: Handler<TInput, TOutput>
    PUT?: Handler<TInput, TOutput>
    PATCH?: Handler<TInput, TOutput>
    DELETE?: Handler<TInput, TOutput>
  }
}) {
  // ... returns standard Next.js route handlers with:
  // - Auth check via getServerSession()
  // - Role check
  // - Zod validation
  // - Rate limiting
  // - Structured error response
  // - Logging
}
```

### 7.2 Exemple d'API route

```typescript
// src/app/api/v1/modules/route.ts
import { createRoute } from '@/lib/api-router'
import { z } from 'zod'
import { db } from '@/lib/db'

export const GET = createRoute({
  requireAuth: true,
  handlers: {
    GET: async (_, { userId, tenantId }) => {
      const modules = await db.appModule.findMany({
        where: { tenantId, isActive: true },
        orderBy: { sortOrder: 'asc' },
      })
      return { data: modules }
    },
  },
})
```

### 7.3 Format de réponse standardisé

```typescript
// Succès
{ "data": { ... } }

// Erreur
{
  "error": {
    "code": "MODULE_NOT_FOUND",
    "message": "Le module demandé n'existe pas",
    "details": { "moduleCode": "nonexistent" },
    "status": 404
  }
}
```

### 7.4 Liste des API routes V2

```
/api/v1/
├── auth/
│   ├── login         POST   (authentification)
│   ├── register      POST   (inscription)
│   ├── logout        POST   (déconnexion)
│   └── me            GET    (profil courant)
├── modules/
│   ├── list          GET    (modules actifs du tenant)
│   ├── [code]        GET    (détail module)
│   └── progress      GET    (progression par phase)
├── parcours/
│   ├── profil        GET/PUT
│   ├── projet        GET/POST
│   ├── vision        GET/POST
│   ├── riasec        GET/POST
│   ├── kiviat        GET/POST
│   ├── motivations   GET/POST
│   ├── cv            POST   (upload)
│   └── zero-draft    GET/POST
├── strategie/
│   ├── marche        GET/POST
│   ├── juridique     GET/POST
│   ├── financier     GET/POST
│   ├── creasim       GET/POST
│   ├── business-plan GET/POST
│   ├── executive-summary GET/POST
│   ├── pitch-deck    GET/POST
│   ├── bp-audit      GET/POST
│   ├── financement   GET/POST
│   └── go-nogo       GET/POST
├── ecosysteme/
│   ├── annuaire      GET    (avec filtres)
│   ├── forum         GET/POST
│   ├── forum/[id]    GET/PUT/DELETE
│   ├── mentorat      GET/POST
│   ├── evenements    GET    (proxy FT)
│   ├── offres        GET    (proxy FT)
│   ├── metiers       GET    (proxy FT)
│   ├── entreprises   GET    (proxy FT)
│   ├── aides         GET    (proxy FT)
│   ├── formations    GET    (proxy FT)
│   ├── agences       GET    (proxy FT)
│   └── statistiques  GET    (proxy FT)
├── pilotage/
│   ├── tremplin      GET/POST
│   ├── passeport     GET/POST
│   ├── certifications GET
│   ├── gestion       GET/POST
│   ├── marketing     GET/POST
│   └── competence-bridge GET/POST
├── ai/
│   ├── chat          POST   (chatbot contextual)
│   ├── generate-bp   POST   (génération BP)
│   ├── improve       POST   (amélioration section)
│   └── advice        POST   (conseil financier/juridique)
├── export/
│   ├── pdf           POST
│   ├── docx          POST
│   └── xlsx          POST
├── admin/
│   ├── stats         GET
│   ├── users         GET/POST
│   ├── users/[id]    GET/PUT/DELETE
│   ├── modules       GET/PUT
│   ├── organizations GET/POST
│   └── analytics     GET
├── notifications/
│   ├── list          GET
│   └── [id]/read     POST
└── webhooks/
    └── stripe        POST
```

---

## 8. Authentification & Sécurité (V2)

### 8.1 Auth — NextAuth v5

```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user || !user.isActive) return null
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.firstName,
          role: user.role,
          tenantId: user.tenantId,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.tenantId = token.tenantId as string
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login?error=true',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 jours
  },
  secret: process.env.NEXTAUTH_SECRET,
})
```

### 8.2 Middleware par rôle

```typescript
// src/middleware.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/register', '/blog', '/actualites', ...]

const ROLE_ROUTES: Record<string, string[]> = {
  '/bureau': ['BENEFICIARY', 'COUNSELOR', 'ADMIN'],
  '/conseiller': ['COUNSELOR', 'ADMIN'],
  '/admin': ['ADMIN'],
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Public routes
  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.next()
  }

  // Check role-based access
  const session = req.auth
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  for (const [route, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(route)) {
      if (!roles.includes(session.user.role)) {
        return NextResponse.redirect(new URL('/bureau', req.url))
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)'],
}
```

### 8.3 Checklist sécurité V2

| Mesure | V1 | V2 |
|--------|----|----|
| HttpOnly cookies | ❌ (localStorage) | ✅ NextAuth default |
| CSRF protection | ❌ (jamais vérifié) | ✅ SameSite + Origin |
| Rate limiting | ⚠️ (in-memory) | ✅ Redis/Upstash |
| Input validation | ⚠️ (partiel) | ✅ Zod sur chaque endpoint |
| SQL injection | ✅ (Prisma) | ✅ (Prisma) |
| XSS | ❌ (Markdown non échappé) | ✅ DOMPurify + CSP |
| Password hashing | ✅ (bcryptjs) | ✅ (bcryptjs) |
| JWT signing | ❌ (base64) | ✅ NextAuth JWT |
| Security headers | ⚠️ (partiel) | ✅ Complets + CSP |
| Audit logging | ⚠️ (partiel) | ✅ Chaque action critique |
| Environment validation | ❌ (crash) | ✅ Health check + graceful |
| CORS | ⚠️ (non configuré) | ✅ Origin whitelist |

---

## 9. UI/UX — Navigation & Flux

### 9.1 Dashboard d'accueil (Bureau Virtuel)

Le dashboard est le **point d'entrée après connexion**. Il présente :

1. **Barre de progression du parcours** (pipeline visuel)
2. **KPIs personnalisés** (progression, score BP, prochaines étapes)
3. **Actions recommandées** (basées sur l'étape courante)
4. **Dernières activités** (historique récent)
5. **Fil d'actualité IA** (news, événements, suggestions)

### 9.2 Pipeline visuel (Kanban)

Au lieu des étapes numérotées fixes du V1, le V2 propose un pipeline visuel type Kanban :

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│  DÉCOUVERTE │  PROFILAGE  │  STRATÉGIE  │ ÉCOSYSTÈME  │  LANCEMENT  │
│   ● 60%     │   ○ 0%      │   ○ 0%      │   ○ 0%      │   🔒 0%     │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ ✅ Profil   │ 🔒 Mon Projet│ 🔒 Marché  │ 🔒 Annuaire │ 🔒 Tremplin │
│ ✅ RIASEC   │ 🔒 Vision   │ 🔒 Juridique│ 🔒 Forum   │ 🔒 Passeport│
│ 🔄 Kiviat   │ 🔒 Brouillon│ 🔒 Financier│ 🔒 Mentorat│ 🔒 Certif. │
│ ○  Motiv.   │ 🔒 BMC      │ 🔒 CréaSim │ 🔒 Aides   │             │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
● = complété  🔄 = en cours  ○ = accessible  🔒 = verrouillé
```

### 9.3 IA Assistant contextual

L'assistant IA n'est pas un onglet séparé. Il est **contextuel** :
- Sur la page BP : "Améliore ma section marché"
- Sur la page financière : "Quelles aides suis-je éligible ?"
- Sur le dashboard : "Résume ma progression"

Implémentation : FAB flottant en bas à droite, qui s'ouvre en slide-in panel et injecte automatiquement le contexte de la page courante.

### 9.4 Onboarding intelligent

```
Étape 1 : "Quel est votre projet ?"
┌────────────────────────────────────────┐
│  👤 Je suis : [Décrivez-vous en 2 mots]│
│  💡 Mon idée : [Décrivez votre projet] │
│  🏢 Secteur : [Sélectionnez]           │
│  📍 Région : [Bretagne]                │
└────────────────────────────────────────┘

Étape 2 : "Où en êtes-vous ?"
┌────────────────────────────────────────┐
│  [💡 J'ai une idée]                    │
│  [📝 J'ai commencé à structurer]       │
│  [🔍 J'ai validé mon marché]          │
│  [💼 Je cherche des financements]      │
│  [🚀 Je suis prêt à immatriculer]      │
└────────────────────────────────────────┘

Étape 3 : "Votre espace est prêt !"
┌────────────────────────────────────────┐
│  ✅ Parcours personnalisé configuré    │
│  ✅ Outils recommandés activés         │
│  ✅ Conseiller BGE assigné             │
│                                        │
│  [Entrer dans mon bureau virtuel]      │
└────────────────────────────────────────┘
```

---

## 10. Scaling — 100k+ utilisateurs

### 10.1 Architecture de déploiement

```
                    ┌─────────────┐
                    │  Cloudflare │ (CDN + WAF + Cache)
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │  Load Bal.  │ (Railway / Fly.io / Vercel)
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────┴──┐  ┌─────┴───┐  ┌────┴────┐
       │ Server 1│  │ Server 2│  │ Server N│ (auto-scale)
       │ Next.js │  │ Next.js │  │ Next.js │
       └────┬────┘  └────┬────┘  └────┬────┘
            │            │            │
       ┌────┴────────────┴────────────┴────┐
       │         PostgreSQL (RDS)          │
       │    (read replicas + primary)     │
       └─────────────────────────────────┘
                    │
       ┌────────────┴────────────┐
       │      Redis (Upstash)    │
       │  (sessions, rate limit, │
       │   cache, real-time)     │
       └─────────────────────────┘
```

### 10.2 Optimisations performance

| Technique | Cible | Impact |
|-----------|-------|--------|
| **ISR** | Pages publiques (landing, blog) | TTFB < 200ms |
| **React Query** | Données utilisateur | Cache 5min, stale-while-revalidate |
| **Streaming SSR** | Pages bureau virtuel | TTI < 2s |
| **Edge functions** | Middleware, redirections | < 50ms |
| **CDN** | Assets statiques, images | Global < 100ms |
| **DB Connection Pool** | Prisma + PgBouncer | Max 100 conn par instance |
| **Read replicas** | Queries en lecture seule | 3x throughput |
| **Image optimization** | next/image + Sharp | 50-70% size reduction |
| **Bundle splitting** | Routes App Router | < 200KB initial JS |
| **Font optimization** | next/font (Geist) | Zero layout shift |

### 10.3 Métriques cibles

| Métrique | Cible | Monitoring |
|----------|-------|------------|
| TTFB (Time to First Byte) | < 200ms | Vercel Analytics |
| FCP (First Contentful Paint) | < 1.5s | Web Vitals |
| LCP (Largest Contentful Paint) | < 2.5s | Web Vitals |
| CLS (Cumulative Layout Shift) | < 0.1 | Web Vitals |
| INP (Interaction to Next Paint) | < 200ms | Web Vitals |
| API P95 latency | < 500ms | Datadog/Sentry |
| Error rate | < 0.1% | Sentry |
| Uptime | 99.9% | UptimeRobot |

### 10.4 Estimation de charge

```
100 000 utilisateurs/an ≈ 274 utilisateurs/jour (moyenne)
├── Utilisateurs actifs simultanés (peak) : ~500
├── Requêtes HTTP/seconde (peak) : ~100
├── Requêtes DB/seconde (peak) : ~50
├── Appels IA/seconde (peak) : ~10
├── Storage (uploads, CV, exports) : ~50 GB/an
└── Bandwidth : ~500 GB/an
```

---

## 11. Équipe d'agents — Composition idéale

### 11.1 Vue d'ensemble

Pour un projet de cette envergure, l'équipe d'agents idéale se compose de **7 agents spécialisés**, organisés en **4 vagues de travail** :

```
VAGUE 1 — Fondations (parallèle)
├── 🏗️ Architect Agent (orchestrateur)
├── 🎨 Frontend Design Agent
├── 🔐 Security Agent
└── 🗄️ Database Agent

VAGUE 2 — Core Features (parallèle)
├── 📋 Parcours Agent
├── 📊 Strategy Agent
└── 🌍 Ecosystem Agent

VAGUE 3 — Advanced Features (séquentiel)
├── 🤖 AI Agent
├── 🏢 Admin Agent
└── 📈 Analytics Agent

VAGUE 4 — Polish & QA (séquentiel)
├── 🧪 QA Agent
├── 📱 Responsive Agent
└── ♿ Accessibility Agent
```

### 11.2 Détail des agents

#### Agent 1 : 🏗️ Architect (Full-Stack Lead)
**Rôle** : Orchestrateur principal, définit l'architecture, coordonne les autres agents
**Compétences** :
- Next.js 16 App Router, TypeScript strict, Prisma
- Architecture multi-tenant, API design
- CI/CD, deployment, monitoring
**Responsabilités** :
- Configurer le projet from-scratch (package.json, tsconfig, ESLint, Tailwind)
- Définir les layouts (root, auth, bureau, conseiller, admin)
- Créer le router factory et les utilities partagées
- Implémenter le système d'authentification (NextAuth v5)
- Configurer Prisma, les seed scripts, les migrations
- Définir les interfaces TypeScript globales
- Review le code de tous les autres agents

#### Agent 2 : 🎨 Frontend Design (UI/UX Lead)
**Rôle** : Design system, composants réutilisables, landing page, responsive
**Compétences** :
- Tailwind CSS 4, shadcn/ui, Framer Motion
- Design tokens, accessibility, responsive design
- Next.js UI patterns (loading, error, suspense)
**Responsabilités** :
- Créer le design system (tokens, palette, typographie)
- Implémenter la landing page (hero, sections, footer)
- Créer les composants UI réutilisables (si non dans shadcn)
- Implémenter le layout bureau virtuel (sidebar, topbar, breadcrumb)
- Composants de données (tableaux, cartes, graphiques)
- Animations et transitions
- Mobile-first responsive

#### Agent 3 : 🔐 Security Agent
**Rôle** : Sécurité de bout en bout, validation, rate limiting, audit
**Compétences** :
- OWASP Top 10, JWT, CSRF, XSS, CORS
- Rate limiting, input validation, audit logging
**Responsabilités** :
- Configurer le middleware de sécurité
- Implémenter le rate limiting (Redis)
- Créer les Zod schemas de validation
- Configurer les headers de sécurité (CSP, HSTS, X-Frame)
- Audit logging system
- Tests de sécurité automatisés

#### Agent 4 : 🗄️ Database Agent
**Rôle** : Schéma Prisma, seed data, migrations, optimisations
**Compétences** :
- Prisma ORM, PostgreSQL, index tuning
- Data modeling, normalisation
**Responsabilités** :
- Implémenter le schéma Prisma V2 (35 modèles)
- Scripts de seed (données de démo + production)
- Index stratégiques
- Procédures de migration
- Connection pooling (PgBouncer)

#### Agent 5 : 📋 Parcours Agent (Diagnostic Features)
**Rôle** : Modules de découverte et profiling
**Responsabilités** :
- Profil créateur (CRUD)
- Questionnaire Mon Projet (~60 questions)
- Test RIASEC (6 profils, quiz interactif)
- Radar Kiviat (8 axes, visualisation SVG)
- Motivations (échelle de Likert)
- Jeu d'aspirations (swipe cards)
- Brouillon IA (Zero Draft)
- BMC (Business Model Canvas draggable)

#### Agent 6 : 📊 Strategy Agent (Business Planning)
**Rôle** : Modules de stratégie et Business Plan
**Responsabilités** :
- Analyse de marché (IA + FT API)
- Statut juridique (simulateur comparatif)
- Prévisions financières (tableaux dynamiques)
- Simulateur CréaSim (sliders, scénarios)
- Business Plan IA (éditeur 22 sections)
- Executive Summary, Pitch Deck
- Audit BP (scoring automatique)
- Plan de financement (aides + investissements)

#### Agent 7 : 🌍 Ecosystem Agent (Social & FT Integration)
**Rôle** : Communauté et intégrations France Travail
**Responsabilités** :
- Annuaire d'acteurs (search, filters, map)
- Forum (CRUD discussions, replies, modération)
- Mentorat (matching, requests, sessions)
- 9 APIs France Travail (proxy, cache, pagination)
- Événements, offres, formations, aides

#### Agent 8 : 🤖 AI Agent
**Rôle** : Intégration IA conversationnelle
**Responsabilités** :
- Chat IA contextuel (porteur + conseiller)
- Génération BP (22 sections structurées)
- Amélioration de sections (accept/reject)
- Conseils financiers et juridiques IA
- Pipeline : Questionnaire → BP → Pitch → Summary

#### Agent 9 : 🏢 Admin Agent
**Rôle** : Interface d'administration
**Responsabilités** :
- Dashboard admin (stats, KPIs)
- Gestion utilisateurs (CRUD, rôles)
- Gestion modules (toggle, config)
- CMS contenus (articles, pages)
- Facturation et abonnements

#### Agent 10 : 🧪 QA Agent
**Rôle** : Tests, lint, performance
**Responsabilités** :
- Tests unitaires (Vitest)
- Tests d'intégration API
- Lint strict (ESLint + Biome)
- Bundle analysis
- Performance audit (Lighthouse)
- Tests de charge (k6)

### 11.3 Plan de travail par vague

| Vague | Durée | Agents (parallèle) | Livrables |
|-------|-------|---------------------|-----------|
| **V0** | 1 jour | Architect seul | Project setup, auth, layouts, DB schema |
| **V1** | 3-4 jours | Architect + Frontend + Security + DB | Landing page, bureau layout, auth, seed data, design system |
| **V2** | 5-6 jours | Parcours + Strategy + Ecosystem (parallel) | 25+ modules fonctionnels |
| **V3** | 3-4 jours | AI + Admin (parallel) | Chat IA, génération BP, admin panel |
| **V4** | 2-3 jours | QA + Responsive + A11y | Tests, responsive, accessibilité |

**Total estimé** : 14-18 jours de travail agent (soit ~3-4 semaines humaines équivalent)

---

## 12. Phases de développement

### Phase 0 : Setup & Architecture (Day 1)

```bash
# 1. Initialiser le projet Next.js 16
bunx create-next-app@latest creapulse-v2 --typescript --tailwind --eslint --app --src-dir

# 2. Installer les dépendances core
bun add next-auth@beta @prisma/client zustand @tanstack/react-query
bun add zod react-hook-form @hookform/resolvers
bun add framer-motion lucide-react recharts
bun add bcryptjs jsonwebtoken
bun add z-ai-web-dev-sdk
bun add sonner next-themes

# 3. Installer les dépendances dev
bun add -D prisma @types/bcryptjs @types/jsonwebtoken
bun add -D @tailwindcss/postcss tailwindcss tw-animate-css

# 4. Configurer Prisma
bunx prisma init
# → Écrire le schéma V2 (35 modèles)
bunx prisma db push

# 5. Configurer ESLint strict
# → next.config.ts, .eslintrc, tsconfig.json

# 6. Créer les layouts de base
# → src/app/layout.tsx (root)
# → src/app/(auth)/layout.tsx
# → src/app/(bureau)/layout.tsx
# → src/app/(conseiller)/layout.tsx
# → src/app/(admin)/layout.tsx

# 7. Configurer NextAuth
# → src/lib/auth.ts
# → src/middleware.ts

# 8. Vérifier : bun run lint && bun run dev
```

### Phase 1 : Landing Page & Auth (Days 2-3)

- [ ] Landing page (hero, sections, footer)
- [ ] Pages d'authentification (login, register, forgot password)
- [ ] Onboarding (3 étapes)
- [ ] Design system (tokens, composants custom)
- [ ] Navigation responsive

### Phase 2 : Bureau Virtuel — Core (Days 4-6)

- [ ] Layout bureau virtuel (sidebar, topbar, breadcrumb)
- [ ] Dashboard d'accueil (KPIs, pipeline visuel)
- [ ] Profil créateur
- [ ] Questionnaire Mon Projet
- [ ] Test RIASEC
- [ ] Radar Kiviat
- [ ] Motivations

### Phase 3 : Stratégie & BP (Days 7-10)

- [ ] Analyse de marché
- [ ] Statut juridique
- [ ] Prévisions financières
- [ ] Simulateur CréaSim
- [ ] Business Plan IA (éditeur)
- [ ] Executive Summary
- [ ] Pitch Deck
- [ ] Audit BP
- [ ] Plan de financement

### Phase 4 : Écosystème & Communauté (Days 11-13)

- [ ] Annuaire d'acteurs
- [ ] Forum communautaire
- [ ] Mentorat
- [ ] 9 APIs France Travail
- [ ] Événements, offres, formations

### Phase 5 : IA & Avancé (Days 14-16)

- [ ] Chat IA contextuel (FAB flottant)
- [ ] Génération BP par IA
- [ ] Amélioration de sections
- [ ] Passeport Entrepreneurial
- [ ] Tremplin (Go/No-Go)
- [ ] Certifications
- [ ] Gestion quotidienne (post-création)
- [ ] IA Marketing

### Phase 6 : Admin & Polish (Days 17-18)

- [ ] Dashboard admin
- [ ] Gestion utilisateurs
- [ ] Gestion modules
- [ ] CMS contenus
- [ ] Exports (PDF, DOCX, XLSX)
- [ ] Responsive QA
- [ ] Accessibilité RGAA
- [ ] Performance audit
- [ ] Documentation

---

## 13. Checklist qualité & Gates

### Gate 0 : Project Setup ✅

- [ ] `bun run lint` passe avec 0 erreurs
- [ ] `bun run dev` démarre sans erreur
- [ ] Prisma generate réussit
- [ ] Authentification fonctionnelle (login/register/logout)
- [ ] Middleware protège les routes correctement
- [ ] Environment variables documentées dans `.env.example`

### Gate 1 : Landing & Auth ✅

- [ ] Landing page responsive (320px → 1440px)
- [ ] Login/register fonctionnels
- [ ] Onboarding 3 étapes
- [ ] Password reset fonctionnel
- [ ] Lighthouse Performance > 90
- [ ] Aucune console error

### Gate 2 : Bureau Virtuel Core ✅

- [ ] Sidebar fonctionnelle avec navigation
- [ ] Dashboard affiche les KPIs
- [ ] Pipeline visuel montre la progression
- [ ] 5 premiers modules fonctionnels (profil, projet, riasec, kiviat, motivations)
- [ ] Auto-save sur tous les formulaires
- [ ] TanStack Query gère loading/error/success
- [ ] Mobile responsive

### Gate 3 : Stratégie & BP ✅

- [ ] 9 modules stratégie fonctionnels
- [ ] Génération IA du BP (22 sections)
- [ ] Éditeur BP avec sauvegarde
- [ ] Export DOCX/PDF fonctionnels
- [ ] CréaSim fonctionne avec sliders temps réel
- [ ] Score BP calculé automatiquement

### Gate 4 : Écosystème ✅

- [ ] 9 APIs France Travail fonctionnelles
- [ ] Forum CRUD complet
- [ ] Annuaire avec recherche
- [ ] Mentorat (request → accept → session)
- [ ] Pagination sur toutes les listes

### Gate 5 : IA & Avancé ✅

- [ ] Chat IA contextuel (injecte le contexte de la page)
- [ ] Génération/amélioration de sections BP
- [ ] Passeport entrepreneurial (export PDF)
- [ ] Tremplin (Go/No-Go)
- [ ] Tous les 50 modules fonctionnels

### Gate 6 : Release ✅

- [ ] Admin panel complet
- [ ] Aucun `console.error` en production
- [ ] Lighthouse : Perf > 90, A11y > 95, SEO > 95
- [ ] Bundle JS < 200KB initial
- [ ] API P95 < 500ms
- [ ] Aucune vulnérabilité connue (npm audit)
- [ ] Toutes les routes protégées testées
- [ ] Documentation technique à jour

---

## 14. Risques & Mitigation

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Scope creep** (trop de features) | Haute | Critique | Gate system strict, MVP first |
| **Performance dégradée** (100k users) | Moyenne | Haute | Load testing dès Phase 2, CDN, Redis |
| **IA SDK breaking change** | Moyenne | Haute | Abstraction layer sur z-ai-web-dev-sdk, fallback rules |
| **France Travail API downtime** | Moyenne | Moyenne | Cache des réponses, graceful degradation |
| **Schema Prisma incohérent** | Moyenne | Haute | Design first, migration strategy |
| **Agent context overflow** (trop de code) | Haute | Critique | Modular development, one agent per domain |
| **Auth bugs** (session, logout) | Moyenne | Critique | Tests automatisés, auth edge cases |
| **Mobile UX pauvre** | Haute | Moyenne | Mobile-first dès le début, testing sur vrais devices |
| **Accessibility insuffisante** | Moyenne | Haute | Agent dédié A11y, tests RGAA |
| **Dependabot vulnerabilities** | Moyenne | Moyenne | CI auto-audit, semantic versioning strict |

---

## Annexes

### A. Variables d'environnement (.env.example)

```env
# Application
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/creapulse

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# France Travail API
FT_CLIENT_ID=
FT_CLIENT_SECRET=

# AI (z-ai-web-dev-sdk)
ZAI_API_KEY=

# Stripe (billing)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=

# Email (Resend)
RESEND_API_KEY=

# Monitoring
SENTRY_DSN=
```

### B. Scripts utiles

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "format": "biome format --write .",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "typecheck": "tsc --noEmit",
    "analyze": "ANALYZE=true next build"
  }
}
```

### C. Conventions de code

1. **Nommage** : PascalCase composants, camelCase fonctions/variables, snake_case DB
2. **Imports** : Absolute (`@/components/...`), pas de relative deep (`../../../`)
3. **Composants** : Un composant par fichier, export default
4. **Types** : Interfaces pour les objets, types pour les unions
5. **API routes** : Toujours utiliser le router factory
6. **Error handling** : try/catch sur TOUT, message en français pour l'utilisateur
7. **Comments** : JSDoc sur les fonctions publiques, pas de commentaires évidents
8. **Git** : Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)

### D. Dépendances optimisées

**Essentielles (core)** :
```
next, react, react-dom, typescript
@prisma/client, prisma
next-auth@beta
tailwindcss, @tailwindcss/postcss
zustand, @tanstack/react-query
zod, react-hook-form, @hookform/resolvers
framer-motion, lucide-react, recharts
bcryptjs
sonner, next-themes
```

**Conditionnelles (selon les modules)** :
```
z-ai-web-dev-sdk    # IA features
docx                # Export DOCX
xlsx                # Export XLSX
pdf-parse           # Parse CV
mammoth             # Parse DOCX CV
sharp               # Image optimization
```

**Supprimées vs V1** (inutiles ou remplacées) :
```
jsonwebtoken        # → Remplacé par NextAuth JWT
next-intl           # → Pas de i18n (FR only)
@mdxeditor/editor   # → Trop lourd, markdown suffit
react-resizable-panels # → Utilisé dans 1 composant
@reactuses/core     # → Peu utilisé, customs hooks
@tanstack/react-table # → Utiliser shadcn DataTable
cmdk                # → Utiliser shadcn Command
embla-carousel-react # → Utiliser shadcn Carousel
vaul                # → Utiliser shadcn Dialog
```

---

> **Ce document est le spec fonctionnel et technique complet pour la reconstruction de CréaPulse V2. Il doit être lu et validé par toutes les parties prenantes avant le début du développement.**
>
> **Dernière mise à jour** : Janvier 2025
> **Version** : 2.0.0
> **Statut** : Prêt pour développement
