import { OwnerType, Platform, Stage, StatusCoarse, TaskQuadrant, TaskStatus } from "@/generated/prisma/enums";

export interface StageHistoryEntryDto {
  id: string;
  appId: string;
  stage: Stage;
  enteredAt: string;
  exitedAt: string | null;
  note: string | null;
}

export interface AppDto {
  id: string;
  name: string;
  ownerType: OwnerType;
  publisherName: string | null;
  inchargedBy: string;
  platform: Platform;
  storeUrlIos: string | null;
  storeUrlAndroid: string | null;
  releaseDay: string | null;
  statusCoarse: StatusCoarse;
  currentStage: Stage;
  stageEnteredAt: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  stageHistory: StageHistoryEntryDto[];
}

export interface TaskDto {
  id: string;
  description: string;
  priorityInLifecycle: number;
  priorityInApp: number;
  status: TaskStatus;
  quadrant: TaskQuadrant | null;
  isDefault: boolean;
  referenceToLifecycleId: string | null;
}

export interface TaskWithAppDto extends TaskDto {
  appId: string | null;
  appName: string | null;
  currentEntryId: string | null;
}
