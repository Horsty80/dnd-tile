### Explication détaillée du fonctionnement de la gestion des tuiles, déplacements et collisions dans `App.tsx`

Le fichier `App.tsx` gère un système de tuiles déplaçables sur une grille à l'aide de la bibliothèque `dnd-kit`. Voici comment les différentes fonctionnalités sont mises en œuvre.

---

## **1. Représentation des tuiles**
Les tuiles sont stockées sous forme d'un tableau d'objets `Tile` dans un état React :
```tsx
type Tile = {
  id: string;
  x: number;
  y: number;
  h: number;
  w: number;
};
```
Chaque tuile possède :
- Un **id** unique
- Une position **x, y** dans la grille
- Une largeur (**w**) et une hauteur (**h**) en pixels

L'état React gérant ces tuiles est :
```tsx
const [items, setItems] = useState<Tile[]>([]);
```
---

## **2. Gestion des événements de glisser-déposer**
L'application utilise `dnd-kit` pour gérer le déplacement des tuiles.

### **Début du drag (`handleDragStart`)**
Lorsque l'utilisateur commence à déplacer une tuile :
```tsx
function handleDragStart({ active }: DragStartEvent) {
  setActiveId(active.id.toString());
}
```
- L'**id** de la tuile active est enregistré dans l'état `activeId`.

---

### **Déplacement en cours (`handleDragMove`)**
À chaque mouvement de la souris, la fonction `handleDragMove` est déclenchée :
```tsx
function handleDragMove(event: DragMoveEvent) {
  const { active, delta } = event;
  setItems((oldItems) => {
    const idx = oldItems.findIndex((tile) => tile.id === active.id);
    const tile = oldItems[idx];
    const newX = Math.round((tile.x * TILE_SIZE + delta.x) / TILE_SIZE);
    const newY = Math.round((tile.y * TILE_SIZE + delta.y) / TILE_SIZE);
```
**Ce qui se passe ici :**
1. On récupère la **tuile déplacée** via `active.id`
2. On calcule les **nouvelles coordonnées** `(newX, newY)` en fonction du déplacement de la souris
3. On **vérifie les collisions** et ajuste la position si nécessaire :
   ```tsx
   if (isTilePositionOccupied(newX, newY, oldItems, active.id.toString())) {
     let collisionX = newX;
     const collisionY = newY;
     while (isTilePositionOccupied(collisionX, collisionY, oldItems, active.id.toString())) {
       collisionX += 1;
     }
     setMoveOverlay({ x: collisionX, y: collisionY, w: tile.w, h: tile.h });
   } else {
     setMoveOverlay(null);
   }
   ```
   - Si la **nouvelle position est occupée**, on cherche un emplacement libre vers la droite.

---

### **Fin du drag (`handleDragEnd`)**
Quand l'utilisateur relâche la tuile :
```tsx
function handleDragEnd(event: DragEndEvent) {
  const { active, delta } = event;
  setItems((oldItems) => {
    const newTiles = [...oldItems];
    const idx = newTiles.findIndex((tile) => tile.id === active.id);
    const tile = newTiles[idx];
    const newX = Math.round((tile.x * TILE_SIZE + delta.x) / TILE_SIZE);
    const newY = Math.round((tile.y * TILE_SIZE + delta.y) / TILE_SIZE);
```
1. **On met à jour la position** `(newX, newY)` de la tuile déplacée.
2. **On détecte les collisions** et **on repousse** les tuiles affectées vers la droite :
   ```tsx
   if (isTilePositionOccupied(newX, newY, newTiles, active.id.toString())) {
     let collisionX = newX;
     const collisionY = newY;
     while (isTilePositionOccupied(collisionX, collisionY, newTiles, active.id.toString())) {
       collisionX += 1;
     }
   ```
3. **On ajuste la position des autres tuiles** si elles se chevauchent :
   ```tsx
   newTiles.forEach((otherTile, otherIdx) => {
     if (otherIdx !== idx && isTilePositionOccupied(otherTile.x, otherTile.y, newTiles, otherTile.id)) {
       let newOtherX = otherTile.x;
       while (isTilePositionOccupied(newOtherX, otherTile.y, newTiles, otherTile.id)) {
         newOtherX += 1;
       }
       newTiles[otherIdx] = { ...otherTile, x: newOtherX };
     }
   });
   ```
4. **On supprime les informations temporaires de drag** :
   ```tsx
   setActiveId(null);
   setSkeleton(null);
   setMoveOverlay(null);
   ```
---

## **3. Vérification des collisions**
La fonction clé `isTilePositionOccupied` détecte si une tuile occupe une position donnée :
```tsx
function isTilePositionOccupied(x: number, y: number, items: Tile[], ignoreTileId?: string): boolean {
  return items.some((item) => {
    const rect1 = { x, y, w: TILE_SIZE, h: TILE_SIZE };
    const rect2 = { x: item.x, y: item.y, w: item.w, h: item.h };
    const isColliding =
      rect1.x < rect2.x + rect2.w / TILE_SIZE &&
      rect1.x + rect1.w / TILE_SIZE > rect2.x &&
      rect1.y < rect2.y + rect2.h / TILE_SIZE &&
      rect1.y + rect1.h / TILE_SIZE > rect2.y;
    return isColliding && item.id !== ignoreTileId;
  });
}
```
**Ce qui est fait ici :**
- On compare **les coordonnées de la nouvelle position** avec celles des autres tuiles.
- Si la tuile est déjà occupée, on retourne `true`, sinon `false`.

---

## **4. Agrandissement des tuiles**
Une tuile peut être agrandie horizontalement, verticalement ou dans les deux directions :
```tsx
function handleEnlargeTile(id: string, direction: "horizontal" | "vertical" | "both") {
  setItems((oldItems) => {
    return oldItems.map((tile) => {
      if (tile.id === id) {
        const newTile = { ...tile };
        if (direction === "horizontal") newTile.w += 3 * TILE_SIZE;
        if (direction === "vertical") newTile.h += 2 * TILE_SIZE;
        return newTile;
      }
      return tile;
    });
  });
}
```
- Cette fonction **augmente la largeur et/ou la hauteur** de la tuile sélectionnée.
- **Elle ajuste aussi les tuiles en conflit** en les poussant vers la droite ou vers le bas.

---

## **5. Ajout de nouvelles tuiles**
Quand l'utilisateur clique sur une case vide :
```tsx
const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
  const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
  const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

  if (!isTilePositionOccupied(x, y, items)) {
    setItems([...items, { id: generateRandomColorHex(), x, y, h: TILE_SIZE, w: TILE_SIZE }]);
  }
};
```
1. On calcule la **position de la souris** en coordonnées de grille.
2. Si l'emplacement est libre, on **ajoute une nouvelle tuile**.

---

## **Conclusion**
### **Fonctionnalités mises en place :**
✔ **Déplacement des tuiles** via `dnd-kit`  
✔ **Détection des collisions** pour éviter le chevauchement  
✔ **Réorganisation automatique** en cas de conflit  
✔ **Agrandissement dynamique** des tuiles  
✔ **Ajout de nouvelles tuiles en cliquant sur une case vide**  

C'est un système **fluide et intelligent**, gérant les collisions en temps réel et permettant aux tuiles de s'agrandir et de se réorganiser dynamiquement. 🚀