import type { ActionRow, Role } from "./types";

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
// "12 valid responses" / "1 valid response"
export const validResponses = (n: number) => `${n} valid ${n === 1 ? "response" : "responses"}`;

// Tooltip for any response-rate figure, built only from fields the RPCs return (no new maths on scores).
export const responseRateTip = (invited: number | null | undefined, responded: number, rate: number | null | undefined) =>
  rate !== null && rate !== undefined && invited !== null && invited !== undefined
    ? `Invited: ${invited} · Valid responses: ${responded} · ${responded} ÷ ${invited} = ${rate}%`
    : `Invited count not confirmed · ${validResponses(responded)}`;

// The confidentiality threshold comes from the database per survey round; 10 only if it is missing.
export const DEFAULT_MIN_RESPONSES = 10;
export const minResponses = (v: number | null | undefined) =>
  typeof v === "number" && v > 0 ? v : DEFAULT_MIN_RESPONSES;
export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

export const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export const isOverdue = (a: ActionRow) =>
  a.status !== "Closed" && !!a.due_date && new Date(a.due_date) < new Date();

export const CODE_TEXT: Record<string, string> = {
  SOME_LESS: "Somewhat less time", MUCH_LESS: "Much less time", NO_CHANGE: "No change",
  SOME_MORE: "Somewhat more time", MUCH_MORE: "Much more time", NOT_APPLICABLE: "Not applicable",
  ONBOARDING: "Onboarding", ALLOCATION: "Points allocation", REDEMPTION: "Redemption issues",
  REPORT: "Reporting", INVOICING: "Invoicing", SUPPORT: "Support", OTHER: "Other", NONE: "None",
  EXPANDING: "Already expanding", PLANNED: "Expansion planned", POSSIBLE: "Possible, not planned",
  DONT_KNOW: "Does not know", FILE: "File-based process", PAYROLL: "Payroll system",
  NO_SUPPORT: "No support needed", NOT_DECIDER: "Not involved in decision",
  TOO_EARLY: "Too early to say", NO_REPORTS: "No reports available",
  DUP: "Duplicate allocations", MISMATCH: "Records do not match",
};

// Reasons for not redeeming. Any code not listed here is shown as "Other", never as the raw code.
export const BARRIER_TEXT: Record<string, string> = {
  SAVE: "Saving points for later", HOW: "Do not know how to redeem", BALANCE: "Balance is insufficient",
  MERCHANT: "Merchants or options do not suit me", TERMS: "Unsure about the conditions or validity",
  TECH: "Technical or access problem", TIME: "Have not had time", OTHER: "Other",
  NOT_RECEIVED: "Did not think they received points", // from question A02, added to the barriers by the database
};
export const barrierText = (code: string) => BARRIER_TEXT[code] ?? BARRIER_TEXT.OTHER;

export const AUDIENCE_TEXT: Record<string, string> = { A: "Employee", B: "HR", C: "Finance", D: "IT" };

export const ITEM_COLS: [string, string][] = [
  ["A07", "Appreciated"], ["A09", "Reward exp."], ["A06", "Usefulness"],
  ["A05", "Merchants"], ["A03", "Ease"], ["A01", "Clarity"],
];

export const NAV: Record<Role, { href: string; label: string }[]> = {
  ADMIN: [
    { href: "/portfolio", label: "Portfolio" },
    { href: "/company", label: "Company results" },
    { href: "/stc", label: "STC view" },
    { href: "/review", label: "Review queue" },
  ],
  COMPANY_HR: [{ href: "/company", label: "Our results" }],
  STC: [{ href: "/stc", label: "Program overview" }],
};

export const homeFor = (role: Role) => NAV[role][0].href;
