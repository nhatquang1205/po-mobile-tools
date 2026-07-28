-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "priorityInLifecycle" INTEGER NOT NULL,
    "priorityInApp" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "referenceToLifecycleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_referenceToLifecycleId_fkey" FOREIGN KEY ("referenceToLifecycleId") REFERENCES "StageHistoryEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Task_referenceToLifecycleId_idx" ON "Task"("referenceToLifecycleId");
