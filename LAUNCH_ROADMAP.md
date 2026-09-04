# Fixtarif - launch roadmap

## Positionnement

Fixtarif est un assistant de preparation d'expedition Canada / Etats-Unis.

Promesse produit:

```text
Importer -> verifier -> generer
```

Le MVP doit rester centre sur les PME: expedition, validation, documents. API, ERP, SSO et integrations personnalisees restent hors priorite tant que les vrais clients ne les demandent pas.

## Plans envisages

| Plan | Mensuel CAD | Annuel CAD | Cible |
| --- | ---: | ---: | --- |
| Essentiel | 39 | 390 | Tres petite entreprise |
| Pro | 89 | 890 | PME principale |
| Business | 179 | 1790 | Equipe et volume superieur |
| Enterprise | 399+ | Sur mesure | Grand compte |

Notes:

- L'annuel represente environ deux mois gratuits.
- Pro est l'offre principale pour le lancement.
- Enterprise attendra la demande reelle: API, ERP, SSO, onboarding, templates, SLA.

## Offre de lancement

- 30 premieres entreprises.
- 45 jours gratuits sur Pro, sans engagement.
- Option fondateur: 59 CAD/mois pendant 12 a 24 mois.
- Apres la phase initiale: 30 jours d'essai gratuit sur Pro.

Objectifs:

- Observer les vrais workflows.
- Corriger les frictions.
- Obtenir temoignages et cas clients.
- Mesurer le temps economise.

## Garde-fous produit

- Ne pas vendre un produit gratuit permanent.
- Ne pas automatiser HTS/CUSMA sans validation humaine et reglementaire.
- Ne pas complexifier le MVP pour un client Enterprise hypothetique.
- Construire d'abord un excellent produit PME.

## Ordre recommande

1. Prototype local fiable pour Sandra.
2. Deploy Netlify groupe seulement quand le parcours local est valide.
3. V1 beta privee avec import source, packing slip brouillon et bibliotheques.
4. V2 documents avances: PDF Canada, historique, URLs signees, edition complete.
5. V3 USA: facture commerciale, HTS, CUSMA, courtier, blocages de validation.
6. API/ERP seulement apres signaux clients.
