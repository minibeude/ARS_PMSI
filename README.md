# Outils PMSI

Ce dépôt est un portail web statique destiné à regrouper plusieurs outils PMSI publiables sur GitHub Pages. La page d'accueil `index.html` liste les applications disponibles et les outils prévus avec une interface homogène et extensible.

## Arborescence du portail

```text
.
├── AGENTS.md                   # Guide permanent pour les futurs développements Codex
├── README.md
├── index.html                  # Page d'accueil du portail « Outils PMSI »
├── assets/
│   └── css/
│       └── style.css           # Variables globales et composants CSS partagés
└── validations-pmsi/
    └── index.html              # Tableau des validations PMSI
```

Chaque outil doit vivre dans son propre dossier à la racine du dépôt, par exemple :

```text
validations-pmsi/
ovalide/
exports/
```

Chaque dossier d'outil contient son propre `index.html` afin que les applications restent indépendantes.

## Compatibilité GitHub Pages

Tous les liens utilisent des chemins relatifs (`./validations-pmsi/`, `../assets/css/style.css`) afin de rester compatibles avec GitHub Pages, y compris lorsque le dépôt est publié dans un sous-répertoire.

N'utilisez pas de chemins absolus pour les pages, feuilles de style, scripts ou ressources.

## Composants CSS partagés

La feuille `assets/css/style.css` contient les variables globales du portail et les composants réutilisables.

### Boutons

Utilisez toujours la base `btn` avec une variante :

- `btn btn-primary` pour l'action principale ;
- `btn btn-secondary` pour une action secondaire ou un retour ;
- `btn btn-disabled` pour une action indisponible.

### Cartes

Utilisez `card` pour les conteneurs visuels réutilisables. Les sous-éléments disponibles sont :

- `card-header` ;
- `card-body` ;
- `card-footer`.

### Badges

Utilisez :

- `badge badge-success` pour les états disponibles ;
- `badge badge-warning` pour les états à venir ou en attente.

Ne recréez pas de bouton, carte ou badge spécifique si un composant partagé couvre déjà le besoin.

## Tableau des validations PMSI

Ouvrez `validations-pmsi/index.html` depuis le portail ou directement dans un navigateur moderne, sélectionnez les 8 fichiers TDB CSV et le fichier CSV de répartition, puis cliquez sur **Générer**.

Les noms de fichiers TDB doivent suivre le format `champ.secteur.annee.mois.TDB.csv`, par exemple `mco.dgf.2026.7.TDB.csv`.

## Ajouter un nouvel outil

1. Créez un dossier dédié à la racine du dépôt, par exemple `nouvel-outil/`.
2. Ajoutez l'application dans `nouvel-outil/index.html`.
3. Réutilisez les styles communs avec un lien relatif :
   ```html
   <link rel="stylesheet" href="../assets/css/style.css" />
   ```
4. Structurez l'interface avec les composants partagés (`btn`, `card`, `badge`).
5. Ajoutez une carte dans la grille de la page racine `index.html` avec un lien relatif vers `./nouvel-outil/`.
6. Si l'outil a besoin de styles supplémentaires, créez uniquement des classes réutilisables ou clairement préfixées par l'outil.
7. Vérifiez l'affichage desktop, tablette et mobile.

Consultez `AGENTS.md` avant toute évolution afin de préserver les conventions du portail et d'éviter les régressions sur la logique métier des outils existants.
