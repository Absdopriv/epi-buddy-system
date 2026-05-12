import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, Stethoscope, Briefcase, AlertTriangle, ClipboardList, FileCheck2, Bell,
  Plus, Trash2, FileText, CheckCircle2, Clock, XCircle, Send, Activity,
  LayoutDashboard, Users, CalendarClock, Printer, ShieldCheck,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { format, addMonths, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { generateASOPdf } from "@/lib/asoPdf";
import * as api from "@/lib/admissionalApi";
import type { BkCargo, BkRisco, BkExameOcupacional, BkFuncionario, BkExameFuncionario, BkAlerta } from "@/lib/admissionalApi";

// ---- frontend display types ----
type Cargo = { id: string; nome: string; descricao: string | null };
type Risco = { id: string; descricao: string; nivel: string; tipo: string | null };
type ExameOcup = { id: string; nome: string; tipo: string; periodicidade_meses: number };
type Funcionario = { id: string; nome: string; cpf: string; cargo: string; setor: string; cargo_id: string | null; data_admissao: string | null };
type ExameFunc = {
  id: string; funcionario_id: string; exame_id: string; tipo_exame: string;
  data_realizacao: string | null; data_vencimento: string | null;
  resultado: string | null; situacao: string;
  medico_responsavel: string | null; crm_medico: string | null; observacoes: string | null;
};
type Alerta = {
  id: string; funcionario_id: string | null; exame_funcionario_id: string | null;
  data_vencimento: string | null; dias_para_vencer: number | null; nivel: string;
  mensagem: string | null; resolvido: boolean; created_at: string;
};

// ---- mappers backend → frontend ----
function mapCargo(b: BkCargo): Cargo {
  return { id: String(b.id), nome: b.nome, descricao: b.descricaoAtividades || null };
}
function mapRisco(b: BkRisco): Risco {
  return { id: String(b.id), descricao: b.descricao, nivel: b.nivel, tipo: b.tipo || null };
}
function mapExame(b: BkExameOcupacional): ExameOcup {
  return { id: String(b.id), nome: b.nome, tipo: b.tipo, periodicidade_meses: b.periodicidadeMeses };
}
function mapFuncionario(b: BkFuncionario, cargos: BkCargo[]): Funcionario {
  const cargo = cargos.find(c => c.id === b.id_cargo);
  return {
    id: String(b.id),
    nome: b.nome,
    cpf: b.matricula,
    cargo: cargo?.nome || "",
    setor: "",
    cargo_id: b.id_cargo ? String(b.id_cargo) : null,
    data_admissao: b.dataAdmissao || null,
  };
}
function mapExameFunc(b: BkExameFuncionario): ExameFunc {
  return {
    id: String(b.id),
    funcionario_id: String(b.id_funcionario),
    exame_id: String(b.id_exame_ocupacional),
    tipo_exame: b.tipo_exame || "Admissional",
    data_realizacao: b.dataRealizacao || null,
    data_vencimento: b.dataVencimento || null,
    resultado: b.resultado || null,
    situacao: b.situacao || "PENDENTE",
    medico_responsavel: b.medicoResponsavel || null,
    crm_medico: b.crmMedico || null,
    observacoes: b.observacoes || null,
  };
}
function mapAlerta(b: BkAlerta): Alerta {
  return {
    id: String(b.id),
    funcionario_id: b.id_funcionario ? String(b.id_funcionario) : null,
    exame_funcionario_id: null,
    data_vencimento: b.dataVencimento || null,
    dias_para_vencer: b.diasParaVencer ?? null,
    nivel: b.nivel,
    mensagem: b.mensagem ?? null,
    resolvido: Boolean(b.resolvido),
    created_at: new Date().toISOString(),
  };
}

const fmt = (d?: string | null) => (d ? format(new Date(d), "dd/MM/yyyy", { locale: ptBR }) : "—");

const ExameAdmissional = () => {
  const navigate = useNavigate();
  const [empresaNome, setEmpresaNome] = useState("Sua Empresa");

  // display state
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [riscos, setRiscos] = useState<Risco[]>([]);
  const [exames, setExames] = useState<ExameOcup[]>([]);
  const [cargoRiscos, setCargoRiscos] = useState<{ cargo_id: string; risco_id: string }[]>([]);
  const [riscoExames, setRiscoExames] = useState<{ risco_id: string; exame_id: string }[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [examesFunc, setExamesFunc] = useState<ExameFunc[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [empresa, setEmpresa] = useState<{ razao_social: string | null; cnpj: string | null }>({ razao_social: null, cnpj: null });

  // raw backend state (needed for full-object PUT calls)
  const [bkRiscos, setBkRiscos] = useState<BkRisco[]>([]);
  const [bkExames, setBkExames] = useState<BkExameOcupacional[]>([]);
  const [bkFuncionarios, setBkFuncionarios] = useState<BkFuncionario[]>([]);
  const [bkCargos, setBkCargos] = useState<BkCargo[]>([]);

  // forms
  const [novoCargo, setNovoCargo] = useState({ nome: "", descricao: "" });
  const [novoRisco, setNovoRisco] = useState({ descricao: "", nivel: "medio", tipo: "" });
  const [novoExame, setNovoExame] = useState({ nome: "", tipo: "Clínico", periodicidade_meses: 12 });

  const [vincCargo, setVincCargo] = useState<string>("");
  const [vincRisco, setVincRisco] = useState<string>("");
  const [vincRiscoEx, setVincRiscoEx] = useState<string>("");
  const [vincExameEx, setVincExameEx] = useState<string>("");

  const [funcSelecionado, setFuncSelecionado] = useState<string>("");
  const [riscoParaFunc, setRiscoParaFunc] = useState<string>("");

  const [filtros, setFiltros] = useState({ funcionario: "", situacao: "TODOS", cargo: "TODOS" });
  const [registrar, setRegistrar] = useState<ExameFunc | null>(null);
  const [regForm, setRegForm] = useState({ data_realizacao: "", resultado: "APTO", medico_responsavel: "", crm_medico: "", observacoes: "" });

  // helpers para derivar joins a partir das FKs do backend
  const deriveJoins = (bkR: BkRisco[], bkE: BkExameOcupacional[]) => {
    const cr = bkR
      .filter(r => r.id_cargo != null)
      .map(r => ({ cargo_id: String(r.id_cargo), risco_id: String(r.id) }));
    const re = bkE
      .filter(e => e.id_risco_ocupacional != null)
      .map(e => ({ risco_id: String(e.id_risco_ocupacional), exame_id: String(e.id) }));
    return { cr, re };
  };

  const fetchAll = async () => {
    try {
      const [empresas, bkC, bkR, bkE, bkF, bkEF, bkAl] = await Promise.all([
        api.listarEmpresas(),
        api.listarCargos(),
        api.listarRiscos(),
        api.listarExamesOcupacionais(),
        api.listarFuncionarios(),
        api.listarExamesFuncionario(),
        api.listarAlertas(),
      ]);

      const emp = empresas[0];
      if (emp) {
        setEmpresa({ razao_social: emp.razaoSocial, cnpj: emp.cnpj });
        setEmpresaNome(emp.razaoSocial || "Sua Empresa");
      }

      setBkCargos(bkC);
      setBkRiscos(bkR);
      setBkExames(bkE);
      setBkFuncionarios(bkF);

      setCargos(bkC.map(mapCargo));
      setRiscos(bkR.map(mapRisco));
      setExames(bkE.map(mapExame));
      setFuncionarios(bkF.map(f => mapFuncionario(f, bkC)));
      setExamesFunc(bkEF.map(mapExameFunc));
      setAlertas(bkAl.map(mapAlerta));

      const { cr, re } = deriveJoins(bkR, bkE);
      setCargoRiscos(cr);
      setRiscoExames(re);
    } catch (err) {
      toast.error("Erro ao conectar com o servidor. Verifique se o backend está rodando na porta 3000.");
    }
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, []);

  // auto-alertas para exames vencidos/pendentes
  useEffect(() => {
    if (examesFunc.length === 0) return;
    (async () => {
      const hoje = new Date();
      for (const e of examesFunc) {
        let nivel = ""; let mensagem = ""; let dias = 0;
        if (e.situacao === "PENDENTE") {
          nivel = "WARN"; mensagem = "Exame admissional pendente";
        } else if (e.data_vencimento) {
          dias = differenceInDays(new Date(e.data_vencimento), hoje);
          if (dias < 0) { nivel = "CRITICO"; mensagem = `Exame vencido há ${Math.abs(dias)} dias`; }
          else if (dias <= 30) { nivel = "WARN"; mensagem = `Exame vence em ${dias} dias`; }
        }
        if (nivel) {
          const jaTem = alertas.some(
            a => a.funcionario_id === e.funcionario_id && !a.resolvido &&
              a.mensagem === mensagem
          );
          if (!jaTem) {
            try {
              const novoAl = await api.criarAlerta({
                dataVencimento: e.data_vencimento || new Date().toISOString().split("T")[0],
                diasParaVencer: dias,
                nivel,
                id_funcionario: parseInt(e.funcionario_id),
                id_exame_ocupacional: parseInt(e.exame_id),
                mensagem,
              });
              setAlertas(prev => [mapAlerta(novoAl), ...prev]);
            } catch (_) { /* ignore duplicate alert errors */ }
          }
        }
      }
    })();
    // eslint-disable-next-line
  }, [examesFunc.length]);

  // ---- CRUD cargos ----
  const addCargo = async () => {
    if (!novoCargo.nome.trim()) return;
    try {
      const data = await api.criarCargo({ nome: novoCargo.nome, descricao: novoCargo.descricao });
      setBkCargos(prev => [...prev, data]);
      setCargos(prev => [...prev, mapCargo(data)]);
      setNovoCargo({ nome: "", descricao: "" });
      toast.success("Cargo cadastrado");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao criar cargo"); }
  };
  const delCargo = async (id: string) => {
    try {
      await api.deletarCargo(parseInt(id));
      setBkCargos(prev => prev.filter(c => String(c.id) !== id));
      setCargos(prev => prev.filter(c => c.id !== id));
      toast.success("Removido");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao remover cargo"); }
  };

  // ---- CRUD riscos ----
  const addRisco = async () => {
    if (!novoRisco.descricao.trim()) return;
    try {
      const data = await api.criarRisco({ descricao: novoRisco.descricao, nivel: novoRisco.nivel, tipo: novoRisco.tipo });
      setBkRiscos(prev => { const next = [...prev, data]; const { cr } = deriveJoins(next, bkExames); setCargoRiscos(cr); return next; });
      setRiscos(prev => [...prev, mapRisco(data)]);
      setNovoRisco({ descricao: "", nivel: "medio", tipo: "" });
      toast.success("Risco cadastrado");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao criar risco"); }
  };
  const delRisco = async (id: string) => {
    try {
      await api.deletarRisco(parseInt(id));
      setBkRiscos(prev => { const next = prev.filter(r => String(r.id) !== id); const { cr } = deriveJoins(next, bkExames); setCargoRiscos(cr); return next; });
      setRiscos(prev => prev.filter(r => r.id !== id));
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao remover risco"); }
  };

  // ---- CRUD exames ocupacionais ----
  const addExame = async () => {
    if (!novoExame.nome.trim()) return;
    try {
      const data = await api.criarExameOcupacional({ nome: novoExame.nome, tipo: novoExame.tipo, periodicidade_meses: novoExame.periodicidade_meses });
      setBkExames(prev => { const next = [...prev, data]; const { re } = deriveJoins(bkRiscos, next); setRiscoExames(re); return next; });
      setExames(prev => [...prev, mapExame(data)]);
      setNovoExame({ nome: "", tipo: "Clínico", periodicidade_meses: 12 });
      toast.success("Exame cadastrado");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao criar exame"); }
  };
  const delExame = async (id: string) => {
    try {
      await api.deletarExameOcupacional(parseInt(id));
      setBkExames(prev => { const next = prev.filter(e => String(e.id) !== id); const { re } = deriveJoins(bkRiscos, next); setRiscoExames(re); return next; });
      setExames(prev => prev.filter(e => e.id !== id));
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao remover exame"); }
  };

  // ---- Vincular cargo ↔ risco (atualiza FK id_cargo no risco) ----
  const vincularCargoRisco = async () => {
    if (!vincCargo || !vincRisco) return;
    const bkR = bkRiscos.find(r => String(r.id) === vincRisco);
    if (!bkR) return;
    try {
      await api.atualizarRisco(bkR.id, { ...bkR, id_cargo: parseInt(vincCargo) });
      const atualizados = await api.listarRiscos();
      setBkRiscos(atualizados);
      setRiscos(atualizados.map(mapRisco));
      const { cr } = deriveJoins(atualizados, bkExames);
      setCargoRiscos(cr);
      toast.success("Risco vinculado ao cargo");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao vincular"); }
  };

  // ---- Vincular risco ↔ exame (atualiza FK id_risco_ocupacional no exame) ----
  const vincularRiscoExame = async () => {
    if (!vincRiscoEx || !vincExameEx) return;
    const bkE = bkExames.find(e => String(e.id) === vincExameEx);
    if (!bkE) return;
    try {
      await api.atualizarExameOcupacional(bkE.id, { ...bkE, id_risco_ocupacional: parseInt(vincRiscoEx) });
      const atualizados = await api.listarExamesOcupacionais();
      setBkExames(atualizados);
      setExames(atualizados.map(mapExame));
      const { re } = deriveJoins(bkRiscos, atualizados);
      setRiscoExames(re);
      toast.success("Exame vinculado ao risco");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao vincular"); }
  };

  // ---- Adicionar risco ao funcionário → gera exames pendentes ----
  const adicionarRiscoAoFuncionario = async () => {
    if (!funcSelecionado || !riscoParaFunc) return;
    const f = funcionarios.find(x => x.id === funcSelecionado);
    if (!f?.cargo_id) return toast.error("Funcionário sem cargo. Edite no módulo Cadastro de Funcionários.");

    // vincular o risco ao cargo do funcionário (se ainda não)
    const bkR = bkRiscos.find(r => String(r.id) === riscoParaFunc);
    if (bkR && String(bkR.id_cargo) !== f.cargo_id) {
      try {
        await api.atualizarRisco(bkR.id, { ...bkR, id_cargo: parseInt(f.cargo_id) });
        const atualizados = await api.listarRiscos();
        setBkRiscos(atualizados);
        setRiscos(atualizados.map(mapRisco));
        const { cr } = deriveJoins(atualizados, bkExames);
        setCargoRiscos(cr);
      } catch (_) { /* ignore */ }
    }

    // exames obrigatórios deste risco
    const exameIds = bkExames
      .filter(e => String(e.id_risco_ocupacional) === riscoParaFunc)
      .map(e => e.id);

    if (exameIds.length === 0) {
      toast.warning("Risco sem exames vinculados. Vincule exames ao risco na aba Riscos.");
      return;
    }

    const existentes = new Set(examesFunc.filter(e => e.funcionario_id === f.id).map(e => e.exame_id));
    const novosIds = exameIds.filter(id => !existentes.has(String(id)));
    if (novosIds.length === 0) { toast.info("Todos os exames deste risco já estão atribuídos"); return; }

    try {
      const criados = await Promise.all(
        novosIds.map(exame_id =>
          api.criarExameFuncionario({
            id_funcionario: parseInt(f.id),
            id_exame_ocupacional: exame_id,
            tipo_exame: "Admissional",
            situacao: "PENDENTE",
          })
        )
      );
      setExamesFunc(prev => [...criados.map(mapExameFunc), ...prev]);
      setRiscoParaFunc("");
      toast.success(`${criados.length} exame(s) vinculados a ${f.nome}`);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao vincular exames"); }
  };

  // ---- Registrar exame realizado ----
  const abrirRegistrar = (e: ExameFunc) => {
    setRegistrar(e);
    setRegForm({
      data_realizacao: e.data_realizacao || format(new Date(), "yyyy-MM-dd"),
      resultado: e.resultado || "APTO",
      medico_responsavel: e.medico_responsavel || "",
      crm_medico: e.crm_medico || "",
      observacoes: e.observacoes || "",
    });
  };

  const confirmarRegistro = async () => {
    if (!registrar) return;
    const exameOcup = exames.find(x => x.id === registrar.exame_id);
    const periodicidade = exameOcup?.periodicidade_meses || 12;
    const dataReal = new Date(regForm.data_realizacao);
    const venc = addMonths(dataReal, periodicidade);
    try {
      await api.atualizarExameFuncionario(parseInt(registrar.id), {
        dataRealizacao: regForm.data_realizacao,
        dataVencimento: format(venc, "yyyy-MM-dd"),
        resultado: regForm.resultado,
        situacao: "CONCLUIDO",
        medicoResponsavel: regForm.medico_responsavel,
        crmMedico: regForm.crm_medico,
        observacoes: regForm.observacoes,
        id_funcionario: parseInt(registrar.funcionario_id),
        id_exame_ocupacional: parseInt(registrar.exame_id),
        tipo_exame: registrar.tipo_exame,
      });
      setExamesFunc(prev => prev.map(e =>
        e.id === registrar.id
          ? { ...e, data_realizacao: regForm.data_realizacao, data_vencimento: format(venc, "yyyy-MM-dd"), resultado: regForm.resultado, situacao: "CONCLUIDO", medico_responsavel: regForm.medico_responsavel, crm_medico: regForm.crm_medico, observacoes: regForm.observacoes }
          : e
      ));
      toast.success("Exame registrado e vencimento calculado");
      setRegistrar(null);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao registrar exame"); }
  };

  const excluirExame = async (id: string) => {
    if (!confirm("Remover este exame?")) return;
    try {
      await api.deletarExameFuncionario(parseInt(id));
      setExamesFunc(prev => prev.filter(e => e.id !== id));
      toast.success("Exame removido");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao remover exame"); }
  };

  // ---- Emitir ASO ----
  const emitirASO = async (funcionarioId: string) => {
    const f = funcionarios.find(x => x.id === funcionarioId);
    if (!f) return;
    const examesDoFunc = examesFunc.filter(e => e.funcionario_id === funcionarioId && e.tipo_exame === "Admissional");
    if (examesDoFunc.length === 0) return toast.error("Nenhum exame admissional para este funcionário");
    const pendentes = examesDoFunc.filter(e => e.situacao !== "CONCLUIDO");
    if (pendentes.length > 0) return toast.error(`${pendentes.length} exame(s) ainda pendente(s)`);

    const inaptos = examesDoFunc.filter(e => (e.resultado || "").toUpperCase().includes("INAPTO"));
    const aptidao = inaptos.length > 0 ? "INAPTO" : "APTO";
    const proximaData = examesDoFunc
      .map(e => e.data_vencimento ? new Date(e.data_vencimento) : null)
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime())[0] || addMonths(new Date(), 12);
    const medico = examesDoFunc.find(e => e.medico_responsavel)?.medico_responsavel || "";
    const crm = examesDoFunc.find(e => e.crm_medico)?.crm_medico || "";

    try {
      await api.criarASO({
        dataEmissao: format(new Date(), "yyyy-MM-dd"),
        tipoExame: "Admissional",
        aptidao,
        restricao: inaptos.map(i => i.observacoes).filter(Boolean).join("; ") || "",
        proximoASO: format(proximaData, "yyyy-MM-dd"),
        medicoResponsavel: medico,
        crmMedico: crm,
        id_funcionario: parseInt(funcionarioId),
      });

      generateASOPdf({
        empresa,
        funcionario: { ...f },
        aso: {
          tipo_exame: "Admissional",
          data_emissao: format(new Date(), "yyyy-MM-dd"),
          aptidao,
          proximo_aso: format(proximaData, "yyyy-MM-dd"),
          medico_responsavel: medico,
          crm_medico: crm,
          restricoes: null,
        },
        exames: examesDoFunc.map(ef => {
          const cat = exames.find(x => x.id === ef.exame_id);
          return { nome: cat?.nome || "—", tipo: cat?.tipo || "—", data_realizacao: ef.data_realizacao, resultado: ef.resultado };
        }),
      });
      toast.success("ASO emitido e PDF gerado");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao emitir ASO"); }
  };

  const resolverAlerta = async (id: string) => {
    try {
      await api.resolverAlerta(parseInt(id));
      setAlertas(prev => prev.map(a => a.id === id ? { ...a, resolvido: true } : a));
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao resolver alerta"); }
  };

  // ---- filtros ----
  const examesFiltrados = useMemo(() => {
    return examesFunc.filter(e => {
      const f = funcionarios.find(x => x.id === e.funcionario_id);
      if (filtros.funcionario && !f?.nome.toLowerCase().includes(filtros.funcionario.toLowerCase())) return false;
      if (filtros.situacao !== "TODOS" && e.situacao !== filtros.situacao) return false;
      if (filtros.cargo !== "TODOS" && f?.cargo_id !== filtros.cargo) return false;
      return true;
    });
  }, [examesFunc, funcionarios, filtros]);

  const StatusBadge = ({ s }: { s: string }) => {
    const map: any = {
      PENDENTE: { c: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30", i: Clock, l: "Pendente" },
      CONCLUIDO: { c: "bg-green-500/10 text-green-700 border-green-500/30", i: CheckCircle2, l: "Concluído" },
      VENCIDO: { c: "bg-red-500/10 text-red-700 border-red-500/30", i: XCircle, l: "Vencido" },
    };
    const v = map[s] || map.PENDENTE;
    const Icon = v.i;
    return <Badge variant="outline" className={v.c}><Icon className="h-3 w-3 mr-1" />{v.l}</Badge>;
  };

  const alertasAtivos = alertas.filter(a => !a.resolvido);

  // ---- KPIs Dashboard ----
  type Prio = { funcionario: Funcionario; ef: ExameFunc; cat?: ExameOcup; risco?: Risco; status: "VENCIDO" | "PROXIMO" | "EM_DIA" | "PENDENTE"; dias: number | null };
  const hoje = new Date();
  const linhas: Prio[] = examesFunc.map(ef => {
    const f = funcionarios.find(x => x.id === ef.funcionario_id);
    if (!f) return null as any;
    const cat = exames.find(x => x.id === ef.exame_id);
    const riscoIdsDoCargo = cargoRiscos.filter(cr => cr.cargo_id === f.cargo_id).map(cr => cr.risco_id);
    const riscoMatch = riscoExames.find(re => re.exame_id === ef.exame_id && riscoIdsDoCargo.includes(re.risco_id));
    const risco = riscoMatch ? riscos.find(r => r.id === riscoMatch.risco_id) : undefined;
    let status: Prio["status"] = "EM_DIA"; let dias: number | null = null;
    if (ef.situacao === "PENDENTE") status = "PENDENTE";
    else if (ef.data_vencimento) {
      dias = differenceInDays(new Date(ef.data_vencimento), hoje);
      if (dias < 0) status = "VENCIDO";
      else if (dias <= 30) status = "PROXIMO";
      else status = "EM_DIA";
    }
    return { funcionario: f, ef, cat, risco, status, dias };
  }).filter(Boolean) as Prio[];

  const funcAtivos = funcionarios.length;
  const funcSemCargo = funcionarios.filter(f => !f.cargo_id).length;
  const funcSemAdmissao = funcionarios.filter(f => !f.data_admissao).length;
  const pendCadastro = funcSemCargo + funcSemAdmissao;
  const totalVencidos = linhas.filter(l => l.status === "VENCIDO").length;
  const totalProximos = linhas.filter(l => l.status === "PROXIMO").length;
  const totalEmDia = linhas.filter(l => l.status === "EM_DIA").length;
  const funcionariosInaptos = new Set(linhas.filter(l => l.status === "VENCIDO").map(l => l.funcionario.id)).size;
  const funcionariosAptos = funcAtivos - funcionariosInaptos;

  const porSetor = funcionarios.reduce<Record<string, number>>((acc, f) => {
    const k = (f.setor || "Sem setor").trim() || "Sem setor";
    acc[k] = (acc[k] || 0) + 1; return acc;
  }, {});

  const prioridades = [...linhas].sort((a, b) => {
    const order = { VENCIDO: 0, PROXIMO: 1, PENDENTE: 2, EM_DIA: 3 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return (a.dias ?? 9999) - (b.dias ?? 9999);
  }).slice(0, 12);

  const irParaExames = (filtroSit?: string) => {
    if (filtroSit) setFiltros({ ...filtros, situacao: filtroSit });
    const trigger = document.querySelector('[data-tab-target="exames"]') as HTMLElement | null;
    trigger?.click();
  };

  const exportarPCMSO = () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFontSize(15); doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO PCMSO / GRO-PGR", pageW / 2, 18, { align: "center" });
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text((empresa.razao_social || "Empresa não cadastrada").toUpperCase(), pageW / 2, 25, { align: "center" });
    doc.text(`CNPJ: ${empresa.cnpj || "—"}`, pageW / 2, 30, { align: "center" });
    doc.text(`Emitido em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, pageW / 2, 35, { align: "center" });

    autoTable(doc, {
      startY: 42,
      head: [["Indicador", "Valor"]],
      body: [
        ["Funcionários ativos", String(funcAtivos)],
        ["Aptos", String(funcionariosAptos)],
        ["Inaptos / com exames vencidos", String(funcionariosInaptos)],
        ["Exames vencidos", String(totalVencidos)],
        ["Exames vencendo em até 30 dias", String(totalProximos)],
        ["Exames em dia", String(totalEmDia)],
        ["Pendências de cadastro", String(pendCadastro)],
      ],
      theme: "grid", styles: { fontSize: 9 },
      headStyles: { fillColor: [44, 62, 80], textColor: 255 },
    });

    autoTable(doc, {
      // @ts-ignore
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [["Funcionário", "Cargo", "Risco", "Exame", "Vencimento", "Status"]],
      body: prioridades.map(l => [
        l.funcionario.nome,
        l.funcionario.cargo,
        l.risco?.descricao || "—",
        l.cat?.nome || "—",
        l.ef.data_vencimento ? format(new Date(l.ef.data_vencimento), "dd/MM/yyyy") : "—",
        l.status === "VENCIDO" ? `VENCIDO (${Math.abs(l.dias ?? 0)}d)` :
        l.status === "PROXIMO" ? `PRÓXIMO VENC (${l.dias}d)` :
        l.status === "PENDENTE" ? "PENDENTE" : "EM DIA",
      ]),
      theme: "grid", styles: { fontSize: 8 },
      headStyles: { fillColor: [44, 62, 80], textColor: 255 },
    });

    doc.save(`PCMSO_${format(new Date(), "dd-MM-yyyy")}.pdf`);
    toast.success("Relatório PCMSO gerado");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar empresaNome={empresaNome} />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-7xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#2c3e50] to-[#4a69bd] text-white">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Exame Admissional</h1>
              <p className="text-sm text-muted-foreground">Fluxo completo: cargos → riscos → exames → ASO → alertas</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-1 mb-6">
            <TabsTrigger value="dashboard"><LayoutDashboard className="h-4 w-4 mr-1" />Dashboard</TabsTrigger>
            <TabsTrigger value="exames" data-tab-target="exames"><Activity className="h-4 w-4 mr-1" />Exames</TabsTrigger>
            <TabsTrigger value="alertas"><Bell className="h-4 w-4 mr-1" />Alertas{alertasAtivos.length > 0 && <Badge className="ml-2 h-5 px-1.5">{alertasAtivos.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="riscos"><AlertTriangle className="h-4 w-4 mr-1" />Riscos</TabsTrigger>
            <TabsTrigger value="catalogo"><ClipboardList className="h-4 w-4 mr-1" />Exames Cat.</TabsTrigger>
          </TabsList>

          {/* ===== DASHBOARD ===== */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button onClick={() => irParaExames("TODOS")} className="text-left">
                <Card className="p-5 border-l-4 border-l-primary hover:shadow-md transition-shadow h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Funcionários Ativos</p>
                      <p className="text-4xl font-bold mt-1">{funcAtivos}</p>
                    </div>
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {Object.entries(porSetor).slice(0, 4).map(([k, v]) => (
                      <div key={k} className="flex justify-between"><span className="truncate">{k}</span><span className="font-bold text-foreground ml-2">{v}</span></div>
                    ))}
                  </div>
                </Card>
              </button>

              <button onClick={() => irParaExames("PENDENTE")} className="text-left">
                <Card className="p-5 border-l-4 border-l-destructive bg-destructive/5 hover:shadow-md transition-shadow h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-destructive">Alertas Críticos — Exames Vencidos</p>
                      <p className="text-4xl font-bold mt-1 text-destructive">{totalVencidos}</p>
                    </div>
                    <AlertTriangle className="h-7 w-7 text-destructive" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-destructive">Ação Imediata Necessária!</p>
                  <p className="text-xs text-muted-foreground">{funcionariosInaptos} funcionário(s) impactado(s)</p>
                </Card>
              </button>

              <button onClick={() => irParaExames("CONCLUIDO")} className="text-left">
                <Card className="p-5 border-l-4 border-l-warning bg-warning/5 hover:shadow-md transition-shadow h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "hsl(var(--warning))" }}>Vencimentos Próximos</p>
                      <p className="text-4xl font-bold mt-1" style={{ color: "hsl(var(--warning))" }}>{totalProximos}</p>
                    </div>
                    <CalendarClock className="h-7 w-7" style={{ color: "hsl(var(--warning))" }} />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Planejar agendamentos (próx. 30 dias)</p>
                </Card>
              </button>

              <button onClick={() => irParaExames("TODOS")} className="text-left">
                <Card className="p-5 border-l-4 border-l-success bg-success/5 hover:shadow-md transition-shadow h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "hsl(var(--success))" }}>Pendências de Cadastro</p>
                      <p className="text-4xl font-bold mt-1" style={{ color: "hsl(var(--success))" }}>{pendCadastro}</p>
                    </div>
                    <ClipboardList className="h-7 w-7" style={{ color: "hsl(var(--success))" }} />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{funcSemCargo} sem cargo · {funcSemAdmissao} sem admissão</p>
                </Card>
              </button>
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b bg-muted/30">
                <h3 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Monitoramento de Exames e Riscos — Lista de Prioridades (GRO/PGR)</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Risco Associado</TableHead>
                    <TableHead>Exame</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prioridades.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sem dados — cadastre cargos, riscos e funcionários.</TableCell></TableRow>
                  )}
                  {prioridades.map(l => {
                    const rowClass =
                      l.status === "VENCIDO" ? "bg-destructive/5" :
                      l.status === "PROXIMO" ? "bg-warning/5" :
                      l.status === "EM_DIA" ? "bg-success/5" : "";
                    const badge =
                      l.status === "VENCIDO" ? <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive">VENCIDO{l.dias !== null && ` (${Math.abs(l.dias)}d)`}</Badge> :
                      l.status === "PROXIMO" ? <Badge style={{ background: "hsl(var(--warning))", color: "hsl(var(--warning-foreground))" }}>PRÓXIMO VENC</Badge> :
                      l.status === "PENDENTE" ? <Badge variant="secondary">PENDENTE</Badge> :
                      <Badge style={{ background: "hsl(var(--success))", color: "hsl(var(--success-foreground))" }}>EM DIA</Badge>;
                    return (
                      <TableRow key={l.ef.id} className={rowClass}>
                        <TableCell className="font-medium">{l.funcionario.nome}</TableCell>
                        <TableCell>{l.funcionario.cargo}</TableCell>
                        <TableCell>{l.risco?.descricao || "—"}</TableCell>
                        <TableCell>{l.cat?.nome || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {fmt(l.ef.data_vencimento)}
                          {l.dias !== null && (
                            <div className="text-xs text-muted-foreground">
                              {l.dias < 0 ? `Vencido há ${Math.abs(l.dias)} dias` : l.dias <= 30 ? `Vence em ${l.dias} dias` : `Faltam ${l.dias} dias`}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{badge}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => abrirRegistrar(l.ef)}>
                            {l.status === "VENCIDO" || l.status === "PENDENTE" ? "Agendar Exame" : "Ver Detalhes"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>

            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="p-5 lg:col-span-2">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Situação Geral de Aptidão na Empresa</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span>Total: <strong>{funcAtivos}</strong> Funcionários.</span>
                  <span>Aptos: <strong>{funcionariosAptos}</strong></span>
                  <Badge style={{ background: "hsl(var(--success))", color: "hsl(var(--success-foreground))" }}>EM DIA</Badge>
                  <span>· Inaptos: <strong>{funcionariosInaptos}</strong></span>
                  <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive">VENCIDOS / EM AFASTAMENTO</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-md border p-3 bg-success/5"><p className="text-xs text-muted-foreground">Em dia</p><p className="text-2xl font-bold" style={{ color: "hsl(var(--success))" }}>{totalEmDia}</p></div>
                  <div className="rounded-md border p-3 bg-warning/5"><p className="text-xs text-muted-foreground">Próximo venc.</p><p className="text-2xl font-bold" style={{ color: "hsl(var(--warning))" }}>{totalProximos}</p></div>
                  <div className="rounded-md border p-3 bg-destructive/5"><p className="text-xs text-muted-foreground">Vencidos</p><p className="text-2xl font-bold text-destructive">{totalVencidos}</p></div>
                </div>
              </Card>
              <Card className="p-5 flex flex-col gap-2 justify-center">
                <Button onClick={exportarPCMSO}><Printer className="h-4 w-4 mr-2" />Imprimir Relatório PCMSO (PDF)</Button>
                <Button variant="outline" onClick={() => irParaExames("TODOS")}><FileText className="h-4 w-4 mr-2" />Visualizar Exames & Auditoria</Button>
                <Button variant="outline" onClick={() => { const t = document.querySelector('[value="alertas"]') as HTMLElement | null; t?.click(); }}>
                  <Bell className="h-4 w-4 mr-2" />Ver Alertas ({alertasAtivos.length})
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* ===== EXAMES DOS FUNCIONÁRIOS ===== */}
          <TabsContent value="exames" className="space-y-4">
            <Card className="p-4 border-l-4 border-l-primary">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" /> Adicionar risco ocupacional ao funcionário
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Selecione um funcionário e um risco. Os exames obrigatórios serão vinculados automaticamente.
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                <Select value={funcSelecionado} onValueChange={setFuncSelecionado}>
                  <SelectTrigger><SelectValue placeholder="Funcionário" /></SelectTrigger>
                  <SelectContent>
                    {funcionarios.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome} {f.cargo ? `— ${f.cargo}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={riscoParaFunc} onValueChange={setRiscoParaFunc}>
                  <SelectTrigger><SelectValue placeholder="Risco ocupacional" /></SelectTrigger>
                  <SelectContent>
                    {riscos.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.descricao}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={adicionarRiscoAoFuncionario} disabled={!funcSelecionado || !riscoParaFunc}>
                  <Plus className="h-4 w-4 mr-1" /> Vincular e gerar exames
                </Button>
              </div>
              {funcSelecionado && (() => {
                const f = funcionarios.find(x => x.id === funcSelecionado);
                if (!f?.cargo_id) return null;
                const riscosCargo = cargoRiscos
                  .filter(cr => cr.cargo_id === f.cargo_id)
                  .map(cr => riscos.find(r => r.id === cr.risco_id))
                  .filter(Boolean);
                return (
                  <div className="mt-3 text-sm">
                    <span className="text-muted-foreground">Riscos atuais do cargo:</span>{" "}
                    {riscosCargo.length === 0
                      ? <span className="text-xs text-muted-foreground">nenhum</span>
                      : riscosCargo.map(r => <Badge key={r!.id} variant="secondary" className="ml-1">{r!.descricao}</Badge>)}
                  </div>
                );
              })()}
            </Card>

            <Card className="p-4">
              <div className="grid md:grid-cols-4 gap-3">
                <div>
                  <Label>Funcionário</Label>
                  <Input placeholder="Buscar..." value={filtros.funcionario} onChange={e => setFiltros({ ...filtros, funcionario: e.target.value })} />
                </div>
                <div>
                  <Label>Situação</Label>
                  <Select value={filtros.situacao} onValueChange={v => setFiltros({ ...filtros, situacao: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                      <SelectItem value="VENCIDO">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cargo</Label>
                  <Select value={filtros.cargo} onValueChange={v => setFiltros({ ...filtros, cargo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      {cargos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end text-sm text-muted-foreground">
                  {examesFiltrados.length} exame(s)
                </div>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Exame</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Realização</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examesFiltrados.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum exame encontrado. Cadastre cargos, riscos e exames, e vincule um cargo ao funcionário.
                    </TableCell></TableRow>
                  )}
                  {examesFiltrados.map(e => {
                    const f = funcionarios.find(x => x.id === e.funcionario_id);
                    const cat = exames.find(x => x.id === e.exame_id);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{f?.nome || "—"}</TableCell>
                        <TableCell>{cat?.nome || "—"}</TableCell>
                        <TableCell><Badge variant="secondary">{e.tipo_exame}</Badge></TableCell>
                        <TableCell>{fmt(e.data_realizacao)}</TableCell>
                        <TableCell>{fmt(e.data_vencimento)}</TableCell>
                        <TableCell><StatusBadge s={e.situacao} /></TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="outline" onClick={() => abrirRegistrar(e)}>
                            <FileCheck2 className="h-3 w-3 mr-1" />Registrar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => emitirASO(e.funcionario_id)}>
                            <FileText className="h-3 w-3 mr-1" />ASO
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => excluirExame(e.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ===== ALERTAS ===== */}
          <TabsContent value="alertas" className="space-y-3">
            {alertasAtivos.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
                Nenhum alerta ativo. Tudo em ordem!
              </Card>
            )}
            {alertasAtivos.map(a => {
              const f = funcionarios.find(x => x.id === a.funcionario_id);
              const ef = examesFunc.find(x => x.funcionario_id === a.funcionario_id);
              const cat = exames.find(x => x.id === ef?.exame_id);
              const color = a.nivel === "CRITICO" ? "border-red-500/40 bg-red-500/5" : "border-yellow-500/40 bg-yellow-500/5";
              return (
                <Card key={a.id} className={`p-4 border-l-4 ${color} flex items-start justify-between gap-4`}>
                  <div className="flex gap-3">
                    <Bell className={`h-5 w-5 ${a.nivel === "CRITICO" ? "text-red-600" : "text-yellow-600"}`} />
                    <div>
                      <p className="font-semibold">{f?.nome || "Funcionário"} — {cat?.nome || "Exame"}</p>
                      <p className="text-sm text-muted-foreground">{a.mensagem}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vencimento: {fmt(a.data_vencimento)}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => resolverAlerta(a.id)}>Resolver</Button>
                </Card>
              );
            })}
          </TabsContent>

          {/* ===== RISCOS ===== */}
          <TabsContent value="riscos" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />Vincular risco a cargo
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Selecione um risco existente e o cargo ao qual ele pertence.
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                <Select value={vincCargo} onValueChange={setVincCargo}>
                  <SelectTrigger><SelectValue placeholder="Cargo" /></SelectTrigger>
                  <SelectContent>{cargos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={vincRisco} onValueChange={setVincRisco}>
                  <SelectTrigger><SelectValue placeholder="Risco" /></SelectTrigger>
                  <SelectContent>{riscos.map(r => <SelectItem key={r.id} value={r.id}>{r.descricao}</SelectItem>)}</SelectContent>
                </Select>
                <Button onClick={vincularCargoRisco}>Vincular</Button>
              </div>
              {cargos.length > 0 && (
                <div className="mt-4 space-y-1 text-sm">
                  {cargos.map(c => {
                    const rs = cargoRiscos.filter(x => x.cargo_id === c.id)
                      .map(x => riscos.find(r => r.id === x.risco_id)?.descricao).filter(Boolean);
                    return (
                      <div key={c.id} className="flex items-start gap-2 py-1 border-b last:border-0">
                        <span className="font-medium min-w-[140px]">{c.nome}:</span>
                        <div className="flex flex-wrap gap-1 flex-1">
                          {rs.length === 0
                            ? <span className="text-xs text-muted-foreground">sem riscos vinculados</span>
                            : rs.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Novo risco ocupacional</h3>
              <div className="grid md:grid-cols-4 gap-3">
                <Input placeholder="Descrição" value={novoRisco.descricao} onChange={e => setNovoRisco({ ...novoRisco, descricao: e.target.value })} className="md:col-span-2" />
                <Select value={novoRisco.nivel} onValueChange={v => setNovoRisco({ ...novoRisco, nivel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAIXO">Leve</SelectItem>
                    <SelectItem value="MEDIO">Médio</SelectItem>
                    <SelectItem value="ALTO">Grave</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Tipo (físico, químico…)" value={novoRisco.tipo} onChange={e => setNovoRisco({ ...novoRisco, tipo: e.target.value })} />
                <Button onClick={addRisco} className="md:col-span-4 md:w-auto md:justify-self-end"><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Vincular exame a risco</h3>
              <div className="grid md:grid-cols-3 gap-3">
                <Select value={vincRiscoEx} onValueChange={setVincRiscoEx}>
                  <SelectTrigger><SelectValue placeholder="Risco" /></SelectTrigger>
                  <SelectContent>{riscos.map(r => <SelectItem key={r.id} value={r.id}>{r.descricao}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={vincExameEx} onValueChange={setVincExameEx}>
                  <SelectTrigger><SelectValue placeholder="Exame" /></SelectTrigger>
                  <SelectContent>{exames.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
                </Select>
                <Button onClick={vincularRiscoExame}>Vincular</Button>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Risco</TableHead><TableHead>Nível</TableHead><TableHead>Exames obrigatórios</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {riscos.map(r => {
                    const exs = riscoExames.filter(x => x.risco_id === r.id).map(x => exames.find(e => e.id === x.exame_id)?.nome).filter(Boolean);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.descricao}</TableCell>
                        <TableCell><Badge variant="outline">{r.nivel}</Badge></TableCell>
                        <TableCell><div className="flex flex-wrap gap-1">{exs.map(e => <Badge key={e} variant="secondary">{e}</Badge>)}</div></TableCell>
                        <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => delRisco(r.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ===== CATÁLOGO DE EXAMES ===== */}
          <TabsContent value="catalogo" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Novo exame ocupacional</h3>
              <div className="grid md:grid-cols-4 gap-3">
                <Input placeholder="Nome (ex: Audiometria)" value={novoExame.nome} onChange={e => setNovoExame({ ...novoExame, nome: e.target.value })} />
                <Select value={novoExame.tipo} onValueChange={v => setNovoExame({ ...novoExame, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Clínico">Clínico</SelectItem>
                    <SelectItem value="Audiometria">Audiometria</SelectItem>
                    <SelectItem value="Acuidade Visual">Acuidade Visual</SelectItem>
                    <SelectItem value="Espirometria">Espirometria</SelectItem>
                    <SelectItem value="Laboratorial">Laboratorial</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" min={1} placeholder="Periodicidade (meses)" value={novoExame.periodicidade_meses} onChange={e => setNovoExame({ ...novoExame, periodicidade_meses: Number(e.target.value) })} />
                <Button onClick={addExame}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Periodicidade</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {exames.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.nome}</TableCell>
                      <TableCell><Badge variant="secondary">{e.tipo}</Badge></TableCell>
                      <TableCell>{e.periodicidade_meses} meses</TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => delExame(e.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* DIALOG: Registrar exame */}
        <Dialog open={!!registrar} onOpenChange={o => !o && setRegistrar(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar exame realizado</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Data de realização</Label>
                <Input type="date" value={regForm.data_realizacao} onChange={e => setRegForm({ ...regForm, data_realizacao: e.target.value })} />
              </div>
              <div>
                <Label>Resultado</Label>
                <Select value={regForm.resultado} onValueChange={v => setRegForm({ ...regForm, resultado: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APTO">APTO</SelectItem>
                    <SelectItem value="APTO COM RESTRIÇÕES">APTO COM RESTRIÇÕES</SelectItem>
                    <SelectItem value="INAPTO">INAPTO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Médico responsável</Label>
                  <Input value={regForm.medico_responsavel} onChange={e => setRegForm({ ...regForm, medico_responsavel: e.target.value })} />
                </div>
                <div>
                  <Label>CRM</Label>
                  <Input value={regForm.crm_medico} onChange={e => setRegForm({ ...regForm, crm_medico: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={regForm.observacoes} onChange={e => setRegForm({ ...regForm, observacoes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRegistrar(null)}>Cancelar</Button>
              <Button onClick={confirmarRegistro}><Send className="h-4 w-4 mr-1" />Registrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ExameAdmissional;
