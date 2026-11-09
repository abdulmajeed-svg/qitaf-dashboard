"use client";

import { useMemo, useState } from "react";
import { rpc } from "@/lib/supabase";
import { useRpcData } from "@/lib/use-rpc-data";
import { ITEM_COLS, fmtDate, minResponses, tileColors, today } from "@/lib/format";
import { DICT } from "@/lib/i18n";
import { useLang } from "@/lib/lang-context";
import { downloadCsv } from "@/lib/csv";
import type { CompanyDashboard, Portfolio, PortfolioCompany } from "@/lib/types";
import {
  ActionsList, AnimatedNumber, BarrierPie, ErrorCard, H2, Kpi, PageHead, PageSkeleton, ReportChip, actionStatusText,
} from "@/components/visuals";
import { CompanyView } from "@/components/company-view";
import { Drawer } from "@/components/drawer";
import { Tip } from "@/components/tip";
import { InfoButton } from "@/components/info-button";
import { itemMetricId, type MetricId } from "@/lib/metric-info";

type Filter = "all" | "available" | "waiting" | "pilot";
type Sort = { key: string; dir: "asc" | "desc" } | null;

const FILTERS: Filter[] = ["all", "available", "waiting", "pilot"];
const STATUS_ORDER = { REPORTABLE: 0, SUPPRESSED: 1, NO_RESPONSES: 2 } as const;
const CSV = DICT.en; // CSV files stay in English whatever the screen language

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
  const { t } = useLang();
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
            {data ? null : t.portfolio.loadingFull}
          </div>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose} data-autofocus aria-label={t.portfolio.closeResults(company.name)}>
          {t.common.closeEsc}
        </button>
      </div>
      {error ? <ErrorCard message={error} onRetry={reload} /> : !data ? <PageSkeleton rows={3} /> : <CompanyView d={data} />}
    </>
  );
}

