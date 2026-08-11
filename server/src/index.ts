import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { consentRouter } from "./routes/consent.js";
import { childrenRouter } from "./routes/children.js";
import { initialAssessmentRouter } from "./routes/initialAssessment.js";
import {
  childSessionsRouter,
  sessionAttemptsRouter,
  nextExerciseRouter,
  pauseEventsRouter,
} from "./routes/sessions.js";
import { sessionMiddleware } from "./auth/session.js";

export const app = express();

// El cliente vive en otro puerto (Vite) y necesita mandar la cookie de
// sesión — sin credentials:true aquí, el login nunca persistiría.
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(sessionMiddleware);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/consent", consentRouter);
app.use("/api/children", childrenRouter);
app.use("/api/children/:childId/initial-assessment", initialAssessmentRouter);
app.use("/api/children/:childId/sessions", childSessionsRouter);
app.use("/api/children/:childId/next-exercise", nextExerciseRouter);
app.use("/api/sessions/:sessionId/attempts", sessionAttemptsRouter);
app.use("/api/sessions/:sessionId/pause-events", pauseEventsRouter);

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 4100;
  app.listen(PORT, () => {
    console.log(`Math Focus MVP server listening on http://localhost:${PORT}`);
  });
}
