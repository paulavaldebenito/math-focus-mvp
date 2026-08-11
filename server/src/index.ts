import "dotenv/config";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { consentRouter } from "./routes/consent.js";
import { childrenRouter } from "./routes/children.js";
import { initialAssessmentRouter } from "./routes/initialAssessment.js";
import { sessionMiddleware } from "./auth/session.js";

export const app = express();
app.use(express.json());
app.use(sessionMiddleware);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/consent", consentRouter);
app.use("/api/children", childrenRouter);
app.use("/api/children/:childId/initial-assessment", initialAssessmentRouter);

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 4100;
  app.listen(PORT, () => {
    console.log(`Math Focus MVP server listening on http://localhost:${PORT}`);
  });
}
