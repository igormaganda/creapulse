---
Task ID: 1
Agent: Main Agent
Task: Implémenter le Pipeline V3 du menu Stratégie

Work Log:
- Analyzed the existing Pipeline V2 architecture from `download/STRATEGIE-PIPELINE.md`
- Explored the full codebase: sidebar, business-plan component, sync-simulators API, pipeline-status API, bureau-store
- Created Strategy Store (Zustand): `src/lib/stores/strategy-store.ts` — unified state management for 7 modules, section provenance, health metrics, recommendations
- Created Pipeline V3 API: `src/app/api/pipeline-v3/route.ts` — GET (full status) + POST (incremental sync-module, refresh)
- Created Pipeline V3 Overview Dashboard: `src/components/bureau/modules/pipeline-v3-overview.tsx` — visual pipeline with 4 phases, flow diagram, recommendations panel, provenance grid
- Integrated into `src/components/bureau/bureau-layout.tsx` — dynamic import + routing (PipelineV3Overview replaces SectionOverview for stratégie section)
- Updated sidebar (`src/components/bureau/sidebar.tsx`) — added "V3" badge on Stratégie group, NavGroup type extended
- Created comprehensive V3 architecture document: `download/STRATEGIE-PIPELINE-V3.md`

Stage Summary:
- **3 new files** created: strategy-store.ts, pipeline-v3/route.ts, pipeline-v3-overview.tsx
- **2 files modified**: bureau-layout.tsx (routing), sidebar.tsx (V3 badge)
- **1 document created**: download/STRATEGIE-PIPELINE-V3.md (~1100 lines)
- All lint checks pass with zero errors
- Dev server compiles successfully
- Pipeline V3 is now the default view when clicking "Stratégie" in the sidebar

---
Task ID: 2
Agent: Main Agent
Task: Audit bugs et améliorations du Pipeline V3

Work Log:
- Audit complet du Pipeline V3 : lecture de tous les fichiers (strategy-store, pipeline-v3 API, pipeline-v3-overview, bureau-layout, sidebar, prisma schema, auth, db, api-response)
- Exécution de `bun run lint` — 0 erreurs
- 5 bugs identifiés et corrigés :
  1. **Navigation 'parcours' cassée** — `handleNavigate('parcours')` naviguait vers module inexistant. Fix : redirection vers `setSection('parcours') + setModule('mon-projet')`
  2. **`syncModule` retournait `true` même si API échouait** — `return true` était en dehors du check `json.success`. Fix : déplacé dans le block conditionnel
  3. **`handleRefresh` affichait toast succès sans vérifier** — Fetch silencieux + toast immédiat. Fix : vérification `res.ok && json.success`, toasts d'erreur appropriés
  4. **Phase Parcours toujours 0%** — Aucun module `phase='parcours'` dans le store, `getPhaseProgress('parcours')` retournait 0. Fix : calcul depuis `phaseModules` mock avec complétion dérivée des données simulateurs
  5. **`handleSyncModule` jamais appelé** — Pas de bouton sync dans l'UI. Fix : ajout boutons ▶ par module (simulateurs uniquement, hover reveal)
- 3 améliorations appliquées :
  1. **Timestamp réel** dans le footer (`lastFullSync` formaté en fr-FR au lieu de "récent"/"jamais")
  2. **Déduplication des types** — Création de `src/lib/pipeline-types.ts` (types partagés + constantes), mise à jour store + API pour importer depuis fichier unique
  3. **Boutons sync interactifs** avec état `syncingModule` pour feedback visuel pendant la sync

Stage Summary:
- **1 nouveau fichier** : `src/lib/pipeline-types.ts` (types + constantes partagées)
- **3 fichiers modifiés** : `pipeline-v3-overview.tsx`, `strategy-store.ts`, `pipeline-v3/route.ts`
- Tous les bugs corrigés, zéro régression lint
- Dev server compile sans erreur

---
Task ID: 3
Agent: Main Agent
Task: Verify BP demo and IA integration

Work Log:
- **Business Plan Demo 22 parties** — Vérifié `src/app/api/export/demo/business-plan/route.ts` (~1200 lignes)
  - ✅ 22 sections complètes : couverture, TDM, résumé op., équipe, projet, marché, demande, segmentation, concurrence, stratégie marketing, plan commercial, politique de prix, plan de communication, organisation, statut juridique, plan de financement, compte de résultat 3 ans, trésorerie, seuil de rentabilité, investissements, SWOT, rétroplanning
  - ✅ Données réalistes pour "EcoVerre Île-de-France" (recyclage de verre)
  - ✅ Tableaux financiers, segmentation B2B/B2C, analyse concurrentielle, 4 phases rétroplanning
  - ✅ GET handler sans auth (public demo), fallback name si DB indisponible
