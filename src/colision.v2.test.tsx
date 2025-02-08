import { expect, test } from "vitest";

export type Tile = {
  id: string;
  x: number;      // position sur l'axe X
};

function moveCellToPosition(tiles: Tile[], id: string, x: number): Tile[] {
  const targetTile = tiles.find(t => t.id === id);
  if (!targetTile) return tiles;

  const updatedTiles = tiles.map(t => t.id === id ? { ...t, x } : t);
  const occupiedTile = updatedTiles.find(t => t.id !== id && t.x === x);

  if (occupiedTile) {
    return updatedTiles.map(t => {
      if (t.id !== id && t.x >= x) {
        return { ...t, x: t.x + 1 };
      }
      return t;
    });
  }

  return updatedTiles;
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
    { id: "a", x: 7 },
    { id: "b", x: 1 },
    { id: "c", x: 2 },
    { id: "d", x: 3 },
    { id: "e", x: 4 },
  ];

  const actual = moveCellToPosition(givenTiles, "a", 7);
  expect(actual).toEqual(expectedTiles);
})

test("Déplacement de tuile sur une cellule rempli, move 'a' to x:2", () => {
  const givenTiles = [
    { id: "a", x: 0 },
    { id: "b", x: 1 },
    { id: "c", x: 2 },
    { id: "d", x: 3 },
    { id: "e", x: 4 },
  ];

  const expectedTiles = [
    { id: "a", x: 2 },
    { id: "b", x: 1 },
    { id: "c", x: 3 },
    { id: "d", x: 4 },
    { id: "e", x: 5 },
  ];

  const actual = moveCellToPosition(givenTiles, "a", 2);
  expect(actual).toEqual(expectedTiles);
})