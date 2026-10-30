import type { Server } from "node:http";

/// Apagado ordenado (specs/025). En cada despliegue o reemplazo de instancia, Elastic Beanstalk
/// detiene el proceso con SIGTERM. Sin esto Node se cortaba en seco: las peticiones en curso
/// (por ejemplo, guardar un intento) fallaban y las conexiones a RDS quedaban abiertas hasta
/// que Postgres las diera por muertas.
///
/// Deja de aceptar conexiones, espera a que terminen las peticiones en curso, cierra los
/// recursos (el pool de Postgres) y sale. Si algo se cuelga, sale igual pasado `tiempoMaxMs`.
export function crearApagado({
  server,
  cerrarRecursos,
  tiempoMaxMs = 10_000,
  salir = (codigo: number) => process.exit(codigo),
  log = console.log,
}: {
  server: Server;
  cerrarRecursos: () => Promise<unknown>;
  tiempoMaxMs?: number;
  salir?: (codigo: number) => void;
  log?: (mensaje: string) => void;
}): (senal: string) => Promise<void> {
  let enCurso: Promise<void> | null = null;

  return (senal: string) => {
    // Una segunda señal (p. ej. SIGINT después de SIGTERM) no repite el apagado.
    if (enCurso) return enCurso;
    log(`${senal} recibido: cerrando el servidor…`);

    const forzar = setTimeout(() => {
      log(`El apagado tardó más de ${tiempoMaxMs} ms: salgo igual.`);
      salir(1);
    }, tiempoMaxMs);
    forzar.unref();

    enCurso = (async () => {
      let codigo = 0;
      try {
        await new Promise<void>((resolve, reject) => {
          server.close((err) => (err ? reject(err) : resolve()));
          // Las conexiones keep-alive sin petición en curso no deben retener el cierre.
          server.closeIdleConnections();
        });
      } catch (err) {
        codigo = 1;
        log(`Error al cerrar el servidor HTTP: ${err instanceof Error ? err.message : String(err)}`);
      }
      try {
        await cerrarRecursos();
      } catch (err) {
        codigo = 1;
        log(`Error al cerrar recursos: ${err instanceof Error ? err.message : String(err)}`);
      }
      clearTimeout(forzar);
      log("Servidor cerrado.");
      salir(codigo);
    })();
    return enCurso;
  };
}