- **PDF Cover Page GIDEF** — Vérifié `src/lib/pdf-utils.ts` → `drawCoverPage()`
  - ✅ Badge GIDEF orange (`#FF6B35`) avec texte blanc
  - ✅ Sous-titre "Île-de-France" sous le badge
  - ✅ Branding CreaPulse dans footer "CreaPulse V2 — GIDEF Île-de-France — Document confidentiel"
- **IA FAB (Floating Action Button)** — Vérifié `src/components/bureau/ia-assistant.tsx` + `src/app/page.tsx`
  - ✅ IAAssistant rendu comme FAB (bouton flottant bottom-right avec gradient teal, animation ping, z-[9999])
  - ✅ Chat panel responsive (full-screen mobile, 400px desktop)
  - ✅ Chat contextuel par module via maps `greetings` et `suggestions` (creasim, riasec, mon-projet, business-plan, annuaire, forum, pepites, creascope)
  - ✅ Appels via `/api/ia` (POST) — route serveur-side utilisant `callZAI` (z-ai-web-dev-sdk), PAS client-side
  - ✅ Portal via `createPortal(document.body)` pour éviter stacking-context issues
  - ✅ Module Badge affiché dans le header du chat
- **File Upload** — Vérifié `src/components/bureau/file-upload.tsx` + `src/components/bureau/modules/profil-createur.tsx`
  - ✅ Onglet "CV" avec upload drag-and-drop (.pdf, .doc, .docx, max 5 Mo)
  - ✅ Section "Mes documents" avec FileUpload réutilisable (.pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png, .webp, max 10 Mo, 5 fichiers)
  - ⚠️ **BUG CRITIQUE** : Le composant appelle `/api/upload` mais cette route n'existait pas
  - **FIX** : Créé `src/app/api/upload/route.ts` — POST (upload), GET (download), DELETE (remove)
  - **FIX** : Ajouté modèle `UserFile` dans `prisma/schema.prisma` — stockage en base64 dans la DB (pas filesystem)
  - **FIX** : Ajouté relation `userFiles UserFile[]` sur le modèle User
- **Zod on /api/auth/login** — Vérifié `src/app/api/auth/login/route.ts`
  - ✅ Schema Zod : `loginSchema` avec email validation et password min 1
  - ✅ Erreurs field-specific via `fieldErrors` map dans la réponse
  - ✅ Rate limiting IP (10 tentatives / 15 min)
- **Dockerfile** — Vérifié `Dockerfile` + `.dockerignore`
  - ✅ Multi-stage build : deps (alpine) → builder → runner
  - ✅ Production runner : user nextjs non-root, standalone output
  - ✅ `.dockerignore` existe (node_modules, .next, .git, .env, *.md)
- **Pipeline V3 Overview** — Vérifié `src/components/bureau/modules/pipeline-v3-overview.tsx`
  - ✅ 4 phases : Parcours, Simulateurs, Hub Central, Livrables
  - ✅ 7 modules : marche, juridique, financier, creasim, bmc, business-plan, pitch-deck
  - ✅ Non mocké : utilise `usePipelineV3` hook avec appels API réels (`/api/pipeline-v3`)
  - ✅ Flow diagram, provenance grid, recommendations panel, sync buttons

Stage Summary:
- **1 nouveau fichier** : `src/app/api/upload/route.ts` (POST/GET/DELETE file upload, stockage DB)
- **1 fichier modifié** : `prisma/schema.prisma` (ajout modèle `UserFile` + relation User)
- **7 fichiers vérifiés** sans modification nécessaire : business-plan/route.ts, pdf-utils.ts, ia-assistant.tsx, bureau-layout.tsx, profil-createur.tsx, file-upload.tsx, login/route.ts, Dockerfile, .dockerignore, pipeline-v3-overview.tsx
- Lint passe sans erreur (`bun run lint`)
- ⚠️ Run `bunx prisma db push` or `bunx prisma migrate dev` to apply the new UserFile model

---
Task ID: 2
Agent: Verification Agent
Task: Verify conseiller routing, Mon Besoin links, actualités page, logos

