import { useState, useEffect, useRef, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Star,
  Briefcase,
  GraduationCap,
  Code2,
} from "lucide-react";

const TABS_ORDER = ["params", "upload", "result"] as const;
const CYCLE_MS = 4000;
const TICK_MS = 40;
const STEP = 100 / (CYCLE_MS / TICK_MS);

export default function AppDemo() {
  const [activeTab, setActiveTab] = useState("params");
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const advanceTab = useCallback(() => {
    setActiveTab((prev) => {
      const idx = TABS_ORDER.indexOf(prev as any);
      return TABS_ORDER[(idx + 1) % TABS_ORDER.length];
    });
    setProgress(0);
  }, []);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p + STEP >= 100) {
          advanceTab();
          return 0;
        }
        return p + STEP;
      });
    }, TICK_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, activeTab, advanceTab]);

  const handleTabClick = (value: string) => {
    setActiveTab(value);
    setProgress(0);
  };
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Demo Interativo
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Veja o App em Ação
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Navegue pelas telas e veja como funciona a análise completa.
          </p>
        </div>

        {/* Browser frame */}
        <div className="max-w-3xl mx-auto rounded-xl border border-border overflow-hidden shadow-xl bg-card">
          {/* Browser bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/60 border-b border-border">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-warning/60" />
              <div className="w-3 h-3 rounded-full bg-success/60" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-background rounded-md px-4 py-1 text-xs text-muted-foreground border border-border">
                app.decodeanalytics.com.br/dashboard
              </div>
            </div>
          </div>

          {/* Content */}
          <div
            className="p-4 md:p-6"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <Tabs value={activeTab} onValueChange={handleTabClick}>
              <TabsList className="grid w-full grid-cols-3 mb-1">
                <TabsTrigger value="params" className="text-xs md:text-sm">
                  1. Vaga
                </TabsTrigger>
                <TabsTrigger value="upload" className="text-xs md:text-sm">
                  2. Currículo
                </TabsTrigger>
                <TabsTrigger value="result" className="text-xs md:text-sm">
                  3. Resultado
                </TabsTrigger>
              </TabsList>
              <Progress value={progress} className="h-1 mb-5 [&>div]:transition-none" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {activeTab === "params" && <MockParams />}
                  {activeTab === "upload" && <MockUpload />}
                  {activeTab === "result" && <MockResult />}
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  );
}

function MockParams() {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Cargo</label>
        <div className="mt-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
          Desenvolvedor Full Stack Sênior
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Experiência mínima</label>
        <div className="mt-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
          5 anos
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Habilidades obrigatórias</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"].map((s) => (
            <Badge key={s} variant="secondary">{s}</Badge>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Formação</label>
        <div className="mt-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
          Ciência da Computação ou áreas correlatas
        </div>
      </div>
    </div>
  );
}

function MockUpload() {
  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-primary/5">
        <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Arraste o currículo aqui</p>
        <p className="text-xs text-muted-foreground mt-1">PDF ou DOCX • até 5MB</p>
      </div>
      <Card className="flex items-center gap-3 p-3 border-primary/30 bg-primary/5">
        <FileText className="w-8 h-8 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-foreground">curriculo_joao_silva.pdf</p>
          <p className="text-xs text-muted-foreground">245 KB • Enviado com sucesso</p>
        </div>
        <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
      </Card>
    </div>
  );
}

function MockResult() {
  const skills = [
    { name: "React", match: true },
    { name: "TypeScript", match: true },
    { name: "Node.js", match: true },
    { name: "PostgreSQL", match: false },
    { name: "AWS", match: true },
  ];

  return (
    <div className="space-y-5">
      {/* Score */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-success bg-success/10">
          <span className="font-display text-2xl font-bold text-success">87</span>
        </div>
        <p className="text-sm font-medium mt-2 text-foreground">Score de Compatibilidade</p>
        <Badge className="mt-1 bg-success/10 text-success border-success/20">Recomendado</Badge>
      </div>

      {/* Skills */}
      <div>
        <p className="text-sm font-medium mb-2 text-foreground">Habilidades</p>
        <div className="space-y-2">
          {skills.map((s) => (
            <div key={s.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {s.match ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                <span className="text-foreground">{s.name}</span>
              </div>
              <span className={s.match ? "text-success text-xs" : "text-destructive text-xs"}>
                {s.match ? "Compatível" : "Lacuna"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Extra metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Briefcase, label: "Experiência", value: "6 anos" },
          { icon: GraduationCap, label: "Formação", value: "Compatível" },
          { icon: Code2, label: "Stack", value: "4/5" },
        ].map((m) => (
          <div key={m.label} className="text-center p-3 rounded-lg bg-muted/50">
            <m.icon className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-sm font-semibold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
