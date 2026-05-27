import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
}

export async function requireUser(req: Request): Promise<{ supabase: SupabaseClient; user: User } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Authentication required" }, 401);
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return jsonResponse({ error: "Invalid or expired session" }, 401);
  }

  return { supabase, user: data.user };
}

export async function isAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    console.error("admin check failed", error);
    return false;
  }

  return Boolean(data);
}

export async function assertCanRunAnalysis(supabase: SupabaseClient, userId: string): Promise<Response | null> {
  if (await isAdmin(supabase, userId)) return null;

  let dailyLimit: number | null = 5;

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("plan_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscription?.plan_id) {
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("daily_limit")
      .eq("id", subscription.plan_id)
      .eq("is_active", true)
      .maybeSingle();

    if (plan) dailyLimit = plan.daily_limit;
  } else {
    const { data: freePlan } = await supabase
      .from("subscription_plans")
      .select("daily_limit")
      .eq("plan_type", "free")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (freePlan) dailyLimit = freePlan.daily_limit;
  }

  if (dailyLimit === null) return null;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("analysis_results")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfDay.toISOString());

  if (error) {
    console.error("daily usage check failed", error);
    return jsonResponse({ error: "Could not verify daily usage limit" }, 500);
  }

  if ((count ?? 0) >= dailyLimit) {
    return jsonResponse({ error: "Daily analysis limit reached" }, 429);
  }

  return null;
}

export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}