Work Log:
- Audit complet du flux de connexion : login-dialog.tsx → auth store → page.tsx → bureau-layout / conseiller-layout
- Audit des liens "Mon Besoin" : hero-section, besoin-section, footer-section, navbar (page.tsx)
- Audit de la page Actualités : /actualites/page.tsx, layout.tsx, actualites-section.tsx
- Audit des logos : public/images/logo-creapulse.svg, public/images/logo-gidef.svg, navbar, footer, pdf-utils

Findings & Fixes:

1. **BUG FIX : Conseiller routing** — Après login, `handleLoginSuccess` dans `page.tsx` ouvrait TOUJOURS `BureauLayout` (espace porteur) quel que soit le rôle. Le rôle était bien retourné par l'API et stocké dans l'auth store, mais jamais utilisé pour le routage.
   - Fix `src/app/page.tsx` : ajout de `useAuthStore`, import. `handleLoginSuccess` vérifie maintenant `user.role` :
     - `COUNSELOR` → ouvre `ConseillerLayout` + set conseillerName
     - `ADMIN` → ouvre `AdminPlateformeLayout`
     - `BENEFICIARY` / défaut → ouvre `BureauLayout`
   - Fix `src/components/auth/login-dialog.tsx` : type `onLoginSuccess` enrichi avec `role?: string`, passage explicite de `userData.role` au callback

2. **BUG FIX : Mon Besoin cards** — Les 3 cartes dans `besoin-section.tsx` étaient visuellement cliquables (cursor-pointer, hover effects) mais NE navigaient nulle part (pas de Link, pas de onClick).
   - Fix `src/components/landing/besoin-section.tsx` : import `Link` from `next/link`, ajout de `href` dans les données cartes, chaque carte enveloppée dans `<Link href={card.href}>`
   - Routes : "Je découvre une idée" → `/besoin/decouvrir-idee`, "Je crée mon entreprise" → `/besoin/creer-entreprise`, "Je développe mon activité" → `/besoin/developper-activite`
   - Navbar dropdown links : déjà corrects ✅
   - Mobile menu links : déjà corrects ✅

3. **FIX : GIDEF logo external URL → local** — Le logo GIDEF dans le navbar pointait vers `https://www.gidef.org/wp-content/uploads/...` au lieu du fichier local `public/images/logo-gidef.svg`.
   - Fix `src/app/page.tsx` : remplacé les 2 occurrences (navbar desktop + mobile sheet) par `/images/logo-gidef.svg`

4. **VERIFIED OK : Actualités page** — Page complète et fonctionnelle :
   - Hero banner avec badge + titre + sous-titre
   - Category filters (8 catégories)
   - Search bar (Enter + bouton clear)
   - Article grid (3 colonnes responsive)
   - "Voir plus" pagination
   - Sheet reader pour lire un article
   - Fetch depuis API réelle `/api/articles`

5. **VERIFIED OK : Logos** —
   - `public/images/logo-creapulse.svg` ✅ existe
   - `public/images/logo-gidef.svg` ✅ existe
   - Navbar utilise `<img>` SVG ✅ (pas Zap icon)
   - Footer utilise `<img>` SVG ✅
   - `pdf-utils.ts drawCoverPage()` : badge GIDEF orange avec texte ✅

Stage Summary:
- **3 fichiers modifiés** : `page.tsx` (routing + logo), `login-dialog.tsx` (role pass-through), `besoin-section.tsx` (Link routing)
- **3 bugs corrigés** : conseiller routing, besoin cards non-linkées, GIDEF external URL
- **2 vérifications OK** : actualités page, logos
- `bun run lint` — 0 erreurs

---
Task ID: 5
Agent: Main Agent
Task: Fix sidebar scroll issue + Reduce Pepites Game from 50 to 15 questions

