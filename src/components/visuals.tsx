"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ActionRow, Funnel, Item, ReportStatus } from "@/lib/types";
import { barrierText, fmtDate, isOverdue, scoreColor } from "@/lib/format";
import { useLang } from "@/lib/lang-context";
import { useAnimatedNumber, useEntered } from "@/lib/motion";
import { Tip } from "./tip";
import { InfoButton } from "./info-button";
import type { MetricId } from "@/lib/metric-info";

/* ---------- motion helpers ---------- */

// Counts up to a number. The final value is also exposed to screen readers.
export function AnimatedNumber({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const v = useAnimatedNumber(value);
  return (
    <>
      <span aria-hidden="true">{v.toFixed(decimals)}{suffix}</span>
      <span className="sr-only">{value.toFixed(decimals)}{suffix}</span>
    </>
  );
}

// Briefly highlights its panel when `watch` changes after the first render.
export function FlashPanel({ watch, className = "", children }: { watch: unknown; className?: string; children: ReactNode }) {
  const prev = useRef(watch);
  const [flashing, setFlashing] = useState(false);
  useEffect(() => {
    if (prev.current === watch) return;
    prev.current = watch;
    setFlashing(true);
    const t = setTimeout(() => setFlashing(false), 1400);
    return () => clearTimeout(t);
  }, [watch]);
  return <div className={`panel ${className} ${flashing ? "flash" : ""}`}>{children}</div>;
}

/* ---------- charts ---------- */

export function Ring({ pct, size = 150 }: { pct: number; size?: number }) {
  const { t } = useLang();
  const r = 66;
  const c = 2 * Math.PI * r;
  const shown = useAnimatedNumber(pct, 900);
  const d = (shown / 100) * c;
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" role="img" aria-label={t.charts.ringAria(pct)}>
      <circle cx="80" cy="80" r={r} fill="none" stroke="var(--line)" strokeWidth="16" />
      <circle cx="80" cy="80" r={r} fill="none" stroke="var(--accent)" strokeWidth="16" strokeLinecap="round"
        strokeDasharray={`${d.toFixed(1)} ${c.toFixed(1)}`} transform="rotate(-90 80 80)" />
      <text x="80" y="90" textAnchor="middle" fontSize="32" fontWeight="500" fill="var(--text)">{Math.round(shown)}%</text>
    </svg>
  );
}

export function Blocks({ pct }: { pct: number }) {
  const on = Math.round(pct / 10);
  return (
    <div className="blocks" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => <span key={i} className={i < on ? "on" : ""} />)}
    </div>
  );
}

// `min` = the survey round's minimum number of valid responses; without it (STC pooled view) the text stays generic.
export function ScoreDots({ items, min, suffix = "" }: { items: Item[]; min?: number; suffix?: string }) {
  const { t } = useLang();
  const entered = useEntered();
  return (
    <div className="dots">
      {items.map((it, i) => {
        const label = t.itemLabels[it.code] ?? it.label; // database label, replaced in Arabic by question code
        if (it.score === null || it.score === undefined) {
          return (
            <div className="dot-row" key={it.code}>
              <span className="muted">{label}</span>
              <Tip text={t.charts.hiddenTip(label, min)} className="track" />
              <span className="hidden-score">{t.common.hidden}</span>
            </div>
          );
        }
        const pct = entered ? (it.score / 5) * 100 : 0;
        const col = scoreColor(it.score);
        const delay = { transitionDelay: `${i * 70}ms` };
        return (
          <div className="dot-row" key={it.code}>
            <span>{label}</span>
            <Tip text={t.charts.scoreTip(label, it.score.toFixed(1), it.n)} className="track">
              <span className="fill" style={{ display: "block", width: `${pct}%`, background: col, ...delay }} />
              <span className="dot" style={{ insetInlineStart: `${pct}%`, background: col, ...delay }} />
            </Tip>
            <span className="score"><bdi dir="ltr">{it.score.toFixed(1)}{suffix}</bdi></span>
          </div>
        );
      })}
    </div>
  );
}

