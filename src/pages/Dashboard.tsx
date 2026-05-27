import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { JobParametersForm, type JobParameters } from "@/components/dashboard/JobParametersForm";
import { ResumeUpload } from "@/components/dashboard/ResumeUpload";
import { AnalysisResults, type AnalysisResult } from "@/components/dashboard/AnalysisResults";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPlan } from "@/hooks/useUserPlan";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, FileSearch, Sparkles } from "lucide-react";
import { MetricsDashboard } from "@/components/dashboard/MetricsDashboard";
import { OnboardingOverlay } from "@/components/dashboard/OnboardingOverlay";

function getFriendlyAnalysisError(message?: string) {
  const text = (message || "").toLowerCase();
  if (text.includes("daily") || text.includes("limit") || text.includes("429")) {
    return "Seu limite de análises foi atingido. Faça upgrade do plano ou tente novamente depois.";
  }
  if (text.includes("authentication") || text.includes("jwt") || text.includes("session") || text.includes("401")) {
    return "Sua sessão expirou. Entre novamente para continuar.";
  }
  if (text.includes("crédito") || text.includes("credit") || text.includes("402")) {
    return "O serviço de IA está sem créditos no momento. Tente novamente mais tarde.";
  }
  if (text.includes("invalid") || text.includes("currículo")) {
    return "Não conseguimos validar esse currículo. Tente reenviar o arquivo ou usar outro formato.";
  }
  return message || "Não foi possível concluir a análise agora. Tente novamente em alguns instantes.";
}

const analysisSteps = [
  { label: "Lendo currículo", icon: FileSearch },
  { label: "Comparando requisitos", icon: Sparkles },
  { label: "Salvando resultado", icon: CheckCircle2 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dailyLimit, dailyUsage, canAnalyze, loading: planLoading, refresh } = useUserPlan();
  const [jobParams, setJobParams] = useState<JobParameters | null>(null);

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Assinatura realizada com sucesso! Seu plano foi atualizado.");
      refresh();
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  const handleSetJobParams = (params: JobParameters) => {
    setJobParams(params);
    localStorage.setItem("__batch_job_params", JSON.stringify(params));
  };

  const [parsedResume, setParsedResume] = useState<any>(null);
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  useEffect(() => {
    if (!analyzing) {
      setAnalysisStep(0);
      return;
    }

    const interval = window.setInterval(() => {
      setAnalysisStep((step) => Math.min(step + 1, analysisSteps.length - 1));
    }, 1800);

    return () => window.clearInterval(interval);
  }, [analyzing]);

  const handleAnalyze = async () => {
    if (!jobParams || !parsedResume) {
      toast.error("Preencha os parâmetros da vaga e faça upload do currículo.");
      return;
    }

    if (!canAnalyze) {
      setShowLimitDialog(true);
      return;
    }

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke("analyze-resume", {
        body: { parsedResume, jobParameters: jobParams },
      });

      if (analysisError) throw new Error(analysisError.message || "Erro na análise");

      const result = analysisData?.result;
      if (!result) throw new Error("Erro ao obter resultado da análise");

      setAnalysisStep(2);
      setAnalysisResult(result);

      if (user) {
        const { error: insertError } = await supabase.from("analysis_results").insert({
          user_id: user.id,
          job_parameters: jobParams as any,
          result: result as any,
          score: result.score ?? 0,
        });

        if (insertError) console.error("analysis result save failed", insertError);
      }

      await refresh();
      toast.success("Análise concluída!");
    } catch (err: any) {
      console.error(err);
      const friendly = getFriendlyAnalysisError(err?.message);
      toast.error(friendly);
      if (friendly.includes("limite")) setShowLimitDialog(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const ActiveStepIcon = analysisSteps[analysisStep].icon;

  return (
    <div className="space-y-6">
      <OnboardingOverlay />
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Análise de Currículos</h1>
          <p className="text-muted-foreground text-sm mt-1">Defina os parâmetros da vaga e envie o currículo para análise</p>
        </div>
        {!planLoading && dailyLimit !== null && (
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <span className="font-semibold text-foreground">{dailyUsage}</span>/{dailyLimit} análises hoje
          </div>
        )}
      </div>

      {analyzing && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3 text-sm">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <ActiveStepIcon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">{analysisSteps[analysisStep].label}</p>
            <p className="text-xs text-muted-foreground">Estamos preparando uma recomendação mais completa para essa vaga.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <JobParametersForm onSave={handleSetJobParams} savedParams={jobParams} />
          <ResumeUpload
            onResumeProcessed={(parsed, fileName) => {
              setParsedResume(parsed);
              setResumeFileName(fileName);
              setAnalysisResult(null);
            }}
            fileName={resumeFileName}
            onAnalyze={handleAnalyze}
            analyzing={analyzing}
            canAnalyze={!!jobParams && !!parsedResume}
          />
        </div>

        <div>
          <AnalysisResults result={analysisResult} loading={analyzing} jobParams={jobParams} />
        </div>
      </div>

      <MetricsDashboard />

      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <DialogTitle className="font-display">Limite diário atingido</DialogTitle>
            </div>
            <DialogDescription className="text-left">
              Você já utilizou suas <span className="font-semibold text-foreground">{dailyLimit} análises</span> diárias.
              Aguarde a renovação do limite ou faça upgrade do seu plano para analisar mais currículos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowLimitDialog(false)} className="w-full sm:w-auto">
              Entendi
            </Button>
            <Button onClick={() => { setShowLimitDialog(false); navigate("/plans"); }} className="w-full sm:w-auto">
              Atualizar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
