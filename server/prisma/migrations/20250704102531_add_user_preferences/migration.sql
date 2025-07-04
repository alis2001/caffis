-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coffeePersonality" TEXT,
ADD COLUMN     "conversationTopics" TEXT,
ADD COLUMN     "groupPreference" TEXT,
ADD COLUMN     "locationPreference" TEXT,
ADD COLUMN     "meetingFrequency" TEXT,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "socialGoals" TEXT,
ADD COLUMN     "socialStyle" TEXT,
ADD COLUMN     "timePreference" TEXT;

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferences" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
