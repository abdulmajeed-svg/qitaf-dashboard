"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ActionRow, Funnel, Item, OrgStatus, ReportStatus } from "@/lib/types";
import { fmtDate, isOverdue, scoreColor, validResponses } from "@/lib/format";
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
  const r = 66;
  const c = 2 * Math.PI * r;
  const shown = useAnimatedNumber(pct, 900);
  const d = (shown / 100) * c;
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" role="img" aria-label={`${pct} percent satisfied`}>
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
export const underMinText = (min?: number) => (min ? `fewer than ${min} valid responses` : "fewer than the minimum number of valid responses");

export function ScoreDots({ items, min }: { items: Item[]; min?: number }) {
  const entered = useEntered();
  return (
    <div className="dots">
      {items.map((it, i) => {
        if (it.score === null || it.score === undefined) {
          return (
            <div className="dot-row" key={it.code}>
              <span className="muted">{it.label}</span>
              <Tip text={`${it.label}: Hidden: ${underMinText(min)}`} className="track" />
              <span className="hidden-score">Hidden</span>
            </div>
          );
        }
        const pct = entered ? (it.score / 5) * 100 : 0;
        const col = scoreColor(it.score);
        const delay = { transitionDelay: `${i * 70}ms` };
        return (
          <div className="dot-row" key={it.code}>
            <span>{it.label}</span>
            <Tip text={`${it.label}: ${it.score.toFixed(1)} out of 5, ${it.n} responses`} className="track">
              <span className="fill" style={{ display: "block", width: `${pct}%`, background: col, ...delay }} />
              <span className="dot" style={{ left: `${pct}%`, background: col, ...delay }} />
            </Tip>
            <span className="score">{it.score.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function FunnelChart({ f }: { f: Funnel }) {
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
    <div className="funnel" role="img" aria-label={`${f.received} received, ${f.tried} tried, ${f.succeeded} redeemed`}>
      {col(f.received, "Received points", "var(--funnel-1)", 0)}
      {col(f.tried, "Tried to redeem", "var(--blue)", 1)}
      {col(f.succeeded, "Redeemed", "var(--brand)", 2)}
    </div>
  );
}

/* ---------- chips and lists ---------- */

// Wording of the results-status chip (also used for the CSV export).
export const reportChipText = (status: ReportStatus, n: number, min: number) =>
  status === "REPORTABLE" ? `Results available · ${validResponses(n)}`
    : status === "SUPPRESSED" ? `Waiting for more responses · ${n} of ${min}`
    : "No responses yet";

export const reportChipTip = (min: number) =>
  `Results are shown only when at least ${min} valid responses are received, to protect employee confidentiality.`;

export function ReportChip({ status, n, min }: { status: ReportStatus; n: number; min: number }) {
  const text = reportChipText(status, n, min);
  const tip = reportChipTip(min);
  const cls = status === "REPORTABLE" ? "chip-ok" : status === "SUPPRESSED" ? "chip-wait" : "chip-off";
  return (
    <Tip inline text={tip} label={`${text}. ${tip}`}>
      <span className={`chip ${cls}`}>{text}</span>
    </Tip>
  );
}

export function OrgChip({ status }: { status: OrgStatus }) {
  if (status === "SUBMITTED") return <span className="chip chip-ok">Submitted</span>;
  if (status === "NOT_SUBMITTED") return <span className="chip chip-wait">Not submitted</span>;
  return <span className="chip chip-off">Not applicable</span>;
}

export const actionStatusText = (a: ActionRow) => (isOverdue(a) ? "Overdue" : a.status);

function ActionStatusChip({ a }: { a: ActionRow }) {
  if (isOverdue(a)) return <span className="chip chip-bad">Overdue</span>;
  if (a.status === "In progress") return <span className="chip chip-ok">In progress</span>;
  if (a.status === "Closed") return <span className="chip chip-off">Closed</span>;
  return <span className="chip chip-wait">Open</span>;
}

export function ActionsList({ list, showCompany }: { list: ActionRow[]; showCompany?: boolean }) {
  if (!list || !list.length) return <p className="muted">No open actions.</p>;
  return (
    <div>
      {list.map((a, i) => (
        <div className="action" key={a.action_id ?? i}>
          <div className="action-main">
            <div className="action-title">{a.recommendation || a.issue}</div>
            <div className="small muted" style={{ marginTop: 4 }}>
              {showCompany && a.company ? `${a.company} — ` : ""}{a.issue}
            </div>
            {a.next_step ? <div className="small" style={{ marginTop: 6 }}>Next step: {a.next_step}</div> : null}
          </div>
          <div style={{ textAlign: "right" }}>
            <ActionStatusChip a={a} /> <span className="chip chip-off">{a.priority}</span>
            <div className="small muted" style={{ marginTop: 6 }}>
              {a.owner}{a.due_date ? `, due ${fmtDate(a.due_date)}` : ""}
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
  return (
    <StateCard title="Could not load this page">
      <p className="muted" role="alert">{message}</p>
      <button type="button" className="btn-ghost" onClick={onRetry}>Try again</button>
    </StateCard>
  );
}

export function PageHead({ title, info, sub, extra, onRefresh }: {
  title: ReactNode; info?: MetricId; sub?: ReactNode; extra?: ReactNode; updated: Date | null; onRefresh: () => void;
  fmt: (d: Date) => string;
}) {
  return (
    <div className="page-head">
      <div>
        <div className="title-row"><h1>{title}</h1>{info ? <InfoButton id={info} /> : null}</div>
        {sub ? <div className="muted small" style={{ marginTop: 6 }}>{sub}</div> : null}
      </div>
      <div className="refresh">
        {extra}
        <button type="button" className="btn-ghost" onClick={onRefresh}>Refresh</button>
      </div>
    </div>
  );
}

export function Skel({ w = "100%", h = 16, style }: { w?: number | string; h?: number; style?: React.CSSProperties }) {
  return <div className="skel" style={{ width: w, height: h, ...style }} aria-hidden="true" />;
}

// Placeholder shaped like the real page: header, KPI row, two panels.
export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only" role="status">Loading</span>
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