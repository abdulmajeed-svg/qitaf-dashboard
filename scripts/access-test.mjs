// Dev/QA only. Not part of the app and never shipped to users.
// Checks that each role (and anonymous visitors) can reach only what they should.
// Run:  npm run test:access      (reads QA_* logins from .env.test.local, which is never committed)
import { createClient } from "@supabase/supabase-js";

// URL + publishable key come from .env.local if they are not already in the environment.
try { process.loadEnvFile(".env.local"); } catch { /* optional */ }
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.local).");
  process.exit(2);
}

const TABLES = ["responses", "response_answers", "raw_responses", "companies"];
const results = [];
function check(group, name, ok, detail = "") {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  [${group}] ${name}${!ok && detail ? `  -> ${detail}` : ""}`);
}
const client = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const brief = (r) => (r.error ? `error: ${r.error.message}` : `data: ${JSON.stringify(r.data)?.slice(0, 120)}`);

async function login(group, emailVar, passVar) {
  const email = process.env[emailVar];
  const password = process.env[passVar];
  if (!email || !password) {
    check(group, `login (needs ${emailVar} and ${passVar} in .env.test.local)`, false, "credentials missing");
    return null;
  }
  const sb = client();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  check(group, "login works", !error, error?.message);
  return error ? null : sb;
}

const rpcErrors = async (group, sb, calls) => {
  for (const [name, args] of calls) {
    const r = await sb.rpc(name, args);
    check(group, `${name}${args ? `(${Object.values(args)[0]})` : ""} is refused`, !!r.error, brief(r));
  }
};
const tablesBlocked = async (group, sb) => {
  for (const t of TABLES) {
    const r = await sb.from(t).select("*").limit(5);
    check(group, `from('${t}') gives error or zero rows`, !!r.error || (Array.isArray(r.data) && r.data.length === 0), brief(r));
  }
};

/* ---------- Admin first: also gives us the real company names to look for in the STC data ---------- */
let companyNames = [];
{
  const G = "ADMIN";
  const sb = await login(G, "QA_ADMIN_EMAIL", "QA_ADMIN_PASSWORD");
  if (sb) {
    const prof = await sb.rpc("my_profile");
    check(G, "my_profile works and role is ADMIN", !prof.error && prof.data?.role === "ADMIN", brief(prof));
    const list = await sb.rpc("list_companies");
    check(G, "list_companies works", !list.error && Array.isArray(list.data), brief(list));
    if (Array.isArray(list.data)) companyNames = list.data.map((c) => c.name).filter(Boolean);
    const dash = await sb.rpc("get_company_dashboard", { p_company: "TEST-012" });
    check(G, "get_company_dashboard('TEST-012') works", !dash.error && dash.data?.company?.company_id === "TEST-012", brief(dash));
    const pf = await sb.rpc("get_portfolio");
    check(G, "get_portfolio works", !pf.error && !!pf.data?.kpi, brief(pf));
    const stc = await sb.rpc("get_stc_overview");
    check(G, "get_stc_overview works", !stc.error && !!stc.data?.status, brief(stc));
    const rq = await sb.rpc("get_review_queue");
    check(G, "get_review_queue works", !rq.error && Array.isArray(rq.data), brief(rq));
    const nine = await sb.rpc("get_company_dashboard", { p_company: "TEST-009" });
    const d = nine.data;
    check(G, "get_company_dashboard('TEST-009') is SUPPRESSED, items empty, csat null",
      !nine.error && d?.status === "SUPPRESSED" && Array.isArray(d.items) && d.items.length === 0 && d.kpi?.csat === null,
      nine.error ? brief(nine) : `status=${d?.status} items=${d?.items?.length} csat=${d?.kpi?.csat}`);
  }
}

/* ---------- Company HR (TEST-012) ---------- */
{
  const G = "COMPANY_HR";
  const sb = await login(G, "QA_HR_EMAIL", "QA_HR_PASSWORD");
  if (sb) {
    const prof = await sb.rpc("my_profile");
    check(G, "my_profile role is COMPANY_HR for TEST-012", !prof.error && prof.data?.role === "COMPANY_HR" && prof.data?.company_id === "TEST-012", brief(prof));
    const other = await sb.rpc("get_company_dashboard", { p_company: "TEST-015" });
    check(G, "get_company_dashboard('TEST-015') returns TEST-012, never TEST-015",
      !other.error && other.data?.company?.company_id === "TEST-012", other.error ? brief(other) : `got ${other.data?.company?.company_id}`);
    await rpcErrors(G, sb, [["get_portfolio"], ["get_stc_overview"], ["get_review_queue"], ["list_companies"]]);
    await tablesBlocked(G, sb);
  }
}

/* ---------- STC ---------- */
{
  const G = "STC";
  const sb = await login(G, "QA_STC_EMAIL", "QA_STC_PASSWORD");
  if (sb) {
    const stc = await sb.rpc("get_stc_overview");
    check(G, "get_stc_overview works", !stc.error && !!stc.data?.status, brief(stc));
    const text = JSON.stringify(stc.data ?? {});
    const found = companyNames.filter((n) => text.includes(n));
    const generic = /Synthetic Co|TEST-\d+|Pilot Company/i.test(text);
    check(G, "get_stc_overview contains no company names", found.length === 0 && !generic,
      found.length ? `found: ${found.join(", ")}` : "looks like a company name or id");
    // STC sees companies like ADMIN (supabase/proposed-stc-access.sql), but not the review queue.
    const pf = await sb.rpc("get_portfolio");
    check(G, "get_portfolio works", !pf.error && !!pf.data?.kpi, brief(pf));
    const list = await sb.rpc("list_companies");
    check(G, "list_companies works", !list.error && Array.isArray(list.data), brief(list));
    const dash = await sb.rpc("get_company_dashboard", { p_company: "TEST-012" });
    check(G, "get_company_dashboard('TEST-012') works", !dash.error && dash.data?.company?.company_id === "TEST-012", brief(dash));
    await rpcErrors(G, sb, [["get_review_queue"]]);
    await tablesBlocked(G, sb);
  }
}

/* ---------- Anonymous (no login) ---------- */
{
  const G = "ANONYMOUS";
  const sb = client();
  // my_profile may answer null (no profile) instead of raising an error; both mean "no access".
  const prof = await sb.rpc("my_profile");
  check(G, "my_profile gives error or null", !!prof.error || prof.data == null, brief(prof));
  await rpcErrors(G, sb, [
    ["list_companies"], ["get_company_dashboard", { p_company: "TEST-012" }], ["get_portfolio"],
    ["get_stc_overview"], ["get_review_queue"],
  ]);
  await tablesBlocked(G, sb);
}

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
