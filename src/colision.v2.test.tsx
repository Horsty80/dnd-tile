import { expect, test } from "vitest";

export type Tile = {
  id: string;
  x: number;      // position sur l'axe X
};

function moveCellToPosition(tiles: Tile[], id: string, x: number): Tile[] {
  return tiles.map(t => t.id === id ? { ...t, x } : t);
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
