# Fixtarif - checklist prototype

## Etat local actuel

- Application privee sur `app.fixtarif.ca`, developpement local sur `http://localhost:3000`.
- Auth Supabase email/mot de passe et Google OAuth branches.
- Workspace, roles `owner/admin/member`, RLS et dashboard admin actifs.
- Admin workspace visible seulement aux roles client `owner/admin`; section Fixtarif interne visible seulement aux emails serveur `FIXTARIF_PLATFORM_ADMIN_EMAILS`.
- Bibliotheques: entreprises, sites, contacts, produits, transporteurs, courtiers.
- Expedition Canada/USA manuelle: creation de brouillon, validation, transport, statut, duplication.
- Detail d'expedition simplifie par cartes et modals de section pour faciliter la demo.
- Page Documents preparee: import prive de documents sources actif; packing slip PDF brouillon prive actif; HTS live USITC en suggestion produit avec validation humaine owner/admin; CUSMA et automatisation douaniere visibles mais verrouilles.
- Nouvelle migration Supabase preparee pour documents, extractions, PDF generes et tables douanieres USA.
- Extraction scan, PDF avance, classification HTS automatique et CUSMA restent volontairement non automatises dans la demo actuelle.
- Les prochains modules garderont une validation humaine obligatoire avant toute generation ou classification.
- Roadmap lancement/pricing resumee dans `LAUNCH_ROADMAP.md` et visible dans l'admin.
- Checklist de deploy MVP ajoutee dans `MVP_DEPLOY_CHECKLIST.md`.

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
- Depuis `Nouvelle expedition`, verifier que les champs Destination/Site/Contact/Transporteur/Produit ont un lien `Ajouter`.
- Verifier que la saisie manuelle permet de choisir le poids en `lb` ou `kg`.
- Creer une expedition USA et confirmer que le bloc Douane USA apparait dans le detail.
- Si la creation echoue, noter le message exact et verifier d'abord destination, site, contact, produit, transporteur, quantite et poids.
- Confirmer quantite et poids.
- Ajouter PRO/BOL si disponible.
- Passer en validation, puis en pret seulement lorsque la checklist est complete.
- Generer un packing slip PDF brouillon seulement apres le statut `ready`, puis l'ouvrir via le lien signe.
- Depuis le detail d'expedition, verifier que la carte Documents propose l'import de fichier; camera/scan reste V2.
- Dupliquer une expedition et confirmer que quantite/poids/lot doivent etre revalides.
- Verifier `/fr/admin` pour confirmer que les evenements sensibles apparaissent.
- Verifier dans `/fr/admin` que la strategie lancement/pricing apparait seulement pour un admin interne Fixtarif.
- Verifier `/fr/documents` pour confirmer que l'import prive fonctionne avec PDF/PNG/JPG/WebP.
- Verifier `/fr/products?htsQuery=bracket` pour confirmer la recherche HTS officielle USITC.
- Dans `/fr/products`, cliquer `Reverifier USITC` sur un code HTS sauvegarde et confirmer le message aucun changement ou remise a verifier.
- Creer une expedition USA avec un produit enregistre et confirmer que le statut HTS apparait dans la creation, la liste et le detail.

## A faire par Felipe avant production reelle

- Tourner une seule fois en local avec le compte demo et valider le parcours complet.
- Utiliser `Preparer la demo` depuis le dashboard pour creer rapidement les donnees de test avant de montrer l'app.
- Quand on decide de redeployer, pousser tous les commits en une seule batch pour economiser Netlify.
- Appliquer la migration `supabase/migrations/20260903160000_documents_customs_foundation.sql` dans Supabase avant de tester upload/PDF/douane.
- Tester l'import avec un petit fichier non sensible; les vrais documents clients attendront la validation de securite finale.
- Dans Supabase, garder seulement les URLs de redirection necessaires pour production et local.
- Avant un lancement public, regenerer les secrets partages pendant la configuration initiale.
- Activer MFA sur les comptes Google, Supabase, Netlify, GoDaddy et GitHub.
- Decider si le premier deploy public montre seulement `app.fixtarif.ca`, ou si on ajoute une landing separee `fixtarif.ca`.
- Definir `FIXTARIF_PLATFORM_ADMIN_EMAILS` dans Netlify avec les emails internes autorises, separes par virgule.

