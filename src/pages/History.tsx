import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPlan } from "@/hooks/useUserPlan";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, Lock } from "lucide-react";
import { toast } from "sonner";

interface HistoryItem {
  id: string;
  score: number;
  result: any;
  job_parameters: any;
  created_at: string;
}

function exportToCsv(items: HistoryItem[], filename: string) {
  const headers = ["Cargo", "Score", "Classificação", "Resumo", "Data"];
  const rows = items.map((item) => {
    const r = item.result as any;
    const jp = item.job_parameters as any;
    return [
      jp?.cargo || "",
      item.score,
      r?.classificacao || "",
      (r?.resumo || "").replace(/"/g, '""'),
      new Date(item.created_at).toLocaleDateString("pt-BR"),
    ];
  });

  const csv = [headers.join(","), ...rows.map((r) => r.map((v: any) => `"${v}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function History() {
  const { user } = useAuth();
  const { canExport } = useUserPlan();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("analysis_results")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as HistoryItem[]) || []);
        setLoading(false);
      });
  }, [user]);

  const handleExportAll = () => {
    if (!canExport) {
      toast.error("Exportação disponível nos planos Pro e Business.");
      return;
    }
    exportToCsv(items, "analises-historico.csv");
    toast.success("Exportação concluída!");
  };

  const handleExportSingle = (item: HistoryItem) => {
    if (!canExport) {
      toast.error("Exportação disponível nos planos Pro e Business.");
      return;
    }
    const jp = item.job_parameters as any;
    exportToCsv([item], `analise-${jp?.cargo || "resultado"}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Histórico de Análises</h1>
          <p className="text-muted-foreground text-sm mt-1">Suas análises anteriores</p>
        </div>
        {items.length > 0 && (
          <Button
            variant={canExport ? "outline" : "secondary"}
            size="sm"
            onClick={handleExportAll}
            className="gap-2"
          >
            {canExport ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            Exportar Tudo
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma análise realizada ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const r = item.result as any;
            const jp = item.job_parameters as any;
            const isCompatible =
              r?.classificacao?.toLowerCase().includes("compatível") &&
              !r?.classificacao?.toLowerCase().includes("não");
            return (
              <Card key={item.id} className="animate-fade-in">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-display font-semibold">{jp?.cargo || "Vaga"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExportSingle(item)}
                        title={canExport ? "Exportar CSV" : "Disponível no plano Pro"}
                      >
                        {canExport ? (
                          <Download className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Badge variant={isCompatible ? "default" : "destructive"}>
                        {r?.classificacao}
                      </Badge>
                      <span className="font-display font-bold text-xl">
                        {item.score}
                        <span className="text-sm text-muted-foreground">/100</span>
                      </span>
                    </div>
                  </div>
                  {r?.resumo && <p className="text-sm text-muted-foreground mt-2">{r.resumo}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
