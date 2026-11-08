"use client";

import { fmtDate, fmtNumber } from "@/lib/format";
import { useLang } from "@/lib/lang-context";
import { rpc } from "@/lib/supabase";
import type { PointsTracking } from "@/lib/types";
import { useRpcData } from "@/lib/use-rpc-data";
import { ErrorCard, Kpi, PageSkeleton } from "./visuals";

// "Total points bought" card and the Date / Points table, newest first.
export function PurchaseSummary({ data, empty }: { data: PointsTracking; empty: string }) {
  const { t, lang } = useLang();
  const rows = [...data.purchases].sort((a, b) => b.purchased_on.localeCompare(a.purchased_on));
  return (
    <>
      <section className="grid-row">
        <Kpi label={t.tracking.total} info="tracking.total" value={fmtNumber(data.total_points)} watch={data.total_points} />
      </section>
      <section className="panel mt">
        <h2 style={{ marginBottom: 14 }}>{t.tracking.purchases}</h2>
        {rows.length ? (
          <div className="table-box">
            <table>
              <thead>
                <tr><th>{t.tracking.colDate}</th><th style={{ textAlign: "end" }}>{t.tracking.colPoints}</th></tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.purchase_id}>
                    <td>{fmtDate(p.purchased_on, lang)}</td>
                    <td style={{ textAlign: "end", fontWeight: 600 }}>{fmtNumber(p.points)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted">{empty}</p>}
      </section>
    </>
  );
}

// One company's purchases, read-only (the Tracking tab of Company results).
export function CompanyPurchases({ companyId }: { companyId: string }) {
  const { t } = useLang();
  const { data, error, reload } = useRpcData<PointsTracking>(
    () => rpc("get_points_tracking", { p_company: companyId }),
    `tracking:${companyId}`,
  );
  if (error) return <ErrorCard message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton rows={1} />;
  return <PurchaseSummary data={data} empty={t.tracking.emptyCompany} />;
}
