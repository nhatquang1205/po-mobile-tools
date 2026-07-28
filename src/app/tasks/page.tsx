"use client";

import { useEffect, useMemo, useState } from "react";
import { TaskWithAppDto } from "@/lib/types";
import { TaskQuadrant } from "@/generated/prisma/enums";
import { TaskCard } from "@/components/tasks/TaskCard";

type Bucket = TaskQuadrant | null; // null = inbox (unsorted)

const QUADRANTS: { key: TaskQuadrant; label: string; sublabel: string; classes: string }[] = [
  {
    key: "do_now",
    label: "Thực hiện ngay",
    sublabel: "Khẩn cấp & Quan trọng",
    classes: "border-red-200 bg-red-50",
  },
  {
    key: "schedule",
    label: "Lên lịch",
    sublabel: "Không khẩn cấp & Quan trọng",
    classes: "border-blue-200 bg-blue-50",
  },
  {
    key: "delegate",
    label: "Ủy thác",
    sublabel: "Khẩn cấp & Không quan trọng",
    classes: "border-emerald-200 bg-emerald-50",
  },
  {
    key: "eliminate",
    label: "Xóa bỏ",
    sublabel: "Không khẩn cấp & Không quan trọng",
    classes: "border-amber-200 bg-amber-50",
  },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithAppDto[] | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const res = await fetch("/api/tasks");
    setTasks(await res.json());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, not derived state
    load();
  }, []);

  // Distinct apps (with their current entry to attach a new task to), derived
  // from whatever tasks are currently loaded.
  const apps = useMemo(() => {
    if (!tasks) return [];
    const seen = new Map<string, { entryId: string; name: string }>();
    for (const t of tasks) {
      if (t.appId && t.currentEntryId && !seen.has(t.appId)) {
        seen.set(t.appId, { entryId: t.currentEntryId, name: t.appName! });
      }
    }
    return Array.from(seen.values());
  }, [tasks]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) return;
    setAdding(true);
    if (selectedEntryId) {
      await fetch(`/api/stage-history/${selectedEntryId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: newDescription.trim() }),
      });
    } else {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: newDescription.trim() }),
      });
    }
    setAdding(false);
    setNewDescription("");
    load();
  };

  const handleToggleDone = async (task: TaskWithAppDto) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: task.status === "done" ? "todo" : "done" }),
    });
    load();
  };

  const handleDelete = async (task: TaskWithAppDto) => {
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    load();
  };

  // Dropping onto another task: same bucket = reorder (swap priority); a
  // different bucket = move quadrant, landing near the drop target.
  const handleDropOnTask = async (targetTask: TaskWithAppDto) => {
    if (!draggedId || draggedId === targetTask.id || !tasks) return;
    const dragged = tasks.find((t) => t.id === draggedId);
    setDraggedId(null);
    if (!dragged) return;

    if (dragged.quadrant !== targetTask.quadrant) {
      await fetch(`/api/tasks/${dragged.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quadrant: targetTask.quadrant }),
      });
    }
    await fetch("/api/tasks/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: dragged.id, otherTaskId: targetTask.id }),
    });
    load();
  };

  // Dropping onto empty bucket space: just move quadrant, no reorder needed.
  const handleDropOnBucket = async (bucket: Bucket) => {
    if (!draggedId || !tasks) return;
    const dragged = tasks.find((t) => t.id === draggedId);
    setDraggedId(null);
    if (!dragged || dragged.quadrant === bucket) return;

    await fetch(`/api/tasks/${dragged.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quadrant: bucket }),
    });
    load();
  };

  const inboxTasks = (tasks ?? [])
    .filter((t) => t.quadrant === null)
    .sort((a, b) => a.priorityInApp - b.priorityInApp);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Tasks</h1>

      <div className="flex h-[calc(100vh-140px)] gap-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDropOnBucket(null)}
          className="flex w-[30%] flex-col rounded border border-gray-200 bg-gray-50 p-3"
        >
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Inbox ({inboxTasks.length})
          </h2>

          <form onSubmit={handleAdd} className="mb-3 space-y-2">
            <select
              value={selectedEntryId}
              onChange={(e) => setSelectedEntryId(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="">No app</option>
              {apps.map((a) => (
                <option key={a.entryId} value={a.entryId}>
                  {a.name}
                </option>
              ))}
            </select>
            <div className="flex gap-1">
              <input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="New task…"
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
              />
              <button
                type="submit"
                disabled={adding || !newDescription.trim()}
                className="rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </form>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
            {inboxTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleDone={handleToggleDone}
                onDelete={handleDelete}
                onDragStart={() => setDraggedId(task.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.stopPropagation();
                  handleDropOnTask(task);
                }}
                onDragEnd={() => setDraggedId(null)}
              />
            ))}
            {inboxTasks.length === 0 && (
              <p className="py-2 text-center text-xs text-gray-400">Empty</p>
            )}
          </div>
        </div>

        <div className="grid h-full w-[70%] grid-cols-2 grid-rows-2 gap-4">
          {QUADRANTS.map((q) => {
            const quadrantTasks = (tasks ?? [])
              .filter((t) => t.quadrant === q.key)
              .sort((a, b) => a.priorityInApp - b.priorityInApp);

            return (
              <div
                key={q.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnBucket(q.key)}
                className={`flex h-full w-full flex-col rounded border p-3 ${q.classes}`}
              >
                <h2 className="text-sm font-semibold text-gray-700">{q.label}</h2>
                <p className="mb-2 text-[11px] text-gray-500">{q.sublabel}</p>
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                  {quadrantTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleDone={handleToggleDone}
                      onDelete={handleDelete}
                      onDragStart={() => setDraggedId(task.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.stopPropagation();
                        handleDropOnTask(task);
                      }}
                      onDragEnd={() => setDraggedId(null)}
                    />
                  ))}
                  {quadrantTasks.length === 0 && (
                    <p className="py-2 text-center text-xs text-gray-400">Drop tasks here</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
