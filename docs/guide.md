# Guide de la grille et des méthodes
Ce guide décrit le fonctionnement de la grille et les principales fonctions.

## Fonctionnement de la grille

- Faites glisser une tuile pour la déplacer (la logique de collision s’occupe d’ajuster sa position).
- Cliquez pour insérer une nouvelle tuile.
- Survolez la grille pour afficher un indicateur de position libre.

## Exemple d’utilisation  

- **resolveCollisions** S'assure qu'aucune tuile ne se chevauche une fois les modifications terminées.
- **handleResetTileSize** Restaure la taille d’une tuile à `TILE_SIZE`.
- **handleEnlargeTile** Redimensionne une tuile en modifiant `w` et/ou `h`, puis décale les tuiles en collision.
- **handleDragStart / handleDragEnd / handleDragMove** Permettent de mettre à jour la position des tuiles pendant un glisser-déposer.

## Méthodes principales
- Les collisions sont gérées en vérifiant si une nouvelle tuile empiète sur une autre (via `isTilePositionOccupied`).
- Lorsque l’utilisateur clique, la position x,y est calculée pour savoir où placer la nouvelle tuile.
- Chaque tuile possède une position (x, y) en multiples de `TILE_SIZE`.