export function FunnelChart({ f }: { f: Funnel }) {
  const { t } = useLang();
  const entered = useEntered();
  const max = Math.max(f.received, 1);
  const col = (n: number, label: string, color: string, i: number) => (
    <div className="col">
      <strong style={{ fontSize: 20 }}>{n}</strong>
      <div className="bar" style={{ height: entered ? Math.max((n / max) * 160, 6) : 6, background: color, transitionDelay: `${i * 100}ms` }} />
      <span className="small muted">{label}</span>
    </div>
  );
  return (
    <>
      <div className="funnel" role="img" aria-label={t.charts.funnelAria(f.received, f.tried, f.succeeded)}>
        {col(f.received, t.charts.received, "var(--funnel-1)", 0)}
        {col(f.tried, t.charts.tried, "var(--blue)", 1)}
        {col(f.succeeded, t.charts.redeemed, "var(--brand)", 2)}
      </div>
      <p className="small muted" style={{ margin: "12px 0 0" }}>{t.charts.failed(f.tried, f.succeeded)}</p>
    </>
  );
}

// One colour per reason in the dictionary's barriers, biggest slice first. This order keeps neighbouring
// slices distinguishable (also with colour blindness) in both themes; the tints reuse the same variables.
const PIE_COLORS = [
  "var(--accent)", "var(--amber)", "var(--silver)", "var(--chip-ok-fg)",
  "color-mix(in srgb, var(--amber) 50%, var(--panel))", "color-mix(in srgb, var(--accent) 50%, var(--panel))",
  "color-mix(in srgb, var(--chip-ok-fg) 50%, var(--panel))", "var(--muted)",
  "color-mix(in srgb, var(--silver) 50%, var(--panel))",
];

