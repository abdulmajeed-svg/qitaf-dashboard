"use client";

import { CODE_TEXT, scoreColor } from "@/lib/format";
import { useEntered } from "@/lib/motion";
import type { CompanyDashboard, OrgItem, OrgStatus } from "@/lib/types";
import { Tip } from "./tip";

type Org = CompanyDashboard["org"];

const isScored = (i: OrgItem) => i.score !== null && String(i.value ?? "").startsWith("SCORE_");
const answerText = (i: OrgItem) => (i.value ?? "").split(", ").map((c) => CODE_TEXT[c] || c).join(", ");
const TICKS = [1, 2, 3, 4, 5];

const titleFor = (g: string) => `${g} assessment`;

function emptyText(group: string, status: OrgStatus) {
  if (status === "NOT_SUBMITTED") return `${group} has not submitted this assessment yet.`;
  if (status === "NOT_APPLICABLE") return `The ${group} assessment does not apply to this company.`;
  return `No scored ${group} answers yet.`;
}

// One group's bars on a fixed 1–5 axis. Bars grow in on load (not at all with reduced motion).
function GroupChart({ group, items }: { group: string; items: OrgItem[] }) {
  const entered = useEntered();
  return (
    <div className="hrit-chart" role="group" aria-label={`${titleFor(group)}, scores from 1 to 5`}>
      {items.map((it, i) => {
        const score = it.score as number;
        // Fixed axis 1–5: position = (score - 1) / 4. A score of 1 keeps a thin stub so it never looks like "no bar".
        const w = Math.max(((score - 1) / 4) * 100, 1.5);
        return (
          <div className="hrit-row" key={it.code}>
            <span className="hrit-label">{it.label}</span>
            <Tip className="hrit-track" text={`${titleFor(group)}, ${it.label}: ${score} out of 5`}>
              {TICKS.map((n, k) => (
                <span key={n} className="hrit-grid" style={{ left: k === 4 ? "calc(100% - 1px)" : `${k * 25}%` }} />
              ))}
              <span className="hrit-bar" style={{ width: entered ? `${w}%` : "0%", background: scoreColor(score), transitionDelay: `${i * 70}ms` }} />
            </Tip>
            <span className="hrit-val">{score} / 5</span>
          </div>
        );
      })}
      <div className="hrit-axis" aria-hidden="true">
        <span />
        <div className="hrit-ticks">
          {TICKS.map((n, k) => <span key={n} className="hrit-tick" style={{ left: `${k * 25}%` }}>{n}</span>)}
        </div>
        <span />
      </div>
    </div>
  );
}

export function HrItChart({ org }: { org: Org }) {
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
          <h3 id={`hrit-${g}`} className="hrit-title">{titleFor(g)}</h3>
          {scored.length ? <GroupChart group={g} items={scored} /> : <div className="hrit-empty">{emptyText(g, status)}</div>}
        </section>
      ))}

      <p className="small muted" style={{ margin: 0 }}>Answers from one authorised HR respondent.</p>

      <div className="pills-cols">
        {groups.map(({ g, answers }) => (
          <div key={g}>
            <h4 className="pills-title">{g}</h4>
            {answers.length ? (
              <ul className="pills" aria-label={`${g} answers`}>
                {answers.map((a) => <li key={a.code} className="pill">{a.label}: {answerText(a)}</li>)}
              </ul>
            ) : <p className="small muted" style={{ margin: 0 }}>No other answers.</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
