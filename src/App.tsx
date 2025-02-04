import { useState } from "react";
import {
  DndContext,
  useDraggable,
  useSensor,
  useSensors,
  PointerSensor,
  DragMoveEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { snapCenterToCursor, restrictToParentElement } from "@dnd-kit/modifiers";

const TILE_SIZE = 305;
const GRID_SIZE = 5;
const TILE_MARGIN = 4;

type Tile = {
  id: string;
  position: { x: number; y: number };
  size: { w: number; h: number };
};

/** Composant d'une tuile individuelle. */
function Tile({
  id,
  position,
  size,
  onResize,
  onDelete,
}: Tile & { onResize: (id: string) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        position: "absolute",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "1px solid #000",
        borderRadius: "8px",
        width: size.w * (TILE_SIZE + TILE_MARGIN) - TILE_MARGIN,
        height: size.h * (TILE_SIZE + TILE_MARGIN) - TILE_MARGIN,
        left: position.x * (TILE_SIZE + TILE_MARGIN),
        top: position.y * (TILE_SIZE + TILE_MARGIN),
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : "",
      }}
    >
      Tuile {id}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Empêche la propagation de l'événement de clic
          onResize(id);
        }}
        style={{
          position: "absolute",
          top: "4px",
          right: "4px",
          backgroundColor: "#1f2937",
          color: "white",
          padding: "4px",
          borderRadius: "4px",
        }}
      >
        ↔↕
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation(); // Empêche la propagation de l'événement de clic
          onDelete(id);
        }}
        style={{
          position: "absolute",
          top: "4px",
          right: "40px",
          backgroundColor: "#dc2626",
          color: "white",
          padding: "4px",
          borderRadius: "4px",
        }}
      >
        ✖
      </button>
    </div>
  );
}

/** Tuile squelette pour le hover ou le drag */
function SkeletonTile({
  position,
  size,
}: {
  position: { x: number; y: number };
  size: { w: number; h: number };
}) {
  return (
    <div
      style={{
        position: "absolute",
        backgroundColor: "rgba(0,0,0,0.2)",
        width: size.w * (TILE_SIZE + TILE_MARGIN) - TILE_MARGIN,
        height: size.h * (TILE_SIZE + TILE_MARGIN) - TILE_MARGIN,
        left: position.x * (TILE_SIZE + TILE_MARGIN),
        top: position.y * (TILE_SIZE + TILE_MARGIN),
        border: "1px dashed #000",
        borderRadius: "8px",
      }}
    />
  );
}

/** Indique si (x,y) est occupé par une tuile (sauf ignoreId) */
function isOccupied(x: number, y: number, tiles: Tile[], ignoreId: string | null = null) {
  return tiles.some((t) => {
    if (ignoreId && t.id === ignoreId) return false;
    return (
      x >= t.position.x &&
      x < t.position.x + t.size.w &&
      y >= t.position.y &&
      y < t.position.y + t.size.h
    );
  });
}

/** Pousse la tuile occupant occupantId d'une case (dx,dy), en cascade tant que collision */
function pushTile(tiles: Tile[], occupantId: string, dx: number, dy: number) {
  let updated = [...tiles];
  const idx = updated.findIndex((t) => t.id === occupantId);
  if (idx === -1) return updated;

  let occupant = updated[idx];
  let { x, y } = occupant.position;

  // On avance occupant tant que la case suivante est occupée
  while (true) {
    const nextX = x + dx;
    const nextY = y + dy;
    if (isOccupied(nextX, nextY, updated, occupantId)) {
      x += dx;
      y += dy;
    } else {
      x = nextX;
      y = nextY;
      break;
    }
  }

  updated[idx] = {
    ...occupant,
    position: { x, y },
  };

  return updated;
}

