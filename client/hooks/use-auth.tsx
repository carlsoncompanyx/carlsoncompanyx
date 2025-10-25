import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  refreshSession,
  signInWithPassword,
  signOutRequest,
  type SupabaseSession,
  type SupabaseAuthUser,
  isSessionExpired,
} from "@/lib/supabase-auth";

interface AuthContextValue {
  session: SupabaseSession | null;
  user: SupabaseAuthUser | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "supabase.auth.session";

function loadStoredSession(): SupabaseSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as SupabaseSession;
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("Failed to parse stored Supabase session", error);
    return null;
  }
}

function storeSession(session: SupabaseSession | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [initializing, setInitializing] = useState(true);

  const setSessionState = useCallback((next: SupabaseSession | null) => {
    setSession(next);
    storeSession(next);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const storedSession = loadStoredSession();
        if (!storedSession) {
          return;
        }

        if (isSessionExpired(storedSession, 5_000)) {
          try {
            const refreshed = await refreshSession(storedSession.refreshToken);
            if (isMounted) {
              setSessionState(refreshed);
            }
          } catch (error) {
            console.warn("Failed to refresh Supabase session", error);
            if (isMounted) {
              setSessionState(null);
            }
          }
        } else if (isMounted) {
          setSessionState(storedSession);
        }
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [setSessionState]);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const refreshInMs = Math.max(
      session.expiresAt - Date.now() - 60_000,
      5_000,
    );

    const timer = window.setTimeout(async () => {
      try {
        const refreshed = await refreshSession(session.refreshToken);
        setSessionState(refreshed);
      } catch (error) {
        console.warn("Supabase session refresh failed", error);
        setSessionState(null);
      }
    }, refreshInMs);

    return () => window.clearTimeout(timer);
  }, [session, setSessionState]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const nextSession = await signInWithPassword(email, password);
        setSessionState(nextSession);
        return { error: null };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to sign in.";
        return { error: message };
      }
    },
    [setSessionState],
  );

  const signOut = useCallback(async () => {
    const accessToken = session?.accessToken;
    setSessionState(null);

    if (!accessToken) {
      return;
    }

    try {
      await signOutRequest(accessToken);
    } catch (error) {
      console.warn("Supabase sign out request failed", error);
    }
  }, [session?.accessToken, setSessionState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading: initializing,
      signIn,
      signOut,
    }),
    [session, initializing, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
