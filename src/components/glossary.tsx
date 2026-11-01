"use client";

import { useState } from "react";
import { METRICS, ROLE_FIRST, SECTION_ORDER, type Metric } from "@/lib/metric-info";
import type { Role } from "@/lib/types";
import { Drawer } from "./drawer";
import { MetricBody } from "./info-button";

// Header button + side panel listing every explanation, with the viewer's own sections first.
export function GlossaryButton({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const first = ROLE_FIRST[role];
  const sections = [...first, ...SECTION_ORDER.filter((s) => !first.includes(s))];
  // The HR assessment is admin-only, so only admins get its explanation.
  const entries = (Object.values(METRICS) as Metric[]).filter((m) => role === "ADMIN" || m !== METRICS["company.org"]);

  return (
    <>
      <button type="button" className="btn-ghost" onClick={() => setOpen(true)} aria-haspopup="dialog">
        How to read this dashboard
      </button>
      {open ? (
        <Drawer label="How to read this dashboard" onClose={() => setOpen(false)}>
          <div className="drawer-head">
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 600 }}>How to read this dashboard</h2>
              <p className="small muted" style={{ marginTop: 6 }}>
                What each number means, how it is worked out, and when it is hidden to protect privacy.
              </p>
            </div>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)} data-autofocus>Close (Esc)</button>
          </div>
          {sections.map((s) => (
            <section key={s} className="panel mt" aria-labelledby={`g-${s.replace(/\s/g, "-")}`}>
              <h3 id={`g-${s.replace(/\s/g, "-")}`} className="glossary-section">{s}</h3>
              {entries.filter((m) => m.section === s).map((m) => (
                <div className="glossary-entry" key={`${s}-${m.title}-${m.text ?? m.how ?? m.what}`}>
                  <h4 className="glossary-title">{m.title}</h4>
                  <MetricBody m={m} />
                </div>
              ))}
            </section>
          ))}
        </Drawer>
      ) : null}
    </>
  );
}
