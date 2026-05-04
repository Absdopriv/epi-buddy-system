import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { execSync } from "child_process";
import fs from "fs";

const USER = "346f19f1-ef0e-4249-b98d-03dcdcbfd4d2";
const fmt = (d) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
const q = (sql) => JSON.parse(execSync(`psql -t -A -c "SELECT json_agg(t) FROM (${sql}) t"`,{encoding:"utf8"}).trim() || "null") || [];
async function getEmpresa() {
  const r = q(`SELECT razao_social,cnpj FROM profiles WHERE user_id='${USER}'`);
  return r[0] || {};
}

function fichaEPI(funcionario, items, empresa, outPath) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  doc.setFontSize(16); doc.setFont("helvetica","bold");
  doc.text("CONTROLE DE ENTREGA DE EPI's", w/2, 20, {align:"center"});
  doc.setFontSize(10); doc.setFont("helvetica","normal");
  doc.text((empresa.razao_social||"Empresa não cadastrada").toUpperCase(), w/2, 28, {align:"center"});
  doc.text(`CNPJ: ${empresa.cnpj||"—"}`, w/2, 33, {align:"center"});
  doc.setFont("helvetica","bold"); doc.text("Colaborador:",14,45);
  doc.setFont("helvetica","normal"); doc.text(funcionario.nome,40,45);
  doc.setFont("helvetica","bold"); doc.text("CPF:",120,45);
  doc.setFont("helvetica","normal"); doc.text(funcionario.cpf,140,45);
  doc.setFont("helvetica","bold"); doc.text("Função:",14,52);
  doc.setFont("helvetica","normal"); doc.text(funcionario.cargo,40,52);
  doc.setFont("helvetica","bold"); doc.text("Setor:",120,52);
  doc.setFont("helvetica","normal"); doc.text(funcionario.setor,140,52);
  doc.setFont("helvetica","bold"); doc.text("Data de abertura:",14,59);
  doc.setFont("helvetica","normal"); doc.text(fmt(new Date()),50,59);
  doc.setFontSize(8);
  const decl = "Declaro sob minha responsabilidade a guarda e conservação dos equipamentos de proteção individual constantes nesta ficha de controle. Declaro ainda estar ciente da obrigatoriedade do uso dos equipamentos ora recebidos das penalidades cabíveis no caso de infração ao Art. 158 da CLT estando sujeito às sanções do ART. 482 (Ato faltoso)";
  doc.text(doc.splitTextToSize(decl, w-28), 14, 70);
  autoTable(doc, {
    startY: 90,
    head: [["Descrição do Equipamento","CA","Data Validade","Assinatura"]],
    body: items.map(i=>[i.nome,i.ca,fmt(i.validade),""]),
    theme: "grid", styles: { fontSize:9, cellPadding:3 },
    headStyles: { fillColor:[255,255,255], textColor:[0,0,0], fontStyle:"bold", lineWidth:0.5, lineColor:[0,0,0]},
  });
  fs.writeFileSync(outPath, Buffer.from(doc.output("arraybuffer")));
}