// Pie of the reasons for not redeeming; the legend carries each reason's name, count and share.
export function BarrierPie({ list }: { list: { reason: string; count: number }[] }) {
  const { t } = useLang();
  const counts = new Map<string, number>(); // unknown codes all add up into one "Other" slice
  for (const b of list) counts.set(barrierText(t, b.reason), (counts.get(barrierText(t, b.reason)) ?? 0) + b.count);
  const rows = [...counts].sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((sum, [, n]) => sum + n, 0);
  if (!total) return <p className="muted">{t.company.noReasons}</p>;

  // Rounded so server and browser produce the same path text.
  const pt = (a: number) => `${(50 + 48 * Math.sin(a)).toFixed(2)} ${(50 - 48 * Math.cos(a)).toFixed(2)}`;
  let at = 0;
  const slices = rows.map(([label, count], i) => {
    const a0 = at;
    at += (count / total) * 2 * Math.PI;
    return { label, count, a0, a1: at, color: PIE_COLORS[i], pct: Math.round((count / total) * 100) };
  });

  return (
    <div className="pie">
      <svg width={140} height={140} viewBox="0 0 100 100" role="img"
        aria-label={t.company.pieAria(slices.map((s) => `${s.label} ${s.count} (${s.pct}%)`).join(", "))}>
        {slices.map((s) => {
          const tip = <title>{`${s.label}: ${s.count} (${s.pct}%)`}</title>;
          // A single reason is a full circle, which an arc path cannot draw.
          return slices.length === 1 ? <circle key={s.label} cx="50" cy="50" r="48" style={{ fill: s.color }}>{tip}</circle> : (
            <path key={s.label} d={`M50 50 L${pt(s.a0)} A48 48 0 ${s.a1 - s.a0 > Math.PI ? 1 : 0} 1 ${pt(s.a1)}Z`}
              style={{ fill: s.color, stroke: "var(--panel)", strokeWidth: 1.5, strokeLinejoin: "round" }}>{tip}</path>
          );
        })}
      </svg>
      <ul className="legend">
        {slices.map((s) => (
          <li key={s.label}>
            <span className="swatch" style={{ background: s.color }} aria-hidden="true" />
            <span>{s.label}</span>
            <span className="value">{s.count} ({s.pct}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- chips and lists ---------- */

export function ReportChip({ status, n, min }: { status: ReportStatus; n: number; min: number }) {
  const { t } = useLang();
  const text = t.status.reportChip(status, n, min);
  const tip = t.status.reportChipTip(min);
  const cls = status === "REPORTABLE" ? "chip-ok" : status === "SUPPRESSED" ? "chip-wait" : "chip-off";
  return (
    <Tip inline text={tip} label={`${text}. ${tip}`}>
      <span className={`chip ${cls}`}>{text}</span>
    </Tip>
  );
}

// English status for the CSV export.
export const actionStatusText = (a: ActionRow) => (isOverdue(a) ? "Overdue" : a.status);

function ActionStatusChip({ a }: { a: ActionRow }) {
  const { t } = useLang();
  if (isOverdue(a)) return <span className="chip chip-bad">{t.actions.overdue}</span>;
  if (a.status === "In progress") return <span className="chip chip-ok">{t.actions.inProgress}</span>;
  if (a.status === "Closed") return <span className="chip chip-off">{t.actions.closed}</span>;
  return <span className="chip chip-wait">{t.actions.open}</span>;
}

export function ActionsList({ list, showCompany }: { list: ActionRow[]; showCompany?: boolean }) {
  const { t, lang } = useLang();
  if (!list || !list.length) return <p className="muted">{t.actions.none}</p>;
  return (
    <div>
      {list.map((a, i) => (
        <div className="action" key={a.action_id ?? i}>
          <div className="action-main">
            <div className="action-title">{a.recommendation || a.issue}</div>
            <div className="small muted" style={{ marginTop: 4 }}>
              {showCompany && a.company ? `${a.company} — ` : ""}{a.issue}
            </div>
            {a.next_step ? <div className="small" style={{ marginTop: 6 }}>{t.actions.nextStep} {a.next_step}</div> : null}
          </div>
          <div style={{ textAlign: "end" }}>
            <ActionStatusChip a={a} /> <span className="chip chip-off">{t.priority[a.priority] ?? a.priority}</span>
            <div className="small muted" style={{ marginTop: 6 }}>
              {a.owner}{a.due_date ? t.actions.due(fmtDate(a.due_date, lang)) : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Kpi({ label, info, tip, value, note, color, className = "grow-1", watch, children }: {
  label: string; info?: MetricId; tip?: string; value: ReactNode; note?: ReactNode; color?: string; className?: string; watch?: unknown; children?: ReactNode;
}) {
  return (
    <FlashPanel className={className} watch={watch ?? (typeof value === "string" || typeof value === "number" ? value : null)}>
      <div className="kpi-label">{label}{info ? <InfoButton id={info} /> : null}</div>
      {tip ? (
        <Tip text={tip}>
          <div className="kpi-num" style={color ? { color } : undefined}>{value}</div>
          {note ? <div className="small muted">{note}</div> : null}
        </Tip>
      ) : (
        <>
          <div className="kpi-num" style={color ? { color } : undefined}>{value}</div>
          {note ? <div className="small muted">{note}</div> : null}
        </>
      )}
      {children}
    </FlashPanel>
  );
}

/* ---------- states ---------- */

export function StateCard({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="panel state">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useLang();
  return (
    <StateCard title={t.common.couldNotLoadPage}>
      <p className="muted" role="alert">{message}</p>
      <button type="button" className="btn-ghost" onClick={onRetry}>{t.common.tryAgain}</button>
    </StateCard>
  );
}

// Without onRefresh there is no Refresh button.
export function PageHead({ title, info, sub, extra, onRefresh }: {
  title: ReactNode; info?: MetricId; sub?: ReactNode; extra?: ReactNode; onRefresh?: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="page-head">
      <div>
        <div className="title-row"><h1>{title}</h1>{info ? <InfoButton id={info} /> : null}</div>
        {sub ? <div className="muted small" style={{ marginTop: 6 }}>{sub}</div> : null}
      </div>
      <div className="refresh">
        {extra}
        {onRefresh ? <button type="button" className="btn-ghost" onClick={onRefresh}>{t.common.refresh}</button> : null}
      </div>
    </div>
  );
}

export function Skel({ w = "100%", h = 16, style }: { w?: number | string; h?: number; style?: React.CSSProperties }) {
  return <div className="skel" style={{ width: w, height: h, ...style }} aria-hidden="true" />;
}

// Placeholder shaped like the real page: header, KPI row, two panels.
export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  const { t } = useLang();
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only" role="status">{t.common.loadingSr}</span>
      <div className="page-head">
        <div><Skel w={240} h={30} /><Skel w={320} h={14} style={{ marginTop: 10 }} /></div>
        <Skel w={200} h={44} />
      </div>
      <div className="grid-row">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className={`panel ${i === 0 ? "grow-2" : "grow-1"}`}>
            <Skel w={110} h={14} /><Skel w={i === 0 ? 150 : 90} h={i === 0 ? 150 : 38} style={{ marginTop: 14, borderRadius: i === 0 ? 99 : 10 }} />
          </div>
        ))}
      </div>
      <div className="grid-row mt">
        <div className="panel grow-3"><Skel w={160} h={20} />{[0, 1, 2, 3].map((i) => <Skel key={i} h={14} style={{ marginTop: 22 }} />)}</div>
        <div className="panel grow-2"><Skel w={160} h={20} /><Skel h={170} style={{ marginTop: 18 }} /></div>
      </div>
    </div>
  );
}

// Section heading with an info button next to it.
export function H2({ children, info }: { children: ReactNode; info: MetricId }) {
  return <h2>{children}<InfoButton id={info} /></h2>;
}