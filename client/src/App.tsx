import { useEffect, useState } from "react";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import { AuthScreen } from "./screens/AuthScreen.js";
import { ConsentScreen } from "./screens/ConsentScreen.js";
import { CreateChildScreen } from "./screens/CreateChildScreen.js";
import * as endpoints from "./api/endpoints.js";
import type { ChildProfile } from "./api/types.js";

type OnboardingStep = "loading-children" | "consent" | "create-child" | "done";

function Onboarding({ onChildReady }: { onChildReady: (child: ChildProfile) => void }) {
  const [step, setStep] = useState<OnboardingStep>("loading-children");
  const [consentId, setConsentId] = useState<string | null>(null);

  useEffect(() => {
    endpoints
      .listChildren()
      .then((children) => {
        if (children.length > 0) {
          onChildReady(children[0]!);
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
    return <CreateChildScreen consentId={consentId} onCreated={onChildReady} />;
  }

  return null;
}

function AppShell() {
  const { adult, loading, logout } = useAuth();
  const [child, setChild] = useState<ChildProfile | null>(null);

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
    return <Onboarding onChildReady={setChild} />;
  }

  return (
    <main className="screen">
      <h1>Math Focus</h1>
      <p data-testid="child-ready-marker">Perfil listo: {child.displayName}.</p>
      <button className="btn-secondary" type="button" onClick={() => void logout()}>
        Cerrar sesión
      </button>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
