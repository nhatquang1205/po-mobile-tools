"use client";

import { TaskDto } from "@/lib/types";

export function TaskRow({
  task,
  appName,
  onToggle,
  dragHandlers,
}: {
  task: TaskDto;
  appName?: string;
  onToggle: (task: TaskDto) => void;
  dragHandlers: {
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnd: () => void;
  };
}) {
  const done = task.status === "done";

  return (
    <div
      draggable
      onDragStart={dragHandlers.onDragStart}
      onDragOver={dragHandlers.onDragOver}
      onDrop={dragHandlers.onDrop}
      onDragEnd={dragHandlers.onDragEnd}
      className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50"
    >
      <span className="cursor-grab select-none text-gray-300" title="Drag to reorder">
        ⠿
      </span>
      <input
        type="checkbox"
        checked={done}
        onChange={() => onToggle(task)}
        className="h-4 w-4 shrink-0"
      />
      {appName && (
        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
          {appName}
        </span>
      )}
      <span className={`flex-1 text-sm ${done ? "text-gray-400 line-through" : "text-gray-800"}`}>
        {task.description}
      </span>
      {task.isDefault && (
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-gray-300">default</span>
      )}
    </div>
  );
}
