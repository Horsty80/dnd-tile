import { useState } from "react";
import {
  DndContext,
  useDraggable,
  useSensor,
  useSensors,
  PointerSensor,
  DragMoveEvent,
  DragEndEvent,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";
import { snapCenterToCursor, restrictToParentElement } from "@dnd-kit/modifiers";

import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const TILE_SIZE = 305;
const GRID_SIZE = 5;
const TILE_MARGIN = 4;
const HEADER_SIZE = 40; // Taille des en-têtes

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

  const rowIndices = Array.from({ length: size.h }, (_, i) => position.y + i + 1).join(",");
  const colIndices = Array.from({ length: size.w }, (_, i) => position.x + i + 1).join(",");

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
      <div style={{ fontSize: "0.8rem" }}>
        Ligne(s): {rowIndices} / Colonne(s): {colIndices}
      </div>
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

  updated[idx] = { ...oldTile, size: newSize };
  const deltaW = newSize.w - oldTile.size.w;
  const deltaH = newSize.h - oldTile.size.h;

  // Si on rétrécit, on quitte
  if (deltaW <= 0 && deltaH <= 0) {
    return updated;
  }

  // Après avoir changé la taille, pour chaque cellule nouvellement acquise :
  for (let row = oldTile.position.y; row < oldTile.position.y + newSize.h; row++) {
    for (let col = oldTile.position.x; col < oldTile.position.x + newSize.w; col++) {
      // Ignore l’ancienne zone
      if (
        row < oldTile.position.y + oldTile.size.h &&
        col < oldTile.position.x + oldTile.size.w
      ) continue;

      // Cherche un occupant dans cette nouvelle cellule
      const occupant = updated.find((t) =>
        t.id !== tileId &&
        col >= t.position.x && col < t.position.x + t.size.w &&
        row >= t.position.y && row < t.position.y + t.size.h
      );
      if (occupant) {
        // Détermine la direction de poussée en fonction de la position initiale
        if (col >= oldTile.position.x + oldTile.size.w) {
          updated = pushTile(updated, occupant.id, 1, 0); // Pousse à droite
        } else if (row >= oldTile.position.y + oldTile.size.h) {
          updated = pushTile(updated, occupant.id, 0, 1); // Pousse en bas
        }
      }
    }
  }

  return updated;
}

type Skeleton = { position: { x: number; y: number }; size: { w: number; h: number } } | null;

export default function Board() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [skeleton, setSkeleton] = useState<Skeleton>(null);
  const [activeTile, setActiveTile] = useState<Tile | null>(null);

  // Redimensionnement
  const handleResize = (id: string) => {
    setTiles((prev) => resizeTileAndShift(prev, id));
  };

  // Suppression
  const handleDelete = (id: string) => {
    setTiles((prev) => prev.filter((tile) => tile.id !== id));
  };

  
  const handleDragStart = (event: any) => {
    const tile = tiles.find((t) => t.id === event.active.id);
    if (tile) setActiveTile(tile);
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
    <div style={{ position: "relative", paddingLeft: HEADER_SIZE, paddingTop: HEADER_SIZE }}>
      {/* En-têtes colonnes */}
      {Array.from({ length: GRID_SIZE }, (_, i) => (
        <div
          key={"col"+i}
          style={{
            position: "absolute",
            top: 0,
            left: i * (TILE_SIZE + TILE_MARGIN) + HEADER_SIZE,
            width: TILE_SIZE,
            textAlign: "center",
            fontWeight: "bold",
            backgroundColor: "#bbb",
          }}
        >
          {i + 1}
        </div>
      ))}

      {/* En-têtes lignes */}
      {Array.from({ length: GRID_SIZE }, (_, i) => (
        <div
          key={"row"+i}
          style={{
            position: "absolute",
            top: i * (TILE_SIZE + TILE_MARGIN) + HEADER_SIZE,
            left: 0,
            height: TILE_SIZE,
            display: "flex",
            alignItems: "center",
            fontWeight: "bold",
            backgroundColor: "#bbb",
            width: HEADER_SIZE,
          }}
        >
          {i + 1}
        </div>
      ))}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToParentElement]}
      >

      <SortableContext 
        items={tiles}
        strategy={verticalListSortingStrategy}
      >
        <div
          style={{
            position: "relative",
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

      </SortableContext>


      <DragOverlay>
        {activeTile && <Tile
              key={activeTile.id}
              id={activeTile.id}
              position={activeTile.position}
              size={activeTile.size}
              onResize={handleResize}
              onDelete={handleDelete}
            />}
      </DragOverlay>

      </DndContext>
    </div>
  );
}
