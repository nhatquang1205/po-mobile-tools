"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Stage } from "@/generated/prisma/enums";
import { STAGE_LABELS, nextStageOptions } from "@/lib/lifecycle";

export function UpdateStageModal({
  appId,
  currentStage,
  onClose,
  onUpdated,
}: {
  appId: string;
  currentStage: Stage;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const options = nextStageOptions(currentStage);
  const [choice, setChoice] = useState<Stage | "">(options[0] ?? "");
  const [transitionDate, setTransitionDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/apps/${appId}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nextStage: choice || undefined,
        transitionDate: transitionDate || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      onUpdated();
    } else {
      setError((await res.json()).error ?? "Could not update stage");
    }
  };

  return (
    <Modal title="Update stage" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Current stage</p>
          <p className="text-sm font-medium">{STAGE_LABELS[currentStage]}</p>
        </div>

        {options.length === 0 ? (
          <p className="text-sm text-gray-500">No further stage to move to.</p>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">Move to</label>
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={choice}
              onChange={(e) => setChoice(e.target.value as Stage)}
            >
              {options.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            Date <span className="font-normal text-gray-400">(optional — defaults to today)</span>
          </label>
          <input
            type="date"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={transitionDate}
            onChange={(e) => setTransitionDate(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || options.length === 0}
            className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Submit"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
