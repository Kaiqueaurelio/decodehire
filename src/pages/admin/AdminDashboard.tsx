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
  Bell,
  Crown,
  Sparkles,
  MoreVertical,
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

const PIE_COLORS = ["#7c3aed", "#06b6d4", "#f59e0b", "#22c55e"];
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
        const revenueMonth = confirmed.filter((payment) => new Date(payment.created_at).getTime() >= monthStart).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const pendingRevenue = pending.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const todayAnalyses = analyses.filter((analysis) => analysis.created_at.slice(0, 10) === todayStr).length;
        const newUsersToday = profiles.filter((profile) => profile.created_at.slice(0, 10) === todayStr).length;
        const activeUsers7d = new Set(analyses.filter((analysis) => new Date(analysis.created_at) >= sevenDaysAgo).map((analysis) => analysis.user_id)).size;
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
            description: profile.is_blocked ? `${profile.full_name || profile.email || "Usuário"} está bloqueado` : `${profile.full_name || profile.email || "Novo usuário"} se cadastrou`,
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
    if (stats.pendingPayments > 0) items.push({ icon: Clock, label: "Receita aguardando", text: `${stats.pendingPayments} pagamento(s) pendentes somando ${formatCurrency(stats.pendingRevenue)}.` });
    if (stats.conversionRate < 15 && stats.totalUsers > 10) items.push({ icon: Target, label: "Conversão baixa", text: `${stats.conversionRate}% dos usuários estão em planos ativos. Revise oferta e onboarding.` });
    if (stats.activeUsers7d > 0) items.push({ icon: Activity, label: "Uso recente", text: `${stats.activeUsers7d} usuário(s) fizeram análises nos últimos 7 dias.` });
    if (stats.avgScore > 0) items.push({ icon: BarChart3, label: "Score médio", text: `Aderência média recente em ${stats.avgScore}%.` });
    if (stats.blockedUsers > 0) items.push({ icon: ShieldAlert, label: "Contas bloqueadas", text: `${stats.blockedUsers} usuário(s) bloqueados precisam de monitoramento.` });
    return items.slice(0, 4);
  }, [stats]);

  const handleQuickAction = async (id: string, status: "confirmed" | "rejected", userId: string, planId: string) => {
    const { error } = await supabase.from("payment_requests").update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id }).eq("id", id);
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
      ...(status === "confirmed" ? { confirmedPayments: prev.confirmedPayments + 1, activeSubscriptions: prev.activeSubscriptions + 1 } : { rejectedPayments: prev.rejectedPayments + 1 }),
    } : prev);
  };

  const healthStatus = stats && (stats.pendingPayments > 0 || stats.blockedUsers > 0) ? "Atenção" : "Estável";
  const topCards = stats ? [
    { label: "Receita total", value: formatCurrency(stats.totalRevenue), sub: `${formatCurrency(stats.revenueMonth)} neste mês`, icon: TrendingUp, accent: "from-violet-600 to-indigo-950" },
    { label: "Análises", value: stats.totalAnalyses, sub: `${stats.todayAnalyses} hoje`, icon: FileText, accent: "from-indigo-700 to-slate-950" },
    { label: "Planos ativos", value: stats.activeSubscriptions, sub: `${stats.conversionRate}% conversão`, icon: Crown, accent: "from-fuchsia-600 to-purple-950" },
  ] : [];

  const activityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "analysis": return <FileText className="w-3.5 h-3.5 text-cyan-500" />;
      case "payment": return <CreditCard className="w-3.5 h-3.5 text-amber-500" />;
      case "signup": return <Users className="w-3.5 h-3.5 text-emerald-500" />;
      case "warning": return <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />;
      default: return <Activity className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="-m-4 min-h-screen space-y-6 bg-[#f5f3fb] p-4 text-slate-950 md:-m-8 md:p-8">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-700 text-white shadow-lg shadow-violet-700/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-950">Admin Dashboard</h1>
              <p className="text-sm text-slate-500">Painel visual de operação, receita e crescimento.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {RANGE_OPTIONS.map((days) => (
                <Button key={days} size="sm" variant={rangeDays === days ? "secondary" : "ghost"} className="h-8 rounded-lg px-3 text-xs" onClick={() => setRangeDays(days)}>
                  {days}d
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl border-slate-200" disabled={refreshing} onClick={() => setRefreshToken((current) => current + 1)}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-violet-50 text-violet-700">
              <Bell className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-gradient-to-r from-violet-800 via-violet-700 to-indigo-700 p-5 text-white lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <Badge className="mb-3 border-white/20 bg-white/15 text-white hover:bg-white/20">Operação {healthStatus}</Badge>
            <h2 className="font-display text-3xl font-bold">Centro de comando DecodeHire</h2>
            <p className="mt-2 max-w-2xl text-sm text-violet-100">Acompanhe pagamentos, usuários, planos e qualidade das análises em uma visão mais executiva e rápida de ler.</p>
          </div>
          {stats && (
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/10 p-3 backdrop-blur">
              <HeroMini label="Usuários" value={stats.totalUsers} />
              <HeroMini label="Ativos 7d" value={stats.activeUsers7d} />
              <HeroMini label="Score" value={stats.avgScore ? `${stats.avgScore}%` : "--"} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />) : topCards.map((card) => (
          <Card key={card.label} className={`overflow-hidden border-0 bg-gradient-to-br ${card.accent} text-white shadow-xl shadow-violet-950/10`}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
                <card.icon className="h-7 w-7" />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-100">{card.label}</p>
                <p className="font-display text-3xl font-light">{card.value}</p>
                <p className="mt-1 text-xs text-violet-200">{card.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatusPill icon={CheckCircle} label="Confirmados" value={stats.confirmedPayments} color="emerald" />
          <StatusPill icon={Clock} label="Pendentes" value={stats.pendingPayments} color="amber" />
          <StatusPill icon={XCircle} label="Rejeitados" value={stats.rejectedPayments} color="rose" />
          <StatusPill icon={ShieldAlert} label="Bloqueados" value={stats.blockedUsers} color="violet" />
          <StatusPill icon={UserPlus} label="Novos hoje" value={stats.newUsersToday} color="cyan" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-950">Ritmo de análises</CardTitle>
              <p className="text-xs text-slate-500">Volume diário no período selecionado</p>
            </div>
            <MoreVertical className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-72 w-full rounded-xl" /> : (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} interval={rangeDays > 14 ? 2 : 1} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} width={30} />
                    <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px" }} />
                    <Bar dataKey="count" name="Análises" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <ActivityHeatmap rows={[{ label: "Análises", data: chartData, keyName: "count" }, { label: "Cadastros", data: userGrowth, keyName: "novos" }]} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-950">Fila de atenção</CardTitle>
              <p className="text-xs text-slate-500">Pagamentos que pedem ação</p>
            </div>
            <Link to="/admin/payments/review"><Button variant="ghost" size="sm" className="gap-1 text-xs text-violet-700">Ver <Eye className="h-3 w-3" /></Button></Link>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div> : pendingList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <CheckCircle className="mx-auto mb-2 h-9 w-9 text-emerald-500" />
                <p className="text-sm font-semibold text-slate-900">Sem pendências</p>
                <p className="mt-1 text-xs text-slate-500">A fila financeira está limpa.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingList.map((payment) => (
                  <div key={payment.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-white"><Wallet className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-950">{payment.profile?.full_name || payment.profile?.email || "Usuário sem nome"}</p>
                        <p className="text-xs text-slate-500">{payment.plan?.name || "Plano"} • {formatCurrency(Number(payment.amount || 0))}</p>
                      </div>
                      <span className="text-xs font-semibold text-violet-700">{formatShortDate(payment.created_at)}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button size="sm" className="h-8 rounded-lg bg-emerald-600 text-xs hover:bg-emerald-700" onClick={() => handleQuickAction(payment.id, "confirmed", payment.user_id, payment.plan_id)}>Confirmar</Button>
                      <Button size="sm" variant="outline" className="h-8 rounded-lg border-rose-200 text-xs text-rose-600 hover:bg-rose-50" onClick={() => handleQuickAction(payment.id, "rejected", payment.user_id, payment.plan_id)}>Rejeitar</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-slate-950">Distribuição de planos</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-56 w-full rounded-xl" /> : planDistribution.length === 0 ? <EmptyText text="Sem dados" /> : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value">
                      {planDistribution.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <LegendList data={planDistribution} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-slate-950">Novos cadastros</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-56 w-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={userGrowth}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} interval={rangeDays > 14 ? 3 : 2} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} width={30} />
                  <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="novos" name="Novos" stroke="#a855f7" fill="#a855f7" fillOpacity={0.18} strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-slate-950">Scores recentes</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-56 w-full rounded-xl" /> : scoreBuckets.every((bucket) => bucket.value === 0) ? <EmptyText text="Sem scores recentes" /> : (
              <div className="space-y-5 pt-3">
                {scoreBuckets.map((bucket, index) => {
                  const total = scoreBuckets.reduce((sum, item) => sum + item.value, 0) || 1;
                  const percent = Math.round((bucket.value / total) * 100);
                  return <ProgressRow key={bucket.name} label={bucket.name} value={bucket.value} percent={percent} color={PIE_COLORS[index % PIE_COLORS.length]} />;
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-slate-950">Insights rápidos</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div> : insights.length === 0 ? <EmptyText text="Nenhum alerta importante agora" /> : (
              <div className="space-y-3">
                {insights.map((item) => <InsightCard key={item.label} icon={item.icon} label={item.label} text={item.text} />)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-base font-semibold text-slate-950">Atividade recente</CardTitle><MoreVertical className="h-5 w-5 text-slate-400" /></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}</div> : recentActivity.length === 0 ? <EmptyText text="Nenhuma atividade recente" /> : (
              <div className="grid gap-2 md:grid-cols-2">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white shadow-sm">{activityIcon(item.type)}</div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{item.description}</p><p className="text-xs text-slate-500">{item.time}</p></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { to: "/admin/users", label: "Usuários", icon: Users },
          { to: "/admin/payments/review", label: "Pagamentos", icon: CreditCard },
          { to: "/admin/plans", label: "Planos", icon: TrendingUp },
          { to: "/admin/payments/pix", label: "Config Pix", icon: Activity },
        ].map((link) => (
          <Link key={link.to} to={link.to}>
            <Card className="group cursor-pointer border-0 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4"><link.icon className="h-4 w-4 text-violet-700" /><span className="text-sm font-semibold text-slate-900">{link.label}</span><ArrowUpRight className="ml-auto h-3 w-3 text-slate-400 opacity-0 transition group-hover:opacity-100" /></CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function HeroMini({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl bg-white/10 p-3 text-center"><p className="font-display text-2xl font-bold">{value}</p><p className="text-[11px] text-violet-100">{label}</p></div>;
}

function StatusPill({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500 text-white",
    amber: "bg-amber-400 text-white",
    rose: "bg-rose-500 text-white",
    violet: "bg-violet-600 text-white",
    cyan: "bg-cyan-500 text-white",
  };
  return <div className={`flex items-center gap-3 rounded-2xl p-4 shadow-sm ${colors[color]}`}><div className="grid h-10 w-10 place-items-center rounded-full bg-white/20"><Icon className="h-5 w-5" /></div><div><p className="font-display text-2xl font-bold leading-none">{value}</p><p className="text-xs text-white/85">{label}</p></div></div>;
}

function ActivityHeatmap({ rows }: { rows: { label: string; data: any[]; keyName: string }[] }) {
  const max = Math.max(...rows.flatMap((row) => row.data.map((item) => Number(item[row.keyName]) || 0)), 1);
  return <div className="space-y-3 rounded-2xl bg-slate-50 p-4">{rows.map((row) => <div key={row.label} className="grid grid-cols-[82px_1fr] items-center gap-3"><span className="text-xs font-medium text-slate-500">{row.label}</span><div className="grid grid-flow-col gap-1">{row.data.map((item, index) => { const intensity = Math.max(0.12, (Number(item[row.keyName]) || 0) / max); return <div key={`${row.label}-${index}`} title={`${item.date}: ${item[row.keyName]}`} className="h-5 rounded-sm bg-blue-600" style={{ opacity: intensity }} />; })}</div></div>)}</div>;
}

function ProgressRow({ label, value, percent, color }: { label: string; value: number; percent: number; color: string }) {
  return <div><div className="mb-1 flex items-center justify-between text-sm"><span className="font-medium text-slate-700">{label}</span><span className="font-semibold text-slate-950">{value}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} /></div></div>;
}

function InsightCard({ icon: Icon, label, text }: { icon: any; label: string; text: string }) {
  return <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-700 text-white"><Icon className="h-4 w-4" /></div><div><p className="text-sm font-semibold text-slate-950">{label}</p><p className="mt-0.5 text-xs leading-relaxed text-slate-500">{text}</p></div></div>;
}

function EmptyText({ text }: { text: string }) {
  return <p className="py-12 text-center text-sm text-slate-500">{text}</p>;
}

function LegendList({ data }: { data: any[] }) {
  return <div className="mt-2 flex flex-wrap justify-center gap-3">{data.map((item, idx) => <div key={item.name} className="flex items-center gap-1.5 text-xs"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} /><span className="text-slate-500">{item.name}</span><span className="font-semibold text-slate-950">{item.value}</span></div>)}</div>;
}
