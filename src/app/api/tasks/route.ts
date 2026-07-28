import { NextRequest, NextResponse } from "next/server";
import { createStandaloneTask, listAllTasks } from "@/lib/appService";

export async function GET() {
  const tasks = await listAllTasks();
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.description) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  const task = await createStandaloneTask(body.description);
  return NextResponse.json(task, { status: 201 });
}
