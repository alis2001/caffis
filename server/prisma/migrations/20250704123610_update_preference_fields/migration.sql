/*
  Warnings:

  - You are about to drop the column `socialStyle` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "socialStyle",
ADD COLUMN     "ageRange" TEXT,
ADD COLUMN     "socialEnergy" TEXT;