/** Collision quand on drop une tuile sur une case occupée */
function handleCollision(tiles: Tile[], movTile: Tile, newX: number, newY: number) {
  let updated = [...tiles];
  // Trouve occupant de (newX, newY)
  const occupant = updated.find(
    (t) =>
      t.id !== movTile.id &&
      newX >= t.position.x &&
      newX < t.position.x + t.size.w &&
      newY >= t.position.y &&
      newY < t.position.y + t.size.h
  );

  if (!occupant) {
    // pas d'occupant
    return updated.map((t) =>
      t.id === movTile.id ? { ...movTile, position: { x: newX, y: newY } } : t
    );
  }

  // pousse occupant vers la droite
  updated = pushTile(updated, occupant.id, 1, 0);

  // occupant est déplacé, on place movTile
  return updated.map((t) =>
    t.id === movTile.id ? { ...movTile, position: { x: newX, y: newY } } : t
  );
}

/** Agrandit ou réduit la tuile. Parcourt chaque cellule nouvellement gagnée de gauche à droite (puis haut en bas). */
function resizeTileAndShift(tiles: Tile[], tileId: string) {
  let updated = [...tiles];
  const idx = updated.findIndex((t) => t.id === tileId);
  if (idx === -1) return tiles;

  const oldTile = updated[idx];
  // 1×1 <-> 3×2 (exemple)
  const isSmall = oldTile.size.w === 1 && oldTile.size.h === 1;
  const newSize = isSmall ? { w: 3, h: 2 } : { w: 1, h: 1 };

  // Met à jour la tuile
  updated[idx] = { ...oldTile, size: newSize };

  // Si on rétrécit, pas besoin de pousser
  const deltaW = newSize.w - oldTile.size.w;
  const deltaH = newSize.h - oldTile.size.h;
  if (deltaW <= 0 && deltaH <= 0) {
    return updated;
  }

  // Zone ancienne
  const oldMinX = oldTile.position.x;
  const oldMaxX = oldMinX + oldTile.size.w - 1;
  const oldMinY = oldTile.position.y;
  const oldMaxY = oldMinY + oldTile.size.h - 1;

  // Zone nouvelle
  const newMaxX = oldMinX + newSize.w - 1;
  const newMaxY = oldMinY + newSize.h - 1;

  // On dresse la liste des cellules nouvellement gagnées dans l'ordre (left->right, top->bottom).
  const gainedCells = [];
  // Horizontal ?
  if (deltaW > 0) {
    for (let x = oldMaxX + 1; x <= newMaxX; x++) {
      for (let y = oldMinY; y <= oldMaxY && y <= newMaxY; y++) {
        gainedCells.push({ x, y });
      }
    }
  }
  // Vertical ?
  if (deltaH > 0) {
    for (let y = oldMaxY + 1; y <= newMaxY; y++) {
      for (let x = oldMinX; x <= newMaxX; x++) {
        // Évite de redondance avec la partie horizontale
        if (x >= oldMinX && x <= oldMaxX + deltaW) {
          gainedCells.push({ x, y });
        }
      }
    }
  }

  // On trie gainedCells par x croissant, puis y croissant
  // => pour garantir un ordre left->right, top->bottom
  gainedCells.sort((a, b) => {
    if (a.x === b.x) return a.y - b.y;
    return a.x - b.x;
  });

  // Pour chaque cellule, si occupant => on le pousse
  // Si la tuile s'étend en largeur, on pousse occupant vers la droite
  // Si la tuile s'étend en hauteur, on pousse occupant vers le bas
  for (const cell of gainedCells) {
    // Cherche occupant
    const occupant = updated.find(
      (t) =>
        t.id !== tileId &&
        cell.x >= t.position.x &&
        cell.x < t.position.x + t.size.w &&
        cell.y >= t.position.y &&
        cell.y < t.position.y + t.size.h
    );
    if (occupant) {
      // On détermine la direction : on regarde si x>oldMaxX => push droite, sinon push bas
      let dx = 0;
      let dy = 0;
      if (cell.x > oldMaxX) {
        dx = 1; // on pousse vers la droite
      } else {
        dy = 1; // on pousse vers le bas
      }
      updated = pushTile(updated, occupant.id, dx, dy);
    }
  }

  return updated;
}

