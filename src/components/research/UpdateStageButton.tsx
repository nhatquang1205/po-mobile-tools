"use client";

import { useState } from "react";
import { Stage } from "@/generated/prisma/enums";
import { TIMELINE_BAR_HEIGHT } from "@/lib/lifecycle";
import { UpdateStageModal } from "@/components/research/UpdateStageModal";

export function UpdateStageButton({
  appId,
  currentStage,
  onUpdated,
}: {
  appId: string;
  currentStage: Stage;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ height: TIMELINE_BAR_HEIGHT }}
        className="rounded bg-gray-900 px-3 text-xs font-semibold text-white hover:bg-gray-700"
      >
        Update
      </button>

      {/* Mounted fresh each time it opens, so its stage/date selection never
          goes stale after a previous update changes currentStage. */}
      {open && (
        <UpdateStageModal
          appId={appId}
          currentStage={currentStage}
          onClose={() => setOpen(false)}
          onUpdated={() => {
            setOpen(false);
            onUpdated();
          }}
        />
      )}
    </>
  );
}