function asoPdf(empresa, funcionario, aso, exames, outPath) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  doc.setFontSize(16); doc.setFont("helvetica","bold");
  doc.text("ATESTADO DE SAÚDE OCUPACIONAL (ASO)", w/2, 20, {align:"center"});
  doc.setFontSize(10); doc.setFont("helvetica","normal");
  doc.text((empresa.razao_social||"—").toUpperCase(), w/2, 28, {align:"center"});
  doc.text(`CNPJ: ${empresa.cnpj||"—"}`, w/2, 33, {align:"center"});
  doc.setFont("helvetica","bold"); doc.text("Colaborador:",14,45);
  doc.setFont("helvetica","normal"); doc.text(funcionario.nome,40,45);
  doc.setFont("helvetica","bold"); doc.text("CPF:",120,45);
  doc.setFont("helvetica","normal"); doc.text(funcionario.cpf,135,45);
  doc.setFont("helvetica","bold"); doc.text("Função:",14,52);
  doc.setFont("helvetica","normal"); doc.text(funcionario.cargo,40,52);
  doc.setFont("helvetica","bold"); doc.text("Setor:",120,52);
  doc.setFont("helvetica","normal"); doc.text(funcionario.setor,135,52);
  doc.setFont("helvetica","bold"); doc.text("Tipo:",14,59);
  doc.setFont("helvetica","normal"); doc.text(aso.tipo_exame,40,59);
  doc.setFont("helvetica","bold"); doc.text("Emissão:",14,66);
  doc.setFont("helvetica","normal"); doc.text(fmt(aso.data_emissao),40,66);
  doc.setFont("helvetica","bold"); doc.text("Próximo:",120,66);
  doc.setFont("helvetica","normal"); doc.text(fmt(aso.proximo_aso),150,66);
  autoTable(doc, {
    startY: 75,
    head: [["Exame","Tipo","Data","Resultado"]],
    body: exames.map(e=>[e.nome,e.tipo,fmt(e.data_realizacao),e.resultado||"—"]),
    theme: "grid", styles:{fontSize:9,cellPadding:3},
    headStyles:{fillColor:[44,62,80],textColor:[255,255,255],fontStyle:"bold"},
  });
  const y = doc.lastAutoTable.finalY+10;
  doc.setFontSize(11); doc.setFont("helvetica","bold");
  doc.text(`CONCLUSÃO: ${aso.aptidao}`, 14, y);
  if (aso.restricoes) {
    doc.setFontSize(9); doc.setFont("helvetica","normal");
    doc.text(doc.splitTextToSize(`Restrições: ${aso.restricoes}`, w-28), 14, y+7);
  }
  doc.line(w/2-60, y+40, w/2+60, y+40);
  doc.setFontSize(9);
  doc.text(aso.medico_responsavel||"Médico Responsável", w/2, y+45, {align:"center"});
  doc.text(`CRM: ${aso.crm_medico||"—"}`, w/2, y+50, {align:"center"});
  fs.writeFileSync(outPath, Buffer.from(doc.output("arraybuffer")));
}

const empresa = await getEmpresa();
const funcs = q(`SELECT * FROM funcionarios WHERE user_id='${USER}' ORDER BY nome`);
const atribs = q(`SELECT * FROM epi_atribuicoes WHERE user_id='${USER}'`);
const epis = q(`SELECT * FROM epis WHERE user_id='${USER}'`);
const asos = q(`SELECT * FROM asos WHERE user_id='${USER}'`);
const ef = q(`SELECT * FROM exames_funcionario WHERE user_id='${USER}'`);
const exOcup = q(`SELECT * FROM exames_ocupacionais WHERE user_id='${USER}'`);

fs.mkdirSync("/mnt/documents/teste-pdfs", { recursive: true });

let countFicha=0, countAso=0;
for (const f of funcs) {
  const items = atribs.filter(a=>a.funcionario_id===f.id).map(a=>{
    const e = epis.find(x=>x.id===a.epi_id);
    return e ? {nome:e.nome,ca:e.ca,validade:a.validade} : null;
  }).filter(Boolean);
  if (items.length) {
    fichaEPI(f, items, empresa, `/mnt/documents/teste-pdfs/Ficha_EPI_${f.nome.replace(/\s+/g,"_")}.pdf`);
    countFicha++;
  }
  const fAsos = asos.filter(a=>a.funcionario_id===f.id);
  for (const aso of fAsos) {
    const exFunc = ef.filter(x=>x.funcionario_id===f.id);
    const exames = exFunc.map(x=>{
      const o = exOcup.find(o=>o.id===x.exame_id);
      return o ? {nome:o.nome, tipo:o.tipo, data_realizacao:x.data_realizacao, resultado:x.resultado}: null;
    }).filter(Boolean);
    asoPdf(empresa, f, aso, exames, `/mnt/documents/teste-pdfs/ASO_${f.nome.replace(/\s+/g,"_")}_${aso.tipo_exame}_${aso.data_emissao}.pdf`);
    countAso++;
  }
}
console.log(`Fichas EPI: ${countFicha} | ASOs: ${countAso} | Funcionários: ${funcs.length}`);
