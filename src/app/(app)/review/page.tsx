"use client";

import { rpc } from "@/lib/supabase";
import { useRpcData } from "@/lib/use-rpc-data";
import { LOCALE } from "@/lib/format";
import { useLang } from "@/lib/lang-context";
import type { ReviewRow } from "@/lib/types";
import { ErrorCard, PageHead, Skel } from "@/components/visuals";

export default function ReviewPage() {
  const { t, lang } = useLang();
  const { data: rows, error, reload } = useRpcData<ReviewRow[]>(() => rpc("get_review_queue"), "review");
  if (error) return <ErrorCard message={error} onRetry={reload} />;
  if (!rows) {
    return (
      <div aria-busy="true">
        <span className="sr-only" role="status">{t.common.loadingSr}</span>
        <Skel w={220} h={30} />
        <div className="panel mt">{[0, 1, 2].map((i) => <Skel key={i} h={44} style={{ marginBottom: 10 }} />)}</div>
      </div>
    );
  }

  return (
    <>
      <PageHead title={t.review.title} info="review.about" sub={t.review.sub} onRefresh={reload} />
      <section className="panel">
        {rows.length ? (
          <div className="table-box">
            <table>
              <thead>
                <tr>
                  <th>{t.review.colReceived}</th><th>{t.review.colForm}</th><th>{t.review.colLanguage}</th>
                  <th>{t.review.colCode}</th><th>{t.review.colReason}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.response_id}>
                    <td>{new Date(r.submitted_at).toLocaleString(LOCALE[lang])}</td>
                    <td>{t.audience[r.audience] || r.audience}</td>
                    <td>{r.language || ""}</td>
                    <td><strong>{r.company_code_entered || t.review.empty}</strong></td>
                    <td>
                      <span className="chip chip-bad">{r.reason_code}</span>
                      <div className="small muted" style={{ marginTop: 4 }}>{r.reason}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="state">
            <h2>{t.review.nothingTitle}</h2>
            <p className="muted">{t.review.nothingText}</p>
          </div>
        )}
      </section>
    </>
  );
}
