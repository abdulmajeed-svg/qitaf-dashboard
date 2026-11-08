"use client";

import { minResponses } from "@/lib/format";
import { useLang } from "@/lib/lang-context";
import type { CompanyDashboard } from "@/lib/types";
import {
  AnimatedNumber, BarrierPie, Blocks, FlashPanel, FunnelChart, H2, Kpi, Ring, ScoreDots, StateCard,
} from "./visuals";
import { InfoButton } from "./info-button";

type Motivation = NonNullable<CompanyDashboard["motivation"]>;

function MotivationCard({ m }: { m: Motivation }) {
  const { t } = useLang();
  const pct = (v: number) => Math.round((v / m.n) * 100);
  const parts: [string, number, string][] = [
    [t.company.increased, m.up, "var(--accent)"], [t.company.noChange, m.same, "var(--silver)"], [t.company.decreased, m.down, "var(--amber)"],
  ];
  return (
    <div className="panel grow-2">
      <H2 info="company.motivation">{t.company.motivation}</H2>
      <p className="section-sub">{t.company.motivationSub}</p>
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
      <p className="small muted" style={{ margin: "12px 0 0" }}>{t.company.motivationNote(m.n)}</p>
    </div>
  );
}

export function CompanyView({ d }: { d: CompanyDashboard }) {
  const { t } = useLang();
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
        <StateCard title={d.status === "NO_RESPONSES" ? t.company.noResponsesTitle : t.company.waitingTitle}>
          <p className="muted">
            {d.status === "NO_RESPONSES" ? t.company.noResponsesText(min) : t.company.waitingText(k.responded, min)}
          </p>
          <div className="progress" role="progressbar" aria-label={t.company.progressAria(min)}
            aria-valuemin={0} aria-valuemax={min} aria-valuenow={Math.min(k.responded, min)}>
            <i style={{ width: `${Math.min(k.responded / min, 1) * 100}%` }} />
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>{t.company.progressNote(k.responded, min)}</p>
        </StateCard>
      ) : (
        <>
          <section className="grid-row">
            <FlashPanel className="grow-2 hero" watch={k.csat}>
              {k.csat !== null ? <Ring pct={k.csat} /> : null}
              <div>
                <div className="kpi-label">{t.company.satisfied}<InfoButton id="company.satisfied" /></div>
                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 600 }}>{t.company.satisfiedLine(k.csat_favorable, k.csat_n)}</div>
                <div className="small muted" style={{ marginTop: 4 }}>{t.company.satisfiedSub}</div>
              </div>
            </FlashPanel>
            <Kpi
              label={t.company.responseRate}
              info="company.rate"
              tip={t.common.rateTip(k.invited, k.responded, k.response_rate)}
              value={k.response_rate !== null ? <AnimatedNumber value={k.response_rate} suffix="%" /> : "—"}
              watch={k.response_rate}
              note={k.response_rate !== null ? t.company.rateNote(k.responded, k.invited) : t.company.rateUnconfirmed(k.responded)}
            >
              {k.response_rate !== null ? <Blocks pct={k.response_rate} /> : null}
            </Kpi>
            <Kpi
              label={t.company.redeemed}
              info="company.redeemed"
              value={redeemedAll !== null ? <AnimatedNumber value={redeemedAll} suffix="%" /> : "—"}
              watch={redeemedAll}
              note={t.company.redeemedNote(f.succeeded, f.received)}
            >
              {f.success_among_tried != null ? (
                <div className="small" style={{ color: "var(--accent-text)", marginTop: 12, fontWeight: 600 }}>
                  {t.company.ofThoseWhoTried(f.success_among_tried)}
                </div>
              ) : null}
            </Kpi>
            {appreciated ? (
              <Kpi label={t.company.appreciated} info="company.appreciated" watch={appreciated.score}
                value={appreciated.score !== null ? <bdi dir="ltr"><AnimatedNumber value={appreciated.score} decimals={1} suffix={t.common.outOf5} /></bdi> : "—"}
                note={appreciated.score !== null ? undefined : t.company.hiddenNote(min)} />
            ) : null}
          </section>

          <section className="grid-row mt">
            <div className="panel grow-3">
              <H2 info="company.scores">{t.company.scores}</H2>
              <div style={{ marginTop: 18 }}><ScoreDots items={scores} min={min} suffix={t.common.outOf5} /></div>
            </div>
            <div className="panel grow-2">
              <H2 info="company.journey">{t.company.journey}</H2>
              <p className="section-sub">{t.company.journeySub}</p>
              <FunnelChart f={f} />
            </div>
          </section>

          <section className="grid-row mt">
            <div className="panel grow-3">
              <H2 info="company.barriers">{t.company.barriers}</H2>
              <p className="section-sub">{t.company.barriersSub}</p>
              {Array.isArray(d.barriers) ? <BarrierPie list={d.barriers} /> : (
                <div className="note">{t.company.barriersHidden(min, d.barriers ? d.barriers.n : 0)}</div>
              )}
            </div>
            {d.motivation && d.motivation.n > 0 ? <MotivationCard m={d.motivation} /> : null}
          </section>
        </>
      )}

      <p className="footer-note">{t.company.footer(min)}</p>
    </>
  );
}
