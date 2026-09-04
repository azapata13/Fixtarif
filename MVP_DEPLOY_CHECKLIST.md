# Fixtarif - MVP deploy checklist

Objectif: faire un seul deploy Netlify propre, puis tester avec Sandra sans consommer le forfait inutilement.

## MVP inclus

- Connexion courriel/mot de passe et Google OAuth.
- Workspace prive avec roles `owner`, `admin`, `member`.
- Admin client visible seulement aux `owner/admin`.
- Admin interne Fixtarif visible seulement aux emails dans `FIXTARIF_PLATFORM_ADMIN_EMAILS`.
- Clients, sites, contacts, produits, transporteurs et courtiers.
- Bouton `Preparer la demo` sur le dashboard pour creer les donnees de test.
- Brouillons d'expedition Canada et USA, validation, duplication, statut `ready`.
- Import prive de documents sources.
- Packing slip PDF brouillon avec acces authentifie.
- Recherche HTS USITC cote serveur, suggestion `A verifier`, validation humaine, reverification USITC.

## MVP non inclus volontairement

- Scan IA automatique.
- Facture commerciale USA finale.
- Generation CUSMA.
- Classification HTS automatique sans validation humaine.
- Paiements, billing, ERP/API externe.

## Avant push/deploy

```bash
npm run typecheck
npm run lint
npm run test:security
npm run build
git status --short
```

## Variables Netlify

```bash
NEXT_PUBLIC_SUPABASE_URL=https://uavfhtnxfotvmghpnygm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://app.fixtarif.ca
NEXT_PUBLIC_APP_URL=https://app.fixtarif.ca
NEXT_PUBLIC_MARKETING_URL=https://fixtarif.ca
NEXT_PUBLIC_APP_NAME=Fixtarif
DEFAULT_LOCALE=fr
FIXTARIF_PLATFORM_ADMIN_EMAILS=z.felipealberto@gmail.com,zapatasx@gmail.com
```

Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` cote client.

## Test rapide apres deploy

1. Ouvrir `https://app.fixtarif.ca/fr/login`.
2. Se connecter avec Google.
3. Aller sur `Tableau`, cliquer `Preparer la demo`.
4. Ouvrir `Expeditions` et verifier les brouillons Canada/USA.
5. Ouvrir `Nouvelle expedition` et confirmer que Destination, Site, Contact, Transporteur et Produit ont un lien `Ajouter`.
6. En saisie manuelle, confirmer que le poids peut etre en `lb` ou `kg`.
7. Ouvrir l'expedition USA et verifier le bloc Douane USA.
8. Aller sur `Produits`, chercher un HTS, enregistrer `A verifier`, puis valider.
9. Retourner dans l'expedition USA et confirmer `HTS valide`.
10. Marquer une expedition `ready`, generer le packing slip, ouvrir le PDF.
11. Aller sur `Documents`, importer un petit fichier non sensible.
12. Aller sur `Admin` et verifier les logs.

## Go / no-go demo

Go si tous les tests passent, si les boutons sont lisibles sur mobile et si aucun document client reel n'est utilise.

No-go si une erreur RLS/Supabase apparait, si une page admin interne est visible par un compte non autorise, ou si le PDF/document est accessible sans session.
