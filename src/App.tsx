import { useState } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useDndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragMoveEvent,
} from "@dnd-kit/core";

import { useSortable, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { restrictToParentElement } from "@dnd-kit/modifiers";

export const TILE_SIZE = 120;

type Tile = {
  id: string;
  x: number;
  y: number;
  h: number;
  w: number;
};

export default function App() {
  const [items, setItems] = useState<Tile[]>([]);
  const [skeleton, setSkeleton] = useState<{ x: number; y: number } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [moveOverlay, setMoveOverlay] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  // Handle the start of a drag event
  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id.toString());
  }

  // Handle the drag over event
  function handleDragOver({ active, over }: DragEndEvent) {
    setItems((items) =>
      arrayMove(
        items,
        items.findIndex((tile) => tile.id === active.id),
        items.findIndex((tile) => tile.id === over?.id)
      )
    );
  }

  // Check if a position is occupied by any tile, considering the size of the tiles
  function isTilePositionOccupied(x: number, y: number, items: Tile[], ignoreTileId?: string): boolean {
    // This function checks if the given x,y position collides with any tile (except the ignoredTileId).
    // Example usage: isTilePositionOccupied(5, 5, items, 'tile-123')
    const ignoredTile = items.find((item) => item.id === ignoreTileId);
    const ignoredTileWidth = ignoredTile ? ignoredTile.w : TILE_SIZE;
    const ignoredTileHeight = ignoredTile ? ignoredTile.h : TILE_SIZE;
    
    return items.some((item) => {
      const rect1 = { x, y, w: ignoredTileWidth, h: ignoredTileHeight };
      const rect2 = { x: item.x, y: item.y, w: item.w, h: item.h };

      const isColliding =
        rect1.x < rect2.x + rect2.w / TILE_SIZE &&
        rect1.x + rect1.w / TILE_SIZE > rect2.x &&
        rect1.y < rect2.y + rect2.h / TILE_SIZE &&
        rect1.y + rect1.h / TILE_SIZE > rect2.y;
      return isColliding && item.id !== ignoreTileId;
    });
  }

  // Handle the drag move event
  function handleDragMove(event: DragMoveEvent) {
    const { active, delta } = event;

    // Update x,y of the active tile
    setItems((oldItems) => {
      const idx = oldItems.findIndex((tile) => tile.id === active.id);
      const tile = oldItems[idx];
      const newX = Math.round((tile.x * TILE_SIZE + delta.x) / TILE_SIZE);
      const newY = Math.round((tile.y * TILE_SIZE + delta.y) / TILE_SIZE);

      if (isTilePositionOccupied(newX, newY, oldItems, active.id.toString())) {
        let collisionX = newX;
        const collisionY = newY;

        // Push to the right
        while (isTilePositionOccupied(collisionX, collisionY, oldItems, active.id.toString())) {
          collisionX += 1;
        }
        if (tile.x !== newX || tile.y !== newY) {
          setMoveOverlay({ x: collisionX, y: collisionY, w: tile.w, h: tile.h });
        } else {
          setMoveOverlay(null);
        }

      } else {
        setMoveOverlay(null);
      }
      setSkeleton({ x: newX, y: newY });

      return oldItems;
    });
  }

  // Resolve collisions by adjusting tile positions
  function resolveCollisions(items: Tile[]): Tile[] {
    let hasCollision = true;
    while (hasCollision) {
      hasCollision = false;
      items = items.map((tile) => {
        let newX = tile.x;
        const newY = tile.y;

        while (isTilePositionOccupied(newX, newY, items, tile.id)) {
          hasCollision = true;
          newX += 1; // Adjust this logic as needed for your specific collision resolution strategy
        }

        return { ...tile, x: newX, y: newY };
      });
    }
    return items;
  }

  // Handle the end of a drag event
  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event;

    // Update x,y of the active tile
    setItems((oldItems) => {
      const newTiles = [...oldItems];
      const idx = newTiles.findIndex((tile) => tile.id === active.id);
      const tile = newTiles[idx];
      const newX = Math.round((tile.x * TILE_SIZE + delta.x) / TILE_SIZE);
      const newY = Math.round((tile.y * TILE_SIZE + delta.y) / TILE_SIZE);

      if (isTilePositionOccupied(newX, newY, newTiles, active.id.toString())) {
        let collisionX = newX;
        const collisionY = newY;

        // Push to the right
        while (isTilePositionOccupied(collisionX, collisionY, newTiles, active.id.toString())) {
          collisionX += 1;
        }

        const collisionIdx = newTiles.findIndex((tile) => tile.x === newX && tile.y === newY);
        newTiles[collisionIdx] = { ...newTiles[collisionIdx], x: collisionX, y: collisionY };
      }

      newTiles[idx] = { ...tile, x: newX, y: newY };

      // Handle overlapping tiles
      newTiles.forEach((otherTile, otherIdx) => {
        if (
          otherIdx !== idx &&
          isTilePositionOccupied(otherTile.x, otherTile.y, newTiles, otherTile.id)
        ) {
          let newOtherX = otherTile.x;
          const newOtherY = otherTile.y;

          while (
            newOtherX < tile.x + tile.w / TILE_SIZE &&
            newOtherX + otherTile.w / TILE_SIZE > tile.x &&
            newOtherY < tile.y + tile.h / TILE_SIZE &&
            newOtherY + otherTile.h / TILE_SIZE > tile.y
          ) {
            newOtherX += 1;
          }

          // Ensure the new position is not occupied
          while (isTilePositionOccupied(newOtherX, newOtherY, newTiles, otherTile.id)) {
            newOtherX += 1;
          }

          newTiles[otherIdx] = { ...otherTile, x: newOtherX, y: newOtherY };
        }
      });

      return resolveCollisions(newTiles); // Ensure no collisions remain
    });
    setActiveId(null);
    setSkeleton(null); // Clear the skeleton overlay
    setMoveOverlay(null); // Clear the move overlay
  }

  // Handle enlarging a tile
  function handleEnlargeTile(id: string, direction: "horizontal" | "vertical" | "both") {
    setItems((oldItems) => {
      const newItems = oldItems.map((tile) => {
        if (tile.id === id) {
          const newTile = { ...tile };
          const directions = direction === "both" ? ["horizontal", "vertical"] : [direction];

          directions.forEach((dir) => {
            switch (dir) {
              case "horizontal":
                newTile.w += 3 * TILE_SIZE;
                break;
              case "vertical":
                newTile.h += 2 * TILE_SIZE;
                break;
              default:
                return tile;
            }

            // Check for collisions and shift all tiles if necessary
            oldItems.forEach((otherTile) => {
              if (otherTile.id !== id) {
                let collisionX = otherTile.x;
                let collisionY = otherTile.y;

                while (
                  collisionX < newTile.x + newTile.w / TILE_SIZE &&
                  collisionX + otherTile.w / TILE_SIZE > newTile.x &&
                  collisionY < newTile.y + newTile.h / TILE_SIZE &&
                  collisionY + otherTile.h / TILE_SIZE > newTile.y
                ) {
                  if (dir === "horizontal") {
                    collisionX += 1;
                  }
                  if (dir === "vertical") {
                    collisionY += 1;
                  }
                }

                // Ensure the new position is not occupied
                while (isTilePositionOccupied(collisionX, collisionY, oldItems, otherTile.id)) {
                  if (dir === "horizontal") {
                    collisionX += 1;
                  }
                  if (dir === "vertical") {
                    collisionY += 1;
                  }
                }

                otherTile.x = collisionX;
                otherTile.y = collisionY;
              }
            });
          });

          return newTile;
        }
        return tile;
      });

      return resolveCollisions(newItems); // Ensure no collisions remain
    });
  }

  // Handle resetting a tile's size
  function handleResetTileSize(id: string) {
    setItems((oldItems) =>
      oldItems.map((tile) => {
        if (tile.id === id) {
          return { ...tile, w: TILE_SIZE, h: TILE_SIZE };
        }
        return tile;
      })
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle hover event to show skeleton overlay
  const handleHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

    const isOccupied = items.some((item) => {
      const withinX = x >= item.x && x < item.x + item.w / TILE_SIZE;
      const withinY = y >= item.y && y < item.y + item.h / TILE_SIZE;
      return withinX && withinY;
    });

    if (isOccupied) {
      setSkeleton(null);
    } else {
      setSkeleton({ x, y });
    }
  };

  // Handle click event to add a new tile
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

    // Check if the position is occupied considering the size of the tile
    const isOccupied = items.some((item) => {
      const withinX = x >= item.x && x < item.x + item.w / TILE_SIZE;
      const withinY = y >= item.y && y < item.y + item.h / TILE_SIZE;
      return withinX && withinY;
    });

    if (isOccupied) {
      return;
    }

    setItems([...items, { id: generateRandomColorHex(), x, y, h: TILE_SIZE, w: TILE_SIZE }]);
    setSkeleton(null);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
        modifiers={[restrictToParentElement]}
      >
        <div
        role="grid"
        data-e2e="grid"
          style={{
            position: "relative",
            display: "grid",
            gap: 24,
            gridTemplateColumns: `repeat(5, ${TILE_SIZE}px)`,
            gridTemplateRows: `repeat(5, ${TILE_SIZE}px)`,
          }}
          onMouseMove={handleHover}
          onClick={handleClick}
        >
          {items.map(({ id, x, y, h, w }) => (
            <Item
              key={id}
              id={id}
              activeId={activeId}
              x={x}
              y={y}
              h={h}
              w={w}
              handleEnlargeTile={handleEnlargeTile}
              handleResetTileSize={handleResetTileSize}
            />
          ))}
          {skeleton && (
            <div
              style={{
                position: "absolute",
                backgroundColor: "rgba(0,0,0,0.2)",
                left: skeleton.x * TILE_SIZE,
                top: skeleton.y * TILE_SIZE,
                width: activeId ? items.find((item) => item.id === activeId)?.w : TILE_SIZE,
                height: activeId ? items.find((item) => item.id === activeId)?.h : TILE_SIZE,
                borderRadius: "2px",
              }}
            />
          )}
          {moveOverlay && (
            <div
              style={{
                position: "absolute",
                backgroundColor: "rgba(255,0,0,0.2)",
                left: moveOverlay.x * TILE_SIZE,
                top: moveOverlay.y * TILE_SIZE,
                width: moveOverlay.w,
                height: moveOverlay.h,
                borderRadius: "2px",
              }}
            />
          )}
        </div>

        <DragOverlay>{activeId ? <DragOverlayItem id={activeId} /> : null}</DragOverlay>
      </DndContext>
    </>
  );
}

