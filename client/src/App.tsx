import { useEffect, useRef, useState } from "react";
import "./App.css";
import { AuthProvider } from "./context/AuthContext.js";
import { useAuth } from "./context/useAuth.js";
import { AuthScreen } from "./screens/AuthScreen.js";
import { ConsentScreen } from "./screens/ConsentScreen.js";
import { CreateChildScreen } from "./screens/CreateChildScreen.js";
import { ChooseCompanionScreen } from "./screens/ChooseCompanionScreen.js";
import { InitialAssessmentScreen } from "./screens/InitialAssessmentScreen.js";
import { PracticeScreen } from "./screens/PracticeScreen.js";
import { FamilyDashboardScreen } from "./screens/FamilyDashboardScreen.js";
import { HomeScreen } from "./screens/HomeScreen.js";
import * as endpoints from "./api/endpoints.js";
import type { ChildProfile } from "./api/types.js";
import { LangProvider } from "./context/LangContext.js";
import { t, useLang } from "./lib/i18n.js";
import { isMuted, setMuted } from "./lib/sound.js";

type OnboardingStep = "loading-children" | "consent" | "create-child" | "done";

function Onboarding({
  onChildReady,
}: {
  onChildReady: (child: ChildProfile, isNew: boolean) => void;
}) {
  const { lang } = useLang();
  const [step, setStep] = useState<OnboardingStep>("loading-children");
  const [consentId, setConsentId] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    endpoints
      .listChildren()
      .then((children) => {
        if (children.length > 0) {
          onChildReady(children[0]!, false);
        } else {
          setStep("consent");
        }
      })
      .catch(() => setStep("consent"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (step === "loading-children") {
    return (
      <main className="screen" aria-busy="true">
        <p>{t(lang, "loading")}</p>
      </main>
    );
  }

  if (step === "consent") {
    return (
      <ConsentScreen
        onConsented={(id) => {
          setConsentId(id);
          setStep("create-child");
        }}
      />
    );
  }

  if (step === "create-child" && consentId) {
    return <CreateChildScreen consentId={consentId} onCreated={(child) => onChildReady(child, true)} />;
  }

  return null;
}

type Stage = "choose-companion" | "assessment" | "practice" | "home" | "dashboard";

function ChildFlow({ child, isNewChild }: { child: ChildProfile; isNewChild: boolean }) {
  const [stage, setStage] = useState<Stage>(isNewChild ? "choose-companion" : "practice");

  if (stage === "choose-companion") {
    return <ChooseCompanionScreen childId={child.id} onDone={() => setStage("assessment")} />;
  }

  if (stage === "assessment") {
    return <InitialAssessmentScreen childId={child.id} onDone={() => setStage("practice")} />;
  }

  if (stage === "practice") {
    return (
      <PracticeScreen childId={child.id} startingLevel={2} onSessionComplete={() => setStage("home")} />
    );
  }

  if (stage === "dashboard") {
    return <FamilyDashboardScreen childId={child.id} onBack={() => setStage("home")} />;
  }

  return (
    <HomeScreen
      childId={child.id}
      displayName={child.displayName}
      onPractice={() => setStage("practice")}
      onViewProgress={() => setStage("dashboard")}
    />
  );
}

function TopNav() {
  const { lang, setLang } = useLang();
  const [soundOn, setSoundOn] = useState(!isMuted());

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setMuted(!next);
  }

  return (
    <div className="top-nav">
      <button
        className="sound-toggle"
        type="button"
        onClick={toggleSound}
        aria-label={t(lang, soundOn ? "soundOnLabel" : "soundOffLabel")}
      >
        {soundOn ? "🔊" : "🔇"}
      </button>
      <button className="lang-toggle" type="button" onClick={() => setLang(lang === "es" ? "en" : "es")}>
        {t(lang, "langToggleLabel")}
      </button>
    </div>
  );
}

function AppShell() {
  const { lang } = useLang();
  const { adult, loading } = useAuth();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [isNewChild, setIsNewChild] = useState(false);

  if (loading) {
    return (
      <main className="screen" aria-busy="true">
        <p>{t(lang, "loading")}</p>
      </main>
    );
  }

  if (!adult) {
    return <AuthScreen />;
  }

  if (!child) {
    return (
      <Onboarding
        onChildReady={(c, fresh) => {
          setChild(c);
          setIsNewChild(fresh);
        }}
      />
    );
  }

  return <ChildFlow child={child} isNewChild={isNewChild} />;
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <TopNav />
        <AppShell />
      </AuthProvider>
    </LangProvider>
  );
}
