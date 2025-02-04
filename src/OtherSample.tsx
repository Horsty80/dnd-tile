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
  useSensors
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates
} from "@dnd-kit/sortable";

import shuffle from "lodash/shuffle";

const initialItems = [...Array(30).keys()].map(() => generateRandomHexCode());

export default function App() {
  const [items, setItems] = useState(initialItems);

  const [activeId, setActiveId] = useState(null);
  const [columnCount, setColumnCount] = useState(5);

  function handleDragStart({ active }) {
    setActiveId(active.id);
  }

  function handleDragOver({ active, over }: DragEndEvent) {
    setItems((items) =>
      arrayMove(items, items.indexOf(active.id), items.indexOf(over?.id))
    );
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  return (
    <>
      <div style={{ padding: 16 }}>
        <button
          style={{ marginRight: 16 }}
          onClick={() => {
            setItems(shuffle(items));
          }}
        >
          Shuffle items
        </button>

        <input
          type="range"
          value={columnCount}
          min={4}
          max={16}
          onChange={(event) => {
            setColumnCount((event.target.value as any) as number);
          }}
        />
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={() => null}>
          <div
            style={{
              display: "grid",
              gap: 24,
              padding: 48,
                            gridTemplateColumns: `repeat(${columnCount}, 1fr)`
            }}
          >
            {items.map((id) => (
              <Item key={id} id={id} activeId={activeId} />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? <DragOverlayItem id={activeId} /> : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}

function Item({ id, activeId }) {
  const sortable = useSortable({
    id
  });

  const {
    setNodeRef,
    attributes,
    listeners,
    isDragging,
    transform,
    transition
  } = sortable;

  return (
    <motion.div
      layoutId={id}
      transition={{
        type: "spring",
        duration: activeId ? 0 : 0.6
      }}
      ref={setNodeRef}
      style={{
        position: "relative",
        padding: "50%",
        background: "white",
        boxShadow: "0px 2px 4px rgba(0,0,0,0.15)",
        borderRadius: 10,
        display: "flex",
        justifyItems: "center",
        alignItems: "center",
        userSelect: "none",
        touchAction: "none",
        opacity: isDragging ? 0.5 : 1,
        gridColumn: id[1] > Number(5) ? "span 2" : undefined,
        backgroundColor: id,
        transform: transform
          ? `translate(${transform.x}px, ${transform.y}px)`
          : "none",
        transition
      }}
      {...attributes}
      {...listeners}
    />
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
        padding: 0,
        transform: isReallyActive ? "scale(1.05)" : "none"
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
