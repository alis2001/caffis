/*
  Warnings:

  - A unique constraint covering the columns `[mapInviteId]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[mapServiceUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "isMapMeetup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mapInviteId" TEXT,
ADD COLUMN     "suggestedPlaces" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isLocationSharingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActiveLocation" JSONB,
ADD COLUMN     "mapServiceUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invite_mapInviteId_key" ON "Invite"("mapInviteId");

-- CreateIndex
CREATE INDEX "Invite_isMapMeetup_idx" ON "Invite"("isMapMeetup");

-- CreateIndex
CREATE INDEX "Invite_mapInviteId_idx" ON "Invite"("mapInviteId");

-- CreateIndex
CREATE UNIQUE INDEX "User_mapServiceUserId_key" ON "User"("mapServiceUserId");

-- CreateIndex
CREATE INDEX "User_isLocationSharingEnabled_idx" ON "User"("isLocationSharingEnabled");

-- CreateIndex
CREATE INDEX "User_mapServiceUserId_idx" ON "User"("mapServiceUserId");
