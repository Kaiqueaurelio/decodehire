import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { assertCanRunAnalysis, corsHeaders, jsonResponse, requireUser, sanitizeText } from "../_shared/security.ts";

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(normalizeText).join(" ");
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).map(normalizeText).join(" ");
  return String(value);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const limitResponse = await assertCanRunAnalysis(auth.supabase, auth.user.id);
  if (limitResponse) return limitResponse;

  try {
    const { parsedResume, jobParameters } = await req.json();
    if (!parsedResume || !jobParameters) return jsonResponse({ error: "Dados insuficientes" }, 400);

    const safeJobParameters = {
      cargo: sanitizeText(jobParameters.cargo, 160),
      descricao: sanitizeText(jobParameters.descricao, 5000),
      experienciaMinima: Number(jobParameters.experienciaMinima || 0),
      formacao: sanitizeText(jobParameters.formacao, 1000),
      certificacoes: sanitizeText(jobParameters.certificacoes, 1000),
      idiomas: sanitizeText(jobParameters.idiomas, 1000),
    };
    if (!safeJobParameters.cargo) return jsonResponse({ error: "Informe o cargo" }, 400);

    const safeResume = normalizeText(parsedResume).slice(0, 40000);
    if (!safeResume) return jsonResponse({ error: "Currículo inválido" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Compare o currículo estruturado com os parâmetros da vaga e faça uma análise detalhada de compatibilidade.\n\nCURRÍCULO ESTRUTURADO:\n${safeResume}\n\nPARÂMETROS DA VAGA:\n- Cargo: ${safeJobParameters.cargo}\n- Descrição: ${safeJobParameters.descricao || "Não informada"}\n- Experiência mínima: ${safeJobParameters.experienciaMinima} anos\n- Formação: ${safeJobParameters.formacao || "Não especificada"}\n- Certificações: ${safeJobParameters.certificacoes || "Não especificadas"}\n- Idiomas: ${safeJobParameters.idiomas || "Não especificados"}\n\nAnalise compatibilidade de habilidades, experiência, responsabilidades, formação, diferenciais, lacunas e avaliação geral.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um especialista em RH e recrutamento. Avalie a compatibilidade entre currículo e vaga de forma objetiva e detalhada." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_compatibility",
            description: "Retorna a análise de compatibilidade estruturada",
            parameters: {
              type: "object",
              properties: {
                classificacao: { type: "string", enum: ["Perfil Compatível", "Perfil Não Compatível"] },
                score: { type: "integer" },
                habilidades_compativeis: { type: "array", items: { type: "string" } },
                experiencia_relevante: { type: "string" },
                diferenciais: { type: "array", items: { type: "string" } },
                lacunas: { type: "array", items: { type: "string" } },
                resumo: { type: "string" },
              },
              required: ["classificacao", "score", "habilidades_compativeis", "experiencia_relevante", "diferenciais", "lacunas", "resumo"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_compatibility" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "Muitas requisições. Tente novamente." }, 429);
      if (response.status === 402) return jsonResponse({ error: "Créditos insuficientes." }, 402);
      throw new Error("Erro ao analisar currículo");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Resposta inválida da IA");

    return jsonResponse({ result: JSON.parse(toolCall.function.arguments) });
  } catch (e) {
    console.error("analyze-resume error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});
