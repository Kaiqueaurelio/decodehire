import { useState } from "react";
import { JobParametersForm, type JobParameters } from "@/components/dashboard/JobParametersForm";
import { ResumeUpload } from "@/components/dashboard/ResumeUpload";
import { AnalysisResults, type AnalysisResult } from "@/components/dashboard/AnalysisResults";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useAuth();
  const [jobParams, setJobParams] = useState<JobParameters | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!jobParams || !resumeText) {
      toast.error("Preencha os parâmetros da vaga e faça upload do currículo.");
      return;
    }

    setAnalyzing(true);
    try {
      // Step 1: Parse resume
      const { data: parseData, error: parseError } = await supabase.functions.invoke("parse-resume", {
        body: { resumeText },
      });

      if (parseError) throw new Error(parseError.message || "Erro ao processar currículo");

      const parsedResume = parseData?.parsed;
      if (!parsedResume) throw new Error("Erro ao estruturar currículo");

      // Step 2: Analyze
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke("analyze-resume", {
        body: { parsedResume, jobParameters: jobParams },
      });

      if (analysisError) throw new Error(analysisError.message || "Erro na análise");

      const result = analysisData?.result;
      if (!result) throw new Error("Erro ao obter resultado da análise");

      setAnalysisResult(result);

      // Save to DB
      if (user) {
        await supabase.from("analysis_results").insert({
          user_id: user.id,
          job_parameters: jobParams as any,
          result: result as any,
          score: result.score ?? 0,
        });
      }

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
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Análise de Currículos</h1>
        <p className="text-muted-foreground text-sm mt-1">Defina os parâmetros da vaga e envie o currículo para análise</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Panel */}
        <div className="space-y-6">
          <JobParametersForm onSave={setJobParams} savedParams={jobParams} />
          <ResumeUpload
            onTextExtracted={(text, fileName) => {
              setResumeText(text);
              setResumeFileName(fileName);
            }}
            fileName={resumeFileName}
            onAnalyze={handleAnalyze}
            analyzing={analyzing}
            canAnalyze={!!jobParams && !!resumeText}
          />
        </div>

        {/* Right Panel */}
        <div>
          <AnalysisResults result={analysisResult} loading={analyzing} />
        </div>
      </div>
    </div>
  );
}
