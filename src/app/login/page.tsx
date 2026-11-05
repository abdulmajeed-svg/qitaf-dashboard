"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { useLang } from "@/lib/lang-context";

function LoginForm() {
  const { t } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  // Which message to show, so it follows a language switch.
  const [error, setError] = useState<"" | "noAccess" | "wrongLogin">(params.get("msg") === "noaccess" ? "noAccess" : "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError("wrongLogin");
      setBusy(false);
      return;
    }
    router.replace("/");
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-logo">
          <img className="logo-dark" src="/brand/qitaf-logo-secondary-white.svg" alt={t.header.logoAlt} width={183} height={56} />
          <img className="logo-light" src="/brand/qitaf-logo-secondary-purple.svg" alt={t.header.logoAlt} width={183} height={56} />
        </div>
        <h1>{t.login.signIn}</h1>
        <p className="muted">{t.login.tagline}</p>
        <div className="field">
          <label htmlFor="email">{t.login.email}</label>
          <input id="email" type="email" dir="ltr" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">{t.login.password}</label>
          <input id="password" type="password" dir="ltr" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="error" role="alert">{error ? t.login[error] : ""}</div>
        <button className="btn" type="submit" disabled={busy} style={{ width: "100%", marginTop: 8 }}>
          {busy ? t.login.signingIn : t.login.signIn}
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
