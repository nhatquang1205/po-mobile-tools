import { NextRequest, NextResponse } from "next/server";
import { createApp, listApps } from "@/lib/appService";
import { OwnerType, Platform, Stage, StatusCoarse } from "@/generated/prisma/enums";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const apps = await listApps({
    name: params.get("name") ?? undefined,
    ownerType: (params.get("ownerType") as OwnerType) ?? undefined,
    currentStage: (params.get("currentStage") as Stage) ?? undefined,
    statusCoarse: (params.get("statusCoarse") as StatusCoarse) ?? undefined,
  });
  return NextResponse.json(apps);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || !body.ownerType || !body.inchargedBy || !body.platform) {
    return NextResponse.json(
      { error: "name, ownerType, inchargedBy, and platform are required" },
      { status: 400 },
    );
  }
  if (!Object.values(OwnerType).includes(body.ownerType)) {
    return NextResponse.json({ error: "invalid ownerType" }, { status: 400 });
  }
  if (!Object.values(Platform).includes(body.platform)) {
    return NextResponse.json({ error: "invalid platform" }, { status: 400 });
  }

  const app = await createApp({
    name: body.name,
    ownerType: body.ownerType,
    publisherName: body.publisherName ?? null,
    inchargedBy: body.inchargedBy,
    platform: body.platform,
    storeUrlIos: body.storeUrlIos ?? null,
    storeUrlAndroid: body.storeUrlAndroid ?? null,
    releaseDay: body.releaseDay ? new Date(body.releaseDay) : null,
    createdAt: body.createdAt ? new Date(body.createdAt) : null,
    note: body.note ?? null,
    startInScaled: body.startInScaled === true,
  });

  return NextResponse.json(app, { status: 201 });
}
