-- Evaluación de ubicación adaptativa (specs/020-ubicacion-adaptativa).
ALTER TABLE "Session" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'practica';
ALTER TABLE "Session" ADD COLUMN "pendingExerciseId" TEXT;

CREATE TABLE "SkillPlacement" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "mathSkillId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "direct" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillPlacement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SkillPlacement_childProfileId_mathSkillId_key" ON "SkillPlacement"("childProfileId", "mathSkillId");

ALTER TABLE "SkillPlacement" ADD CONSTRAINT "SkillPlacement_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillPlacement" ADD CONSTRAINT "SkillPlacement_mathSkillId_fkey" FOREIGN KEY ("mathSkillId") REFERENCES "MathSkill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
