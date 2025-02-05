import { useDndContext } from "@dnd-kit/core";

export function DragOverlayItem(props: { id: string }) {
    const { id } = props;
  
    // DragOver seems to cache this component so I can't tell if the item is still actually active
    // It will remain active until it has settled in place rather than when dragEnd has occured
    // I need to know when drag end has taken place to trigger the scale down animation
    // I use a hook which looks at DndContex to get active
  
    const isReallyActive = useDndIsReallyActiveId(id);
  
    return (
      <div
        style={{
          backgroundColor: "blueviolet",
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