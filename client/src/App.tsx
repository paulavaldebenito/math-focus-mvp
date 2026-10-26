import { useEffect, useRef, useState } from "react";
import "./App.css";
import { AuthProvider } from "./context/AuthContext.js";
import { useAuth } from "./context/useAuth.js";
import { AuthScreen } from "./screens/AuthScreen.js";
import { ConsentScreen } from "./screens/ConsentScreen.js";
import { CreateChildScreen } from "./screens/CreateChildScreen.js";
import { ChooseCompanionScreen } from "./screens/ChooseCompanionScreen.js";
import { ChooseInterestScreen } from "./screens/ChooseInterestScreen.js";
import { InitialAssessmentScreen } from "./screens/InitialAssessmentScreen.js";
import { SkillPathScreen } from "./screens/SkillPathScreen.js";
import { PracticeScreen } from "./screens/PracticeScreen.js";
import { FamilyDashboardScreen } from "./screens/FamilyDashboardScreen.js";
import { FamilyGateScreen } from "./screens/FamilyGateScreen.js";
import { HomeScreen } from "./screens/HomeScreen.js";
import { ReviewScreen } from "./screens/ReviewScreen.js";
import { SchoolScreen } from "./screens/SchoolScreen.js";
import * as endpoints from "./api/endpoints.js";
import type { ChildProfile } from "./api/types.js";
import { LangProvider } from "./context/LangContext.js";
import { t, useLang } from "./lib/i18n.js";
import { SCHOOL } from "./components/school/copy.js";
import { isMuted, playClick, playSelect, setMuted } from "./lib/sound.js";

type OnboardingStep = "loading-children" | "consent" | "create-child" | "done";

function Onboarding({
  onChildReady,
}: {
  onChildReady: (child: ChildProfile, isNew: boolean) => void;
}) {
  const { lang } = useLang();
  const [step, setStep] = useState<OnboardingStep>("loading-children");
  const [consentId, setConsentId] = useState<string | null>(null);
  const [socialConsent, setSocialConsent] = useState(false);
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
        onConsented={(id, social) => {
          setConsentId(id);
          setSocialConsent(social);
          setStep("create-child");
        }}
      />
    );
  }

  if (step === "create-child" && consentId) {
    return <CreateChildScreen consentId={consentId} socialCheckInConsent={socialConsent} onCreated={(child) => onChildReady(child, true)} />;
  }

  return null;
}

type Stage =
  | "choose-companion"
  | "choose-interest"
  | "edit-interests"
  | "edit-mascot"
  | "assessment"
  | "map"
  | "practice"
  | "home"
  | "dashboard";

function initialStage(child: ChildProfile, isNewChild: boolean): Stage {
  if (isNewChild) return "choose-companion";
  // Perfil anterior a esta funcionalidad: le falta elegir interés, pero ya
  // hizo su evaluación inicial hace tiempo — no se repite.
  if (!child.interests || child.interests.length === 0) return "choose-interest";
  return "map";
}

