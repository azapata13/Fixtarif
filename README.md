# Fixtarif

Application web bilingue FR/EN pour PME canadiennes afin de préparer des expéditions au Canada et vers les États-Unis.

## Principe central
UNE expédition → saisie/import une seule fois → validation humaine → génération des documents requis.

## UX
Le principe produit est : **Valider au lieu de créer**.

## Stack V1
- Next.js
- TypeScript strict
- Tailwind CSS
- Supabase Auth + PostgreSQL + Storage
- Netlify
- Cloudflare DNS
- GitHub

## Docs
- `AGENTS.md` : règles impératives pour Codex
- `SPEC_V1.md` : cahier des charges fonctionnel
- `ARCHITECTURE.md` : architecture technique
- `DATA_MODEL.md` : modèle de données
- `DECISIONS.md` : décisions déjà prises
- `REGULATORY_TODO.md` : sujets à ne pas inventer
- `IMPLEMENTATION_PLAN.md` : ordre de construction
- `CODEX_START_PROMPT.md` : premier prompt à coller dans Codex

## Règle absolue
Aucune règle douanière, légale, CUSMA, matière dangereuse, anti-dumping, acier/aluminium ou clause de connaissement ne doit être inventée par l'IA ou le code.

## Phase 0 — Fondation

Socle créé :
- Next.js App Router
- TypeScript strict
- Tailwind CSS
- Supabase Auth + PostgreSQL
- workspace multi-tenant
- rôles `owner`, `admin`, `member`
- RLS Supabase
- i18n FR/EN
- navigation principale responsive
- pages placeholders
- migrations SQL versionnées

Pas encore inclus volontairement :
- scan/import IA
- PDF
- HTS
- CUSMA
- règles douanières

## Installation locale

```bash
npm install
cp .env.example .env.local
npm run dev
```

Variables à remplir dans `.env.local` :

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

La clé `SUPABASE_SERVICE_ROLE_KEY` est réservée au serveur. Elle ne doit jamais être utilisée dans un composant client.

## Supabase

Créer un projet Supabase nommé `Fixtarif`, puis récupérer :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Appliquer ensuite la migration :

```bash
supabase db push
```

Ou copier le contenu de `supabase/migrations/20260902171000_phase_0_foundation.sql` dans le SQL editor Supabase.

## Vérifications

```bash
npm run lint
npm run typecheck
npm run build
```

## Déploiement Netlify

1. Connecter le repo GitHub à Netlify.
2. Utiliser la commande de build `npm run build`.
3. Publier `.next`.
4. Ajouter les variables d'environnement Supabase dans Netlify.
5. Configurer `NEXT_PUBLIC_SITE_URL` avec l'URL de production.
