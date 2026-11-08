"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLang } from "@/lib/lang-context";
import type { CompanyRef } from "@/lib/types";

// Companies whose name contains the typed text anywhere, ignoring case.
export const matchCompanies = (companies: CompanyRef[], query: string) => {
  const q = query.trim().toLocaleLowerCase();
  return q ? companies.filter((c) => c.name.toLocaleLowerCase().includes(q)) : companies;
};

// Type-to-search company field (ARIA combobox with a listbox). Arrows move, Enter picks, Escape closes.
// The caller renders the <label htmlFor={id}>.
export function CompanySearch({ id, companies, value, onChange }: {
  id: string; companies: CompanyRef[]; value: CompanyRef | null; onChange: (c: CompanyRef) => void;
}) {
  const { t } = useLang();
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  // Show the chosen company's name whenever the choice changes.
  useEffect(() => setQuery(value?.name ?? ""), [value?.company_id, value?.name]);

  const matches = matchCompanies(companies, query);
  const shown = open && matches.length > 0;

  useEffect(() => {
    if (shown && active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [shown, active]);

  function pick(c: CompanyRef) {
    onChange(c);
    setQuery(c.name);
    setOpen(false);
    setActive(-1);
  }

  function close() {
    setOpen(false);
    setActive(-1);
    setQuery(value?.name ?? ""); // the field always shows what is actually chosen
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!matches.length) return;
      if (!open) { setOpen(true); setActive(0); return; }
      setActive((a) => (e.key === "ArrowDown" ? Math.min(a + 1, matches.length - 1) : Math.max(a - 1, 0)));
    } else if (e.key === "Enter" && shown && active >= 0) {
      e.preventDefault(); // pick the company, don't submit a surrounding form
      pick(matches[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  }

  return (
    <div className="combo">
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={shown}
        aria-controls={listId}
        aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
        placeholder={t.tracking.search}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={close}
        onKeyDown={onKeyDown}
      />
      {shown ? (
        <ul className="combo-list" role="listbox" id={listId} ref={listRef}>
          {matches.map((c, i) => (
            <li key={c.company_id} id={`${listId}-${i}`} role="option" aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => pick(c)}>
              {c.name}
            </li>
          ))}
        </ul>
      ) : open && query.trim() ? <div className="combo-list combo-empty" role="status">{t.portfolio.noMatch}</div> : null}
    </div>
  );
}