function ChildFlow({ child, isNewChild }: { child: ChildProfile; isNewChild: boolean }) {
  const [stage, setStage] = useState<Stage>(initialStage(child, isNewChild));
  const [familyUnlocked, setFamilyUnlocked] = useState(false);
  // Lo elegido en esta sesión; el `child` que llega por props no se refresca.
  const [interests, setInterests] = useState<string[]>(child.interests ?? []);
  // Nodo del mapa de habilidades elegido para la sesión de práctica en curso.
  const [selectedSkill, setSelectedSkill] = useState<{ id: string; name: string; nameEn: string | null } | null>(null);
  // Valores actuales para precargar la pantalla de editar la mascota — se
  // completan con los datos frescos que ya tiene Inicio al abrir la edición
  // (el `child` de arriba se lee una sola vez y puede estar desactualizado).
  const [editMascotSeed, setEditMascotSeed] = useState<{
    companion: string | null;
    mascotName: string | null;
    mascotNames: Record<string, string>;
  }>({
    companion: child.companion ?? null,
    mascotName: child.mascotName ?? null,
    mascotNames: {},
  });

  if (stage === "choose-companion") {
    return <ChooseCompanionScreen childId={child.id} onDone={() => setStage("choose-interest")} />;
  }

  if (stage === "choose-interest") {
    return (
      <ChooseInterestScreen
        childId={child.id}
        initial={interests}
        onDone={(selection) => {
          setInterests(selection);
          setStage(isNewChild ? "assessment" : "map");
        }}
      />
    );
  }

  if (stage === "edit-interests") {
    return (
      <ChooseInterestScreen
        childId={child.id}
        initial={interests}
        onDone={(selection) => {
          setInterests(selection);
          setStage("home");
        }}
      />
    );
  }

  if (stage === "edit-mascot") {
    return (
      <ChooseCompanionScreen
        childId={child.id}
        initialCompanion={editMascotSeed.companion}
        initialMascotName={editMascotSeed.mascotName}
        initialMascotNames={editMascotSeed.mascotNames}
        onDone={() => setStage("home")}
      />
    );
  }

  if (stage === "assessment") {
    return <InitialAssessmentScreen childId={child.id} onDone={() => setStage("map")} />;
  }

  if (stage === "map") {
    return (
      <SkillPathScreen
        childId={child.id}
        onSelect={(skill) => {
          setSelectedSkill(skill);
          setStage("practice");
        }}
        onBack={() => setStage("home")}
      />
    );
  }

  if (stage === "practice") {
    return (
      <PracticeScreen
        childId={child.id}
        startingLevel={2}
        mathSkillId={selectedSkill?.id}
        skillName={selectedSkill?.name}
        skillNameEn={selectedSkill?.nameEn}
        grade={child.grade}
        onSessionComplete={() => setStage("home")}
      />
    );
  }

  if (stage === "dashboard") {
    // Espacio familia (specs/018): primero el PIN; si el panel responde que se bloqueó (pasaron los
    // 30 minutos), vuelve a pedirlo.
    if (!familyUnlocked) {
      return <FamilyGateScreen onUnlocked={() => setFamilyUnlocked(true)} onBack={() => setStage("home")} />;
    }
    return (
      <FamilyDashboardScreen
        childId={child.id}
        onLocked={() => setFamilyUnlocked(false)}
        onBack={() => {
          setFamilyUnlocked(false);
          void endpoints.lockFamily().catch(() => {});
          setStage("home");
        }}
      />
    );
  }

  return (
    <HomeScreen
      childId={child.id}
      displayName={child.displayName}
      onOpenMap={() => setStage("map")}
      onViewProgress={() => setStage("dashboard")}
      onChangeInterests={() => setStage("edit-interests")}
      onChangeMascotName={(companion, mascotName, mascotNames) => {
        setEditMascotSeed({ companion, mascotName, mascotNames });
        setStage("edit-mascot");
      }}
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
    // Al reactivar el sonido, un toque breve confirma que ya se oye.
    if (next) playSelect();
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
      <button
        className="lang-toggle"
        type="button"
        onClick={() => {
          playClick();
          setLang(lang === "es" ? "en" : "es");
        }}
      >
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
  const [reviewing, setReviewing] = useState(false);
  const [inSchool, setInSchool] = useState(false);
  const [becameStaff, setBecameStaff] = useState(false);

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

  // Modo revisión: solo cuentas revisoras (REVIEWER_EMAILS en el servidor).
  // Se puede entrar antes de crear un niño; al salir se vuelve al flujo
  // normal tal como estaba (ChildFlow no se desmonta mientras se revisa).
  const reviewEntry = adult.isReviewer && !reviewing && !inSchool && (
    <button className="review-entry" type="button" onClick={() => setReviewing(true)}>
      {t(lang, "reviewEntry")}
    </button>
  );
  // Panel escolar (specs/014): siempre para quien tiene un rol en un colegio;
  // antes de crear un perfil de niño, también como "Soy docente o directivo/a".
  const isStaff = adult.isStaff || becameStaff;
  const schoolEntry = !inSchool && !reviewing && (isStaff || !child) && (
    <button className="school-entry" type="button" onClick={() => setInSchool(true)}>
      {isStaff ? SCHOOL[lang].entry : t(lang, "schoolEntryNew")}
    </button>
  );

  return (
    <>
      {(reviewEntry || schoolEntry) && (
        <div className="app-entries">
          {reviewEntry}
          {schoolEntry}
        </div>
      )}
      {reviewing && <ReviewScreen onExit={() => setReviewing(false)} />}
      {inSchool && <SchoolScreen onExit={() => setInSchool(false)} onBecameStaff={() => setBecameStaff(true)} />}
      <div hidden={reviewing || inSchool}>
        {!child ? (
          <Onboarding
            onChildReady={(c, fresh) => {
              setChild(c);
              setIsNewChild(fresh);
            }}
          />
        ) : (
          <ChildFlow child={child} isNewChild={isNewChild} />
        )}
      </div>
    </>
  );
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
