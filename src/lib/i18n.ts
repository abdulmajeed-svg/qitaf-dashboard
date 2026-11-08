// Every piece of visible text in the dashboard, in English and Arabic.
// Text that comes from the database (company names, emails, action details, error messages) is shown as is.
import type { ReportStatus } from "./types";

export type Lang = "en" | "ar";

// Dates: English as before; Arabic month names with the Gregorian calendar and Western digits.
export const LOCALE: Record<Lang, string> = { en: "en-GB", ar: "ar-u-ca-gregory-nu-latn" };

// One "ⓘ" explanation. Either one paragraph (text) or up to three short parts (what / how / hidden).
export interface Metric {
  title: string;
  text?: string;
  what?: string;
  how?: string;
  hidden?: string;
}

// Lookup tables keyed by database codes. Unknown codes fall back to the database text.
const codeMap = (m: Record<string, string>) => m;

/* ---------- English ---------- */

const enValid = (n: number) => `${n} valid ${n === 1 ? "response" : "responses"}`;
const enUnderMin = (min?: number) => (min ? `fewer than ${min} valid responses` : "fewer than the minimum number of valid responses");
const EN_ITEM_HOW = "Average of employee ratings from 1 (lowest) to 5 (highest) for that question.";
const EN_ITEM_HIDDEN = "Fewer than the minimum number of valid responses for that question in this survey round.";

