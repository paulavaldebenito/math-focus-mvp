import express from "express";

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4100;
app.listen(PORT, () => {
  console.log(`Math Focus MVP server listening on http://localhost:${PORT}`);
});
