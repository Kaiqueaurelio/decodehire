import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Star, BarChart3, Loader2, User, Download, MessageSquareText, Target } from "lucide-react";
import { exportAnalysisPdf } from "@/lib/exportPdf";

export interface AnalysisResult {
  classificacao: string;
  score: number;
  habilidades_compativeis: string[];
  experiencia_relevante: string;
  diferenciais: string[];
  lacunas: string[];
  resumo: string;
}

interface Props {
  result: AnalysisResult | null;
  loading: boolean;
  jobParams?: any;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getInsightScores(result: AnalysisResult) {
  const skills = result.habilidades_compativeis?.length ?? 0;
  const gaps = result.lacunas?.length ?? 0;
  const differentials = result.diferenciais?.length ?? 0;

  return [
    { label: "Aderência geral", value: clampScore(result.score) },
    { label: "Habilidades", value: clampScore(Math.max(result.score * 0.55, skills * 14)) },
    { label: "Experiência", value: clampScore(result.experiencia_relevante ? result.score + 8 : result.score - 12) },
    { label: "Risco de lacunas", value: clampScore(100 - gaps * 18) },
    { label: "Diferenciais", value: clampScore(differentials * 22) },
  ];
}

function buildInterviewQuestions(result: AnalysisResult, jobParams?: any) {
  const cargo = jobParams?.cargo || "a vaga";
  const gapQuestions = (result.lacunas || []).slice(0, 3).map((gap) => `Como você lidaria com ${gap.toLowerCase()} no contexto de ${cargo}?`);
  const skillQuestions = (result.habilidades_compativeis || []).slice(0, 2).map((skill) => `Conte sobre um projeto real em que você usou ${skill}. Qual foi o resultado?`);

  return [
    ...skillQuestions,
    ...gapQuestions,
    `Qual experiência anterior mais se conecta com os desafios de ${cargo}?`,
  ].slice(0, 5);
}

export function AnalysisResults({ result, loading, jobParams }: Props) {
  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4 px-6">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Analisando currículo com IA...</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground max-w-md">
            <span className="rounded-md bg-muted px-3 py-2">Lendo perfil</span>
            <span className="rounded-md bg-muted px-3 py-2">Comparando requisitos</span>
            <span className="rounded-md bg-muted px-3 py-2">Gerando recomendação</span>
          </div>
        </div>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 px-6">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">Os resultados da análise aparecerão aqui</p>
          <p className="text-xs text-muted-foreground">Preencha os parâmetros e envie o currículo</p>
        </div>
      </Card>
    );
  }

  const isCompatible = result.classificacao?.toLowerCase().includes("compatível") && !result.classificacao?.toLowerCase().includes("não");
  const scoreColor = result.score >= 70 ? "text-success" : result.score >= 40 ? "text-warning" : "text-destructive";
  const insightScores = getInsightScores(result);
  const interviewQuestions = buildInterviewQuestions(result, jobParams);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => exportAnalysisPdf(result, jobParams)}>
          <Download className="w-4 h-4" />
          Exportar PDF
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <Badge variant={isCompatible ? "default" : "destructive"} className="text-sm px-3 py-1">
              {result.classificacao}
            </Badge>
            <div className={`text-4xl font-display font-bold ${scoreColor}`}>
              {result.score}<span className="text-lg text-muted-foreground">/100</span>
            </div>
          </div>
          <Progress value={result.score} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">Score de compatibilidade</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 font-display">
            <Target className="w-4 h-4 text-primary" />
            Diagnóstico por dimensão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insightScores.map((metric) => (
            <div key={metric.label} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{metric.label}</span>
                <span className="font-semibold text-foreground">{metric.value}%</span>
              </div>
              <Progress value={metric.value} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 font-display">
            <User className="w-4 h-4 text-primary" />
            Resumo do Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{result.resumo}</p>
        </CardContent>
      </Card>

      {result.habilidades_compativeis?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 font-display">
              <CheckCircle className="w-4 h-4 text-success" />
              Habilidades Compatíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.habilidades_compativeis.map((h, i) => <Badge key={i} variant="secondary" className="text-xs">{h}</Badge>)}
            </div>
          </CardContent>
        </Card>
      )}

      {result.experiencia_relevante && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 font-display">
              <Star className="w-4 h-4 text-warning" />
              Experiência Relevante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{result.experiencia_relevante}</p>
          </CardContent>
        </Card>
      )}

      {result.diferenciais?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 font-display">
              <Star className="w-4 h-4 text-primary" />
              Diferenciais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {result.diferenciais.map((d, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />{d}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {result.lacunas?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 font-display">
              <XCircle className="w-4 h-4 text-destructive" />
              Requisitos Ausentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {result.lacunas.map((l, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />{l}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 font-display">
            <MessageSquareText className="w-4 h-4 text-primary" />
            Perguntas sugeridas para entrevista
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {interviewQuestions.map((question, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="font-semibold text-primary">{i + 1}.</span>
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
