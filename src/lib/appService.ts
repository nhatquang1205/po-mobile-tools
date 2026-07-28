import { prisma } from "@/lib/prisma";
import {
  AUTO_TRANSITION,
  STAGE_DEFAULT_TASKS,
  computeAutoAdvanceTarget,
  isScaledStage,
  nextStageOptions,
  startingStage,
} from "@/lib/lifecycle";
import { OwnerType, Platform, Stage, TaskQuadrant, TaskStatus } from "@/generated/prisma/enums";

const withHistory = { stageHistory: { orderBy: { enteredAt: "asc" as const } } };

// Creates the default checklist task(s) for a newly-entered stage, if any are
// defined for it. `priorityInApp` continues the sequence of that app's other
// still-todo tasks so new default tasks land at the end of the Tasks page list.
async function createDefaultTasksForEntry(
  entryId: string,
  appId: string,
  stage: Stage,
  appName: string,
) {
  const templates = STAGE_DEFAULT_TASKS[stage]?.(appName) ?? [];
  if (templates.length === 0) return;

  const maxInApp = await prisma.task.aggregate({
    where: { status: "todo", lifecycle: { appId } },
    _max: { priorityInApp: true },
  });
  let nextAppPriority = (maxInApp._max.priorityInApp ?? -1) + 1;

  await prisma.task.createMany({
    data: templates.map((description, i) => ({
      description,
      priorityInLifecycle: i,
      priorityInApp: nextAppPriority++,
      isDefault: true,
      referenceToLifecycleId: entryId,
    })),
  });
}

// Auto-closes whatever default (system-created) tasks are still todo on the
// stage being left. Manually-added tasks are never touched here.
async function closeDefaultTasksForEntry(entryId: string) {
  await prisma.task.updateMany({
    where: { referenceToLifecycleId: entryId, isDefault: true, status: "todo" },
    data: { status: "done" },
  });
}

async function applyAutoTransitionIfNeeded<
  T extends { id: string; name: string; currentStage: Stage; stageEnteredAt: Date },
>(app: T): Promise<T> {
  const target = computeAutoAdvanceTarget(app.currentStage, app.stageEnteredAt);
  if (!target) return app;

  const openEntry = await prisma.stageHistoryEntry.findFirst({
    where: { appId: app.id, exitedAt: null },
  });

  const now = new Date();
  await prisma.$transaction([
    prisma.stageHistoryEntry.updateMany({
      where: { appId: app.id, exitedAt: null },
      data: { exitedAt: now },
    }),
    prisma.stageHistoryEntry.create({
      data: { appId: app.id, stage: target, enteredAt: now },
    }),
    prisma.app.update({
      where: { id: app.id },
      data: { currentStage: target, stageEnteredAt: now },
    }),
  ]);

  if (openEntry) await closeDefaultTasksForEntry(openEntry.id);
  const newEntry = await prisma.stageHistoryEntry.findFirst({
    where: { appId: app.id, stage: target, exitedAt: null },
    orderBy: { enteredAt: "desc" },
  });
  if (newEntry) await createDefaultTasksForEntry(newEntry.id, app.id, target, app.name);

  return { ...app, currentStage: target, stageEnteredAt: now };
}

export interface AppFilters {
  name?: string;
  ownerType?: OwnerType;
  currentStage?: Stage;
  statusCoarse?: "new_app" | "scaled";
}

export async function listApps(filters: AppFilters = {}) {
  const apps = await prisma.app.findMany({
    where: {
      ...(filters.name ? { name: { contains: filters.name } } : {}),
      ...(filters.ownerType ? { ownerType: filters.ownerType } : {}),
      ...(filters.currentStage ? { currentStage: filters.currentStage } : {}),
      ...(filters.statusCoarse ? { statusCoarse: filters.statusCoarse } : {}),
    },
    include: withHistory,
    orderBy: { createdAt: "asc" },
  });

  return Promise.all(apps.map(applyAutoTransitionIfNeeded));
}

export async function getApp(id: string) {
  const app = await prisma.app.findUnique({ where: { id }, include: withHistory });
  if (!app) return null;
  return applyAutoTransitionIfNeeded(app);
}

export interface CreateAppInput {
  name: string;
  ownerType: OwnerType;
  publisherName?: string | null;
  inchargedBy: string;
  platform: Platform;
  storeUrlIos?: string | null;
  storeUrlAndroid?: string | null;
  releaseDay?: Date | null;
  createdAt?: Date | null;
  note?: string | null;
}

export async function createApp(input: CreateAppInput) {
  // Allows backdating historical apps: the initial stage entry starts on the same date.
  const now = input.createdAt ?? new Date();
  const stage = startingStage(input.ownerType);

  const app = await prisma.app.create({
    data: {
      name: input.name,
      ownerType: input.ownerType,
      publisherName: input.ownerType === "publisher" ? input.publisherName : null,
      inchargedBy: input.inchargedBy,
      platform: input.platform,
      storeUrlIos: input.storeUrlIos,
      storeUrlAndroid: input.storeUrlAndroid,
      releaseDay: input.releaseDay,
      note: input.note,
      currentStage: stage,
      stageEnteredAt: now,
      createdAt: now,
      statusCoarse: "new_app",
      stageHistory: { create: { stage, enteredAt: now } },
    },
    include: withHistory,
  });

  await createDefaultTasksForEntry(app.stageHistory[0].id, app.id, stage, app.name);

  return app;
}

