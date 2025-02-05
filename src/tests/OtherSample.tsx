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

import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { restrictToParentElement } from "@dnd-kit/modifiers";

export const TILE_SIZE = 200;

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



  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id.toString());
  }

  function handleDragOver({ active, over }: DragEndEvent) {
    setItems((items) =>
      arrayMove(
        items,
        items.findIndex((tile) => tile.id === active.id),
        items.findIndex((tile) => tile.id === over?.id)
      )
    );
  }

  function isPositionOccupied(x: number, y: number, items: Tile[]): boolean {
    return items.some((item) => item.x === x && item.y === y);
  }

  function handleDragMove(event: DragMoveEvent) {
    const { active, delta } = event;

    // Update x,y of the active tile
    setItems((oldItems) => {
      const idx = oldItems.findIndex((tile) => tile.id === active.id);
      const tile = oldItems[idx];
      const newX = Math.round((tile.x * TILE_SIZE + delta.x) / TILE_SIZE);
      const newY = Math.round((tile.y * TILE_SIZE + delta.y) / TILE_SIZE);

      if (isPositionOccupied(newX, newY, oldItems)) {
        setSkeleton(null);
      } else {
        setSkeleton({ x: newX, y: newY });
      }

      return oldItems;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta, collisions, over } = event;
    console.log("Active", active);
    console.log("Delta", delta);
    console.log("Collisions", collisions);
    console.log("Over", over);

    // Update x,y of the active tile
    setItems((oldItems) => {
      const newTiles = [...oldItems];
      const idx = newTiles.findIndex((tile) => tile.id === active.id);
      const tile = newTiles[idx];
      const newX = Math.round((tile.x * TILE_SIZE + delta.x) / TILE_SIZE);
      const newY = Math.round((tile.y * TILE_SIZE + delta.y) / TILE_SIZE);
      newTiles[idx] = { ...tile, x: newX, y: newY };
      return newTiles;
    });
    setActiveId(null);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

    if (isPositionOccupied(x, y, items)) {
      setSkeleton(null);
    } else {
      setSkeleton({ x, y });
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // add an item
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

    if (isPositionOccupied(x, y, items)) {
      return;
    }

    setItems([...items, { id: generateRandomHexCode(), x, y, h: TILE_SIZE, w: TILE_SIZE }]);
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
        <SortableContext items={items}>
          <div
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
              <Item key={id} id={id} activeId={activeId} x={x} y={y} h={h} w={w} />
            ))}
            {skeleton && (
              <div
                style={{
                  position: "absolute",
                  backgroundColor: "rgba(0,0,0,0.2)",
                  left: skeleton.x * TILE_SIZE,
                  top: skeleton.y * TILE_SIZE,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  borderRadius: "2px",
                }}
              />
            )}
          </div>
        </SortableContext>

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
};

function Item({ id, activeId, x, y, h, w }: ItemProps) {
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
        justifyItems: "center",
        alignItems: "center",
        userSelect: "none",
        touchAction: "none",
        opacity: isDragging ? 0.5 : 1,

        width: TILE_SIZE,
        height: TILE_SIZE,
        left: x * TILE_SIZE,
        top: y * TILE_SIZE,

        backgroundColor: id,
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : "none",
        transition,
      }}
      {...attributes}
      {...listeners}
    >
      <span>
        x: {x}, y: {y}
      </span>
    </motion.div>
  );
}

function DragOverlayItem(props: { id: string }) {
  const { id } = props;

  // DragOver seems to cache this component so I can't tell if the item is still actually active
  // It will remain active until it has settled in place rather than when dragEnd has occured
  // I need to know when drag end has taken place to trigger the scale down animation
  // I use a hook which looks at DndContex to get active

  const isReallyActive = useDndIsReallyActiveId(id);

  return (
    <div
      style={{
        backgroundColor: id,
        height: "100%",
        borderRadius: 2,
        padding: 0,
        transform: isReallyActive ? "scale(1.05)" : "none",
      }}
    />
  );
}

function useDndIsReallyActiveId(id: string) {
  const context = useDndContext();
  const isActive = context.active?.id === id;
  return isActive;
}

function generateRandomHexCode() {
  let n = (Math.random() * 0xfffff * 1000000).toString(16);
  return "#" + n.slice(0, 6);
}
