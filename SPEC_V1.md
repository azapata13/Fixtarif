# Fixtarif — Spécification V1

## Pages

### /login
Connexion, récupération, auth.

### /onboarding
Entreprise :
- nom légal*
- nom commercial
- adresse*
- ville*
- province/région*
- code postal*
- pays*
- téléphone*
- courriel
- numéro taxe

Responsable expédition :
- nom*
- poste
- téléphone*
- extension
- courriel*

Préférences :
- FR/EN
- lb/kg
- in/cm
- CAD/USD
- numérotation auto oui/non
- format référence
- préfixes

### /dashboard
- Nouvelle expédition
- Scanner/importer
- Expéditions récentes
- Brouillons/validations
- Produits
- Entreprises
- Transporteurs
- Courtiers

### /shipments
Liste + recherche par référence, PO, produit, numéro pièce, client, RMA.
Actions : ouvrir, dupliquer, documents, archiver.

### /shipments/new
Wizard :
1. scanner/importer OU manuel
2. destination Canada/USA
3. motif : vente, sous-traitance, réparation, peinture/traitement, retour/RMA, échantillon/test, prêt/outils, autre
4. expéditeur
5. destinataire/site/contact réception
6. USA : acheteur si différent
7. produits
8. palettes/colis
9. transport
10. USA : courtier + douane
11. validation
12. génération

Champs ligne produit :
- nom*
- numéro pièce
- quantité*
- lot
- séries
- poids*
- dimensions
- emballage*
- empilable
- contenant
- note libératoire
- PO/SO/projet
- notes

Transport :
- transporteur
- PRO
- BOL
- prépayé/collect/tiers
- tiers payeur
- besoin connaissement oui/non

USA :
- courtier
- valeur
- devise
- HS/HTS
- origine
- terme commercial
- CUSMA seulement si validé

### /products
Nom, part number, descriptions, poids, dimensions, emballage, empilable, valeur, devise, HS/HTS, origine, statut validation.

### /companies
Entreprise + plusieurs sites + plusieurs contacts.
Site : heures, dock, flatbed, rendez-vous, appeler avant, notes.
Contacts : commercial, réception, expédition, projet, comptabilité.

### /carriers
Nom, type LTL/FTL/flatbed/autre, contact, fournit BOL par défaut.

### /brokers
Nom, contact, email, téléphone, adresse, favori USA.

### /documents
Liste, preview, version, téléchargement.

### /team
Membres owner/admin/member + invitations.

### /settings
Entreprise, unités, langue, référence auto, préfixes, documents.

## Scan/import

Entrées :
- photo
- image
- PDF

Flux :
1. upload privé
2. extraction document
3. JSON strict
4. matching base
5. validation humaine
6. création Shipment
7. génération documents

Extraire si présent :
- référence
- PO/SO
- client/destination
- nom pièce
- numéro pièce
- quantité
- poids
- lot
- contenant
- note libératoire
- palettes/colis
- dimensions
- mentions dessin/rayon X

Toujours confirmer après extraction :
- quantité
- poids

Ne jamais inventer :
- valeur absente
- HS/HTS
- origine
- CUSMA
- tarifs

## Canada
Documents :
- bordereau
- étiquettes
- connaissement seulement si demandé + template légal validé

Bordereau :
expéditeur, consignataire, date, référence, transporteur, BOL/PRO, paiement, message, lignes, quantité, emballages, poids, dimensions, lots/séries/références.

Étiquettes :
1 de N, transporteur, BOL/référence, destination optionnelle.

## USA
Prévoir :
- bordereau
- facture commerciale
- connaissement si nécessaire
- CUSMA seulement après validation

Facture commerciale :
- expéditeur
- lieu livraison
- acheteur distinct possible
- courtier
- transporteur/BOL/référence
- terme commercial
- lignes : produit, part#, HS/HTS, quantité, référence/lot, prix unitaire, total, devise
- palettes
- poids
- zone signature imprimée/date

Cas spéciaux :
- sous-traitance
- réparation/traitement
- retour/RMA
- échantillon

## Validation

Bloquants de base :
- nom pièce manquant
- quantité manquante
- poids manquant
- emballage manquant
- destination manquante
- adresse incomplète avant document final
- données requises USA manquantes pour document demandé

Avertissements :
- dimensions manquantes
- lot absent
- référence contenant absente
- empilable inconnu
- conflit scan vs bibliothèque

## Duplication
Copier données réutilisables.
Forcer revue/reset :
date, référence, lot, contenant, note libératoire, quantité, poids, PRO, BOL, valeur douanière et données sensibles.

## Export
CSV historique minimum.

## Hors V1 initial
Tracking temps réel, intégrations transporteurs avancées, ERP, réseau partenaires, calcul tarifaire transporteur, CUSMA automatisé, signature électronique certifiée.
