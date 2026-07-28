// Seeds the local SQLite database from prisma/seed-data.json (a snapshot taken
// via `npx tsx scripts/dump-data.ts`). Run on a fresh checkout after
// `npx prisma migrate dev` with:
//
//   npx tsx prisma/seed.ts
//
// Safe to re-run — it clears App/StageHistoryEntry/Task first (in FK-safe
// order) before re-inserting the snapshot.
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

interface SeedData {
  apps: Record<string, unknown>[];
  stageHistoryEntries: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
}

// Date fields come back as ISO strings from JSON — Prisma needs real Date objects.
const DATE_FIELDS = [
  "releaseDay",
  "stageEnteredAt",
  "createdAt",
  "updatedAt",
  "enteredAt",
  "exitedAt",
  "completedAt",
];

function reviveDates(row: Record<string, unknown>): Record<string, unknown> {
  const revived: Record<string, unknown> = { ...row };
  for (const field of DATE_FIELDS) {
    const value = revived[field];
    if (typeof value === "string") {
      revived[field] = new Date(value);
    }
  }
  return revived;
}

async function main() {
  const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
  const prisma = new PrismaClient({ adapter });

  const dataPath = path.join(__dirname, "seed-data.json");
  const data: SeedData = JSON.parse(readFileSync(dataPath, "utf-8"));

  // Clear existing data first, in FK-safe order (children before parents).
  await prisma.task.deleteMany();
  await prisma.stageHistoryEntry.deleteMany();
  await prisma.app.deleteMany();

  for (const app of data.apps) {
    await prisma.app.create({ data: reviveDates(app) as never });
  }
  for (const entry of data.stageHistoryEntries) {
    await prisma.stageHistoryEntry.create({ data: reviveDates(entry) as never });
  }
  for (const task of data.tasks) {
    await prisma.task.create({ data: reviveDates(task) as never });
  }

  console.log(
    `Seeded ${data.apps.length} app(s), ${data.stageHistoryEntries.length} stage history entr${data.stageHistoryEntries.length === 1 ? "y" : "ies"}, ${data.tasks.length} task(s).`,
  );
}

main();
