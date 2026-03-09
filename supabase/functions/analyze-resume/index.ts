import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { parsedResume, jobParameters } = await req.json();
    if (!parsedResume || !jobParameters) {
      return new Response(JSON.stringify({ error: "Dados insuficientes" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Compare o currículo estruturado com os parâmetros da vaga e faça uma análise detalhada de compatibilidade.

CURRÍCULO ESTRUTURADO:
${JSON.stringify(parsedResume, null, 2)}

PARÂMETROS DA VAGA:
- Cargo: ${jobParameters.cargo}
- Área: ${jobParameters.area}
- Habilidades obrigatórias: ${jobParameters.habilidadesObrigatorias}
- Habilidades desejáveis: ${jobParameters.habilidadesDesejaveis}
- Experiência mínima: ${jobParameters.experienciaMinima} anos
- Responsabilidades: ${jobParameters.responsabilidades}
- Formação: ${jobParameters.formacao}
- Certificações: ${jobParameters.certificacoes}
- Idiomas: ${jobParameters.idiomas}
- Palavras-chave: ${jobParameters.palavrasChave}

Analise:
1. Compatibilidade de habilidades
2. Compatibilidade de experiência
3. Compatibilidade de responsabilidades
4. Compatibilidade de formação
5. Diferenciais do candidato
6. Lacunas identificadas
7. Avaliação geral`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em RH e recrutamento. Avalie a compatibilidade entre currículo e vaga de forma objetiva e detalhada."
          },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_compatibility",
              description: "Retorna a análise de compatibilidade estruturada",
              parameters: {
                type: "object",
                properties: {
                  classificacao: {
                    type: "string",
                    enum: ["Perfil Compatível", "Perfil Não Compatível"],
                    description: "Classificação geral"
                  },
                  score: {
                    type: "integer",
                    description: "Score de compatibilidade de 0 a 100"
                  },
                  habilidades_compativeis: {
                    type: "array",
                    items: { type: "string" },
                    description: "Habilidades do candidato que são compatíveis com a vaga"
                  },
                  experiencia_relevante: {
                    type: "string",
                    description: "Resumo da experiência relevante"
                  },
                  diferenciais: {
                    type: "array",
                    items: { type: "string" },
                    description: "Diferenciais do candidato"
                  },
                  lacunas: {
                    type: "array",
                    items: { type: "string" },
                    description: "Requisitos da vaga não atendidos"
                  },
                  resumo: {
                    type: "string",
                    description: "Resumo interpretado do perfil profissional do candidato"
                  }
                },
                required: ["classificacao", "score", "habilidades_compativeis", "experiencia_relevante", "diferenciais", "lacunas", "resumo"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_compatibility" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Erro ao analisar currículo");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) throw new Error("Resposta inválida da IA");
    
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-resume error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
