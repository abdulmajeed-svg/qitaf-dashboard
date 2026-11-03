export type Role = "ADMIN" | "STC" | "COMPANY_HR";

export interface Profile {
  email: string;
  role: Role;
  company_id: string | null;
  company_name: string | null;
}

export interface CompanyRef {
  company_id: string;
  name: string;
}

export type ReportStatus = "REPORTABLE" | "SUPPRESSED" | "NO_RESPONSES";
export type OrgStatus = "SUBMITTED" | "NOT_SUBMITTED" | "NOT_APPLICABLE";

export interface Item {
  code: string;
  label: string;
  n: number;
  score: number | null;
}

export interface Funnel {
  received: number;
  tried: number;
  succeeded: number;
  success_among_tried?: number | null;
}

export type Barriers =
  | { suppressed: true; n: number }
  | { reason: string; count: number }[]
  | null;

export interface OrgItem {
  group: string;
  code: string;
  label: string;
  score: number | null;
  value: string | null;
}

export interface ActionRow {
  action_id?: string;
  company?: string;
  audience?: string;
  issue: string;
  recommendation: string;
  next_step?: string | null;
  owner: string;
  priority: string;
  due_date: string | null;
  status: string;
  escalation_to_stc?: boolean;
}

export interface CompanyDashboard {
  company: CompanyRef;
  wave: { wave_id: string; status: string; record_type: string };
  status: ReportStatus;
  min_responses?: number | null;
  kpi: {
    invited: number | null;
    invited_verified: boolean;
    responded: number;
    response_rate: number | null;
    csat: number | null;
    csat_favorable: number | null;
    csat_n: number | null;
  };
  items: Item[];
  funnel: Funnel | null;
  barriers: Barriers;
  // Optional until get_company_dashboard returns it (see supabase/proposed-motivation.sql).
  // Counts; n = up + same + down, "Prefer not to answer" left out. Null when below the minimum.
  motivation?: { up: number; same: number; down: number; n: number } | null;
  org: {
    hr_status: OrgStatus;
    it_status: OrgStatus;
    finance_status: OrgStatus;
    items: OrgItem[];
  };
  actions: ActionRow[];
  generated_at: string;
}

export interface PortfolioCompany {
  company_id: string;
  name: string;
  wave_id: string;
  record_type: string;
  invited: number | null;
  invited_verified: boolean;
  responded: number;
  status: ReportStatus;
  min_responses?: number | null;
  response_rate: number | null;
  items: Record<string, number | null> | null;
  csat: number | null;
  open_actions: number;
}

export interface Portfolio {
  kpi: {
    companies: number;
    responses: number;
    reportable: number;
    below_threshold: number;
    open_actions: number;
    high_priority: number;
    in_review_queue: number;
  };
  companies: PortfolioCompany[];
  actions: ActionRow[];
  generated_at: string;
}

export type StcOverview =
  | {
      status: "SUPPRESSED";
      reason: string;
      participating: number;
      responses: number;
      response_rate: number | null;
      generated_at: string;
    }
  | {
      status: "REPORTABLE";
      participating: number;
      reportable_companies: number;
      responses: number;
      response_rate: number | null;
      csat: number;
      csat_n: number;
      items: Item[];
      funnel: Funnel;
      actions: ActionRow[];
      generated_at: string;
    };

export interface ReviewRow {
  response_id: string;
  submitted_at: string;
  audience: string;
  language: string | null;
  company_code_entered: string | null;
  reason_code: string;
  reason: string;
}
