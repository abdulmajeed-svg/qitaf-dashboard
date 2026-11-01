"use client";

import { useMemo, useState } from "react";
import { rpc } from "@/lib/supabase";
import { useRpcData } from "@/lib/use-rpc-data";
import { ITEM_COLS, fmtDate, fmtTime, minResponses, responseRateTip, tileColors, validResponses } from "@/lib/format";
import { downloadCsv, today } from "@/lib/csv";
import type { CompanyDashboard, Portfolio, PortfolioCompany } from "@/lib/types";
import {
  ActionsList, AnimatedNumber, ErrorCard, H2, Kpi, PageHead, PageSkeleton, ReportChip, actionStatusText, reportChipText,
} from "@/components/visuals";
import { CompanyView } from "@/components/company-view";
import { Drawer } from "@/components/drawer";
import { Tip } from "@/components/tip";
import { InfoButton } from "@/components/info-button";
import { itemMetricId, type MetricId } from "@/lib/metric-info";

type Filter = "all" | "available" | "waiting" | "pilot";
type Sort = { key: string; dir: "asc" | "desc" } | null;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "available", label: "Results available" },
  { id: "waiting", label: "Waiting for responses" },
  { id: "pilot", label: "Pilot" },
];
const STATUS_ORDER = { REPORTABLE: 0, SUPPRESSED: 1, NO_RESPONSES: 2 } as const;

// Sort value per column. null (hidden / not available) always sorts last and is never compared.
function sortValue(c: PortfolioCompany, key: string): string | number | null {
  switch (key) {
    case "name": return c.name;
    case "status": return STATUS_ORDER[c.status];
    case "rate": return c.response_rate;
    case "csat": return c.csat ?? null;
    case "actions": return c.open_actions;
    default: return c.items ? c.items[key] ?? null : null;
  }
}

function DrawerBody({ company, onClose }: { company: PortfolioCompany; onClose: () => void }) {
  // Admin only: get_company_dashboard with the chosen company id (this page is admin-only).
  const { data, error, reload } = useRpcData<CompanyDashboard>(
    () => rpc("get_company_dashboard", { p_company: company.company_id }),
    company.company_id,
  );
  return (
    <>
      <div className="drawer-head">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600 }}>{company.name}</h2>
          <div className="small muted" style={{ marginTop: 6 }}>
            {data ? null : "Loading full results"}
          </div>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose} data-autofocus aria-label={`Close ${company.name} results`}>
          Close (Esc)
        </button>
      </div>
      {error ? <ErrorCard message={error} onRetry={reload} /> : !data ? <PageSkeleton rows={3} /> : <CompanyView d={data} />}
    </>
  );
}

