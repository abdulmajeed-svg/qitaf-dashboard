"use client";

import { LOCALE, fmtDate, fmtNumber } from "@/lib/format";
import { useLang } from "@/lib/lang-context";
import { groupByYear } from "@/lib/purchases";
import { rpc } from "@/lib/supabase";
import type { PointsPurchase, PointsTracking } from "@/lib/types";
import { useRpcData } from "@/lib/use-rpc-data";
import { ErrorCard, Kpi, PageSkeleton } from "./visuals";

const sum = (list: PointsPurchase[]) => list.reduce((s, p) => s + p.points, 0);

// One year: Jan to Dec side by side, each column with its total and its purchases.
// The columns follow the page direction, so in Arabic January is on the right.
function YearCard({ year, months }: { year: number; months: PointsPurchase[][] }) {
  const { t, lang } = useLang();
  const monthName = (m: number) =>
    new Intl.DateTimeFormat(LOCALE[lang], { month: "short", timeZone: "UTC" }).format(Date.UTC(year, m, 1));
  return (
    <section className="panel mt">
      <div className="year-head">
        <h3>{year}</h3>
        <span className="small">{t.tracking.yearTotal} <bdi dir="ltr"><strong>{fmtNumber(sum(months.flat()))}</strong></bdi></span>
      </div>
      <div className="months">
        {months.map((list, m) => (
          <div key={m} className={`month ${list.length ? "has" : ""}`}>
            <div className="month-name">{monthName(m)}</div>
            <div className="month-total">
              <span className="sr-only">{t.tracking.monthTotal} </span>
              <bdi dir="ltr">{list.length ? fmtNumber(sum(list)) : "—"}</bdi>
            </div>
            {list.length ? (
              <ul className="month-list">
                {list.map((p) => (
                  <li key={p.purchase_id}>
                    <span className="small muted">{fmtDate(p.purchased_on, lang)}</span>
                    <bdi dir="ltr" className="month-pts">{fmtNumber(p.points)}</bdi>
                    {p.note ? <span className="small muted month-note">{p.note}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

// "Total points bought" card, then the purchases year by year, month by month.
export function PurchaseSummary({ data, empty }: { data: PointsTracking; empty: string }) {
  const { t } = useLang();
  const years = groupByYear(data.purchases);
  return (
    <>
      <section className="grid-row">
        <Kpi label={t.tracking.total} info="tracking.total" value={fmtNumber(data.total_points)} watch={data.total_points} />
      </section>
      {years.length ? (
        <>
          <h2 className="mt">{t.tracking.purchases}</h2>
          {years.map((y) => <YearCard key={y.year} {...y} />)}
        </>
      ) : (
        <section className="panel mt">
          <h2 style={{ marginBottom: 14 }}>{t.tracking.purchases}</h2>
          <p className="muted">{empty}</p>
        </section>
      )}
    </>
  );
}

// One company's purchases, read-only (the Tracking tab of Company results, Admin only).
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
