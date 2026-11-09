import type { PointsPurchase } from "./types";

// Tested in scripts/purchases.test.mjs (npm test).

export const NOTE_MAX = 200;

// Which rule a new purchase breaks, if any (a key of t.tracking), checked before it is sent.
// `today` is the local date as YYYY-MM-DD, so today's purchases are never "in the future".
export function purchaseProblem(p: { hasCompany: boolean; points: string; date: string; note: string }, today: string) {
  const points = p.points.trim();
  if (!p.hasCompany) return "errCompany" as const;
  if (!/^\d+$/.test(points) || !Number.isSafeInteger(Number(points)) || Number(points) <= 0) return "errPoints" as const;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date) || p.date > today) return "errDate" as const;
  if (p.note.length > NOTE_MAX) return "errNote" as const;
  return null;
}

// Purchases by year (newest first), each year split into its 12 months (index 0 = January), read straight
// from the plain "YYYY-MM-DD" text: never through a time zone, so 8 Nov stays 8 Nov.
export function groupByYear(purchases: PointsPurchase[]) {
  const years = new Map<number, PointsPurchase[][]>();
  for (const p of purchases) {
    const year = Number(p.purchased_on.slice(0, 4));
    if (!years.has(year)) years.set(year, Array.from({ length: 12 }, () => []));
    years.get(year)![Number(p.purchased_on.slice(5, 7)) - 1].push(p);
  }
  for (const months of years.values()) for (const m of months) m.sort((a, b) => a.purchased_on.localeCompare(b.purchased_on));
  return [...years].sort(([a], [b]) => b - a).map(([year, months]) => ({ year, months }));
}
