import { useEffect, useRef, useState } from "react";
import "./App.css";
import { AuthProvider } from "./context/AuthContext.js";
import { useAuth } from "./context/useAuth.js";
import { AuthScreen } from "./screens/AuthScreen.js";
import { ConsentScreen } from "./screens/ConsentScreen.js";
import { CreateChildScreen } from "./screens/CreateChildScreen.js";
import { InitialAssessmentScreen } from "./screens/InitialAssessmentScreen.js";
import { PracticeScreen } from "./screens/PracticeScreen.js";
import { FamilyDashboardScreen } from "./screens/FamilyDashboardScreen.js";
import * as endpoints from "./api/endpoints.js";
import type { ChildProfile } from "./api/types.js";

type OnboardingStep = "loading-children" | "consent" | "create-child" | "done";

function Onboarding({
  onChildReady,
}: {
  onChildReady: (child: ChildProfile, isNew: boolean) => void;
}) {
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
        <p>Cargando…</p>
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

type Stage = "assessment" | "practice" | "session-done" | "dashboard";

function ChildFlow({ child, isNewChild }: { child: ChildProfile; isNewChild: boolean }) {
  const [stage, setStage] = useState<Stage>(isNewChild ? "assessment" : "practice");
  const { logout } = useAuth();

  if (stage === "assessment") {
    return <InitialAssessmentScreen childId={child.id} onDone={() => setStage("practice")} />;
  }

  if (stage === "practice") {
    return (
      <PracticeScreen
        childId={child.id}
        startingLevel={2}
        onSessionComplete={() => setStage("session-done")}
      />
    );
  }

  if (stage === "dashboard") {
    return <FamilyDashboardScreen childId={child.id} onBack={() => setStage("session-done")} />;
  }

  return (
    <main className="screen">
      <h1>Math Focus</h1>
      <p>Perfil: {child.displayName}.</p>
      <button className="btn-primary" type="button" onClick={() => setStage("practice")}>
        Practicar de nuevo
      </button>
      <button className="btn-secondary" type="button" onClick={() => setStage("dashboard")}>
        Ver progreso
      </button>
      <button className="btn-secondary" type="button" onClick={() => void logout()}>
        Cerrar sesión
      </button>
    </main>
  );
}

function AppShell() {
  const { adult, loading } = useAuth();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [isNewChild, setIsNewChild] = useState(false);

  if (loading) {
    return (
      <main className="screen" aria-busy="true">
        <p>Cargando…</p>
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
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
