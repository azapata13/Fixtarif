# Implementation plan

## Phase 0 — Fondation
Next.js, TS strict, Tailwind, Supabase, Auth, workspace, roles, RLS, FR/EN, navigation, placeholders, migrations.

Sortie : login fonctionnel + dashboard privé isolé par workspace.

À compléter après mise en ligne :
- tester création compte + confirmation courriel
- configurer Google OAuth
- préparer dashboard admin interne sécurisé

## Phase 1 — Bibliothèques
Profil entreprise, businesses/sites/contacts, products, carriers, brokers.

Inclure :
- structure de permissions UI par rôle
- base du dashboard admin interne, sans accès direct aux données tenant hors contrôle explicite

## Phase 2 — Shipment manuel Canada
Wizard, items, packages, references, transport, validation, autosave, duplication.

## Phase 3 — Documents Canada
Bordereau, étiquettes, preview PDF, versioning.
BOL seulement avec template légal validé.

## Phase 4 — Scan
Upload privé, extraction, JSON schema, matching, écran de validation, confirmation quantité/poids.

## Phase 5 — USA
Buyer vs consignee, broker, valeurs/devise, customs fields, facture commerciale, cas spéciaux, HTS.

## Phase 6 — Réglementaire
CUSMA, hazmat, clauses BOL, acier/aluminium, antidumping, return of goods après validation.

## Phase 7 — QA
Responsive, permissions, duplication, snapshots, scan, CSV, logs, audit.
