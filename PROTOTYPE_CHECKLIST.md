# Fixtarif - checklist prototype

## Etat local actuel

- Application privee sur `app.fixtarif.ca`, developpement local sur `http://localhost:3000`.
- Auth Supabase email/mot de passe et Google OAuth branches.
- Workspace, roles `owner/admin/member`, RLS et dashboard admin actifs.
- Bibliotheques: entreprises, sites, contacts, produits, transporteurs, courtiers.
- Expedition Canada/USA manuelle: creation de brouillon, validation, transport, statut, duplication.
- Page Documents preparee: scan/import, PDF, HTS, CUSMA et automatisation douaniere visibles mais verrouilles.
- Nouvelle migration Supabase preparee pour documents, extractions, PDF generes et tables douanieres USA.
- Scan/import, PDF avance, HTS et CUSMA restent volontairement non automatises dans la demo actuelle.
- Les prochains modules garderont une validation humaine obligatoire avant toute generation ou classification.

## A lancer avant chaque push

```bash
npm run typecheck
npm run lint
npm run test:security
npm run build
```

## A verifier dans le navigateur

- Creer un client, un site et un contact.
- Creer un produit.
- Creer une expedition Canada depuis le dashboard.
- Creer une expedition USA et confirmer que le bloc Douane USA apparait dans le detail.
- Si la creation echoue, noter le message exact et verifier d'abord destination, site, contact, produit, transporteur, quantite et poids.
- Confirmer quantite et poids.
- Ajouter PRO/BOL si disponible.
- Passer en validation, puis en pret seulement lorsque la checklist est complete.
- Dupliquer une expedition et confirmer que quantite/poids/lot doivent etre revalides.
- Verifier `/fr/admin` pour confirmer que les evenements sensibles apparaissent.
- Verifier `/fr/documents` pour confirmer que les modules verrouilles s'affichent sans erreur.

## A faire par Felipe avant production reelle

- Tourner une seule fois en local avec le compte demo et valider le parcours complet.
- Quand on decide de redeployer, pousser tous les commits en une seule batch pour economiser Netlify.
- Appliquer la migration `supabase/migrations/20260903160000_documents_customs_foundation.sql` dans Supabase avant de tester upload/PDF/douane.
- Dans Supabase, garder seulement les URLs de redirection necessaires pour production et local.
- Avant un lancement public, regenerer les secrets partages pendant la configuration initiale.
- Activer MFA sur les comptes Google, Supabase, Netlify, GoDaddy et GitHub.

## Points de securite deja couverts

- RLS par `workspace_id`.
- Verification serveur du membership et des roles.
- Messages publics generiques pour les erreurs serveur.
- Logs serveur internes avec contexte d'action.
- Headers HTTP incluant CSP, HSTS, anti-clickjacking et permissions policy.
- Test statique contre secrets accidentels.
- Audit log pour actions d'expedition, equipe, reglages et bibliotheques.
- Validation serveur des liens workspace/client/site/contact/produit/transporteur avant creation d'expedition.
- Buckets documents prives prevus avec politiques Storage/RLS par workspace.

## Roadmap restante

### V1 demo propre pour Sandra

Objectif: montrer une fondation fiable, simple et claire.

- Tester le parcours complet local.
- Corriger les irritants visuels mobiles, surtout les boutons noirs.
- Corriger toute erreur restante lors de creation d'expedition.
- Montrer la page Documents comme roadmap produit integree, sans generation active.
- Faire un seul deploy Netlify groupe quand la demo locale est approuvee.
- Rotater les cles sensibles partagees pendant la configuration initiale avant une exposition plus large.

### V2 produit

Objectif: passer de "fondation de preparation" a assistant de documents.

- Scan/import: televersement prive, extraction brouillon, matching avec clients/sites/produits, aucune valeur inventee.
- PDF Canada: bordereau, etiquettes, connaissement simple si requis.
- Documents: stockage prive Supabase, URLs signees courtes, historique de generations.
- Verification intelligente: statut `confirme`, `a verifier`, `manquant` par champ.
- Edition complete: modifier/supprimer clients, sites, contacts, produits, transporteurs, courtiers.
- Invitations par courriel reelles.
- Landing page `fixtarif.ca` separee de `app.fixtarif.ca`.

### V3 USA / douane

Objectif: supporter les expeditions USA sans automatiser des declarations legales non validees.

- Champs USA: acheteur, consignee, courtier, valeur, devise, origine, incoterm/terme commercial.
- Facture commerciale brouillon avec validation humaine.
- HTS: champ structure et statut de validation, sans classification automatique avant validation officielle.
- CUSMA: stockage des donnees et pieces justificatives, mais generation seulement apres validation reglementaire.
- Regles de blocage: document impossible si les donnees douanieres requises sont manquantes.
