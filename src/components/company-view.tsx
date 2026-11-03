"use client";

import { barrierText, minResponses, responseRateTip, validResponses } from "@/lib/format";
import { useProfile } from "@/lib/profile-context";
import type { CompanyDashboard } from "@/lib/types";
import {
  AnimatedNumber, Blocks, FlashPanel, FunnelChart, H2, Kpi, OrgChip, Ring, ScoreDots, StateCard, underMinText,
} from "./visuals";
import { InfoButton } from "./info-button";
import { HrItChart } from "./hrit-chart";

type Motivation = NonNullable<CompanyDashboard["motivation"]>;

// One colour per reason in BARRIER_TEXT, biggest slice first. This order keeps neighbouring slices
// distinguishable (also with colour blindness) in both themes; the tints reuse the same variables.
const PIE_COLORS = [
  "var(--accent)", "var(--amber)", "var(--silver)", "var(--chip-ok-fg)",
  "color-mix(in srgb, var(--amber) 50%, var(--panel))", "color-mix(in srgb, var(--accent) 50%, var(--panel))",
  "color-mix(in srgb, var(--chip-ok-fg) 50%, var(--panel))", "var(--muted)",
];

// Pie of the reasons for not redeeming; the legend carries each reason's name, count and share.
function BarrierPie({ list }: { list: { reason: string; count: number }[] }) {
  const counts = new Map<string, number>(); // unknown codes all add up into one "Other" slice
  for (const b of list) counts.set(barrierText(b.reason), (counts.get(barrierText(b.reason)) ?? 0) + b.count);
  const rows = [...counts].sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((sum, [, n]) => sum + n, 0);
  if (!total) return <p className="muted">No reasons were given.</p>;

  const pt = (a: number) => `${50 + 48 * Math.sin(a)} ${50 - 48 * Math.cos(a)}`;
  let at = 0;
  const slices = rows.map(([label, count], i) => {
    const a0 = at;
    at += (count / total) * 2 * Math.PI;
    return { label, count, a0, a1: at, color: PIE_COLORS[i], pct: Math.round((count / total) * 100) };
  });

  return (
    <div className="pie">
      <svg width={140} height={140} viewBox="0 0 100 100" role="img"
        aria-label={`Reasons for not redeeming: ${slices.map((s) => `${s.label} ${s.count} (${s.pct}%)`).join(", ")}`}>
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

function MotivationCard({ m }: { m: Motivation }) {
  const pct = (v: number) => Math.round((v / m.n) * 100);
  const parts: [string, number, string][] = [
    ["Increased", m.up, "var(--accent)"], ["No change", m.same, "var(--silver)"], ["Decreased", m.down, "var(--amber)"],
  ];
  return (
    <div className="panel grow-2">
      <H2 info="company.motivation">Effect on motivation</H2>
      <p className="section-sub">How employees said the rewards changed their motivation.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {parts.map(([label, v, color]) => (
          <div key={label} style={{ flex: "1 1 80px" }}>
            <div className="kpi-num" style={{ marginTop: 0 }}><AnimatedNumber value={pct(v)} suffix="%" /></div>
            <div className="small muted"><span className="swatch" style={{ background: color }} aria-hidden="true" />{label}</div>
          </div>
        ))}
      </div>
      <div className="stack" role="img" aria-label={parts.map(([label, v]) => `${label} ${pct(v)}%`).join(", ")}>
        {parts.filter(([, v]) => v > 0).map(([label, v, color]) => <i key={label} style={{ flex: v, background: color }} />)}
      </div>
      <p className="small muted" style={{ margin: "12px 0 0" }}>
        Based on {m.n} employees who answered. “Prefer not to answer” is left out of the percentages.
      </p>
    </div>
  );
}

export function CompanyView({ d }: { d: CompanyDashboard }) {
  const isAdmin = useProfile().role === "ADMIN"; // the HR assessment is admin-only
  const k = d.kpi;
  const min = minResponses(d.min_responses); // threshold for this survey round, from the database
  const f = d.funnel;
  // "Feeling appreciated" (A07) gets its own card, so it is left out of the scores list.
  const appreciated = d.items.find((i) => i.code === "A07");
  const scores = d.items.filter((i) => i.code !== "A07");
  const redeemedAll = f && f.received ? Math.round((f.succeeded / f.received) * 100) : null;

  return (
    <>
      {d.status !== "REPORTABLE" || !f ? (
        <StateCard title={d.status === "NO_RESPONSES" ? "No responses yet" : "Waiting for more responses"}>
          <p className="muted">
            {d.status === "NO_RESPONSES"
              ? `No responses yet. Results are shown once at least ${min} valid responses are received.`
              : `${k.responded} of ${min} valid responses received. Results are shown once ${min} valid responses are in, to protect employee confidentiality.`}
          </p>
          <div className="progress" role="progressbar" aria-label={`Valid responses toward the ${min} needed`}
            aria-valuemin={0} aria-valuemax={min} aria-valuenow={Math.min(k.responded, min)}>
            <i style={{ width: `${Math.min(k.responded / min, 1) * 100}%` }} />
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>{k.responded} of {min} valid responses needed</p>
        </StateCard>
      ) : (
        <>
          <section className="grid-row">
            <FlashPanel className="grow-2 hero" watch={k.csat}>
              {k.csat !== null ? <Ring pct={k.csat} /> : null}
              <div>
                <div className="kpi-label">Employees satisfied<InfoButton id="company.satisfied" /></div>
                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 600 }}>{k.csat_favorable} of {k.csat_n} employees are satisfied</div>
                <div className="small muted" style={{ marginTop: 4 }}>They rated their overall experience 4 or 5 out of 5.</div>
              </div>
            </FlashPanel>
            <Kpi
              label="Response rate"
              info="company.rate"
              tip={responseRateTip(k.invited, k.responded, k.response_rate)}
              value={k.response_rate !== null ? <AnimatedNumber value={k.response_rate} suffix="%" /> : "—"}
              watch={k.response_rate}
              note={k.response_rate !== null ? `${k.responded} of ${k.invited} invited` : `${validResponses(k.responded)}; invited count not confirmed`}
            >
              {k.response_rate !== null ? <Blocks pct={k.response_rate} /> : null}
            </Kpi>
            <Kpi
              label="Redeemed successfully"
              info="company.redeemed"
              value={redeemedAll !== null ? <AnimatedNumber value={redeemedAll} suffix="%" /> : "—"}
              watch={redeemedAll}
              note={`${f.succeeded} of ${f.received} who received points`}
            >
              {f.success_among_tried != null ? (
                <div className="small" style={{ color: "var(--accent-text)", marginTop: 12, fontWeight: 600 }}>
                  {f.success_among_tried}% of those who tried
                </div>
              ) : null}
            </Kpi>
            {appreciated ? (
              <Kpi label="Feeling appreciated" info="company.appreciated" watch={appreciated.score}
                value={appreciated.score !== null ? <AnimatedNumber value={appreciated.score} decimals={1} suffix=" / 5" /> : "—"}
                note={appreciated.score !== null ? validResponses(appreciated.n) : `Hidden: ${underMinText(min)}`} />
            ) : null}
          </section>

          <section className="grid-row mt">
            <div className="panel grow-3">
              <H2 info="company.scores">Experience scores</H2>
              <div style={{ marginTop: 18 }}><ScoreDots items={scores} min={min} suffix=" / 5" /></div>
            </div>
            <div className="panel grow-2">
              <H2 info="company.journey">Redemption journey</H2>
              <p className="section-sub">What employees told us, not verified STC transactions.</p>
              <FunnelChart f={f} />
            </div>
          </section>

          <section className="grid-row mt">
            <div className="panel grow-3">
              <H2 info="company.barriers">Why employees haven’t redeemed</H2>
              <p className="section-sub">Reasons employees gave for not redeeming their points.</p>
              {Array.isArray(d.barriers) ? <BarrierPie list={d.barriers} /> : (
                <div className="note">
                  {`Reasons for not redeeming are hidden until at least ${min} valid responses are received (${d.barriers ? d.barriers.n : 0} so far).`}
                </div>
              )}
            </div>
            {d.motivation && d.motivation.n > 0 ? <MotivationCard m={d.motivation} /> : null}
          </section>
        </>
      )}

      {isAdmin ? (
        <section className="panel mt">
          <div className="page-head" style={{ marginBottom: 14 }}>
            <H2 info="company.org">HR assessment</H2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span className="small muted">HR</span><OrgChip status={d.org.hr_status} />
            </div>
          </div>
          <HrItChart org={d.org} />
        </section>
      ) : null}

      <p className="footer-note">
        Survey answers, not verified STC transactions. Employee results appear only with {min} or more valid responses per question.
        Trends appear after the second survey wave.
      </p>
    </>
  );
}
