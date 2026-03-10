import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, FileText, TrendingUp, Clock, CheckCircle, XCircle,
  ArrowUpRight, ArrowDownRight, CreditCard, Activity, Eye,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Stats {
  totalUsers: number;
  totalAnalyses: number;
  pendingPayments: number;
  confirmedPayments: number;
  rejectedPayments: number;
  totalRevenue: number;
  todayAnalyses: number;
  newUsersToday: number;
  activeSubscriptions: number;
}

interface RecentActivity {
  id: string;
  type: "analysis" | "payment" | "signup";
  description: string;
  time: string;
}

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--warning))",
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, analysesRes, paymentsRes, recentAnalysesRes, subsRes, plansRes, profilesRes] =
          await Promise.all([
            supabase.from("profiles").select("id", { count: "exact", head: true }),
            supabase.from("analysis_results").select("id", { count: "exact", head: true }),
            supabase.from("payment_requests").select("*"),
            supabase.from("analysis_results").select("created_at, user_id").order("created_at", { ascending: false }).limit(500),
            supabase.from("user_subscriptions").select("plan_id, status, user_id"),
            supabase.from("subscription_plans").select("id, name, plan_type"),
            supabase.from("profiles").select("created_at, full_name, email").order("created_at", { ascending: false }).limit(100),
          ]);

        const payments = paymentsRes.data || [];
        const pending = payments.filter((p) => p.status === "pending");
        const confirmed = payments.filter((p) => p.status === "confirmed");
        const rejected = payments.filter((p) => p.status === "rejected");
        const revenue = confirmed.reduce((sum, p) => sum + Number(p.amount), 0);
        const analyses = recentAnalysesRes.data || [];
        const subs = subsRes.data || [];
        const plans = plansRes.data || [];
        const profiles = profilesRes.data || [];

        // Today counts
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayAnalyses = analyses.filter((a) => a.created_at.slice(0, 10) === todayStr).length;
        const newUsersToday = profiles.filter((p) => p.created_at.slice(0, 10) === todayStr).length;
        const activeSubs = subs.filter((s) => s.status === "active");

        setStats({
          totalUsers: usersRes.count || 0,
          totalAnalyses: analysesRes.count || 0,
          pendingPayments: pending.length,
          confirmedPayments: confirmed.length,
          rejectedPayments: rejected.length,
          totalRevenue: revenue,
          todayAnalyses,
          newUsersToday,
          activeSubscriptions: activeSubs.length,
        });

        // Analyses chart - last 14 days
        const days: Record<string, number> = {};
        for (let i = 13; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          days[d.toISOString().slice(0, 10)] = 0;
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

        // Plan distribution
        const plansMap = new Map(plans.map((p) => [p.id, p]));
        const distCount: Record<string, number> = {};
        activeSubs.forEach((s) => {
          const plan = plansMap.get(s.plan_id);
          const name = plan?.name || "Outro";
          distCount[name] = (distCount[name] || 0) + 1;
        });
        // Add free users (total - active subs)
        const totalUsersCount = usersRes.count || 0;
        const freeUsers = Math.max(0, totalUsersCount - activeSubs.length);
        if (freeUsers > 0) distCount["Gratuito"] = (distCount["Gratuito"] || 0) + freeUsers;
        setPlanDistribution(
          Object.entries(distCount).map(([name, value]) => ({ name, value }))
        );

        // User growth - last 14 days
        const userDays: Record<string, number> = {};
        for (let i = 13; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          userDays[d.toISOString().slice(0, 10)] = 0;
        }
        profiles.forEach((p) => {
          const key = p.created_at.slice(0, 10);
          if (key in userDays) userDays[key]++;
        });
        let cumulative = 0;
        setUserGrowth(
          Object.entries(userDays).map(([date, count]) => {
            cumulative += count;
            return {
              date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
              novos: count,
              acumulado: cumulative,
            };
          })
        );

        // Recent activity feed
        const activity: RecentActivity[] = [];
        analyses.slice(0, 5).forEach((a) => {
          activity.push({
            id: `a-${a.created_at}`,
            type: "analysis",
            description: "Nova análise realizada",
            time: new Date(a.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
          });
        });
        profiles.slice(0, 3).forEach((p) => {
          activity.push({
            id: `u-${p.created_at}`,
            type: "signup",
            description: `${p.full_name || p.email || "Novo usuário"} se cadastrou`,
            time: new Date(p.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
          });
        });
        pending.slice(0, 3).forEach((p) => {
          activity.push({
            id: `p-${p.id}`,
            type: "payment",
            description: `Pagamento de R$ ${Number(p.amount).toFixed(2).replace(".", ",")} pendente`,
            time: new Date(p.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
          });
        });
        activity.sort((a, b) => b.time.localeCompare(a.time));
        setRecentActivity(activity.slice(0, 8));

        // Pending payments for quick actions
        if (pending.length > 0) {
          const pendingUserIds = [...new Set(pending.slice(0, 5).map((p) => p.user_id))];
          const { data: pendingProfiles } = await supabase
            .from("profiles")
            .select("user_id, full_name, email")
            .in("user_id", pendingUserIds);
          const profileMap = new Map((pendingProfiles || []).map((p) => [p.user_id, p]));
          const pendingPlanIds = [...new Set(pending.slice(0, 5).map((p) => p.plan_id))];
          const { data: pendingPlans } = await supabase
            .from("subscription_plans")
            .select("id, name")
            .in("id", pendingPlanIds);
          const planMap = new Map((pendingPlans || []).map((p) => [p.id, p]));
          setPendingList(
            pending.slice(0, 5).map((p) => ({
              ...p,
              profile: profileMap.get(p.user_id),
              plan: planMap.get(p.plan_id),
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setLoading(false);
      }
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
      await supabase
        .from("user_subscriptions")
        .update({ status: "inactive" })
        .eq("user_id", userId)
        .eq("status", "active");
      await supabase.from("user_subscriptions").insert({
        user_id: userId,
        plan_id: planId,
        status: "active",
        started_at: new Date().toISOString(),
      });
      toast.success("Pagamento confirmado e plano ativado!");
    } else {
      toast.info("Pagamento rejeitado.");
    }
    setPendingList((prev) => prev.filter((p) => p.id !== id));
    setStats((prev) =>
      prev
        ? {
            ...prev,
            pendingPayments: prev.pendingPayments - 1,
            ...(status === "confirmed"
              ? { confirmedPayments: prev.confirmedPayments + 1, activeSubscriptions: prev.activeSubscriptions + 1 }
              : { rejectedPayments: prev.rejectedPayments + 1 }),
          }
        : prev
    );
  };

  const statCards = stats
    ? [
        { label: "Total Usuários", value: stats.totalUsers, icon: Users, color: "text-primary", sub: `+${stats.newUsersToday} hoje`, subUp: stats.newUsersToday > 0 },
        { label: "Total Análises", value: stats.totalAnalyses, icon: FileText, color: "text-info", sub: `${stats.todayAnalyses} hoje`, subUp: stats.todayAnalyses > 0 },
        { label: "Receita Total", value: `R$ ${stats.totalRevenue.toFixed(2).replace(".", ",")}`, icon: TrendingUp, color: "text-accent", sub: `${stats.confirmedPayments} pagamentos`, subUp: true },
        { label: "Assinaturas Ativas", value: stats.activeSubscriptions, icon: CreditCard, color: "text-primary", sub: `${stats.pendingPayments} pendente(s)`, subUp: false },
      ]
    : [];

  const activityIcon = (type: string) => {
    switch (type) {
      case "analysis": return <FileText className="w-3.5 h-3.5 text-info" />;
      case "payment": return <CreditCard className="w-3.5 h-3.5 text-warning" />;
      case "signup": return <Users className="w-3.5 h-3.5 text-accent" />;
      default: return <Activity className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral completa do sistema</p>
        </div>
        <Badge variant="outline" className="text-xs gap-1">
          <Activity className="w-3 h-3" />
          Tempo real
        </Badge>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          : statCards.map((card) => (
              <Card key={card.label} className="relative overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</span>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <p className="text-2xl font-bold font-display">{card.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {card.subUp ? (
                      <ArrowUpRight className="w-3 h-3 text-accent" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">{card.sub}</span>
                  </div>
                </CardContent>
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent ${card.color === "text-primary" ? "via-primary" : card.color === "text-accent" ? "via-accent" : card.color === "text-info" ? "via-info" : "via-primary"} to-transparent opacity-50`} />
              </Card>
            ))}
      </div>

      {/* Payment Status Summary */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-accent shrink-0" />
              <div>
                <p className="text-lg font-bold font-display">{stats.confirmedPayments}</p>
                <p className="text-xs text-muted-foreground">Confirmados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-warning shrink-0" />
              <div>
                <p className="text-lg font-bold font-display">{stats.pendingPayments}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-destructive shrink-0" />
              <div>
                <p className="text-lg font-bold font-display">{stats.rejectedPayments}</p>
                <p className="text-xs text-muted-foreground">Rejeitados</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analyses Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Análises (14 dias)
              <Badge variant="secondary" className="text-xs font-normal">Diário</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={1} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={30} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" name="Análises" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição de Planos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : planDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {planDistribution.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {planDistribution.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Growth + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Novos Cadastros (14 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={userGrowth}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={30} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="novos"
                    name="Novos"
                    stroke="hsl(var(--accent))"
                    fill="hsl(var(--accent))"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Atividade Recente
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade recente</p>
            ) : (
              <div className="space-y-1">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-1.5 rounded-full bg-muted shrink-0">
                      {activityIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments Quick Actions */}
      {pendingList.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                Pagamentos Aguardando Revisão
              </CardTitle>
              <Link to="/admin/payments/review">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  Ver todos <Eye className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingList.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border border-border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{p.profile?.full_name || p.profile?.email || "—"}</p>
                      {p.plan && (
                        <Badge variant="secondary" className="text-xs shrink-0">{p.plan.name}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      R$ {Number(p.amount).toFixed(2).replace(".", ",")} •{" "}
                      {new Date(p.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0 ml-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-accent hover:bg-accent/10"
                      onClick={() => handleQuickAction(p.id, "confirmed", p.user_id, p.plan_id)}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      <span className="hidden sm:inline text-xs">Confirmar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-destructive hover:bg-destructive/10"
                      onClick={() => handleQuickAction(p.id, "rejected", p.user_id, p.plan_id)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      <span className="hidden sm:inline text-xs">Rejeitar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { to: "/admin/users", label: "Usuários", icon: Users },
          { to: "/admin/payments/review", label: "Pagamentos", icon: CreditCard },
          { to: "/admin/plans", label: "Planos", icon: TrendingUp },
          { to: "/admin/payments/pix", label: "Config Pix", icon: Activity },
        ].map((link) => (
          <Link key={link.to} to={link.to}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer group">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium">{link.label}</span>
                <ArrowUpRight className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
