import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPlan } from "@/hooks/useUserPlan";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BarChart3, Download, Lock, FileText, Trash2, AlertTriangle,
  Eye, CheckCircle, XCircle, Star, User, GitCompareArrows,
} from "lucide-react";
import { toast } from "sonner";
import { exportAnalysisPdf } from "@/lib/exportPdf";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend,
} from "recharts";

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

// Helper to extract radar metrics from a result
function getRadarMetrics(r: any) {
  const skills = r?.habilidades_compativeis?.length ?? 0;
  const gaps = r?.lacunas?.length ?? 0;
  const diffs = r?.diferenciais?.length ?? 0;
  const score = r?.score ?? 0;

  return {
    "Score Geral": score,
    "Habilidades": Math.min(skills * 15, 100),
    "Diferenciais": Math.min(diffs * 20, 100),
    "Lacunas (inv.)": Math.max(100 - gaps * 25, 0),
    "Experiência": score >= 70 ? 85 : score >= 40 ? 55 : 25,
  };
}

const RADAR_COLORS = [
  "hsl(230, 70%, 50%)",
  "hsl(160, 60%, 45%)",
  "hsl(40, 90%, 50%)",
  "hsl(0, 75%, 55%)",
];

// ─── Detail Preview Dialog ───
function DetailDialog({ item, open, onClose }: { item: HistoryItem | null; open: boolean; onClose: () => void }) {
  if (!item) return null;
  const r = item.result as any;
  const jp = item.job_parameters as any;
  const isCompatible = r?.classificacao?.toLowerCase().includes("compatível") && !r?.classificacao?.toLowerCase().includes("não");
  const scoreColor = item.score >= 70 ? "text-[hsl(160,60%,45%)]" : item.score >= 40 ? "text-[hsl(40,90%,50%)]" : "text-destructive";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-3">
            <Eye className="w-5 h-5 text-primary" />
            {jp?.cargo || "Análise"}
          </DialogTitle>
          <DialogDescription>
            {new Date(item.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 pb-4">
            {/* Score */}
            <div className="flex items-center justify-between">
              <Badge variant={isCompatible ? "default" : "destructive"} className="text-sm px-3 py-1">
                {r?.classificacao}
              </Badge>
              <span className={`text-3xl font-display font-bold ${scoreColor}`}>
                {item.score}<span className="text-sm text-muted-foreground">/100</span>
              </span>
            </div>
            <Progress value={item.score} className="h-3" />

            {/* Summary */}
            {r?.resumo && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-primary" /> Resumo
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.resumo}</p>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {r?.habilidades_compativeis?.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-[hsl(160,60%,45%)]" /> Habilidades Compatíveis
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {r.habilidades_compativeis.map((h: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{h}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Experience */}
            {r?.experiencia_relevante && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-[hsl(40,90%,50%)]" /> Experiência Relevante
                  </p>
                  <p className="text-sm text-muted-foreground">{r.experiencia_relevante}</p>
                </CardContent>
              </Card>
            )}

            {/* Differentials */}
            {r?.diferenciais?.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-primary" /> Diferenciais
                  </p>
                  <ul className="space-y-1">
                    {r.diferenciais.map((d: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-[hsl(160,60%,45%)] mt-0.5 shrink-0" />{d}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Gaps */}
            {r?.lacunas?.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-destructive" /> Requisitos Ausentes
                  </p>
                  <ul className="space-y-1">
                    {r.lacunas.map((l: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />{l}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Comparison Dialog ───
function ComparisonDialog({
  items,
  open,
  onClose,
}: {
  items: HistoryItem[];
  open: boolean;
  onClose: () => void;
}) {
  if (items.length < 2) return null;

  const metrics = Object.keys(getRadarMetrics(items[0].result));
  const radarData = metrics.map((metric) => {
    const entry: any = { metric };
    items.forEach((item, i) => {
      const jp = item.job_parameters as any;
      const label = jp?.cargo ? `${jp.cargo.substring(0, 15)}` : `Candidato ${i + 1}`;
      entry[label] = getRadarMetrics(item.result)[metric as keyof ReturnType<typeof getRadarMetrics>];
    });
    return entry;
  });

  const candidateKeys = Object.keys(radarData[0]).filter((k) => k !== "metric");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-3">
            <GitCompareArrows className="w-5 h-5 text-primary" />
            Comparação de Candidatos
          </DialogTitle>
          <DialogDescription>
            Comparando {items.length} análises lado a lado
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {/* Radar Chart */}
            <Card>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid className="stroke-border" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    {candidateKeys.map((key, i) => (
                      <Radar
                        key={key}
                        name={key}
                        dataKey={key}
                        stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                        fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Side-by-side cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item, i) => {
                const r = item.result as any;
                const jp = item.job_parameters as any;
                const isCompatible = r?.classificacao?.toLowerCase().includes("compatível") && !r?.classificacao?.toLowerCase().includes("não");
                const scoreColor = item.score >= 70 ? "text-[hsl(160,60%,45%)]" : item.score >= 40 ? "text-[hsl(40,90%,50%)]" : "text-destructive";

                return (
                  <Card key={item.id} className="border-l-4" style={{ borderLeftColor: RADAR_COLORS[i % RADAR_COLORS.length] }}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-display font-semibold text-sm">{jp?.cargo || "Candidato"}</p>
                        <span className={`text-2xl font-display font-bold ${scoreColor}`}>
                          {item.score}<span className="text-xs text-muted-foreground">/100</span>
                        </span>
                      </div>
                      <Badge variant={isCompatible ? "default" : "destructive"} className="text-xs">
                        {r?.classificacao}
                      </Badge>
                      <p className="text-xs text-muted-foreground line-clamp-3">{r?.resumo}</p>

                      {r?.habilidades_compativeis?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-1">Habilidades ({r.habilidades_compativeis.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {r.habilidades_compativeis.slice(0, 5).map((h: string, j: number) => (
                              <Badge key={j} variant="secondary" className="text-[10px]">{h}</Badge>
                            ))}
                            {r.habilidades_compativeis.length > 5 && (
                              <Badge variant="outline" className="text-[10px]">+{r.habilidades_compativeis.length - 5}</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {r?.lacunas?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-1 text-destructive">Lacunas ({r.lacunas.length})</p>
                          <ul className="space-y-0.5">
                            {r.lacunas.slice(0, 3).map((l: string, j: number) => (
                              <li key={j} className="text-[11px] text-muted-foreground flex items-start gap-1">
                                <XCircle className="w-3 h-3 text-destructive mt-0.5 shrink-0" />{l}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main History Component ───
export default function History() {
  const { user } = useAuth();
  const { canExport } = useUserPlan();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewItem, setPreviewItem] = useState<HistoryItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);

  const fetchItems = () => {
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
  };

  useEffect(() => { fetchItems(); }, [user]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      else toast.error("Máximo 4 candidatos para comparação.");
      return next;
    });
  };

  const handleCompare = () => {
    if (selectedIds.size < 2) {
      toast.error("Selecione ao menos 2 análises para comparar.");
      return;
    }
    setCompareOpen(true);
  };

  const handleDeleteOne = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("analysis_results").delete().eq("id", deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) {
      toast.error("Erro ao excluir análise.");
    } else {
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(deleteId); return n; });
      toast.success("Análise excluída.");
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    setDeleting(true);
    const { error } = await supabase.from("analysis_results").delete().eq("user_id", user.id);
    setDeleting(false);
    setClearAllOpen(false);
    if (error) {
      toast.error("Erro ao limpar histórico.");
    } else {
      setItems([]);
      setSelectedIds(new Set());
      toast.success("Histórico zerado.");
    }
  };

  const handleExportAll = () => {
    if (!canExport) { toast.error("Exportação disponível nos planos Pro e Business."); return; }
    exportToCsv(items, "analises-historico.csv");
    toast.success("Exportação concluída!");
  };

  const handleExportSingle = (item: HistoryItem) => {
    if (!canExport) { toast.error("Exportação disponível nos planos Pro e Business."); return; }
    const jp = item.job_parameters as any;
    const r = item.result as any;
    exportAnalysisPdf(r, jp, new Date(item.created_at).toLocaleDateString("pt-BR"));
    toast.success("PDF exportado!");
  };

  const comparedItems = items.filter((i) => selectedIds.has(i.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold">Histórico de Análises</h1>
          <p className="text-muted-foreground text-sm mt-1">Clique em uma análise para ver detalhes. Selecione para comparar.</p>
        </div>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedIds.size >= 2 && (
              <Button size="sm" onClick={handleCompare} className="gap-2">
                <GitCompareArrows className="w-4 h-4" />
                Comparar ({selectedIds.size})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setClearAllOpen(true)} className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
              Zerar
            </Button>
            <Button variant={canExport ? "outline" : "secondary"} size="sm" onClick={handleExportAll} className="gap-2">
              {canExport ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              Exportar
            </Button>
          </div>
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
        <div className="grid gap-3">
          {items.map((item) => {
            const r = item.result as any;
            const jp = item.job_parameters as any;
            const isCompatible = r?.classificacao?.toLowerCase().includes("compatível") && !r?.classificacao?.toLowerCase().includes("não");
            const isSelected = selectedIds.has(item.id);

            return (
              <Card
                key={item.id}
                className={`animate-fade-in cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
                onClick={() => setPreviewItem(item)}
              >
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="shrink-0"
                      onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                    >
                      <Checkbox checked={isSelected} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-sm truncate">{jp?.cargo || "Vaga"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); handleExportSingle(item); }}>
                        {canExport ? <FileText className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                      </Button>
                      <Badge variant={isCompatible ? "default" : "destructive"} className="text-xs hidden sm:inline-flex">
                        {r?.classificacao}
                      </Badge>
                      <span className="font-display font-bold text-lg">
                        {item.score}<span className="text-xs text-muted-foreground">/100</span>
                      </span>
                    </div>
                  </div>
                  {r?.resumo && <p className="text-xs text-muted-foreground mt-2 line-clamp-2 ml-9">{r.resumo}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail preview */}
      <DetailDialog item={previewItem} open={!!previewItem} onClose={() => setPreviewItem(null)} />

      {/* Comparison */}
      <ComparisonDialog items={comparedItems} open={compareOpen} onClose={() => setCompareOpen(false)} />

      {/* Delete single */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Excluir análise</DialogTitle>
            <DialogDescription>Tem certeza? Essa ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteOne} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear all */}
      <Dialog open={clearAllOpen} onOpenChange={setClearAllOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <DialogTitle className="font-display">Zerar histórico</DialogTitle>
            </div>
            <DialogDescription>
              Isso excluirá <span className="font-semibold text-foreground">todas as {items.length} análises</span>. Irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClearAllOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleClearAll} disabled={deleting}>
              {deleting ? "Excluindo..." : "Zerar Tudo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
