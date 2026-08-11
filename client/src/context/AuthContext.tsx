import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as endpoints from "../api/endpoints.js";
import { ApiError } from "../api/client.js";
import type { AdultUser } from "../api/types.js";

interface AuthContextValue {
  adult: AdultUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [adult, setAdult] = useState<AdultUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    endpoints
      .me()
      .then(setAdult)
      .catch(() => setAdult(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await endpoints.login(email, password);
    setAdult(result);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    await endpoints.register(email, password);
    const result = await endpoints.login(email, password);
    setAdult(result);
  }, []);

  const logout = useCallback(async () => {
    await endpoints.logout();
    setAdult(null);
  }, []);

  return (
    <AuthContext.Provider value={{ adult, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

export { ApiError };
