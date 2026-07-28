import { OwnerType, Platform, Stage } from "@/generated/prisma/enums";

export const OWNER_TYPE_LABELS: Record<OwnerType, string> = {
  inhouse: "Inhouse",
  publisher: "Publisher",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  ios: "iOS",
  android: "Android",
  both: "iOS & Android",
};

export const STAGE_ORDER: Stage[] = [
  "research_app",
  "wait_for_design",
  "wait_for_specs",
  "dev_start",
  "test_feedback",
  "on_store",
  "bu_testing_monet_bidding",
  "wait_for_check_metrics",
  "wait_for_load_2_id",
  "check_after_testing",
  "update",
  "set_waterfall_status",
];

export const STAGE_LABELS: Record<Stage, string> = {
  research_app: "Research App",
  wait_for_design: "Wait for Design",
  wait_for_specs: "Wait for Specs",
  dev_start: "Dev Start",
  test_feedback: "Test & Feedback",
  on_store: "On Store/Admob",
  bu_testing_monet_bidding: "BU Testing/Monet Bidding",
  wait_for_check_metrics: "Wait for Check Metrics",
  wait_for_load_2_id: "Wait for Load 2 ID",
  check_after_testing: "Check after Testing",
  update: "Update",
  set_waterfall_status: "Set Waterfall Status",
  scaled_app: "Scaled App",
  scaled_brief_update: "Brief Update",
  scaled_wait_for_design: "Wait for Design",
  scaled_wait_for_specs: "Wait for Specs",
  scaled_dev_start: "Dev Start",
  scaled_test_apk: "Test APK",
  scaled_check_version: "Check Version",
};

// Distinct color per stage for the Research & Setup timeline bar.
export const STAGE_COLORS: Record<Stage, string> = {
  research_app: "#60a5fa",
  wait_for_design: "#818cf8",
  wait_for_specs: "#a78bfa",
  dev_start: "#c084fc",
  test_feedback: "#e879f9",
  on_store: "#f472b6",
  bu_testing_monet_bidding: "#fb923c",
  wait_for_check_metrics: "#fbbf24",
  wait_for_load_2_id: "#a3e635",
  check_after_testing: "#4ade80",
  update: "#2dd4bf",
  set_waterfall_status: "#38bdf8",
  scaled_app: "#9ca3af",
  scaled_brief_update: "#22d3ee",
  scaled_wait_for_design: "#818cf8",
  scaled_wait_for_specs: "#a78bfa",
  scaled_dev_start: "#c084fc",
  scaled_test_apk: "#fb7185",
  scaled_check_version: "#34d399",
};

// The repeating post-scale update cycle: idle Scaled App, then 6 active
// stages, looping back to idle. Separate from STAGE_ORDER because it wraps
// around instead of terminating.
export const SCALED_CYCLE_ORDER: Stage[] = [
  "scaled_app",
  "scaled_brief_update",
  "scaled_wait_for_design",
  "scaled_wait_for_specs",
  "scaled_dev_start",
  "scaled_test_apk",
  "scaled_check_version",
];

export function isScaledStage(stage: Stage): boolean {
  return (SCALED_CYCLE_ORDER as Stage[]).includes(stage);
}

// Publisher apps skip Research/Design/Specs/Dev/Test & Feedback and start once already on store.
export function startingStage(ownerType: OwnerType): Stage {
  return ownerType === "publisher" ? "on_store" : "research_app";
}

// "Update" is optional/skippable: from Check after Testing the PO can go straight to
// Set Waterfall Status, or go through Update first. Set Waterfall Status enters the
// (repeating) scaled update cycle instead of terminating. Stages inside that cycle
// wrap around — Check Version loops back to idle Scaled App.
export function nextStageOptions(stage: Stage): Stage[] {
  if (stage === "check_after_testing") {
    return ["update", "set_waterfall_status"];
  }
  if (stage === "set_waterfall_status") {
    return ["scaled_app"];
  }

  const scaledIdx = SCALED_CYCLE_ORDER.indexOf(stage);
  if (scaledIdx !== -1) {
    return [SCALED_CYCLE_ORDER[(scaledIdx + 1) % SCALED_CYCLE_ORDER.length]];
  }

  const idx = STAGE_ORDER.indexOf(stage);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) {
    return [];
  }
  return [STAGE_ORDER[idx + 1]];
}

