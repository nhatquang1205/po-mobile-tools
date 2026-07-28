-- Merge the "admob_approval" stage into "on_store" (data backfill only —
-- SQLite stores the Stage enum as plain TEXT with no CHECK constraint, so no
-- column/type change is needed here).
UPDATE "App" SET "currentStage" = 'on_store' WHERE "currentStage" = 'admob_approval';
UPDATE "StageHistoryEntry" SET "stage" = 'on_store' WHERE "stage" = 'admob_approval';
