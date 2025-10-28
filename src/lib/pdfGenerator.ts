import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Funcionario, EPI, EPIAtribuicao } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const generateFichaEPI = (
  funcionario: Funcionario,
  funcionarioEPIs: Array<{ epi: EPI; atribuicao: EPIAtribuicao }>
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("CONTROLE DE ENTREGA DE EPI's", pageWidth / 2, 20, { align: 'center' });

  // Informações da empresa (você pode personalizar)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('CASA CARNEIRO E SABOYA ENGENHARIA E ARQUITETURA LTDA', pageWidth / 2, 28, { align: 'center' });
  doc.text('CNPJ: 18.119.973.0001-00', pageWidth / 2, 33, { align: 'center' });

  // Informações do funcionário
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Colaborador:', 14, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(funcionario.nome, 40, 45);

  doc.setFont('helvetica', 'bold');
  doc.text('Função:', 14, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(funcionario.cargo, 40, 52);

  doc.setFont('helvetica', 'bold');
  doc.text('Setor:', 120, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(funcionario.setor, 140, 52);

  doc.setFont('helvetica', 'bold');
  doc.text('CPF:', 120, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(funcionario.cpf, 140, 45);

  const dataAtual = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  doc.setFont('helvetica', 'bold');
  doc.text('Data de abertura:', 14, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(dataAtual, 50, 59);

  // Declaração
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const declaracao = 
    'Declaro sob minha responsabilidade a guarda e conservação dos equipamentos de proteção ' +
    'individual constantes nesta ficha de controle. Declaro ainda estar ciente da ' +
    'obrigatoriedade do uso dos equipamentos ora recebidos das penalidades cabíveis no ' +
    'caso de infração ao Art. 158 da CLT estando sujeito às sanções do ART. 482 (Ato faltoso)';
  
  const splitDeclaracao = doc.splitTextToSize(declaracao, pageWidth - 28);
  doc.text(splitDeclaracao, 14, 70);

  // Tabela de EPIs
  const tableData = funcionarioEPIs.map(({ epi, atribuicao }) => [
    epi.nome,
    epi.ca,
    format(new Date(atribuicao.validade), "dd/MM/yyyy", { locale: ptBR }),
    '' // Assinatura (campo vazio)
  ]);

  autoTable(doc, {
    startY: 90,
    head: [['Descrição do Equipamento', 'CA', 'Data', 'Assinatura']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    bodyStyles: {
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30 },
      3: { cellWidth: 40 },
    },
  });

  // Salvar PDF
  const fileName = `Ficha_EPI_${funcionario.nome.replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
  doc.save(fileName);
};
