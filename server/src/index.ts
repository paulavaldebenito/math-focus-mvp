import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { consentRouter } from "./routes/consent.js";
import { childrenRouter } from "./routes/children.js";
import { progressRouter } from "./routes/progress.js";
import { initialAssessmentRouter } from "./routes/initialAssessment.js";
import {
  childSessionsRouter,
  sessionAttemptsRouter,
  nextExerciseRouter,
  pauseEventsRouter,
  sessionCompleteRouter,
} from "./routes/sessions.js";
import { homeSummaryRouter } from "./routes/homeSummary.js";
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
app.use("/api/children/:childId/progress", progressRouter);
app.use("/api/children/:childId/initial-assessment", initialAssessmentRouter);
app.use("/api/children/:childId/sessions", childSessionsRouter);
app.use("/api/children/:childId/next-exercise", nextExerciseRouter);
app.use("/api/sessions/:sessionId/attempts", sessionAttemptsRouter);
app.use("/api/sessions/:sessionId/pause-events", pauseEventsRouter);
app.use("/api/sessions/:sessionId/complete", sessionCompleteRouter);
app.use("/api/children/:childId/home", homeSummaryRouter);

// Cualquier ruta no definida arriba — JSON consistente en vez del HTML por
// defecto de Express (el cliente espera poder parsear `.json()` siempre).
app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});

// Manejador de errores global: cualquier excepción no capturada en una ruta
// (ej. Prisma pierde la conexión) caía antes en la página HTML de error por
// defecto de Express — el cliente recibía un body vacío sin poder saber qué
// pasó. Nunca se expone el mensaje/stack real al cliente, solo se loguea.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 4100;
  app.listen(PORT, () => {
    console.log(`Math Focus MVP server listening on http://localhost:${PORT}`);
  });
}
