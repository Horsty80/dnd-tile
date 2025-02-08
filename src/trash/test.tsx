import React, { useState } from "react";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Tile = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const INITIAL_GRID_SIZE = 5; // Taille de base

const getNextSize = (tile: Tile): { width: number; height: number } => {
  return tile.width === 1 ? { width: 3, height: 2 } : { width: 1, height: 1 };
};

const Grid: React.FC = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [gridWidth, setGridWidth] = useState(INITIAL_GRID_SIZE);
  const [gridHeight, setGridHeight] = useState(INITIAL_GRID_SIZE);
  const [activeTile, setActiveTile] = useState<Tile | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  }));

  const addTile = (x: number, y: number) => {
    if (!tiles.some((tile) => tile.x === x && tile.y === y)) {
      setTiles([...tiles, { id: crypto.randomUUID(), x, y, width: 1, height: 1 }]);
    }
  };

  const removeTile = (id: string) => {
    setTiles(tiles.filter((tile) => tile.id !== id));
  };

  const resizeTile = (id: string) => {
    setTiles((prevTiles) => {
      return prevTiles.map((tile) => {
        if (tile.id === id) {
          const newSize = getNextSize(tile);
          let newWidth = Math.max(tile.x + newSize.width, gridWidth);
          let newHeight = Math.max(tile.y + newSize.height, gridHeight);

          // Met à jour la grille si nécessaire
          setGridWidth(newWidth);
          setGridHeight(newHeight);

          return { ...tile, ...newSize };
        }
        return tile;
      });
    });
  };

  const handleDragStart = (event: any) => {
    const tile = tiles.find((t) => t.id === event.active.id);
    if (tile) setActiveTile(tile);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const draggedTile = tiles.find((tile) => tile.id === active.id);
    const targetTile = tiles.find((tile) => tile.id === over.id);

    if (draggedTile && targetTile) {
      setTiles((prevTiles) => {
        const newTiles = prevTiles.map((tile) =>
          tile.id === draggedTile.id ? { ...tile, x: targetTile.x, y: targetTile.y } : tile
        );
        return arrayMove(newTiles, prevTiles.indexOf(draggedTile), prevTiles.indexOf(targetTile));
      });
    }
    setActiveTile(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tiles.map((tile) => tile.id)}>
        <div
          className="grid-container"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridWidth}, 80px)`,
            gridTemplateRows: `repeat(${gridHeight}, 80px)`,
            gap: "5px",
            overflow: "auto",
            border: "2px solid black",
            width: "600px",
            height: "600px",
          }}
        >
          {Array.from({ length: gridWidth * gridHeight }).map((_, index) => {
            const x = index % gridWidth;
            const y = Math.floor(index / gridWidth);
            const tile = tiles.find((tile) => tile.x === x && tile.y === y);

            return (
              <div
                key={index}
                className="grid-cell"
                style={{
                  width: "80px",
                  height: "80px",
                  border: "1px solid gray",
                  position: "relative",
                  background: tile ? "lightblue" : "white",
                }}
                onClick={() => !tile && addTile(x, y)}
              >
                {tile && <TileComponent tile={tile} onRemove={removeTile} onResize={resizeTile} />}
              </div>
            );
          })}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeTile && <TileComponent tile={activeTile} onRemove={() => {}} onResize={() => {}} />}
      </DragOverlay>
    </DndContext>
  );
};

type TileProps = {
  tile: Tile;
  onRemove: (id: string) => void;
  onResize: (id: string) => void;
};

const TileComponent: React.FC<TileProps> = ({ tile, onRemove, onResize }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tile.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        width: `${tile.width * 80}px`,
        height: `${tile.height * 80}px`,
        position: "absolute",
        top: 0,
        left: 0,
        background: "blue",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        cursor: "grab",
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div>📦 {tile.width}x{tile.height}</div>
      <button onClick={(e) => { e.stopPropagation(); onResize(tile.id); }}>↔️</button>
      <button onClick={(e) => { e.stopPropagation(); onRemove(tile.id); }}>❌</button>
    </div>
  );
};

export default Grid;
