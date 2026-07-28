"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { AppForm, AppFormValues } from "@/components/apps/AppForm";
import { AppDto } from "@/lib/types";
import { OWNER_TYPE_LABELS, PLATFORM_LABELS, STAGE_LABELS } from "@/lib/lifecycle";
import { formatDate } from "@/lib/format";

function toFormValues(app: AppDto): AppFormValues {
  return {
    name: app.name,
    ownerType: app.ownerType,
    publisherName: app.publisherName ?? "",
    inchargedBy: app.inchargedBy,
    platform: app.platform,
    storeUrlIos: app.storeUrlIos ?? "",
    storeUrlAndroid: app.storeUrlAndroid ?? "",
    releaseDay: app.releaseDay ? app.releaseDay.slice(0, 10) : "",
    createdAt: app.createdAt.slice(0, 10),
    note: app.note ?? "",
  };
}

export function AppDetailModal({
  app,
  onClose,
  onUpdated,
  onDeleted,
}: {
  app: AppDto;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (values: AppFormValues) => {
    const res = await fetch(`/api/apps/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        publisherName: values.ownerType === "publisher" ? values.publisherName : null,
        releaseDay: values.releaseDay || null,
      }),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? "Failed to update app");
    setEditing(false);
    onUpdated();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${app.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/apps/${app.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) onDeleted();
  };

  return (
    <Modal title={editing ? `Edit ${app.name}` : app.name} onClose={onClose} wide>
      {editing ? (
        <AppForm
          initialValues={toFormValues(app)}
          submitLabel="Save changes"
          onSubmit={handleSave}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="Status">
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                  app.statusCoarse === "scaled"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {app.statusCoarse === "scaled" ? "Scaled" : "New App"}
              </span>
            </Field>
            <Field label="Life-cycle stage">
              <span className="text-gray-500 italic">{STAGE_LABELS[app.currentStage]}</span>
              <span className="ml-1 text-xs text-gray-400">
                (change on Research &amp; Setup screen)
              </span>
            </Field>
            <Field label="Owner">
              {OWNER_TYPE_LABELS[app.ownerType]}
              {app.publisherName ? ` — ${app.publisherName}` : ""}
            </Field>
            <Field label="Incharged by">{app.inchargedBy}</Field>
            <Field label="Platform">{PLATFORM_LABELS[app.platform]}</Field>
            <Field label="Release day">{formatDate(app.releaseDay)}</Field>
            <Field label="Store link (iOS)">{app.storeUrlIos || "—"}</Field>
            <Field label="Store link (Android)">{app.storeUrlAndroid || "—"}</Field>
            <Field label="Created">{formatDate(app.createdAt)}</Field>
          </div>

          <div>
            <p className="text-sm font-medium mb-1">Note</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.note || "—"}</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Stage history</p>
            <ul className="space-y-1 text-sm">
              {app.stageHistory.map((entry) => (
                <li key={entry.id} className="flex justify-between border-b border-gray-100 py-1">
                  <span>{STAGE_LABELS[entry.stage]}</span>
                  <span className="text-gray-500">
                    {formatDate(entry.enteredAt)} → {entry.exitedAt ? formatDate(entry.exitedAt) : "present"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <div>{children}</div>
    </div>
  );
}
