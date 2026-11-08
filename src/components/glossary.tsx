"use client";

import { useState } from "react";
import { METRIC_SECTION, ROLE_FIRST, SECTION_ORDER, type MetricId } from "@/lib/metric-info";
import { useLang } from "@/lib/lang-context";
import type { Role } from "@/lib/types";
import { Drawer } from "./drawer";
import { MetricBody } from "./info-button";

// Header button + side panel listing every explanation, with the viewer's own sections first.
export function GlossaryButton({ role }: { role: Role }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const first = ROLE_FIRST[role];
  const sections = [...first, ...SECTION_ORDER.filter((s) => !first.includes(s))];
  const ids = Object.keys(METRIC_SECTION) as MetricId[];

  return (
    <>
      <button type="button" className="btn-ghost" onClick={() => setOpen(true)} aria-haspopup="dialog">
        {t.glossary.title}
      </button>
      {open ? (
        <Drawer label={t.glossary.title} onClose={() => setOpen(false)}>
          <div className="drawer-head">
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 600 }}>{t.glossary.title}</h2>
              <p className="small muted" style={{ marginTop: 6 }}>{t.glossary.intro}</p>
            </div>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)} data-autofocus>{t.common.closeEsc}</button>
          </div>
          {sections.map((s) => (
            <section key={s} className="panel mt" aria-labelledby={`g-${s.replace(/\s/g, "-")}`}>
              <h3 id={`g-${s.replace(/\s/g, "-")}`} className="glossary-section">{t.glossary.sections[s]}</h3>
              {ids.filter((id) => METRIC_SECTION[id] === s).map((id) => (
                <div className="glossary-entry" key={id}>
                  <h4 className="glossary-title">{t.metrics[id].title}</h4>
                  <MetricBody m={t.metrics[id]} />
                </div>
              ))}
            </section>
          ))}
        </Drawer>
      ) : null}
    </>
  );
}
