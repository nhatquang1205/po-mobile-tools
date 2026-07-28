"use client";

import { useState } from "react";

// Plain HTML5 drag-and-drop, no library. Dropping item A onto item B's row
// calls `onSwap(a, b)` — the caller decides what "swap" means (which columns
// to exchange), this hook only tracks which index is currently being dragged.
export function useDragReorder<T>(items: T[], onSwap: (a: T, b: T) => void) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const onDragStart = (index: number) => () => setDraggedIndex(index);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for a symmetric per-index API with onDragStart/onDrop
  const onDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    onSwap(items[draggedIndex], items[index]);
    setDraggedIndex(null);
  };

  const onDragEnd = () => setDraggedIndex(null);

  return { draggedIndex, onDragStart, onDragOver, onDrop, onDragEnd };
}
