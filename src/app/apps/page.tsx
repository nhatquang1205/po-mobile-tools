"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { AppForm, AppFormValues, EMPTY_APP_FORM } from "@/components/apps/AppForm";
import { AppDetailModal } from "@/components/apps/AppDetailModal";
import { AppDto } from "@/lib/types";
import { OWNER_TYPE_LABELS, PLATFORM_LABELS, STAGE_LABELS } from "@/lib/lifecycle";
import { daysBetween, formatDate } from "@/lib/format";

export default function AppManagementPage() {
  const [apps, setApps] = useState<AppDto[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/apps");
    setApps(await res.json());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, not derived state
    load();
  }, []);

  const selectedApp = apps?.find((a) => a.id === selectedId) ?? null;

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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">App Management</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
        >
          + New App
        </button>
      </div>

      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2">App name</th>
              <th className="px-4 py-2">Store</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Owner</th>
              <th className="px-4 py-2">Incharged by</th>
              <th className="px-4 py-2">Life-cycle stage</th>
              <th className="px-4 py-2">Days in stage</th>
              <th className="px-4 py-2">Release day</th>
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {apps?.map((app) => (
              <tr
                key={app.id}
                onClick={() => setSelectedId(app.id)}
                className="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
              >
                <td className="px-4 py-2 font-medium">{app.name}</td>
                <td className="px-4 py-2">{PLATFORM_LABELS[app.platform]}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      app.statusCoarse === "scaled"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {app.statusCoarse === "scaled" ? "Scaled" : "New App"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {OWNER_TYPE_LABELS[app.ownerType]}
                  {app.publisherName ? ` — ${app.publisherName}` : ""}
                </td>
                <td className="px-4 py-2">{app.inchargedBy}</td>
                <td className="px-4 py-2">{STAGE_LABELS[app.currentStage]}</td>
                <td className="px-4 py-2">{daysBetween(app.stageEnteredAt)}</td>
                <td className="px-4 py-2">{formatDate(app.releaseDay)}</td>
                <td className="px-4 py-2">{formatDate(app.createdAt)}</td>
                <td className="px-4 py-2 max-w-[200px] truncate">{app.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {apps?.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">No apps yet. Create one to get started.</p>
        )}
      </div>

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

      {selectedApp && (
        <AppDetailModal
          app={selectedApp}
          onClose={() => setSelectedId(null)}
          onUpdated={() => {
            load();
          }}
          onDeleted={() => {
            setSelectedId(null);
            load();
          }}
        />
      )}
    </div>
  );
}
