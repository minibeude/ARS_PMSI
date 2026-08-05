# AGENTS.md

## Objectif du projet

Ce dépôt contient un portail web regroupant plusieurs outils PMSI. Chaque outil est indépendant.

L'objectif est de proposer une interface moderne, cohérente et facilement extensible.

## Architecture

La page d'accueil est :

- `/index.html`

Chaque outil possède son propre dossier :

- `/validations-pmsi/`
- `/ovalide/`
- `/exports/`
- `/...`

Chaque outil possède son propre :

- `index.html`

## GitHub Pages

Toujours utiliser des chemins relatifs.

Ne jamais utiliser de chemins absolus.

Le site doit rester compatible GitHub Pages.

## CSS

Toujours utiliser les composants existants.

Ne jamais recréer un bouton spécifique.

Utiliser :

- `btn`
- `btn-primary`
- `btn-secondary`
- `btn-disabled`

Utiliser :

- `card`

Utiliser :

- `badge-success`
- `badge-warning`

Créer de nouveaux composants uniquement lorsqu'ils seront réutilisables.

## HTML

Ne jamais utiliser de styles inline.

Privilégier les classes CSS.

## JavaScript

Ne jamais modifier la logique métier sauf demande explicite.

Préserver :

- imports CSV
- calculs
- tableaux
- export Excel

## Responsive

Toutes les nouvelles pages doivent fonctionner :

- desktop
- tablette
- mobile

## Bonnes pratiques

Toujours privilégier :

- composants réutilisables
- CSS factorisé
- code lisible
- commentaires lorsque nécessaire

Éviter toute duplication.
