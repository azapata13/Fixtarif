# Architecture

## Frontend
Next.js App Router, TypeScript strict, Tailwind, responsive, mobile-first.

## Domaines
- `fixtarif.ca` : site public, landing page, marketing, documentation publique.
- `app.fixtarif.ca` : application privée avec authentification obligatoire.
- Les cookies et redirections d'auth doivent viser le domaine applicatif.
- Le site public ne doit jamais charger la service-role key, appeler des endpoints privés ou exposer des données workspace.

## Backend
Server Actions ou routes API Next.js.
Tout appel DB, IA, génération PDF et données douanières sensibles doit passer côté serveur.

## Supabase
- Auth
- PostgreSQL
- Storage privé

Buckets prévus :
- `source-documents`
- `generated-documents`

## Services
- `ShipmentService`
- `ExtractionService`
- `MatchingService`
- `ValidationService`
- `DocumentService`
- `CustomsService`
- `ReferenceService`

## Sécurité
- workspace_id partout
- RLS
- URLs signées temporaires pour les fichiers
- aucune service-role key côté client
- audit des actions sensibles
- validation côté serveur pour toute écriture
- deny-by-default pour les accès DB et storage
- principe du moindre privilège pour les rôles applicatifs
- secrets uniquement en variables d'environnement serveur
- headers HTTP de base configurés dans Next.js
- dépendances surveillées avant déploiement

## Zero Trust
- Ne jamais faire confiance au client : chaque action serveur doit revérifier `auth.uid()`, le membership workspace et le rôle requis.
- Ne jamais utiliser un `workspace_id` fourni par l'interface sans vérifier que l'utilisateur en est membre actif.
- Les permissions UI ne sont que de l'ergonomie; la sécurité réelle est côté serveur + RLS.
- Les exports, fichiers et documents futurs doivent utiliser des URLs signées courtes et des buckets privés.
- Les opérations sensibles doivent être journalisées dans un audit log versionné.

## OWASP
Références de conception :
- OWASP Top 10 Web Application Security Risks 2025
- OWASP API Security Top 10 2023

Mesures Phase 0 :
- Broken Access Control : RLS obligatoire et checks workspace côté serveur.
- Security Misconfiguration : `.env.example`, séparation public/server, headers Next.js.
- Supply Chain : lockfile npm, `npm audit`, dépendances limitées.
- Cryptographic Failures : HTTPS obligatoire en production, aucune clé secrète côté client.
- Injection : accès DB via client Supabase typé, pas de SQL dynamique applicatif.
- Insecure Design : modèle multi-tenant pensé dès le départ.
- Authentication Failures : Supabase Auth, middleware session, routes privées.
- Integrity Failures : migrations SQL versionnées.
- Logging/Alerting : audit log prévu avant actions sensibles.
- Exceptional Conditions : erreurs utilisateur propres, pas de fuite de secrets.

## Environnements
- local
- preview
- production
