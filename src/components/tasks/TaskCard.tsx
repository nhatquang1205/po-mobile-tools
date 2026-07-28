"use client";

import { TaskWithAppDto } from "@/lib/types";

export function TaskCard({
  task,
  onToggleDone,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  task: TaskWithAppDto;
  onToggleDone: (task: TaskWithAppDto) => void;
  onDelete: (task: TaskWithAppDto) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const done = task.status === "done";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className="w-full cursor-grab rounded border border-gray-200 bg-white p-3 shadow-sm hover:shadow"
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={done}
          onChange={() => onToggleDone(task)}
          className="mt-1 h-5 w-5 shrink-0"
        />
        <p className={`flex-1 text-base ${done ? "text-gray-400 line-through" : "text-gray-800"}`}>
          {task.description}
        </p>
        <button
          type="button"
          onClick={() => onDelete(task)}
          title="Delete task"
          className="shrink-0 text-gray-300 hover:text-red-500"
        >
          ×
        </button>
      </div>
      {task.appName && (
        <span className="ml-8 mt-1.5 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          {task.appName}
        </span>
      )}
    </div>
  );
}