export default function PortfolioPage() {
  const { t } = useLang();
  const { data: d, error, reload } = useRpcData<Portfolio>(() => rpc("get_portfolio"), "portfolio");
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
  const filterLabel: Record<Filter, string> = {
    all: t.portfolio.filterAll, available: t.portfolio.filterAvailable, waiting: t.portfolio.filterWaiting, pilot: t.portfolio.filterPilot,
  };

  const toggleSort = (key: string) =>
    setSort((s) => (s && s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" ? "asc" : "desc" }));
  const sortMark = (key: string) => (sort && sort.key === key ? (sort.dir === "asc" ? " ▲" : " ▼") : "");
  const ariaSort = (key: string) => (sort && sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none");
  const th = (key: string, label: string, info?: MetricId, center?: boolean) => (
    <th key={key} aria-sort={ariaSort(key)} style={center ? { textAlign: "center" } : undefined}>
      <div className={`th-inner ${center ? "center" : ""}`}>
        <button type="button" className="th-btn" onClick={() => toggleSort(key)} aria-label={t.portfolio.sortBy(label)}>
          {label}{sortMark(key)}
        </button>
        {info ? <InfoButton id={info} /> : null}
      </div>
    </th>
  );

  // CSV exports exactly the rows shown after search, filter and sort. Hidden stays "Hidden".
  const exportCompanies = () =>
    downloadCsv(`qitaf-portfolio-${today()}.csv`,
      ["Company", "Pilot", "Results status", "Valid responses", "Response rate %", ...ITEM_COLS.map((code) => CSV.itemShort[code]), "Satisfied %", "Open actions"],
      rows.map((c) => [
        c.name,
        c.record_type === "PILOT" ? "Yes" : "No",
        CSV.status.reportChip(c.status, c.responded, minResponses(c.min_responses)),
        c.responded,
        c.response_rate !== null ? c.response_rate : "Not confirmed",
        ...ITEM_COLS.map((code) => {
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
      <PageHead title={t.portfolio.title} sub={t.portfolio.sub} onRefresh={reload} />
      <section className="grid-row">
        <Kpi label={t.portfolio.companies} info="portfolio.companies" value={<AnimatedNumber value={k.companies} />} watch={k.companies} note={t.portfolio.companiesNote(k.reportable)} />
        <Kpi label={t.portfolio.answers} info="portfolio.answers" value={<AnimatedNumber value={k.responses} />} watch={k.responses} note={t.portfolio.answersNote} />
        <Kpi label={t.portfolio.below} info="portfolio.below" value={<AnimatedNumber value={k.below_threshold} />} watch={k.below_threshold}
          note={t.portfolio.belowNote} color="var(--amber)" />
        <Kpi label={t.portfolio.openActions} info="portfolio.actions" value={<AnimatedNumber value={k.open_actions} />} watch={k.open_actions} note={t.portfolio.highPriority(k.high_priority)} />
        <Kpi label={t.portfolio.review} info="portfolio.review" value={<AnimatedNumber value={k.in_review_queue} />} watch={k.in_review_queue}
          note={t.portfolio.reviewNote} color={k.in_review_queue ? "var(--alert-text)" : undefined} />
      </section>

      <section className="panel mt">
        <div className="panel-head">
          <div>
            <H2 info="heat.colours">{t.portfolio.heatmap}</H2>
            <p className="section-sub">{t.portfolio.heatmapSub}</p>
          </div>
          <button type="button" className="btn-ghost" onClick={exportCompanies} disabled={!rows.length}>{t.portfolio.downloadCsv}</button>
        </div>

        <div className="toolbar">
          <label className="sr-only" htmlFor="company-search">{t.portfolio.search}</label>
          <input id="company-search" type="search" placeholder={t.portfolio.search} value={q} onChange={(e) => setQ(e.target.value)} />
          <div role="group" aria-label={t.portfolio.filterAria} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FILTERS.map((id) => (
              <button key={id} type="button" className="filter-chip" aria-pressed={filter === id} onClick={() => setFilter(id)}>
                {filterLabel[id]}
              </button>
            ))}
          </div>
          <span className="small muted" role="status">{t.portfolio.shown(rows.length, d.companies.length)}</span>
        </div>

        <div className="table-box">
          <table>
            <thead>
              <tr>
                {th("name", t.portfolio.colCompany)}
                {th("status", t.portfolio.colStatus, "heat.status")}
                {th("rate", t.portfolio.colRate, "heat.rate")}
                {ITEM_COLS.map((code) => th(code, t.itemShort[code], itemMetricId(code), true))}
                {th("csat", t.portfolio.colSatisfied, "heat.satisfied", true)}
                {th("actions", t.portfolio.colActions, "heat.actions", true)}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={11} className="muted" style={{ textAlign: "center", borderRadius: 10 }}>{t.portfolio.noMatch}</td></tr>
              ) : rows.map((c) => (
                <tr key={c.company_id} className="row-click" onClick={() => setOpenId(c.company_id)}>
                  <td>
                    <button type="button" className="row-btn" onClick={(e) => { e.stopPropagation(); setOpenId(c.company_id); }}
                      aria-haspopup="dialog" aria-label={t.portfolio.openResults(c.name)}>
                      {c.name}
                    </button>
                    {c.record_type === "PILOT" ? <> <span className="chip chip-off">{t.portfolio.pilot}</span></> : null}
                    <div className="small muted">{t.common.validResponses(c.responded)}</div>
                  </td>
                  <td><ReportChip status={c.status} n={c.responded} min={minResponses(c.min_responses)} /></td>
                  <td>
                    <Tip text={t.common.rateTip(c.invited, c.responded, c.response_rate)}>
                      {c.response_rate !== null && c.invited !== null ? (
                        <>
                          <div className="rate">
                            <div className="bar"><i style={{ width: `${Math.min(c.response_rate, 100)}%` }} /></div>
                            {c.response_rate}%
                          </div>
                          <div className="small muted" style={{ marginTop: 4 }}>{t.portfolio.rateOf(c.responded, c.invited)}</div>
                        </>
                      ) : <span className="small muted">{t.portfolio.invitedNotConfirmed}</span>}
                    </Tip>
                  </td>
                  {ITEM_COLS.map((code) => {
                    const label = t.itemShort[code];
                    const v = c.items ? c.items[code] : null;
                    if (v === null || v === undefined) {
                      return (
                        <td key={code} className="cell-hidden">
                          <Tip text={t.portfolio.hiddenCellTip(c.name, label, minResponses(c.min_responses))}>{t.common.hidden}</Tip>
                        </td>
                      );
                    }
                    const [bg, fg] = tileColors(v);
                    return (
                      <td key={code} className="cell" style={{ background: bg, color: fg }}>
                        <Tip text={t.portfolio.cellTip(c.name, label, Number(v).toFixed(1), c.responded)}>
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

      {Array.isArray(d.barriers) ? (
        <section className="panel mt">
          <H2 info="portfolio.barriers">{t.company.barriers}</H2>
          <p className="section-sub">{t.portfolio.barriersSub}</p>
          <BarrierPie list={d.barriers} />
        </section>
      ) : null}

      <section className="panel mt">
        <div className="panel-head">
          <div>
            <H2 info="portfolio.actions">{t.portfolio.openActions}</H2>
            <p className="section-sub">{t.portfolio.actionsSub}</p>
          </div>
          <button type="button" className="btn-ghost" onClick={exportActions} disabled={!d.actions.length}>{t.portfolio.downloadCsv}</button>
        </div>
        <ActionsList list={d.actions} showCompany />
      </section>
      <p className="footer-note">{t.common.surveyNotVerified}</p>

      {open ? (
        <Drawer label={t.portfolio.fullResults(open.name)} onClose={() => setOpenId(null)}>
          <DrawerBody company={open} onClose={() => setOpenId(null)} />
        </Drawer>
      ) : null}
    </>
  );
}