const en = {
  common: {
    loading: "Loading…",
    loadingSr: "Loading",
    tryAgain: "Try again",
    refresh: "Refresh",
    closeEsc: "Close (Esc)",
    hidden: "Hidden",
    outOf5: " / 5",
    dataUpdated: "Data updated",
    somethingWrong: "Something went wrong",
    couldNotLoadPage: "Could not load this page",
    validResponses: enValid,
    underMin: enUnderMin,
    rateTip: (invited: number | null | undefined, responded: number, rate: number | null | undefined) =>
      rate !== null && rate !== undefined && invited !== null && invited !== undefined
        ? `Invited: ${invited} · Valid responses: ${responded} · ${responded} ÷ ${invited} = ${rate}%`
        : `Invited count not confirmed · ${enValid(responded)}`,
    surveyNotVerified: "Survey answers, not verified STC transactions.",
  },
  header: {
    insights: "Insights",
    logoAlt: "qitaf from stc",
    sections: "Sections",
    signOut: "Sign out",
    couldNotLoadAccount: "Could not load your account",
    switchLanguage: "Switch to Arabic (العربية)",
    otherLanguage: "العربية",
  },
  roles: { ADMIN: "Asalah admin", STC: "STC", COMPANY_HR: "Company HR" },
  nav: {
    tracking: "Tracking",
    portfolio: "Portfolio",
    companyResults: "Company results",
    surveyResults: "Survey results",
    stcView: "STC view",
    programOverview: "Program overview",
    reviewQueue: "Review queue",
  },
  theme: {
    light: "Light theme",
    dark: "Dark theme",
    switchToLight: "Switch to light theme",
    switchToDark: "Switch to dark theme",
  },
  glossary: {
    title: "How to read this dashboard",
    intro: "What each number means, how it is worked out, and when it is hidden to protect privacy.",
    whatItShows: "What it shows",
    howCalculated: "How it’s calculated",
    whenHidden: "When it’s hidden",
    about: (title: string) => `About ${title}`,
    close: (title: string) => `Close: ${title}`,
    sections: {
      Tracking: "Tracking",
      Portfolio: "Portfolio",
      "Heatmap columns": "Heatmap columns",
      "Company results": "Company results",
      "STC view": "STC view",
      "Review queue": "Review queue",
    },
  },
  login: {
    signIn: "Sign in",
    tagline: "Qitaf Insights: see your rewards results.",
    email: "Email",
    password: "Password",
    signingIn: "Signing in…",
    wrongLogin: "Email or password is incorrect.",
    noAccess: "This account has no access yet. Ask Asalah to assign a role.",
  },
  charts: {
    ringAria: (pct: number) => `${pct} percent satisfied`,
    scoreTip: (label: string, score: string, n: number) => `${label}: ${score} out of 5, ${n} responses`,
    hiddenTip: (label: string, min?: number) => `${label}: Hidden: ${enUnderMin(min)}`,
    received: "Received points",
    tried: "Tried to redeem",
    redeemed: "Redeemed",
    funnelAria: (received: number, tried: number, succeeded: number) => `${received} received, ${tried} tried, ${succeeded} redeemed`,
    failed: (tried: number, succeeded: number) => `Failed to redeem: ${tried - succeeded} (${tried} tried − ${succeeded} redeemed)`,
  },
  status: {
    reportChip: (status: ReportStatus, n: number, min: number) =>
      status === "REPORTABLE" ? `Results available · ${enValid(n)}`
        : status === "SUPPRESSED" ? `Waiting for more responses · ${n} of ${min}`
        : "No responses yet",
    reportChipTip: (min: number) =>
      `Results are shown only when at least ${min} valid responses are received, to protect employee confidentiality.`,
  },
  actions: {
    overdue: "Overdue",
    inProgress: "In progress",
    closed: "Closed",
    open: "Open",
    none: "No open actions.",
    nextStep: "Next step:",
    due: (date: string) => `, due ${date}`,
  },
  priority: codeMap({}),
  company: {
    picker: "Company",
    noResponsesTitle: "No responses yet",
    waitingTitle: "Waiting for more responses",
    noResponsesText: (min: number) => `No responses yet. Results are shown once at least ${min} valid responses are received.`,
    waitingText: (n: number, min: number) =>
      `${n} of ${min} valid responses received. Results are shown once ${min} valid responses are in, to protect employee confidentiality.`,
    progressAria: (min: number) => `Valid responses toward the ${min} needed`,
    progressNote: (n: number, min: number) => `${n} of ${min} valid responses needed`,
    satisfied: "Employees satisfied",
    satisfiedLine: (fav: number | null, n: number | null) => `${fav} of ${n} employees are satisfied`,
    satisfiedSub: "They rated their overall experience 4 or 5 out of 5.",
    responseRate: "Response rate",
    rateNote: (responded: number, invited: number | null) => `${responded} of ${invited} invited`,
    rateUnconfirmed: (responded: number) => `${enValid(responded)}; invited count not confirmed`,
    redeemed: "Redeemed successfully",
    redeemedNote: (succeeded: number, received: number) => `${succeeded} of ${received} who received points`,
    ofThoseWhoTried: (pct: number) => `${pct}% of those who tried`,
    appreciated: "Feeling appreciated",
    hiddenNote: (min: number) => `Hidden: ${enUnderMin(min)}`,
    scores: "Experience scores",
    journey: "Redemption journey",
    journeySub: "What employees told us, not verified STC transactions.",
    barriers: "Why employees haven’t redeemed",
    barriersSub: "Reasons employees gave for not redeeming their points.",
    barriersHidden: (min: number, n: number) =>
      `Reasons for not redeeming are hidden until at least ${min} valid responses are received (${n} so far).`,
    noReasons: "No reasons were given.",
    pieAria: (summary: string) => `Reasons for not redeeming: ${summary}`,
    motivation: "Effect on motivation",
    motivationSub: "How employees said the rewards changed their motivation.",
    increased: "Increased",
    noChange: "No change",
    decreased: "Decreased",
    motivationNote: (n: number) => `Based on ${n} employees who answered. “Prefer not to answer” is left out of the percentages.`,
    footer: (min: number) =>
      `Survey answers, not verified STC transactions. Employee results appear only with ${min} or more valid responses per question. Trends appear after the second survey wave.`,
  },
  portfolio: {
    title: "Portfolio",
    sub: "All companies in the program, their results status and follow-up.",
    filterAll: "All",
    filterAvailable: "Results available",
    filterWaiting: "Waiting for responses",
    filterPilot: "Pilot",
    companies: "Companies",
    companiesNote: (n: number) => `${n} with results available`,
    answers: "Employee answers",
    answersNote: "Accepted answers",
    below: "Waiting for more responses",
    belowNote: "Fewer than the minimum valid responses",
    openActions: "Open actions",
    highPriority: (n: number) => `${n} high priority`,
    review: "In review queue",
    reviewNote: "Answers that failed validation",
    heatmap: "Company heatmap",
    heatmapSub: "Average employee scores from 1 to 5. Hidden means the company has fewer than the minimum valid responses for its survey round. Select a company to see its full results.",
    downloadCsv: "Download CSV",
    search: "Search companies",
    filterAria: "Filter by status",
    shown: (n: number, total: number) => `${n} of ${total} companies`,
    colCompany: "Company",
    colStatus: "Results status",
    colRate: "Response rate",
    colSatisfied: "Satisfied",
    colActions: "Actions",
    sortBy: (label: string) => `Sort by ${label}`,
    noMatch: "No companies match.",
    pilot: "Pilot",
    openResults: (name: string) => `Open full results for ${name}`,
    invitedNotConfirmed: "Invited not confirmed",
    rateOf: (responded: number, invited: number) => `${responded} of ${invited}`,
    hiddenCellTip: (name: string, label: string, min: number) => `${name}, ${label}: Hidden: ${enUnderMin(min)}`,
    cellTip: (name: string, label: string, v: string, n: number) => `${name}, ${label}: ${v} out of 5, ${enValid(n)} in this company`,
    actionsSub: "Across all companies, soonest first.",
    barriersSub: "Reasons from every company that has enough answers, added together.",
    fullResults: (name: string) => `${name} full results`,
    loadingFull: "Loading full results",
    closeResults: (name: string) => `Close ${name} results`,
  },
  stc: {
    title: "Program overview",
    sub: "Combined results across participating companies. Pilot data is excluded.",
    hiddenTitle: "Combined results are hidden",
    hiddenText: (reason: string, participating: number, responses: number) =>
      `${reason}. ${participating} companies are taking part with ${responses} valid responses so far.`,
    satisfiedAcross: (n: number, companies: number) => `Across ${n} employees in ${companies} companies`,
    participating: "Participating companies",
    participatingNote: (n: number) => `${n} companies with results available`,
    rateNote: "Companies with a confirmed invited count",
    scoresSub: "Average from 1 (lowest) to 5 (highest).",
    journeySub: "Self-reported, not verified STC transactions.",
    jointActions: "Joint actions with STC",
    jointActionsSub: "Agreed follow-up between Asalah and STC.",
    barriersSub: "Reasons from every participating company that has enough answers, added together. Pilot data is excluded.",
    footer: "Survey answers, not verified STC transactions. Combined results appear only when at least 3 companies each have the minimum number of valid responses for their survey round. No company names are shown.",
  },
  tracking: {
    title: "Tracking",
    sub: "When companies bought points.",
    total: "Total points bought",
    listFailed: (msg: string) => `Could not load the company list: ${msg}`,
    purchases: "Purchases",
    colDate: "Date",
    colPoints: "Points",
    empty: "No point purchases recorded yet.",
    emptyCompany: "No point purchases recorded yet for this company.",
    hint: "Search for a company to see its purchases.",
    search: "Search for a company",
    addTitle: "Add purchase",
    addSub: "Record points a company bought.",
    fieldCompany: "Company",
    fieldPoints: "Points",
    fieldDate: "Purchase date",
    fieldNote: "Note (optional)",
    submit: "Add purchase",
    saving: "Saving…",
    errCompany: "Choose a company.",
    errPoints: "Points must be a whole number above zero.",
    errDate: "Choose a date that is not in the future.",
    errNote: "The note can be at most 200 characters.",
    saveFailed: (msg: string) => `Could not save the purchase: ${msg}`,
    saved: "Purchase added.",
  },
  review: {
    title: "Review queue",
    sub: "Answers that failed validation. They are kept, not counted, until fixed.",
    colReceived: "Received",
    colForm: "Form",
    colLanguage: "Language",
    colCode: "Company code entered",
    colReason: "Reason",
    empty: "(empty)",
    nothingTitle: "Nothing to review",
    nothingText: "All answers passed validation.",
  },
  // Item labels come from the database in English; only Arabic replaces them by question code.
  itemLabels: codeMap({}),
  itemShort: codeMap({ A07: "Appreciated", A09: "Reward exp.", A06: "Usefulness", A05: "Merchants", A03: "Ease", A01: "Clarity" }),
  barriers: codeMap({
    SAVE: "Saving points for later", HOW: "Do not know how to redeem", BALANCE: "Balance is insufficient",
    MERCHANT: "Merchants or options do not suit me", TERMS: "Unsure about the conditions or validity",
    TECH: "Technical or access problem", TIME: "Have not had time", OTHER: "Other",
    NOT_RECEIVED: "Did not receive points", // from question A02, added to the barriers by the database
  }),
  audience: codeMap({ A: "Employee", B: "HR", C: "Finance", D: "IT" }),
  metrics: {
    /* ---------- Tracking ---------- */
    "tracking.total": {
      title: "Total points bought",
      text: "Points a company has bought, added up from the purchases listed below. Company HR see their own company; Asalah and STC see the company they choose. Only Asalah can record a purchase.",
    },

    /* ---------- Portfolio ---------- */
    "portfolio.companies": {
      title: "Companies",
      what: "Companies taking part in the survey.",
      how: "Count of companies, using each company’s latest survey round. “Results available” = companies with at least the minimum number of valid responses for their survey round.",
    },
    "portfolio.answers": {
      title: "Employee answers",
      what: "Survey answers accepted so far.",
      how: "Count of employee responses that passed validation. Answers with errors (for example a wrong company code) are not counted; they go to the review queue.",
    },
    "portfolio.below": {
      title: "Waiting for more responses",
      what: "Companies whose results can’t be shown yet.",
      how: "Companies with fewer than the minimum number of valid responses for their survey round, including those with none.",
      hidden: "Their scores stay hidden until they reach the minimum number of valid responses, so no individual can be identified.",
    },
    "portfolio.actions": {
      title: "Open actions",
      what: "Follow-up tasks not yet closed.",
      how: "Actions with status Open or In progress. “High priority” = open actions marked High.",
    },
    "portfolio.review": {
      title: "In review queue",
      what: "Answers that failed validation.",
      how: "Submissions with a problem such as an unknown company code. They are kept safely but not counted until fixed.",
    },
    "portfolio.barriers": {
      title: "Why employees haven’t redeemed",
      text: "Reasons employees gave for not redeeming, added up across all companies. A company is included only when its own reasons are shown (at least the minimum number of valid responses), so the combined chart never reveals hidden answers. Each slice is one reason’s share of all reasons given.",
    },

    /* ---------- Heatmap columns ---------- */
    "heat.status": {
      title: "Results status",
      what: "Whether this company’s results can be shown yet. “Results available · 12 valid responses” = the minimum has been reached. “Waiting for more responses · 9 of 12” = fewer valid responses than the minimum so far. “No responses yet” = none received.",
      how: "Results are shown only when at least the minimum number of valid responses is received for the survey round, to protect employee confidentiality. Valid = passed all checks (correct company code, open survey round).",
      hidden: "Below the minimum, results stay hidden so no individual can be identified.",
    },
    "heat.rate": {
      title: "Response rate",
      how: "Valid responses ÷ employees invited, for example 12 ÷ 30 = 40%. Hover or tap the rate to see the numbers. Shown only when the invited count is confirmed by the company.",
      hidden: "If the invited count is not confirmed, no rate is shown; the number of valid responses is shown instead.",
    },
    "heat.A07": { title: "Appreciated", how: EN_ITEM_HOW, hidden: EN_ITEM_HIDDEN },
    "heat.A09": { title: "Reward exp.", how: EN_ITEM_HOW, hidden: EN_ITEM_HIDDEN },
    "heat.A06": { title: "Usefulness", how: EN_ITEM_HOW, hidden: EN_ITEM_HIDDEN },
    "heat.A05": { title: "Merchants", how: EN_ITEM_HOW, hidden: EN_ITEM_HIDDEN },
    "heat.A03": {
      title: "Ease",
      how: "Average 1–5 rating of how easy redeeming was, only from employees who tried to redeem.",
      hidden: "Fewer than the minimum number of people tried to redeem in this survey round.",
    },
    "heat.A01": { title: "Clarity", how: EN_ITEM_HOW, hidden: EN_ITEM_HIDDEN },
    "heat.satisfied": {
      title: "Satisfied",
      how: "% of employees who rated their overall reward experience 4 or 5 out of 5.",
      hidden: "Fewer valid responses than the minimum for this survey round.",
    },
    "heat.actions": {
      title: "Actions",
      text: "Number of open follow-up actions for that company.",
    },
    "heat.colours": {
      title: "Heatmap shading",
      text: "Darker shade = higher average score, on a scale from 1 (lowest) to 5 (highest). The number is always shown.",
    },

    /* ---------- Company results ---------- */
    "company.satisfied": {
      title: "Employees satisfied",
      text: "% of employees who rated their overall experience 4 or 5 out of 5.",
    },
    "company.rate": {
      title: "Response rate",
      text: "Valid responses ÷ employees invited, for example 12 ÷ 30 = 40% (hover or tap the rate to see the numbers). Shown only when the invited count is confirmed; otherwise the number of valid responses is shown.",
    },
    "company.redeemed": {
      title: "Redeemed successfully",
      text: "Employees who said redeeming worked ÷ employees who received points. “% of those who tried” = successful ÷ those who tried (shown only when at least the minimum number of people tried).",
    },
    "company.appreciated": {
      title: "Feeling appreciated",
      text: "Average employee rating for “Feeling appreciated”, from 1 (lowest) to 5 (highest). Hidden when fewer than the minimum number of valid responses answered this question.",
    },
    "company.scores": {
      title: "Experience scores",
      text: "Average rating per question, from 1 (lowest) to 5 (highest). Hidden = fewer than the minimum number of valid responses for that question in this survey round.",
    },
    "company.journey": {
      title: "Redemption journey",
      text: "Received points → Tried to redeem → Redeemed, based on what employees reported in the survey, not on verified STC transactions.",
    },
    "company.barriers": {
      title: "Why employees haven’t redeemed",
      text: "Reasons employees gave for not redeeming their points. Each slice is one reason’s share of all reasons given; the list shows how many times it was given and its share. Shown only when there are at least the minimum number of valid responses.",
    },
    "company.motivation": {
      title: "Effect on motivation",
      text: "How employees said the rewards changed their motivation. Increased = slightly or significantly more motivated; Decreased = slightly or significantly less. “Prefer not to answer” is left out of the percentages. Shown only when at least the minimum number of employees answered.",
    },
    "company.actions": {
      title: "Actions",
      text: "Agreed follow-up: what, who owns it, due date and status. “Overdue” = past the due date and not closed.",
    },

    /* ---------- STC view ---------- */
    "stc.about": {
      title: "STC view",
      text: "Combined results across companies, excluding the pilot. Only companies with results available (at least the minimum number of valid responses for their survey round) are included, and results appear only when at least 3 such companies exist, so no single company can be identified. No company names are shown.",
    },
    "stc.rate": {
      title: "Response rate",
      text: "Response rate here = total valid responses ÷ total invited, across companies with a confirmed invited count.",
    },
    "stc.barriers": {
      title: "Why employees haven’t redeemed",
      text: "Reasons employees gave for not redeeming, added up across participating companies, excluding the pilot. A company is included only when its own reasons are shown (at least the minimum number of valid responses). Each slice is one reason’s share of all reasons given. No company names are shown.",
    },

    /* ---------- Review queue ---------- */
    "review.about": {
      title: "Review queue",
      text: "Answers that failed automatic checks. Common reasons: unknown or missing company code, no open survey round, “None” selected together with other options, or an option that couldn’t be mapped. They are stored but never counted until corrected.",
    },
  },
};

