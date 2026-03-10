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

  const section = (title: string, content: string) => `
    <div style="margin-bottom:16px;">
      <h3 style="font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 8px 0;padding-bottom:4px;border-bottom:1px solid #e5e5e5;">${title}</h3>
      ${content}
    </div>`;

  const bullet = (items: string[], color = "#374151") =>
    items.map(item => `<div style="font-size:12px;color:${color};margin:4px 0;padding-left:12px;">• ${item}</div>`).join("");

  const text = (t: string) => `<p style="font-size:12px;color:#4b5563;line-height:1.6;margin:0;">${t}</p>`;

  let jobSection = "";
  if (jobParams) {
    let details = `<p style="font-size:12px;color:#4b5563;margin:2px 0;"><strong>Cargo:</strong> ${jobParams.cargo}</p>`;
    if (jobParams.descricao) details += `<p style="font-size:12px;color:#4b5563;margin:2px 0;"><strong>Descricao:</strong> ${jobParams.descricao}</p>`;
    if (jobParams.experienciaMinima) details += `<p style="font-size:12px;color:#4b5563;margin:2px 0;"><strong>Experiencia minima:</strong> ${jobParams.experienciaMinima} anos</p>`;
    if (jobParams.formacao) details += `<p style="font-size:12px;color:#4b5563;margin:2px 0;"><strong>Formacao:</strong> ${jobParams.formacao}</p>`;
    if (jobParams.certificacoes) details += `<p style="font-size:12px;color:#4b5563;margin:2px 0;"><strong>Certificacoes:</strong> ${jobParams.certificacoes}</p>`;
    if (jobParams.idiomas) details += `<p style="font-size:12px;color:#4b5563;margin:2px 0;"><strong>Idiomas:</strong> ${jobParams.idiomas}</p>`;
    jobSection = section("Parametros da Vaga", details);
  }

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;width:700px;padding:32px;background:#fff;color:#1a1a1a;">
      <h1 style="font-size:22px;font-weight:800;margin:0 0 4px 0;color:#111;">Relatorio de Analise de Curriculo</h1>
      <p style="font-size:11px;color:#999;margin:0 0 16px 0;">Gerado em: ${dateStr}</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:0 0 20px 0;">

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <span style="display:inline-block;padding:6px 16px;border-radius:6px;background:${badgeColor};color:#fff;font-size:13px;font-weight:700;">${result.classificacao}</span>
        <span style="font-size:32px;font-weight:800;color:${scoreColor};">${result.score}<span style="font-size:16px;color:#999;">/100</span></span>
      </div>

      <div style="background:#f3f4f6;border-radius:8px;height:10px;margin-bottom:24px;overflow:hidden;">
        <div style="height:100%;width:${result.score}%;background:${scoreColor};border-radius:8px;"></div>
      </div>

      ${jobSection}
      ${result.resumo ? section("Resumo do Perfil", text(result.resumo)) : ""}
      ${result.habilidades_compativeis?.length > 0 ? section("Habilidades Compativeis", bullet(result.habilidades_compativeis, "#16a34a")) : ""}
      ${result.experiencia_relevante ? section("Experiencia Relevante", text(result.experiencia_relevante)) : ""}
      ${result.diferenciais?.length > 0 ? section("Diferenciais", bullet(result.diferenciais, "#2563eb")) : ""}
      ${result.lacunas?.length > 0 ? section("Requisitos Ausentes", bullet(result.lacunas, "#dc2626")) : ""}

      <hr style="border:none;border-top:1px solid #eee;margin:24px 0 8px 0;">
      <p style="font-size:9px;color:#bbb;text-align:center;margin:0;">DecodeHire — Relatorio gerado automaticamente</p>
    </div>`;
}

export async function exportAnalysisPdf(
  result: AnalysisResult,
  jobParams?: JobParameters,
  date?: string
) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.innerHTML = buildHtml(result, jobParams, date);
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

    const cargo = jobParams?.cargo || "analise";
    doc.save(`analise-${cargo.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
