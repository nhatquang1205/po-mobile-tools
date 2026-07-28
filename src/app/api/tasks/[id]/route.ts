import { NextRequest, NextResponse } from "next/server";
import { deleteTask, updateTask } from "@/lib/appService";
import { TaskQuadrant, TaskStatus } from "@/generated/prisma/enums";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  if (body.status && !Object.values(TaskStatus).includes(body.status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  if (body.quadrant && !Object.values(TaskQuadrant).includes(body.quadrant)) {
    return NextResponse.json({ error: "invalid quadrant" }, { status: 400 });
  }

  const task = await updateTask(id, {
    status: body.status,
    description: body.description,
    quadrant: body.quadrant === null ? null : body.quadrant,
  });
  return NextResponse.json(task);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await deleteTask(id);
  return new NextResponse(null, { status: 204 });
}
