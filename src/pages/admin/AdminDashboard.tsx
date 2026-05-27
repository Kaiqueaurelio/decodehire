import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  CreditCard,
  Activity,
  Eye,
  RefreshCw,
  ShieldAlert,
  UserPlus,
  Wallet,
  Target,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
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
  revenueMonth: number;
  pendingRevenue: number;
  todayAnalyses: number;
  newUsersToday: number;
  activeSubscriptions: number;
  activeUsers7d: number;
  blockedUsers: number;
  avgScore: number;
  conversionRate: number;
}

interface RecentActivity {
  id: string;
  type: "analysis" | "payment" | "signup" | "warning";
  description: string;
  time: string;
  timestamp: number;
}

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
];

const RANGE_OPTIONS = [7, 14, 30];

const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;
const formatShortDate = (date: string) => new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [scoreBuckets, setScoreBuckets] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [rangeDays, setRangeDays] = useState(14);
  const [refreshToken, setRefreshToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      try {
        if (refreshToken > 0) setRefreshing(true);

        const [usersCountRes, analysesCountRes, paymentsRes, analysesRes, subsRes, plansRes, profilesRes] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("analysis_results").select("id", { count: "exact", head: true }),
          supabase.from("payment_requests").select("*").order("created_at", { ascending: false }).limit(500),
          supabase.from("analysis_results").select("created_at, user_id, score").order("created_at", { ascending: false }).limit(1000),
          supabase.from("user_subscriptions").select("plan_id, status, user_id, created_at").limit(1000),
          supabase.from("subscription_plans").select("id, name, plan_type, price"),
          supabase.from("profiles").select("user_id, created_at, full_name, email, is_blocked").order("created_at", { ascending: false }).limit(500),
        ]);

        if (!mounted) return;

        const payments = paymentsRes.data || [];
        const analyses = analysesRes.data || [];
        const subs = subsRes.data || [];
        const plans = plansRes.data || [];
        const profiles = profilesRes.data || [];
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const pending = payments.filter((payment) => payment.status === "pending");
        const confirmed = payments.filter((payment) => payment.status === "confirmed");
        const rejected = payments.filter((payment) => payment.status === "rejected");
        const activeSubs = subs.filter((sub) => sub.status === "active");
        const scoreValues = analyses.map((analysis) => Number(analysis.score)).filter((score) => Number.isFinite(score));
        const totalUsers = usersCountRes.count || 0;
        const totalRevenue = confirmed.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const revenueMonth = confirmed
          .filter((payment) => new Date(payment.created_at).getTime() >= monthStart)
          .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const pendingRevenue = pending.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const todayAnalyses = analyses.filter((analysis) => analysis.created_at.slice(0, 10) === todayStr).length;
        const newUsersToday = profiles.filter((profile) => profile.created_at.slice(0, 10) === todayStr).length;
        const activeUsers7d = new Set(
          analyses.filter((analysis) => new Date(analysis.created_at) >= sevenDaysAgo).map((analysis) => analysis.user_id)
        ).size;
        const avgScore = scoreValues.length ? Math.round(scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length) : 0;

        setStats({
          totalUsers,
          totalAnalyses: analysesCountRes.count || 0,
          pendingPayments: pending.length,
          confirmedPayments: confirmed.length,
          rejectedPayments: rejected.length,
          totalRevenue,
          revenueMonth,
          pendingRevenue,
          todayAnalyses,
          newUsersToday,
          activeSubscriptions: activeSubs.length,
          activeUsers7d,
          blockedUsers: profiles.filter((profile) => profile.is_blocked).length,
          avgScore,
          conversionRate: totalUsers > 0 ? Math.round((activeSubs.length / totalUsers) * 100) : 0,
        });

        const analysisDays: Record<string, number> = {};
        const userDays: Record<string, number> = {};
        for (let i = rangeDays - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const key = date.toISOString().slice(0, 10);
          analysisDays[key] = 0;
          userDays[key] = 0;
        }
        analyses.forEach((analysis) => {
          const key = analysis.created_at.slice(0, 10);
          if (key in analysisDays) analysisDays[key]++;
        });
        profiles.forEach((profile) => {
          const key = profile.created_at.slice(0, 10);
          if (key in userDays) userDays[key]++;
        });

        setChartData(Object.entries(analysisDays).map(([date, count]) => ({ date: formatShortDate(date), count })));
        setUserGrowth(Object.entries(userDays).map(([date, count]) => ({ date: formatShortDate(date), novos: count })));

        const plansMap = new Map(plans.map((plan) => [plan.id, plan]));
        const distCount: Record<string, number> = {};
        activeSubs.forEach((sub) => {
          const plan = plansMap.get(sub.plan_id);
          const name = plan?.name || "Outro";
          distCount[name] = (distCount[name] || 0) + 1;
        });
        const freeUsers = Math.max(0, totalUsers - activeSubs.length);
        if (freeUsers > 0) distCount.Gratuito = (distCount.Gratuito || 0) + freeUsers;
        setPlanDistribution(Object.entries(distCount).map(([name, value]) => ({ name, value })));

        setScoreBuckets([
          { name: "Alta aderência", value: scoreValues.filter((score) => score >= 80).length },
          { name: "Média", value: scoreValues.filter((score) => score >= 50 && score < 80).length },
          { name: "Baixa", value: scoreValues.filter((score) => score < 50).length },
        ]);

        const activity: RecentActivity[] = [];
        analyses.slice(0, 6).forEach((analysis) => {
          activity.push({
            id: `a-${analysis.created_at}-${analysis.user_id}`,
            type: "analysis",
            description: `Análise concluída${Number.isFinite(Number(analysis.score)) ? ` com score ${analysis.score}%` : ""}`,
            time: new Date(analysis.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
            timestamp: new Date(analysis.created_at).getTime(),
          });
        });
        profiles.slice(0, 5).forEach((profile) => {
          activity.push({
            id: `u-${profile.created_at}-${profile.user_id}`,
            type: profile.is_blocked ? "warning" : "signup",
            description: profile.is_blocked
              ? `${profile.full_name || profile.email || "Usuário"} está bloqueado`
              : `${profile.full_name || profile.email || "Novo usuário"} se cadastrou`,
            time: new Date(profile.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
            timestamp: new Date(profile.created_at).getTime(),
          });
        });
        pending.slice(0, 4).forEach((payment) => {
          activity.push({
            id: `p-${payment.id}`,
            type: "payment",
            description: `Pagamento de ${formatCurrency(Number(payment.amount || 0))} pendente`,
            time: new Date(payment.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
            timestamp: new Date(payment.created_at).getTime(),
          });
        });
        setRecentActivity(activity.sort((a, b) => b.timestamp - a.timestamp).slice(0, 9));

        if (pending.length > 0) {
          const pendingUserIds = [...new Set(pending.slice(0, 6).map((payment) => payment.user_id))];
          const pendingPlanIds = [...new Set(pending.slice(0, 6).map((payment) => payment.plan_id))];
          const [pendingProfilesRes, pendingPlansRes] = await Promise.all([
            supabase.from("profiles").select("user_id, full_name, email").in("user_id", pendingUserIds),
            supabase.from("subscription_plans").select("id, name").in("id", pendingPlanIds),
          ]);
          if (!mounted) return;
          const profileMap = new Map((pendingProfilesRes.data || []).map((profile) => [profile.user_id, profile]));
          const planMap = new Map((pendingPlansRes.data || []).map((plan) => [plan.id, plan]));
          setPendingList(pending.slice(0, 6).map((payment) => ({ ...payment, profile: profileMap.get(payment.user_id), plan: planMap.get(payment.plan_id) })));
        } else {
          setPendingList([]);
        }

        if (refreshToken > 0) toast.success("Dashboard atualizado");
      } catch (err) {
        console.error("Error fetching admin stats:", err);
        toast.error("Não foi possível carregar o painel admin");
      } finally {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchAll();
    return () => {
      mounted = false;
    };
  }, [rangeDays, refreshToken]);

  const insights = useMemo(() => {
    if (!stats) return [];

    const items = [];
    if (stats.pendingPayments > 0) {
      items.push({ icon: Clock, label: "Prioridade de receita", text: `${stats.pendingPayments} pagamento(s) aguardando revisão, somando ${formatCurrency(stats.pendingRevenue)}.` });
    }
    if (stats.conversionRate < 15 && stats.totalUsers > 10) {
      items.push({ icon: Target, label: "Conversão baixa", text: `Apenas ${stats.conversionRate}% dos usuários estão em planos ativos. Vale revisar oferta, onboarding e limite gratuito.` });
    }
    if (stats.activeUsers7d > 0) {
      items.push({ icon: Activity, label: "Uso recente", text: `${stats.activeUsers7d} usuário(s) fizeram análises nos últimos 7 dias.` });
    }
    if (stats.avgScore > 0) {
      items.push({ icon: BarChart3, label: "Qualidade das análises", text: `Score médio recente em ${stats.avgScore}%. Use isso para entender o perfil dos candidatos analisados.` });
    }
    if (stats.blockedUsers > 0) {
      items.push({ icon: ShieldAlert, label: "Contas bloqueadas", text: `${stats.blockedUsers} usuário(s) bloqueados precisam continuar monitorados.` });
    }

    return items.slice(0, 4);
  }, [stats]);

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
      await supabase.from("user_subscriptions").update({ status: "inactive" }).eq("user_id", userId).eq("status", "active");
      await supabase.from("user_subscriptions").insert({ user_id: userId, plan_id: planId, status: "active", started_at: new Date().toISOString() });
      toast.success("Pagamento confirmado e plano ativado!");
    } else {
      toast.info("Pagamento rejeitado.");
    }

    setPendingList((prev) => prev.filter((payment) => payment.id !== id));
    setStats((prev) => prev ? {
      ...prev,
      pendingPayments: Math.max(0, prev.pendingPayments - 1),
      ...(status === "confirmed"
        ? { confirmedPayments: prev.confirmedPayments + 1, activeSubscriptions: prev.activeSubscriptions + 1 }
        : { rejectedPayments: prev.rejectedPayments + 1 }),
    } : prev);
  };

  const healthStatus = stats && (stats.pendingPayments > 0 || stats.blockedUsers > 0) ? "Atenção" : "Estável";
  const statCards = stats ? [
    { label: "Usuários", value: stats.totalUsers, icon: Users, color: "text-primary", sub: `+${stats.newUsersToday} hoje` },
    { label: "Análises", value: stats.totalAnalyses, icon: FileText, color: "text-info", sub: `${stats.todayAnalyses} hoje` },
    { label: "Receita total", value: formatCurrency(stats.totalRevenue), icon: Wallet, color: "text-accent", sub: `${formatCurrency(stats.revenueMonth)} no mês` },
    { label: "Planos ativos", value: stats.activeSubscriptions, icon: CreditCard, color: "text-primary", sub: `${stats.conversionRate}% conversão` },
  ] : [];

  const activityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "analysis": return <FileText className="w-3.5 h-3.5 text-info" />;
      case "payment": return <CreditCard className="w-3.5 h-3.5 text-warning" />;
      case "signup": return <Users className="w-3.5 h-3.5 text-accent" />;
      case "warning": return <ShieldAlert className="w-3.5 h-3.5 text-destructive" />;
      default: return <Activity className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground text-sm mt-1">Operação, receita e qualidade das análises em um só lugar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-border bg-muted/30 p-1">
            {RANGE_OPTIONS.map((days) => (
              <Button key={days} size="sm" variant={rangeDays === days ? "secondary" : "ghost"} className="h-8 px-3 text-xs" onClick={() => setRangeDays(days)}>
                {days}d
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-2" disabled={refreshing} onClick={() => setRefreshToken((current) => current + 1)}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/10">
        <CardContent className="p-5 lg:p-6">
          {loading ? (
            <div className="grid gap-4 lg:grid-cols-4"><Skeleton className="h-24 lg:col-span-2" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
          ) : stats ? (
            <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant={healthStatus === "Estável" ? "secondary" : "outline"} className="gap-1"><Activity className="w-3 h-3" />Operação {healthStatus}</Badge>
                  {stats.pendingPayments > 0 && <Badge variant="outline" className="border-warning/40 text-warning">{stats.pendingPayments} pendente(s)</Badge>}
                </div>
                <h2 className="font-display text-xl font-semibold">Centro de comando</h2>
                <p className="mt-1 text-sm text-muted-foreground max-w-xl">Priorize pagamentos pendentes, acompanhe conversão de planos e veja se as análises estão gerando bons sinais de aderência.</p>
              </div>
              <MetricBlock label="Conversão" value={`${stats.conversionRate}%`} icon={Target} />
              <MetricBlock label="Score médio" value={stats.avgScore ? `${stats.avgScore}%` : "--"} icon={BarChart3} />
              <MetricBlock label="Ativos 7d" value={stats.activeUsers7d} icon={Activity} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-16" /></CardContent></Card>
        )) : statCards.map((card) => (
          <Card key={card.label} className="relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</span><card.icon className={`w-4 h-4 ${card.color}`} /></div>
              <p className="text-2xl font-bold font-display">{card.value}</p>
              <div className="flex items-center gap-1 mt-1"><ArrowUpRight className="w-3 h-3 text-accent" /><span className="text-xs text-muted-foreground">{card.sub}</span></div>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/30" />
          </Card>
        ))}
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatusCard icon={CheckCircle} label="Confirmados" value={stats.confirmedPayments} tone="accent" />
          <StatusCard icon={Clock} label="Pendentes" value={stats.pendingPayments} tone="warning" />
          <StatusCard icon={XCircle} label="Rejeitados" value={stats.rejectedPayments} tone="destructive" />
          <StatusCard icon={ShieldAlert} label="Bloqueados" value={stats.blockedUsers} tone="destructive" />
          <StatusCard icon={UserPlus} label="Novos hoje" value={stats.newUsersToday} tone="primary" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center justify-between">Análises no período<Badge variant="secondary" className="text-xs font-normal">{rangeDays} dias</Badge></CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={rangeDays > 14 ? 2 : 1} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={30} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="count" name="Análises" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Insights rápidos</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div> : insights.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhum alerta importante agora.</p>
            ) : (
              <div className="space-y-3">
                {insights.map((item) => (
                  <div key={item.label} className="flex gap-3 rounded-lg border border-border p-3">
                    <div className="mt-0.5 rounded-md bg-muted p-2 h-fit"><item.icon className="w-4 h-4 text-primary" /></div>
                    <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.text}</p></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Distribuição de planos</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-56 w-full" /> : planDistribution.length === 0 ? <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p> : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value">
                      {planDistribution.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <LegendList data={planDistribution} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Novos cadastros</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-56 w-full" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={userGrowth}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={rangeDays > 14 ? 3 : 2} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={30} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="novos" name="Novos" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Scores recentes</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-56 w-full" /> : scoreBuckets.every((bucket) => bucket.value === 0) ? <p className="text-sm text-muted-foreground text-center py-12">Sem scores recentes</p> : (
              <div className="space-y-4 pt-2">
                {scoreBuckets.map((bucket, index) => {
                  const total = scoreBuckets.reduce((sum, item) => sum + item.value, 0) || 1;
                  const percent = Math.round((bucket.value / total) * 100);
                  return (
                    <div key={bucket.name}>
                      <div className="flex items-center justify-between text-sm mb-1"><span>{bucket.name}</span><span className="font-medium">{bucket.value}</span></div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="w-4 h-4 text-warning" />Fila de atenção</CardTitle>
              <Link to="/admin/payments/review"><Button variant="ghost" size="sm" className="text-xs gap-1">Ver pagamentos <Eye className="w-3 h-3" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div> : pendingList.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center"><CheckCircle className="mx-auto mb-2 h-8 w-8 text-accent" /><p className="text-sm font-medium">Nenhum pagamento pendente</p><p className="text-xs text-muted-foreground mt-1">A operação financeira está limpa agora.</p></div>
            ) : (
              <div className="space-y-2">
                {pendingList.map((payment) => (
                  <div key={payment.id} className="flex flex-col gap-3 border border-border rounded-lg p-3 hover:bg-muted/30 transition-colors sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium truncate">{payment.profile?.full_name || payment.profile?.email || "Usuário sem nome"}</p>{payment.plan && <Badge variant="secondary" className="text-xs shrink-0">{payment.plan.name}</Badge>}</div>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(Number(payment.amount || 0))} • {formatShortDate(payment.created_at)}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button size="sm" variant="outline" className="h-8 px-2.5 text-accent hover:bg-accent/10" onClick={() => handleQuickAction(payment.id, "confirmed", payment.user_id, payment.plan_id)}><CheckCircle className="w-3.5 h-3.5 mr-1" /><span className="text-xs">Confirmar</span></Button>
                      <Button size="sm" variant="outline" className="h-8 px-2.5 text-destructive hover:bg-destructive/10" onClick={() => handleQuickAction(payment.id, "rejected", payment.user_id, payment.plan_id)}><XCircle className="w-3.5 h-3.5 mr-1" /><span className="text-xs">Rejeitar</span></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center justify-between">Atividade recente<Activity className="w-4 h-4 text-muted-foreground" /></CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div> : recentActivity.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade recente</p> : (
              <div className="space-y-1">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors"><div className="p-1.5 rounded-full bg-muted shrink-0">{activityIcon(item.type)}</div><div className="min-w-0 flex-1"><p className="text-sm truncate">{item.description}</p><p className="text-xs text-muted-foreground">{item.time}</p></div></div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { to: "/admin/users", label: "Usuários", icon: Users },
          { to: "/admin/payments/review", label: "Pagamentos", icon: CreditCard },
          { to: "/admin/plans", label: "Planos", icon: TrendingUp },
          { to: "/admin/payments/pix", label: "Config Pix", icon: Activity },
        ].map((link) => (
          <Link key={link.to} to={link.to}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer group"><CardContent className="pt-4 pb-4 flex items-center gap-3"><link.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" /><span className="text-sm font-medium">{link.label}</span><ArrowUpRight className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" /></CardContent></Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MetricBlock({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return <div className="rounded-lg border border-border/70 bg-card/70 p-4"><div className="flex items-center justify-between text-muted-foreground"><span className="text-xs uppercase tracking-wide">{label}</span><Icon className="w-4 h-4" /></div><p className="mt-2 font-display text-2xl font-bold">{value}</p></div>;
}

function StatusCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: string }) {
  const toneClass = {
    accent: "border-accent/20 bg-accent/5 text-accent",
    warning: "border-warning/20 bg-warning/5 text-warning",
    destructive: "border-destructive/20 bg-destructive/5 text-destructive",
    primary: "border-primary/20 bg-primary/5 text-primary",
  }[tone] || "border-border bg-card text-primary";

  return <Card className={toneClass}><CardContent className="pt-4 pb-4 flex items-center gap-3"><Icon className="w-5 h-5 shrink-0" /><div><p className="text-lg font-bold font-display text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>;
}

function LegendList({ data }: { data: any[] }) {
  return <div className="flex flex-wrap gap-3 mt-2 justify-center">{data.map((item, idx) => <div key={item.name} className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} /><span className="text-muted-foreground">{item.name}</span><span className="font-semibold">{item.value}</span></div>)}</div>;
}
