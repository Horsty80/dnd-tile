import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import Tile from "./Tile";
import { useState } from "react";
import { DragOverlayItem } from "./OverlayItem";
import "./App.css"; // Import the CSS file for styling

type Items = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export const TILE_SIZE = 300;
export const TILE_MARGIN = 4;

function App() {
  const [items, setItems] = useState<Items[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [skeleton, setSkeleton] = useState<{ x: number; y: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const columnCount = 5;

  const handleDragStart = ({ active }: DragStartEvent) => {
    console.log(active.id);
    setActiveId(active.id.toString());
  };

  const handleDragOver = () => {
    // noop
  };

  const handleDragEnd = () => {
    setActiveId(null);
  };

  // Ajouter une tuile si libre
  const handleAddTile = (x: number, y: number) => {
    if (!items.some((tile) => tile.x === x && tile.y === y)) {
      setItems([...items, { id: crypto.randomUUID(), x, y, width: 1, height: 1 }]);
    }
  };

  /** Indique si (x,y) est occupé par une tuile (sauf ignoreId) */
  function isOccupied(x: number, y: number, tiles: Items[], ignoreId: string | null = null) {
    return tiles.some((t) => {
      if (ignoreId && t.id === ignoreId) return false;
      return x >= t.x && x < t.x + t.width && y >= t.y && y < t.y + t.height;
    });
  }

  const handleHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (TILE_SIZE + TILE_MARGIN));
    const y = Math.floor((e.clientY - rect.top) / (TILE_SIZE + TILE_MARGIN));

    setItems((oldTiles) => {
      if (!isOccupied(x, y, oldTiles)) {
        setSkeleton({ x, y });
      } else {
        setSkeleton(null);
      }
      return oldTiles;
    });
  };

  return (
    <div>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={() => null}>
          <div
            className="grid-container" // Add a class for styling
            style={{
              position: "relative",
              display: "grid",
              // gap: 24,
              gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
              gridTemplateRows: `repeat(${columnCount}, 1fr)`,
            }}
            onMouseMove={handleHover}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.floor((e.clientX - rect.left) / (TILE_SIZE + TILE_MARGIN));
              const y = Math.floor((e.clientY - rect.top) / (TILE_SIZE + TILE_MARGIN));
              handleAddTile(x, y);
            }}
          >
            {items.map(({ id, y, x }, index) => (
              <Tile key={id} id={id} index={index} x={x} y={y} />
            ))}
            {skeleton && (
              <div
                style={{
                  position: "absolute",
                  backgroundColor: "rgba(0,0,0,0.2)",
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  left: skeleton.x * (TILE_SIZE + TILE_MARGIN),
                  top: skeleton.y * (TILE_SIZE + TILE_MARGIN),
                  border: "1px dashed #000",
                  borderRadius: "2px",
                }}
              />
            )}
          </div>
        </SortableContext>

        <DragOverlay>{activeId ? <DragOverlayItem id={activeId} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

export default App;
