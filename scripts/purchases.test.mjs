// Purchase rules and plain-date handling. Run: npm test
// Runs in a western time zone, where reading "2026-11-08" through the local clock used to show 7 Nov.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fmtDate } from "../src/lib/format.ts";
import { groupByYear, purchaseProblem } from "../src/lib/purchases.ts";

process.env.TZ = "America/Los_Angeles"; // Node applies this to every date after this line

const purchase = (id, points, purchased_on) => ({ purchase_id: id, company_id: "A", company: "A", points, purchased_on, note: null });

test("a plain date keeps its day west of UTC", () => {
  assert.equal(fmtDate("2026-11-08"), "8 Nov 2026");
  assert.equal(fmtDate("2026-11-01", "ar"), "1 نوفمبر 2026");
});

test("purchases land in their own month and year, newest year first", () => {
  const years = groupByYear([
    purchase(1, 100, "2026-11-01"), purchase(2, 50, "2026-11-01"),
    purchase(3, 7, "2025-12-31"), purchase(4, 9, "2026-01-01"),
  ]);
  assert.deepEqual(years.map((y) => y.year), [2026, 2025]);
  assert.deepEqual(years[0].months[10].map((p) => p.purchase_id), [1, 2]); // November 2026, both purchases
  assert.deepEqual(years[0].months[0].map((p) => p.purchase_id), [4]); // January 2026, not December 2025
  assert.deepEqual(years[1].months[11].map((p) => p.purchase_id), [3]); // December 2025, not November
  assert.equal(years[0].months.flat().reduce((s, p) => s + p.points, 0), 159);
});

test("the Add purchase form refuses bad points, dates and notes before sending", () => {
  const today = "2026-11-09";
  const ok = { hasCompany: true, points: " 12500 ", date: today, note: "" };
  assert.equal(purchaseProblem(ok, today), null); // today is allowed, spaces around the number are fine
  assert.equal(purchaseProblem({ ...ok, hasCompany: false }, today), "errCompany");
  for (const points of ["0", "12.5", "-3", "1e3", "", "abc", "99999999999999999999"]) {
    assert.equal(purchaseProblem({ ...ok, points }, today), "errPoints", `points "${points}"`);
  }
  assert.equal(purchaseProblem({ ...ok, date: "2026-11-10" }, today), "errDate"); // tomorrow
  assert.equal(purchaseProblem({ ...ok, date: "" }, today), "errDate");
  assert.equal(purchaseProblem({ ...ok, note: "x".repeat(200) }, today), null);
  assert.equal(purchaseProblem({ ...ok, note: "x".repeat(201) }, today), "errNote");
});
