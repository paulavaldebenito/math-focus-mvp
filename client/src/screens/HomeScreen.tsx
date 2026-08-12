import { useEffect, useRef, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type { HomeSummary } from "../api/types.js";
import { companionByKey, companionName } from "../lib/companions.js";
import { t, useLang } from "../lib/i18n.js";
import { useAuth } from "../context/useAuth.js";

interface Props {
  childId: string;
  displayName: string;
  onPractice: () => void;
  onViewProgress: () => void;
}

export function HomeScreen({ childId, displayName, onPractice, onViewProgress }: Props) {
  const { lang } = useLang();
  const { logout } = useAuth();
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    endpoints
      .getHomeSummary(childId)
      .then(setSummary)
      .catch(() => {
        // El resumen es informativo — si falla, igual se puede practicar.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  const companion = companionByKey(summary?.companion);

  return (
    <main className="screen">
      <div className="capy-avatar" style={{ background: companion.bg, borderColor: companion.color }}>
        {companion.emoji}
      </div>
      <h1>{companionName(companion, lang)}</h1>
      <p className="hint-text">
        {t(lang, "profileGreetingPrefix")} {displayName}
      </p>

      {summary && summary.streak > 0 && (
        <span className="streak-pill">
          🔥 {summary.streak} {t(lang, summary.streak === 1 ? "streakDay" : "streakDays")}
        </span>
      )}

      {summary && (
        <div className="stat-row">
          <div className="stat">
            <span className="value">{summary.starsToday}</span>
            <span className="label">{t(lang, "starsToday")}</span>
          </div>
          <div className="stat">
            <span className="value">{summary.totalStars}</span>
            <span className="label">{t(lang, "starsTotal")}</span>
          </div>
        </div>
      )}

      <button className="btn-primary" type="button" onClick={onPractice}>
        {t(lang, "practiceAgain")}
      </button>
      <button className="btn-secondary" type="button" onClick={onViewProgress}>
        {t(lang, "viewProgress")}
      </button>
      <button className="btn-secondary" type="button" onClick={() => void logout()}>
        {t(lang, "logout")}
      </button>
    </main>
  );
}
