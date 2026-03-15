import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-8 md:p-14 text-center text-primary-foreground">
          <Sparkles className="w-10 h-10 mx-auto mb-4 opacity-80" />
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Pronto para Encontrar o Candidato Ideal?
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8 text-lg">
            Comece agora mesmo com 5 análises gratuitas por dia. Sem cartão de crédito, sem compromisso.
          </p>
          <Link to="/register">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 text-base px-8 font-semibold"
            >
              Criar Conta Grátis
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
