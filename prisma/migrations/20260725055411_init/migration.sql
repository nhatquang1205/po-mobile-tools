-- CreateTable
CREATE TABLE "App" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "publisherName" TEXT,
    "inchargedBy" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "storeUrlIos" TEXT,
    "storeUrlAndroid" TEXT,
    "releaseDay" DATETIME,
    "statusCoarse" TEXT NOT NULL DEFAULT 'new_app',
    "currentStage" TEXT NOT NULL,
    "stageEnteredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StageHistoryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "enteredAt" DATETIME NOT NULL,
    "exitedAt" DATETIME,
    "note" TEXT,
    CONSTRAINT "StageHistoryEntry_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "StageHistoryEntry_appId_idx" ON "StageHistoryEntry"("appId");
