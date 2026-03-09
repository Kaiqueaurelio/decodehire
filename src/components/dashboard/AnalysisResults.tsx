import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Star, BarChart3, Loader2, User } from "lucide-react";

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
}

export function AnalysisResults({ result, loading }: Props) {
  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Analisando currículo com IA...</p>
          <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
        </div>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">Os resultados da análise aparecerão aqui</p>
          <p className="text-xs text-muted-foreground">Preencha os parâmetros e envie o currículo</p>
        </div>
      </Card>
    );
  }

  const isCompatible = result.classificacao?.toLowerCase().includes("compatível") && !result.classificacao?.toLowerCase().includes("não");
  const scoreColor = result.score >= 70 ? "text-success" : result.score >= 40 ? "text-warning" : "text-destructive";

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Score Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Badge variant={isCompatible ? "default" : "destructive"} className="text-sm px-3 py-1">
                {result.classificacao}
              </Badge>
            </div>
            <div className={`text-4xl font-display font-bold ${scoreColor}`}>
              {result.score}
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
          </div>
          <Progress value={result.score} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">Score de compatibilidade</p>
        </CardContent>
      </Card>

      {/* Summary */}
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

      {/* Skills */}
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
              {result.habilidades_compativeis.map((h, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{h}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience */}
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

      {/* Differentials */}
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
                  <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Gaps */}
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
                  <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                  {l}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
