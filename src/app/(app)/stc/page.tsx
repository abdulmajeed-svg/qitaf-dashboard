"use client";

import { rpc } from "@/lib/supabase";
import { useRpcData } from "@/lib/use-rpc-data";
import { useLang } from "@/lib/lang-context";
import type { StcOverview } from "@/lib/types";
import { InfoButton } from "@/components/info-button";
import {
  ActionsList, AnimatedNumber, BarrierPie, Blocks, ErrorCard, FlashPanel, FunnelChart, H2, Kpi, PageHead, PageSkeleton, Ring, ScoreDots, StateCard,
} from "@/components/visuals";

export default function StcPage() {
  const { t } = useLang();
  const { data: d, error, reload } = useRpcData<StcOverview>(() => rpc("get_stc_overview"), "stc");
  if (error) return <ErrorCard message={error} onRetry={reload} />;
  if (!d) return <PageSkeleton />;

  const head = (
    <PageHead title={t.stc.title} info="stc.about" sub={t.stc.sub} onRefresh={reload} />
  );

  if (d.status !== "REPORTABLE") {
    return (
      <>
        {head}
        <StateCard title={t.stc.hiddenTitle}>
          <p className="muted">{t.stc.hiddenText(d.reason, d.participating, d.responses)}</p>
        </StateCard>
      </>
    );
  }

  const f = d.funnel;
  const redeemed = f.received ? Math.round((f.succeeded / f.received) * 100) : null;

  return (
    <>
      {head}
      <section className="grid-row">
        <FlashPanel className="grow-2 hero" watch={d.csat}>
          <Ring pct={d.csat} />
          <div>
            <div className="kpi-label">{t.company.satisfied}<InfoButton id="company.satisfied" /></div>
            <div style={{ marginTop: 8 }}>{t.stc.satisfiedAcross(d.csat_n, d.reportable_companies)}</div>
          </div>
        </FlashPanel>
        <Kpi label={t.stc.participating} info="stc.about" value={<AnimatedNumber value={d.participating} />} watch={d.participating}
          note={t.stc.participatingNote(d.reportable_companies)} />
        <Kpi label={t.company.responseRate} info="stc.rate" value={d.response_rate !== null ? <AnimatedNumber value={d.response_rate} suffix="%" /> : "—"}
          watch={d.response_rate} note={t.stc.rateNote}>
          {d.response_rate !== null ? <Blocks pct={d.response_rate} /> : null}
        </Kpi>
        <Kpi label={t.company.redeemed} info="company.redeemed" value={redeemed !== null ? <AnimatedNumber value={redeemed} suffix="%" /> : "—"}
          watch={redeemed} note={t.company.redeemedNote(f.succeeded, f.received)} />
      </section>

      <section className="grid-row mt">
        <div className="panel grow-3">
          <H2 info="company.scores">{t.company.scores}</H2>
          <p className="section-sub">{t.stc.scoresSub}</p>
          <ScoreDots items={d.items} />
        </div>
        <div className="panel grow-2">
          <H2 info="company.journey">{t.company.journey}</H2>
          <p className="section-sub">{t.stc.journeySub}</p>
          <FunnelChart f={f} />
        </div>
      </section>

      {Array.isArray(d.barriers) ? (
        <section className="panel mt">
          <H2 info="stc.barriers">{t.company.barriers}</H2>
          <p className="section-sub">{t.stc.barriersSub}</p>
          <BarrierPie list={d.barriers} />
        </section>
      ) : null}

      <section className="panel mt">
        <H2 info="company.actions">{t.stc.jointActions}</H2>
        <p className="section-sub">{t.stc.jointActionsSub}</p>
        <ActionsList list={d.actions} />
      </section>
      <p className="footer-note">{t.stc.footer}</p>
    </>
  );
}
