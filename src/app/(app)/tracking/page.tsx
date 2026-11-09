"use client";

import { useEffect, useState } from "react";
import { rpc } from "@/lib/supabase";
import { useRpcData } from "@/lib/use-rpc-data";
import { useLang } from "@/lib/lang-context";
import { useProfile } from "@/lib/profile-context";
import type { CompanyRef, PointsTracking } from "@/lib/types";
import { ErrorCard, PageHead, PageSkeleton } from "@/components/visuals";
import { AddPurchase } from "@/components/add-purchase";
import { PurchaseSummary } from "@/components/purchases";

// Admin: the Add purchase form; the company chosen in it shows its purchases below.
function AdminTracking() {
  const { t } = useLang();
  const [companies, setCompanies] = useState<CompanyRef[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyRef | null>(null);

  useEffect(() => {
    rpc<CompanyRef[]>("list_companies").then(setCompanies).catch((e: Error) => setListError(e.message));
  }, []);

  const { data, error, reload } = useRpcData<PointsTracking>(
    () => rpc("get_points_tracking", { p_company: company?.company_id ?? null }),
    company ? `tracking:${company.company_id}` : null, // nothing to load until a company is chosen
  );

  return (
    <>
      <PageHead title={t.tracking.title} sub={t.tracking.sub} />
      {listError ? <p className="error">{t.tracking.listFailed(listError)}</p> : null}
      <AddPurchase companies={companies} company={company} onCompanyChange={setCompany} onAdded={reload} />
      {!company ? <p className="muted mt">{t.tracking.hint}</p> : (
        <>
          <h2 className="mt" style={{ marginBottom: 14 }}>{company.name}</h2>
          {error ? <ErrorCard message={error} onRetry={reload} />
            : !data ? <PageSkeleton rows={1} />
            : <PurchaseSummary data={data} empty={t.tracking.emptyCompany} />}
        </>
      )}
    </>
  );
}

// Company HR: their own company's total and purchases.
function OwnTracking() {
  const { t } = useLang();
  const { data, error, reload } = useRpcData<PointsTracking>(
    () => rpc("get_points_tracking", { p_company: null }),
    "tracking:own",
  );
  if (error) return <ErrorCard message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton rows={1} />;
  return (
    <>
      <PageHead title={t.tracking.title} sub={t.tracking.sub} onRefresh={reload} />
      <PurchaseSummary data={data} empty={t.tracking.empty} />
    </>
  );
}

// STC has no Tracking page: the menu leaves it out, so /tracking redirects STC to the STC view, and this
// never asks the database for STC either way.
export default function TrackingPage() {
  const { role } = useProfile();
  if (role === "STC") return null;
  return role === "ADMIN" ? <AdminTracking /> : <OwnTracking />;
}
