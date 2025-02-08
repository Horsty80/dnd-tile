import React from "react";
import { useDraggable } from "@dnd-kit/core";

type ItemProps = {
    id: string;
    size: { w: number; h: number };
    onResize: (id: string) => void;
    onDelete: (id: string) => void;
};

const TILE_SIZE = 305;
const TILE_MARGIN = 4;

const Item: React.FC<ItemProps> = ({ id, size, onResize, onDelete }) => {
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
                transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : "",
            }}
        >
            Item {id}
            <button
                onClick={(e) => {
                    e.stopPropagation();
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
                    e.stopPropagation();
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
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onResize(id);
                }}
                style={{
                    position: "absolute",
                    top: "4px",
                    right: "76px",
                    backgroundColor: "#10b981",
                    color: "white",
                    padding: "4px",
                    borderRadius: "4px",
                }}
            >
                ⤢
            </button>
        </div>
    );
};

export default Item;