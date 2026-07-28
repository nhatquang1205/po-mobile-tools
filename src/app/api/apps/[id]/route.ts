import { NextRequest, NextResponse } from "next/server";
import { deleteApp, getApp, updateApp } from "@/lib/appService";
import { OwnerType, Platform } from "@/generated/prisma/enums";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const app = await getApp(id);
  if (!app) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(app);
}

// Only general fields are editable here. currentStage/statusCoarse are intentionally
// not accepted — those only change via the /advance endpoint or the automatic 2-day rule.
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  if (body.ownerType && !Object.values(OwnerType).includes(body.ownerType)) {
    return NextResponse.json({ error: "invalid ownerType" }, { status: 400 });
  }
  if (body.platform && !Object.values(Platform).includes(body.platform)) {
    return NextResponse.json({ error: "invalid platform" }, { status: 400 });
  }

  const app = await updateApp(id, {
    name: body.name,
    ownerType: body.ownerType,
    publisherName: body.publisherName,
    inchargedBy: body.inchargedBy,
    platform: body.platform,
    storeUrlIos: body.storeUrlIos,
    storeUrlAndroid: body.storeUrlAndroid,
    releaseDay: body.releaseDay ? new Date(body.releaseDay) : body.releaseDay,
    createdAt: body.createdAt ? new Date(body.createdAt) : undefined,
    note: body.note,
  });

  return NextResponse.json(app);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await deleteApp(id);
  return new NextResponse(null, { status: 204 });
}
