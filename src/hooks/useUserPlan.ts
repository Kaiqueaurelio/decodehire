import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserPlanInfo {
  planName: string;
  planType: "free" | "starter" | "pro" | "business";
  dailyLimit: number | null; // null = unlimited
  dailyUsage: number;
  canAnalyze: boolean;
  canExport: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useUserPlan(): UserPlanInfo {
  const { user, isAdmin } = useAuth();
  const [planName, setPlanName] = useState("Gratuito");
  const [planType, setPlanType] = useState<"free" | "starter" | "pro" | "business">("free");
  const [dailyLimit, setDailyLimit] = useState<number | null>(5);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPlanInfo = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (isAdmin) {
      setPlanName("Administrador");
      setPlanType("business");
      setDailyLimit(null);
      setDailyUsage(0);
      setLoading(false);
      return;
    }

    try {
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("plan_id, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sub?.plan_id) {
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("name, plan_type, daily_limit")
          .eq("id", sub.plan_id)
          .single();

        if (plan) {
          setPlanName(plan.name);
          setPlanType(plan.plan_type as "free" | "starter" | "pro" | "business");
          setDailyLimit(plan.daily_limit);
        }
      } else {
        const { data: freePlan } = await supabase
          .from("subscription_plans")
          .select("name, daily_limit")
          .eq("plan_type", "free")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (freePlan) {
          setPlanName(freePlan.name);
          setDailyLimit(freePlan.daily_limit);
        }
        setPlanType("free");
      }

      const { data: usageData } = await supabase.rpc("get_daily_usage", {
        _user_id: user.id,
      });
      setDailyUsage(typeof usageData === "number" ? usageData : 0);
    } catch (err) {
      console.error("Error fetching plan info:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanInfo();
  }, [user, isAdmin]);

  const canAnalyze = isAdmin || dailyLimit === null || dailyUsage < dailyLimit;
  const canExport = isAdmin || planType === "pro" || planType === "business";

  return {
    planName,
    planType,
    dailyLimit,
    dailyUsage,
    canAnalyze,
    canExport,
    loading,
    refresh: fetchPlanInfo,
  };
}
