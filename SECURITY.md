# Security

Fixtarif doit être construit avec une posture Zero Trust et une couverture OWASP dès la fondation.

## Domaines

- `fixtarif.ca` : site public.
- `app.fixtarif.ca` : application authentifiée.
- Les données privées, endpoints serveur, cookies d'auth et fichiers privés appartiennent au domaine applicatif.

## Principes obligatoires

- Deny-by-default.
- Auth obligatoire pour toute page privée.
- Vérification serveur de chaque action.
- `workspace_id` obligatoire pour toute donnée métier.
- RLS Supabase obligatoire sur les tables multi-tenant.
- Aucun secret dans le navigateur.
- Service role Supabase uniquement côté serveur, et uniquement pour les tâches qui l'exigent.
- Validation côté serveur avant toute écriture.
- Buckets storage privés.
- URLs signées temporaires pour les fichiers.
- Audit log avant les actions sensibles.

## OWASP Top 10 2025

La référence web courante est OWASP Top 10 2025.

Contrôles Fixtarif :

- A01 Broken Access Control : RLS, memberships, rôles `owner/admin/member`.
- A02 Security Misconfiguration : variables séparées, headers, environnements distincts.
- A03 Software Supply Chain Failures : lockfile, dépendances minimales, audit.
- A04 Cryptographic Failures : HTTPS, cookies sécurisés, pas de secrets côté client.
- A05 Injection : Supabase client typé, pas de SQL dynamique non contrôlé.
- A06 Insecure Design : multi-tenant et permissions dès Phase 0.
- A07 Authentication Failures : Supabase Auth, middleware, routes protégées.
- A08 Software or Data Integrity Failures : migrations versionnées, déploiements contrôlés.
- A09 Security Logging and Alerting Failures : audit log prévu avant workflows sensibles.
- A10 Mishandling of Exceptional Conditions : erreurs propres, pas de détails internes exposés.

## Checklist avant production

- Configurer `app.fixtarif.ca` comme URL applicative.
- Configurer `fixtarif.ca` séparément pour le site public.
- Activer HTTPS strict via Cloudflare et Netlify.
- Ajouter les variables Supabase uniquement dans Netlify.
- Appliquer les migrations RLS.
- Tester qu'un utilisateur ne peut pas lire un autre workspace.
- Vérifier `npm audit`.
- Vérifier les headers HTTP en production.

## Tests sécurité

Test RLS rapide :

```bash
npm run test:rls
```

Ce test crée deux utilisateurs temporaires, crée un workspace avec le premier, confirme que le deuxième ne peut pas lire ce workspace ni son profil entreprise, puis supprime les données temporaires.
