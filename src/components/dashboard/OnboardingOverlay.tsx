import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Settings, Sparkles, X, ChevronRight } from "lucide-react";

const STORAGE_KEY = "decode_onboarding_completed";

const steps = [
  {
    icon: Settings,
    title: "Defina a Vaga",
    description: "Configure os parâmetros como cargo, habilidades e experiência mínima.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: FileText,
    title: "Envie o Currículo",
    description: "Faça upload do currículo em PDF ou DOCX para análise automática.",
    color: "text-[hsl(160,60%,45%)]",
    bg: "bg-[hsl(160,60%,45%)]/10",
  },
  {
    icon: Sparkles,
    title: "Veja o Resultado",
    description: "A IA analisa e retorna score, habilidades compatíveis e pontos de melhoria.",
    color: "text-[hsl(40,90%,50%)]",
    bg: "bg-[hsl(40,90%,50%)]/10",
  },
];

export function OnboardingOverlay() {
  const [visible, setVisible] = useState(() => {
    return !localStorage.getItem(STORAGE_KEY);
  });
  const [currentStep, setCurrentStep] = useState(0);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md relative overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-10 h-8 w-8"
          onClick={dismiss}
        >
          <X className="w-4 h-4" />
        </Button>

        <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
          {/* Step indicator */}
          <div className="flex justify-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep ? "w-8 bg-primary" : "w-3 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className={`w-20 h-20 rounded-2xl ${step.bg} flex items-center justify-center mx-auto`}>
            <step.icon className={`w-10 h-10 ${step.color}`} />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h2 className="font-display text-xl font-bold">{step.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          {/* Step counter */}
          <p className="text-xs text-muted-foreground">
            Passo {currentStep + 1} de {steps.length}
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep((p) => p - 1)}>
                Voltar
              </Button>
            )}
            {isLast ? (
              <Button onClick={dismiss} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Começar a Usar
              </Button>
            ) : (
              <Button onClick={() => setCurrentStep((p) => p + 1)} className="gap-2">
                Próximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
