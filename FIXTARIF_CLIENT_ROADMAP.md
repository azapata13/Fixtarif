# Fixtarif --- Roadmap de l'expérience client

## Principe central

**UNE expédition → importer ou saisir → vérifier → compléter ce qui
manque → générer les documents.**

> **Valider au lieu de créer.**

## 1. Première configuration

Le client configure une seule fois : - entreprise, adresse et
responsable expédition; - téléphone, courriel et numéro de taxe; -
langue FR/EN, unités et devise; - format des références.

Il peut enregistrer : - clients et sites; - contacts de réception; -
sous-traitants; - produits/pièces; - transporteurs; - courtiers.

Objectif : ne plus ressaisir les informations récurrentes.

## 2. Nouvelle expédition

Le dashboard présente principalement : - **Nouvelle expédition** -
**Scanner / importer une feuille**

Le client peut saisir manuellement ou importer une photo/image/PDF.

## 3. Destination

Fixtarif demande : **Canada ou États-Unis ?**

### Canada

Workflow logistique : bordereau, emballages, poids/dimensions,
références, transporteur, étiquettes et connaissement si nécessaire.

### États-Unis

Ajouter : acheteur, courtier, facture commerciale, valeur/devise,
origine, HS/HTS, terme commercial et CUSMA lorsque les règles seront
validées.

## 4. Motif

Choix : - vente; - sous-traitance; - réparation; -
traitement/peinture; - retour/RMA; - échantillon/test; - matériel
prêté; - outils à retourner; - autre.

Le formulaire s'adapte au motif.

## 5. Scan / import

Flux : 1. téléversement privé; 2. lecture du document; 3. extraction
structurée; 4. matching avec produits/clients/sites existants; 5.
préremplissage; 6. validation humaine.

À extraire si présent : référence, PO/SO, client, destination, pièce,
numéro de pièce, quantité, poids, lot, contenant, note libératoire,
palettes/colis et dimensions.

**Après scan, quantité et poids doivent toujours être confirmés.**
Fixtarif ne doit jamais inventer une valeur absente.

## 6. Bibliothèque intelligente

Si le scan reconnaît `Idler #43567`, Fixtarif peut récupérer la fiche
enregistrée : description, dimensions, emballage, poids habituel,
origine et données HS/HTS.

Même principe pour un site : adresse, contact réception, heures, quai,
rendez-vous et instructions.

## 7. Écran « Vérifier l'expédition »

États simples : - **✓ Confirmé** - **! À vérifier** - **✕ Manquant**

Exemple : - Destination : ABC Manufacturing ✓ - Produit : Idler #43567
✓ - Quantité : 5 --- À confirmer - Poids : 1 250 lb --- À confirmer -
Lot : 26-84 - Palettes : 2

C'est l'écran central de Fixtarif.

## 8. Demander seulement ce qui manque

Ne pas afficher inutilement les champs déjà connus.

Demander surtout les variables de l'envoi : quantité, poids, lot, PO,
contenant, note libératoire, PRO/BOL et autres références propres à
l'expédition.

## 9. Transport

Sélectionner/créer le transporteur.

Demander : - Prépayé - Collect - Tiers

Puis : **Avez-vous besoin d'un connaissement ? Oui / Non**

Si le transporteur fournit son propre connaissement, ne pas en générer
inutilement.

## 10. États-Unis

Si USA : - acheteur identique au lieu de livraison ? oui/non; -
courtier; - valeur; - devise; - origine; - HS/HTS; - terme commercial.

Les données douanières peuvent être proposées, mais les informations
sensibles ne sont jamais validées automatiquement par l'IA.

## 11. Vérification finale

Checklist : - expéditeur; - destination; - produits; - quantités; -
poids; - emballages; - transporteur; - courtier si requis; - données
douanières requises.

Les erreurs importantes bloquent la génération; les autres créent un
avertissement.

## 12. Génération

### Canada

-   bordereau;
-   étiquettes;
-   connaissement si demandé.

### États-Unis

-   bordereau;
-   facture commerciale;
-   étiquettes;
-   connaissement si nécessaire;
-   CUSMA lorsque validé réglementairement.

Toutes les sorties utilisent les données de la même expédition.

## 13. Dupliquer

Bouton **Dupliquer**.

Conserver : client/sous-traitant, site, contact, produit, transporteur,
courtier, dimensions, emballage et instructions.

Revalider/réinitialiser : date, référence, quantité, poids, lot,
contenant, note libératoire, PRO/BOL, valeur douanière et données
sensibles.

Workflow récurrent idéal : **Dupliquer → changer le lot → confirmer
quantité → confirmer poids → générer.**

## 14. Expérience recherchée

Le client doit ressentir :

> **« J'ai quelque chose à expédier. Fixtarif récupère ce qu'il connaît,
> me demande ce qui manque, je vérifie et il prépare mes documents. »**

Expérience visible : **Importer → vérifier → générer**

Logique invisible : **Document → extraction → reconnaissance →
bibliothèque → règles Canada/USA → motif → validation humaine →
documents**

## Règle produit finale

Fixtarif est un **assistant de préparation d'expédition**, pas
simplement un générateur de PDF.

Sa valeur : - réutiliser les données; - éviter la saisie répétitive; -
détecter les informations; - demander seulement ce qui manque; - réduire
les oublis; - adapter le workflow; - générer les bons documents.
