import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Como a IA analisa os currículos?",
    a: "Nossa IA utiliza modelos de linguagem avançados para extrair informações do currículo e compará-las com os requisitos da vaga. Ela avalia experiência profissional, habilidades técnicas, formação acadêmica e palavras-chave relevantes para gerar um score objetivo de compatibilidade.",
  },
  {
    q: "Quais formatos de arquivo são aceitos?",
    a: "Aceitamos currículos nos formatos PDF e DOCX com tamanho máximo de 5MB. Recomendamos o PDF para melhor extração de texto.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Sim. Todos os dados são criptografados em trânsito e em repouso. Os currículos são processados de forma segura e você pode excluí-los a qualquer momento. Não compartilhamos dados com terceiros.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim, você pode cancelar ou trocar de plano quando quiser. Sem multas, sem burocracia. Seu plano continuará ativo até o final do período já pago.",
  },
  {
    q: "A análise é realmente imparcial?",
    a: "Sim. A IA avalia exclusivamente competências técnicas, experiência e aderência aos requisitos. Ela não tem acesso a fotos, gênero, idade ou qualquer informação que possa gerar vieses.",
  },
];

export default function FAQSection() {
  return (
    <section className="py-20">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-muted-foreground">
            Tire suas dúvidas sobre o Decode Analytics.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm md:text-base">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
