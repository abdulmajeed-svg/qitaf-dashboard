import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Publishable key only. Never put a secret / service_role key in this project.
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
  }
  return client;
}

// Privacy rule 1: the frontend may only call these functions, never query tables.
type RpcName =
  | "my_profile"
  | "list_companies"
  | "get_company_dashboard"
  | "get_portfolio"
  | "get_stc_overview"
  | "get_review_queue"
  | "get_points_tracking"
  | "add_points_purchase";

export async function rpc<T>(name: RpcName, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabase().rpc(name, args ?? {});
  if (error) throw new Error(error.message);
  return data as T;
}
