"use client";

import { TIMELINE_DAY_WIDTH, TIMELINE_STICKY_OFFSET, TIMELINE_TODAY_WIDTH } from "@/lib/lifecycle";
import { formatShortDayMonth } from "@/lib/format";

export function TimelineHeader({ days, today }: { days: Date[]; today: Date }) {
  return (
    <div className="flex items-center border-b border-gray-200 text-xs font-medium uppercase tracking-wide text-gray-400">
      <div className="sticky left-0 z-10 w-40 shrink-0 bg-white py-2">App</div>

      <div className="flex shrink-0 border-l border-gray-100">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            style={{ width: TIMELINE_DAY_WIDTH }}
            className="shrink-0 border-r border-gray-100 py-2 text-center normal-case"
          >
            {formatShortDayMonth(day)}
          </div>
        ))}
      </div>

      {/* Sticky "today" column, pinned right next to the Action column so it's
          always visible regardless of horizontal scroll position. */}
      <div
        className="sticky z-10 shrink-0 border-l border-gray-200 bg-white py-2 text-center"
        style={{ right: TIMELINE_STICKY_OFFSET, width: TIMELINE_TODAY_WIDTH }}
      >
        {formatShortDayMonth(today)}
      </div>

      <div className="sticky right-0 w-24 shrink-0 bg-white py-2 pl-2">Action</div>
    </div>
  );
}
