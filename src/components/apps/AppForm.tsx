"use client";

import { useState } from "react";
import { OwnerType, Platform } from "@/generated/prisma/enums";
import { OWNER_TYPE_LABELS, PLATFORM_LABELS } from "@/lib/lifecycle";

export interface AppFormValues {
  name: string;
  ownerType: OwnerType;
  publisherName: string;
  inchargedBy: string;
  platform: Platform;
  storeUrlIos: string;
  storeUrlAndroid: string;
  releaseDay: string;
  createdAt: string;
  note: string;
}

export const EMPTY_APP_FORM: AppFormValues = {
  name: "",
  ownerType: "inhouse",
  publisherName: "",
  inchargedBy: "",
  platform: "both",
  storeUrlIos: "",
  storeUrlAndroid: "",
  releaseDay: "",
  createdAt: "",
  note: "",
};

export function AppForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValues: AppFormValues;
  submitLabel: string;
  onSubmit: (values: AppFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof AppFormValues>(key: K, value: AppFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">App name</label>
        <input
          required
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Owner</label>
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={values.ownerType}
            onChange={(e) => set("ownerType", e.target.value as OwnerType)}
          >
            {Object.entries(OWNER_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Platform</label>
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={values.platform}
            onChange={(e) => set("platform", e.target.value as Platform)}
          >
            {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {values.ownerType === "publisher" && (
        <div>
          <label className="block text-sm font-medium mb-1">Publisher name</label>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={values.publisherName}
            onChange={(e) => set("publisherName", e.target.value)}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Incharged by</label>
          <input
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={values.inchargedBy}
            onChange={(e) => set("inchargedBy", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Release day</label>
          <input
            type="date"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={values.releaseDay}
            onChange={(e) => set("releaseDay", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Created date <span className="font-normal text-gray-400">(for entering historical apps — defaults to today)</span>
        </label>
        <input
          type="date"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          value={values.createdAt}
          onChange={(e) => set("createdAt", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Store link (iOS)</label>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={values.storeUrlIos}
            onChange={(e) => set("storeUrlIos", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Store link (Android)</label>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={values.storeUrlAndroid}
            onChange={(e) => set("storeUrlAndroid", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Note</label>
        <textarea
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          rows={3}
          value={values.note}
          onChange={(e) => set("note", e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
