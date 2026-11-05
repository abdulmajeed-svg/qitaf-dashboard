"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Metric, MetricId } from "@/lib/metric-info";
import { useLang } from "@/lib/lang-context";

const PHONE_QUERY = "(max-width: 640px)";

// The three short parts of an entry. Entries with a single paragraph show just the paragraph.
export function MetricBody({ m, headingLevel = 4 }: { m: Metric; headingLevel?: 3 | 4 }) {
  const { t } = useLang();
  const H = `h${headingLevel}` as "h3" | "h4";
  return (
    <>
      {m.text ? <p>{m.text}</p> : null}
      {m.what ? <div className="info-part"><H>{t.glossary.whatItShows}</H><p>{m.what}</p></div> : null}
      {m.how ? <div className="info-part"><H>{t.glossary.howCalculated}</H><p>{m.how}</p></div> : null}
      {m.hidden ? <div className="info-part"><H>{t.glossary.whenHidden}</H><p>{m.hidden}</p></div> : null}
    </>
  );
}

// "ⓘ" button. Opens a popover (laptop/tablet) or a bottom sheet (phone), rendered in a portal on
// document.body so it can't shift the layout. Esc, outside click or the close button close it and
// focus goes back to the button.
export function InfoButton({ id }: { id: MetricId }) {
  const { t } = useLang();
  const m: Metric = t.metrics[id];
  const uid = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    setPos(null);
    if (refocus) btnRef.current?.focus({ preventScroll: true });
  }, []);

  const place = useCallback(() => {
    const b = btnRef.current;
    const p = popRef.current;
    if (!b || !p) return;
    const r = b.getBoundingClientRect();
    const pw = p.offsetWidth;
    const ph = p.offsetHeight;
    const left = Math.min(Math.max(r.left + r.width / 2 - pw / 2, 12), Math.max(window.innerWidth - pw - 12, 12));
    let top = r.bottom + 8;
    if (top + ph > window.innerHeight - 12 && r.top - 8 - ph > 12) top = r.top - 8 - ph; // flip above
    top = Math.max(top, 12);
    setPos((prev) => (prev && prev.left === left && prev.top === top ? prev : { left, top }));
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    if (!sheet) place();
    closeRef.current?.focus({ preventScroll: true });
  }, [open, sheet, place]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Capture phase on window: runs before the side drawer's Esc handler, so only this closes.
        e.stopImmediatePropagation();
        close(true);
      }
    };
    const onOutside = (e: PointerEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      close(false);
    };
    const onMove = () => { if (!sheet) place(); };
    window.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onOutside);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onOutside);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, sheet, close, place]);

  function toggle() {
    if (open) return close(false);
    setSheet(window.matchMedia(PHONE_QUERY).matches);
    setPos(null);
    setOpen(true);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="info-btn"
        aria-label={t.glossary.about(m.title)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? uid : undefined}
        onClick={toggle}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <circle cx="8" cy="8" r="6.6" />
          <path d="M8 7.2v4" strokeLinecap="round" />
          <circle cx="8" cy="4.9" r=".5" fill="currentColor" />
        </svg>
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <>
              {sheet ? <div className="info-backdrop" aria-hidden="true" /> : null}
              <div
                ref={popRef}
                id={uid}
                role="dialog"
                aria-label={m.title}
                className={`info-pop ${sheet ? "info-sheet" : ""}`}
                style={sheet ? undefined : { left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? "visible" : "hidden" }}
              >
                <button ref={closeRef} type="button" className="info-close" onClick={() => close(true)} aria-label={t.glossary.close(m.title)}>
                  <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <path d="M2 2l10 10M12 2L2 12" />
                  </svg>
                </button>
                <h3>{m.title}</h3>
                <MetricBody m={m} />
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
