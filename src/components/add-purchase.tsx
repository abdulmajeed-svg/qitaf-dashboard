"use client";

import { useState } from "react";
import { today as localToday } from "@/lib/format";
import { NOTE_MAX, purchaseProblem } from "@/lib/purchases";
import { rpc } from "@/lib/supabase";
import { useLang } from "@/lib/lang-context";
import { useToast } from "@/lib/toast";
import type { CompanyRef } from "@/lib/types";
import { CompanySearch } from "./company-search";

// Admin only: records points a company bought. Checked here first so people get a clear message;
// the database checks again (add_points_purchase is Admin only there too).
// The chosen company belongs to the page, which shows that company's purchases under the form.
export function AddPurchase({ companies, company, onCompanyChange, onAdded }: {
  companies: CompanyRef[];
  company: CompanyRef | null;
  onCompanyChange: (c: CompanyRef) => void;
  onAdded: () => Promise<void> | void;
}) {
  const { t } = useLang();
  const toast = useToast();
  const today = localToday();
  const [points, setPoints] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = purchaseProblem({ hasCompany: !!company, points, date, note }, today);
    setError(p ? t.tracking[p] : "");
    if (p || !company) return;
    setBusy(true);
    try {
      await rpc("add_points_purchase", { p_company: company.company_id, p_points: Number(points.trim()), p_date: date, p_note: note.trim() || null });
      setPoints("");
      setNote("");
      await onAdded(); // refresh first, so the "added" message is the one left showing
      toast(t.tracking.saved);
    } catch (err) {
      setError(t.tracking.saveFailed(err instanceof Error ? err.message : t.common.somethingWrong));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>{t.tracking.addTitle}</h2>
      <p className="section-sub">{t.tracking.addSub}</p>
      <form onSubmit={onSubmit} noValidate>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <div className="field" style={{ flex: "2 1 220px", marginTop: 0 }}>
            <label htmlFor="purchase-company">{t.tracking.fieldCompany}</label>
            <CompanySearch id="purchase-company" companies={companies} value={company} onChange={onCompanyChange} />
          </div>
          <div className="field" style={{ flex: "1 1 120px", marginTop: 0 }}>
            <label htmlFor="purchase-points">{t.tracking.fieldPoints}</label>
            <input id="purchase-points" type="text" inputMode="numeric" dir="ltr" required value={points} onChange={(e) => setPoints(e.target.value)} />
          </div>
          <div className="field" style={{ flex: "1 1 150px", marginTop: 0 }}>
            <label htmlFor="purchase-date">{t.tracking.fieldDate}</label>
            <input id="purchase-date" type="date" required max={today} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field" style={{ flex: "3 1 240px", marginTop: 0 }}>
            <label htmlFor="purchase-note">{t.tracking.fieldNote}</label>
            <input id="purchase-note" type="text" maxLength={NOTE_MAX} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <button className="btn" type="submit" disabled={busy}>{busy ? t.tracking.saving : t.tracking.submit}</button>
        </div>
        <div className="error" role="alert">{error}</div>
      </form>
    </section>
  );
}
