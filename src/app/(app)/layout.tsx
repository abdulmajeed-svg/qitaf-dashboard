"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabase, rpc } from "@/lib/supabase";
import { NAV, homeFor } from "@/lib/format";
import type { Profile } from "@/lib/types";

import { ProfileContext } from "@/lib/profile-context";
import { ToastProvider } from "@/lib/toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlossaryButton } from "@/components/glossary";

const ROLE_LABEL = { ADMIN: "Asalah admin", STC: "STC", COMPANY_HR: "Company HR" } as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Could not load your account");
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

  if (loadError) {
    return (
      <main className="login">
        <div className="login-card">
          <h1>Could not load your account</h1>
          <p className="muted" role="alert">{loadError}</p>
          <button type="button" className="btn" onClick={() => location.reload()}>Try again</button>
        </div>
      </main>
    );
  }
  if (!profile || !allowed) return <main className="login"><p className="muted" role="status">Loading…</p></main>;

  const roleText = profile.role === "COMPANY_HR" ? profile.company_name || ROLE_LABEL.COMPANY_HR : ROLE_LABEL[profile.role];

  return (
    <ProfileContext.Provider value={profile}>
      <ToastProvider>
      <div className="wrap">
        <header className="topbar">
          <div className="brand">
            <span className="brand-logo">
              {/* Logo files are used exactly as supplied: never recoloured, stretched or boxed. 50px high minimum. */}
              <img className="logo-dark" src="/brand/qitaf-logo-main-white.svg" alt="qitaf from stc" width={81} height={50} />
              <img className="logo-light" src="/brand/qitaf-logo-main-purple.svg" alt="qitaf from stc" width={81} height={50} />
            </span>
            <span className="brand-divider" aria-hidden="true" />
            <div>
              <div className="brand-name">Insights</div>
              <div className="small muted">{roleText}</div>
            </div>
          </div>          <nav className="nav" aria-label="Sections">
            {NAV[profile.role].map((n) => (
              <Link key={n.href} href={n.href} aria-current={pathname === n.href ? "page" : undefined}>{n.label}</Link>
            ))}
          </nav>
          <div className="who">
            <GlossaryButton role={profile.role} />
            <ThemeToggle />
            <span className="small muted">{profile.email}</span>
            <button type="button" className="btn-ghost" onClick={signOut}>Sign out</button>
          </div>
        </header>
        <main>{children}</main>
      </div>
      </ToastProvider>
    </ProfileContext.Provider>
  );
}