Work Log:
- Audit complet du sidebar (`src/components/bureau/sidebar.tsx`) pour identifier le problème de scroll
- Analyse de la structure: `motion.aside` (desktop) → `SidebarContent` → `<nav>` → `ScrollArea` (nav groups) + bottom section
- Problème identifié: `motion.aside` avait `overflow-y-auto` qui créait un contexte de scroll concurrent avec le `ScrollArea` Radix interne, empêchant la navigation dans les items du bas
- Fix Partie A: Remplacé `overflow-y-auto overflow-x-hidden` par `overflow-hidden` sur `motion.aside` — le conteneur externe ne scroll plus, seul le `ScrollArea` interne gère le scroll de la zone de navigation
- Audit complet du Pépites Game: lecture de `pepites-game.tsx`, `flash-swipe.tsx`, `questionnaire.tsx`, `scenario-challenge.tsx`, `shared.ts`, `score-summary.tsx`, `swipe-questions.ts`, `swipe-cards.ts`
- Le Questionnaire utilisait déjà `QUESTIONNAIRE_COUNT = 15` questions sélectionnées aléatoirement depuis le pool de 300 questions
- Le Flash Swipe présentait TOUTES les 60 cartes (`shuffleArray(SWIPE_CARDS)`) — réduit à 15 cartes aléatoires
- Fix Partie B: Ajout de `FLASH_SWIPE_COUNT = 15` et `shuffleArray(SWIPE_CARDS).slice(0, FLASH_SWIPE_COUNT)` dans `flash-swipe.tsx`
- Mise à jour de toutes les descriptions dans `pepites-game.tsx`:
  - Flash Swipe: "60 cartes" → "15 cartes", durée "5-8 min" → "2-3 min"
  - Questionnaire: durée "5-8 min" → "3-5 min"
  - Scenario: durée "10-15 min" → "8-12 min"
  - Bilan Complet: durée "20-30 min" → "15-20 min"
  - Bilan intro: étape 1 "60 cartes à swipper" → "15 cartes à swipper"

Stage Summary:
- **3 fichiers modifiés** : `sidebar.tsx` (overflow fix), `flash-swipe.tsx` (15 cartes), `pepites-game.tsx` (descriptions)
- **0 erreur lint**, **0 erreur TypeScript** sur les fichiers modifiés
- Scroll de la sidebar fonctionnel: le ScrollArea Radix gère correctement le défilement des groupes de navigation
- Flash Swipe réduit de 60 à 15 cartes aléatoires par session
- Questionnaire maintenu à 15 questions (déjà correct)
- Toutes les durées affichées mises à jour pour refléter le nouveau format plus court

---
Task ID: 7
Agent: Main Agent
Task: Fix /api/swipe 401 and /api/creascope/sessions 401 errors

Work Log:
- Audit complet du système d'authentification : lecture de `auth.ts`, `api-auth.ts`, `api-response.ts`, middleware, login route, auth/me route, Zustand store, login-dialog
- Audit de tous les composants frontend appelant les endpoints affectés : `flash-swipe.tsx`, `score-summary.tsx`, `creascope-pipeline.tsx`, `session-list.tsx`, `session-orchestrator.tsx`

Root Causes identifiés (3 bugs) :

1. **BUG CRITIQUE : Logout ne vide pas le Zustand store** — `page.tsx` `handleLogout` appelait `/api/auth/me` DELETE (qui efface le cookie httpOnly) mais **n'appelait jamais `useAuthStore.getState().logout()`**. Le token expiré/restant persistait dans localStorage. Au prochain chargement de page, Zustand réhydratait le token stale → composants l'envoyaient via header `Authorization: Bearer <stale-token>` → le cookie était absent/expiré → `withAuth` renvoyait 401.

2. **BUG : Pas de validation de session au chargement** — Aucun mécanisme pour vérifier si le token persisté dans le Zustand store était encore valide. Les tokens JWT expirent après 7 jours, mais le localStorage les conservait indéfiniment. Les composants utilisaient ce token expiré → 401.

3. **BUG : `credentials: 'include'` manquant + header auth manuel** — Plusieurs fetch calls (flash-swipe, score-summary, creascope session-list) construisaient manuellement les headers Authorization et omettaient `credentials: 'include'`. Cela rendait les appels fragiles : si le Zustand token était absent (pas encore réhydraté), le cookie httpOnly n'était pas explicitement garanti dans tous les chemins.

4. **BUG : `creascope-pipeline.tsx` bloquait le fetch si token Zustand absent** — La condition `if (!token || ...)` empêchait tout fetch si le token n'était pas encore réhydraté depuis localStorage, même si le cookie httpOnly était valide.

Fixes appliqués :

1. **`src/lib/auth-fetch.ts` (NOUVEAU)** — Wrapper `authFetch()` centralisé qui :
   - Inclut toujours `credentials: 'include'` (cookie httpOnly)
   - Attache automatiquement le header `Authorization: Bearer <token>` depuis le Zustand store
   - Intercepte les réponses 401 et vide le Zustand store (évite les 401 répétés)

