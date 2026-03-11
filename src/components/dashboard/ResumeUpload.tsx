import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Loader2, Sparkles, X, Users, Trophy, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ParsedFile {
  fileName: string;
  parsed: any;
}

interface Props {
  onResumeProcessed: (parsed: any, fileName: string) => void;
  fileName: string;
  onAnalyze: () => void;
  analyzing: boolean;
  canAnalyze: boolean;
}

export function ResumeUpload({ onResumeProcessed, fileName, onAnalyze, analyzing, canAnalyze }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Batch mode
  const [batchMode, setBatchMode] = useState(false);
  const [batchFiles, setBatchFiles] = useState<ParsedFile[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const batchFileRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File): Promise<{ parsed: any; fileName: string } | null> => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error(`${file.name}: Formato inválido.`);
      return null;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${file.name}: Muito grande (máx 10MB).`);
      return null;
    }

    const buffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    const { data, error } = await supabase.functions.invoke("process-resume", {
      body: { fileBase64: base64, fileName: file.name, fileType: file.type },
    });

    if (error || !data?.parsed) {
      toast.error(`Erro ao processar ${file.name}`);
      return null;
    }

    return { parsed: data.parsed, fileName: file.name };
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const result = await processFile(file);
      if (result) {
        onResumeProcessed(result.parsed, result.fileName);
        toast.success("Currículo processado com sucesso!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao processar arquivo: " + (err.message || "Tente novamente"));
    } finally {
      setUploading(false);
    }
  };

  const handleBatchFiles = async (files: FileList) => {
    const fileArray = Array.from(files).slice(0, 10); // max 10
    if (fileArray.length === 0) return;

    setBatchProcessing(true);
    setBatchProgress(0);

    const results: ParsedFile[] = [];
    for (let i = 0; i < fileArray.length; i++) {
      try {
        const result = await processFile(fileArray[i]);
        if (result) {
          results.push(result);
        }
      } catch (err) {
        console.error(err);
      }
      setBatchProgress(((i + 1) / fileArray.length) * 100);
    }

    setBatchFiles((prev) => [...prev, ...results]);
    setBatchProcessing(false);
    toast.success(`${results.length} currículo(s) processado(s)!`);
  };

  const removeBatchFile = (index: number) => {
    setBatchFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-display">
            <Upload className="w-5 h-5 text-primary" />
            Upload do Currículo
          </span>
          <Button
            variant={batchMode ? "default" : "outline"}
            size="sm"
            onClick={() => setBatchMode(!batchMode)}
            className="text-xs gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            {batchMode ? "Modo Lote Ativo" : "Análise em Lote"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!batchMode ? (
          <>
            {/* Single mode */}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Processando currículo...</p>
                </div>
              ) : fileName ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 text-primary" />
                  <p className="text-sm font-medium text-foreground">{fileName}</p>
                  <p className="text-xs text-muted-foreground">Clique para trocar o arquivo</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Arraste ou clique para enviar</p>
                  <p className="text-xs text-muted-foreground">PDF ou DOCX (máx. 10MB)</p>
                </div>
              )}
            </div>

            <Button className="w-full" size="lg" onClick={onAnalyze} disabled={!canAnalyze || analyzing}>
              {analyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analisando...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Analisar Currículo com IA</>
              )}
            </Button>
          </>
        ) : (
          <>
            {/* Batch mode */}
            <input
              ref={batchFileRef}
              type="file"
              accept=".pdf,.docx"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleBatchFiles(e.target.files)}
            />
            <div
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => batchFileRef.current?.click()}
            >
              {batchProcessing ? (
                <div className="space-y-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Processando currículos...</p>
                  <Progress value={batchProgress} className="h-2" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Users className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Selecione múltiplos currículos</p>
                  <p className="text-xs text-muted-foreground">PDF ou DOCX (máx. 10 arquivos, 10MB cada)</p>
                </div>
              )}
            </div>

            {/* Batch file list */}
            {batchFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {batchFiles.length} currículo(s) prontos para análise
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {batchFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                      <span className="text-xs text-foreground flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                        {f.fileName}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeBatchFile(i)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <BatchAnalyzeButton files={batchFiles} canAnalyze={batchFiles.length > 0} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function exportRankingCsv(results: { fileName: string; score: number; result: any }[]) {
  const headers = ["Posição", "Arquivo", "Score", "Classificação", "Resumo"];
  const rows = results.map((r, i) => [
    i + 1,
    r.fileName,
    r.score,
    r.result?.classificacao || "",
    (r.result?.resumo || "").replace(/"/g, '""'),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.map((v: any) => `"${v}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ranking-candidatos.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type RankingFilter = "all" | "compatible" | "incompatible";

// Batch analyze button component
function BatchAnalyzeButton({ files, canAnalyze }: { files: ParsedFile[]; canAnalyze: boolean }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<{ fileName: string; score: number; result: any }[]>([]);
  const [progress, setProgress] = useState(0);
  const [rankingFilter, setRankingFilter] = useState<RankingFilter>("all");

  const runBatch = async () => {
    setAnalyzing(true);
    setResults([]);
    setProgress(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Faça login."); setAnalyzing(false); return; }

    const batchResults: { fileName: string; score: number; result: any }[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const { data, error } = await supabase.functions.invoke("analyze-resume", {
          body: {
            parsedResume: files[i].parsed,
            jobParameters: JSON.parse(localStorage.getItem("__batch_job_params") || "{}"),
          },
        });

        if (error) throw error;
        const result = data?.result;
        if (result) {
          batchResults.push({ fileName: files[i].fileName, score: result.score ?? 0, result });

          await supabase.from("analysis_results").insert({
            user_id: user.id,
            job_parameters: JSON.parse(localStorage.getItem("__batch_job_params") || "{}"),
            result: result as any,
            score: result.score ?? 0,
          });
        }
      } catch (err) {
        console.error(err);
        batchResults.push({ fileName: files[i].fileName, score: 0, result: { resumo: "Erro na análise" } });
      }
      setProgress(((i + 1) / files.length) * 100);
    }

    batchResults.sort((a, b) => b.score - a.score);
    setResults(batchResults);
    setAnalyzing(false);
    toast.success(`${batchResults.length} análise(s) concluída(s)!`);
  };

  const isCompatible = (r: any) =>
    r?.classificacao?.toLowerCase().includes("compatível") && !r?.classificacao?.toLowerCase().includes("não");

  const filteredResults = results.filter((r) => {
    if (rankingFilter === "compatible") return isCompatible(r.result);
    if (rankingFilter === "incompatible") return !isCompatible(r.result);
    return true;
  });

  return (
    <div className="space-y-4">
      <Button className="w-full" size="lg" onClick={runBatch} disabled={!canAnalyze || analyzing}>
        {analyzing ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analisando {files.length} currículo(s)...</>
        ) : (
          <><Sparkles className="w-4 h-4 mr-2" />Analisar {files.length} Currículo(s) em Lote</>
        )}
      </Button>

      {analyzing && <Progress value={progress} className="h-2" />}

      {/* Enhanced Ranking */}
      {results.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-display font-semibold text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[hsl(40,90%,50%)]" />
              Ranking de Candidatos
            </h3>
            <div className="flex gap-1.5">
              {(["all", "compatible", "incompatible"] as RankingFilter[]).map((f) => (
                <Button
                  key={f}
                  variant={rankingFilter === f ? "default" : "outline"}
                  size="sm"
                  className="text-[10px] h-7 px-2"
                  onClick={() => setRankingFilter(f)}
                >
                  {f === "all" ? "Todos" : f === "compatible" ? "Compatíveis" : "Incompatíveis"}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredResults.map((r, i) => {
              const originalIndex = results.indexOf(r);
              const isBest = originalIndex === 0;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                    isBest
                      ? "bg-[hsl(40,90%,50%)]/10 ring-1 ring-[hsl(40,90%,50%)]/30"
                      : "bg-muted/50"
                  }`}
                >
                  <span className={`font-display font-bold text-lg w-8 text-center shrink-0 ${
                    originalIndex === 0 ? "text-[hsl(40,90%,50%)]" : originalIndex === 1 ? "text-muted-foreground" : "text-muted-foreground/60"
                  }`}>
                    {isBest ? "🏆" : `#${originalIndex + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.fileName}</p>
                    <div className="mt-1.5">
                      <Progress value={r.score} className="h-1.5" />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{r.result?.resumo}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={isCompatible(r.result) ? "default" : "destructive"} className="text-xs hidden sm:inline-flex">
                      {r.result?.classificacao}
                    </Badge>
                    <span className={`font-display font-bold ${r.score >= 70 ? "text-[hsl(160,60%,45%)]" : r.score >= 40 ? "text-[hsl(40,90%,50%)]" : "text-destructive"}`}>
                      {r.score}<span className="text-xs text-muted-foreground">/100</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Export CSV */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={() => exportRankingCsv(results)}
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Ranking em CSV
          </Button>
        </div>
      )}
    </div>
  );
}
