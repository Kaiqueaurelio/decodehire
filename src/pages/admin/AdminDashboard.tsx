import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Stats {
  totalUsers: number;
  totalAnalyses: number;
  pendingPayments: number;
  confirmedPayments: number;
  rejectedPayments: number;
  totalRevenue: number;
}

interface PendingPayment {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  created_at: string;
  profiles?: { full_name: string; email: string } | null;
}

interface DailyAnalysis {
  date: string;
  count: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingList, setPendingList] = useState<PendingPayment[]>([]);
  const [chartData, setChartData] = useState<DailyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [usersRes, analysesRes, paymentsRes, recentAnalysesRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("analysis_results").select("id", { count: "exact", head: true }),
        supabase.from("payment_requests").select("*"),
        supabase.from("analysis_results").select("created_at").order("created_at", { ascending: false }).limit(200),
      ]);

      const payments = paymentsRes.data || [];
      const pending = payments.filter((p) => p.status === "pending");
      const confirmed = payments.filter((p) => p.status === "confirmed");
      const rejected = payments.filter((p) => p.status === "rejected");
      const revenue = confirmed.reduce((sum, p) => sum + Number(p.amount), 0);

      setStats({
        totalUsers: usersRes.count || 0,
        totalAnalyses: analysesRes.count || 0,
        pendingPayments: pending.length,
        confirmedPayments: confirmed.length,
        rejectedPayments: rejected.length,
        totalRevenue: revenue,
      });

      // Fetch pending payments with user info
      const pendingIds = pending.slice(0, 5).map((p) => p.id);
      if (pendingIds.length > 0) {
        const { data: pendingData } = await supabase
          .from("payment_requests")
          .select("id, user_id, plan_id, amount, created_at, profiles:user_id(full_name, email)")
          .in("id", pendingIds);
        setPendingList((pendingData as any) || []);
      }

      // Build chart: analyses per day (last 7 days)
      const analyses = recentAnalysesRes.data || [];
      const days: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        days[key] = 0;
      }
      analyses.forEach((a) => {
        const key = a.created_at.slice(0, 10);
        if (key in days) days[key]++;
      });
      setChartData(
        Object.entries(days).map(([date, count]) => ({
          date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
          count,
        }))
      );

      setLoading(false);
    };
    fetchAll();
  }, []);

  const handleQuickAction = async (id: string, status: "confirmed" | "rejected", userId: string, planId: string) => {
    const { error } = await supabase
      .from("payment_requests")
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar");
      return;
    }

    if (status === "confirmed") {
      await supabase.from("user_subscriptions").insert({ user_id: userId, plan_id: planId, status: "active" });
      toast.success("Pagamento confirmado!");
    } else {
      toast.info("Pagamento rejeitado.");
    }
    setPendingList((prev) => prev.filter((p) => p.id !== id));
    setStats((prev) => prev ? {
      ...prev,
      pendingPayments: prev.pendingPayments - 1,
      ...(status === "confirmed" ? { confirmedPayments: prev.confirmedPayments + 1 } : { rejectedPayments: prev.rejectedPayments + 1 }),
    } : prev);
  };

  const cards = stats
    ? [
        { label: "Usuários", value: stats.totalUsers, icon: Users, color: "text-primary" },
        { label: "Análises", value: stats.totalAnalyses, icon: FileText, color: "text-accent-foreground" },
        { label: "Receita", value: `R$ ${stats.totalRevenue.toFixed(2).replace(".", ",")}`, icon: TrendingUp, color: "text-green-500" },
        { label: "Pendentes", value: stats.pendingPayments, icon: Clock, color: "text-yellow-500" },
        { label: "Confirmados", value: stats.confirmedPayments, icon: CheckCircle, color: "text-green-500" },
        { label: "Rejeitados", value: stats.rejectedPayments, icon: XCircle, color: "text-destructive" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral do sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          : cards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold font-display">{card.value}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Análises (últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions - Pending Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : pendingList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum pagamento pendente</p>
            ) : (
              <div className="space-y-3">
                {pendingList.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{(p.profiles as any)?.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">R$ {Number(p.amount).toFixed(2).replace(".", ",")}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button size="sm" variant="outline" className="h-8 px-2 text-green-600" onClick={() => handleQuickAction(p.id, "confirmed", p.user_id, p.plan_id)}>
                        <CheckCircle className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 px-2 text-destructive" onClick={() => handleQuickAction(p.id, "rejected", p.user_id, p.plan_id)}>
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
