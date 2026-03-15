import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface AnalysisResult {
  classificacao: string;
  score: number;
  habilidades_compativeis: string[];
  experiencia_relevante: string;
  diferenciais: string[];
  lacunas: string[];
  resumo: string;
}

interface JobParameters {
  cargo: string;
  descricao?: string;
  experienciaMinima?: number;
  formacao?: string;
  certificacoes?: string;
  idiomas?: string;
}

function buildHtml(result: AnalysisResult, jobParams?: JobParameters, date?: string): string {
  const isCompatible =
    result.classificacao?.toLowerCase().includes("compatível") &&
    !result.classificacao?.toLowerCase().includes("não");

  const scoreColor = result.score >= 70 ? "#16a34a" : result.score >= 40 ? "#ca8a04" : "#dc2626";
  const badgeColor = isCompatible ? "#16a34a" : "#dc2626";
  const dateStr = date || new Date().toLocaleDateString("pt-BR");

  const scoreGradient = result.score >= 70
    ? "linear-gradient(90deg, #16a34a, #22c55e)"
    : result.score >= 40
      ? "linear-gradient(90deg, #ca8a04, #eab308)"
      : "linear-gradient(90deg, #dc2626, #ef4444)";

  // Radar-style category scores
  const skills = result.habilidades_compativeis?.length ?? 0;
  const gaps = result.lacunas?.length ?? 0;
  const diffs = result.diferenciais?.length ?? 0;
  const categories = [
    { name: "Habilidades", value: Math.min(skills * 15, 100) },
    { name: "Experiência", value: result.score >= 70 ? 85 : result.score >= 40 ? 55 : 25 },
    { name: "Diferenciais", value: Math.min(diffs * 20, 100) },
    { name: "Aderência", value: Math.max(100 - gaps * 25, 0) },
  ];

  const categoryBars = categories
    .map(
      (c) => `
    <div style="display:flex;align-items:center;gap:8px;margin:6px 0;">
      <span style="font-size:11px;color:#6b7280;width:90px;">${c.name}</span>
      <div style="flex:1;background:#f3f4f6;border-radius:4px;height:8px;overflow:hidden;">
        <div style="height:100%;width:${c.value}%;background:${c.value >= 70 ? '#16a34a' : c.value >= 40 ? '#ca8a04' : '#dc2626'};border-radius:4px;"></div>
      </div>
      <span style="font-size:11px;font-weight:600;color:#374151;width:30px;text-align:right;">${c.value}</span>
    </div>`
    )
    .join("");

  const section = (title: string, content: string) => `
    <div style="margin-bottom:18px;">
      <h3 style="font-size:13px;font-weight:700;color:#1a1a1a;margin:0 0 8px 0;padding-bottom:4px;border-bottom:2px solid #e5e7eb;">${title}</h3>
      ${content}
    </div>`;

  const bullet = (items: string[], color = "#374151") =>
    items.map((item) => `<div style="font-size:11px;color:${color};margin:4px 0;padding-left:12px;">• ${item}</div>`).join("");

  const text = (t: string) => `<p style="font-size:11px;color:#4b5563;line-height:1.7;margin:0;">${t}</p>`;

  let jobSection = "";
  if (jobParams) {
    let details = `<p style="font-size:11px;color:#4b5563;margin:2px 0;"><strong>Cargo:</strong> ${jobParams.cargo}</p>`;
    if (jobParams.descricao) details += `<p style="font-size:11px;color:#4b5563;margin:2px 0;"><strong>Descrição:</strong> ${jobParams.descricao}</p>`;
    if (jobParams.experienciaMinima) details += `<p style="font-size:11px;color:#4b5563;margin:2px 0;"><strong>Experiência mínima:</strong> ${jobParams.experienciaMinima} anos</p>`;
    if (jobParams.formacao) details += `<p style="font-size:11px;color:#4b5563;margin:2px 0;"><strong>Formação:</strong> ${jobParams.formacao}</p>`;
    if (jobParams.certificacoes) details += `<p style="font-size:11px;color:#4b5563;margin:2px 0;"><strong>Certificações:</strong> ${jobParams.certificacoes}</p>`;
    if (jobParams.idiomas) details += `<p style="font-size:11px;color:#4b5563;margin:2px 0;"><strong>Idiomas:</strong> ${jobParams.idiomas}</p>`;
    jobSection = section("Parâmetros da Vaga", details);
  }

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;width:700px;padding:0;background:#fff;color:#1a1a1a;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg, #1e293b 0%, #334155 100%);padding:24px 32px;border-radius:8px 8px 0 0;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h1 style="font-size:20px;font-weight:800;margin:0;color:#fff;letter-spacing:-0.5px;">Decode Analytics</h1>
            <p style="font-size:10px;color:#94a3b8;margin:4px 0 0 0;">Relatório de Análise de Currículo</p>
          </div>
          <div style="text-align:right;">
            <p style="font-size:10px;color:#94a3b8;margin:0;">Gerado em</p>
            <p style="font-size:12px;color:#e2e8f0;font-weight:600;margin:2px 0 0 0;">${dateStr}</p>
          </div>
        </div>
      </div>

      <div style="padding:24px 32px;">
        <!-- Score -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <span style="display:inline-block;padding:6px 18px;border-radius:20px;background:${badgeColor};color:#fff;font-size:12px;font-weight:700;letter-spacing:0.3px;">${result.classificacao}</span>
          <span style="font-size:36px;font-weight:800;color:${scoreColor};letter-spacing:-1px;">${result.score}<span style="font-size:14px;color:#9ca3af;font-weight:400;">/100</span></span>
        </div>

        <!-- Score bar -->
        <div style="background:#f3f4f6;border-radius:6px;height:12px;margin-bottom:24px;overflow:hidden;">
          <div style="height:100%;width:${result.score}%;background:${scoreGradient};border-radius:6px;"></div>
        </div>

        <!-- Category breakdown -->
        ${section("Análise por Categoria", categoryBars)}

        ${jobSection}
        ${result.resumo ? section("Resumo do Perfil", text(result.resumo)) : ""}
        ${result.habilidades_compativeis?.length > 0 ? section("Habilidades Compatíveis", bullet(result.habilidades_compativeis, "#16a34a")) : ""}
        ${result.experiencia_relevante ? section("Experiência Relevante", text(result.experiencia_relevante)) : ""}
        ${result.diferenciais?.length > 0 ? section("Diferenciais", bullet(result.diferenciais, "#2563eb")) : ""}
        ${result.lacunas?.length > 0 ? section("Requisitos Ausentes", bullet(result.lacunas, "#dc2626")) : ""}
      </div>

      <!-- Footer -->
      <div style="border-top:2px solid #e5e7eb;padding:12px 32px;display:flex;justify-content:space-between;align-items:center;">
        <p style="font-size:9px;color:#9ca3af;margin:0;">Decode Analytics — Relatório gerado automaticamente por IA</p>
        <p style="font-size:9px;color:#9ca3af;margin:0;">decodehire.lovable.app</p>
      </div>
    </div>`;
}

function buildComparisonHtml(items: { result: AnalysisResult; jobParams?: JobParameters }[], date?: string): string {
  const dateStr = date || new Date().toLocaleDateString("pt-BR");

  const candidateCards = items
    .map((item, i) => {
      const r = item.result;
      const jp = item.jobParams;
      const isCompatible = r.classificacao?.toLowerCase().includes("compatível") && !r.classificacao?.toLowerCase().includes("não");
      const scoreColor = r.score >= 70 ? "#16a34a" : r.score >= 40 ? "#ca8a04" : "#dc2626";
      const colors = ["#3b82f6", "#16a34a", "#eab308", "#ef4444"];
      const borderColor = colors[i % colors.length];

      return `
        <div style="flex:1;border:2px solid ${borderColor};border-radius:8px;padding:16px;min-width:0;">
          <p style="font-size:13px;font-weight:700;color:${borderColor};margin:0 0 8px 0;">${jp?.cargo || `Candidato ${i + 1}`}</p>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:10px;padding:3px 10px;border-radius:12px;background:${isCompatible ? '#dcfce7' : '#fee2e2'};color:${isCompatible ? '#16a34a' : '#dc2626'};font-weight:600;">${r.classificacao}</span>
            <span style="font-size:24px;font-weight:800;color:${scoreColor};">${r.score}</span>
          </div>
          <div style="background:#f3f4f6;border-radius:4px;height:6px;margin-bottom:12px;overflow:hidden;">
            <div style="height:100%;width:${r.score}%;background:${scoreColor};border-radius:4px;"></div>
          </div>
          ${r.resumo ? `<p style="font-size:10px;color:#6b7280;line-height:1.5;margin:0 0 8px 0;">${r.resumo.substring(0, 150)}...</p>` : ""}
          ${r.habilidades_compativeis?.length > 0 ? `
            <p style="font-size:10px;font-weight:600;color:#374151;margin:8px 0 4px 0;">Habilidades (${r.habilidades_compativeis.length})</p>
            ${r.habilidades_compativeis.slice(0, 5).map((h) => `<span style="display:inline-block;font-size:9px;background:#f0fdf4;color:#16a34a;padding:2px 6px;border-radius:4px;margin:1px 2px;">${h}</span>`).join("")}
          ` : ""}
          ${r.lacunas?.length > 0 ? `
            <p style="font-size:10px;font-weight:600;color:#dc2626;margin:8px 0 4px 0;">Lacunas (${r.lacunas.length})</p>
            ${r.lacunas.slice(0, 3).map((l) => `<div style="font-size:9px;color:#dc2626;margin:2px 0;">✕ ${l}</div>`).join("")}
          ` : ""}
        </div>`;
    })
    .join("");

  // Determine best candidate
  const bestIdx = items.reduce((best, item, i) => (item.result.score > items[best].result.score ? i : best), 0);
  const bestJp = items[bestIdx].jobParams;

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;width:700px;padding:0;background:#fff;color:#1a1a1a;">
      <div style="background:linear-gradient(135deg, #1e293b 0%, #334155 100%);padding:24px 32px;border-radius:8px 8px 0 0;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h1 style="font-size:20px;font-weight:800;margin:0;color:#fff;">Decode Analytics</h1>
            <p style="font-size:10px;color:#94a3b8;margin:4px 0 0 0;">Comparação de Candidatos</p>
          </div>
          <div style="text-align:right;">
            <p style="font-size:10px;color:#94a3b8;margin:0;">Gerado em</p>
            <p style="font-size:12px;color:#e2e8f0;font-weight:600;margin:2px 0 0 0;">${dateStr}</p>
          </div>
        </div>
      </div>
      <div style="padding:24px 32px;">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:8px;">
          <span style="font-size:16px;">🏆</span>
          <span style="font-size:12px;color:#16a34a;font-weight:700;">Melhor candidato: ${bestJp?.cargo || `Candidato ${bestIdx + 1}`} (Score: ${items[bestIdx].result.score}/100)</span>
        </div>
        <div style="display:flex;gap:12px;">
          ${candidateCards}
        </div>
      </div>
      <div style="border-top:2px solid #e5e7eb;padding:12px 32px;display:flex;justify-content:space-between;">
        <p style="font-size:9px;color:#9ca3af;margin:0;">Decode Analytics — Comparação gerada por IA</p>
        <p style="font-size:9px;color:#9ca3af;margin:0;">decodehire.lovable.app</p>
      </div>
    </div>`;
}

async function renderAndSave(html: string, filename: string) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageHeight = 277;

    const doc = new jsPDF("p", "mm", "a4");
    let heightLeft = imgHeight;
    let position = 10;

    doc.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      doc.addPage();
      doc.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    doc.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

export async function exportAnalysisPdf(
  result: AnalysisResult,
  jobParams?: JobParameters,
  date?: string
) {
  const cargo = jobParams?.cargo || "analise";
  const filename = `analise-${cargo.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  await renderAndSave(buildHtml(result, jobParams, date), filename);
}

export async function exportComparisonPdf(
  items: { result: AnalysisResult; jobParams?: JobParameters }[],
  date?: string
) {
  const filename = `comparacao-candidatos-${new Date().toISOString().slice(0, 10)}.pdf`;
  await renderAndSave(buildComparisonHtml(items, date), filename);
}
