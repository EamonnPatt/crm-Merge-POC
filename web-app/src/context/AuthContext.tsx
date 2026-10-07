import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

/**
 * loading: checking for a saved session · signed_out: show the sign-in page ·
 * unlinked: signed in, but the email is not on the staff list (app_users) · ready: signed in with a role.
 * "demo" is the no-database mode used when the VITE_SUPABASE_* variables are missing.
 */
export type AuthStatus = "demo" | "loading" | "signed_out" | "unlinked" | "ready";

interface AuthContextValue {
  status: AuthStatus;
  email: string | null;
  /** The signed-in person's id in app_users (U-03), once linked. */
  appUserId: string | null;
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  sendMagicLink: (email: string) => Promise<string | null>;
  sendPasswordReset: (email: string) => Promise<string | null>;
  /** True after following an invite or reset link, until the person has chosen a password. */
  needsPassword: boolean;
  setPassword: (password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

// Read at import time, before supabase-js consumes the link's #hash. Invite and password-reset emails land here.
const arrivedByEmailLink = typeof window !== "undefined" && /type=(invite|recovery)/.test(window.location.hash);

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [appUserId, setAppUserId] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(arrivedByEmailLink);
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? "loading" : "demo");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setStatus("signed_out");
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) {
        setAppUserId(null);
        setStatus("signed_out");
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Look up who this login is. my_id() is null until the email matches a staff row, so an unlinked login sees nothing.
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setStatus("loading");
    supabase
      .from("app_users")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setAppUserId(data?.id ?? null);
        setStatus(data ? "ready" : "unlinked");
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? error.message : null;
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    // shouldCreateUser: false so a stranger cannot make themselves an account; only existing logins get a link.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
    });
    return error ? error.message : null;
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    return error ? error.message : null;
  }, []);

  const setPassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return error.message;
    setNeedsPassword(false);
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value: AuthContextValue = {
    status,
    email: session?.user.email ?? null,
    appUserId,
    signInWithPassword,
    sendMagicLink,
    sendPasswordReset,
    needsPassword,
    setPassword,
    signOut,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
