# Outils PMSI

Ce dépôt est un portail web statique destiné à regrouper plusieurs outils PMSI publiables sur GitHub Pages. La page d'accueil `index.html` liste les applications disponibles et les outils prévus avec une interface homogène et extensible.

## Arborescence du portail

```text
.
├── AGENTS.md
├── README.md
├── index.html
├── assets/
│   └── css/
│       └── style.css
├── signature-arretes/
│   ├── index.html
│   └── app.js
└── validations-pmsi/
    └── index.html
```

Chaque outil doit vivre dans son propre dossier à la racine du dépôt, par exemple `validations-pmsi/`, `signature-arretes/`, `ovalide/` ou `exports/`. Chaque dossier d'outil contient son propre `index.html` afin que les applications restent indépendantes.

## Compatibilité GitHub Pages

Tous les liens utilisent des chemins relatifs (`./validations-pmsi/`, `./signature-arretes/`, `../assets/css/style.css`) afin de rester compatibles avec GitHub Pages, y compris lorsque le dépôt est publié dans un sous-répertoire.

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

## Signature des arrêtés de versement

Le nouvel outil est disponible dans `signature-arretes/`. Il permet d'ajouter une image de signature à plusieurs arrêtés de versement au format RTF, de générer un PDF signé par arrêté et de télécharger tous les PDF réussis dans une archive ZIP créée à la demande.

### Fonctionnement

1. L'utilisateur sélectionne un ou plusieurs fichiers `.rtf`, ou les glisse-dépose dans la zone dédiée.
2. L'utilisateur sélectionne une signature au format `.png`.
3. Les paramètres permettent de régler la largeur de signature en millimètres, l'alignement (`droite` par défaut) et le nombre de lignes avant la signature (`2` par défaut).
4. Le navigateur lit chaque RTF localement, extrait une représentation textuelle imprimable avec les principaux paragraphes et retours, ajoute l'espacement demandé puis la signature à la fin du document.
5. Un PDF est généré pour chaque fichier avec le nom d'origine en remplaçant `.rtf` par `.pdf`.
6. Le bouton **Télécharger tous les PDF** crée en mémoire une archive `arretes_versement_signes_YYYY-MM-DD_HH-mm.zip` contenant uniquement les PDF générés avec succès.

### Formats acceptés

- Documents sources : fichiers RTF (`.rtf`).
- Signature : image PNG (`.png`).
- Sorties générées : PDF individuels et ZIP de regroupement, uniquement lors de l'utilisation dans le navigateur.

Aucun fichier RTF, PNG, PDF ou ZIP binaire de démonstration n'est versionné dans le dépôt.

### Traitement entièrement local

Tous les traitements sont réalisés exclusivement dans le navigateur de l'utilisateur : lecture des RTF, interprétation, ajout de la signature, génération PDF et création du ZIP. Le code de l'outil n'envoie pas les documents, la signature ou les PDF à un serveur, une API externe, un service de conversion, `localStorage`, IndexedDB ou des cookies. Les fichiers restent en mémoire pendant la session et disparaissent après réinitialisation, actualisation ou fermeture de la page.

Les bibliothèques peuvent être chargées depuis un CDN HTTPS, mais ce chargement ne transmet pas le contenu des documents au CDN.

### Bibliothèques JavaScript utilisées

- **jsPDF** (`https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js`) : génération des PDF directement dans le navigateur.
- **JSZip** (`https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js`) : création en mémoire de l'archive ZIP contenant les PDF générés.
- **Code applicatif local** (`signature-arretes/app.js`) : sélection des fichiers, contrôles de formats, glisser-déposer, extraction RTF simplifiée, ajout de la signature, suivi de progression et déclenchement des téléchargements.

Aucune API distante de conversion n'est appelée.

### Limites de fidélité RTF

La conversion est pensée pour reproduire le flux métier de signature et produire une sortie PDF exploitable côté navigateur. Elle ne garantit pas une fidélité parfaite avec Microsoft Word. Selon la complexité des fichiers RTF, certains éléments avancés peuvent être simplifiés : mise en page complexe, tableaux imbriqués, en-têtes et pieds de page avancés, pagination exacte, polices non disponibles ou règles RTF spécifiques. Lorsqu'un fichier est partiellement interprétable, l'outil essaie de continuer et signale un avertissement ou une erreur compréhensible sans bloquer les autres fichiers.

### Règles pour tester l'outil

- Ouvrir `index.html` et vérifier la carte **Signature des arrêtés de versement**.
- Ouvrir `signature-arretes/index.html` et vérifier le retour vers `../`.
- Tester la sélection simple et multiple de RTF, le glisser-déposer, le rejet d'un fichier non RTF et la suppression individuelle.
- Tester la sélection d'une signature PNG, l'aperçu, le remplacement, la suppression et le rejet d'un non-PNG.
- Vérifier les paramètres par défaut : largeur `45 mm`, alignement `droite`, `2` lignes avant la signature.
- Générer un PDF avec un RTF fictif textuel, puis plusieurs PDF, et contrôler la conservation des noms.
- Créer le ZIP via **Télécharger tous les PDF** et vérifier qu'il ne contient que les PDF réussis.
- Tester un RTF vide ou invalide et vérifier que les fichiers suivants continuent d'être traités.
- Tester **Réinitialiser** et vérifier que fichiers, signature, PDF, progression et messages sont vidés.
- Vérifier l'affichage desktop, tablette et mobile.
- Vérifier qu'aucune requête réseau ne transporte les documents ou la signature et qu'aucun stockage durable n'est utilisé.

## Ajouter un nouvel outil

1. Créez un dossier dédié à la racine du dépôt, par exemple `nouvel-outil/`.
2. Ajoutez l'application dans `nouvel-outil/index.html`.
3. Réutilisez les styles communs avec un lien relatif :
   ```html
   <link rel="stylesheet" href="../assets/css/style.css" />
   ```
4. Structurez l'interface avec les composants partagés (`btn`, `card`, `badge`).
5. Ajoutez une carte dans la grille de la page racine `index.html` avec un lien relatif vers `./nouvel-outil/`.
6. Si l'outil traite des fichiers sensibles, gardez les données exclusivement côté navigateur et en mémoire de session.
7. Si l'outil a besoin de styles supplémentaires, créez uniquement des classes réutilisables ou clairement préfixées par l'outil.
8. Vérifiez l'affichage desktop, tablette et mobile.

Consultez `AGENTS.md` avant toute évolution afin de préserver les conventions du portail et d'éviter les régressions sur la logique métier des outils existants.