2. **`src/lib/hooks/use-session-restore.ts` (NOUVEAU)** — Hook `useSessionRestore()` qui :
   - Appelle `/api/auth/me` au montage si un token est persisté dans le store
   - Si succès → met à jour le store avec les données fraîches du serveur
   - Si 401 → vide le store (token expiré/invalide)
   - Si erreur réseau → ne vide pas (offline = pas de problème de token)

3. **`src/app/page.tsx`** — Deux fixes :
   - `handleLogout` : ajout de `useAuthStore.getState().logout()` pour vider le store (token + user + isAuthenticated)
   - `Home` : ajout de `useSessionRestore()` pour valider le token au chargement

4. **`src/components/bureau/modules/pepites/flash-swipe.tsx`** — Remplacé `fetch('/api/swipe', { headers: { Authorization } })` par `authFetch('/api/swipe', ...)` (credentials: 'include' + auto-header + 401 interceptor)

5. **`src/components/bureau/modules/pepites/score-summary.tsx`** — Remplacé les 3 appels `fetch('/api/swipe', ...)` et `fetch('/api/swipe/questions', ...)` par `authFetch(...)` (suppression des headers manuels)

6. **`src/components/bureau/modules/creascope-pipeline.tsx`** — Trois fixes :
   - Remplacé `fetch` par `authFetch` (credentials + auto-header)
   - Supprimé le gating sur `token` Zustand (le cookie httpOnly suffit)
   - Supprimé la dépendance `token` du useCallback

7. **`src/components/bureau/modules/creascope/session-list.tsx`** — Remplacé `fetch('/api/assignments', ...)` et `fetch('/api/creascope/sessions', ...)` par `authFetch(...)`

8. **`src/components/bureau/modules/creascope/session-orchestrator.tsx`** — Remplacé `fetch('/api/creascope/sessions/${id}', ...)` par `authFetch(...)` (suppression des headers manuels + import useAuthStore inutile)

Stage Summary:
- **2 nouveaux fichiers** : `src/lib/auth-fetch.ts`, `src/lib/hooks/use-session-restore.ts`
- **7 fichiers modifiés** : `page.tsx`, `flash-swipe.tsx`, `score-summary.tsx`, `creascope-pipeline.tsx`, `session-list.tsx`, `session-orchestrator.tsx`
- **0 erreur lint**, **0 erreur TypeScript** sur les fichiers modifiés
- Tous les fetch calls vers `/api/swipe` et `/api/creascope/sessions` utilisent désormais `authFetch` avec credentials: 'include' + 401 auto-interception
- Le logout vide désormais le Zustand store (plus de token stale dans localStorage)
- Le token est validé au chargement de la page via `useSessionRestore`
- Les composants ne bloquent plus les fetch si le token Zustand n'est pas encore réhydraté (le cookie httpOnly suffit)

---
Task ID: 4
Agent: Verification Agent
Task: Verify dashboard "undefined" bug, CV upload, save projet/vision, login auth

Work Log:
- Audit du dashboard : `src/components/bureau/dashboard.tsx`, `src/app/api/dashboard/route.ts`, `src/lib/hooks/use-api-data.tsx`
- Audit du CV upload : `src/components/bureau/modules/profil-createur.tsx`, `src/app/api/profil/route.ts`, `src/components/bureau/file-upload.tsx`, `src/components/bureau/upload-store.ts`
- Audit Mon Projet save : `src/components/bureau/modules/mon-projet.tsx`, `src/app/api/projet/route.ts`
- Audit Vision save : `src/components/bureau/modules/vision.tsx`, `src/app/api/vision/route.ts`
- Audit Login auth flow : `src/app/api/auth/login/route.ts`, `src/components/auth/login-dialog.tsx`, `src/lib/zustand/store.ts`
- Audit AI Suggestions : `src/app/api/ai/suggestions/route.ts`, `src/lib/zai-helper.ts`
- Audit auth infrastructure : `src/lib/api-auth.ts`, `src/lib/api-response.ts`, `src/lib/auth.ts`

Findings & Fixes:

