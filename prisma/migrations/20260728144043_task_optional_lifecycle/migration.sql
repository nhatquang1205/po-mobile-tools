-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "priorityInLifecycle" INTEGER NOT NULL,
    "priorityInApp" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "quadrant" TEXT,
    "completedAt" DATETIME,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "referenceToLifecycleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_referenceToLifecycleId_fkey" FOREIGN KEY ("referenceToLifecycleId") REFERENCES "StageHistoryEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("completedAt", "createdAt", "description", "id", "isDefault", "priorityInApp", "priorityInLifecycle", "quadrant", "referenceToLifecycleId", "status", "updatedAt") SELECT "completedAt", "createdAt", "description", "id", "isDefault", "priorityInApp", "priorityInLifecycle", "quadrant", "referenceToLifecycleId", "status", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_referenceToLifecycleId_idx" ON "Task"("referenceToLifecycleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
