import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  FileText,
  Zap,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle2,
  Upload,
  Brain,
  TrendingUp,
} from "lucide-react";
import logo from "@/assets/logo.jpeg";
import AppDemo from "@/components/landing/AppDemo";
import StatsSection from "@/components/landing/StatsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import ScrollReveal from "@/components/landing/ScrollReveal";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";

const benefits = [
  {
    icon: Zap,
    title: "Análise em Segundos",
    description: "IA avançada avalia currículos em segundos, não em horas. Economize tempo da sua equipe de RH.",
  },
  {
    icon: BarChart3,
    title: "Score de Compatibilidade",
    description: "Pontuação objetiva de 0 a 100 baseada nos requisitos da vaga. Decisões por dados, não intuição.",
  },
  {
    icon: Shield,
    title: "Análise Imparcial",
    description: "Elimine vieses inconscientes. A IA avalia competências técnicas e experiência de forma objetiva.",
  },
  {
    icon: FileText,
    title: "Relatórios Detalhados",
    description: "Habilidades compatíveis, lacunas, diferenciais e resumo executivo. Tudo exportável em PDF.",
  },
];

const steps = [
  { icon: Upload, step: "01", title: "Defina a Vaga", description: "Configure o cargo, requisitos, experiência e habilidades necessárias." },
  { icon: FileText, step: "02", title: "Envie o Currículo", description: "Faça upload do PDF ou DOCX do candidato." },
  { icon: Brain, step: "03", title: "IA Analisa", description: "Nossa IA compara o currículo com os requisitos da vaga em segundos." },
  { icon: TrendingUp, step: "04", title: "Resultado Completo", description: "Receba score, habilidades compatíveis, lacunas e recomendação final." },
];

const plans = [
  { name: "Gratuito", price: "R$ 0", analyses: "5 análises/dia", highlight: false },
  { name: "Starter", price: "R$ 29", analyses: "15 análises/dia", highlight: false },
  { name: "Pro", price: "R$ 79", analyses: "50 análises/dia", highlight: true },
  { name: "Business", price: "R$ 199", analyses: "Ilimitado", highlight: false },
];

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Decode Analytics" className="w-9 h-9 rounded-lg object-cover" />
            <span className="font-display font-bold text-lg">Decode Analytics</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Geometric */}
      <section className="relative">
        <HeroGeometric
          badge="Powered by AI"
          title1="Análise de Currículos"
          title2="com Inteligência Artificial"
        />
        {/* CTA overlay on top of hero */}
        <div className="absolute bottom-12 md:bottom-16 left-0 right-0 z-20">
          <motion.div
            className="flex flex-col items-center gap-4 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <p className="text-white/50 text-sm md:text-base text-center max-w-xl">
              Encontre o candidato ideal em segundos. Score de compatibilidade objetivo e detalhado.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/register">
                <Button size="lg" className="gap-2 text-base px-8">
                  Começar Gratuitamente
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg" className="text-base px-8 border-white/20 text-white hover:bg-white/10 hover:text-white">
                  Saiba Mais
                </Button>
              </Link>
            </div>
            <p className="text-white/30 text-xs">5 análises grátis por dia • Sem cartão de crédito</p>
          </motion.div>
        </div>
      </section>

      <ScrollReveal>
        <StatsSection />
      </ScrollReveal>

      <ScrollReveal>
        <TestimonialsSection />
      </ScrollReveal>

      {/* Benefits */}
      <ScrollReveal>
        <section className="py-20 bg-card/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Por que usar o Decode Analytics?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Transforme seu processo seletivo com análises inteligentes e imparciais.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className="border-border/50 hover:border-primary/30 hover-scale transition-all h-full">
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <b.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-display font-semibold text-lg mb-2">{b.title}</h3>
                      <p className="text-sm text-muted-foreground">{b.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <AppDemo />
      </ScrollReveal>

      {/* How it works */}
      <ScrollReveal>
        <section className="py-20 bg-card/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Como Funciona
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Em 4 passos simples, você obtém uma análise completa de compatibilidade.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((s, i) => (
                <motion.div
                  key={s.step}
                  className="text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-primary tracking-widest uppercase">Passo {s.step}</span>
                  <h3 className="font-display font-semibold text-lg mt-2 mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Plans preview */}
      <ScrollReveal>
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Planos para Todos os Tamanhos
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Comece grátis e escale conforme sua demanda cresce.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <Card className={`text-center hover-scale transition-all h-full ${p.highlight ? "border-primary ring-2 ring-primary/20" : "border-border/50"}`}>
                    <CardContent className="pt-6">
                      {p.highlight && (
                        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full mb-3 inline-block">
                          Popular
                        </span>
                      )}
                      <h3 className="font-display font-bold text-lg">{p.name}</h3>
                      <p className="font-display text-2xl font-bold mt-2 mb-1">{p.price}</p>
                      <p className="text-xs text-muted-foreground mb-4">/mês</p>
                      <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        {p.analyses}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <FAQSection />
      </ScrollReveal>

      <ScrollReveal>
        <CTASection />
      </ScrollReveal>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground space-y-2">
          <div className="flex justify-center gap-4">
            <Link to="/about" className="hover:text-primary transition-colors">Sobre nós</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-primary transition-colors">Termos de uso</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-primary transition-colors">Contato</Link>
          </div>
          <p>© 2026 Decode Analytics — Criado por Kaique Aurélio</p>
        </div>
      </footer>
    </div>
  );
}
