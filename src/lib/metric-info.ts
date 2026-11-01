// All "what is this?" wording for the dashboard lives here, so it can be edited in one place.
// Each entry may have: text (one plain paragraph), or what / how / hidden (shown as three short parts).

export type Section = "Portfolio" | "Heatmap columns" | "Company results" | "STC view" | "Review queue";

export interface Metric {
  section: Section;
  title: string;
  text?: string;
  what?: string;
  how?: string;
  hidden?: string;
}

// Shared wording for the five 1–5 question columns.
const ITEM_HOW = "Average of employee ratings from 1 (lowest) to 5 (highest) for that question.";
const ITEM_HIDDEN = "Fewer than the minimum number of valid responses for that question in this survey round.";

export const METRICS = {
  /* ---------- Portfolio ---------- */
  "portfolio.companies": {
    section: "Portfolio", title: "Companies",
    what: "Companies taking part in the survey.",
    how: "Count of companies, using each company’s latest survey round. “Results available” = companies with at least the minimum number of valid responses for their survey round.",
  },
  "portfolio.answers": {
    section: "Portfolio", title: "Employee answers",
    what: "Survey answers accepted so far.",
    how: "Count of employee responses that passed validation. Answers with errors (for example a wrong company code) are not counted; they go to the review queue.",
  },
  "portfolio.below": {
    section: "Portfolio", title: "Waiting for more responses",
    what: "Companies whose results can’t be shown yet.",
    how: "Companies with fewer than the minimum number of valid responses for their survey round, including those with none.",
    hidden: "Their scores stay hidden until they reach the minimum number of valid responses, so no individual can be identified.",
  },
  "portfolio.actions": {
    section: "Portfolio", title: "Open actions",
    what: "Follow-up tasks not yet closed.",
    how: "Actions with status Open or In progress. “High priority” = open actions marked High.",
  },
  "portfolio.review": {
    section: "Portfolio", title: "In review queue",
    what: "Answers that failed validation.",
    how: "Submissions with a problem such as an unknown company code. They are kept safely but not counted until fixed.",
  },

  /* ---------- Heatmap columns ---------- */
  "heat.status": {
    section: "Heatmap columns", title: "Results status",
    what: "Whether this company’s results can be shown yet. “Results available · 12 valid responses” = the minimum has been reached. “Waiting for more responses · 9 of 12” = fewer valid responses than the minimum so far. “No responses yet” = none received.",
    how: "Results are shown only when at least the minimum number of valid responses is received for the survey round, to protect employee confidentiality. Valid = passed all checks (correct company code, open survey round).",
    hidden: "Below the minimum, results stay hidden so no individual can be identified.",
  },
  "heat.rate": {
    section: "Heatmap columns", title: "Response rate",
    how: "Valid responses ÷ employees invited, for example 12 ÷ 30 = 40%. Hover or tap the rate to see the numbers. Shown only when the invited count is confirmed by the company.",
    hidden: "If the invited count is not confirmed, no rate is shown; the number of valid responses is shown instead.",
  },
  "heat.A07": { section: "Heatmap columns", title: "Appreciated", how: ITEM_HOW, hidden: ITEM_HIDDEN },
  "heat.A09": { section: "Heatmap columns", title: "Reward exp.", how: ITEM_HOW, hidden: ITEM_HIDDEN },
  "heat.A06": { section: "Heatmap columns", title: "Usefulness", how: ITEM_HOW, hidden: ITEM_HIDDEN },
  "heat.A05": { section: "Heatmap columns", title: "Merchants", how: ITEM_HOW, hidden: ITEM_HIDDEN },
  "heat.A03": {
    section: "Heatmap columns", title: "Ease",
    how: "Average 1–5 rating of how easy redeeming was, only from employees who tried to redeem.",
    hidden: "Fewer than the minimum number of people tried to redeem in this survey round.",
  },
  "heat.A01": { section: "Heatmap columns", title: "Clarity", how: ITEM_HOW, hidden: ITEM_HIDDEN },
  "heat.satisfied": {
    section: "Heatmap columns", title: "Satisfied",
    how: "% of employees who rated their overall reward experience 4 or 5 out of 5.",
    hidden: "Fewer valid responses than the minimum for this survey round.",
  },
  "heat.actions": {
    section: "Heatmap columns", title: "Actions",
    text: "Number of open follow-up actions for that company.",
  },
  "heat.colours": {
    section: "Heatmap columns", title: "Heatmap shading",
    text: "Darker shade = higher average score, on a scale from 1 (lowest) to 5 (highest). The number is always shown.",
  },

  /* ---------- Company results ---------- */
  "company.satisfied": {
    section: "Company results", title: "Employees satisfied",
    text: "% of employees who rated their overall experience 4 or 5 out of 5.",
  },
  "company.rate": {
    section: "Company results", title: "Response rate",
    text: "Valid responses ÷ employees invited, for example 12 ÷ 30 = 40% (hover or tap the rate to see the numbers). Shown only when the invited count is confirmed; otherwise the number of valid responses is shown.",
  },
  "company.redeemed": {
    section: "Company results", title: "Redeemed successfully",
    text: "Employees who said redeeming worked ÷ employees who received points. “% of those who tried” = successful ÷ those who tried (shown only when at least the minimum number of people tried).",
  },
  "company.lowest": {
    section: "Company results", title: "Lowest score",
    text: "The lowest of the visible experience scores.",
  },
  "company.scores": {
    section: "Company results", title: "Experience scores",
    text: "Average rating per question, from 1 (lowest) to 5 (highest). Hidden = fewer than the minimum number of valid responses for that question in this survey round.",
  },
  "company.journey": {
    section: "Company results", title: "Redemption journey",
    text: "Received points → Tried to redeem → Redeemed, based on what employees reported in the survey, not on verified STC transactions. Reasons for not redeeming are shown only when there are at least the minimum number of valid responses.",
  },
  "company.org": {
    section: "Company results", title: "HR assessment",
    text: "Answers from one authorised HR person at the company. Submitted / Not submitted. Scores run from 1 (lowest) to 5 (highest).",
  },
  "company.actions": {
    section: "Company results", title: "Actions",
    text: "Agreed follow-up: what, who owns it, due date and status. “Overdue” = past the due date and not closed.",
  },

  /* ---------- STC view ---------- */
  "stc.about": {
    section: "STC view", title: "STC view",
    text: "Combined results across companies, excluding the pilot. Only companies with results available (at least the minimum number of valid responses for their survey round) are included, and results appear only when at least 3 such companies exist, so no single company can be identified. No company names are shown.",
  },
  "stc.rate": {
    section: "STC view", title: "Response rate",
    text: "Response rate here = total valid responses ÷ total invited, across companies with a confirmed invited count.",
  },

  /* ---------- Review queue ---------- */
  "review.about": {
    section: "Review queue", title: "Review queue",
    text: "Answers that failed automatic checks. Common reasons: unknown or missing company code, no open survey round, “None” selected together with other options, or an option that couldn’t be mapped. They are stored but never counted until corrected.",
  },
} as const satisfies Record<string, Metric>;

export type MetricId = keyof typeof METRICS;

// Heatmap question columns (A07, A09, ...) -> their metric id.
export const itemMetricId = (code: string): MetricId | undefined => {
  const id = `heat.${code}`;
  return id in METRICS ? (id as MetricId) : undefined;
};

export const SECTION_ORDER: Section[] = ["Portfolio", "Heatmap columns", "Company results", "STC view", "Review queue"];

// Which sections to list first in the glossary for each role (all sections are still shown).
export const ROLE_FIRST: Record<"ADMIN" | "COMPANY_HR" | "STC", Section[]> = {
  ADMIN: ["Portfolio", "Heatmap columns", "Company results", "STC view", "Review queue"],
  COMPANY_HR: ["Company results"],
  STC: ["STC view", "Company results"],
};
