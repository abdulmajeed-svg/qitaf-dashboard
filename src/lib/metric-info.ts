// Where each "what is this?" entry belongs in the glossary. The wording itself, in English and Arabic,
// is in i18n.ts (metrics). Each entry has either text (one paragraph) or what / how / hidden (three short parts).
import type { MetricId } from "./i18n";

export type { Metric, MetricId } from "./i18n";

export type Section = "Portfolio" | "Heatmap columns" | "Company results" | "STC view" | "Review queue";

export const METRIC_SECTION: Record<MetricId, Section> = {
  "portfolio.companies": "Portfolio",
  "portfolio.answers": "Portfolio",
  "portfolio.below": "Portfolio",
  "portfolio.actions": "Portfolio",
  "portfolio.review": "Portfolio",
  "portfolio.barriers": "Portfolio",
  "heat.status": "Heatmap columns",
  "heat.rate": "Heatmap columns",
  "heat.A07": "Heatmap columns",
  "heat.A09": "Heatmap columns",
  "heat.A06": "Heatmap columns",
  "heat.A05": "Heatmap columns",
  "heat.A03": "Heatmap columns",
  "heat.A01": "Heatmap columns",
  "heat.satisfied": "Heatmap columns",
  "heat.actions": "Heatmap columns",
  "heat.colours": "Heatmap columns",
  "company.satisfied": "Company results",
  "company.rate": "Company results",
  "company.redeemed": "Company results",
  "company.appreciated": "Company results",
  "company.scores": "Company results",
  "company.journey": "Company results",
  "company.barriers": "Company results",
  "company.motivation": "Company results",
  "company.org": "Company results",
  "company.actions": "Company results",
  "stc.about": "STC view",
  "stc.rate": "STC view",
  "stc.barriers": "STC view",
  "review.about": "Review queue",
};

// Heatmap question columns (A07, A09, ...) -> their metric id.
export const itemMetricId = (code: string): MetricId | undefined => {
  const id = `heat.${code}`;
  return id in METRIC_SECTION ? (id as MetricId) : undefined;
};

export const SECTION_ORDER: Section[] = ["Portfolio", "Heatmap columns", "Company results", "STC view", "Review queue"];

// Which sections to list first in the glossary for each role (all sections are still shown).
export const ROLE_FIRST: Record<"ADMIN" | "COMPANY_HR" | "STC", Section[]> = {
  ADMIN: ["Portfolio", "Heatmap columns", "Company results", "STC view", "Review queue"],
  COMPANY_HR: ["Company results"],
  STC: ["STC view", "Company results"],
};
