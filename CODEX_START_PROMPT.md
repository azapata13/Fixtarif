# PREMIER PROMPT À COLLER DANS CODEX

Tu travailles sur mon nouveau projet **Fixtarif**.

Avant d'écrire du code, lis obligatoirement :
1. README.md
2. AGENTS.md
3. SPEC_V1.md
4. DECISIONS.md
5. ARCHITECTURE.md
6. DATA_MODEL.md
7. REGULATORY_TODO.md
8. IMPLEMENTATION_PLAN.md

Je veux commencer UNIQUEMENT par **Phase 0 — Fondation**.

Objectif :
- Next.js
- TypeScript strict
- Tailwind
- App Router
- Supabase
- Auth
- PostgreSQL
- workspace multi-tenant
- rôles owner/admin/member
- RLS
- i18n FR/EN
- layout responsive
- navigation principale
- pages placeholders
- migrations SQL versionnées
- `.env.example`

NE COMMENCE PAS encore :
- scan IA
- PDF
- CUSMA
- règles douanières
- HTS
- facture commerciale
- intégrations transporteurs

Avant de coder, présente :
1. ton plan Phase 0
2. l'arborescence proposée
3. les tables/migrations
4. les dépendances npm
5. les variables d'environnement
6. les choix techniques nécessaires

Ensuite implémente Phase 0.

Règles :
- respecter AGENTS.md
- aucune règle légale/douanière inventée
- TypeScript strict
- aucune clé secrète côté client
- isolation workspace + RLS obligatoire
- FR/EN dès maintenant
- migrations versionnées
- mobile-first

À la fin, donne :
- fichiers créés/modifiés
- migrations
- commandes
- variables `.env.local`
- procédure connexion Supabase
- lancement local
- déploiement Netlify
- tests manuels
- reste à faire Phase 1
