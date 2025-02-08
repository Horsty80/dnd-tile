import { expect, test } from "vitest";

export type Tile = {
  id: string;
  x: number;      // position sur l'axe X
};

export function moveCellToPosition(
  tiles: Tile[],
  tileId: string,
  targetX: number
): Tile[] {
  const tile = tiles.find((t) => t.id === tileId);
  if (!tile) return tiles;

  // Retire la tuile à déplacer
  let newTiles = tiles.filter((t) => t.id !== tileId);

  // Gestion de la collision si la cible est occupée
  const occupant = newTiles.find((t) => t.x === targetX);
  if (occupant) {
    newTiles = shiftTiles(newTiles, occupant.x);
  }

  // Place la tuile à sa nouvelle destination
  tile.x = targetX;
  newTiles.push(tile);

  return newTiles;
}

// Simplify shiftTiles to always shift occupant one step to the right
function shiftTiles(tiles: Tile[], startX: number): Tile[] {
  const occupant = tiles.find((t) => t.x === startX);
  if (!occupant) return tiles;
  const newPos = occupant.x + 1;
  const newTiles = shiftTiles(tiles, newPos);

  // Met à jour la position de la tuile
  return newTiles.map((t) =>
    t.id === occupant.id ? { ...t, x: newPos } : t
  );
}

test("Déplacement de tuile sur une cellule vide, move 'a' to x:7", () => {
  const givenTiles = [
    { id: "a", x: 0 },
    { id: "b", x: 1 },
    { id: "c", x: 2 },
    { id: "d", x: 3 },
    { id: "e", x: 4 },
  ];

  const expectedTiles = [
    { id: "b", x: 1 },
    { id: "c", x: 2 },
    { id: "d", x: 3 },
    { id: "e", x: 4 },
    { id: "a", x: 7 },
  ];

  const actual = moveCellToPosition(givenTiles, "a", 7);
  expect(actual).toEqual(expectedTiles);
})

// On déplace à droite la tuile qui est sur la cellule cible et toutes les tuiles adjacente à droite
test("Déplacement de tuile sur une cellule rempli, move 'a' to x:2", () => {
  const givenTiles = [
    { id: "a", x: 0 },
    { id: "b", x: 1 },
    { id: "c", x: 2 },
    { id: "d", x: 3 },
    { id: "e", x: 4 },
  ];

  const expectedTiles = [
    { id: "b", x: 1 },
    { id: "c", x: 3 },
    { id: "d", x: 4 },
    { id: "e", x: 5 },
    { id: "a", x: 2 },
  ];

  const actual = moveCellToPosition(givenTiles, "a", 2);
  expect(actual).toEqual(expectedTiles);
});

test("Déplacement de tuile vers la gauche sur une cellule vide, move 'e' to x:3", ()=> {
  const givenTiles = [
    { id: "a", x: 0 },
    { id: "b", x: 1 },
    { id: "c", x: 2 },
    { id: "d", x: 4 },
    { id: "e", x: 5 },
  ];

  const expectedTiles = [
    { id: "a", x: 0 },
    { id: "b", x: 1 },
    { id: "c", x: 2 },
    { id: "d", x: 4 },
    { id: "e", x: 3 },
  ];

  const actual = moveCellToPosition(givenTiles, "e", 3);
  expect(actual).toEqual(expectedTiles);
})

test("Déplacement de tuile vers la gauche sur une cellule rempli, move 'e' to x:2", ()=> {
  const givenTiles = [
    { id: "a", x: 0 },
    { id: "b", x: 1 },
    { id: "c", x: 2 },
    { id: "d", x: 4 },
    { id: "e", x: 5 },
  ];

  const expectedTiles = [
    { id: "a", x: 0 },
    { id: "b", x: 1 },
    { id: "c", x: 3 },
    { id: "d", x: 4 },
    { id: "e", x: 2 },
  ];

  const actual = moveCellToPosition(givenTiles, "e", 2);
  expect(actual).toEqual(expectedTiles);
})

test("Déplcement de tuile vers la gauche sur une cellule rempli, et déplacement de plusieurs tuiles vers la droite qui sont adjacente, 'f' to x:2", () => {
  const givenTiles = [
    { id: "a", x: 0 },
    { id: "b", x: 1 },
    { id: "c", x: 2 },
    { id: "d", x: 3 },
    { id: "e", x: 4 },
    { id: "f", x: 5 },
  ];

  const expectedTiles = [
    { id: "a", x: 0 },
    { id: "b", x: 1 },
    { id: "c", x: 3 },
    { id: "d", x: 4 },
    { id: "e", x: 5 },
    { id: "f", x: 2 },
  ];

  const actual = moveCellToPosition(givenTiles, "f", 2);
  expect(actual).toEqual(expectedTiles);
})