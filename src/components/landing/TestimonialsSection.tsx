import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Mariana Costa",
    role: "Head de RH",
    company: "TechBrasil",
    quote:
      "Reduziu nosso tempo de triagem de 3 dias para 30 minutos. A análise por IA identifica padrões que passariam despercebidos na leitura manual.",
    initials: "MC",
    color: "bg-primary/20 text-primary",
  },
  {
    name: "Rafael Mendes",
    role: "Gerente de Recrutamento",
    company: "StartupHub",
    quote:
      "O score de compatibilidade eliminou discussões subjetivas na equipe. Agora temos dados concretos para justificar cada contratação.",
    initials: "RM",
    color: "bg-accent/20 text-accent-foreground",
  },
  {
    name: "Juliana Araújo",
    role: "Diretora de Pessoas",
    company: "Grupo Nova",
    quote:
      "Usamos o Decode Analytics para processos com mais de 200 candidatos. A precisão da IA nos impressionou desde o primeiro dia.",
    initials: "JA",
    color: "bg-secondary text-secondary-foreground",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            O que Nossos Clientes Dizem
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Empresas de todos os tamanhos confiam no Decode Analytics para otimizar seus processos seletivos.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card
              key={t.name}
              className="border-border/50 hover:border-primary/30 transition-all hover-scale relative"
            >
              <CardContent className="pt-8 pb-6">
                <Quote className="w-8 h-8 text-primary/20 absolute top-4 right-4" />
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className={t.color}>{t.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-display font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  "{t.quote}"
                </p>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-primary fill-primary"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
