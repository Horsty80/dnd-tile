export const TILE_SIZE = 10;

export type Tile = {
    id: string;
    x: number; // représente sa position sur l'axe X
    width: number; // la taille possible de la tuile, c'est un nombre entier * TILE_SIZE
}

export function expandEntryToTheRight(entries: Tile[], id: string, factor: number): Tile[] {
  return entries.map(entry =>
    entry.id === id
      ? { ...entry, width: entry.width * factor }
      : entry
  );
}

export function updatePositionToTheRight(entries: Tile[], newId: string, oldId: string): Tile[] {
  const arr = [...entries];
  const oldIndex = arr.findIndex(e => e.id === oldId);
  if (oldIndex === -1) return arr;

  // Retirer l'ancienne tuile
  const [oldTile] = arr.splice(oldIndex, 1);

  // Insérer la tuile devant newId
  const newIndex = arr.findIndex(e => e.id === newId);
  if (newIndex !== -1) {
    arr.splice(newIndex + 1, 0, oldTile);
  } else {
    arr.push(oldTile);
  }

  // Calcul du décalage (on suppose qu'avant agrandissement, la tuile faisait TILE_SIZE)
  const shiftCount = (oldTile.width - TILE_SIZE) / TILE_SIZE + 1;
  const finalArr = arr.map((tile, i, all) => {
    if (i > all.findIndex(t => t.id === oldId)) {
      // Décale la tuile vers la droite
      return { ...tile, x: tile.x + shiftCount };
    }
    return tile;
  });

  return finalArr;
}