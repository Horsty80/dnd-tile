import { TILE_MARGIN, TILE_SIZE } from "./App2";

type SkeletonProps = {
    x: number;
    y: number;
}

function Skeleton({x, y}: SkeletonProps) {
  return (
    <div
      style={{
        position: "absolute",
        backgroundColor: "rgba(0,0,0,0.3)",
        width: TILE_SIZE,
        height: TILE_SIZE,
        left: x * (TILE_SIZE + TILE_MARGIN),
        top: y * (TILE_SIZE + TILE_MARGIN),
        border: "1px dashed #000",
        borderRadius: "8px",
      }}
    />
  );
}

export default Skeleton;
