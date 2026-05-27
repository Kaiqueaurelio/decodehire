import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, jsonResponse, requireUser, sanitizeText } from "../_shared/security.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const cargo = sanitizeText(body.cargo, 160);
    const formacao = sanitizeText(body.formacao, 1000);
    const experienciaMinima = Number(body.experienciaMinima || 0);
    const certificacoes = sanitizeText(body.certificacoes, 1000);
    const idiomas = sanitizeText(body.idiomas, 1000);

    if (!cargo) return jsonResponse({ error: "Informe o cargo" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Gere uma descrição de vaga profissional e completa para o cargo: "${cargo}".
${experienciaMinima ? `Experiência mínima: ${experienciaMinima} anos.` : ""}
${formacao ? `Formação desejada: ${formacao}.` : ""}
${certificacoes ? `Certificações: ${certificacoes}.` : ""}
${idiomas ? `Idiomas: ${idiomas}.` : ""}

A descrição deve conter:
- Resumo da posição (2-3 linhas)
- Responsabilidades principais (5-8 itens)
- Requisitos obrigatórios
- Diferenciais
- Habilidades técnicas e comportamentais

Escreva em português brasileiro, tom profissional. Retorne apenas o texto da descrição, sem título.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um especialista em RH. Gere descrições de vagas profissionais e completas." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "Muitas requisições. Tente novamente." }, 429);
      if (response.status === 402) return jsonResponse({ error: "Créditos insuficientes." }, 402);
      throw new Error("Erro ao gerar descrição");
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || "";
    return jsonResponse({ description });
  } catch (e) {
    console.error("generate-job-description error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});
