import { expect, test } from "vitest";

export type Tile = {
  id: string;
  x: number; // position sur l'axe X
  width: number; // new property
};

export function moveCellToPosition(tiles: Tile[], tileId: string, targetX: number): Tile[] {
  const tile = tiles.find((t) => t.id === tileId);
  if (!tile) return tiles;

  // Retire la tuile à déplacer
  let newTiles = tiles.filter((t) => t.id !== tileId);

  // Gestion de la collision si la cible est occupée
  const occupant = newTiles.find((t) => isColliding(t, tile, targetX));
  if (occupant) {
    newTiles = shiftTiles(newTiles, occupant.x, tile.width);
  }

  // Place la tuile à sa nouvelle destination
  tile.x = targetX;
  newTiles.push(tile);

  return newTiles;
}

// Check if two tiles overlap using width
function isColliding(occupant: Tile, moving: Tile, targetX: number): boolean {
  const occupantStart = occupant.x;
  const occupantEnd = occupant.x + occupant.width - 1;
  const movingStart = targetX;
  const movingEnd = targetX + moving.width - 1;
  return movingEnd >= occupantStart && movingStart <= occupantEnd;
}

// Shift occupant(s) by the width of the moving tile
function shiftTiles(tiles: Tile[], startX: number, shiftAmt: number): Tile[] {
  const occupant = tiles.find((t) => t.x === startX);
  if (!occupant) return tiles;
  const newPos = occupant.x + shiftAmt;
  const newTiles = shiftTiles(tiles, newPos, shiftAmt);
  return newTiles.map((t) => (t.id === occupant.id ? { ...t, x: newPos } : t));
}

// Example of tile resizing
export function resizeTile(tiles: Tile[], tileId: string, newWidth: number): Tile[] {
  const tile = tiles.find((t) => t.id === tileId);
  if (!tile) return tiles;

  // Met à jour la tuile
  const resizedTile = { ...tile, width: newWidth };
  let updatedTiles = tiles.map((t) => (t.id === tileId ? resizedTile : t));

  // Détermine les cellules occupées par la tuile redimensionnée
  const occupiedCells = new Set<number>();
  for (let i = resizedTile.x; i < resizedTile.x + newWidth; i++) {
    occupiedCells.add(i);
  }

  // Décale les tuiles qui se superposent
  updatedTiles.forEach((t) => {
    if (t.id !== tileId) {
      let newX = t.x;
      while (occupiedCells.has(newX)) {
        newX++;
      }
      if (newX !== t.x) {
        t.x = newX;
        for (let i = newX; i < newX + t.width; i++) {
          occupiedCells.add(i);
        }
      }
    }
  });

  return updatedTiles;
}

// Décale récursivement toute tuile qui se trouve dans la zone occupée par 'source'
function shiftOverlappingTiles(tiles: Tile[], source: Tile): Tile[] {
  const sourceEnd = source.x + source.width - 1;
  let occupant = tiles.find((t) => t.id !== source.id && t.x >= source.x && t.x <= sourceEnd);
  if (!occupant) return tiles;

  let newTiles = [...tiles];
  while (occupant) {
    const shiftedX = sourceEnd + 1;
    newTiles = newTiles.map((t) => (t.id === occupant?.id ? { ...t, x: shiftedX } : t));
    occupant = newTiles.find((t) => t.id !== source.id && t.x >= source.x && t.x <= sourceEnd);
  }
  return newTiles;
}

test("Déplacement de tuile sur une cellule vide, move 'a' to x:7", () => {
  const givenTiles = [
    { id: "a", x: 0, width: 1 },
    { id: "b", x: 1, width: 1 },
    { id: "c", x: 2, width: 1 },
    { id: "d", x: 3, width: 1 },
    { id: "e", x: 4, width: 1 },
  ];

  const expectedTiles = [
    { id: "b", x: 1, width: 1 },
    { id: "c", x: 2, width: 1 },
    { id: "d", x: 3, width: 1 },
    { id: "e", x: 4, width: 1 },
    { id: "a", x: 7, width: 1 },
  ];

  const actual = moveCellToPosition(givenTiles, "a", 7);
  expect(actual).toEqual(expectedTiles);
});

// On déplace à droite la tuile qui est sur la cellule cible et toutes les tuiles adjacente à droite
test("Déplacement de tuile sur une cellule rempli, move 'a' to x:2", () => {
  const givenTiles = [
    { id: "a", x: 0, width: 1 },
    { id: "b", x: 1, width: 1 },
    { id: "c", x: 2, width: 1 },
    { id: "d", x: 3, width: 1 },
    { id: "e", x: 4, width: 1 },
  ];

  const expectedTiles = [
    { id: "b", x: 1, width: 1 },
    { id: "c", x: 3, width: 1 },
    { id: "d", x: 4, width: 1 },
    { id: "e", x: 5, width: 1 },
    { id: "a", x: 2, width: 1 },
  ];

  const actual = moveCellToPosition(givenTiles, "a", 2);
  expect(actual).toEqual(expectedTiles);
});

