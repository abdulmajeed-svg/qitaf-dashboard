"use client";

import { useEffect, useState } from "react";
import { rpc } from "@/lib/supabase";
import { useRpcData } from "@/lib/use-rpc-data";
import type { CompanyDashboard, CompanyRef } from "@/lib/types";
import { ErrorCard, PageHead, PageSkeleton } from "@/components/visuals";
import { CompanyView } from "@/components/company-view";
import { CompanySearch } from "@/components/company-search";
import { CompanyPurchases } from "@/components/purchases";
import { useProfile } from "@/lib/profile-context";
import { useLang } from "@/lib/lang-context";

const TABS = ["survey", "tracking"] as const;
type Tab = (typeof TABS)[number];

export default function CompanyPage() {
  const { t } = useLang();
  const profile = useProfile();
  const canPick = profile.role === "ADMIN" || profile.role === "STC";
  const [companies, setCompanies] = useState<CompanyRef[]>([]);
  const [company, setCompany] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("survey"); // kept when the company changes

  // Admin and STC: load the company list and default to the first company. Company HR never sees a picker.
  useEffect(() => {
    if (!canPick) return;
    rpc<CompanyRef[]>("list_companies")
      .then((list) => {
        setCompanies(list);
        setCompany(list[0]?.company_id ?? null);
      })
      .catch((e: Error) => setListError(e.message));
  }, [canPick]);

  // Company HR always passes null; the database picks their own company.
  const key = canPick ? company : "own";
  const { data: d, error, reload } = useRpcData<CompanyDashboard>(
    () => rpc("get_company_dashboard", { p_company: canPick ? company : null }),
    key,
  );

  if (listError) return <ErrorCard message={listError} onRetry={() => location.reload()} />;

  const picker = canPick ? (
    <>
      <label className="small muted" htmlFor="company-picker">{t.company.picker}</label>
      <CompanySearch id="company-picker" companies={companies}
        value={companies.find((c) => c.company_id === company) ?? null} onChange={(c) => setCompany(c.company_id)} />
    </>
  ) : null;

  // Admin only (STC has no Tracking): Survey results / Tracking tabs under the company name.
  // Two tabs, so either arrow key switches.
  const showTabs = profile.role === "ADMIN";
  const tabs = showTabs ? (
    <div className="tabs" role="tablist" aria-label={t.nav.companyResults}>
      {TABS.map((id) => (
        <button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls="company-tabpanel"
          tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)}
          onKeyDown={(e) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            const next = id === "survey" ? "tracking" : "survey";
            setTab(next);
            document.getElementById(`tab-${next}`)?.focus();
          }}>
          {id === "survey" ? t.nav.surveyResults : t.nav.tracking}
        </button>
      ))}
    </div>
  ) : null;

  if (error) return <ErrorCard message={error} onRetry={reload} />;
  if (!d) return <PageSkeleton />;

  return (
    <>
      <PageHead
        title={d.company.name}
        sub={tabs}
        extra={picker}
        onRefresh={reload}
      />
      {showTabs ? (
        <div role="tabpanel" id="company-tabpanel" aria-labelledby={`tab-${tab}`}>
          {tab === "tracking" ? <CompanyPurchases companyId={d.company.company_id} /> : <CompanyView d={d} />}
        </div>
      ) : <CompanyView d={d} />}
    </>
  );
}
