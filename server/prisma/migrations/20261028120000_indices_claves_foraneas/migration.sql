-- CreateIndex
CREATE INDEX "AdaptiveDecision_sessionId_idx" ON "AdaptiveDecision"("sessionId");

-- CreateIndex
CREATE INDEX "Attempt_sessionId_createdAt_idx" ON "Attempt"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "ChildProfile_adultUserId_idx" ON "ChildProfile"("adultUserId");

-- CreateIndex
CREATE INDEX "ClassEnrollment_childProfileId_idx" ON "ClassEnrollment"("childProfileId");

-- CreateIndex
CREATE INDEX "Classroom_schoolId_idx" ON "Classroom"("schoolId");

-- CreateIndex
CREATE INDEX "Classroom_teacherId_idx" ON "Classroom"("teacherId");

-- CreateIndex
CREATE INDEX "Consent_adultUserId_idx" ON "Consent"("adultUserId");

-- CreateIndex
CREATE INDEX "Hint_attemptId_idx" ON "Hint"("attemptId");

-- CreateIndex
CREATE INDEX "PauseEvent_sessionId_idx" ON "PauseEvent"("sessionId");

-- CreateIndex
CREATE INDEX "ProgressSnapshot_childProfileId_idx" ON "ProgressSnapshot"("childProfileId");

-- CreateIndex
CREATE INDEX "SchoolStaff_adultUserId_idx" ON "SchoolStaff"("adultUserId");

-- CreateIndex
CREATE INDEX "Session_childProfileId_startedAt_idx" ON "Session"("childProfileId", "startedAt");

-- CreateIndex
CREATE INDEX "StarEvent_childProfileId_createdAt_idx" ON "StarEvent"("childProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "StarEvent_sessionId_idx" ON "StarEvent"("sessionId");

-- CreateIndex
CREATE INDEX "TeacherNote_childProfileId_idx" ON "TeacherNote"("childProfileId");

-- CreateIndex
CREATE INDEX "TeacherNote_classroomId_idx" ON "TeacherNote"("classroomId");

-- CreateIndex
CREATE INDEX "WellbeingCheckIn_childProfileId_createdAt_idx" ON "WellbeingCheckIn"("childProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "WellbeingCheckIn_sessionId_idx" ON "WellbeingCheckIn"("sessionId");

