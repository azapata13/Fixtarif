# Fixtarif - production runbook

## Objectif du prochain deploy

Publier une version propre de demonstration sur `app.fixtarif.ca` sans activer de fonctions legales non validees.

Inclus:

- Auth email/password et Google OAuth.
- Workspace multi-tenant avec roles `owner`, `admin`, `member`.
- Dashboard, admin, equipe, reglages.
- Bibliotheques entreprises, sites, contacts, produits, transporteurs, courtiers.
- Expeditions Canada/USA en brouillon, validation, duplication.
- Import prive de documents source.
- Packing slip PDF brouillon prive avec URL signee courte.
- Recherche HTS live via USITC, sauvegardee seulement comme suggestion `needs_review`, puis validable par owner/admin.
- Page Documents montrant PDF/CUSMA comme modules verrouilles.

Non inclus:

- Extraction IA depuis scans.
- PDF legal/final avance.
- Classification HTS automatique.
- Generation CUSMA.
- API/ERP.
- Paiement/billing.

## Avant deploy Netlify

Executer:

```bash
npm run typecheck
npm run lint
npm run test:security
npm run build
```

Verifier:

- `git status --short` propre.
- Toutes les migrations Supabase appliquees.
- Aucun secret dans les fichiers versionnes.
- `.env.local` absent du commit.

## Variables Netlify requises

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://app.fixtarif.ca
NEXT_PUBLIC_APP_URL=https://app.fixtarif.ca
NEXT_PUBLIC_MARKETING_URL=https://fixtarif.ca
NEXT_PUBLIC_APP_NAME=Fixtarif
DEFAULT_LOCALE=fr
FIXTARIF_PLATFORM_ADMIN_EMAILS=
```

Notes:

- La service role key reste serveur seulement.
- `FIXTARIF_PLATFORM_ADMIN_EMAILS` contient seulement les emails internes Fixtarif autorises, separes par virgule.
- Les secrets partages pendant la configuration initiale devront etre regeneres avant une exposition plus large.
- Garder le deploy groupe pour economiser le forfait gratuit Netlify.
- Pour HTS USA, utiliser la recherche officielle USITC uniquement comme aide. Les codes sauvegardes commencent en `A verifier`; seuls les roles `owner/admin` peuvent les marquer `Valide`.
- Les factures commerciales USA doivent rester bloquees tant que HTS, origine et CUSMA ne sont pas confirmes.
- `Reverifier USITC` compare le code sauvegarde avec la source officielle. Si taux, description ou unites changent, le code revient a `A verifier`.

## Supabase production

Authentication URL Configuration:

- Site URL: `https://app.fixtarif.ca`
- Redirect URLs:
  - `https://app.fixtarif.ca/auth/callback`
  - `http://localhost:3000/auth/callback`

Storage:

- `source-documents` prive.
- `generated-documents` prive.
- Pas de bucket public pour documents clients.

Securite:

- RLS active sur toutes les tables multi-tenant.
- Test RLS a relancer avant deploy.
- URLs signees courtes pour ouvrir les PDF.

## DNS

Application:

- `app.fixtarif.ca` pointe vers Netlify.

Marketing:

- `fixtarif.ca` reste separe et pourra devenir une landing page.

## Test de demonstration

1. Connexion Google.
2. Verifier le workspace et le role owner.
3. Creer ou verifier deux clients demo.
4. Creer ou verifier deux produits demo.
5. Creer une expedition Canada.
6. Confirmer destination, site, contact, produit, quantite, poids, transporteur.
7. Marquer l'expedition `ready`.
8. Generer un packing slip brouillon.
9. Ouvrir le PDF via le lien signe.
10. Importer un petit document source non sensible.
11. Creer une expedition USA et verifier le bloc Douane USA verrouille.
12. Ouvrir `/fr/admin` et confirmer les logs d'activite.
13. Confirmer que la section Fixtarif interne est visible seulement pour un email interne autorise.
14. Chercher un HTS dans `/fr/products`, sauvegarder une suggestion, confirmer le statut `A verifier`.
15. Valider le HTS comme owner/admin et confirmer que l'expedition USA affiche `HTS valide`.
16. Cliquer `Reverifier USITC` et confirmer que l'app garde `Valide` si rien n'a change.

## Decision go / no-go

Go demo si:

- Le parcours ci-dessus fonctionne en local.
- Aucun test local n'echoue.
- Les boutons restent lisibles sur mobile.
- Les documents prives s'ouvrent uniquement via route authentifiee.

No-go si:

- Erreur Supabase/RLS en creation d'expedition.
- PDF impossible a generer apres statut `ready`.
- Recherche HTS exposee cote client avec une cle secrete ou sauvegarde une classification comme validee automatiquement.
- Acces document possible sans session.
- Bloc Fixtarif interne visible par un client non autorise.
- Secrets visibles dans logs publics ou fichiers versionnes.
