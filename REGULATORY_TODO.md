# Regulatory TODO — NE PAS INVENTER

À valider avant automatisation commerciale :

## CUSMA
- quand requis/utile
- champs officiels
- critères d'origine
- formulation de certification
- critères A/B/C mentionnés dans les notes métier

## Connaissement
- modèle légal
- clauses obligatoires
- Canada vs USA
- signatures
- signature électronique

## Matières dangereuses
- classes UN
- contenants vides
- seuils
- documents requis
- règles de blocage

## Incoterms
- DDP
- DAP
- FCA si applicable
- terminologie exacte

## Acier/aluminium et anti-dumping
Aucune déclaration automatique sans règle officielle et données validées.

## HTS USA
- Source live actuelle: recherche officielle USITC cote serveur.
- L'app peut enregistrer une suggestion `needs_review`, mais ne doit jamais declarer un HTS comme legalement valide sans action humaine.
- La validation HTS doit etre reservee aux roles workspace `owner/admin`.
- Les documents USA doivent rester bloques si HTS, origine, CUSMA ou facture commerciale sont incomplets.
- Une reverification USITC peut detecter changement de taux, description ou unites; tout changement doit remettre le code a `needs_review`.
- Avant automatisation, ajouter historique des changements HTS et notification aux admins.

## Return of Goods / RMA
À définir précisément pour sous-traitance, réparation, retour fournisseur et retour au Canada.

## Copies papier
Rendre configurable jusqu'à confirmation.

## Calcul espace remorque
Conserver poids/dimensions en V1, mais ne pas promettre de taux/réservation avant validation de la formule.