// Width/height in px of the Research & Setup timeline grid. "Today" is not part of
// this scrolling grid at all — it's rendered as a separate sticky column (see
// TIMELINE_TODAY_WIDTH / TIMELINE_STICKY_OFFSET) pinned next to the Action column.
export const TIMELINE_DAY_WIDTH = 56;
export const TIMELINE_TODAY_WIDTH = 112;
export const TIMELINE_BAR_HEIGHT = 40;
export const TIMELINE_ACTION_WIDTH = 96; // px, matches the Action column's w-24
export const TIMELINE_STICKY_OFFSET = TIMELINE_ACTION_WIDTH; // today column sticks right after Action's width

// Pixel offset of the start of column `dayIndex` (0-based) in the uniform-width
// historical grid. `dayIndex === dayCount` is valid — the position right after
// the last historical column.
export function timelineColumnOffset(dayIndex: number): number {
  return dayIndex * TIMELINE_DAY_WIDTH;
}

export function timelineTotalWidth(dayCount: number): number {
  return dayCount * TIMELINE_DAY_WIDTH;
}

// Default checklist task(s) auto-created whenever an app enters a given stage.
// A function-returning-array shape keeps the 3-task `update` case uniform with
// every other stage's single-task case — callers never special-case it.
// `on_store` intentionally has no default task (not in the product spec).
export const STAGE_DEFAULT_TASKS: Partial<Record<Stage, (appName: string) => string[]>> = {
  research_app: (n) => [`Research App ${n}`],
  wait_for_design: (n) => [`Request Design ${n}`],
  wait_for_specs: (n) => [`Write specs for ${n}`],
  dev_start: (n) => [`Notify Monet to create KeyAd for ${n}`],
  test_feedback: (n) => [`Check Apk of ${n}`],
  bu_testing_monet_bidding: (n) => [`Notify BU and Monet to test ${n}`],
  wait_for_check_metrics: (n) => [`Check crack ANR for ${n}`],
  wait_for_load_2_id: (n) => [`Notify Monet to load 2 ID for ${n}`],
  check_after_testing: (n) => [`Check after testing for ${n}`],
  update: (n) => [`Update idea for ${n}`, `Write specs for ${n}`, `Check Apk of ${n}`],
  set_waterfall_status: (n) => [`Notify Monet to set WTF for ${n}`],
  // scaled_app: intentionally no default task — idle wait state, same as on_store.
  scaled_brief_update: (n) => [`Brief update for ${n}`],
  scaled_wait_for_design: (n) => [`Request Design for ${n} update`],
  scaled_wait_for_specs: (n) => [`Write specs for ${n} update`],
  scaled_dev_start: (n) => [`Dev start for ${n} update`],
  scaled_test_apk: (n) => [`Test APK for ${n}`],
  scaled_check_version: (n) => [`Check version for ${n}`],
};

export const AUTO_TRANSITION = {
  from: "bu_testing_monet_bidding" as Stage,
  to: "wait_for_check_metrics" as Stage,
  afterMs: 2 * 24 * 60 * 60 * 1000,
};

export function computeAutoAdvanceTarget(
  currentStage: Stage,
  stageEnteredAt: Date,
  now: Date = new Date(),
): Stage | null {
  if (currentStage !== AUTO_TRANSITION.from) return null;
  if (now.getTime() - stageEnteredAt.getTime() < AUTO_TRANSITION.afterMs) return null;
  return AUTO_TRANSITION.to;
}
