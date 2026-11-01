"use client";

import { useEffect, useState } from "react";
import { rpc } from "@/lib/supabase";
import { useRpcData } from "@/lib/use-rpc-data";
import { fmtTime } from "@/lib/format";
import type { CompanyDashboard, CompanyRef } from "@/lib/types";
import { ErrorCard, PageHead, PageSkeleton } from "@/components/visuals";
import { CompanyView } from "@/components/company-view";
import { useProfile } from "@/lib/profile-context";

export default function CompanyPage() {
  const profile = useProfile();
  const isAdmin = profile.role === "ADMIN";
  const [companies, setCompanies] = useState<CompanyRef[]>([]);
  const [company, setCompany] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  // Admin: load the company list and default to the first company. Company HR never sees a picker.
  useEffect(() => {
    if (!isAdmin) return;
    rpc<CompanyRef[]>("list_companies")
      .then((list) => {
        setCompanies(list);
        setCompany(list[0]?.company_id ?? null);
      })
      .catch((e: Error) => setListError(e.message));
  }, [isAdmin]);

  // Company HR always passes null; the database picks their own company.
  const key = isAdmin ? company : "own";
  const { data: d, error, updated, reload } = useRpcData<CompanyDashboard>(
    () => rpc("get_company_dashboard", { p_company: isAdmin ? company : null }),
    key,
  );

  if (listError) return <ErrorCard message={listError} onRetry={() => location.reload()} />;

  const picker = isAdmin ? (
    <>
      <label className="small muted" htmlFor="company-picker">Company</label>
      <select id="company-picker" value={company ?? ""} onChange={(e) => setCompany(e.target.value)}>
        {companies.map((c) => <option key={c.company_id} value={c.company_id}>{c.name}</option>)}
      </select>
    </>
  ) : null;

  if (error) return <ErrorCard message={error} onRetry={reload} />;
  if (!d) return <PageSkeleton />;

  return (
    <>
      <PageHead
        title={d.company.name}
        extra={picker}
        updated={updated}
        onRefresh={reload}
        fmt={fmtTime}
      />
      <CompanyView d={d} />
    </>
  );
}