export interface UpdateAppInput {
  name?: string;
  ownerType?: OwnerType;
  publisherName?: string | null;
  inchargedBy?: string;
  platform?: Platform;
  storeUrlIos?: string | null;
  storeUrlAndroid?: string | null;
  releaseDay?: Date | null;
  createdAt?: Date;
  note?: string | null;
}

// Intentionally excludes currentStage/statusCoarse: those only change via advanceApp
// or the automatic 2-day rule, per the App Management screen's read-only requirement.
export async function updateApp(id: string, input: UpdateAppInput) {
  if (input.createdAt) {
    // Keep the first stage history entry (Research App / On Store) in sync with
    // the app's creation date so backdated apps show a correct timeline.
    const firstEntry = await prisma.stageHistoryEntry.findFirst({
      where: { appId: id },
      orderBy: { enteredAt: "asc" },
    });
    if (firstEntry) {
      await prisma.stageHistoryEntry.update({
        where: { id: firstEntry.id },
        data: { enteredAt: input.createdAt },
      });
    }
  }

  return prisma.app.update({ where: { id }, data: input, include: withHistory });
}

export async function deleteApp(id: string) {
  await prisma.app.delete({ where: { id } });
}

export class InvalidStageTransitionError extends Error {}

// Advances the app's stage. Reaching `scaled_app` (idle) flips statusCoarse to
// "scaled"; the scaled update cycle loops back through it repeatedly, so this
// is a normal transition now, not a special terminal case.
// `transitionDate` lets the PO backdate a historical transition instead of using today.
export async function advanceApp(id: string, nextStage?: Stage, transitionDate?: Date) {
  const app = await prisma.app.findUnique({ where: { id } });
  if (!app) return null;

  const now = transitionDate ?? new Date();
  const openEntry = await prisma.stageHistoryEntry.findFirst({
    where: { appId: id, exitedAt: null },
  });

  const options = nextStageOptions(app.currentStage);
  if (!nextStage || !options.includes(nextStage)) {
    throw new InvalidStageTransitionError(
      `"${nextStage}" is not a valid next stage from "${app.currentStage}". Valid options: ${options.join(", ")}`,
    );
  }

  await prisma.$transaction([
    prisma.stageHistoryEntry.updateMany({
      where: { appId: id, exitedAt: null },
      data: { exitedAt: now },
    }),
    prisma.stageHistoryEntry.create({
      data: { appId: id, stage: nextStage, enteredAt: now },
    }),
    prisma.app.update({
      where: { id },
      data: {
        currentStage: nextStage,
        stageEnteredAt: now,
        statusCoarse: isScaledStage(nextStage) ? "scaled" : "new_app",
      },
    }),
  ]);

  // Every advance always does both: close the old stage's default tasks, then
  // create the new stage's default tasks.
  if (openEntry) await closeDefaultTasksForEntry(openEntry.id);
  const newEntry = await prisma.stageHistoryEntry.findFirst({
    where: { appId: id, stage: nextStage, exitedAt: null },
    orderBy: { enteredAt: "desc" },
  });
  if (newEntry) await createDefaultTasksForEntry(newEntry.id, id, nextStage, app.name);

  return prisma.app.findUnique({ where: { id }, include: withHistory });
}

export interface UpdateStageHistoryEntryInput {
  note?: string;
  enteredAt?: Date;
  exitedAt?: Date | null;
}

export async function updateStageHistoryEntry(entryId: string, input: UpdateStageHistoryEntryInput) {
  const entry = await prisma.stageHistoryEntry.findUnique({
    where: { id: entryId },
    include: { app: true },
  });
  if (!entry) return null;

  // Find this entry's immediate neighbors in the app's chronological chain
  // *before* applying the edit, so a backdated start/end date doesn't leave
  // the adjacent entry's boundary stuck at its old value (a gap/overlap bug).
  const siblings = await prisma.stageHistoryEntry.findMany({
    where: { appId: entry.appId },
    orderBy: { enteredAt: "asc" },
  });
  const idx = siblings.findIndex((s) => s.id === entryId);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const updates = [prisma.stageHistoryEntry.update({ where: { id: entryId }, data: input })];
  if (input.enteredAt && prev) {
    updates.push(
      prisma.stageHistoryEntry.update({ where: { id: prev.id }, data: { exitedAt: input.enteredAt } }),
    );
  }
  if (input.exitedAt && next) {
    updates.push(
      prisma.stageHistoryEntry.update({ where: { id: next.id }, data: { enteredAt: input.exitedAt } }),
    );
  }
  const [updated] = await prisma.$transaction(updates);

  if (input.enteredAt) {
    // Keep the app's own denormalized dates in sync with the entry that represents
    // the app's creation (its starting stage) and/or its current open stage.
    const appUpdates: { createdAt?: Date; stageEnteredAt?: Date } = {};
    if (entry.stage === startingStage(entry.app.ownerType)) {
      appUpdates.createdAt = input.enteredAt;
    }
    if (entry.exitedAt === null) {
      appUpdates.stageEnteredAt = input.enteredAt;
    }
    if (Object.keys(appUpdates).length > 0) {
      await prisma.app.update({ where: { id: entry.appId }, data: appUpdates });
    }
  }

  return updated;
}

