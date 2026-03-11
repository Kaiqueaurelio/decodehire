import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, TrendingUp, TrendingDown, Target, FileText, Trophy, Briefcase } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

interface AnalysisRow {
  score: number;
  created_at: string;
  result: any;
  job_parameters: any;
}

function MetricsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function MetricsDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("analysis_results")
      .select("score, created_at, result, job_parameters")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data: rows }) => {
        setData((rows as AnalysisRow[]) || []);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <MetricsSkeleton />;
  if (data.length === 0) return null;

  const totalAnalyses = data.length;
  const avgScore = Math.round(data.reduce((s, d) => s + d.score, 0) / totalAnalyses);
  const bestScore = Math.max(...data.map((d) => d.score));
  const compatibleCount = data.filter(
    (d) => (d.result as any)?.classificacao?.toLowerCase().includes("compatível") &&
           !(d.result as any)?.classificacao?.toLowerCase().includes("não")
  ).length;
  const compatiblePct = Math.round((compatibleCount / totalAnalyses) * 100);

  // Weekly trend
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thisWeek = data.filter((d) => new Date(d.created_at) >= oneWeekAgo);
  const lastWeek = data.filter((d) => new Date(d.created_at) >= twoWeeksAgo && new Date(d.created_at) < oneWeekAgo);
  const thisWeekAvg = thisWeek.length > 0 ? Math.round(thisWeek.reduce((s, d) => s + d.score, 0) / thisWeek.length) : 0;
  const lastWeekAvg = lastWeek.length > 0 ? Math.round(lastWeek.reduce((s, d) => s + d.score, 0) / lastWeek.length) : 0;
  const trend = thisWeekAvg - lastWeekAvg;
  const trendUp = trend >= 0;

  // Top 5 cargos
  const cargoCount: Record<string, number> = {};
  data.forEach((d) => {
    const cargo = (d.job_parameters as any)?.cargo || "Desconhecido";
    cargoCount[cargo] = (cargoCount[cargo] || 0) + 1;
  });
  const topCargos = Object.entries(cargoCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name: name.length > 18 ? name.substring(0, 18) + "…" : name, count }));

  const topCargo = topCargos[0]?.name || "—";

  // Group by day for chart
  const byDay = data.reduce<Record<string, { total: number; sumScore: number }>>((acc, d) => {
    const day = new Date(d.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    if (!acc[day]) acc[day] = { total: 0, sumScore: 0 };
    acc[day].total++;
    acc[day].sumScore += d.score;
    return acc;
  }, {});

  const chartData = Object.entries(byDay).map(([day, v]) => ({
    day,
    análises: v.total,
    "score médio": Math.round(v.sumScore / v.total),
  }));

  const pieData = [
    { name: "Compatível", value: compatibleCount },
    { name: "Não Compatível", value: totalAnalyses - compatibleCount },
  ];
  const pieColors = ["hsl(160, 60%, 45%)", "hsl(0, 75%, 55%)"];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        Suas Métricas
      </h2>

      {/* KPI Cards - 4 columns on desktop, 2 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{totalAnalyses}</p>
              <p className="text-xs text-muted-foreground">Total de Análises</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              {trendUp ? <TrendingUp className="w-5 h-5 text-[hsl(160,60%,45%)]" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-display font-bold">{avgScore}<span className="text-sm text-muted-foreground">/100</span></p>
                {lastWeek.length > 0 && (
                  <span className={`text-xs font-semibold ${trendUp ? "text-[hsl(160,60%,45%)]" : "text-destructive"}`}>
                    {trendUp ? "+" : ""}{trend}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Score Médio</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[hsl(40,90%,50%)]/10 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-[hsl(40,90%,50%)]" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{bestScore}<span className="text-sm text-muted-foreground">/100</span></p>
              <p className="text-xs text-muted-foreground">Melhor Score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[hsl(160,60%,45%)]/10 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-[hsl(160,60%,45%)]" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{compatiblePct}%</p>
              <p className="text-xs text-muted-foreground">Taxa Compatíveis</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolution chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Evolução ao longo do tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(230, 70%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(230, 70%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="score médio" stroke="hsl(230, 70%, 50%)" fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Distribuição</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top cargos bar chart */}
      {topCargos.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Top 5 Cargos Mais Analisados
              <span className="text-xs font-normal ml-auto">Mais frequente: {topCargo}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topCargos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(230, 70%, 50%)" radius={[0, 4, 4, 0]} name="Análises" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