1. **VERIFIED OK : Dashboard "1/undefined Modules complétés"** — Le bug était déjà corrigé par un agent précédent :
   - `dynamicKpis` dans `dashboard.tsx` utilise des checks défensifs : `typeof k.totalModules === 'number' ? k.totalModules : 20` et `typeof k.modulesCompleted === 'number' ? k.modulesCompleted : 0`
   - `FALLBACK_DASHBOARD` a `modulesCompleted: 7, totalModules: 20` (jamais undefined)
   - `/api/dashboard/route.ts` retourne `totalModules: 20` (hardcodé) et `modulesCompleted: moduleResults` (count)
   - `use-api-data.tsx` utilise `credentials: 'include'` ✅

2. **BUG FIX : CV Upload "Impossible de télécharger le fichier"** — Le composant `profil-createur.tsx` et `file-upload.tsx` envoyaient des fichiers à `/api/upload` mais cette route n'existait PAS → 404 → erreur.
   - Le modèle `UserFile` existait déjà dans le Prisma schema (stockage base64 en DB)
   - Fix : Recréé `src/app/api/upload/route.ts` avec 3 méthodes :
     - POST : upload fichier en base64 dans `UserFile` table (pas filesystem), validation type/size, catégorie auto-détectée
     - GET : liste des fichiers de l'utilisateur
     - DELETE : suppression d'un fichier (vérifie ownership)
   - Utilise `withAuth()` avec proper type narrowing (`'payload' in auth`)
   - Messages d'erreur en français

3. **FIX : Login dialog `credentials: 'include'` manquant** — Le fetch vers `/api/auth/login` dans `login-dialog.tsx` n'incluait pas `credentials: 'include'`. Cela pouvait empêcher la réception du cookie de session dans certains contextes cross-origin.
   - Fix : Ajout de `credentials: 'include'` au fetch login

4. **VERIFIED OK : Save "Mon Projet"** — Flux d'authentification complet et correct :
   - Login API retourne `accessToken` dans `data.data.accessToken` ✅
   - LoginDialog stocke via `useAuthStore.getState().login(accessToken, userData)` ✅
   - Zustand persiste token dans localStorage ✅
   - `handleSave` récupère `useAuthStore((s) => s.token)` et envoie `Authorization: Bearer ${token}` ✅
   - `/api/projet/route.ts` vérifie `cookieToken || headerToken` ✅
   - Messages d'erreur en français ✅

5. **VERIFIED OK : Save "Vision"** — Même flux d'authentification correct :
   - Token récupéré depuis Zustand store ✅
   - Envoyé via `Authorization: Bearer` + `credentials: 'include'` ✅
   - API utilise `withAuth(request)` qui vérifie cookie puis header ✅
   - Messages d'erreur en français ✅

6. **VERIFIED OK : AI Suggestions** — Intégration z.ai complète et robuste :
   - Utilise `callZAI` depuis `zai-helper.ts` qui wrappe `z-ai-web-dev-sdk` avec Claude Sonnet 4 ✅
   - Fallback hiérarchique : AI → suggestions sectorielles hardcoded (12 secteurs) → suggestions par défaut ✅
   - Envoie le contexte `sector` + `activity` au modèle IA ✅
   - Ne lance jamais l'IA si `useAI === false` ✅
   - Parsing JSON robuste avec regex fallback ✅

Stage Summary:
- **1 nouveau fichier** : `src/app/api/upload/route.ts` (POST/GET/DELETE, stockage DB via UserFile)
- **1 fichier modifié** : `src/components/auth/login-dialog.tsx` (credentials: 'include')
- **5 vérifications OK** : dashboard (défensive defaults), mon-projet save (auth flow), vision save (auth flow), AI suggestions (z.ai + fallback), login auth (accessToken return)
- `prisma generate` exécuté pour régénérer le client Prisma avec le modèle UserFile
- 0 erreur TypeScript sur les fichiers modifiés
- `bun run lint` — 0 erreurs

---
Task ID: 6
Agent: Main Agent
Task: Fix BMC "Cannot access 'G' before initialization" ReferenceError