## Points de securite deja couverts

- RLS par `workspace_id`.
- Verification serveur du membership et des roles.
- Messages publics generiques pour les erreurs serveur.
- Logs serveur internes avec contexte d'action.
- Headers HTTP incluant CSP, HSTS, anti-clickjacking et permissions policy.
- Refresh tokens Supabase expires nettoyes proprement au lieu de polluer les logs serveur.
- Test statique contre secrets accidentels.
- Audit log pour actions d'expedition, equipe, reglages et bibliotheques.
- Validation serveur des liens workspace/client/site/contact/produit/transporteur avant creation d'expedition.
- Buckets documents prives prevus avec politiques Storage/RLS par workspace.
- Portail support client prevu seulement avec consentement explicite, acces temporaire et audit complet.
- HTS live consulte l'API USITC cote serveur et sauvegarde seulement une suggestion `needs_review`.
- Les produits affichent l'etat HTS USA en langage simple: `Manquant`, `A verifier`, `Valide`, `Rejete`.
- Les expeditions USA affichent l'etat HTS du produit et gardent la facture commerciale bloquee tant que les donnees douanieres ne sont pas validees.
- La reverification HTS USITC est disponible manuellement. Si taux, description ou unites changent, le statut revient a `A verifier`.

## Roadmap restante

### V1 demo propre pour Sandra

Objectif: montrer une fondation fiable, simple et claire.

- Tester le parcours complet local.
- Corriger les irritants visuels mobiles, surtout les boutons noirs.
- Corriger toute erreur restante lors de creation d'expedition.
- Montrer la page Documents comme roadmap produit integree, avec import source actif et packing slip brouillon.
- Faire un seul deploy Netlify groupe quand la demo locale est approuvee.
- Rotater les cles sensibles partagees pendant la configuration initiale avant une exposition plus large.

### V2 produit

Objectif: passer de "fondation de preparation" a assistant de documents.

- Scan/import: televersement prive actif; prochaine etape extraction brouillon, matching avec clients/sites/produits, aucune valeur inventee.
- PDF Canada: packing slip brouillon actif; prochaine etape bordereau avance, etiquettes, connaissement simple si requis.
- Documents: stockage prive Supabase, URLs signees courtes, historique de generations.
- Verification intelligente: statut `confirme`, `a verifier`, `manquant` par champ.
- Surveillance des donnees officielles: ajouter une tache planifiee quotidienne/hebdomadaire qui reverifie les HTS valides, journalise les changements et notifie les admins.
- Edition complete: modifier/supprimer clients, sites, contacts, produits, transporteurs, courtiers.
- Invitations par courriel reelles.
- Landing page `fixtarif.ca` separee de `app.fixtarif.ca`.
- Pricing lancement: Pro a 89 CAD/mois, 45 jours gratuits pour les 30 premieres entreprises, puis offre fondateur optionnelle.
- Admin interne Fixtarif: vue support des portails clients, sans impersonation silencieuse.

### V3 USA / douane

Objectif: supporter les expeditions USA sans automatiser des declarations legales non validees.

- Champs USA: acheteur, consignee, courtier, valeur, devise, origine, incoterm/terme commercial.
- Facture commerciale brouillon avec validation humaine.
- HTS: recherche live USITC active, champ structure, statut de validation humain et rappel dans les expeditions USA, sans classification automatique avant validation officielle.
- CUSMA: stockage des donnees et pieces justificatives, mais generation seulement apres validation reglementaire.
- Regles de blocage: document impossible si les donnees douanieres requises sont manquantes.