export async function listTasksForEntry(entryId: string) {
  return prisma.task.findMany({
    where: { referenceToLifecycleId: entryId },
    orderBy: { priorityInLifecycle: "asc" },
  });
}

// Flat list of tasks across all apps, ordered by priorityInApp. Shows every
// still-todo task, plus done tasks completed *today* only — a task done on an
// earlier day drops off the Eisenhower matrix entirely. Each task carries its
// app's name and current (open) entry id inline — this page isn't grouped by app.
export async function listAllTasks() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const tasks = await prisma.task.findMany({
    where: {
      OR: [{ status: "todo" }, { status: "done", completedAt: { gte: startOfToday } }],
    },
    include: {
      lifecycle: {
        include: { app: { include: { stageHistory: { where: { exitedAt: null } } } } },
      },
    },
    orderBy: { priorityInApp: "asc" },
  });

  return tasks.map((task) => ({
    ...task,
    appId: task.lifecycle?.app.id ?? null,
    appName: task.lifecycle?.app.name ?? null,
    currentEntryId: task.lifecycle?.app.stageHistory[0]?.id ?? null,
  }));
}

// Standalone task, not tied to any app/lifecycle — sits in the Tasks page
// inbox with no app tag.
export async function createStandaloneTask(description: string) {
  const maxInApp = await prisma.task.aggregate({
    where: { status: "todo" },
    _max: { priorityInApp: true },
  });

  return prisma.task.create({
    data: {
      description,
      isDefault: false,
      priorityInLifecycle: 0,
      priorityInApp: (maxInApp._max.priorityInApp ?? -1) + 1,
    },
  });
}

export async function createTask(entryId: string, description: string) {
  const entry = await prisma.stageHistoryEntry.findUnique({ where: { id: entryId } });
  if (!entry) return null;

  const [maxInLifecycle, maxInApp] = await Promise.all([
    prisma.task.aggregate({
      where: { referenceToLifecycleId: entryId },
      _max: { priorityInLifecycle: true },
    }),
    prisma.task.aggregate({
      where: { status: "todo" },
      _max: { priorityInApp: true },
    }),
  ]);

  return prisma.task.create({
    data: {
      description,
      referenceToLifecycleId: entryId,
      isDefault: false,
      priorityInLifecycle: (maxInLifecycle._max.priorityInLifecycle ?? -1) + 1,
      priorityInApp: (maxInApp._max.priorityInApp ?? -1) + 1,
    },
  });
}

export async function updateTask(
  id: string,
  input: { status?: TaskStatus; description?: string; quadrant?: TaskQuadrant | null },
) {
  const data: {
    status?: TaskStatus;
    description?: string;
    quadrant?: TaskQuadrant | null;
    completedAt?: Date | null;
  } = { ...input };

  if (input.status === "done") data.completedAt = new Date();
  else if (input.status === "todo") data.completedAt = null;

  return prisma.task.update({ where: { id }, data });
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
}

// Detail-page (per-lifecycle) swap: swaps both ordering columns, so the Tasks
// page reflects the reorder too. One-way only — see swapPriorityInApp below.
export async function swapPriorityInLifecycle(taskId: string, otherTaskId: string) {
  const [a, b] = await Promise.all([
    prisma.task.findUnique({ where: { id: taskId } }),
    prisma.task.findUnique({ where: { id: otherTaskId } }),
  ]);
  if (!a || !b) return;

  await prisma.$transaction([
    prisma.task.update({
      where: { id: a.id },
      data: { priorityInLifecycle: b.priorityInLifecycle, priorityInApp: b.priorityInApp },
    }),
    prisma.task.update({
      where: { id: b.id },
      data: { priorityInLifecycle: a.priorityInLifecycle, priorityInApp: a.priorityInApp },
    }),
  ]);
}

// Tasks-page swap: only touches priorityInApp, never propagates back to
// priorityInLifecycle.
export async function swapPriorityInApp(taskId: string, otherTaskId: string) {
  const [a, b] = await Promise.all([
    prisma.task.findUnique({ where: { id: taskId } }),
    prisma.task.findUnique({ where: { id: otherTaskId } }),
  ]);
  if (!a || !b) return;

  await prisma.$transaction([
    prisma.task.update({ where: { id: a.id }, data: { priorityInApp: b.priorityInApp } }),
    prisma.task.update({ where: { id: b.id }, data: { priorityInApp: a.priorityInApp } }),
  ]);
}

export { AUTO_TRANSITION };
