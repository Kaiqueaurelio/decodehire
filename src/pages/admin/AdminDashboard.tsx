import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, FileText, TrendingUp, CheckCircle, Clock, XCircle } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalAnalyses: number;
  pendingPayments: number;
  confirmedPayments: number;
  rejectedPayments: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAnalyses: 0,
    pendingPayments: 0,
    confirmedPayments: 0,
    rejectedPayments: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, analysesRes, paymentsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("analysis_results").select("id", { count: "exact", head: true }),
        supabase.from("payment_requests").select("*"),
      ]);

      const payments = paymentsRes.data || [];
      const pending = payments.filter((p) => p.status === "pending").length;
      const confirmed = payments.filter((p) => p.status === "confirmed").length;
      const rejected = payments.filter((p) => p.status === "rejected").length;
      const revenue = payments
        .filter((p) => p.status === "confirmed")
        .reduce((sum, p) => sum + Number(p.amount), 0);

      setStats({
        totalUsers: usersRes.count || 0,
        totalAnalyses: analysesRes.count || 0,
        pendingPayments: pending,
        confirmedPayments: confirmed,
        rejectedPayments: rejected,
        totalRevenue: revenue,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Usuários", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Análises Realizadas", value: stats.totalAnalyses, icon: FileText, color: "text-accent-foreground" },
    { label: "Receita Total", value: `R$ ${stats.totalRevenue.toFixed(2).replace(".", ",")}`, icon: TrendingUp, color: "text-success" },
    { label: "Pagamentos Pendentes", value: stats.pendingPayments, icon: Clock, color: "text-warning" },
    { label: "Pagamentos Confirmados", value: stats.confirmedPayments, icon: CheckCircle, color: "text-success" },
    { label: "Pagamentos Rejeitados", value: stats.rejectedPayments, icon: XCircle, color: "text-destructive" },
  ];

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
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
    </div>
  );
}