export default function PortfolioPage() {
  const { data: d, error, updated, reload } = useRpcData<Portfolio>(() => rpc("get_portfolio"), "portfolio");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!d) return [];
    const needle = q.trim().toLowerCase();
    let r = d.companies.filter((c) => {
      if (needle && !c.name.toLowerCase().includes(needle)) return false;
      if (filter === "available") return c.status === "REPORTABLE";
      if (filter === "waiting") return c.status !== "REPORTABLE";
      if (filter === "pilot") return c.record_type === "PILOT";
      return true;
    });
    if (sort) {
      const { key, dir } = sort;
      r = [...r].sort((a, b) => {
        const va = sortValue(a, key);
        const vb = sortValue(b, key);
        if (va === null && vb === null) return 0;
        if (va === null) return 1; // hidden always last, whichever direction
        if (vb === null) return -1;
        const cmp = typeof va === "string" ? va.localeCompare(vb as string) : va - (vb as number);
        return dir === "asc" ? cmp : -cmp;
      });
    }
    return r;
  }, [d, q, filter, sort]);

  if (error) return <ErrorCard message={error} onRetry={reload} />;
  if (!d) return <PageSkeleton rows={5} />;
  const k = d.kpi;
  const open = d.companies.find((c) => c.company_id === openId) ?? null;

  const toggleSort = (key: string) =>
    setSort((s) => (s && s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" ? "asc" : "desc" }));
  const sortMark = (key: string) => (sort && sort.key === key ? (sort.dir === "asc" ? " ▲" : " ▼") : "");
  const ariaSort = (key: string) => (sort && sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none");
  const th = (key: string, label: string, info?: MetricId, center?: boolean) => (
    <th key={key} aria-sort={ariaSort(key)} style={center ? { textAlign: "center" } : undefined}>
      <div className={`th-inner ${center ? "center" : ""}`}>
        <button type="button" className="th-btn" onClick={() => toggleSort(key)} aria-label={`Sort by ${label}`}>
          {label}{sortMark(key)}
        </button>
        {info ? <InfoButton id={info} /> : null}
      </div>
    </th>
  );

  // CSV exports exactly the rows shown after search, filter and sort. Hidden stays "Hidden".
  const exportCompanies = () =>
    downloadCsv(`qitaf-portfolio-${today()}.csv`,
      ["Company", "Pilot", "Results status", "Valid responses", "Response rate %", ...ITEM_COLS.map(([, l]) => l), "Satisfied %", "Open actions"],
      rows.map((c) => [
        c.name,
        c.record_type === "PILOT" ? "Yes" : "No",
        reportChipText(c.status, c.responded, minResponses(c.min_responses)),
        c.responded,
        c.response_rate !== null ? c.response_rate : "Not confirmed",
        ...ITEM_COLS.map(([code]) => {
          const v = c.items ? c.items[code] : null;
          return v === null || v === undefined ? "Hidden" : Number(v).toFixed(1);
        }),
        c.csat !== null && c.csat !== undefined ? c.csat : "—",
        c.open_actions,
      ]));

  const exportActions = () =>
    downloadCsv(`qitaf-actions-${today()}.csv`,
      ["Company", "Recommendation", "Issue", "Next step", "Owner", "Priority", "Status", "Due date"],
      d.actions.map((a) => [a.company, a.recommendation, a.issue, a.next_step, a.owner, a.priority, actionStatusText(a), a.due_date ? fmtDate(a.due_date) : ""]));

  return (
    <>
      <PageHead title="Portfolio" sub="All companies in the program, their results status and follow-up."
        updated={updated} onRefresh={reload} fmt={fmtTime} />
      <section className="grid-row">
        <Kpi label="Companies" info="portfolio.companies" value={<AnimatedNumber value={k.companies} />} watch={k.companies} note={`${k.reportable} with results available`} />
        <Kpi label="Employee answers" info="portfolio.answers" value={<AnimatedNumber value={k.responses} />} watch={k.responses} note="Accepted answers" />
        <Kpi label="Waiting for more responses" info="portfolio.below" value={<AnimatedNumber value={k.below_threshold} />} watch={k.below_threshold}
          note="Fewer than the minimum valid responses" color="var(--amber)" />
        <Kpi label="Open actions" info="portfolio.actions" value={<AnimatedNumber value={k.open_actions} />} watch={k.open_actions} note={`${k.high_priority} high priority`} />
        <Kpi label="In review queue" info="portfolio.review" value={<AnimatedNumber value={k.in_review_queue} />} watch={k.in_review_queue}
          note="Answers that failed validation" color={k.in_review_queue ? "var(--alert-text)" : undefined} />
      </section>

      <section className="panel mt">
        <div className="panel-head">
          <div>
            <H2 info="heat.colours">Company heatmap</H2>
            <p className="section-sub">Average employee scores from 1 to 5. Hidden means the company has fewer than the minimum valid responses for its survey round. Select a company to see its full results.</p>
          </div>
          <button type="button" className="btn-ghost" onClick={exportCompanies} disabled={!rows.length}>Download CSV</button>
        </div>

        <div className="toolbar">
          <label className="sr-only" htmlFor="company-search">Search companies</label>
          <input id="company-search" type="search" placeholder="Search companies" value={q} onChange={(e) => setQ(e.target.value)} />
          <div role="group" aria-label="Filter by status" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FILTERS.map((f) => (
              <button key={f.id} type="button" className="filter-chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <span className="small muted" role="status">{rows.length} of {d.companies.length} companies</span>
        </div>

        <div className="table-box">
          <table>
            <thead>
              <tr>
                {th("name", "Company")}
                {th("status", "Results status", "heat.status")}
                {th("rate", "Response rate", "heat.rate")}
                {ITEM_COLS.map(([code, l]) => th(code, l, itemMetricId(code), true))}
                {th("csat", "Satisfied", "heat.satisfied", true)}
                {th("actions", "Actions", "heat.actions", true)}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={11} className="muted" style={{ textAlign: "center", borderRadius: 10 }}>No companies match.</td></tr>
              ) : rows.map((c) => (
                <tr key={c.company_id} className="row-click" onClick={() => setOpenId(c.company_id)}>
                  <td>
                    <button type="button" className="row-btn" onClick={(e) => { e.stopPropagation(); setOpenId(c.company_id); }}
                      aria-haspopup="dialog" aria-label={`Open full results for ${c.name}`}>
                      {c.name}
                    </button>
                    {c.record_type === "PILOT" ? <> <span className="chip chip-off">Pilot</span></> : null}
                    <div className="small muted">{validResponses(c.responded)}</div>
                  </td>
                  <td><ReportChip status={c.status} n={c.responded} min={minResponses(c.min_responses)} /></td>
                  <td>
                    <Tip text={responseRateTip(c.invited, c.responded, c.response_rate)}>
                      {c.response_rate !== null && c.invited !== null ? (
                        <>
                          <div className="rate">
                            <div className="bar"><i style={{ width: `${Math.min(c.response_rate, 100)}%` }} /></div>
                            {c.response_rate}%
                          </div>
                          <div className="small muted" style={{ marginTop: 4 }}>{c.responded} of {c.invited}</div>
                        </>
                      ) : <span className="small muted">Invited not confirmed</span>}
                    </Tip>
                  </td>
                  {ITEM_COLS.map(([code, label]) => {
                    const v = c.items ? c.items[code] : null;
                    if (v === null || v === undefined) {
                      return (
                        <td key={code} className="cell-hidden">
                          <Tip text={`${c.name}, ${label}: Hidden: fewer than ${minResponses(c.min_responses)} valid responses`}>Hidden</Tip>
                        </td>
                      );
                    }
                    const [bg, fg] = tileColors(v);
                    return (
                      <td key={code} className="cell" style={{ background: bg, color: fg }}>
                        <Tip text={`${c.name}, ${label}: ${Number(v).toFixed(1)} out of 5, ${validResponses(c.responded)} in this company`}>
                          {Number(v).toFixed(1)}
                        </Tip>
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "center" }}>
                    {c.csat !== null && c.csat !== undefined ? `${c.csat}%` : <span className="small muted">—</span>}
                  </td>
                  <td style={{ textAlign: "center" }}>{c.open_actions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel mt">
        <div className="panel-head">
          <div>
            <H2 info="portfolio.actions">Open actions</H2>
            <p className="section-sub">Across all companies, soonest first.</p>
          </div>
          <button type="button" className="btn-ghost" onClick={exportActions} disabled={!d.actions.length}>Download CSV</button>
        </div>
        <ActionsList list={d.actions} showCompany />
      </section>
      <p className="footer-note">Survey answers, not verified STC transactions.</p>

      {open ? (
        <Drawer label={`${open.name} full results`} onClose={() => setOpenId(null)}>
          <DrawerBody company={open} onClose={() => setOpenId(null)} />
        </Drawer>
      ) : null}
    </>
  );
}