type Skeleton = { position: { x: number; y: number }; size: { w: number; h: number } } | null;

export default function Board() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [skeleton, setSkeleton] = useState<Skeleton>(null);

  // Redimensionnement
  const handleResize = (id: string) => {
    setTiles((prev) => resizeTileAndShift(prev, id));
  };

  // Suppression
  const handleDelete = (id: string) => {
    setTiles((prev) => prev.filter((tile) => tile.id !== id));
  };

  // Drag Move => skeleton
  const handleDragMove = (event: DragMoveEvent) => {
    const { active, delta } = event;
    setTiles((oldTiles) => {
      const tile = oldTiles.find((t) => t.id === active.id);
      if (!tile) return oldTiles;

      const newX = Math.round(
        (tile.position.x * (TILE_SIZE + TILE_MARGIN) + delta.x) / (TILE_SIZE + TILE_MARGIN)
      );
      const newY = Math.round(
        (tile.position.y * (TILE_SIZE + TILE_MARGIN) + delta.y) / (TILE_SIZE + TILE_MARGIN)
      );

      setSkeleton({ position: { x: newX, y: newY }, size: tile.size });
      return oldTiles;
    });
  };

  // Drag End => applique collision
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    setTiles((prevTiles) => {
      const newTiles = [...prevTiles];
      const idx = newTiles.findIndex((t) => t.id === active.id);
      if (idx === -1) {
        return prevTiles;
      }
      const tile = newTiles[idx];
      const newX = Math.round(
        (tile.position.x * (TILE_SIZE + TILE_MARGIN) + delta.x) / (TILE_SIZE + TILE_MARGIN)
      );
      const newY = Math.round(
        (tile.position.y * (TILE_SIZE + TILE_MARGIN) + delta.y) / (TILE_SIZE + TILE_MARGIN)
      );

      return handleCollision(newTiles, tile, newX, newY);
    });
    setSkeleton(null);
  };

  // Ajouter une tuile si libre
  const handleAddTile = (x: number, y: number) => {
    setTiles((prev) => {
      const occupant = prev.find(
        (t) =>
          x >= t.position.x &&
          x < t.position.x + t.size.w &&
          y >= t.position.y &&
          y < t.position.y + t.size.h
      );
      if (!occupant) {
        return [
          ...prev,
          {
            id: String(prev.length + 1),
            position: { x, y },
            size: { w: 1, h: 1 },
          },
        ];
      }
      return prev;
    });
  };

  // Hover => skeleton 1×1
  const handleHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (TILE_SIZE + TILE_MARGIN));
    const y = Math.floor((e.clientY - rect.top) / (TILE_SIZE + TILE_MARGIN));

    setTiles((oldTiles) => {
      if (!isOccupied(x, y, oldTiles)) {
        setSkeleton({ position: { x, y }, size: { w: 1, h: 1 } });
      } else {
        setSkeleton(null);
      }
      return oldTiles;
    });
  };

  // Sensors (pointer) pour un drag plus naturel
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  return (
    <DndContext
      sensors={sensors}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      modifiers={[snapCenterToCursor, restrictToParentElement]} // Add restrictToParentElement modifier
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "calc(100vh - 50px)",
          backgroundColor: "#e5e7eb",
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE + TILE_MARGIN}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${TILE_SIZE + TILE_MARGIN}px)`,
        }}
        onMouseMove={handleHover}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = Math.floor((e.clientX - rect.left) / (TILE_SIZE + TILE_MARGIN));
          const y = Math.floor((e.clientY - rect.top) / (TILE_SIZE + TILE_MARGIN));
          handleAddTile(x, y);
        }}
      >
        {tiles.map((tile) => (
          <Tile
            key={tile.id}
            id={tile.id}
            position={tile.position}
            size={tile.size}
            onResize={handleResize}
            onDelete={handleDelete}
          />
        ))}
        {skeleton && <SkeletonTile position={skeleton.position} size={skeleton.size} />}
      </div>
    </DndContext>
  );
}
