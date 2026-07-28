import { NextRequest, NextResponse } from "next/server";
import { advanceApp, InvalidStageTransitionError } from "@/lib/appService";
import { Stage } from "@/generated/prisma/enums";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const nextStage = body.nextStage as Stage | undefined;
  const transitionDate = body.transitionDate ? new Date(body.transitionDate) : undefined;

  try {
    const app = await advanceApp(id, nextStage, transitionDate);
    if (!app) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(app);
  } catch (error) {
    if (error instanceof InvalidStageTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
