import { useState, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, Loader2, LogOut, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button, Field, inputClass } from "./ui";
import { Logo } from "./Logo";

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4"><Logo size={36} /></h1>
        {children}
      </div>
    </div>
  );
}

export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <Shell>
      <p className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" /> {label}
      </p>
    </Shell>
  );
}

/** Shown while the signed-in user's data loads from Supabase, or if that failed. */
export function DataLoadScreen({ error }: { error: string | null }) {
  const { signOut } = useAuth();
  if (!error) return <LoadingScreen label="Loading your data…" />;
  return (
    <Shell>
      <p className="mt-2 flex items-start gap-2 text-sm text-rose-700">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" /> Could not load your data: {error}
      </p>
      <div className="mt-4 flex gap-2">
        <Button onClick={() => window.location.reload()}>Try again</Button>
        <Button variant="secondary" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </Shell>
  );
}

/** The signed-in login is not on the staff list, so the database shows it nothing. */
function UnlinkedScreen() {
  const { email, signOut } = useAuth();
  return (
    <Shell>
      <p className="mt-2 text-sm text-slate-600">
        You are signed in as <span className="font-medium text-slate-800">{email}</span>, but that email is not set up with a role yet. Ask your administrator to add it
        to the team list, then sign in again.
      </p>
      <Button variant="secondary" className="mt-4" onClick={() => void signOut()}>
        <LogOut size={14} /> Sign out
      </Button>
    </Shell>
  );
}

function LoginScreen() {
  const { signInWithPassword, sendMagicLink, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setError(await signInWithPassword(email, password));
    setBusy(false);
  };

  const link = async () => {
    if (!email.trim()) return setError("Enter your email first.");
    setBusy(true);
    setError(null);
    const err = await sendMagicLink(email);
    setError(err);
    setSent(err ? null : "Check your inbox for a sign-in link.");
    setBusy(false);
  };

  const reset = async () => {
    if (!email.trim()) return setError("Enter your email first.");
    setBusy(true);
    setError(null);
    const err = await sendPasswordReset(email);
    setError(err);
    setSent(err ? null : "Check your inbox for a link to choose a new password.");
    setBusy(false);
  };

  return (
    <Shell>
      <p className="mb-4 text-sm text-slate-500">Sign in with your work email.</p>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Email">
          <input type="email" autoComplete="username" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <input type="password" autoComplete="current-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-rose-700">{error}</p>}
        {sent && <p className="text-sm text-emerald-700">{sent}</p>}
        <Button type="submit" disabled={busy || !password} className="w-full justify-center">
          {busy ? <Loader2 size={14} className="animate-spin" /> : null} Sign in
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={() => void link()} className="w-full justify-center">
          <Mail size={14} /> Email me a sign-in link instead
        </Button>
        <button type="button" disabled={busy} onClick={() => void reset()} className="w-full text-center text-xs text-slate-500 hover:underline">
          Forgot your password, or got an invite? Set a password
        </button>
      </form>
    </Shell>
  );
}

/** After an invite or reset link: the person is signed in but still has to choose a password. */
function SetPasswordScreen() {
  const { setPassword, email } = useAuth();
  const [password, setValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords do not match.");
    setBusy(true);
    setError(await setPassword(password));
    setBusy(false);
  };

  return (
    <Shell>
      <p className="mb-4 text-sm text-slate-500">Choose a password for {email}.</p>
      <form onSubmit={submit} className="space-y-3">
        <Field label="New password">
          <input type="password" autoComplete="new-password" className={inputClass} value={password} onChange={(e) => setValue(e.target.value)} />
        </Field>
        <Field label="Confirm password">
          <input type="password" autoComplete="new-password" className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-rose-700">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full justify-center">
          {busy ? <Loader2 size={14} className="animate-spin" /> : null} Save password
        </Button>
      </form>
    </Shell>
  );
}

/** Shows the sign-in page until there is a signed-in, linked user. The offline demo skips it. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status, needsPassword } = useAuth();
  if (needsPassword && (status === "ready" || status === "unlinked")) return <SetPasswordScreen />;
  if (status === "demo" || status === "ready") return <>{children}</>;
  if (status === "loading") return <LoadingScreen />;
  if (status === "unlinked") return <UnlinkedScreen />;
  return <LoginScreen />;
}
