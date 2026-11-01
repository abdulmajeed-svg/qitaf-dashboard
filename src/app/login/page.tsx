"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    params.get("msg") === "noaccess" ? "This account has no access yet. Ask Asalah to assign a role." : "",
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError("Email or password is incorrect.");
      setBusy(false);
      return;
    }
    router.replace("/");
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-logo">
          <img className="logo-dark" src="/brand/qitaf-logo-secondary-white.svg" alt="qitaf from stc" width={183} height={56} />
          <img className="logo-light" src="/brand/qitaf-logo-secondary-purple.svg" alt="qitaf from stc" width={183} height={56} />
        </div>
        <h1>Sign in</h1>
        <p className="muted">Qitaf Insights: see your rewards results.</p>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="error" role="alert">{error}</div>
        <button className="btn" type="submit" disabled={busy} style={{ width: "100%", marginTop: 8 }}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
