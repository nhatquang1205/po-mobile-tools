"use client";

import { useEffect, useMemo, useState } from "react";
import { AppDto, StageHistoryEntryDto } from "@/lib/types";
import { OwnerType, Stage } from "@/generated/prisma/enums";
import { OWNER_TYPE_LABELS, SCALED_CYCLE_ORDER, STAGE_COLORS, STAGE_LABELS } from "@/lib/lifecycle";
import { TimelineRow } from "@/components/research/TimelineRow";
import { TimelineHeader } from "@/components/research/TimelineHeader";
import { SegmentNoteModal } from "@/components/research/SegmentNoteModal";
import { UpdateStageButton } from "@/components/research/UpdateStageButton";
import { Modal } from "@/components/Modal";
import { AppForm, AppFormValues, EMPTY_APP_FORM } from "@/components/apps/AppForm";
import { enumerateBusinessDays } from "@/lib/format";

// Only the current update cycle's entries — everything after the most recent
// time the app was idle at `scaled_app` — so an earlier completed cycle
// doesn't show up alongside the active one.
function currentCycleEntries(app: AppDto): StageHistoryEntryDto[] {
  const history = app.stageHistory;
  let lastIdleIdx = -1;
  for (let i = 0; i < history.length; i++) {
    if (history[i].stage === "scaled_app" && history[i].exitedAt) lastIdleIdx = i;
  }
  return lastIdleIdx === -1 ? history : history.slice(lastIdleIdx + 1);
}

export default function ScaledAppPage() {
  const [apps, setApps] = useState<AppDto[] | null>(null);
  const [tab, setTab] = useState<"cycle" | "history">("cycle");

  const [name, setName] = useState("");
  const [ownerType, setOwnerType] = useState<OwnerType | "">("");
  const [stage, setStage] = useState<Stage | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeEntry, setActiveEntry] = useState<StageHistoryEntryDto | null>(null);
  const [historyAppId, setHistoryAppId] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const params = new URLSearchParams({ statusCoarse: "scaled" });
    if (name) params.set("name", name);
    if (ownerType) params.set("ownerType", ownerType);
    if (stage) params.set("currentStage", stage);
    const res = await fetch(`/api/apps?${params.toString()}`);
    setApps(await res.json());
  };

  const handleCreate = async (values: AppFormValues) => {
    const res = await fetch("/api/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        publisherName: values.ownerType === "publisher" ? values.publisherName : null,
        releaseDay: values.releaseDay || null,
        startInScaled: true,
      }),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create app");
    setCreating(false);
    load();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-filter-change, not derived state
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, ownerType, stage]);

  // Computed once per page load so every row agrees on exactly what "today" is.
  const [today] = useState(() => new Date());

  const midCycleApps = useMemo(
    () => (apps ?? []).filter((a) => a.currentStage !== "scaled_app"),
    [apps],
  );

  const days = useMemo(() => {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const rangeEnd = toDate ? new Date(toDate) : yesterday;

    if (fromDate) return enumerateBusinessDays(new Date(fromDate), rangeEnd);

    if (midCycleApps.length === 0) return [];
    const min = midCycleApps.reduce((acc, app) => {
      const entries = currentCycleEntries(app);
      const start = entries[0] ? new Date(entries[0].enteredAt).getTime() : acc;
      return Math.min(acc, start);
    }, rangeEnd.getTime());
    const minDate = new Date(min);
    if (minDate.getTime() > rangeEnd.getTime()) return [];
    return enumerateBusinessDays(minDate, rangeEnd);
  }, [midCycleApps, fromDate, toDate, today]);

  const historyApp = apps?.find((a) => a.id === historyAppId) ?? apps?.[0] ?? null;
  const historyDays = useMemo(() => {
    if (!historyApp || historyApp.stageHistory.length === 0) return [];
    const start = new Date(historyApp.stageHistory[0].enteredAt);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (start.getTime() > yesterday.getTime()) return [];
    return enumerateBusinessDays(start, yesterday);
  }, [historyApp, today]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Scaled Apps</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
        >
          + New Scaled App
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("cycle")}
          className={`rounded px-3 py-1.5 text-sm ${tab === "cycle" ? "bg-gray-900 text-white" : "border border-gray-200 bg-white text-gray-600"}`}
        >
          Update Cycle
        </button>
        <button
          onClick={() => setTab("history")}
          className={`rounded px-3 py-1.5 text-sm ${tab === "history" ? "bg-gray-900 text-white" : "border border-gray-200 bg-white text-gray-600"}`}
        >
          Setup History
        </button>
      </div>

      {tab === "cycle" && (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">App name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                placeholder="Search…"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Owner</label>
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
              <label className="mb-1 block text-xs font-medium text-gray-500">Life-cycle status</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as Stage | "")}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm"
              >
                <option value="">All</option>
                {SCALED_CYCLE_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            {SCALED_CYCLE_ORDER.map((s) => (
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

              {apps?.map((app) =>
                app.currentStage === "scaled_app" ? (
                  <div key={app.id} className="flex items-center border-t border-gray-100">
                    <div className="sticky left-0 z-10 w-40 shrink-0 bg-white py-3 pr-2">
                      <p className="truncate text-sm font-medium">{app.name}</p>
                    </div>
                    <div className="flex-1 py-3 text-sm text-gray-400">
                      Idle — no update in progress
                    </div>
                    <div className="sticky right-0 w-24 shrink-0 bg-white pl-2">
                      <UpdateStageButton
                        appId={app.id}
                        currentStage={app.currentStage}
                        onUpdated={load}
                      />
                    </div>
                  </div>
                ) : (
                  <TimelineRow
                    key={app.id}
                    app={{ ...app, stageHistory: currentCycleEntries(app) }}
                    days={days}
                    today={today}
                    onSegmentClick={setActiveEntry}
                    onAdvanced={load}
                  />
                ),
              )}

              {apps?.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-500">No apps have scaled yet.</p>
              )}
            </div>
          </div>
        </>
      )}

      {tab === "history" && (
        <div>
          <select
            value={historyApp?.id ?? ""}
            onChange={(e) => setHistoryAppId(e.target.value)}
            className="mb-4 rounded border border-gray-300 px-3 py-1.5 text-sm"
          >
            {apps?.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>

          <div className="overflow-x-auto rounded border border-gray-200 bg-white">
            <div className="inline-block min-w-full px-4">
              {historyApp ? (
                <>
                  <TimelineHeader days={historyDays} today={today} />
                  <TimelineRow
                    app={historyApp}
                    days={historyDays}
                    today={today}
                    onSegmentClick={setActiveEntry}
                    onAdvanced={load}
                  />
                </>
              ) : (
                <p className="py-6 text-center text-sm text-gray-500">No scaled apps yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeEntry && (
        <SegmentNoteModal entry={activeEntry} onClose={() => setActiveEntry(null)} onSaved={load} />
      )}

      {creating && (
        <Modal title="New Scaled App" onClose={() => setCreating(false)}>
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
