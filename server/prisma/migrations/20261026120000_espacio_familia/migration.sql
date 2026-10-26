-- Espacio familia con PIN, plan y pregunta social semanal (specs/018).
ALTER TABLE "AdultUser" ADD COLUMN "familyPinHash" TEXT;
ALTER TABLE "AdultUser" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'familia';
ALTER TABLE "ChildProfile" ADD COLUMN "socialCheckInConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ChildProfile" ADD COLUMN "socialConsentAt" TIMESTAMP(3);
ALTER TABLE "ChildProfile" ADD COLUMN "socialConsentVersion" TEXT;
ALTER TABLE "ChildProfile" ADD COLUMN "familySeenAt" TIMESTAMP(3);

CREATE TABLE "SocialCheckIn" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "recess" INTEGER,
    "confidant" INTEGER,
    "excluded" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialCheckIn_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SocialCheckIn_childProfileId_weekKey_key" ON "SocialCheckIn"("childProfileId", "weekKey");
ALTER TABLE "SocialCheckIn" ADD CONSTRAINT "SocialCheckIn_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
