import "dotenv/config";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { sessionMiddleware } from "./auth/session.js";

export const app = express();
app.use(express.json());
app.use(sessionMiddleware);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 4100;
  app.listen(PORT, () => {
    console.log(`Math Focus MVP server listening on http://localhost:${PORT}`);
  });
}
