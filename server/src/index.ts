import "dotenv/config";
import { familyRouter } from "./routes/family.js";
import { socialCheckInRouter, socialConsentRouter } from "./routes/social.js";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth.js";
import { consentRouter } from "./routes/consent.js";
import { childrenRouter } from "./routes/children.js";
import { progressRouter } from "./routes/progress.js";
import { initialAssessmentRouter } from "./routes/initialAssessment.js";
import {
  childSessionsRouter,
  sessionAttemptsRouter,
  spotErrorAttemptsRouter,
  findStepAttemptsRouter,
  nextExerciseRouter,
  pauseEventsRouter,
  sessionCompleteRouter,
} from "./routes/sessions.js";
import { homeSummaryRouter } from "./routes/homeSummary.js";
import { skillPathRouter } from "./routes/skillPath.js";
import { sessionMiddleware } from "./auth/session.js";
import { joinCodeLimiter, loginLimiter, passwordCheckLimiter, registerLimiter } from "./auth/rateLimit.js";
import { checkInsRouter } from "./routes/checkIns.js";
import { reviewRouter } from "./routes/review.js";
import { homeGamesRouter, reflectionRouter } from "./routes/reflection.js";
import { childClassroomRouter, schoolRouter } from "./routes/school.js";
import { crearRutasSalud } from "./routes/health.js";
import { configurarProxy } from "./lib/proxy.js";
import { crearApagado } from "./lib/apagado.js";
import { pool } from "./db/prisma.js";

export const app = express();

// En AWS el servidor queda detrás de CloudFront, el balanceador y nginx, que terminan HTTPS: sin
// `trust proxy` Express ve la conexión como HTTP, nunca manda la cookie `secure` y el login no
// persiste. El número de saltos (TRUST_PROXY_HOPS) hace que el límite de intentos use la IP real
// del cliente y no la de un proxy — ver src/lib/proxy.ts y specs/025.
if (process.env.NODE_ENV === "production") {
  if (!process.env.CLIENT_ORIGIN) {
    throw new Error("CLIENT_ORIGIN es obligatoria en producción (dominio del cliente para CORS).");
  }
  const saltos = configurarProxy(app);
  console.log(`trust proxy: ${saltos} salto(s) (TRUST_PROXY_HOPS).`);
}

// El cliente vive en otro puerto (Vite) y necesita mandar la cookie de
// sesión — sin credentials:true aquí, el login nunca persistiría.
// Cabeceras de seguridad (specs/023): nosniff, sin iframes ajenos (clickjacking), HSTS, sin
// referrer hacia otros sitios, y sin delatar «X-Powered-By: Express».
app.use(helmet());
// Antes de CORS y de la sesión: el balanceador lo llama sin cookie ni Origin (specs/025).
app.use("/api/health", crearRutasSalud(() => pool.query("SELECT 1")));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(sessionMiddleware);

app.post("/api/auth/login", loginLimiter);
app.post("/api/auth/register", registerLimiter);
app.put("/api/family/pin", passwordCheckLimiter);
app.post("/api/school/join", joinCodeLimiter);
app.post("/api/children/:childId/classroom", joinCodeLimiter);

app.use("/api/auth", authRouter);
app.use("/api/consent", consentRouter);
app.use("/api/children", childrenRouter);
app.use("/api/children/:childId/progress", progressRouter);
app.use("/api/children/:childId/initial-assessment", initialAssessmentRouter);
app.use("/api/children/:childId/sessions", childSessionsRouter);
app.use("/api/children/:childId/next-exercise", nextExerciseRouter);
app.use("/api/sessions/:sessionId/attempts", sessionAttemptsRouter);
app.use("/api/sessions/:sessionId/spot-error-attempts", spotErrorAttemptsRouter);
app.use("/api/sessions/:sessionId/find-step-attempts", findStepAttemptsRouter);
app.use("/api/sessions/:sessionId/pause-events", pauseEventsRouter);
app.use("/api/sessions/:sessionId/check-in", checkInsRouter);
app.use("/api/sessions/:sessionId/reflection", reflectionRouter);
app.use("/api/children/:childId/home-games", homeGamesRouter);
app.use("/api/sessions/:sessionId/complete", sessionCompleteRouter);
app.use("/api/children/:childId/home", homeSummaryRouter);
app.use("/api/children/:childId/skill-path", skillPathRouter);
app.use("/api/family", familyRouter);
app.use("/api/children/:childId/social-check-in", socialCheckInRouter);
app.use("/api/children/:childId/social-consent", socialConsentRouter);
app.use("/api/review", reviewRouter);
app.use("/api/school", schoolRouter);
app.use("/api/children/:childId/classroom", childClassroomRouter);

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
  // Errores del propio cliente al mandar el body (JSON mal formado, demasiado grande): son 4xx,
  // no fallas del servidor — antes respondían 500 y llenaban el log de errores (specs/023).
  const status = (err as { status?: number; type?: string } | null)?.status;
  if (typeof status === "number" && status >= 400 && status < 500) {
    const type = (err as { type?: string }).type;
    res.status(status).json({ error: type === "entity.too.large" ? "payload_too_large" : "invalid_body" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 4100;
  const server = app.listen(PORT, () => {
    console.log(`Eureka server listening on http://localhost:${PORT}`);
  });
  // Elastic Beanstalk detiene el proceso con SIGTERM en cada despliegue (specs/025).
  const apagar = crearApagado({ server, cerrarRecursos: () => pool.end() });
  process.once("SIGTERM", () => void apagar("SIGTERM"));
  process.once("SIGINT", () => void apagar("SIGINT"));
}
