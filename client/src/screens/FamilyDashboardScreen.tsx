import { useEffect, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type { ProgressResponse } from "../api/types.js";

const ERROR_LABELS: Record<string, string> = {
  conceptual: "Comprensión de la idea matemática",
  procedimiento: "Procedimiento para resolver",
  calculo: "Cálculo puntual",
  comprension_enunciado: "Comprensión del enunciado",
  omision: "Uso de un dato del enunciado",
  respuesta_rapida: "Respuestas muy rápidas",
  abandono: "Actividades sin terminar",
  solicitud_ayuda_repetida: "Pistas usadas seguido",
};

function formatDate(iso: string | null): string {
  if (!iso) return "Todavía no ha practicado";
  return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
}

interface Props {
  childId: string;
  onBack: () => void;
}

export function FamilyDashboardScreen({ childId, onBack }: Props) {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    endpoints
      .getProgress(childId)
      .then(setProgress)
      .catch(() => setError("No se pudo cargar el progreso. Intenta de nuevo en un momento."));
  }, [childId]);

  if (error) {
    return (
      <main className="screen">
        <p className="error-text" role="alert">
          {error}
        </p>
        <button className="btn-secondary" type="button" onClick={onBack}>
          Volver
        </button>
      </main>
    );
  }

  if (!progress) {
    return (
      <main className="screen" aria-busy="true">
        <p>Cargando…</p>
      </main>
    );
  }

  const errorEntries = Object.entries(progress.errorBreakdown).sort((a, b) => b[1] - a[1]);

  return (
    <main className="screen">
      <h1>Progreso de {progress.child.displayName}</h1>
      <p className="hint-text">Este progreso es personal — no se compara con otros niños.</p>

      <div className="form" style={{ textAlign: "left" }}>
        <p>
          <strong>Sesiones practicadas:</strong> {progress.totalSessions}
        </p>
        <p>
          <strong>Última sesión:</strong> {formatDate(progress.lastSessionAt)}
        </p>
        <p>
          <strong>Precisión general:</strong>{" "}
          {progress.accuracy === null ? "Todavía sin datos" : `${Math.round(progress.accuracy * 100)}%`}
        </p>
        <p>
          <strong>Nivel actual:</strong> {progress.currentLevel}
        </p>

        {errorEntries.length > 0 && (
          <div>
            <p>
              <strong>Dónde practicar más:</strong>
            </p>
            <ul>
              {errorEntries.map(([code, count]) => (
                <li key={code}>
                  {ERROR_LABELS[code] ?? code}: {count}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button className="btn-secondary" type="button" onClick={onBack}>
        Volver
      </button>
    </main>
  );
}
