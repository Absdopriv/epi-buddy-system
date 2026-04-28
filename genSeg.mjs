import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";

const f = {
  nome:'João da Silva Teste', setor:'Manutenção', empresa:'Casa Carneiro Engenharia',
  ptp:'PTP-001/2026', local:'Subestação SE-12', hora_inicio:'08:00', hora_fim:'17:00',
  atividades:['Trabalho em Altura','Trabalho a Quente'],
  riscos:['Queda de altura','Queimaduras','Risco de incêndio'],
  epis:['Capacete','Cinto Paraquedista','Luva térmica','Óculos de proteção'],
  medidas:['Isolamento da área','Análise Preliminar de Risco','Brigada de Incêndio no local'],
  ass1:'Carlos Mendes', ass2:'Pedro Souza', ass3:'Ana Lima', data:'28/04/2026',
};

const doc = new jsPDF();
const pw = doc.internal.pageSize.getWidth();
doc.setFontSize(16); doc.setFont('helvetica','bold');
doc.text('FORMULÁRIO DE TRABALHO SEGURO', pw/2, 20, { align:'center' });
doc.setFontSize(10); doc.setFont('helvetica','normal');
doc.text(f.empresa, pw/2, 28, { align:'center' });
doc.text(`Data: ${f.data}`, pw/2, 33, { align:'center' });

let y = 45;
const row = (label, val) => {
  doc.setFont('helvetica','bold'); doc.text(label, 14, y);
  doc.setFont('helvetica','normal'); doc.text(String(val||'-'), 60, y);
  y += 7;
};
doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.text('1. Identificação', 14, y); y += 7;
doc.setFontSize(10);
row('Colaborador:', f.nome);
row('Setor:', f.setor);
row('PTP:', f.ptp);
row('Local:', f.local);
row('Horário:', `${f.hora_inicio} às ${f.hora_fim}`);

y += 3;
doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.text('2. Atividades / Riscos / EPIs / Medidas', 14, y); y += 4;

autoTable(doc, {
  startY: y,
  head: [['Categoria', 'Itens']],
  body: [
    ['Atividades', f.atividades.join(', ')],
    ['Riscos identificados', f.riscos.join(', ')],
    ['EPIs sugeridos', f.epis.join(', ')],
    ['Medidas de controle', f.medidas.join(', ')],
  ],
  theme: 'grid',
  styles: { fontSize: 9, cellPadding: 4, valign:'middle' },
  headStyles: { fillColor: [44,62,80], textColor:[255,255,255], fontStyle:'bold' },
  columnStyles: { 0:{cellWidth:50, fontStyle:'bold'}, 1:{cellWidth:130} },
});

y = doc.lastAutoTable.finalY + 12;
doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.text('3. Assinaturas', 14, y); y += 14;
const sig = (x, label, name) => {
  doc.line(x, y, x + 55, y);
  doc.setFontSize(8); doc.setFont('helvetica','normal');
  doc.text(label, x, y + 5);
  doc.setFont('helvetica','bold');
  doc.text(name, x, y - 2);
};
doc.setFontSize(10);
sig(14, 'Responsável da Equipe', f.ass1);
sig(80, 'Responsável do Site', f.ass2);
sig(146, 'Técnico de Segurança', f.ass3);

fs.writeFileSync('/mnt/documents/Formulario_Trabalho_Seguro_Joao.pdf', Buffer.from(doc.output('arraybuffer')));
console.log('OK');
