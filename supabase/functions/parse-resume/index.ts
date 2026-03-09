import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText } = await req.json();
    if (!resumeText) {
      return new Response(JSON.stringify({ error: "Texto do currículo não fornecido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
            content: "Você é um parser de currículos profissional. Analise o texto do currículo e extraia informações estruturadas."
          },
          {
            role: "user",
            content: `Analise o seguinte currículo e estruture os dados:\n\n${resumeText}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_resume",
              description: "Estrutura os dados do currículo em formato padronizado",
              parameters: {
                type: "object",
                properties: {
                  nome_candidato: { type: "string", description: "Nome completo do candidato" },
                  resumo_profissional: { type: "string", description: "Resumo ou objetivo profissional" },
                  experiencias: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        cargo: { type: "string" },
                        empresa: { type: "string" },
                        periodo: { type: "string" },
                        descricao: { type: "string" }
                      },
                      required: ["cargo"],
                      additionalProperties: false
                    }
                  },
                  tempo_experiencia_total: { type: "string", description: "Tempo total estimado de experiência" },
                  habilidades_tecnicas: { type: "array", items: { type: "string" } },
                  habilidades_comportamentais: { type: "array", items: { type: "string" } },
                  formacao_academica: { type: "array", items: { type: "string" } },
                  certificacoes: { type: "array", items: { type: "string" } },
                  idiomas: { type: "array", items: { type: "string" } },
                  ferramentas_tecnologias: { type: "array", items: { type: "string" } },
                  projetos_relevantes: { type: "array", items: { type: "string" } },
                  palavras_chave: { type: "array", items: { type: "string" } }
                },
                required: ["nome_candidato", "habilidades_tecnicas"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "parse_resume" } },
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
      throw new Error("Erro ao processar currículo");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) throw new Error("Resposta inválida da IA");
    
    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-resume error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