export type Dict = typeof en;
export type MetricId = keyof Dict["metrics"];

/* ---------- Arabic ---------- */

// Arabic counted nouns: 1 and 2 have their own forms, 3–10 take the plural, 11 and up the singular.
const arPlural = new Intl.PluralRules("ar");
const arCount = (n: number, one: string, two: string, few: string, many: string) => {
  const form = arPlural.select(n);
  return form === "one" ? one : form === "two" ? two : form === "few" ? `${n} ${few}` : `${n} ${many}`;
};
const arValid = (n: number) => arCount(n, "استجابة صالحة واحدة", "استجابتان صالحتان", "استجابات صالحة", "استجابة صالحة");
// "4.2 / 5" inside a left-to-right isolate (LRI … PDI), so right-to-left text does not reverse it.
const arScore = (score: string | number) => `⁦${score} / 5⁩`;
const arUnderMin = (min?: number) => (min ? `عدد الاستجابات الصالحة أقل من ${min}` : "عدد الاستجابات الصالحة أقل من الحد الأدنى");
const AR_ITEM_HOW = "متوسط تقييمات الموظفين لهذا السؤال من 1 (الأدنى) إلى 5 (الأعلى).";
const AR_ITEM_HIDDEN = "عدد الاستجابات الصالحة لهذا السؤال في جولة الاستبيان هذه أقل من الحد الأدنى.";

