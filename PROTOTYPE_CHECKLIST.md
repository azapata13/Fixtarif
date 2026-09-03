# Fixtarif - checklist prototype

## Etat local actuel

- Application privee sur `app.fixtarif.ca`, developpement local sur `http://localhost:3000`.
- Auth Supabase email/mot de passe et Google OAuth branches.
- Workspace, roles `owner/admin/member`, RLS et dashboard admin actifs.
- Bibliotheques: entreprises, sites, contacts, produits, transporteurs, courtiers.
- Expedition Canada manuelle: creation de brouillon, validation, transport, statut, duplication.
- PDF, scan/import, HTS et CUSMA restent volontairement non branches.

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
- Confirmer quantite et poids.
- Ajouter PRO/BOL si disponible.
- Passer en validation, puis en pret seulement lorsque la checklist est complete.
- Dupliquer une expedition et confirmer que quantite/poids/lot doivent etre revalides.
- Verifier `/fr/admin` pour confirmer que les evenements sensibles apparaissent.

## A faire par Felipe avant production reelle

- Tourner une seule fois en local avec le compte demo et valider le parcours complet.
- Quand on decide de redeployer, pousser tous les commits en une seule batch pour economiser Netlify.
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
