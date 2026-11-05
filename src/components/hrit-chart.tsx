"use client";

import { scoreColor } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import { useLang } from "@/lib/lang-context";
import { useEntered } from "@/lib/motion";
import type { CompanyDashboard, OrgItem, OrgStatus } from "@/lib/types";
import { Tip } from "./tip";

type Org = CompanyDashboard["org"];

const isScored = (i: OrgItem) => i.score !== null && String(i.value ?? "").startsWith("SCORE_");
const answerText = (t: Dict, i: OrgItem) => (i.value ?? "").split(", ").map((c) => t.codes[c] || c).join(", ");
const labelOf = (t: Dict, i: OrgItem) => t.orgLabels[i.code] ?? i.label; // database label, replaced in Arabic by code
const TICKS = [1, 2, 3, 4, 5];

function emptyText(t: Dict, status: OrgStatus) {
  if (status === "NOT_SUBMITTED") return t.hr.notSubmitted;
  if (status === "NOT_APPLICABLE") return t.hr.notApplicable;
  return t.hr.noScores;
}

// One group's bars on a fixed 1–5 axis. Bars grow in on load (not at all with reduced motion).
function GroupChart({ title, items }: { title: string; items: OrgItem[] }) {
  const { t } = useLang();
  const entered = useEntered();
  return (
    <div className="hrit-chart" role="group" aria-label={t.hr.chartAria(title)}>
      {items.map((it, i) => {
        const score = it.score as number;
        const label = labelOf(t, it);
        // Fixed axis 1–5: position = (score - 1) / 4. A score of 1 keeps a thin stub so it never looks like "no bar".
        const w = Math.max(((score - 1) / 4) * 100, 1.5);
        return (
          <div className="hrit-row" key={it.code}>
            <span className="hrit-label">{label}</span>
            <Tip className="hrit-track" text={t.hr.barTip(title, label, score)}>
              {TICKS.map((n, k) => (
                <span key={n} className="hrit-grid" style={{ insetInlineStart: k === 4 ? "calc(100% - 1px)" : `${k * 25}%` }} />
              ))}
              <span className="hrit-bar" style={{ width: entered ? `${w}%` : "0%", background: scoreColor(score), transitionDelay: `${i * 70}ms` }} />
            </Tip>
            <span className="hrit-val">{score}{t.common.outOf5}</span>
          </div>
        );
      })}
      <div className="hrit-axis" aria-hidden="true">
        <span />
        <div className="hrit-ticks">
          {TICKS.map((n, k) => <span key={n} className="hrit-tick" style={{ insetInlineStart: `${k * 25}%` }}>{n}</span>)}
        </div>
        <span />
      </div>
    </div>
  );
}

export function HrItChart({ org }: { org: Org }) {
  const { t } = useLang();
  // The database still returns IT and Finance items; this page shows HR only.
  const names = ["HR"];

  const groups = names.map((g) => {
    const mine = org.items.filter((i) => i.group === g); // keeps the original question order
    return { g, status: org.hr_status, scored: mine.filter(isScored), answers: mine.filter((i) => !isScored(i)) };
  });

  return (
    <div className="hrit">
      {groups.map(({ g, status, scored }) => (
        <section key={g} aria-labelledby={`hrit-${g}`}>
          <h3 id={`hrit-${g}`} className="hrit-title">{t.company.hrAssessment}</h3>
          {scored.length ? <GroupChart title={t.company.hrAssessment} items={scored} /> : <div className="hrit-empty">{emptyText(t, status)}</div>}
        </section>
      ))}

      <p className="small muted" style={{ margin: 0 }}>{t.hr.note}</p>

      <div className="pills-cols">
        {groups.map(({ g, answers }) => (
          <div key={g}>
            <h4 className="pills-title">{t.company.hr}</h4>
            {answers.length ? (
              <ul className="pills" aria-label={t.hr.answersAria(t.company.hr)}>
                {answers.map((a) => <li key={a.code} className="pill">{labelOf(t, a)}: {answerText(t, a)}</li>)}
              </ul>
            ) : <p className="small muted" style={{ margin: 0 }}>{t.hr.noOtherAnswers}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
