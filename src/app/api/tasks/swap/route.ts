import { NextRequest, NextResponse } from "next/server";
import { swapPriorityInApp } from "@/lib/appService";

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.taskId || !body.otherTaskId) {
    return NextResponse.json({ error: "taskId and otherTaskId are required" }, { status: 400 });
  }

  await swapPriorityInApp(body.taskId, body.otherTaskId);
  return NextResponse.json({ ok: true });
}
