# CreaPulse — Les Dispositifs d'Accompagnement à la Création d'Entreprise et la Réponse Plateforme

> **Document de référence** — Version 1.0  
> Plateforme CreaPulse propulsée par GIDEF Île-de-France & France Travail  
> Dernière mise à jour : Juillet 2025

---

## Table des matières

1. [Introduction](#1-introduction)
2. [Cartographie des dispositifs](#2-cartographie-des-dispositifs)
3. [PAA — Parcours d'Accompagnement des Actifs](#3-paa--parcours-daccompagnement-des-actifs)
4. [Tremplin — Évaluation GO / NO-GO](#4-tremplin--évaluation-go--no-go)
5. [Passeport Entrepreneurial](#5-passeport-entrepreneurial)
6. [ACRE — Aide à la Création ou Reprise d'Entreprise](#6-acre--aide-à-la-création-ou-reprise-dentreprise)
7. [ARE / ARCE — Allocation et Aide au Retour à l'Emploi](#7-are--arce--allocation-et-aide-au-retour-à-lemploi)
8. [NACRE — Nouvel Accompagnement pour la Création et la Reprise](#8-nacre--nouvel-accompagnement-pour-la-création-et-la-reprise)
9. [Bpifrance — Banque Publique d'Investissement](#9-bpifrance--banque-publique-dinvestissement)
10. [Réseau GIDEF — Groupement Interprofessionnel](#10-réseau-gidef--groupement-interprofessionnel)
11. [France Travail — APIs et données institutionnelles](#11-france-travail--apis-et-données-institutionnelles)
12. [Aides régionales et locales](#12-aides-régionales-et-locales)
13. [Matrice de couverture synthétique](#13-matrice-de-couverture-synthétique)
14. [Conclusion](#14-conclusion)

---

## 1. Introduction

L'écosystème français de l'accompagnement à la création d'entreprise repose sur une multitude de **dispositifs** (aides financières, programmes d'accompagnement, certifications, outils d'évaluation) portés par des acteurs institutionnels distincts : France Travail, Bpifrance, Initiative France, les Régions, les CCI, et les réseaux associatifs comme le GIDEF.

La plateforme **CreaPulse** a été conçue pour **fédérer, structurer et rendre opérationnels** ces dispositifs au sein d'un environnement numérique unique. Plutôt que de juxtaposer des outils isolés, CreaPulse propose un **Bureau Virtuel Entrepreneurial** qui :

- **Cartographie** chaque dispositif dans le parcours de création
- **Automatise** les éligibilités et les calculs (ACRE, ARCE, ARE)
- **Connecte** les données institutionnelles via les APIs France Travail
- **Certifie** les compétences acquises via le Passeport Entrepreneurial
- **Mesure** l'impact de l'accompagnement via des tableaux de bord Conseiller 360°

Ce document présente chaque dispositif majeur et explique précisément comment CreaPulse y répond — module par module, API par API.

---

## 2. Cartographie des dispositifs

| # | Dispositif | Porteur | Nature | Réponse CreaPulse |
|---|-----------|---------|--------|-------------------|
| 1 | **PAA** | France Travail / GIDEF | Programme structuré 60 jours | Module `parcours-paa` + 9 sous-modules PAA |
| 2 | **Tremplin** | GIDEF / Initiative France | Évaluation GO/NO-GO | Module `tremplin` (7 étapes, 799 lignes) |
| 3 | **Passeport Entrepreneurial** | GIDEF | Certification compétences | Module `passeport` (5 niveaux, PDF certifié) |
| 4 | **ACRE** | État / URSSAF | Exonération charges sociales 1 an | Simulateur `juridique` + admin contenus |
| 5 | **ARE / ARCE** | France Travail | Maintien revenus / Capital de départ | API FT `/aides` + module `e-learning` + articles |
| 6 | **NACRE** | France Travail / Initiative France | Prêt à taux zéro + accompagnement | API FT `/aides` + article dédié |
| 7 | **Bpifrance** | État | Prêt d'amorçage, garantie, investissement | Annuaire partenaire + articles + forum |
| 8 | **Réseau GIDEF** | GIDEF Île-de-France | Accompagnement de proximité | Identité plateforme, 60 agences, branding |
| 9 | **France Travail (APIs)** | France Travail | Métiers, formations, offres, aides | 11 routes API, enrichissement IA |
| 10 | **Aides régionales / locales** | Région IDF, mairies | Subventions, bourses, prêts d'honneur | Admin contenus + forum + articles |

---

## 3. PAA — Parcours d'Accompagnement des Actifs

### 3.1 Le dispositif institutionnel

Le **Parcours d'Accompagnement des Actifs (PAA)** est un programme structuré de 60 jours cofinancé par France Travail et les réseaux d'accompagnement comme le GIDEF. Il vise les demandeurs d'emploi en projet de création ou reprise d'entreprise.

**Objectifs du PAA :**
- Identifier les difficultés rencontrées par les entrepreneurs
- Renforcer les compétences entrepreneuriales (gestion, finance, marketing)
- Sécuriser l'entrée sur le marché des jeunes entreprises
- Maximiser les chances de réussite et de pérennité
- Créer du réseau entre entrepreneurs
- Accompagner la décision de poursuivre, réorienter ou clore le projet

**Chiffres clés :** 20 264 entreprises accompagnées en 2024 (Initiative France), 91 % de taux de survie à 3 ans pour les startups accompagnées (contre 50 % sans accompagnement).

### 3.2 La réponse CreaPulse

CreaPulse intègre le PAA comme un **système modulaire complet** :

| Composant | Fichier | Description |
|-----------|---------|-------------|
| **Timeline PAA** | `parcours-paa.tsx` (758 lignes) | Visualisation 60 jours avec jalons J0→J10→J30→J60→J90, progression circulaire, ateliers, stats |
| **SWOT PAA** | `swot.tsx` | Matrice Forces/Faiblesses/Opportunités/Menaces avec génération IA |
| **Objectifs SMART PAA** | `objectifs-smart.tsx` | Définition d'objectifs Spécifiques, Mesurables, Atteignables, Pertinents, Temporels |
| **Gestion du Temps PAA** | `gestion-temps.tsx` | Matrice d'Eisenhower, planificateur hebdomadaire, Pomodoro timer |
| **Gestion de Crise PAA** | `gestion-crise.tsx` | Identification des risques, probabilites/impacts, plans de mitigation |
| **Stratégie Marketing PAA** | `marketing-commerciale.tsx` | Plan marketing 4P, personas, canaux, KPIs |
| **Carte Mentale PAA** | `mind-map.tsx` | Organisation visuelle des idées en arbre interactif |
| **Clôture & Rebond PAA** | `cloture-rebond.tsx` | Bilan d'expérience, compétences transférables, parcours de rebond |
| **Satisfaction PAA** | `satisfaction-feedback.tsx` | Enquêtes NPS, feedback sur le programme |

**Administration plateforme :** Le pack PAA (`paa-pack.tsx`, 513 lignes) permet à l'admin de :
- Activer/désactiver l'ensemble du pack PAA d'un seul toggle
- Configurer la durée du programme et le nombre minimum d'ateliers
- Piloter individuellement chaque sous-module

**Modèle de données :** 5 modèles Prisma dédiés (`PaaProgram`, `PaaMilestone`, `PaaAtelierSession`, `SmartObjective`, `SatisfactionFeedback`) avec 6 routes API.

### 3.3 Parcours structuré en 4 phases

```
J0-J10 : DIAGNOSTIC     → Profil créateur, RIASEC, Kiviat, Bilan IA, CréaScope
J10-J30: STRATÉGIE      → Marché, Juridique, Financier, BMC, Business Plan, SWOT
J30-J60: STRUCTURATION   → Marketing, Gestion du temps, Objectifs SMART, Mind Map
J60-J90: LANCEMENT      → Tremplin, Passeport, Clôture & Rebond, Satisfaction
```

---

## 4. Tremplin — Évaluation GO / NO-GO

### 4.1 Le dispositif

Le **programme Tremplin** est un dispositif d'évaluation structurée qui permet de mesurer la viabilité d'un projet de création d'entreprise avant l'engagement définitif. Il produit une recommandation binaire (GO, GO CONDITIONNEL, NO-GO) basée sur une analyse multicritères.

### 4.2 La réponse CreaPulse

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

**Intégrations :**
- **CreaScope** : Phase 4.3 « Tremplin Go/No-Go » (10 min) + Phase 4.4 « Discussion Tremplin » (5 min) dans le pipeline diagnostique
- **Export PDF** : Rapport standalone avec page de couverture, badge de décision, score bar, détail étape par étape
- **Téléchargements** : Entrée « Suivi — Évaluation Tremplin » dans le centre de téléchargement
- **IA Copilote** : Le prompt du module Tremplin injecte les dispositifs d'aide (ARE, ACCRE, BPI) dans les recommandations

**Modèle de données :** Prisma `Tremplin` avec `score`, `currentStep`, `responses`, `recommendations`, `summary`, `decision` (enum `GO | GO_CONDITIONAL | NO_GO`).

---

## 5. Passeport Entrepreneurial

### 5.1 Le dispositif

Le **Passeport Entrepreneurial** est un dispositif de certification qui atteste des compétences acquises par le créateur tout au long de son parcours d'accompagnement. Il valorise le parcours auprès des partenaires financiers (banques, investisseurs) et institutionnels.

### 5.2 La réponse CreaPulse

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

**Exports :**
- **PDF certifié** : « Passeport Entrepreneurial GIDEF » avec cachet, footer confidentiel, compétences détaillées
- **API** : `GET /api/passeport` retourne le résumé (modules, pourcentage, niveau, compétences)
- **Intégration CreaScope** : Phase 5.4 « Passeport Entrepreneurial » dans le plan d'action

---

## 6. ACRE — Aide à la Création ou Reprise d'Entreprise

### 6.1 Le dispositif

L'**ACRE** est une exonération partielle de charges sociales pendant la première année d'activité. Le montant de l'exonération dépend du statut juridique choisi :

- **Micro-entrepreneur** : Exonération de 50 % des cotisations sociales (plafonnée)
- **Société** : Exonération sur la part de rémunération inférieure au PASS (environ 46 368 €/an en 2025)

**Éligibilité :** Bénéficiaires de l'ARE, du RSA, de l'ASS, ou de l'AAH. Montant estimé : jusqu'à 4 916 € d'économie la première année.

### 6.2 La réponse CreaPulse

| Point d'entrée | Détail |
|---------------|--------|
| **Module Juridique** (`juridique.tsx`) | Slider interactif « Réduction de charges (ACRE) » avec InfoPopover expliquant le dispositif. Calcul automatique d'éligibilité selon le statut. Carte résultat « Éligibilité ACRE » avec badge vert/rouge et comparatif |
| **Module E-Learning** (`e-learning.tsx`) | Leçon BFR listant l'ACRE parmi les solutions de financement du besoin en fonds de roulement |
| **Module Clôture & Rebond** (`cloture-rebond.tsx`) | « Éligibilité ARE/ACRE » listé comme avantage du rebond par nouvelle création |
| **Admin Contenus** (`contenus.tsx`) | Fiche structurée ACRE (titre, description, éligibilité, montant) avec formulaire d'ajout |
| **Articles** | « L'ACRE en 2025 : conditions et démarches » (catégorie Juridique) |
| **Forum** | 3+ discussions mentionnant l'ACRE dans les fils d'aides à la création en IDF |
| **IA Copilote** | Suggestion : « Comment obtenir ARE + ACCRE ? » avec calcul d'éligibilité personnalisé |

---

## 7. ARE / ARCE — Allocation et Aide au Retour à l'Emploi

### 7.1 Le dispositif

- **ARE** : L'Allocation de Retour à l'Emploi permet le cumul de l'allocation chômage avec les revenus de la nouvelle activité pendant 15 à 36 mois.
- **ARCE** : L'Aide au Retour à l'Emploi sous forme de Capital est un versement en deux fois de 45 % des droits ARE restants (plafonné à 10 800 €).

**Éligibilité :** Être inscrit à France Travail, avoir un projet de création/reprise, obtenir l'accord de la mission locale ou de France Travail.

### 7.2 La réponse CreaPulse

| Point d'entrée | Détail |
|---------------|--------|
| **API France Travail** | Route `GET /api/france-travail/aides` avec filtres (code postal, département, région, type d'aide). Données temps réel depuis le système national |
| **Admin Contenus** | Fiche structurée ARCE : description, éligibilité (« Inscrit à Pôle Emploi »), montant (« Jusqu'à 10 800 € ») |
| **Module E-Learning** | Leçon BFR listant ARE parmi les sources de financement |
| **Module Clôture & Rebond** | « Éligibilité ARE/ACRE » comme avantage du rebond |
| **Articles** | « ARE France Travail : maintenir ses revenus durant la création » (catégorie Financement) |
| **Forum** | 4+ mentions de l'ARCE/ARE, dont une discussion détaillée recommandant ARCE si besoin de capital de départ + prêt d'honneur BPI |
| **IA Copilote** | Prompts spécialisés : « Comment obtenir l'ARE et l'ACCRE simultanément ? », calcul automatique du montant ARCE basé sur le profil utilisateur |

**Plan d'intégration (CDC2) :** Auto-calcul des montants ARCE, ACCRE et ARE basé sur le profil utilisateur (historique cotisations, durée d'inscription, statut RSA/RQTH) avec workflow de demande intégré.

---

## 8. NACRE — Nouvel Accompagnement pour la Création et la Reprise

### 8.1 Le dispositif

Le **NACRE** offre un accompagnement personnalisé par un réseau agréé (Initiative France, CCI, etc.) pendant 3 ans, assorti d'un **prêt d'honneur à taux zéro** pouvant aller jusqu'à 10 000 €.

### 8.2 La réponse CreaPulse

| Point d'entrée | Détail |
|---------------|--------|
| **API France Travail** | Accessible via `GET /api/france-travail/aides` avec filtre par type |
| **Annuaire** | Réseau Initiative France présent dans l'annuaire des partenaires (type `SUPPORT`) |
| **Article** | « Le NACRE : l'aide à la reprise et à la création d'entreprise » (catégorie Financement) |
| **Forum** | Mentionné dans la discussion « Aides à la création en Île-de-France » avec détail « accompagnement + prêt à taux zéro » |

---

## 9. Bpifrance — Banque Publique d'Investissement

### 9.1 Le dispositif

**Bpifrance** est la banque publique d'investissement qui accompagne les entreprises à chaque étape : amorçage, innovation, croissance, export. Pour les créateurs, les dispositifs clés sont :

- **Prêt d'amorçage** : Jusqu'à 50 000 € sans garantie, pour financer les premiers investissements
- **Aide à l'innovation** : Bourse French Tech, subventions BPI
- **Garantie** : Garantie partielle des prêts bancaires

### 9.2 La réponse CreaPulse

| Point d'entrée | Détail |
|---------------|--------|
| **Module Annuaire** (`annuaire.tsx`) | Fiche détaillée Bpifrance Île-de-France : adresse (27-31 Av. du Général Leclerc, 75014 Paris), téléphone, email, site web, services (Prêt d'amorçage, Aide à l'innovation, Garantie, Investissement). Taux de réussite : 88 % |
| **Module Forum** | Discussion complète « Obtenir un prêt d'honneur : mon expérience avec BPI France » en 4 étapes (Business plan → Conseiller BPI → Comité d'engagement → Réponse). Cas réel : 30 000 € obtenus pour SARL restaurant |
| **Landing Partenaires** | Bpifrance affiché parmi les partenaires de confiance (avec France Travail, Région IDF, CCI IDF) |
| **Admin Contenus** | Partenaire référencé (catégorie Financement), article « Partenariat avec la BPI pour le financement » |
| **Articles** | « BPI France : le prêt d'amorçage décrypté » (catégorie Financement) |
| **Module E-Learning** | « Prêt d'honneur (Initiative France, BPI) » listé comme source de financement BFR |
| **Export Business Plan** | Source de financement type « Prêt bancaire Bpifrance » intégrée dans le générateur de BP |
| **IA Copilote** | Suggestion : « Quels financements BPI France pour mon secteur ? » |
| **Diagnostic IA** | Recommandation automatique : « Un financement d'amorçage (Bpifrance, Bourse French Tech) est recommandé » |

---

## 10. Réseau GIDEF — Groupement Interprofessionnel

### 10.1 Le dispositif

Le **GIDEF** (Groupement Interprofessionnel pour le Développement de l'Entrepreneuriat en France) est un réseau de 60+ agences en Île-de-France qui assure l'accompagnement de proximité des créateurs d'entreprise. Le réseau est partenaire de France Travail pour la mise en œuvre du PAA.

### 10.2 La réponse CreaPulse

CreaPulse est **identité GIDEF** :

| Aspect | Implémentation |
|--------|---------------|
| **Branding** | Logos GIDEF et CreaPulse sur chaque page, co-branding « par GIDEF Île-de-France » |
| **Tenant principal** | Le tenant par défaut de la plateforme est « GIDEF Île-de-France » (slug `gidef`) |
| **Agences** | Modèle Prisma `Agency` avec type `GIDEF_AGENCY`, 2 agences seed (Paris Centre 14ᵉ, Paris 20ᵉ) |
| **Passeport** | « Passeport Entrepreneurial GIDEF » avec cachet officiel sur les exports PDF |
| **Article** | « Le réseau GIDEF en Île-de-France : 60 agences à votre service » |
| **Forum** | Conseillers GIDEF cités comme référents : « consultez votre conseiller GIDEF pour un point personnalisé sur votre éligibilité » |
| **PAA** | Co-branding République Française / France Travail / GIDEF sur les pages PAA officielles |

---

## 11. France Travail — APIs et données institutionnelles

### 11.1 Le dispositif

**France Travail** (ex-Pôle Emploi) met à disposition des APIs ouvertes permettant d'accéder en temps réel aux données du marché du travail : métiers, formations, offres d'emploi, aides financières, statistiques.

### 11.2 La réponse CreaPulse — 11 routes API dédiées

| Route API | Données | Usage dans la plateforme |
|-----------|---------|------------------------|
| `/api/france-travail/metiers` | Référentiel des métiers ROME | Module RIASEC, diagnostic IA, quiz métiers |
| `/api/france-travail/formations` | Catalogue formations | Module E-Learning, recommandations IA |
| `/api/france-travail/offres` | Offres d'emploi en temps réel | Section Horizon Emplois, IA Copilote |
| `/api/france-travail/aides` | **Aides financières** | Module Juridique (ACRE), Tremplin, Business Plan |
| `/api/france-travail/agences` | Agences France Travail | Annuaire, carte des agences |
| `/api/france-travail/entreprises` | Données InfoNet | Analyse marché, concurrents |
| `/api/france-travail/communautes` | Communautés professionnelles | Forum, mise en réseau |
| `/api/france-travail/evenements` | Événements MEE | Calendrier, ateliers |
| `/api/france-travail/statistiques` | Statistiques marché du travail | Dashboard, analyses sectorielles |
| `/api/france-travail/lbb` | La Bonne Boîte (entreprises recruteuses) | Module Marché, opportunités |
| `/api/france-travail/rome` | Codes ROME | Mapping compétences, fiches métiers |

**Enrichissement IA :** La bibliothèque `ft-enrichment.ts` injecte automatiquement les données France Travail (offres, formations, aides, métiers) dans les prompts de l'IA Copilote et de CréaScope, fournissant des réponses contextualisées avec des données institutionnelles à jour.

**Authentification :** Gestion OAuth2 complète avec gestion de token, rate limiting et cache (`france-travail.ts`). Route guard dédié (`ft-guard.ts`) avec validation Zod.

---

## 12. Aides régionales et locales

### 12.1 Le dispositif

Au-delà des dispositifs nationaux, la Région Île-de-France et les mairies proposent des aides complémentaires :

- **Prêt d'honneur Initiative IDF** : Jusqu'à 5 000 € (Initiative France Île-de-France)
- **Bourses BGE Paris** : Jusqu'à 3 000 € pour les créateurs
- **Subvention mairie de Paris** : Aides aux commerces de proximité
- **Prêt d'aménagement Fonds Européen** : Fonds structurels européens

### 12.2 La réponse CreaPulse

| Point d'entrée | Détail |
|---------------|--------|
| **Admin Contenus** | Onglet « Aides » avec formulaire structuré (Titre, Description, Éligibilité, Montant). 3 aides seed : ACRE, Prêt UE, ARCE |
| **Articles** | 12 articles dans la catégorie « Financement » couvrant IDF, BPI, NACRE, crowdfunding, subventions |
| **Forum** | Discussion riche « Aides à la création en Île-de-France » listant : ARCE, ACRE, Prêt Initiative IDF (5 000 €), Bourses BGE Paris (3 000 €), Subvention mairie de Paris, ARE, NACRE |
| **Module Financier** | Tableau de plan de financement avec lignes « Aides & Subventions » alimentées par les données utilisateur |
| **Module E-Learning** | Leçon dédiée au BFR avec liste structurée : Fonds propres, ACRE/ARE, Prêt d'honneur, Affacturage |
| **IA Copilote** | Prompt du module Tremplin : « identifie les aides, subventions et financements disponibles (ARE, ACCRE, BPI, etc.) adaptés à ta situation » |

---

## 13. Matrice de couverture synthétique

### 13.1 Couverture par fonctionnalité

| Fonctionnalité | PAA | Tremplin | Passeport | ACRE | ARE/ARCE | NACRE | BPI | FT APIs | Aides locales |
|---------------|-----|----------|-----------|------|----------|-------|-----|---------|---------------|
| **Module dédié** | ✅ | ✅ | ✅ | 🔶 | — | — | 🔶 | — | — |
| **Simulateur** | — | ✅ (7 étapes) | — | ✅ (juridique) | 🔶 (planifié CDC2) | — | — | — | — |
| **Export PDF** | — | ✅ | ✅ | — | — | — | — | — | — |
| **API temps réel** | ✅ (6 routes) | ✅ (1 route) | ✅ (2 routes) | — | ✅ (`/aides`) | ✅ (`/aides`) | — | ✅ (11 routes) | — |
| **Articles** | — | — | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Forum** | — | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| **E-Learning** | — | — | — | ✅ | ✅ | — | ✅ | — | — |
| **IA Copilote** | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — |
| **Admin** | ✅ (pack) | ✅ (stats) | — | ✅ (contenus) | ✅ (contenus) | — | ✅ (partenaires) | — | ✅ (contenus) |
| **Dashboard Conseiller** | ✅ | ✅ | ✅ | — | — | — | — | — | — |

> ✅ Implémenté | 🔶 Partiellement intégré | — Non applicable

### 13.2 Couverture par section du Bureau Virtuel

```
PARCOURS (8 modules)     → Diagnostic, Profilage, PAA Phase 1
  ├── Profil créateur    → Dispositif : Profilage GIDEF
  ├── RIASEC             → Dispositif : Diagnostic comportemental
  ├── Kiviat             → Dispositif : Évaluation compétences
  ├── Bilan IA           → Dispositif : Synthèse France Travail
  └── CréaScope          → Dispositif : Pipeline diagnostique 3-4h

STRATÉGIE (13 modules)   → Structuration, Modélisation, PAA Phase 2
  ├── Marché             → Dispositif : Étude de marché (FT APIs)
  ├── Juridique          → Dispositif : ACRE, choix de statut
  ├── Financier          → Dispositif : Plan de financement (BPI, ARE)
  ├── Business Plan      → Dispositif : Dossier de financement
  └── SWOT / Mind Map    → Dispositif : PAA Stratégie

ÉCOSYSTÈME (5 modules)   → Réseau, Partenaires, PAA Phase 3
  ├── Annuaire           → Dispositif : Bpifrance, GIDEF, Initiative France
  ├── Forum              → Dispositif : Retour d'expérience pairs
  ├── CRM                → Dispositif : Gestion commerciale
  └── Messages / Mentorat → Dispositif : Suivi conseiller

PILOTAGE (10 modules)    → Lancement, Certification, PAA Phase 4
  ├── Tremplin           → Dispositif : Évaluation GO/NO-GO
  ├── Passeport          → Dispositif : Certification GIDEF
  ├── Objectifs SMART    → Dispositif : PAA Suivi
  ├── Clôture & Rebond   → Dispositif : PAA Sortie
  ├── Satisfaction       → Dispositif : NPS PAA
  └── Gamification       → Dispositif : Engagement
```

---

## 14. Conclusion

CreaPulse ne se contente pas de lister les dispositifs existants : il les **opérationnalise** à chaque étape du parcours entrepreneurial. La plateforme assure une **couverture exhaustive** des dispositifs majeurs de l'accompagnement à la création en France :

- **38 modules** couvrant l'intégralité du parcours (diagnostic → stratégie → écosystème → lancement)
- **11 APIs France Travail** pour des données institutionnelles en temps réel
- **3 certifications** (Tremplin GO/NO-GO, Passeport Entrepreneurial, Gamification)
- **12+ articles** dédiés au financement et aux dispositifs
- **Un réseau partenaire intégré** (Bpifrance, GIDEF, Initiative France)
- **Un IA Copilote** contextualisé qui guide le bénéficiaire vers les aides adaptées à sa situation

L'approche modulaire de CreaPulse permet d'**activer ou désactiver** chaque composant selon les conventions locales, les financements disponibles et les spécificités du réseau d'accompagnement — faisant de la plateforme un outil **adaptable à tout territoire** et non pas seulement à l'Île-de-France.

---

> *Document généré automatiquement à partir de l'audit du code source CreaPulse V2.*  
> *38 modules · 11 routes API France Travail · 5 niveaux de certification · 1 300+ fichiers source*