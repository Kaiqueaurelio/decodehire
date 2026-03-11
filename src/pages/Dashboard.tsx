import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { AlertTriangle } from "lucide-react";
import { MetricsDashboard } from "@/components/dashboard/MetricsDashboard";
import { OnboardingOverlay } from "@/components/dashboard/OnboardingOverlay";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dailyLimit, dailyUsage, canAnalyze, loading: planLoading, refresh } = useUserPlan();
  const [jobParams, setJobParams] = useState<JobParameters | null>(null);

  const handleSetJobParams = (params: JobParameters) => {
    setJobParams(params);
    localStorage.setItem("__batch_job_params", JSON.stringify(params));
  };
  const [parsedResume, setParsedResume] = useState<any>(null);
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);

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
    try {
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke("analyze-resume", {
        body: { parsedResume, jobParameters: jobParams },
      });

      if (analysisError) throw new Error(analysisError.message || "Erro na análise");

      const result = analysisData?.result;
      if (!result) throw new Error("Erro ao obter resultado da análise");

      setAnalysisResult(result);

      if (user) {
        await supabase.from("analysis_results").insert({
          user_id: user.id,
          job_parameters: jobParams as any,
          result: result as any,
          score: result.score ?? 0,
        });
      }

      await refresh();
      toast.success("Análise concluída!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao analisar currículo");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <OnboardingOverlay />
      <div className="flex items-center justify-between">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <JobParametersForm onSave={handleSetJobParams} savedParams={jobParams} />
          <ResumeUpload
            onResumeProcessed={(parsed, fileName) => {
              setParsedResume(parsed);
              setResumeFileName(fileName);
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
              Aguarde 24 horas para uma nova consulta ou faça upgrade do seu plano para mais análises.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowLimitDialog(false)} className="w-full sm:w-auto">
              Aguardar 24h
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
