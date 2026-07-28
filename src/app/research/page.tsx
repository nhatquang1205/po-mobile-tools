"use client";

import { useEffect, useMemo, useState } from "react";
import { AppDto, StageHistoryEntryDto } from "@/lib/types";
import { OwnerType, Stage } from "@/generated/prisma/enums";
import { OWNER_TYPE_LABELS, STAGE_COLORS, STAGE_LABELS, STAGE_ORDER } from "@/lib/lifecycle";
import { TimelineRow } from "@/components/research/TimelineRow";
import { TimelineHeader } from "@/components/research/TimelineHeader";
import { SegmentNoteModal } from "@/components/research/SegmentNoteModal";
import { Modal } from "@/components/Modal";
import { AppForm, AppFormValues, EMPTY_APP_FORM } from "@/components/apps/AppForm";
import { enumerateBusinessDays } from "@/lib/format";

export default function ResearchSetupPage() {
  const [apps, setApps] = useState<AppDto[] | null>(null);
  const [name, setName] = useState("");
  const [ownerType, setOwnerType] = useState<OwnerType | "">("");
  const [stage, setStage] = useState<Stage | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeEntry, setActiveEntry] = useState<StageHistoryEntryDto | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const params = new URLSearchParams({ statusCoarse: "new_app" });
    if (name) params.set("name", name);
    if (ownerType) params.set("ownerType", ownerType);
    if (stage) params.set("currentStage", stage);
    const res = await fetch(`/api/apps?${params.toString()}`);
    setApps(await res.json());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-filter-change, not derived state
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, ownerType, stage]);

  const handleCreate = async (values: AppFormValues) => {
    const res = await fetch("/api/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        publisherName: values.ownerType === "publisher" ? values.publisherName : null,
        releaseDay: values.releaseDay || null,
      }),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create app");
    setCreating(false);
    load();
  };

  // Computed once per page load so every row agrees on exactly what "today" is —
  // it's rendered separately as a sticky column, never part of the scrolling grid.
  const [today] = useState(() => new Date());

  const days = useMemo(() => {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const rangeEnd = toDate ? new Date(toDate) : yesterday;

    if (fromDate) return enumerateBusinessDays(new Date(fromDate), rangeEnd);

    if (!apps || apps.length === 0) return [];
    const min = apps.reduce(
      (acc, app) => Math.min(acc, new Date(app.createdAt).getTime()),
      rangeEnd.getTime(),
    );
    const minDate = new Date(min);
    if (minDate.getTime() > rangeEnd.getTime()) return [];
    return enumerateBusinessDays(minDate, rangeEnd);
  }, [apps, fromDate, toDate, today]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Research &amp; Setup</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
        >
          + New App
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">App name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
            placeholder="Search…"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Owner</label>
          <select
            value={ownerType}
            onChange={(e) => setOwnerType(e.target.value as OwnerType | "")}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            {Object.entries(OWNER_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Life-cycle status</label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as Stage | "")}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            {STAGE_ORDER.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {STAGE_ORDER.map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ backgroundColor: STAGE_COLORS[s] }}
            />
            {STAGE_LABELS[s]}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <div className="inline-block min-w-full px-4">
          <TimelineHeader days={days} today={today} />

          {apps?.map((app) => (
            <TimelineRow
              key={app.id}
              app={app}
              days={days}
              today={today}
              onSegmentClick={setActiveEntry}
              onAdvanced={load}
            />
          ))}

          {apps?.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-500">No apps match these filters.</p>
          )}
        </div>
      </div>

      {activeEntry && (
        <SegmentNoteModal
          entry={activeEntry}
          onClose={() => setActiveEntry(null)}
          onSaved={load}
        />
      )}

      {creating && (
        <Modal title="New App" onClose={() => setCreating(false)}>
          <AppForm
            initialValues={EMPTY_APP_FORM}
            submitLabel="Create app"
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </Modal>
      )}
    </div>
  );
}
