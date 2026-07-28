"use client";

import { AppDto, StageHistoryEntryDto } from "@/lib/types";
import {
  STAGE_COLORS,
  STAGE_LABELS,
  TIMELINE_BAR_HEIGHT,
  TIMELINE_DAY_WIDTH,
  TIMELINE_STICKY_OFFSET,
  TIMELINE_TODAY_WIDTH,
  timelineTotalWidth,
} from "@/lib/lifecycle";
import {
  businessDayIndexAtOrAfter,
  businessDayIndexAtOrBefore,
  daysBetween,
  startOfDay,
} from "@/lib/format";
import { UpdateStageButton } from "@/components/research/UpdateStageButton";

export function TimelineRow({
  app,
  days,
  today,
  onSegmentClick,
  onAdvanced,
}: {
  app: AppDto;
  days: Date[];
  today: Date;
  onSegmentClick: (entry: StageHistoryEntryDto) => void;
  onAdvanced: () => void;
}) {
  const dayCount = days.length;
  const todayStart = startOfDay(today);
  const currentEntry = app.stageHistory[app.stageHistory.length - 1] as StageHistoryEntryDto | undefined;
  const halfDayWidth = TIMELINE_DAY_WIDTH / 2;

  // Consecutive stages that both fall on the same calendar day (e.g. entered and
  // exited the same day) would otherwise land on the exact same column and
  // overlap. `cursor` tracks the next free half-day slot so same-day stages
  // split that day's column in half instead of stacking on top of each other.
  let cursor = 0;

  return (
    <div className="flex items-center border-t border-gray-100">
      <div className="sticky left-0 z-10 w-40 shrink-0 bg-white py-3 pr-2">
        <p className="truncate text-sm font-medium">{app.name}</p>
      </div>

      <div
        className="relative shrink-0 border-l border-gray-100"
        style={{ width: timelineTotalWidth(dayCount), height: TIMELINE_BAR_HEIGHT }}
      >
        {dayCount > 0 &&
          app.stageHistory.map((entry) => {
            const enteredAt = new Date(entry.enteredAt);
            if (startOfDay(enteredAt).getTime() >= todayStart.getTime()) return null;

            const naturalStartHalf = businessDayIndexAtOrAfter(days, enteredAt) * 2;
            const startHalf = Math.max(naturalStartHalf, cursor);

            const exitedAt = entry.exitedAt ? new Date(entry.exitedAt) : null;
            let naturalEndHalf: number;
            if (!exitedAt || startOfDay(exitedAt).getTime() >= todayStart.getTime()) {
              naturalEndHalf = dayCount * 2;
            } else {
              const idx = businessDayIndexAtOrBefore(days, exitedAt);
              const exact = startOfDay(days[idx]).getTime() === startOfDay(exitedAt).getTime();
              naturalEndHalf = exact ? idx * 2 : (idx + 1) * 2;
            }
            const endHalf = Math.max(naturalEndHalf, startHalf + 1);
            cursor = endHalf;

            const segmentWidth = (endHalf - startHalf) * halfDayWidth;
            const stageDurationDays = daysBetween(entry.enteredAt, entry.exitedAt ?? today);

            return (
              <button
                key={entry.id}
                type="button"
                title={`${STAGE_LABELS[entry.stage]} — ${stageDurationDays} day${stageDurationDays === 1 ? "" : "s"}${entry.note ? ` · ${entry.note}` : ""}`}
                onClick={() => onSegmentClick(entry)}
                style={{
                  left: startHalf * halfDayWidth,
                  width: segmentWidth,
                  backgroundColor: STAGE_COLORS[entry.stage],
                }}
                className="absolute top-0 flex h-full flex-col justify-center overflow-hidden border-r border-white/60 py-1 pl-2 pr-2 hover:brightness-110"
              >
                <span className="block truncate text-right text-[11px] font-semibold leading-tight text-white drop-shadow-sm">
                  {STAGE_LABELS[entry.stage]}
                </span>
                {entry.note && (
                  <span className="block truncate text-right text-[10px] italic leading-tight text-white/90">
                    {entry.note}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {/* Sticky "today" column — always shows the current stage, pinned next to
          Action so it stays visible regardless of horizontal scroll position. */}
      {currentEntry && (
        <button
          type="button"
          onClick={() => onSegmentClick(currentEntry)}
          style={{
            right: TIMELINE_STICKY_OFFSET,
            width: TIMELINE_TODAY_WIDTH,
            height: TIMELINE_BAR_HEIGHT,
            backgroundColor: STAGE_COLORS[app.currentStage],
          }}
          className="sticky z-10 flex shrink-0 flex-col justify-center overflow-hidden border-l border-white/60 py-1 pl-2 pr-2 hover:brightness-110"
        >
          <span className="block truncate text-right text-[11px] font-semibold leading-tight text-white drop-shadow-sm">
            {STAGE_LABELS[app.currentStage]}
          </span>
          {currentEntry.note && (
            <span className="block truncate text-right text-[10px] italic leading-tight text-white/90">
              {currentEntry.note}
            </span>
          )}
        </button>
      )}

      <div className="sticky right-0 w-24 shrink-0 bg-white pl-2">
        <UpdateStageButton appId={app.id} currentStage={app.currentStage} onUpdated={onAdvanced} />
      </div>
    </div>
  );
}
