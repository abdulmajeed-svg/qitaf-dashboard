"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabase, rpc } from "@/lib/supabase";
import { NAV, homeFor } from "@/lib/format";
import type { Profile } from "@/lib/types";

import { ProfileContext } from "@/lib/profile-context";
import { useLang } from "@/lib/lang-context";
import { ToastProvider } from "@/lib/toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlossaryButton } from "@/components/glossary";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sb = getSupabase();
      const { data } = await sb.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      try {
        const p = await rpc<Profile | null>("my_profile");
        if (cancelled) return;
        if (!p || !p.role || !NAV[p.role]) {
          await sb.auth.signOut();
          router.replace("/login?msg=noaccess");
          return;
        }
        setProfile(p);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "");
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  // Route protection by role. Unknown path for this role -> that role's home page.
  const allowed = profile ? NAV[profile.role].some((n) => n.href === pathname) : false;
  useEffect(() => {
    if (profile && !allowed) router.replace(homeFor(profile.role));
  }, [profile, allowed, router]);

  async function signOut() {
    await getSupabase().auth.signOut();
    router.replace("/login");
  }

  if (loadError !== null) {
    return (
      <main className="login">
        <div className="login-card">
          <h1>{t.header.couldNotLoadAccount}</h1>
          {loadError ? <p className="muted" role="alert">{loadError}</p> : null}
          <button type="button" className="btn" onClick={() => location.reload()}>{t.common.tryAgain}</button>
        </div>
      </main>
    );
  }
  if (!profile || !allowed) return <main className="login"><p className="muted" role="status">{t.common.loading}</p></main>;

  const roleText = profile.role === "COMPANY_HR" ? profile.company_name || t.roles.COMPANY_HR : t.roles[profile.role];

  return (
    <ProfileContext.Provider value={profile}>
      <ToastProvider>
      <div className="wrap">
        <header className="topbar">
          <div className="brand">
            <span className="brand-logo">
              {/* Logo files are used exactly as supplied: never recoloured, stretched or boxed. 50px high minimum. */}
              <img className="logo-dark" src="/brand/qitaf-logo-main-white.svg" alt={t.header.logoAlt} width={81} height={50} />
              <img className="logo-light" src="/brand/qitaf-logo-main-purple.svg" alt={t.header.logoAlt} width={81} height={50} />
            </span>
            <span className="brand-divider" aria-hidden="true" />
            <div>
              <div className="brand-name">{t.header.insights}</div>
              <div className="small muted">{roleText}</div>
            </div>
          </div>          <nav className="nav" aria-label={t.header.sections}>
            {NAV[profile.role].map((n) => (
              <Link key={n.href} href={n.href} aria-current={pathname === n.href ? "page" : undefined}>{t.nav[n.label]}</Link>
            ))}
          </nav>
          <div className="who">
            <GlossaryButton role={profile.role} />
            <button type="button" className="btn-ghost lang-btn" onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              aria-label={t.header.switchLanguage} title={t.header.switchLanguage}>
              {/* Globe */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
              </svg>
            </button>
            <ThemeToggle />
            <span className="small muted" dir="ltr">{profile.email}</span>
            <button type="button" className="btn-ghost" onClick={signOut}>{t.header.signOut}</button>
          </div>
        </header>
        <main>{children}</main>
      </div>
      </ToastProvider>
    </ProfileContext.Provider>
  );
}
