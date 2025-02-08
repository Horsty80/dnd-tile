import { useSortable } from "@dnd-kit/sortable";
import { TILE_MARGIN, TILE_SIZE } from "./App2";

export type TileProps = {
  id: string;
  index: number;
  x: number;
  y: number;
};

function Tile({ id, index, x, y }: TileProps) {
  const sortable = useSortable({
    id,
  });
  const { setNodeRef, attributes, listeners, isDragging, transform, transition } = sortable;
  return (
    <div
      ref={setNodeRef}
      style={{
        position: "relative",
        background: "white",
        boxShadow: "0px 2px 4px rgba(0,0,0,0.15)",
        display: "flex",
        justifyItems: "center",
        alignItems: "center",

        width: TILE_SIZE,
        height: TILE_SIZE,
        left: x * (TILE_SIZE + TILE_MARGIN),
        top: y * (TILE_SIZE + TILE_MARGIN),
        opacity: isDragging ? 0.5 : 1,
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : "none",
        transition,
      }}
      {...attributes}
      {...listeners}
    >{index}</div>
  );
}

export default Tile;
