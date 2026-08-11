import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext.js";

function AppShell() {
  const { adult, loading } = useAuth();

  if (loading) {
    return (
      <main className="screen" aria-busy="true">
        <p>Cargando…</p>
      </main>
    );
  }

  if (!adult) {
    return (
      <main className="screen">
        <h1>Math Focus</h1>
        <p data-testid="logged-out-marker">Necesitas iniciar sesión.</p>
      </main>
    );
  }

  return (
    <main className="screen">
      <h1>Math Focus</h1>
      <p data-testid="logged-in-marker">Sesión iniciada como {adult.email}.</p>
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