type ItemProps = {
  id: string;
  activeId: string | null;
  x: number;
  y: number;
  h: number;
  w: number;
  handleEnlargeTile: (id: string, direction: "horizontal" | "vertical" | "both") => void;
  handleResetTileSize: (id: string) => void;
};

// Component for individual tile item
function Item({ id, activeId, x, y, h, w, handleEnlargeTile, handleResetTileSize }: ItemProps) {
  const sortable = useSortable({
    id,
  });

  const { setNodeRef, attributes, listeners, isDragging, transform, transition } = sortable;

  return (
    <motion.div
      layoutId={id}
      transition={{
        type: "spring",
        duration: activeId ? 0 : 0.6,
      }}
      ref={setNodeRef}
      style={{
        position: "absolute",
        background: "white",
        boxShadow: "0px 2px 4px rgba(0,0,0,0.15)",
        borderRadius: 2,
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
        userSelect: "none",
        touchAction: "none",
        opacity: isDragging ? 0.5 : 1,

        width: w,
        height: h,
        left: x * TILE_SIZE,
        top: y * TILE_SIZE,

        backgroundColor: id,
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : "none",
        transition,
      }}
      {...attributes}
      {...listeners}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <span>
          x: {x}, y: {y}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEnlargeTile(id, "horizontal");
          }}
        >
          Enlarge Horizontally
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEnlargeTile(id, "vertical");
          }}
        >
          Enlarge Vertically
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEnlargeTile(id, "both");
          }}
        >
          Enlarge Both
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleResetTileSize(id);
          }}
        >
          Reset Size
        </button>
      </div>
    </motion.div>
  );
}

// Component for the drag overlay
function DragOverlayItem(props: { id: string }) {
  const { id } = props;
  const context = useDndContext();
  const isReallyActive = context.active?.id === id;
  const activeTile = context.active ? context.active.data.current : null;

  return (
    <div
      style={{
        backgroundColor: id,
        height: activeTile ? activeTile.h : "100%",
        width: activeTile ? activeTile.w : "100%",
        borderRadius: 2,
        padding: 0,
        transform: isReallyActive ? "scale(1.05)" : "none",
      }}
    />
  );
}

// Generate a random hex color code
function generateRandomColorHex() {
  // Generates a random hex color like '#abc123'
  // Example usage: setItems([...items, { id: generateRandomColorHex(), ... }])
  const n = (Math.random() * 0xfffff * 1000000).toString(16);
  return "#" + n.slice(0, 6);
}
