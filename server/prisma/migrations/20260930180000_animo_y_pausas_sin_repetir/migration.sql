-- Autorreporte breve y opcional (5 caritas) del ánimo del niño y de cómo se
-- siente con las matemáticas al empezar una práctica, y el ejercicio concreto
-- de cada pausa (para no repetirlo en la misma sesión). Solo aditivo.
-- AlterTable
ALTER TABLE "PauseEvent" ADD COLUMN     "exerciseKey" TEXT;

-- CreateTable
CREATE TABLE "WellbeingCheckIn" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "sessionId" TEXT,
    "mood" INTEGER,
    "mathFeeling" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WellbeingCheckIn_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WellbeingCheckIn" ADD CONSTRAINT "WellbeingCheckIn_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WellbeingCheckIn" ADD CONSTRAINT "WellbeingCheckIn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