const ar: Dict = {
  common: {
    loading: "جارٍ التحميل…",
    loadingSr: "جارٍ التحميل",
    tryAgain: "إعادة المحاولة",
    refresh: "تحديث",
    closeEsc: "إغلاق (Esc)",
    hidden: "مخفي",
    outOf5: " / 5", // same as English; shown inside a left-to-right isolate so it reads 4.2 / 5
    dataUpdated: "تم تحديث البيانات",
    somethingWrong: "حدث خطأ ما",
    couldNotLoadPage: "تعذّر تحميل هذه الصفحة",
    validResponses: arValid,
    underMin: arUnderMin,
    rateTip: (invited, responded, rate) =>
      rate !== null && rate !== undefined && invited !== null && invited !== undefined
        ? `المدعوون: ${invited} · الاستجابات الصالحة: ${responded} · ${responded} ÷ ${invited} = ${rate}%`
        : `عدد المدعوين غير مؤكد · ${arValid(responded)}`,
    surveyNotVerified: "إجابات استبيان، وليست معاملات STC موثّقة.",
  },
  header: {
    insights: "رؤى",
    logoAlt: "قطاف من stc",
    sections: "الأقسام",
    signOut: "تسجيل الخروج",
    couldNotLoadAccount: "تعذّر تحميل حسابك",
    switchLanguage: "التبديل إلى الإنجليزية (English)",
    otherLanguage: "English",
  },
  roles: { ADMIN: "مسؤول Asalah", STC: "STC", COMPANY_HR: "الموارد البشرية في الشركة" },
  nav: {
    tracking: "التتبع",
    portfolio: "محفظة الشركات",
    companyResults: "نتائج الشركة",
    surveyResults: "نتائج الاستبيان",
    stcView: "عرض STC",
    programOverview: "نظرة عامة على البرنامج",
    reviewQueue: "قائمة المراجعة",
  },
  theme: {
    light: "المظهر الفاتح",
    dark: "المظهر الداكن",
    switchToLight: "التبديل إلى المظهر الفاتح",
    switchToDark: "التبديل إلى المظهر الداكن",
  },
  glossary: {
    title: "دليل قراءة لوحة المعلومات",
    intro: "ماذا يعني كل رقم، وكيف يُحسب، ومتى يُخفى حفاظًا على الخصوصية.",
    whatItShows: "ماذا يعرض",
    howCalculated: "طريقة الحساب",
    whenHidden: "متى يُخفى",
    about: (title) => `حول: ${title}`,
    close: (title) => `إغلاق: ${title}`,
    sections: {
      Tracking: "التتبع",
      Portfolio: "محفظة الشركات",
      "Heatmap columns": "أعمدة الخريطة الحرارية",
      "Company results": "نتائج الشركة",
      "STC view": "عرض STC",
      "Review queue": "قائمة المراجعة",
    },
  },
  login: {
    signIn: "تسجيل الدخول",
    tagline: "رؤى قطاف: اطّلع على نتائج المكافآت.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    signingIn: "جارٍ تسجيل الدخول…",
    wrongLogin: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    noAccess: "لا يملك هذا الحساب صلاحية الوصول بعد. اطلب من Asalah تعيين دور له.",
  },
  charts: {
    ringAria: (pct) => `نسبة الرضا ${pct}%`,
    scoreTip: (label, score, n) => `${label}: ${arScore(score)}، عدد الاستجابات: ${n}`,
    hiddenTip: (label, min) => `${label}: مخفي: ${arUnderMin(min)}`,
    received: "استلموا النقاط",
    tried: "حاولوا الاستبدال",
    redeemed: "استبدلوا النقاط",
    funnelAria: (received, tried, succeeded) => `استلم النقاط ${received}، وحاول الاستبدال ${tried}، واستبدلها ${succeeded}`,
    failed: (tried, succeeded) => `فشلوا في الاستبدال: ${tried - succeeded} (${tried} حاولوا − ${succeeded} استبدلوا)`,
  },
  status: {
    reportChip: (status, n, min) =>
      status === "REPORTABLE" ? `النتائج متاحة · ${arValid(n)}`
        : status === "SUPPRESSED" ? `بانتظار مزيد من الاستجابات · ${n} من ${min}`
        : "لا توجد استجابات بعد",
    reportChipTip: (min) =>
      `لا تُعرض النتائج إلا عندما يبلغ عدد الاستجابات الصالحة ${min} على الأقل، حفاظًا على سرية بيانات الموظفين.`,
  },
  actions: {
    overdue: "متأخر",
    inProgress: "قيد التنفيذ",
    closed: "مغلق",
    open: "مفتوح",
    none: "لا توجد إجراءات مفتوحة.",
    nextStep: "الخطوة التالية:",
    due: (date) => `، تاريخ الاستحقاق: ${date}`,
  },
  priority: codeMap({ High: "عالية", Medium: "متوسطة", Low: "منخفضة" }),
  company: {
    picker: "الشركة",
    noResponsesTitle: "لا توجد استجابات بعد",
    waitingTitle: "بانتظار مزيد من الاستجابات",
    noResponsesText: (min) => `لا توجد استجابات بعد. ستظهر النتائج عندما يبلغ عدد الاستجابات الصالحة ${min} على الأقل.`,
    waitingText: (n, min) =>
      `عدد الاستجابات الصالحة حتى الآن: ${n} من ${min}. ستظهر النتائج عند بلوغ ${min}، حفاظًا على سرية بيانات الموظفين.`,
    progressAria: (min) => `الاستجابات الصالحة نحو العدد المطلوب (${min})`,
    progressNote: (n, min) => `الاستجابات الصالحة: ${n} من ${min} مطلوبة`,
    satisfied: "رضا الموظفين",
    satisfiedLine: (fav, n) => `الموظفون الراضون: ${fav} من ${n}`,
    satisfiedSub: "قيّموا تجربتهم العامة بـ 4 أو 5 من 5.",
    responseRate: "نسبة الاستجابة",
    rateNote: (responded, invited) => `${responded} من ${invited} من المدعوين`,
    rateUnconfirmed: (responded) => `${arValid(responded)}؛ عدد المدعوين غير مؤكد`,
    redeemed: "تم الاستبدال بنجاح",
    redeemedNote: (succeeded, received) => `${succeeded} من ${received} ممن استلموا النقاط`,
    ofThoseWhoTried: (pct) => `${pct}% ممن حاولوا الاستبدال`,
    appreciated: "الشعور بالتقدير",
    hiddenNote: (min) => `مخفي: ${arUnderMin(min)}`,
    scores: "تقييمات التجربة",
    journey: "رحلة الاستبدال",
    journeySub: "وفق ما أفاد به الموظفون، وليست معاملات STC موثّقة.",
    barriers: "أسباب عدم الاستبدال",
    barriersSub: "الأسباب التي ذكرها الموظفون لعدم استبدال نقاطهم.",
    barriersHidden: (min, n) =>
      `أسباب عدم الاستبدال مخفية حتى يبلغ عدد الاستجابات الصالحة ${min} على الأقل (العدد الحالي: ${n}).`,
    noReasons: "لم تُذكر أي أسباب.",
    pieAria: (summary) => `أسباب عدم الاستبدال: ${summary}`,
    motivation: "أثر المكافآت في الدافعية",
    motivationSub: "كيف وصف الموظفون تأثير المكافآت في دافعيتهم.",
    increased: "ازدادت",
    noChange: "لم تتغير",
    decreased: "انخفضت",
    motivationNote: (n) => `استنادًا إلى إجابات ${n} من الموظفين. لا تشمل النسب خيار «أفضّل عدم الإجابة».`,
    footer: (min) =>
      `إجابات استبيان، وليست معاملات STC موثّقة. لا تظهر نتائج الموظفين إلا عندما يبلغ عدد الاستجابات الصالحة ${min} أو أكثر لكل سؤال. تظهر الاتجاهات بعد الجولة الثانية من الاستبيان.`,
  },
  portfolio: {
    title: "محفظة الشركات",
    sub: "جميع الشركات المشاركة في البرنامج، وحالة نتائجها، والمتابعة.",
    filterAll: "الكل",
    filterAvailable: "النتائج متاحة",
    filterWaiting: "بانتظار الاستجابات",
    filterPilot: "تجريبية",
    companies: "الشركات",
    companiesNote: (n) => `النتائج متاحة لـ ${n} منها`,
    answers: "إجابات الموظفين",
    answersNote: "الإجابات المقبولة",
    below: "بانتظار مزيد من الاستجابات",
    belowNote: "عدد الاستجابات الصالحة أقل من الحد الأدنى",
    openActions: "الإجراءات المفتوحة",
    highPriority: (n) => `عالية الأولوية: ${n}`,
    review: "في قائمة المراجعة",
    reviewNote: "إجابات لم تجتز التحقق",
    heatmap: "الخريطة الحرارية للشركات",
    heatmapSub: "متوسط تقييمات الموظفين من 1 إلى 5. «مخفي» يعني أن عدد الاستجابات الصالحة للشركة أقل من الحد الأدنى لجولة الاستبيان الخاصة بها. اختر شركة لعرض نتائجها كاملة.",
    downloadCsv: "تنزيل ملف CSV",
    search: "البحث عن شركة",
    filterAria: "التصفية حسب الحالة",
    shown: (n, total) => `الشركات المعروضة: ${n} من ${total}`,
    colCompany: "الشركة",
    colStatus: "حالة النتائج",
    colRate: "نسبة الاستجابة",
    colSatisfied: "الرضا",
    colActions: "الإجراءات",
    sortBy: (label) => `الفرز حسب ${label}`,
    noMatch: "لا توجد شركات مطابقة.",
    pilot: "تجريبية",
    openResults: (name) => `فتح النتائج الكاملة لـ ${name}`,
    invitedNotConfirmed: "عدد المدعوين غير مؤكد",
    rateOf: (responded, invited) => `${responded} من ${invited}`,
    hiddenCellTip: (name, label, min) => `${name}، ${label}: مخفي: ${arUnderMin(min)}`,
    cellTip: (name, label, v, n) => `${name}، ${label}: ${arScore(v)}، ${arValid(n)} في هذه الشركة`,
    actionsSub: "في جميع الشركات، الأقرب موعدًا أولًا.",
    barriersSub: "أسباب جميع الشركات التي لديها إجابات كافية، مجمّعة معًا.",
    fullResults: (name) => `النتائج الكاملة لـ ${name}`,
    loadingFull: "جارٍ تحميل النتائج الكاملة",
    closeResults: (name) => `إغلاق نتائج ${name}`,
  },
  stc: {
    title: "نظرة عامة على البرنامج",
    sub: "نتائج مجمّعة للشركات المشاركة، دون بيانات المرحلة التجريبية.",
    hiddenTitle: "النتائج المجمّعة مخفية",
    hiddenText: (reason, participating, responses) =>
      `${reason}. عدد الشركات المشاركة: ${participating}، وعدد الاستجابات الصالحة حتى الآن: ${responses}.`,
    satisfiedAcross: (n, companies) => `عدد الموظفين: ${n} في ${companies} من الشركات`,
    participating: "الشركات المشاركة",
    participatingNote: (n) => `النتائج متاحة لـ ${n} منها`,
    rateNote: "الشركات التي أكّدت عدد المدعوين",
    scoresSub: "المتوسط من 1 (الأدنى) إلى 5 (الأعلى).",
    journeySub: "وفق إفادة الموظفين، وليست معاملات STC موثّقة.",
    jointActions: "الإجراءات المشتركة مع STC",
    jointActionsSub: "المتابعة المتفق عليها بين Asalah و STC.",
    barriersSub: "أسباب جميع الشركات المشاركة التي لديها إجابات كافية، مجمّعة معًا، دون بيانات المرحلة التجريبية.",
    footer: "إجابات استبيان، وليست معاملات STC موثّقة. لا تظهر النتائج المجمّعة إلا عندما تستوفي 3 شركات على الأقل الحد الأدنى من الاستجابات الصالحة في جولة الاستبيان الخاصة بكل منها. لا تُعرض أسماء الشركات.",
  },
  tracking: {
    title: "التتبع",
    sub: "متى اشترت الشركات النقاط.",
    total: "إجمالي النقاط المشتراة",
    listFailed: (msg) => `تعذّر تحميل قائمة الشركات: ${msg}`,
    purchases: "عمليات الشراء",
    colDate: "التاريخ",
    colPoints: "النقاط",
    empty: "لم تُسجَّل أي عمليات شراء للنقاط بعد.",
    emptyCompany: "لم تُسجَّل أي عمليات شراء للنقاط لهذه الشركة بعد.",
    hint: "ابحث عن شركة لعرض عمليات الشراء الخاصة بها.",
    search: "ابحث عن شركة",
    addTitle: "إضافة عملية شراء",
    addSub: "سجّل النقاط التي اشترتها شركة.",
    fieldCompany: "الشركة",
    fieldPoints: "النقاط",
    fieldDate: "تاريخ الشراء",
    fieldNote: "ملاحظة (اختيارية)",
    submit: "إضافة عملية الشراء",
    saving: "جارٍ الحفظ…",
    errCompany: "اختر شركة.",
    errPoints: "يجب أن تكون النقاط عددًا صحيحًا أكبر من صفر.",
    errDate: "اختر تاريخًا ليس في المستقبل.",
    errNote: "يجب ألا تتجاوز الملاحظة 200 حرف.",
    saveFailed: (msg) => `تعذّر حفظ عملية الشراء: ${msg}`,
    saved: "تمت إضافة عملية الشراء.",
  },
  review: {
    title: "قائمة المراجعة",
    sub: "إجابات لم تجتز التحقق. تُحفظ ولا تُحتسب حتى يتم تصحيحها.",
    colReceived: "تاريخ الاستلام",
    colForm: "النموذج",
    colLanguage: "اللغة",
    colCode: "رمز الشركة المُدخل",
    colReason: "السبب",
    empty: "(فارغ)",
    nothingTitle: "لا يوجد ما يحتاج إلى مراجعة",
    nothingText: "اجتازت جميع الإجابات التحقق.",
  },
  itemLabels: codeMap({
    A01: "وضوح البرنامج", A03: "سهولة الاستبدال", A05: "خيارات المتاجر",
    A06: "فائدة المكافآت", A07: "الشعور بالتقدير", A09: "تجربة المكافآت",
  }),
  itemShort: codeMap({ A07: "التقدير", A09: "تجربة المكافأة", A06: "الفائدة", A05: "المتاجر", A03: "السهولة", A01: "الوضوح" }),
  barriers: codeMap({
    SAVE: "ادخار النقاط لوقت لاحق", HOW: "عدم معرفة طريقة الاستبدال", BALANCE: "الرصيد غير كافٍ",
    MERCHANT: "المتاجر أو الخيارات غير مناسبة", TERMS: "عدم الوضوح بشأن الشروط أو مدة الصلاحية",
    TECH: "مشكلة تقنية أو في الدخول", TIME: "ضيق الوقت", OTHER: "أخرى",
    NOT_RECEIVED: "لم أستلم نقاط",
  }),
  audience: codeMap({ A: "موظف", B: "الموارد البشرية", C: "المالية", D: "تقنية المعلومات" }),
  metrics: {
    /* ---------- Tracking ---------- */
    "tracking.total": {
      title: "إجمالي النقاط المشتراة",
      text: "النقاط التي اشترتها الشركة، وهي مجموع عمليات الشراء المدرجة أدناه. ترى الموارد البشرية في الشركة شركتها فقط، بينما ترى Asalah و STC الشركة التي يختارانها. لا يسجّل عمليات الشراء إلا Asalah.",
    },

    /* ---------- Portfolio ---------- */
    "portfolio.companies": {
      title: "الشركات",
      what: "الشركات المشاركة في الاستبيان.",
      how: "عدد الشركات وفق أحدث جولة استبيان لكل شركة. «النتائج متاحة» = الشركات التي بلغ عدد استجاباتها الصالحة الحد الأدنى لجولتها على الأقل.",
    },
    "portfolio.answers": {
      title: "إجابات الموظفين",
      what: "إجابات الاستبيان المقبولة حتى الآن.",
      how: "عدد استجابات الموظفين التي اجتازت التحقق. لا تُحتسب الإجابات التي تتضمن أخطاء (مثل رمز شركة غير صحيح)، بل تُحال إلى قائمة المراجعة.",
    },
    "portfolio.below": {
      title: "بانتظار مزيد من الاستجابات",
      what: "الشركات التي لا يمكن عرض نتائجها بعد.",
      how: "الشركات التي يقل عدد استجاباتها الصالحة عن الحد الأدنى لجولتها، بما فيها الشركات التي لم تصلها أي استجابة.",
      hidden: "تبقى تقييماتها مخفية حتى تبلغ الحد الأدنى من الاستجابات الصالحة، كي لا يمكن التعرّف على أي فرد.",
    },
    "portfolio.actions": {
      title: "الإجراءات المفتوحة",
      what: "مهام المتابعة التي لم تُغلق بعد.",
      how: "الإجراءات التي حالتها «مفتوح» أو «قيد التنفيذ». «عالية الأولوية» = الإجراءات المفتوحة المصنّفة بأولوية عالية.",
    },
    "portfolio.review": {
      title: "في قائمة المراجعة",
      what: "إجابات لم تجتز التحقق.",
      how: "إجابات مُرسلة بها مشكلة، مثل رمز شركة غير معروف. تُحفظ بأمان ولا تُحتسب حتى يتم تصحيحها.",
    },
    "portfolio.barriers": {
      title: "أسباب عدم الاستبدال",
      text: "الأسباب التي ذكرها الموظفون لعدم الاستبدال، مجمّعة لجميع الشركات. لا تُدرج الشركة إلا إذا كانت أسبابها معروضة في صفحتها (أي بلغ عدد استجاباتها الصالحة الحد الأدنى)، فلا يكشف المخطط المجمّع أي إجابات مخفية. تمثّل كل شريحة حصة السبب من مجموع الأسباب المذكورة.",
    },

    /* ---------- Heatmap columns ---------- */
    "heat.status": {
      title: "حالة النتائج",
      what: "هل يمكن عرض نتائج هذه الشركة بعد. «النتائج متاحة · 12 استجابة صالحة» = تم بلوغ الحد الأدنى. «بانتظار مزيد من الاستجابات · 9 من 12» = عدد الاستجابات الصالحة حتى الآن أقل من الحد الأدنى. «لا توجد استجابات بعد» = لم تصل أي استجابة.",
      how: "لا تُعرض النتائج إلا عند استلام الحد الأدنى من الاستجابات الصالحة على الأقل في جولة الاستبيان، حفاظًا على سرية بيانات الموظفين. «صالحة» = اجتازت جميع عمليات التحقق (رمز شركة صحيح، وجولة استبيان مفتوحة).",
      hidden: "دون الحد الأدنى تبقى النتائج مخفية، كي لا يمكن التعرّف على أي فرد.",
    },
    "heat.rate": {
      title: "نسبة الاستجابة",
      how: "الاستجابات الصالحة ÷ الموظفون المدعوون، مثلًا 12 ÷ 30 = 40%. مرّر المؤشر فوق النسبة أو المسها لعرض الأرقام. لا تظهر إلا إذا أكّدت الشركة عدد المدعوين.",
      hidden: "إذا لم يُؤكَّد عدد المدعوين فلا تظهر النسبة، ويظهر بدلًا منها عدد الاستجابات الصالحة.",
    },
    "heat.A07": { title: "التقدير", how: AR_ITEM_HOW, hidden: AR_ITEM_HIDDEN },
    "heat.A09": { title: "تجربة المكافأة", how: AR_ITEM_HOW, hidden: AR_ITEM_HIDDEN },
    "heat.A06": { title: "الفائدة", how: AR_ITEM_HOW, hidden: AR_ITEM_HIDDEN },
    "heat.A05": { title: "المتاجر", how: AR_ITEM_HOW, hidden: AR_ITEM_HIDDEN },
    "heat.A03": {
      title: "السهولة",
      how: "متوسط التقييم (من 1 إلى 5) لسهولة الاستبدال، من الموظفين الذين حاولوا الاستبدال فقط.",
      hidden: "عدد من حاولوا الاستبدال في جولة الاستبيان هذه أقل من الحد الأدنى.",
    },
    "heat.A01": { title: "الوضوح", how: AR_ITEM_HOW, hidden: AR_ITEM_HIDDEN },
    "heat.satisfied": {
      title: "الرضا",
      how: "نسبة الموظفين الذين قيّموا تجربتهم العامة مع المكافآت بـ 4 أو 5 من 5.",
      hidden: "عدد الاستجابات الصالحة أقل من الحد الأدنى لجولة الاستبيان هذه.",
    },
    "heat.actions": {
      title: "الإجراءات",
      text: "عدد إجراءات المتابعة المفتوحة لهذه الشركة.",
    },
    "heat.colours": {
      title: "تظليل الخريطة الحرارية",
      text: "كلما كان اللون أغمق كان متوسط التقييم أعلى، على مقياس من 1 (الأدنى) إلى 5 (الأعلى). يظهر الرقم دائمًا.",
    },

    /* ---------- Company results ---------- */
    "company.satisfied": {
      title: "رضا الموظفين",
      text: "نسبة الموظفين الذين قيّموا تجربتهم العامة بـ 4 أو 5 من 5.",
    },
    "company.rate": {
      title: "نسبة الاستجابة",
      text: "الاستجابات الصالحة ÷ الموظفون المدعوون، مثلًا 12 ÷ 30 = 40% (مرّر المؤشر فوق النسبة أو المسها لعرض الأرقام). لا تظهر إلا إذا كان عدد المدعوين مؤكدًا؛ وإلا يظهر عدد الاستجابات الصالحة.",
    },
    "company.redeemed": {
      title: "تم الاستبدال بنجاح",
      text: "الموظفون الذين أفادوا بنجاح الاستبدال ÷ الموظفون الذين استلموا النقاط. «% ممن حاولوا الاستبدال» = الناجحون ÷ من حاولوا (لا تظهر إلا إذا بلغ عدد من حاولوا الحد الأدنى على الأقل).",
    },
    "company.appreciated": {
      title: "الشعور بالتقدير",
      text: "متوسط تقييم الموظفين لعبارة «الشعور بالتقدير» من 1 (الأدنى) إلى 5 (الأعلى). يُخفى إذا كان عدد الاستجابات الصالحة لهذا السؤال أقل من الحد الأدنى.",
    },
    "company.scores": {
      title: "تقييمات التجربة",
      text: "متوسط التقييم لكل سؤال من 1 (الأدنى) إلى 5 (الأعلى). «مخفي» = عدد الاستجابات الصالحة لهذا السؤال في جولة الاستبيان هذه أقل من الحد الأدنى.",
    },
    "company.journey": {
      title: "رحلة الاستبدال",
      text: "استلموا النقاط ← حاولوا الاستبدال ← استبدلوا النقاط، وفق ما أفاد به الموظفون في الاستبيان، وليس وفق معاملات STC موثّقة.",
    },
    "company.barriers": {
      title: "أسباب عدم الاستبدال",
      text: "الأسباب التي ذكرها الموظفون لعدم استبدال نقاطهم. تمثّل كل شريحة حصة السبب من مجموع الأسباب المذكورة، وتعرض القائمة عدد مرات ذكره وحصته. لا تظهر إلا عندما يبلغ عدد الاستجابات الصالحة الحد الأدنى على الأقل.",
    },
    "company.motivation": {
      title: "أثر المكافآت في الدافعية",
      text: "كيف وصف الموظفون تأثير المكافآت في دافعيتهم. «ازدادت» = ازدادت قليلًا أو كثيرًا؛ «انخفضت» = انخفضت قليلًا أو كثيرًا. لا تشمل النسب خيار «أفضّل عدم الإجابة». لا تظهر إلا عندما يبلغ عدد المجيبين الحد الأدنى على الأقل.",
    },
    "company.actions": {
      title: "الإجراءات",
      text: "المتابعة المتفق عليها: ما المطلوب، ومن المسؤول، وتاريخ الاستحقاق، والحالة. «متأخر» = تجاوز تاريخ الاستحقاق ولم يُغلق.",
    },

    /* ---------- STC view ---------- */
    "stc.about": {
      title: "عرض STC",
      text: "نتائج مجمّعة للشركات باستثناء المرحلة التجريبية. لا تُدرج إلا الشركات التي تتوفر نتائجها (أي بلغت الحد الأدنى من الاستجابات الصالحة في جولتها)، ولا تظهر النتائج إلا عند وجود 3 شركات من هذا النوع على الأقل، كي لا يمكن التعرّف على أي شركة بعينها. لا تُعرض أسماء الشركات.",
    },
    "stc.rate": {
      title: "نسبة الاستجابة",
      text: "نسبة الاستجابة هنا = إجمالي الاستجابات الصالحة ÷ إجمالي المدعوين، في الشركات التي أكّدت عدد المدعوين.",
    },
    "stc.barriers": {
      title: "أسباب عدم الاستبدال",
      text: "الأسباب التي ذكرها الموظفون لعدم الاستبدال، مجمّعة للشركات المشاركة باستثناء المرحلة التجريبية. لا تُدرج الشركة إلا إذا كانت أسبابها معروضة في صفحتها (أي بلغ عدد استجاباتها الصالحة الحد الأدنى). تمثّل كل شريحة حصة السبب من مجموع الأسباب المذكورة. لا تُعرض أسماء الشركات.",
    },

    /* ---------- Review queue ---------- */
    "review.about": {
      title: "قائمة المراجعة",
      text: "إجابات لم تجتز التحقق الآلي. من الأسباب الشائعة: رمز شركة غير معروف أو مفقود، أو عدم وجود جولة استبيان مفتوحة، أو اختيار «لا شيء» مع خيارات أخرى، أو خيار تعذّرت مطابقته. تُحفظ هذه الإجابات ولا تُحتسب أبدًا حتى يتم تصحيحها.",
    },
  },
};

export const DICT: Record<Lang, Dict> = { en, ar };
