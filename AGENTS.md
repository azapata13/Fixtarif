# AGENTS.md — Instructions impératives à Codex

## 1. Produit
Fixtarif tourne autour d'un objet central : `Shipment`.
Les documents sont des sorties du Shipment. Ne crée pas des formulaires indépendants pour chaque document.

## 2. UX
Principe : **Valider au lieu de créer**.

Scan/import :
1. upload photo/PDF
2. extraction
3. matching avec la base
4. validation humaine
5. génération

Après extraction automatique :
- quantité : confirmation obligatoire
- poids : confirmation obligatoire
- HS/HTS : jamais validé uniquement par IA
- origine : jamais validée uniquement par IA
- valeur douanière : jamais validée uniquement par IA
- CUSMA : jamais déclaré admissible automatiquement par IA

## 3. Multi-tenant
Toutes les données métier sont scoppées par `workspace_id`.
RLS Supabase obligatoire. Aucun workspace ne doit pouvoir lire/modifier les données d'un autre.

## 4. Historique
Utiliser des snapshots dans les expéditions.
Modifier un client, produit ou HTS dans la bibliothèque ne doit jamais modifier rétroactivement un ancien document.

## 5. Qualité
- TypeScript strict
- pas de `any` injustifié
- migrations DB versionnées
- logique métier séparée de l'UI
- validation côté serveur
- aucune clé API secrète dans le navigateur
- tests sur permissions, duplication et moteur de validation

## 6. Règles sensibles
Ne jamais inventer :
- douane
- tarifs
- CUSMA
- matières dangereuses
- anti-dumping
- acier/aluminium
- clauses BOL
- signature électronique
- return of goods
- nombre légal de copies

Si non confirmé : TODO/configuration/blocage.

## 7. Scope initial
Construire dans cet ordre :
Auth → workspace → bibliothèques → Shipment Canada manuel → documents Canada → scan → USA → règles douanières validées.

Ne pas commencer par tracking temps réel, réseau partenaires, ERP, tarification transporteurs ou CUSMA automatisé.

## 8. Méthode
Avant chaque grande phase :
1. lire les `.md`
2. proposer le plan
3. implémenter par petits blocs
4. mettre à jour `DECISIONS.md` si nécessaire
