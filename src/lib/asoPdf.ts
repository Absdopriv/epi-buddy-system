import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ASOPdfData {
  empresa: { razao_social?: string | null; cnpj?: string | null };
  funcionario: { nome: string; cpf: string; cargo: string; setor: string; data_admissao?: string | null };
  aso: {
    tipo_exame: string;
    data_emissao: string;
    aptidao: string;
    restricoes?: string | null;
    proximo_aso?: string | null;
    medico_responsavel?: string | null;
    crm_medico?: string | null;
  };
  exames: Array<{ nome: string; tipo: string; data_realizacao?: string | null; resultado?: string | null }>;
}

export const generateASOPdf = (data: ASOPdfData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const fmt = (d?: string | null) => (d ? format(new Date(d), "dd/MM/yyyy", { locale: ptBR }) : "—");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ATESTADO DE SAÚDE OCUPACIONAL (ASO)", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text((data.empresa.razao_social || "Empresa não cadastrada").toUpperCase(), pageWidth / 2, 28, { align: "center" });
  doc.text(`CNPJ: ${data.empresa.cnpj || "Não cadastrado"}`, pageWidth / 2, 33, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold"); doc.text("Colaborador:", 14, 45);
  doc.setFont("helvetica", "normal"); doc.text(data.funcionario.nome, 40, 45);
  doc.setFont("helvetica", "bold"); doc.text("CPF:", 120, 45);
  doc.setFont("helvetica", "normal"); doc.text(data.funcionario.cpf, 135, 45);

  doc.setFont("helvetica", "bold"); doc.text("Função:", 14, 52);
  doc.setFont("helvetica", "normal"); doc.text(data.funcionario.cargo, 40, 52);
  doc.setFont("helvetica", "bold"); doc.text("Setor:", 120, 52);
  doc.setFont("helvetica", "normal"); doc.text(data.funcionario.setor, 135, 52);

  doc.setFont("helvetica", "bold"); doc.text("Admissão:", 14, 59);
  doc.setFont("helvetica", "normal"); doc.text(fmt(data.funcionario.data_admissao), 40, 59);
  doc.setFont("helvetica", "bold"); doc.text("Tipo de Exame:", 120, 59);
  doc.setFont("helvetica", "normal"); doc.text(data.aso.tipo_exame, 150, 59);

  doc.setFont("helvetica", "bold"); doc.text("Data de Emissão:", 14, 66);
  doc.setFont("helvetica", "normal"); doc.text(fmt(data.aso.data_emissao), 50, 66);
  doc.setFont("helvetica", "bold"); doc.text("Próximo ASO:", 120, 66);
  doc.setFont("helvetica", "normal"); doc.text(fmt(data.aso.proximo_aso), 150, 66);

  autoTable(doc, {
    startY: 75,
    head: [["Exame Realizado", "Tipo", "Data", "Resultado"]],
    body: data.exames.map((e) => [e.nome, e.tipo, fmt(e.data_realizacao), e.resultado || "—"]),
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: "bold" },
  });

  // @ts-ignore
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`CONCLUSÃO: ${data.aso.aptidao}`, 14, finalY);

  if (data.aso.restricoes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const splitR = doc.splitTextToSize(`Restrições: ${data.aso.restricoes}`, pageWidth - 28);
    doc.text(splitR, 14, finalY + 7);
  }

  const sigY = finalY + 40;
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 60, sigY, pageWidth / 2 + 60, sigY);
  doc.setFontSize(9);
  doc.text(data.aso.medico_responsavel || "Médico Responsável", pageWidth / 2, sigY + 5, { align: "center" });
  doc.text(`CRM: ${data.aso.crm_medico || "—"}`, pageWidth / 2, sigY + 10, { align: "center" });

  doc.save(`ASO_${data.funcionario.nome.replace(/\s+/g, "_")}_${format(new Date(), "dd-MM-yyyy")}.pdf`);
};
