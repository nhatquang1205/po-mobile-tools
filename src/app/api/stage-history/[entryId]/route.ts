import { NextRequest, NextResponse } from "next/server";
import { updateStageHistoryEntry } from "@/lib/appService";

type Params = { params: Promise<{ entryId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { entryId } = await params;
  const body = await request.json();

  const entry = await updateStageHistoryEntry(entryId, {
    note: body.note,
    enteredAt: body.enteredAt ? new Date(body.enteredAt) : undefined,
    exitedAt: body.exitedAt === null ? null : body.exitedAt ? new Date(body.exitedAt) : undefined,
  });

  if (!entry) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(entry);
}
