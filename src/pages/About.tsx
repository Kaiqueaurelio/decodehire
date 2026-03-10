import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Code, BarChart3, Rocket, Database, Mail } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/login">
          <Button variant="ghost" size="sm" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </Link>

        <div className="text-center mb-12">
          <img
            src={logo}
            alt="Decode Analytics"
            className="w-24 h-24 rounded-2xl mx-auto mb-6 object-cover shadow-lg"
          />
          <h1 className="font-display text-4xl font-bold text-foreground mb-3">Decode Analytics</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Soluções digitais inteligentes para transformar dados em decisões estratégicas.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                Quem Somos
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                A Decode Analytics é uma empresa focada no desenvolvimento de aplicativos e soluções digitais, 
                criando ferramentas tecnológicas que ajudam empresas a melhorar seus processos e oferecer 
                melhores experiências aos usuários.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                O que Fazemos
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Trabalhamos projetando e desenvolvendo aplicativos personalizados, desde a concepção da ideia 
                até a implementação, utilizando tecnologias modernas e metodologias ágeis. Nosso foco é entregar 
                soluções que realmente resolvam problemas reais do seu negócio.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Inteligência Analítica
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Integramos análise de dados e inteligência analítica aos aplicativos, permitindo que empresas 
                acompanhem métricas, automatizem processos e tomem decisões mais estratégicas com base em dados concretos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Nossa Missão
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Combinamos desenvolvimento de software, criação de aplicativos e análise de dados para entregar 
                soluções digitais eficientes, escaláveis e orientadas por dados. Acreditamos que a tecnologia 
                deve ser acessível e impactante para todos os negócios.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Entre em Contato
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Tem alguma dúvida ou quer saber mais sobre nossos serviços? Fale conosco!
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/contact">
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Página de Contato
                </Button>
              </Link>
              <a href="mailto:Decoanalytics@outlook.com.br">
                <Button variant="ghost" size="sm">
                  Decoanalytics@outlook.com.br
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-12">
          <p className="text-xs text-muted-foreground">
            © 2026 Decode Analytics — Criado por Kaique Aurélio
          </p>
        </div>
      </div>
    </div>
  );
}
