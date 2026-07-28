import { NextRequest, NextResponse } from "next/server";
import { createTask, listTasksForEntry } from "@/lib/appService";

type Params = { params: Promise<{ entryId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { entryId } = await params;
  const tasks = await listTasksForEntry(entryId);
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { entryId } = await params;
  const body = await request.json();

  if (!body.description) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  const task = await createTask(entryId, body.description);
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(task, { status: 201 });
}
