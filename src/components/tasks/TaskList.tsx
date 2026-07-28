"use client";

import { useState } from "react";
import { TaskDto } from "@/lib/types";
import { TaskRow } from "@/components/tasks/TaskRow";
import { useDragReorder } from "@/lib/useDragReorder";

export function TaskList({
  tasks,
  swapEndpoint,
  createEndpoint,
  getAppName,
  onChanged,
}: {
  tasks: TaskDto[];
  /** e.g. `/api/stage-history/{entryId}/tasks/swap` or `/api/tasks/swap` */
  swapEndpoint: string;
  /** e.g. `/api/stage-history/{entryId}/tasks` — omit to hide the "add task" input */
  createEndpoint?: string;
  /** shows a small app-name tag per row — used by the flat, un-grouped Tasks page */
  getAppName?: (task: TaskDto) => string | undefined;
  onChanged: () => void;
}) {
  const [newDescription, setNewDescription] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSwap = async (a: TaskDto, b: TaskDto) => {
    await fetch(swapEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: a.id, otherTaskId: b.id }),
    });
    onChanged();
  };

  const { onDragStart, onDragOver, onDrop, onDragEnd } = useDragReorder(tasks, handleSwap);

  const handleToggle = async (task: TaskDto) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: task.status === "done" ? "todo" : "done" }),
    });
    onChanged();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim() || !createEndpoint) return;
    setAdding(true);
    await fetch(createEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: newDescription.trim() }),
    });
    setAdding(false);
    setNewDescription("");
    onChanged();
  };

  return (
    <div className="space-y-1">
      {tasks.map((task, i) => (
        <TaskRow
          key={task.id}
          task={task}
          appName={getAppName?.(task)}
          onToggle={handleToggle}
          dragHandlers={{
            onDragStart: onDragStart(i),
            onDragOver: onDragOver(i),
            onDrop: onDrop(i),
            onDragEnd,
          }}
        />
      ))}

      {tasks.length === 0 && <p className="py-1 text-sm text-gray-400">No tasks yet.</p>}

      {createEndpoint && (
        <form onSubmit={handleAdd} className="flex gap-2 pt-1">
          <input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Add task…"
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <button
            type="submit"
            disabled={adding}
            className="rounded bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {adding ? "…" : "Add"}
          </button>
        </form>
      )}
    </div>
  );
}
