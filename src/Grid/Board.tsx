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
import { restrictToParentElement } from "@dnd-kit/modifiers";

const TILE_SIZE = 100;
const GRID_SIZE = 5;
const TILE_MARGIN = 4;

type Tile = {
    id: string;
    position: { x: number; y: number };
    size: { w: number; h: number };
};

function Tile({ id, position, size }: Tile) {
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
                width: TILE_SIZE * size.w + TILE_MARGIN * (size.w - 1),
                height: TILE_SIZE * size.h + TILE_MARGIN * (size.h - 1),
                left: position.x * (TILE_SIZE + TILE_MARGIN),
                top: position.y * (TILE_SIZE + TILE_MARGIN),
                transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : "",
            }}
        >
            {id}
        </div>
    );
}

function isOccupied(x: number, y: number, tiles: Tile[]) {
    return tiles.some((t) => x >= t.position.x && x < t.position.x + t.size.w && y >= t.position.y && y < t.position.y + t.size.h);
}

function resizeTileAndShift(tiles: Tile[], tileId: string) {
    let updated = [...tiles];
    const idx = updated.findIndex((t) => t.id === tileId);
    if (idx === -1) return tiles;

    const oldTile = updated[idx];
    const isSmall = oldTile.size.w === 1 && oldTile.size.h === 1;
    const newSize = isSmall ? { w: 3, h: 2 } : { w: 1, h: 1 };

    updated[idx] = { ...oldTile, size: newSize };
    const deltaW = newSize.w - oldTile.size.w;
    const deltaH = newSize.h - oldTile.size.h;

    if (deltaW <= 0 && deltaH <= 0) {
        return updated;
    }

    for (let row = oldTile.position.y; row < oldTile.position.y + newSize.h; row++) {
        for (let col = oldTile.position.x; col < oldTile.position.x + newSize.w; col++) {
            if (
                row < oldTile.position.y + oldTile.size.h &&
                col < oldTile.position.x + oldTile.size.w
            ) continue;

            const occupant = updated.find((t) =>
                t.id !== tileId &&
                col >= t.position.x && col < t.position.x + t.size.w &&
                row >= t.position.y && row < t.position.y + t.size.h
            );
            if (occupant) {
                if (col >= oldTile.position.x + oldTile.size.w) {
                    updated = pushTile(updated, occupant.id, 1, 0);
                } else if (row >= oldTile.position.y + oldTile.size.h) {
                    updated = pushTile(updated, occupant.id, 0, 1);
                }
            }
        }
    }

    return updated;
}

export default function Board() {
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [skeleton, setSkeleton] = useState<{ x: number; y: number } | null>(null);

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

            setSkeleton({ x: newX, y: newY });
            return oldTiles;
        });
    };

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

            if (!isOccupied(newX, newY, newTiles)) {
                newTiles[idx] = { ...tile, position: { x: newX, y: newY } };
            }
            return newTiles;
        });
        setSkeleton(null);
    };

    const handleAddTile = (x: number, y: number) => {
        setTiles((prev) => {
            if (!isOccupied(x, y, prev)) {
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

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    return (
        <div style={{ position: "relative", width: GRID_SIZE * (TILE_SIZE + TILE_MARGIN), height: GRID_SIZE * (TILE_SIZE + TILE_MARGIN) }}>
            <DndContext
                sensors={sensors}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToParentElement]}
            >
                <div
                    style={{
                        position: "relative",
                        display: "grid",
                        gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE + TILE_MARGIN}px)`,
                        gridTemplateRows: `repeat(${GRID_SIZE}, ${TILE_SIZE + TILE_MARGIN}px)`,
                    }}
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = Math.floor((e.clientX - rect.left) / (TILE_SIZE + TILE_MARGIN));
                        const y = Math.floor((e.clientY - rect.top) / (TILE_SIZE + TILE_MARGIN));
                        handleAddTile(x, y);
                    }}
                >
                    {tiles.map((tile) => (
                        <Tile key={tile.id} id={tile.id} position={tile.position} size={tile.size} />
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
                                borderRadius: "8px",
                            }}
                        />
                    )}
                </div>
            </DndContext>
        </div>
    );
}