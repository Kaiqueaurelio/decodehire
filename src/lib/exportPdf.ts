import jsPDF from "jspdf";

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

export function exportAnalysisPdf(
  result: AnalysisResult,
  jobParams?: JobParameters,
  date?: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  };

  const addTitle = (text: string) => {
    checkPage(14);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(text, margin, y);
    y += 8;
  };

  const addBody = (text: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(text, maxWidth);
    checkPage(lines.length * 5 + 4);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  };

  const addBullets = (items: string[]) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    items.forEach((item) => {
      const lines = doc.splitTextToSize(`• ${item}`, maxWidth - 4);
      checkPage(lines.length * 5 + 2);
      doc.text(lines, margin + 4, y);
      y += lines.length * 5 + 2;
    });
    y += 2;
  };

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("Relatório de Análise de Currículo", margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Gerado em: ${date || new Date().toLocaleDateString("pt-BR")}`, margin, y);
  y += 10;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Score section
  const isCompatible =
    result.classificacao?.toLowerCase().includes("compatível") &&
    !result.classificacao?.toLowerCase().includes("não");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(isCompatible ? 34 : 185, isCompatible ? 139 : 28, isCompatible ? 34 : 28);
  doc.text(`${result.classificacao}  —  ${result.score}/100`, margin, y);
  y += 12;

  // Job parameters
  if (jobParams) {
    addTitle("📋 Parâmetros da Vaga");
    addBody(`Cargo: ${jobParams.cargo}`);
    if (jobParams.descricao) addBody(`Descrição: ${jobParams.descricao}`);
    if (jobParams.experienciaMinima) addBody(`Experiência mínima: ${jobParams.experienciaMinima} anos`);
    if (jobParams.formacao) addBody(`Formação: ${jobParams.formacao}`);
    if (jobParams.certificacoes) addBody(`Certificações: ${jobParams.certificacoes}`);
    if (jobParams.idiomas) addBody(`Idiomas: ${jobParams.idiomas}`);
    y += 4;
  }

  // Resumo
  if (result.resumo) {
    addTitle("👤 Resumo do Perfil");
    addBody(result.resumo);
    y += 4;
  }

  // Habilidades
  if (result.habilidades_compativeis?.length > 0) {
    addTitle("✅ Habilidades Compatíveis");
    addBullets(result.habilidades_compativeis);
  }

  // Experiência
  if (result.experiencia_relevante) {
    addTitle("⭐ Experiência Relevante");
    addBody(result.experiencia_relevante);
    y += 4;
  }

  // Diferenciais
  if (result.diferenciais?.length > 0) {
    addTitle("🌟 Diferenciais");
    addBullets(result.diferenciais);
  }

  // Lacunas
  if (result.lacunas?.length > 0) {
    addTitle("❌ Requisitos Ausentes");
    addBullets(result.lacunas);
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `DecodeHire — Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  const cargo = jobParams?.cargo || "analise";
  doc.save(`analise-${cargo.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
