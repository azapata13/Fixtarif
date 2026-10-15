# Demonstration Sandra

Ce dossier contient le parcours de demonstration de Fixtarif. Toutes les donnees du scenario sont fictives et les documents generes sont des brouillons internes, jamais des documents officiels de douane ou de transport.

## Objectif de la revue

Valider que le parcours est suffisamment simple pour une premiere utilisatrice et recueillir les priorites avant la V2 : champs, controles, documents et source officielle de classement HS/HTS.

## Acces au scenario

1. Ouvrir `https://app.fixtarif.ca/fr/dashboard` et se connecter.
2. Cliquer `Preparer la demo` seulement si les donnees de demonstration ne sont pas deja presentes.
3. Ouvrir l'expedition `ST-DEMO-CA`.
4. Parcourir les etapes, puis ouvrir `Documents` et generer le packing slip et le BOL brouillon.
5. Ouvrir `ST-DEMO-US` pour essayer la recherche et la validation HTS. Une suggestion HTS reste toujours en validation humaine.

## Points a commenter

- Quels renseignements devraient etre saisis une seule fois dans Reglages et reutilises?
- Quels champs d'une expedition reelle sont manquants ou inutiles?
- Le packing slip et le BOL brouillon ont-ils les bonnes sections et le bon ordre?
- Qu'est-ce qui doit bloquer la generation d'un brouillon? Qu'est-ce qui devrait seulement afficher un avertissement?
- Quelle source officielle doit alimenter la recherche HS/HTS et quelles informations de preuve doivent etre conservees?

## Limites connues du MVP

- Le depot PDF/image est prive, mais la pre-analyse est volontairement une fiche de revision manuelle; ce n'est pas encore une extraction par IA.
- Aucun classement HTS/HS, document douanier, CUSMA ou connaissement n'est emis automatiquement comme document officiel.
- Les tarifs, revisions et changements reglementaires ne sont pas encore synchronises depuis une source contractuelle validee.

Voir [HS_SOURCE_INTAKE.md](HS_SOURCE_INTAKE.md) pour les informations necessaires avant l'integration d'une source fiable.
