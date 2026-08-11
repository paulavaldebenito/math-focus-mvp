import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import * as endpoints from "../api/endpoints.js";
import type { AdultUser } from "../api/types.js";
import { AuthReactContext } from "./useAuth.js";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [adult, setAdult] = useState<AdultUser | null>(null);
  const [loading, setLoading] = useState(true);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

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
    <AuthReactContext.Provider value={{ adult, loading, login, register, logout }}>
      {children}
    </AuthReactContext.Provider>
  );
}
