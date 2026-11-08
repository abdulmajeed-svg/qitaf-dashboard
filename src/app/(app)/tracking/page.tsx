"use client";

import { useEffect, useState } from "react";
import { rpc } from "@/lib/supabase";
import { useRpcData } from "@/lib/use-rpc-data";
import { fmtDate, fmtNumber, fmtTime } from "@/lib/format";
import { useLang } from "@/lib/lang-context";
import { useProfile } from "@/lib/profile-context";
import type { CompanyRef, PointsTracking } from "@/lib/types";
import { ErrorCard, Kpi, PageHead, PageSkeleton } from "@/components/visuals";
import { AddPurchase } from "@/components/add-purchase";

export default function TrackingPage() {
  const { t, lang } = useLang();
  const { role } = useProfile();
  const canPick = role === "ADMIN" || role === "STC"; // Company HR always see only their own company
  const [companies, setCompanies] = useState<CompanyRef[]>([]);
  const [company, setCompany] = useState(""); // "" = all companies
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    if (!canPick) return;
    rpc<CompanyRef[]>("list_companies").then(setCompanies).catch((e: Error) => setListError(e.message));
  }, [canPick]);

  const { data: d, error, updated, reload } = useRpcData<PointsTracking>(
    () => rpc("get_points_tracking", { p_company: canPick && company ? company : null }),
    canPick ? `tracking:${company}` : "tracking:own",
  );

  if (error) return <ErrorCard message={error} onRetry={reload} />;
  if (!d) return <PageSkeleton rows={1} />;

  // The page still works without the list (all companies); only the picker needs it.
  const picker = !canPick ? null : listError ? <span className="small muted">{t.tracking.listFailed(listError)}</span> : (
    <>
      <label className="small muted" htmlFor="tracking-company">{t.company.picker}</label>
      <select id="tracking-company" value={company} onChange={(e) => setCompany(e.target.value)}>
        <option value="">{t.tracking.allCompanies}</option>
        {companies.map((c) => <option key={c.company_id} value={c.company_id}>{c.name}</option>)}
      </select>
    </>
  );
  const purchases = [...d.purchases].sort((a, b) => b.purchased_on.localeCompare(a.purchased_on)); // newest first

  return (
    <>
      <PageHead title={t.tracking.title} sub={t.tracking.sub} extra={picker} updated={updated} onRefresh={reload} fmt={fmtTime} />
      <section className="grid-row">
        <Kpi label={t.tracking.total} info="tracking.total" value={fmtNumber(d.total_points)} watch={d.total_points} />
      </section>

      {role === "ADMIN" ? <AddPurchase companies={companies} onAdded={reload} /> : null}

      <section className="panel mt">
        <h2 style={{ marginBottom: 14 }}>{t.tracking.purchases}</h2>
        {purchases.length ? (
          <div className="table-box">
            <table>
              <thead>
                <tr>
                  <th>{t.tracking.colDate}</th>
                  {canPick ? <th>{t.tracking.colCompany}</th> : null}
                  <th style={{ textAlign: "end" }}>{t.tracking.colPoints}</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.purchase_id}>
                    <td>{fmtDate(p.purchased_on, lang)}</td>
                    {canPick ? <td>{p.company}</td> : null}
                    <td style={{ textAlign: "end", fontWeight: 600 }}>{fmtNumber(p.points)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted">{t.tracking.empty}</p>}
      </section>
    </>
  );
}
