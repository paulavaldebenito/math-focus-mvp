-- CreateTable
CREATE TABLE "SessionReflection" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "mathSkillId" TEXT,
    "emotion" TEXT,
    "weather" INTEGER,
    "energy" INTEGER,
    "hardest" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionReflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeGamePlay" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "mathSkillId" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeGamePlay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionReflection_sessionId_key" ON "SessionReflection"("sessionId");

-- CreateIndex
CREATE INDEX "SessionReflection_childProfileId_createdAt_idx" ON "SessionReflection"("childProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "HomeGamePlay_childProfileId_idx" ON "HomeGamePlay"("childProfileId");

-- AddForeignKey
ALTER TABLE "SessionReflection" ADD CONSTRAINT "SessionReflection_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionReflection" ADD CONSTRAINT "SessionReflection_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionReflection" ADD CONSTRAINT "SessionReflection_mathSkillId_fkey" FOREIGN KEY ("mathSkillId") REFERENCES "MathSkill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeGamePlay" ADD CONSTRAINT "HomeGamePlay_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeGamePlay" ADD CONSTRAINT "HomeGamePlay_mathSkillId_fkey" FOREIGN KEY ("mathSkillId") REFERENCES "MathSkill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

