# Outils PMSI

Ce dépôt est un portail web statique destiné à regrouper plusieurs outils PMSI publiables sur GitHub Pages. La page d'accueil `index.html` liste les applications disponibles et les outils prévus.

## Arborescence

```text
.
├── index.html                  # Page d'accueil du portail « Outils PMSI »
├── assets/
│   └── css/
│       └── style.css           # Styles communs au portail et aux applications
└── validations-pmsi/
    └── index.html              # Tableau des validations PMSI
```

Tous les liens utilisent des chemins relatifs (`./validations-pmsi/`, `../assets/css/style.css`) afin de rester compatibles avec GitHub Pages, y compris lorsque le dépôt est publié dans un sous-répertoire.

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
4. Ajoutez une carte dans la grille de la page racine `index.html` avec un lien relatif vers `./nouvel-outil/`.
5. Si l'outil a besoin de styles spécifiques, privilégiez des classes préfixées par le nom de l'outil pour éviter les collisions avec les autres applications.
