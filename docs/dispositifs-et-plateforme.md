# CreaPulse — Dispositifs d'Accompagnement et Réponse Plateforme

> **Document de référence** — Version 2.0
> Plateforme CreaPulse propulsée par GIDEF Île-de-France & France Travail
> Dernière mise à jour : Juillet 2025

---

## Table des matières

1. [Introduction & périmètre du document](#1-introduction--périmètre-du-document)
2. [Architecture : deux natures de dispositifs](#2-architecture--deux-natures-de-dispositifs)
3. [PARTIE A — Dispositifs intégrés (digitalisés nativement)](#3-partie-a--dispositifs-intégrés-digitalisés-nativement)
   - 3.1 [CréaScope — Pipeline diagnostique SOP](#31-créascope--pipeline-diagnostique-sop)
   - 3.2 [Pépites Game (Activ'Créa) — Détection des compétences](#32-pépites-game-activcréa--détection-des-compétences)
   - 3.3 [PAA — Parcours d'Accompagnement des Actifs](#33-paa--parcours-daccompagnement-des-actifs)
   - 3.4 [Tremplin — Évaluation GO / NO-GO](#34-tremplin--évaluation-go--no-go)
   - 3.5 [Passeport Entrepreneurial — Certification GIDEF](#35-passeport-entrepreneurial--certification-gidef)
   - 3.6 [Tests diagnostics digitalisés (RIASEC, Kiviat, Bilan IA)](#36-tests-diagnostics-digitalisés-riasec-kiviat-bilan-ia)
4. [PARTIE B — Dispositifs externes référencés et accompagnés](#4-partie-b--dispositifs-externes-référencés-et-accompagnés)
   - 4.1 [ACRE — Aide à la Création ou Reprise d'Entreprise](#41-acre--aide-à-la-création-ou-reprise-dentreprise)
   - 4.2 [ARE / ARCE — Allocation et Aide au Retour à l'Emploi](#42-are--arce--allocation-et-aide-au-retour-à-lemploi)
   - 4.3 [NACRE — Nouvel Accompagnement pour la Création et la Reprise](#43-nacre--nouvel-accompagnement-pour-la-création-et-la-reprise)
   - 4.4 [Bpifrance — Banque Publique d'Investissement](#44-bpifrance--banque-publique-dinvestissement)
   - 4.5 [Aides régionales et locales](#45-aides-régionales-et-locales)
   - 4.6 [France Travail — APIs et données institutionnelles](#46-france-travail--apis-et-données-institutionnelles)
   - 4.7 [Réseau GIDEF — Groupement Interprofessionnel](#47-réseau-gidef--groupement-interprofessionnel)
5. [Matrice de couverture synthétique](#5-matrice-de-couverture-synthétique)
6. [Conclusion](#6-conclusion)

---

## 1. Introduction & périmètre du document

L'écosystème français de l'accompagnement à la création d'entreprise repose sur deux grandes familles de dispositifs que CreaPulse aborde de manière fondamentalement différente :

| Nature | Définition | Exemples |
|--------|-----------|----------|
| **Dispositifs intégrés** | Méthodes, outils et programmes GIDEF/France Travail qui ont été **digitalisés en modules natifs** de la plateforme | CréaScope, Activ'Créa (Pépites), PAA, Tremplin, Passeport, RIASEC, Kiviat |
| **Dispositifs externes** | Aides financières, institutions et programmes qui existent **en dehors** de la plateforme et que CreaPulse **informe, connecte et simule** | ACRE, ARE/ARCE, NACRE, Bpifrance, aides régionales, APIs France Travail |

**La distinction est essentielle :**
- Les **dispositifs intégrés** SONT la plateforme. Ils sont implémentés comme modules interactifs avec données persistantes, exports PDF, API dédiées et suivi Conseiller 360°.
- Les **dispositifs externes** sont ACCOMPAGNÉS par la plateforme : articles explicatifs, simulateurs d'éligibilité, connexions API temps réel, référencement dans l'annuaire, et suggestions de l'IA Copilote.

Ce document cartographie les deux familles et détaille précisément comment CreaPulse répond à chacune.

---

## 2. Architecture : deux natures de dispositifs

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CREA PULSE                                    │
│                                                                     │
│  ╔══════════════════════════════════════════════════════════════╗    │
│  ║  PARTIE A — DISPOSITIFS INTÉGRÉS (natifs)                    ║    │
│  ║  Ces dispositifs SONT la plateforme.                          ║    │
│  ║  Ils sont implémentés comme modules interactifs complets.     ║    │
│  ╠══════════════════════════════════════════════════════════════╣    │
│  ║                                                               ║    │
│  ║  CréaScope ◄── Pipeline SOP 5 phases (3-4h)                  ║    │
│  ║    ├── Phase 2 : Pépites Game (Activ'Créa)                   ║    │
│  ║    ├── Phase 3 : RIASEC, Kiviat, Analyse marché, Financier   ║    │
│  ║    ├── Phase 4 : Tremplin GO/NO-GO                           ║    │
│  ║    └── Phase 5 : Passeport Entrepreneurial                   ║    │
│  ║                                                               ║    │
│  ║  PAA ◄── Parcours 60 jours (orchestre 9+ sous-modules)       ║    │
│  ║  Tremplin ◄── Évaluation 7 étapes (standalone + CréaScope)   ║    │
│  ║  Passeport ◄── Certification 5 niveaux (standalone + CS P5)  ║    │
│  ║  RIASEC / Kiviat / Bilan IA ◄── Tests diagnostics            ║    │
│  ╚══════════════════════════════════════════════════════════════╝    │
│                                                                     │
│  ╔══════════════════════════════════════════════════════════════╗    │
│  ║  PARTIE B — DISPOSITIFS EXTERNES (référencés/accompagnés)   ║    │
│  ║  Ces dispositifs existent hors de la plateforme.             ║    │
│  ║  CreaPulse informe, connecte, simule et guide vers eux.      ║    │
│  ╠══════════════════════════════════════════════════════════════╣    │
│  ║                                                               ║    │
│  ║  ACRE ◄── Simulateur éligibilité (module Juridique)          ║    │
│  ║  ARE/ARCE ◄── API FT /aides + articles + calculateurs       ║    │
│  ║  NACRE ◄── API FT /aides + annuaire + article                ║    │
│  ║  Bpifrance ◄── Annuaire + forum + articles + BP             ║    │
│  ║  Aides régionales ◄── Admin contenus + articles + forum      ║    │
│  ║  FT APIs ◄── 11 routes temps réel (métiers, formations…)    ║    │
│  ║  Réseau GIDEF ◄── Branding, 60 agences, forum               ║    │
│  ╚══════════════════════════════════════════════════════════════╝    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. PARTIE A — Dispositifs intégrés (digitalisés nativement)

Ces dispositifs GIDEF / France Travail ont été **intégralement digitalisés** dans CreaPulse comme modules interactifs avec persistance des données, API dédiées, exports PDF et suivi Conseiller 360°. Ils constituent le cœur fonctionnel de la plateforme.

### 3.1 CréaScope — Pipeline diagnostique SOP

#### Le dispositif institutionnel

Le **CréaScope** est la procédure opérationnelle standardisée (SOP) du GIDEF pour le premier entretien diagnostique avec un porteur de projet. Conçue pour une durée de 3 à 4 heures, elle structure la rencontre en 5 phases séquentielles avec un chronométrage recommandé par étape.

#### La réponse CreaPulse

Le module **CréaScope** (`creascope-session.tsx`, 719 lignes + 5 composants de phase + store Zustand persisté) est la **transposition fidèle du SOP GIDEF** en environnement numérique interactif.

**5 phases implémentées :**

| Phase | Nom | Durée recommandée | Contenu digitalisé |
|-------|-----|-------------------|-------------------|
| 1 | **Accueil & Acculturation** | 20 min | Vérification profil créateur, présentation du projet, explication du déroulé |
| 2 | **Découverte (Pépites)** | 45 min | **Pépites Game (Activ'Créa)** : 60 cartes, 6 dimensions Kiviat, observation comportementale |
| 3 | **Approfondissement** | 60 min | Analyse projet, complément RIASEC, analyse de marché, simulation financière, statut juridique |
| 4 | **Synthèse & Recommandations** | 40 min | Bilan IA automatisé, discussion du bilan, **Tremplin Go/No-Go**, discussion Tremplin, recommandations |
| 5 | **Plan d'Action** | 25 min | Actions prioritaires, livrables attendus, prochain rendez-vous, **Passeport Entrepreneurial**, feedback, clôture |

**Composants techniques :**

| Composant | Fichier | Rôle |
|-----------|---------|------|
| Orchestrateur | `creascope-session.tsx` | Navigation entre phases, chronomètre, progression |
| Store | `creascope-store.ts` (564 lignes) | État persisté (Zustand), 5 phases, 22 étapes, types TremplinDecision |
| Phase Accueil | `phase-accueil.tsx` | Accueil porteur, vérification profil, présentation projet |
| Phase Découverte | `phase-decouverte.tsx` | Intègre le **Pépites Game** + observation + analyse Kiviat |
| Phase Approfondissement | `phase-approfondissement.tsx` | RIASEC, marché, financier, juridique |
| Phase Synthèse | `phase-synthese.tsx` | Bilan IA, Tremplin, recommandations |
| Phase Plan d'Action | `phase-plan-action.tsx` | Actions, livrables, Passeport, clôture |
| Liste sessions | `session-list.tsx` | Historique des sessions CréaScope |
| Pipeline UI | `creascope-pipeline.tsx` | Vue d'ensemble du pipeline dans le Bureau |
| Panel IA | `ai-suggest-panel.tsx` | Suggestions IA contextuelles par phase |
| PDF Export | `route.ts` (export/creascope-pdf) | Export de synthèse CréaScope |
| Bilan PDF | `route.ts` (export/bilan-creascope) | Bilan complet formaté |
| Stats API | `route.ts` (conseiller/creascope-stats) | Statistiques CréaScope pour le Conseiller |
| Sessions API | `route.ts` (creascope/sessions) | CRUD sessions |

**Clé :** Le CréaScope est le module le plus intégré de la plateforme car il **orchestre d'autres dispositifs intégrés** (Pépites/Activ'Créa en Phase 2, Tremplin en Phase 4, Passeport en Phase 5, RIASEC/Kiviat en Phase 3).

---

### 3.2 Pépites Game (Activ'Créa) — Détection des compétences

#### Le dispositif institutionnel

**Activ'Créa** (nommé **Pépites Game** dans la plateforme) est un outil du GIDEF conçu pour détecter les compétences entrepreneuriales d'un porteur de projet de manière ludique et interactive. Il s'appuie sur 6 dimensions clés mesurées via des jeux de cartes, des questionnaires et des mises en situation.

#### La réponse CreaPulse

Le module **Pépites Game** (`pepites-game.tsx`, 427 lignes + 3 sous-composants) est la **digitalisation complète d'Activ'Créa** avec 4 modes de jeu :

| Mode | Nom | Durée | Mécanique |
|------|-----|-------|-----------|
| 1 | **Flash Swipe** | 5-8 min | 60 cartes à swipper (pass / pépite / super pépite) sur 6 dimensions |
| 2 | **Questionnaire Approfondi** | 10-15 min | 15 questions adaptatives pour affiner le profil |
| 3 | **Challenge Scénario** | 15-20 min | 10 scénarios entrepreneuriaux réalistes avec choix multiples |
| 4 | **Bilan Complet** | 15-20 min | Les 3 modes séquentiels pour un profil exhaustif |

**6 dimensions Kiviat mesurées :**

| Dimension | Description | Couleur |
|-----------|-------------|---------|
| Leadership & Vision | Inspirer, diriger, donner une direction stratégique | Ambre |
| Gestion du stress | Performer face à la pression et l'incertitude | Sky |
| Communication | Transmettre clairement, écouter, créer des connexions | Violet |
| Résolution de problèmes | Analyser, décider, surmonter les obstacles | Rose |
| Créativité & Innovation | Imaginer, innover, penser hors cadre | Teal |
| Adaptabilité | S'adapter aux changements, pivoter, apprendre | Émeraude |

**Double intégration :**
- **Module standalone** (`pepites` dans le Bureau, section Parcours) — accessible directement
- **Phase 2 du CréaScope** (`phase-decouverte.tsx`, étape 2.1 « Lancer le Jeu de Pépites ») — intégré dans le pipeline diagnostique SOP

**Composants techniques :**

| Composant | Fichier | Rôle |
|-----------|---------|------|
| Module principal | `pepites-game.tsx` | Sélection du mode, orchestration, scoring |
| Flash Swipe | `pepites/flash-swipe.tsx` | 60 cartes swipeables avec animation Framer Motion |
| Questionnaire | `pepites/questionnaire.tsx` | 15 questions adaptatives |
| Challenge Scénario | `pepites/scenario-challenge.tsx` | 10 scénarios entrepreneuriaux |
| Score Summary | `pepites/score-summary.tsx` | Radar Kiviat + résumé par dimension |
| Données cartes | `data/swipe-cards.ts` (786 lignes) | 60 cartes, 6 dimensions, poids, scoring |
| Données questions | `data/swipe-questions.ts` | Questions adaptatives et scénarios |
| Calcul scores | `lib/kiviat-scoring.ts` | Algorithme de scoring multi-sources |

---

### 3.3 PAA — Parcours d'Accompagnement des Actifs

#### Le dispositif institutionnel

Le **Parcours d'Accompagnement des Actifs (PAA)** est un programme structuré de 60 jours cofinancé par France Travail et les réseaux d'accompagnement comme le GIDEF. Il vise les demandeurs d'emploi en projet de création ou reprise d'entreprise.

**Objectifs du PAA :**
- Identifier les difficultés rencontrées par les entrepreneurs
- Renforcer les compétences entrepreneuriales (gestion, finance, marketing)
- Sécuriser l'entrée sur le marché des jeunes entreprises
- Maximiser les chances de réussite et de pérennité
- Créer du réseau entre entrepreneurs
- Accompagner la décision de poursuivre, réorienter ou clore le projet

**Chiffres clés :** 20 264 entreprises accompagnées en 2024 (Initiative France), 91 % de taux de survie à 3 ans pour les startups accompagnées (contre 50 % sans accompagnement).

#### La réponse CreaPulse

Le PAA est implémenté comme un **système modulaire orchestré** — non pas un seul module, mais une **structure qui fédère 9 sous-modules** avec un timeline commun et un tableau de bord dédié.

| Composant PAA | Fichier | Description |
|--------------|---------|-------------|
| **Timeline PAA** | `parcours-paa.tsx` (758 lignes) | Visualisation 60 jours avec jalons J0→J10→J30→J60→J90, progression circulaire, ateliers, stats |
| **SWOT** | `swot.tsx` | Matrice Forces/Faiblesses/Opportunités/Menaces avec génération IA |
| **Objectifs SMART** | `objectifs-smart.tsx` | Définition d'objectifs Spécifiques, Mesurables, Atteignables, Pertinents, Temporels |
| **Gestion du Temps** | `gestion-temps.tsx` | Matrice d'Eisenhower, planificateur hebdomadaire, Pomodoro timer |
| **Gestion de Crise** | `gestion-crise.tsx` | Identification des risques, probabilités/impacts, plans de mitigation |
| **Stratégie Marketing** | `marketing-commerciale.tsx` | Plan marketing 4P, personas, canaux, KPIs |
| **Carte Mentale** | `mind-map.tsx` | Organisation visuelle des idées en arbre interactif |
| **Clôture & Rebond** | `cloture-rebond.tsx` | Bilan d'expérience, compétences transférables, parcours de rebond |
| **Satisfaction** | `satisfaction-feedback.tsx` | Enquêtes NPS, feedback sur le programme |

**Administration plateforme :** Le pack PAA (`paa-pack.tsx`, 513 lignes) permet à l'admin d'activer/désactiver l'ensemble du pack d'un seul toggle, de configurer la durée et le nombre minimum d'ateliers, et de piloter individuellement chaque sous-module.

**Modèle de données :** 5 modèles Prisma dédiés (`PaaProgram`, `PaaMilestone`, `PaaAtelierSession`, `SmartObjective`, `SatisfactionFeedback`) avec 6 routes API.

**Parcours structuré en 4 phases :**

```
J0-J10 : DIAGNOSTIC     → Profil créateur, RIASEC, Kiviat, Bilan IA, CréaScope
J10-J30: STRATÉGIE      → Marché, Juridique, Financier, BMC, Business Plan, SWOT
J30-J60: STRUCTURATION   → Marketing, Gestion du temps, Objectifs SMART, Mind Map
J60-J90: LANCEMENT      → Tremplin, Passeport, Clôture & Rebond, Satisfaction
```

---

### 3.4 Tremplin — Évaluation GO / NO-GO

#### Le dispositif institutionnel

Le **programme Tremplin** est un dispositif d'évaluation structurée qui permet de mesurer la viabilité d'un projet de création d'entreprise avant l'engagement définitif. Il produit une recommandation binaire (GO, GO CONDITIONNEL, NO-GO) basée sur une analyse multicritères.

#### La réponse CreaPulse

Le module **Tremplin** (`tremplin.tsx`, 799 lignes) est une évaluation en 7 étapes pondérées :

| Étape | Critère | Contenu |
|-------|---------|---------|
| 1 | **Viabilité du projet** | Validation marché, identification du besoin, signaux de demande, early adopters |
| 2 | **Modèle économique** | Sources de revenus, différenciation, viabilité à 3 ans, coût d'acquisition client |
| 3 | **Plan financier** | Budget, seuil de rentabilité, sources de financement (sécurisées/en cours/identifiées/aucune) |
| 4 | **Compétences clés** | Auto-évaluation management, commercial, technique, financier (échelle de Likert) |
| 5 | **Réseau & Soutien** | Mentor, conseillers, réseau entrepreneurial |
| 6 | **Motivation & Engagement** | Temps consacré (>40h/semaine), tolérance au risque, résilience |
| 7 | **Synthèse** | Score final, recommandation GO / GO_CONDITIONNEL / NO_GO, plan d'action |

**Double intégration :**
- **Module standalone** (`tremplin` dans le Bureau, section Pilotage) — accessible directement
- **Phase 4.3-4.4 du CréaScope** — « Tremplin Go/No-Go » (10 min) + « Discussion Tremplin » (5 min) dans le pipeline diagnostique

**Exports et intégrations :**
- **Export PDF** : Rapport standalone avec page de couverture, badge de décision, score bar, détail étape par étape
- **Téléchargements** : Entrée « Suivi — Évaluation Tremplin » dans le centre de téléchargement
- **IA Copilote** : Le prompt du module Tremplin injecte les dispositifs d'aide (ARE, ACCRE, BPI) dans les recommandations
- **Modèle de données** : Prisma `Tremplin` avec `score`, `currentStep`, `responses`, `recommendations`, `summary`, `decision` (enum `GO | GO_CONDITIONAL | NO_GO`)

---

### 3.5 Passeport Entrepreneurial — Certification GIDEF

#### Le dispositif institutionnel

Le **Passeport Entrepreneurial** est un dispositif de certification qui atteste des compétences acquises par le créateur tout au long de son parcours d'accompagnement. Il valorise le parcours auprès des partenaires financiers (banques, investisseurs) et institutionnels.

#### La réponse CreaPulse

Le module **Passeport** (`passeport.tsx`, 492 lignes) certifie le parcours sur 9 modules clés :

| Compétence | Module tracé | Icône |
|-----------|-------------|-------|
| Profil entrepreneurial | `profil-createur` | User |
| Diagnostic comportemental | `riasec` | GraduationCap |
| Compétences clés | `kiviat` | Pentagon |
| Définition du projet | `mon-projet` | Lightbulb |
| Analyse de marché | `marche` | Globe |
| Choix juridique | `juridique` | Scale |
| Plan financier | `financier` | Calculator |
| Business Plan | `business-plan` | FileText |
| Évaluation Tremplin | `tremplin` | Rocket |

**5 niveaux de certification :**

```
Aucun → Bronze (2 modules) → Argent (4 modules) → Or (7 modules) → Platine (9 modules)
```

**Double intégration :**
- **Module standalone** (`passeport` dans le Bureau, section Pilotage)
- **Phase 5.4 du CréaScope** — « Passeport Entrepreneurial » dans le plan d'action (5 min)

**Exports :**
- **PDF certifié** : « Passeport Entrepreneurial GIDEF » avec cachet, footer confidentiel, compétences détaillées
- **API** : `GET /api/passeport` retourne le résumé (modules, pourcentage, niveau, compétences)

---

### 3.6 Tests diagnostics digitalisés (RIASEC, Kiviat, Bilan IA)

#### Les dispositifs institutionnels

Le GIDEF utilise un ensemble de tests diagnostics standardisés pour évaluer le profil du créateur :
- **RIASEC** : Test de personnalité basé sur 6 types (Réaliste, Investigateur, Artiste, Social, Entreprenant, Conventionnel)
- **Kiviat** : Radar de compétences clés sur 6+ dimensions
- **Bilan IA** : Synthèse intelligente croisant les résultats de tous les tests

#### La réponse CreaPulse

Ces trois tests sont **digitalisés comme modules standalone** dans la section Parcours ET **intégrés dans le pipeline CréaScope Phase 3 (Approfondissement)** :

| Module | Code | Standalone | CréaScope Phase 3 |
|--------|------|-----------|-------------------|
| RIASEC | `riasec` | ✅ Section Parcours | ✅ Étape 3.2 « Complément RIASEC » (15 min) |
| Kiviat | `kiviat` | ✅ Section Parcours | ✅ Alimenté par Phase 2 (Pépites) + Phase 3.2 |
| Bilan IA | `bilan-ia` | ✅ Section Parcours | ✅ Étape 4.1 « Bilan IA automatisé » (10 min) |

---

## 4. PARTIE B — Dispositifs externes référencés et accompagnés

Ces dispositifs existent en dehors de la plateforme. CreaPulse ne les implémente pas en tant que modules natifs, mais fournit des **points d'entrée multiples** pour informer, connecter et guider les bénéficiaires vers ces aides.

### 4.1 ACRE — Aide à la Création ou Reprise d'Entreprise

#### Le dispositif

L'**ACRE** est une exonération partielle de charges sociales pendant la première année d'activité. Le montant dépend du statut juridique : 50 % pour les micro-entrepreneurs (plafonné), exonération sur la part sous le PASS pour les sociétés (~46 368 €/an en 2025). Éligibilité : bénéficiaires ARE, RSA, ASS, AAH. Montant estimé : jusqu'à 4 916 € d'économie la première année.

#### Comment CreaPulse accompagne l'ACRE

| Point d'entrée | Type de réponse | Détail |
|---------------|-----------------|--------|
| **Module Juridique** (`juridique.tsx`) | Simulateur interactif | Slider « Réduction de charges (ACRE) » avec InfoPopover, calcul automatique d'éligibilité selon le statut, carte résultat vert/rouge |
| **Module E-Learning** (`e-learning.tsx`) | Contenu pédagogique | Leçon BFR listant l'ACRE parmi les solutions de financement |
| **Module Clôture & Rebond** (`cloture-rebond.tsx`) | Information | « Éligibilité ARE/ACRE » listé comme avantage du rebond |
| **Admin Contenus** (`contenus.tsx`) | Gestion | Fiche structurée ACRE (titre, description, éligibilité, montant) |
| **Articles** | Contenu éditorial | « L'ACRE en 2025 : conditions et démarches » |
| **Forum** | Retour d'expérience | 3+ discussions mentionnant l'ACRE |
| **IA Copilote** | Guidance personnalisée | Suggestion « Comment obtenir ARE + ACCRE ? » avec calcul d'éligibilité |

> **Nature de la réponse :** La plateforme ne délivre pas l'ACRE (c'est l'URSSAF). Elle **simule l'éligibilité**, **informe** sur le dispositif et **guide** le bénéficiaire vers la démarche.

---

### 4.2 ARE / ARCE — Allocation et Aide au Retour à l'Emploi

#### Le dispositif

- **ARE** : Allocation de Retour à l'Emploi permettant le cumul avec les revenus de la nouvelle activité (15 à 36 mois).
- **ARCE** : Versement en deux fois de 45 % des droits ARE restants (plafonné à 10 800 €).
- **Éligibilité :** Inscrit à France Travail, projet de création/reprise, accord de la mission locale ou de France Travail.

#### Comment CreaPulse accompagne l'ARE/ARCE

| Point d'entrée | Type de réponse | Détail |
|---------------|-----------------|--------|
| **API France Travail** | Connexion temps réel | Route `GET /api/france-travail/aides` avec filtres (code postal, département, région, type d'aide) |
| **Admin Contenus** | Gestion | Fiche structurée ARCE : description, éligibilité, montant |
| **Module E-Learning** | Contenu pédagogique | Leçon BFR listant ARE parmi les sources de financement |
| **Module Clôture & Rebond** | Information | « Éligibilité ARE/ACRE » comme avantage du rebond |
| **Articles** | Contenu éditorial | « ARE France Travail : maintenir ses revenus durant la création » |
| **Forum** | Retour d'expérience | 4+ mentions ARCE/ARE, discussion détaillée ARCE + prêt d'honneur BPI |
| **IA Copilote** | Guidance personnalisée | « Comment obtenir l'ARE et l'ACCRE simultanément ? », calcul automatique du montant ARCE |

**Plan d'intégration (CDC2) :** Auto-calcul des montants ARCE, ACCRE et ARE basé sur le profil utilisateur (historique cotisations, durée d'inscription, statut RSA/RQTH) avec workflow de demande intégré.

> **Nature de la réponse :** La plateforme ne verse pas l'ARE/ARCE (c'est France Travail). Elle **connecte aux données temps réel** via API, **informe** et **guide** vers la démarche de demande.

---

### 4.3 NACRE — Nouvel Accompagnement pour la Création et la Reprise

#### Le dispositif

Le **NACRE** offre un accompagnement personnalisé par un réseau agréé (Initiative France, CCI, etc.) pendant 3 ans, assorti d'un prêt d'honneur à taux zéro pouvant aller jusqu'à 10 000 €.

#### Comment CreaPulse accompagne le NACRE

| Point d'entrée | Type de réponse | Détail |
|---------------|-----------------|--------|
| **API France Travail** | Connexion temps réel | Accessible via `GET /api/france-travail/aides` avec filtre par type |
| **Annuaire** | Référencement réseau | Réseau Initiative France présent dans l'annuaire des partenaires (type `SUPPORT`) |
| **Article** | Contenu éditorial | « Le NACRE : l'aide à la reprise et à la création d'entreprise » |
| **Forum** | Retour d'expérience | Mentionné dans « Aides à la création en Île-de-France » avec détail « accompagnement + prêt à taux zéro » |

> **Nature de la réponse :** La plateforme ne délivre pas le NACRE (c'est Initiative France/CCI). Elle **informe** et **connecte** le bénéficiaire au réseau agréé via l'annuaire.

---

### 4.4 Bpifrance — Banque Publique d'Investissement

#### Le dispositif

**Bpifrance** accompagne les entreprises à chaque étape : amorçage, innovation, croissance, export. Pour les créateurs : prêt d'amorçage (jusqu'à 50 000 € sans garantie), aide à l'innovation (Bourse French Tech), garantie partielle des prêts bancaires.

#### Comment CreaPulse accompagne Bpifrance

| Point d'entrée | Type de réponse | Détail |
|---------------|-----------------|--------|
| **Module Annuaire** (`annuaire.tsx`) | Fiche partenaire | Bpifrance IDF : adresse, téléphone, email, site, services (Prêt d'amorçage, Innovation, Garantie, Investissement), taux de réussite 88 % |
| **Module Forum** | Retour d'expérience | Discussion complète « Obtenir un prêt d'honneur : mon expérience avec BPI France » — 4 étapes, cas réel : 30 000 € pour SARL restaurant |
| **Landing Partenaires** | Visibilité | Bpifrance parmi les partenaires de confiance |
| **Admin Contenus** | Gestion | Partenaire référencé (catégorie Financement) |
| **Articles** | Contenu éditorial | « BPI France : le prêt d'amorçage décrypté » |
| **Module E-Learning** | Contenu pédagogique | « Prêt d'honneur (Initiative France, BPI) » comme source de financement BFR |
| **Export Business Plan** | Outil | Source de financement type « Prêt bancaire Bpifrance » dans le générateur de BP |
| **IA Copilote** | Guidance personnalisée | « Quels financements BPI France pour mon secteur ? » |
| **Diagnostic IA** | Recommandation auto | « Un financement d'amorçage (Bpifrance, Bourse French Tech) est recommandé » |

> **Nature de la réponse :** La plateforme ne délivre pas de financement Bpifrance. Elle **référence** l'institution, **informe** via des contenus éditoriaux, **facilite les retours d'expérience** entre pairs et **intègre** Bpifrance dans les outils de planification (Business Plan, E-Learning).

---

### 4.5 Aides régionales et locales

#### Le dispositif

La Région Île-de-France et les mairies proposent des aides complémentaires : prêt d'honneur Initiative IDF (5 000 €), bourses BGE Paris (3 000 €), subvention mairie de Paris, prêt d'aménagement Fonds Européen.

#### Comment CreaPulse accompagne les aides locales

| Point d'entrée | Type de réponse | Détail |
|---------------|-----------------|--------|
| **Admin Contenus** | Gestion structurée | Onglet « Aides » avec formulaire (Titre, Description, Éligibilité, Montant). 3 aides seed : ACRE, Prêt UE, ARCE |
| **Articles** | Contenu éditorial | 12 articles dans la catégorie « Financement » couvrant IDF, BPI, NACRE, crowdfunding, subventions |
| **Forum** | Retour d'expérience | Discussion « Aides à la création en Île-de-France » listant ARCE, ACRE, Prêt Initiative IDF, Bourses BGE Paris, Subvention mairie, ARE, NACRE |
| **Module Financier** | Outil de planification | Tableau de plan de financement avec lignes « Aides & Subventions » |
| **Module E-Learning** | Contenu pédagogique | Leçon BFR : Fonds propres, ACRE/ARE, Prêt d'honneur, Affacturage |
| **IA Copilote** | Guidance personnalisée | Prompt Tremplin : « identifie les aides, subventions et financements disponibles adaptés à ta situation » |

> **Nature de la réponse :** La plateforme ne gère pas les aides locales. Elle **centralise l'information**, permet à l'admin d'**ajouter/modifier des fiches d'aides**, et **facilite le partage d'expérience** entre pairs.

---

### 4.6 France Travail — APIs et données institutionnelles

#### Le dispositif

**France Travail** (ex-Pôle Emploi) met à disposition des APIs ouvertes permettant d'accéder en temps réel aux données du marché du travail : métiers, formations, offres d'emploi, aides financières, statistiques.

#### Comment CreaPulse exploite les APIs France Travail

CreaPulse intègre **11 routes API dédiées** qui enrichissent la plateforme avec des données institutionnelles en temps réel :

| Route API | Données | Usage dans la plateforme |
|-----------|---------|------------------------|
| `/api/france-travail/metiers` | Référentiel ROME | RIASEC, diagnostic IA, quiz métiers |
| `/api/france-travail/formations` | Catalogue formations | E-Learning, recommandations IA |
| `/api/france-travail/offres` | Offres d'emploi temps réel | Section Horizon Emplois, IA Copilote |
| `/api/france-travail/aides` | Aides financières | Module Juridique (ACRE), Tremplin, Business Plan |
| `/api/france-travail/agences` | Agences FT | Annuaire, carte des agences |
| `/api/france-travail/entreprises` | InfoNet | Analyse marché, concurrents |
| `/api/france-travail/communautes` | Communautés pro | Forum, mise en réseau |
| `/api/france-travail/evenements` | Événements MEE | Calendrier, ateliers |
| `/api/france-travail/statistiques` | Stats marché du travail | Dashboard, analyses sectorielles |
| `/api/france-travail/lbb` | La Bonne Boîte | Module Marché, opportunités |
| `/api/france-travail/rome` | Codes ROME | Mapping compétences, fiches métiers |

**Enrichissement IA :** La bibliothèque `ft-enrichment.ts` injecte automatiquement les données France Travail (offres, formations, aides, métiers) dans les prompts de l'IA Copilote et de CréaScope, fournissant des réponses contextualisées avec des données institutionnelles à jour.

**Authentification :** Gestion OAuth2 complète avec gestion de token, rate limiting et cache (`france-travail.ts`). Route guard dédié (`ft-guard.ts`) avec validation Zod.

> **Nature de la réponse :** Les APIs France Travail sont le **pont de données** entre l'institution et la plateforme. Elles alimentent les modules intégrés (CréaScope, RIASEC, E-Learning) et les outils d'information sur les dispositifs externes (aides, formations, offres).

---

### 4.7 Réseau GIDEF — Groupement Interprofessionnel

#### Le dispositif

Le **GIDEF** (Groupement Interprofessionnel pour le Développement de l'Entrepreneuriat en France) est un réseau de 60+ agences en Île-de-France qui assure l'accompagnement de proximité des créateurs d'entreprise. Partenaire de France Travail pour la mise en œuvre du PAA.

#### Comment CreaPulse incarne le réseau GIDEF

| Aspect | Implémentation |
|--------|---------------|
| **Branding** | Logos GIDEF et CreaPulse sur chaque page, co-branding « par GIDEF Île-de-France » |
| **Tenant principal** | Le tenant par défaut est « GIDEF Île-de-France » (slug `gidef`) |
| **Agences** | Modèle Prisma `Agency` avec type `GIDEF_AGENCY`, 2 agences seed (Paris Centre 14ᵉ, Paris 20ᵉ) |
| **Passeport** | « Passeport Entrepreneurial GIDEF » avec cachet officiel sur les exports PDF |
| **Article** | « Le réseau GIDEF en Île-de-France : 60 agences à votre service » |
| **Forum** | Conseillers GIDEF cités comme référents |
| **PAA** | Co-branding République Française / France Travail / GIDEF sur les pages PAA |
| **CréaScope** | Le pipeline diagnostique EST la SOP GIDEF digitalisée |

> **Nature de la réponse :** Le GIDEF n'est pas un « dispositif externe » pour CreaPulse — c'est son **identité institutionnelle**. La plateforme EST l'outil numérique du réseau GIDEF.

---

## 5. Matrice de couverture synthétique

### 5.1 Distinction intégrés vs. référencés

| Dispositif | Nature | Module natif ? | Réponse principale CreaPulse |
|-----------|--------|---------------|----------------------------|
| **CréaScope** | Intégré | ✅ `creascope` | Pipeline SOP 5 phases (3-4h) |
| **Pépites Game (Activ'Créa)** | Intégré | ✅ `pepites` | 4 modes de jeu, 60 cartes, 6 dimensions |
| **PAA** | Intégré | ✅ `parcours-paa` + 9 sous-modules | Timeline 60 jours, admin pack toggle |
| **Tremplin** | Intégré | ✅ `tremplin` | Évaluation 7 étapes GO/NO-GO |
| **Passeport Entrepreneurial** | Intégré | ✅ `passeport` | Certification 5 niveaux, PDF GIDEF |
| **RIASEC** | Intégré | ✅ `riasec` | Test digitalisé avec profil |
| **Kiviat** | Intégré | ✅ `kiviat` | Radar compétences 6 dimensions |
| **Bilan IA** | Intégré | ✅ `bilan-ia` | Synthèse IA multi-sources |
| ACRE | Externe | — | Simulateur Juridique + articles |
| ARE/ARCE | Externe | — | API FT /aides + calculateurs |
| NACRE | Externe | — | API FT /aides + annuaire |
| Bpifrance | Externe | — | Annuaire + forum + articles + BP |
| Aides régionales | Externe | — | Admin contenus + forum + articles |
| FT APIs | Externe | — | 11 routes temps réel |
| Réseau GIDEF | Identité | — | Branding + agences + SOP CréaScope |

### 5.2 Couverture par fonctionnalité (dispositifs intégrés uniquement)

| Fonctionnalité | CréaScope | Pépites (Activ'Créa) | PAA | Tremplin | Passeport | RIASEC | Kiviat | Bilan IA |
|---------------|-----------|---------------------|-----|----------|-----------|--------|--------|----------|
| **Module dédié** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Pipeline SOP structuré** | ✅ 5 phases | — | ✅ 4 phases | ✅ 7 étapes | — | — | — | — |
| **Export PDF** | ✅ | — | — | ✅ | ✅ | — | — | — |
| **API dédiée** | ✅ | ✅ | ✅ 6 routes | ✅ | ✅ | — | — | — |
| **IA Copilote** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dashboard Conseiller** | ✅ stats | — | ✅ | ✅ | ✅ | — | — | — |
| **Gamification XP** | ✅ | ✅ | — | ✅ | — | ✅ | ✅ | ✅ |
| **Intégré dans CréaScope** | — (c'est le conteneur) | ✅ Phase 2 | — | ✅ Phase 4 | ✅ Phase 5 | ✅ Phase 3 | ✅ Phase 2+3 | ✅ Phase 4 |

### 5.3 Couverture par section du Bureau Virtuel

```
PARCOURS (8 modules)     → Diagnostic, Profilage, CréaScope Phase 1-2
  ├── Profil créateur    → Données d'entrée du CréaScope (Phase 1.2)
  ├── RIASEC             → Dispositif INTÉGRÉ — Phase 3.2 du CréaScope
  ├── Kiviat             → Dispositif INTÉGRÉ — Alimenté par Pépites (Phase 2) + Phase 3
  ├── Bilan IA           → Dispositif INTÉGRÉ — Phase 4.1 du CréaScope
  ├── Pépites Game       → Dispositif INTÉGRÉ (Activ'Créa) — Phase 2 du CréaScope
  └── CréaScope          → Dispositif INTÉGRÉ — Pipeline SOP 5 phases

STRATÉGIE (13 modules)   → Structuration, Modélisation, PAA Phase 2-3
  ├── Marché             → Phase 3.3 CréaScope + API FT métiers/entreprises
  ├── Juridique          → Simulateur ACRE (dispositif EXTERNE accompagné)
  ├── Financier          → Phase 3.4 CréaScope + références BPI/ARE (externes)
  ├── SWOT / Mind Map    → Sous-modules PAA (dispositif INTÉGRÉ)
  └── Marketing / Temps / Crise → Sous-modules PAA (dispositif INTÉGRÉ)

ÉCOSYSTÈME (5 modules)   → Réseau, Partenaires
  ├── Annuaire           → Référence Bpifrance, GIDEF, Initiative France (externes)
  ├── Forum              → Retours d'expérience ARE, NACRE, ACRE (externes)
  └── Messages / Mentorat → Suivi conseiller-bénéficiaire

PILOTAGE (10 modules)    → Lancement, Certification, PAA Phase 4
  ├── Tremplin           → Dispositif INTÉGRÉ — standalone + Phase 4 CréaScope
  ├── Passeport          → Dispositif INTÉGRÉ — standalone + Phase 5.4 CréaScope
  ├── Objectifs SMART    → Sous-module PAA (dispositif INTÉGRÉ)
  ├── Clôture & Rebond   → Sous-module PAA (dispositif INTÉGRÉ)
  ├── Satisfaction       → Sous-module PAA (dispositif INTÉGRÉ)
  └── Gamification       → Système d'engagement transverse
```

---

## 6. Conclusion

### Ce que CreaPulse EST

La plateforme est la **digitalisation native** des dispositifs clés du GIDEF et de France Travail :

- **CréaScope** : la SOP diagnostique 3-4h, entièrement interactive et chronométrée
- **Activ'Créa (Pépites Game)** : le jeu de détection des compétences entrepreneuriales
- **PAA** : le parcours structuré 60 jours avec ses 9 sous-modules
- **Tremplin** : l'évaluation GO/NO-GO multicritères
- **Passeport Entrepreneurial** : la certification de parcours avec export PDF GIDEF
- **RIASEC, Kiviat, Bilan IA** : les tests diagnostics digitalisés

Ces **8 dispositifs intégrés** constituent le cœur fonctionnel de la plateforme — ils ne sont pas « référencés » ou « accompagnés », ils **sont implémentés** avec persistance de données, API dédiées, exports, gamification et suivi Conseiller 360°.

### Ce que CreaPulse ACCOMPAGNE

La plateforme entoure ces dispositifs natifs d'un **écosystème d'information et de connexion** vers les dispositifs externes :

- **Aides financières** (ACRE, ARE/ARCE, NACRE) : simulateurs, API temps réel, articles, calculateurs
- **Institutions** (Bpifrance, Initiative France) : annuaire, fiches partenaires, retours d'expérience
- **Données institutionnelles** (11 APIs France Travail) : enrichissement IA, données temps réel
- **Aides locales** : fiches structurées gérées par l'admin, articles, forum

### Architecture modulaire et territoriale

L'approche modulaire de CreaPulse permet d'**activer ou désactiver** chaque composant selon les conventions locales, les financements disponibles et les spécificités du réseau d'accompagnement — faisant de la plateforme un outil **adaptable à tout territoire** et non pas seulement à l'Île-de-France.

---

> *Document de référence CreaPulse V2 — 8 dispositifs intégrés (natifs) · 7 dispositifs externes (accompagnés) · 11 routes API France Travail · 5 niveaux de certification · 38 modules Bureau Virtuel*