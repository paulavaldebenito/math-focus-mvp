import { useEffect, useRef, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type { HomeSummary } from "../api/types.js";
import { companionByKey, companionName } from "../lib/companions.js";
import { t, useLang } from "../lib/i18n.js";
import { useAuth } from "../context/useAuth.js";
import { SceneHabitat } from "../components/SceneHabitat.js";
import { playBack, playClick, playConfirm } from "../lib/sound.js";

interface Props {
  childId: string;
  displayName: string;
  onOpenMap: () => void;
  onViewProgress: () => void;
  onChangeInterests: () => void;
  onChangeMascotName: (
    companion: string | null,
    mascotName: string | null,
    mascotNames: Record<string, string>,
  ) => void;
}

export function HomeScreen({
  childId,
  displayName,
  onOpenMap,
  onViewProgress,
  onChangeInterests,
  onChangeMascotName,
}: Props) {
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
    <main className="screen screen-wide">
      <SceneHabitat companion={companion} totalStars={summary?.totalStars ?? 0} />
      <h1>{companionName(companion, lang, summary?.mascotName)}</h1>
      <p className="hint-text">
        {t(lang, "profileGreetingPrefix")} {displayName}
      </p>

      {summary && summary.streak > 0 && (
        <span className="streak-pill">
          🔥 {summary.streak} {t(lang, summary.streak === 1 ? "streakDay" : "streakDays")}
        </span>
      )}

      {summary && (
        <div className="rank-bar">
          <span className="rank-bar-label">
            🏅 {t(lang, "rankLabel")} {summary.rank}
          </span>
          <div className="rank-bar-track">
            <div className="rank-bar-fill" style={{ width: `${(summary.starsIntoRank / (summary.starsIntoRank + summary.starsToNextRank)) * 100}%` }} />
          </div>
          <span className="rank-bar-hint">
            {t(lang, "starsToNextRankPrefix") && `${t(lang, "starsToNextRankPrefix")} `}
            {summary.starsToNextRank} {t(lang, "starsToNextRankSuffix")}
          </span>
        </div>
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

      <button
        className="btn-primary"
        type="button"
        onClick={() => {
          playConfirm();
          onOpenMap();
        }}
      >
        {t(lang, "practiceAgain")}
      </button>
      <button
        className="btn-secondary"
        type="button"
        onClick={() => {
          playClick();
          onViewProgress();
        }}
      >
        {t(lang, "viewProgress")}
      </button>
      <button
        className="btn-secondary"
        type="button"
        onClick={() => {
          playClick();
          onChangeInterests();
        }}
      >
        {t(lang, "changeInterests")}
      </button>
      <button
        className="btn-secondary"
        type="button"
        onClick={() => {
          playClick();
          onChangeMascotName(summary?.companion ?? null, summary?.mascotName ?? null, summary?.mascotNames ?? {});
        }}
      >
        {t(lang, "changeMascotName")}
      </button>
      <button
        className="btn-secondary"
        type="button"
        onClick={() => {
          playBack();
          void logout();
        }}
      >
        {t(lang, "logout")}
      </button>
    </main>
  );
}
