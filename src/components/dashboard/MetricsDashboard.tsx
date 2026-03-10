import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, TrendingUp, Target, FileText } from "lucide-react";
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
} from "recharts";

interface AnalysisRow {
  score: number;
  created_at: string;
  result: any;
}

export function MetricsDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("analysis_results")
      .select("score, created_at, result")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data: rows }) => {
        setData((rows as AnalysisRow[]) || []);
        setLoading(false);
      });
  }, [user]);

  if (loading || data.length === 0) return null;

  const totalAnalyses = data.length;
  const avgScore = Math.round(data.reduce((s, d) => s + d.score, 0) / totalAnalyses);
  const compatibleCount = data.filter(
    (d) => (d.result as any)?.classificacao?.toLowerCase().includes("compatível") &&
           !(d.result as any)?.classificacao?.toLowerCase().includes("não")
  ).length;
  const compatiblePct = Math.round((compatibleCount / totalAnalyses) * 100);

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
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
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{avgScore}<span className="text-sm text-muted-foreground">/100</span></p>
              <p className="text-xs text-muted-foreground">Score Médio</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{compatiblePct}%</p>
              <p className="text-xs text-muted-foreground">Compatíveis</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
    </div>
  );
}