Work Log:
- Analyse approfondie du composant BMC (`src/components/bureau/modules/bmc.tsx`)
- Analyse de la chaîne d'imports : bureau-layout.tsx → dynamic imports → bmc.tsx → UI components, stores
- Vérification de l'absence de dépendances circulaires dans pipeline-types.ts, strategy-store.ts, bureau-store.ts, sidebar.tsx, topbar.tsx, dashboard.tsx, welcome.tsx, error-boundary.tsx
- Audit des 23 dynamic imports dans bureau-layout.tsx (pattern `next/dynamic`)
- Revérification des stores Zustand (useStrategyStore, useBureauStore, useAuthStore) pour des problèmes d'initialisation
- **ROOT CAUSE IDENTIFIÉE** : Temporal Dead Zone (TDZ) violation dans `bmc.tsx`
  - `handleExportPdf` (déclaré ligne 262) référence `filledCount` dans son tableau de dépendances `[filledCount]`
  - `filledCount` est déclaré PLUS BAS (ligne 280) : `const filledCount = blocks.filter(b => b.content.trim().length > 0).length`
  - En JavaScript, les déclarations `const` sont hissées mais restent dans la TDZ jusqu'à leur ligne de déclaration
  - L'évaluation de `[filledCount]` par `useCallback` échoue car `filledCount` n'est pas encore initialisé
  - Turbopack minifie `filledCount` en `G` → erreur `Cannot access 'G' before initialization`

Fix appliqué :
- Déplacement de `filledCount`, `totalCount` et `percent` AVANT les callbacks qui les référencent
- Ajout d'un commentaire explicatif : `// ─── Completion (must be declared before callbacks that reference it) ───`
- `handleExportPdf` utilise `filledCount` dans `[filledCount]` → maintenant déclaré avant
- Aucune autre instance de TDZ trouvée dans les modules bureau

Stage Summary:
- **1 fichier modifié** : `src/components/bureau/modules/bmc.tsx`
- **Bug root cause** : TDZ violation — `const filledCount` utilisé avant sa déclaration dans le dependency array de `useCallback`
- **Fix** : Déplacement de `filledCount`/`totalCount`/`percent` avant les callbacks (3 lignes déplacées)
- `bun run lint` — 0 erreurs
---
Task ID: A-B-C
Agent: Main Agent
Task: Corriger Flash Swipe (revenir à 60), vérifier Questionnaire (15), vérifier IA z.ai partout

Work Log:
- **Flash Swipe** : L'agent précédent avait incorrectement réduit les 60 cartes à 15 dans `flash-swipe.tsx`. L'utilisateur a précisé que les 60 cartes doivent rester. Fix : restauré `shuffleArray(SWIPE_CARDS)` sans slice, supprimé `FLASH_SWIPE_COUNT`.
- **Descriptions pépites** : Corrigé `pepites-game.tsx` — Bilan intro étape 1 remise à "60 cartes à swipper" (était "15 cartes" après l'erreur de l'agent).
- **Questionnaire Approfondi** : Vérifié — `questionnaire.tsx` utilise déjà `QUESTIONNAIRE_COUNT = 15` (depuis le pool de 300 questions). C'est bien le questionnaire qui est à 15, PAS le Flash Swipe.
- **CréaScope shared.ts** : Corrigé la description QUESTIONNAIRE de "50 questions adaptatives" à "15 questions adaptatives".
- **CréaScope ai-suggest API** : Corrigé le prompt QUESTIONNAIRE de "50 questions adaptatives / 15-20 minutes" à "15 questions adaptatives / 10-15 minutes".
- **IA z.ai partout** : Audit complet de toutes les routes API qui utilisent l'IA — TOUTES utilisent déjà `callZAI` via `zai-helper.ts` (z-ai-web-dev-sdk, Claude Sonnet 4) :
  - `/api/ia` (chat assistant FAB) ✅
  - `/api/bilan` (bilan IA complet) ✅
  - `/api/marche` (analyse de marché IA) ✅
  - `/api/juridique` (statut juridique IA) ✅
  - `/api/financier` (plan financier IA) ✅
  - `/api/business-plan` (business plan IA) ✅
  - `/api/bmc` (BMC IA) ✅
  - `/api/pitch-deck` (pitch deck IA) ✅
  - `/api/creascope/ai-suggest` (suggestions conseiller) ✅
  - `/api/ai/suggestions` (suggestions mon projet) ✅
  L'IA n'est JAMAIS appelée côté client — toujours via routes serveur.

Stage Summary:
- **3 fichiers modifiés** : `flash-swipe.tsx` (retour à 60 cartes), `pepites-game.tsx` (desc corrigée), `creascope/shared.ts` + `creascope/ai-suggest/route.ts` (50→15 questions dans les descriptions)
- **IA z.ai** : déjà intégrée partout côté serveur (10 routes API utilisent `callZAI`)
- 0 erreur lint sur les fichiers modifiés
- Dev server compile correctement
