import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

interface HistoryItem {
  id: string;
  score: number;
  result: any;
  job_parameters: any;
  created_at: string;
}

export default function History() {
  const { user } = useAuth();
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Histórico de Análises</h1>
        <p className="text-muted-foreground text-sm mt-1">Suas análises anteriores</p>
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
            const isCompatible = r?.classificacao?.toLowerCase().includes("compatível") && !r?.classificacao?.toLowerCase().includes("não");
            return (
              <Card key={item.id} className="animate-fade-in">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-display font-semibold">{jp?.cargo || "Vaga"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={isCompatible ? "default" : "destructive"}>{r?.classificacao}</Badge>
                      <span className="font-display font-bold text-xl">{item.score}<span className="text-sm text-muted-foreground">/100</span></span>
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
