import { Router } from "express";

/// Chequeos de salud (specs/025). No usan sesión ni crean cookies.
///
/// - `GET /api/health`: el proceso está vivo. Es el que usa el balanceador; a propósito no
///   consulta la base: si RDS se cae, todas las instancias quedarían «enfermas» a la vez y
///   Elastic Beanstalk las reemplazaría en bucle sin arreglar nada.
/// - `GET /api/health/db`: además hace `SELECT 1` en la base, con tiempo máximo. Sirve para
///   comprobar un despliegue a mano o desde un monitor externo.
export function crearRutasSalud(verificarBd: () => Promise<unknown>, tiempoMaxMs = 3000): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.set("Cache-Control", "no-store").json({ ok: true });
  });

  router.get("/db", async (_req, res) => {
    let temporizador: NodeJS.Timeout | undefined;
    const limite = new Promise<never>((_, reject) => {
      temporizador = setTimeout(() => reject(new Error("tiempo agotado")), tiempoMaxMs);
    });
    try {
      await Promise.race([verificarBd(), limite]);
      res.set("Cache-Control", "no-store").json({ ok: true, db: "ok" });
    } catch (err) {
      console.error("Chequeo de salud de la base falló:", err instanceof Error ? err.message : err);
      res.status(503).set("Cache-Control", "no-store").json({ ok: false, db: "sin_conexion" });
    } finally {
      clearTimeout(temporizador);
    }
  });

  return router;
}
