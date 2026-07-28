-- AlterTable
ALTER TABLE "Task" ADD COLUMN "completedAt" DATETIME;
ALTER TABLE "Task" ADD COLUMN "quadrant" TEXT;

-- Data backfill: "in_progress" was a short-lived status value, fold any
-- leftover rows back into "todo" now that the enum is 2-state again.
UPDATE "Task" SET "status" = 'todo' WHERE "status" = 'in_progress';

-- Approximate completedAt for tasks that were already done before this
-- column existed, so they don't immediately vanish from the "done today" view.
UPDATE "Task" SET "completedAt" = "updatedAt" WHERE "status" = 'done' AND "completedAt" IS NULL;
