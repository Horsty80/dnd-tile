export type Tile = {
  id: string;
  x: number;      // position sur l'axe X
  width: number;  // largeur (en unités)
};

/**
 * Agrandit la tuile ciblée vers la droite et décale les tuiles suivantes.
 * @param entries Liste de tuiles
 * @param id L'identifiant de la tuile à agrandir
 * @param factor Nouvelle largeur (en unités) à appliquer (ex: 3)
 */
export function expandEntryToTheRight(entries: Tile[], id: string, factor: number): Tile[] {
  const arr = entries.map(e => ({ ...e }));
  const targetIndex = arr.findIndex(t => t.id === id);
  if (targetIndex === -1) return arr;

  // Ancien width (1, 2, etc... en "unités")
  const oldWidth = arr[targetIndex].width;
  const diff = factor - oldWidth;

  // Met à jour la tuile ciblée
  arr[targetIndex].width = factor;

  // Décale les tuiles suivantes
  for (let i = targetIndex + 1; i < arr.length; i++) {
    arr[i].x += diff;
  }

  return arr;
}

/**
 * Déplace la tuile oldId devant la tuile newId, puis recalcule
 * la position x de toutes les tuiles.
 */
export function updatePositionToTheRight(entries: Tile[], newId: string, oldId: string): Tile[] {
  const arr = entries.map(e => ({ ...e }));
  const oldIndex = arr.findIndex(e => e.id === oldId);
  if (oldIndex === -1) return arr;

  // Retire la tuile à déplacer
  const [oldTile] = arr.splice(oldIndex, 1);

  // Localise newId
  const newIndex = arr.findIndex(e => e.id === newId);
  const insertionIndex = (newIndex === -1) ? arr.length : newIndex;

  // Insère la tuile oldId avant newId
  arr.splice(insertionIndex, 0, oldTile);

  // Recalcule la position X des tuiles déplacées
  let currentX = 0;
  for (let i = 0; i < arr.length; i++) {
    arr[i].x = currentX;
    currentX += arr[i].width;
  }

  return arr;
}