test("Déplacement de tuile vers la gauche sur une cellule vide, move 'e' to x:3", () => {
  const givenTiles = [
    { id: "a", x: 0, width: 1 },
    { id: "b", x: 1, width: 1 },
    { id: "c", x: 2, width: 1 },
    { id: "d", x: 4, width: 1 },
    { id: "e", x: 5, width: 1 },
  ];

  const expectedTiles = [
    { id: "a", x: 0, width: 1 },
    { id: "b", x: 1, width: 1 },
    { id: "c", x: 2, width: 1 },
    { id: "d", x: 4, width: 1 },
    { id: "e", x: 3, width: 1 },
  ];

  const actual = moveCellToPosition(givenTiles, "e", 3);
  expect(actual).toEqual(expectedTiles);
});

test("Déplacement de tuile vers la gauche sur une cellule rempli, move 'e' to x:2", () => {
  const givenTiles = [
    { id: "a", x: 0, width: 1 },
    { id: "b", x: 1, width: 1 },
    { id: "c", x: 2, width: 1 },
    { id: "d", x: 4, width: 1 },
    { id: "e", x: 5, width: 1 },
  ];

  const expectedTiles = [
    { id: "a", x: 0, width: 1 },
    { id: "b", x: 1, width: 1 },
    { id: "c", x: 3, width: 1 },
    { id: "d", x: 4, width: 1 },
    { id: "e", x: 2, width: 1 },
  ];

  const actual = moveCellToPosition(givenTiles, "e", 2);
  expect(actual).toEqual(expectedTiles);
});

test("Déplcement de tuile vers la gauche sur une cellule rempli, et déplacement de plusieurs tuiles vers la droite qui sont adjacente, 'f' to x:2", () => {
  const givenTiles = [
    { id: "a", x: 0, width: 1 },
    { id: "b", x: 1, width: 1 },
    { id: "c", x: 2, width: 1 },
    { id: "d", x: 3, width: 1 },
    { id: "e", x: 4, width: 1 },
    { id: "f", x: 5, width: 1 },
  ];

  const expectedTiles = [
    { id: "a", x: 0, width: 1 },
    { id: "b", x: 1, width: 1 },
    { id: "c", x: 3, width: 1 },
    { id: "d", x: 4, width: 1 },
    { id: "e", x: 5, width: 1 },
    { id: "f", x: 2, width: 1 },
  ];

  const actual = moveCellToPosition(givenTiles, "f", 2);
  expect(actual).toEqual(expectedTiles);
});

test("Aggrandissement d'une tuile, vérifie que ça décale les autres", () => {
  const givenTiles = [
    { id: "a", x: 0, width: 1 },
    { id: "b", x: 1, width: 1 },
    { id: "c", x: 2, width: 1 },
    { id: "e", x: 3, width: 1 },
    { id: "d", x: 6, width: 1 },
  ];
  const expectedTiles = [
    { id: "a", x: 0, width: 2 }, // a takes 2 units on x axis 0 and 1
    // 'b' pushed to x:2
    { id: "b", x: 2, width: 1 }, // b is pushed to x axis 2
    // 'c' pushed to x:3
    { id: "c", x: 3, width: 1 }, // c is pushed to x axis 3
    // 'e' pushed to x:4
    { id: "e", x: 4, width: 1 }, // e is pushed to x axis 4
    { id: "d", x: 6, width: 1 }, // d is not in the collision path and remains at x axis 6
  ];
  // Resize 'a' to width:2 and check collision
  const resized = resizeTile(givenTiles, "a", 2);
  // Collision logic could be inserted here if needed
  // ...existing code...
  expect(resized).toEqual(expectedTiles);
});

test("Avec plus de tuile et aggrandissement plus grand, Aggrandissement d'une tuile, vérifie que ça décale les autres", () => {
  const givenTiles = [
    { id: "a", x: 0, width: 1 },
    { id: "b", x: 1, width: 1 },
    { id: "c", x: 2, width: 1 },
    { id: "d", x: 3, width: 1 },
    { id: "e", x: 4, width: 1 },
    { id: "f", x: 5, width: 1 },
    { id: "g", x: 6, width: 1 },
  ];
  const expectedTiles = [
    { id: "a", x: 0, width: 3 }, // a takes 2 units on x axis 0 and 1
    // 'b' pushed to x:2
    { id: "b", x: 3, width: 1 }, // b is pushed to x axis 2
    // 'c' pushed to x:3
    { id: "c", x: 4, width: 1 }, // c is pushed to x axis 3
    // 'e' pushed to x:4
    { id: "d", x: 5, width: 1 }, // e is pushed to x axis 4
    { id: "e", x: 6, width: 1 }, // d is not in the collision path and remains at x axis 6
    { id: "f", x: 7, width: 1 }, // f is not in the collision path and remains at x axis 7
    { id: "g", x: 8, width: 1 }, // g is not in the collision path and remains at x axis 8
  ];
  // Resize 'a' to width:2 and check collision
  const resized = resizeTile(givenTiles, "a", 3);
  // Collision logic could be inserted here if needed
  // ...existing code...
  expect(resized).toEqual(expectedTiles);
});
