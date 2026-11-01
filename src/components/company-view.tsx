"use client";

import { BARRIER_TEXT, minResponses, responseRateTip, validResponses } from "@/lib/format";
import { useProfile } from "@/lib/profile-context";
import type { CompanyDashboard } from "@/lib/types";
import {
  AnimatedNumber, Blocks, FlashPanel, FunnelChart, H2, Kpi, OrgChip, Ring, ScoreDots, StateCard,
} from "./visuals";
import { InfoButton } from "./info-button";
import { HrItChart } from "./hrit-chart";


export function CompanyView({ d }: { d: CompanyDashboard }) {
  const isAdmin = useProfile().role === "ADMIN"; // the HR assessment is admin-only
  const k = d.kpi;
  const min = minResponses(d.min_responses); // threshold for this survey round, from the database
  const f = d.funnel;
  // Items arrive sorted best -> worst with hidden last, so the lowest visible one is the last visible one.
  const lowest = [...d.items].reverse().find((i) => i.score !== null);
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
                <div style={{ marginTop: 8 }}>{k.csat_favorable} of {k.csat_n} rated their overall experience 4 or 5</div>
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
            {lowest && lowest.score !== null ? (
              <Kpi label="Lowest score" info="company.lowest" value={<AnimatedNumber value={lowest.score} decimals={1} />} watch={lowest.score}
                note={lowest.label} />
            ) : null}
          </section>

          <section className="grid-row mt">
            <div className="panel grow-3">
              <H2 info="company.scores">Experience scores</H2>
              <p className="section-sub">Average from 1 (lowest) to 5 (highest).</p>
              <ScoreDots items={d.items} min={min} />
            </div>
            <div className="panel grow-2">
              <H2 info="company.journey">Redemption journey</H2>
              <p className="section-sub">What employees told us, not verified STC transactions.</p>
              <FunnelChart f={f} />
              <div className="note">
                {Array.isArray(d.barriers)
                  ? "Main reasons for not redeeming: " + d.barriers.map((b) => `${BARRIER_TEXT[b.reason] || b.reason} (${b.count})`).join(", ")
                  : `Reasons for not redeeming are hidden until at least ${min} valid responses are received (${d.barriers ? d.barriers.n : 0} so far).`}
              </div>
            </div>
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
