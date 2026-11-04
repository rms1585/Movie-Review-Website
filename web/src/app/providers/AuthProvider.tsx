import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { fetchSessionClaims, logout as endSession, loginWithPassword, onSessionExpired } from "../../lib/blocks/auth";
import type { LoginResult } from "../../lib/blocks/auth";

type AuthStatus = "authenticated" | "loading" | "unauthenticated";

type AuthContextValue = {
  claims: Record<string, unknown> | undefined;
  signIn: (params: { email: string; password: string; rememberMe: boolean }) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  status: AuthStatus;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
// A long backup interval, not the primary signal -- polling auth/me every
// few seconds would hit IAM constantly even while the tab sits idle in the
// background. Regaining focus (below) is what actually needs to be prompt,
// e.g. after signing out in another tab or the session expiring meanwhile.
const STATUS_POLL_MS = 5 * 60_000;

// Cached data that belongs to whoever is signed in: the IAM profile and
// "my ratings". Film data and public ratings are the same for everyone.
const PERSONAL_QUERY_KEYS = [["iam"], ["ratings", "mine"]];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [claims, setClaims] = useState<Record<string, unknown> | undefined>();
  const queryClient = useQueryClient();

  // Without this, logging out and in as someone else in the same tab would
  // keep showing the previous person's name, avatar and ratings until the
  // cache went stale.
  const forgetPersonalData = useCallback(() => {
    for (const queryKey of PERSONAL_QUERY_KEYS) queryClient.removeQueries({ queryKey });
  }, [queryClient]);

  // The session's source of truth is IAM's GET /iam/v4/auth/me
  // (blocksClient.auth.userInfo()), not a token this app can inspect --
  // IAM keeps the session in a Secure, httpOnly cookie that never reaches
  // this app's JS, so a successful call here is what "signed in" means,
  // not the presence of an in-memory access token.
  const refresh = useCallback(async () => {
    const sessionClaims = await fetchSessionClaims();
    setClaims(sessionClaims);
    setStatus(sessionClaims ? "authenticated" : "unauthenticated");
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(refresh, STATUS_POLL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") void refresh();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  // Fires when a reactive 401 forced a refresh and IAM rejected the refresh
  // token outright (invalid_grant) -- blocks/auth.ts already ended the
  // session server-side, this just gets the UI to notice and redirect.
  useEffect(() => onSessionExpired(() => void refresh()), [refresh]);

  // On success, resolves only once `status` has flipped, so the caller can
  // navigate straight afterwards without racing the guard.
  const signIn = useCallback(async (params: { email: string; password: string; rememberMe: boolean }) => {
    const result = await loginWithPassword(params);
    if (result.ok) {
      forgetPersonalData();
      await refresh();
    }
    return result;
  }, [forgetPersonalData, refresh]);

  const logout = useCallback(async () => {
    await endSession();
    forgetPersonalData();
    await refresh();
  }, [forgetPersonalData, refresh]);

  const value = useMemo<AuthContextValue>(() => ({
    claims,
    logout,
    refresh,
    signIn,
    status
  }), [claims, logout, refresh, signIn, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
