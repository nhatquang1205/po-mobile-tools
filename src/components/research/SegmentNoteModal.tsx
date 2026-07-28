"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { StageHistoryEntryDto, TaskDto } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/lifecycle";
import { TaskList } from "@/components/tasks/TaskList";

export function SegmentNoteModal({
  entry,
  onClose,
  onSaved,
}: {
  entry: StageHistoryEntryDto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isOpen = !entry.exitedAt;
  const [note, setNote] = useState(entry.note ?? "");
  const [enteredAt, setEnteredAt] = useState(entry.enteredAt.slice(0, 10));
  const [exitedAt, setExitedAt] = useState(entry.exitedAt ? entry.exitedAt.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskDto[] | null>(null);

  const loadTasks = async () => {
    const res = await fetch(`/api/stage-history/${entry.id}/tasks`);
    setTasks(await res.json());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, not derived state
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/stage-history/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note,
        enteredAt,
        exitedAt: isOpen ? undefined : exitedAt,
      }),
    });
    setSaving(false);
    if (res.ok) {
      onSaved();
      onClose();
    } else {
      setError((await res.json()).error ?? "Could not save changes");
    }
  };

  return (
    <Modal title={STAGE_LABELS[entry.stage]} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="mb-1 text-sm font-medium">Tasks</p>
          {tasks ? (
            <TaskList
              tasks={tasks}
              swapEndpoint={`/api/stage-history/${entry.id}/tasks/swap`}
              createEndpoint={`/api/stage-history/${entry.id}/tasks`}
              onChanged={loadTasks}
            />
          ) : (
            <p className="py-1 text-sm text-gray-400">Loading tasks…</p>
          )}
        </div>

        <hr className="border-gray-200" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start date</label>
            <input
              type="date"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={enteredAt}
              onChange={(e) => setEnteredAt(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End date</label>
            {isOpen ? (
              <div className="flex h-[38px] items-center text-sm text-gray-400">Ongoing</div>
            ) : (
              <input
                type="date"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={exitedAt}
                onChange={(e) => setExitedAt(e.target.value)}
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Note</label>
          <textarea
            autoFocus
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
