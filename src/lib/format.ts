import type { ActionRow, Role } from "./types";
import type { Dict, Lang } from "./i18n"; // types only, so scripts/purchases.test.mjs can load this file directly

// Dates: English as before; Arabic month names with the Gregorian calendar and Western digits.
export const LOCALE: Record<Lang, string> = { en: "en-GB", ar: "ar-u-ca-gregory-nu-latn" };

// One neutral purple scale (Qitaf light purple -> purple -> dark purple): the shade only reflects the value
// (darker = higher), never good/bad. White text passes AA (7.7:1 or better) on every shade.
const SHADE_STOPS = [[115, 51, 163], [79, 0, 140], [58, 16, 102]]; // #7333A3, #4F008C, #3A1066
const shadeAt = (s: number) => {
  const t = Math.min(Math.max((s - 1) / 4, 0), 1);
  const [a, b, k] = t <= 0.5 ? [SHADE_STOPS[0], SHADE_STOPS[1], t / 0.5] : [SHADE_STOPS[1], SHADE_STOPS[2], (t - 0.5) / 0.5];
  const [r, g, bl] = a.map((c, i) => Math.round(c + (b[i] - c) * k));
  return `rgb(${r}, ${g}, ${bl})`;
};

export const scoreColor = (s: number) => shadeAt(s);

// [background, text] for a heatmap cell.
export const tileColors = (s: number): [string, string] => [shadeAt(s), "#FFFFFF"];
// The confidentiality threshold comes from the database per survey round; 10 only if it is missing.
export const DEFAULT_MIN_RESPONSES = 10;
export const minResponses = (v: number | null | undefined) =>
  typeof v === "number" && v > 0 ? v : DEFAULT_MIN_RESPONSES;
// Plain dates ("2026-11-08", e.g. due dates, purchase dates) are read as UTC midnight, so they are also
// formatted in UTC: otherwise west of UTC 8 Nov would show as 7 Nov.
export const fmtDate = (d: string | null | undefined, lang: Lang = "en") =>
  d ? new Date(d).toLocaleDateString(LOCALE[lang], { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";

// Thousands separators and Western digits in both languages: 12,500.
export const fmtNumber = (n: number) => n.toLocaleString("en-US");

// Today on the user's own clock, as YYYY-MM-DD (not UTC, which in Riyadh is still yesterday until 3 am).
export const today = () => new Date().toLocaleDateString("en-CA");

export const isOverdue = (a: ActionRow) =>
  a.status !== "Closed" && !!a.due_date && new Date(a.due_date) < new Date();

// Reasons for not redeeming. Any code not in the dictionary is shown as "Other", never as the raw code.
export const barrierText = (t: Dict, code: string) => t.barriers[code] ?? t.barriers.OTHER;

// Heatmap question columns, in display order; their labels are in the dictionary (itemShort).
export const ITEM_COLS = ["A07", "A09", "A06", "A05", "A03", "A01"];

// The first page of each role is where sign-in lands. Any page not listed for a role (for example
// /portfolio or /tracking for STC) redirects to that first page.
export const NAV: Record<Role, { href: string; label: keyof Dict["nav"] }[]> = {
  ADMIN: [
    { href: "/tracking", label: "tracking" },
    { href: "/portfolio", label: "portfolio" },
    { href: "/company", label: "companyResults" },
    { href: "/stc", label: "stcView" },
    { href: "/review", label: "reviewQueue" },
  ],
  COMPANY_HR: [
    { href: "/tracking", label: "tracking" },
    { href: "/company", label: "surveyResults" },
  ],
  STC: [
    { href: "/stc", label: "programOverview" },
    { href: "/company", label: "companyResults" },
  ],
};

export const homeFor = (role: Role) => NAV[role][0].href;
