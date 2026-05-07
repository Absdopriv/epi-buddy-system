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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addMonths, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { generateASOPdf } from "@/lib/asoPdf";
import {
  cargos as cargosApi,
  riscosOcupacionais as riscosApi,
  examesOcupacionais as examesApi,
  examesFuncionarios as examesFuncApi,
  funcionarios as funcionariosApi,
  setores as setoresApi,
  empresas as empresasApi,
  asos as asosApi,
  alertas as alertasApi,
  type Cargo, type RiscoOcupacional, type ExameOcupacional,
  type Funcionario, type ExameFuncionario, type Alerta, type Setor, type Empresa, type ID,
} from "@/lib/api";

const fmt = (d?: string | null) => (d ? format(new Date(d), "dd/MM/yyyy", { locale: ptBR }) : "—");
const sameId = (a: ID | null | undefined, b: ID | null | undefined) =>
  a != null && b != null && String(a) === String(b);

const ExameAdmissional = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [empresaNome, setEmpresaNome] = useState("Sua Empresa");

  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [riscos, setRiscos] = useState<RiscoOcupacional[]>([]);
  const [exames, setExames] = useState<ExameOcupacional[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [examesFunc, setExamesFunc] = useState<ExameFuncionario[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  // forms catálogo
  const [novoRisco, setNovoRisco] = useState({ descricao: "", nivel: "MEDIO", tipo: "FISICO", id_cargo: "" });
  const [novoExame, setNovoExame] = useState({ nome: "", tipo: "Clínico", periodicidadeMeses: 12, id_risco_ocupacional: "" });

  // adicionar risco a funcionário
  const [funcSelecionado, setFuncSelecionado] = useState<string>("");
  const [riscoParaFunc, setRiscoParaFunc] = useState<string>("");

  const [filtros, setFiltros] = useState({ funcionario: "", situacao: "TODOS", cargo: "TODOS" });
  const [registrar, setRegistrar] = useState<ExameFuncionario | null>(null);
  const [regForm, setRegForm] = useState({ data_realizacao: "", resultado: "APTO", medico_responsavel: "", crm_medico: "", observacoes: "" });

  const cargoNome = (id?: ID | null) => cargos.find(c => sameId(c.id, id))?.nome || "—";
  const setorNome = (id?: ID | null) => setores.find(s => sameId(s.id, id))?.nome || "—";

  const fetchAll = async () => {
    try {
      const [c, s, r, ex, fn, ef, al, emp] = await Promise.all([
        cargosApi.list(),
        setoresApi.list(),
        riscosApi.list(),
        examesApi.list(),
        funcionariosApi.list(),
        examesFuncApi.list(),
        alertasApi.list(),
        empresasApi.list().catch(() => [] as Empresa[]),
      ]);
      setCargos(c);
      setSetores(s);
      setRiscos(r);
      setExames(ex);
      setFuncionarios(fn);
      setExamesFunc(ef);
      setAlertas(al);
      if (emp.length > 0) setEmpresa(emp[0]);
    } catch (e: any) {
      toast.error(`Erro ao carregar dados: ${e.message}`);
    }

    if (user) {
      const { data } = await supabase.from("profiles").select("razao_social").eq("user_id", user.id).maybeSingle();
      if (data?.razao_social) setEmpresaNome(data.razao_social);
    }
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [user]);

  // ===== CRUD catálogos =====
  const addRisco = async () => {
    if (!novoRisco.descricao.trim() || !novoRisco.id_cargo) {
      return toast.error("Informe descrição e cargo");
    }
    try {
      const created = await riscosApi.create({
        descricao: novoRisco.descricao.trim(),
        nivel: novoRisco.nivel,
        tipo: novoRisco.tipo,
        id_cargo: Number(novoRisco.id_cargo),
      });
      setRiscos(prev => [...prev, created]);
      setNovoRisco({ descricao: "", nivel: "MEDIO", tipo: "FISICO", id_cargo: "" });
      toast.success("Risco cadastrado");
    } catch (e: any) { toast.error(e.message); }
  };

  const delRisco = async (id: ID) => {
    try {
      await riscosApi.remove(id);
      setRiscos(prev => prev.filter(r => !sameId(r.id, id)));
    } catch (e: any) { toast.error(e.message); }
  };

  const addExame = async () => {
    if (!novoExame.nome.trim() || !novoExame.id_risco_ocupacional) {
      return toast.error("Informe nome e risco");
    }
    try {
      const created = await examesApi.create({
        nome: novoExame.nome.trim(),
        tipo: novoExame.tipo,
        periodicidadeMeses: Number(novoExame.periodicidadeMeses),
        id_risco_ocupacional: Number(novoExame.id_risco_ocupacional),
        dataemissao: format(new Date(), "yyyy-MM-dd"),
      });
      setExames(prev => [...prev, created]);
      setNovoExame({ nome: "", tipo: "Clínico", periodicidadeMeses: 12, id_risco_ocupacional: "" });
      toast.success("Exame cadastrado");
    } catch (e: any) { toast.error(e.message); }
  };

  const delExame = async (id: ID) => {
    try {
      await examesApi.remove(id);
      setExames(prev => prev.filter(e => !sameId(e.id, id)));
    } catch (e: any) { toast.error(e.message); }
  };

  // ===== Adicionar risco ao funcionário (gera exames pendentes) =====
  const adicionarRiscoAoFuncionario = async () => {
    if (!funcSelecionado || !riscoParaFunc) return;
    const f = funcionarios.find(x => sameId(x.id, funcSelecionado));
    if (!f?.id_cargo) return toast.error("Funcionário sem cargo. Edite no módulo Cadastro de Funcionários.");

    const risco = riscos.find(r => sameId(r.id, riscoParaFunc));
    if (!risco) return;
    if (!sameId(risco.id_cargo, f.id_cargo)) {
      return toast.error("Este risco está vinculado a outro cargo. Cadastre o risco no cargo correto.");
    }

    const exObrig = exames.filter(e => sameId(e.id_risco_ocupacional, risco.id));
    if (exObrig.length === 0) return toast.warning("Risco sem exames vinculados. Cadastre exames para este risco.");

    const existentes = new Set(
      examesFunc
        .filter(e => sameId(e.id_funcionario, f.id))
        .map(e => String(e.id_exame_ocupacional)),
    );
    const novos = exObrig.filter(e => !existentes.has(String(e.id)));
    if (novos.length === 0) return toast.info("Todos os exames deste risco já estão atribuídos");

    try {
      const criados: ExameFuncionario[] = [];
      for (const e of novos) {
        const c = await examesFuncApi.create({
          id_funcionario: f.id,
          id_exame_ocupacional: e.id,
          situacao: "PENDENTE",
        });
        criados.push(c);
      }
      setExamesFunc(prev => [...criados, ...prev]);
      setRiscoParaFunc("");
      toast.success(`${criados.length} exame(s) vinculados a ${f.nome}`);
    } catch (e: any) { toast.error(e.message); }
  };

  // ===== Registrar exame realizado =====
  const abrirRegistrar = (e: ExameFuncionario) => {
    setRegistrar(e);
    setRegForm({
      data_realizacao: e.dataRealizacao || format(new Date(), "yyyy-MM-dd"),
      resultado: e.resultado || "APTO",
      medico_responsavel: e.medicoResponsavel || "",
      crm_medico: e.crmMedico || "",
      observacoes: e.observacoes || "",
    });
  };

  const confirmarRegistro = async () => {
    if (!registrar) return;
    const exame = exames.find(x => sameId(x.id, registrar.id_exame_ocupacional));
    const periodicidade = exame?.periodicidadeMeses || 12;
    const dataReal = new Date(regForm.data_realizacao);
    const venc = addMonths(dataReal, periodicidade);
    const update: Partial<ExameFuncionario> = {
      dataRealizacao: regForm.data_realizacao,
      dataVencimento: format(venc, "yyyy-MM-dd"),
      resultado: regForm.resultado,
      situacao: "CONCLUIDO",
      medicoResponsavel: regForm.medico_responsavel,
      crmMedico: regForm.crm_medico,
      observacoes: regForm.observacoes,
    };
    try {
      const updated = await examesFuncApi.update(registrar.id, update);
      setExamesFunc(prev => prev.map(e => sameId(e.id, registrar.id) ? updated : e));
      toast.success("Exame registrado e vencimento calculado");
      setRegistrar(null);
    } catch (e: any) { toast.error(e.message); }
  };

  const excluirExame = async (id: ID) => {
    if (!confirm("Remover este exame?")) return;
    try {
      await examesFuncApi.remove(id);
      setExamesFunc(prev => prev.filter(e => !sameId(e.id, id)));
      toast.success("Exame removido");
    } catch (e: any) { toast.error(e.message); }
  };

  // ===== Emitir ASO =====
  const emitirASO = async (funcionarioId: ID) => {
    const f = funcionarios.find(x => sameId(x.id, funcionarioId));
    if (!f) return;
    const examesDoFunc = examesFunc.filter(e => sameId(e.id_funcionario, funcionarioId));
    if (examesDoFunc.length === 0) return toast.error("Nenhum exame para este funcionário");
    const pendentes = examesDoFunc.filter(e => e.situacao !== "CONCLUIDO");
    if (pendentes.length > 0) return toast.error(`${pendentes.length} exame(s) ainda pendente(s)`);

    const inaptos = examesDoFunc.filter(e => (e.resultado || "").toUpperCase().includes("INAPTO"));
    const aptidao = inaptos.length > 0 ? "INAPTO" : "APTO";
    const proximaData = examesDoFunc
      .map(e => e.dataVencimento ? new Date(e.dataVencimento) : null)
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    const medico = examesDoFunc.find(e => e.medicoResponsavel)?.medicoResponsavel || "";
    const crm = examesDoFunc.find(e => e.crmMedico)?.crmMedico || "";

    const novoAso = {
      id_funcionario: f.id,
      tipoExame: "Admissional",
      dataEmissao: format(new Date(), "yyyy-MM-dd"),
      aptidao,
      restricao: inaptos.map(i => i.observacoes).filter(Boolean).join("; ") || null,
      proximoASO: proximaData ? format(proximaData, "yyyy-MM-dd") : null,
      medicoResponsavel: medico,
      crmMedico: crm,
    };

    try {
      await asosApi.create(novoAso);
    } catch (e: any) {
      toast.error(`Falha ao salvar ASO: ${e.message}`);
      return;
    }

    generateASOPdf({
      empresa: { razao_social: empresa?.razaoSocial, cnpj: empresa?.cnpj },
      funcionario: {
        nome: f.nome,
        cpf: f.cpf || "",
        cargo: cargoNome(f.id_cargo),
        setor: setorNome(f.id_setor),
        data_admissao: f.dataAdmissao,
      },
      aso: {
        tipo_exame: novoAso.tipoExame,
        data_emissao: novoAso.dataEmissao,
        aptidao: novoAso.aptidao,
        restricoes: novoAso.restricao,
        proximo_aso: novoAso.proximoASO,
        medico_responsavel: novoAso.medicoResponsavel,
        crm_medico: novoAso.crmMedico,
      },
      exames: examesDoFunc.map(ef => {
        const cat = exames.find(x => sameId(x.id, ef.id_exame_ocupacional));
        return {
          nome: cat?.nome || "—",
          tipo: cat?.tipo || "—",
          data_realizacao: ef.dataRealizacao,
          resultado: ef.resultado,
        };
      }),
    });
    toast.success("ASO emitido e PDF gerado");
  };

  const resolverAlerta = async (id: ID) => {
    try {
      await alertasApi.resolver(id);
      setAlertas(prev => prev.map(a => sameId(a.id, id) ? { ...a, resolvido: 1 } : a));
    } catch (e: any) { toast.error(e.message); }
  };

  // ===== filtros =====
  const examesFiltrados = useMemo(() => {
    return examesFunc.filter(e => {
      const f = funcionarios.find(x => sameId(x.id, e.id_funcionario));
      if (filtros.funcionario && !f?.nome.toLowerCase().includes(filtros.funcionario.toLowerCase())) return false;
      if (filtros.situacao !== "TODOS" && e.situacao !== filtros.situacao) return false;
      if (filtros.cargo !== "TODOS" && !sameId(f?.id_cargo, filtros.cargo)) return false;
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

  // ===== KPIs do Dashboard =====
  type Prio = {
    funcionario: Funcionario; ef: ExameFuncionario; cat?: ExameOcupacional;
    risco?: RiscoOcupacional; status: "VENCIDO" | "PROXIMO" | "EM_DIA" | "PENDENTE"; dias: number | null;
  };
  const hoje = new Date();
  const linhas: Prio[] = examesFunc.map(ef => {
    const f = funcionarios.find(x => sameId(x.id, ef.id_funcionario));
    if (!f) return null as any;
    const cat = exames.find(x => sameId(x.id, ef.id_exame_ocupacional));
    const risco = cat ? riscos.find(r => sameId(r.id, cat.id_risco_ocupacional)) : undefined;
    let status: Prio["status"] = "EM_DIA"; let dias: number | null = null;
    if (ef.situacao === "PENDENTE") status = "PENDENTE";
    else if (ef.dataVencimento) {
      dias = differenceInDays(new Date(ef.dataVencimento), hoje);
      if (dias < 0) status = "VENCIDO";
      else if (dias <= 30) status = "PROXIMO";
      else status = "EM_DIA";
    }
    return { funcionario: f, ef, cat, risco, status, dias };
  }).filter(Boolean) as Prio[];

  const funcAtivos = funcionarios.length;
  const funcSemCargo = funcionarios.filter(f => !f.id_cargo).length;
  const funcSemAdmissao = funcionarios.filter(f => !f.dataAdmissao).length;
  const pendCadastro = funcSemCargo + funcSemAdmissao;
  const totalVencidos = linhas.filter(l => l.status === "VENCIDO").length;
  const totalProximos = linhas.filter(l => l.status === "PROXIMO").length;
  const totalEmDia = linhas.filter(l => l.status === "EM_DIA").length;
  const funcionariosInaptos = new Set(linhas.filter(l => l.status === "VENCIDO").map(l => String(l.funcionario.id))).size;
  const funcionariosAptos = funcAtivos - funcionariosInaptos;

  const porSetor = funcionarios.reduce<Record<string, number>>((acc, f) => {
    const k = setorNome(f.id_setor) || "Sem setor";
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
    doc.text((empresa?.razaoSocial || "Empresa não cadastrada").toUpperCase(), pageW / 2, 25, { align: "center" });
    doc.text(`CNPJ: ${empresa?.cnpj || "—"}`, pageW / 2, 30, { align: "center" });
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
        cargoNome(l.funcionario.id_cargo),
        l.risco?.descricao || "—",
        l.cat?.nome || "—",
        l.ef.dataVencimento ? format(new Date(l.ef.dataVencimento), "dd/MM/yyyy") : "—",
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
                      <TableRow key={String(l.ef.id)} className={rowClass}>
                        <TableCell className="font-medium">{l.funcionario.nome}</TableCell>
                        <TableCell>{cargoNome(l.funcionario.id_cargo)}</TableCell>
                        <TableCell>{l.risco?.descricao || "—"}</TableCell>
                        <TableCell>{l.cat?.nome || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {fmt(l.ef.dataVencimento)}
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
                <Button variant="outline" onClick={() => irParaExames("TODOS")}><FileText className="h-4 w-4 mr-2" />Visualizar Exames</Button>
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
                Selecione um funcionário e um risco do cargo dele. Os exames obrigatórios serão criados automaticamente.
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                <Select value={funcSelecionado} onValueChange={setFuncSelecionado}>
                  <SelectTrigger><SelectValue placeholder="Funcionário" /></SelectTrigger>
                  <SelectContent>
                    {funcionarios.map(f => (
                      <SelectItem key={String(f.id)} value={String(f.id)}>
                        {f.nome} — {cargoNome(f.id_cargo)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={riscoParaFunc} onValueChange={setRiscoParaFunc}>
                  <SelectTrigger><SelectValue placeholder="Risco ocupacional" /></SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const f = funcionarios.find(x => sameId(x.id, funcSelecionado));
                      const lista = f?.id_cargo
                        ? riscos.filter(r => sameId(r.id_cargo, f.id_cargo))
                        : riscos;
                      return lista.map(r => (
                        <SelectItem key={String(r.id)} value={String(r.id)}>{r.descricao}</SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
                <Button onClick={adicionarRiscoAoFuncionario} disabled={!funcSelecionado || !riscoParaFunc}>
                  <Plus className="h-4 w-4 mr-1" /> Vincular e gerar exames
                </Button>
              </div>
              {funcSelecionado && (() => {
                const f = funcionarios.find(x => sameId(x.id, funcSelecionado));
                if (!f?.id_cargo) return null;
                const riscosCargo = riscos.filter(r => sameId(r.id_cargo, f.id_cargo));
                return (
                  <div className="mt-3 text-sm">
                    <span className="text-muted-foreground">Riscos atuais do cargo:</span>{" "}
                    {riscosCargo.length === 0
                      ? <span className="text-xs text-muted-foreground">nenhum</span>
                      : riscosCargo.map(r => <Badge key={String(r.id)} variant="secondary" className="ml-1">{r.descricao}</Badge>)}
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
                      {cargos.map(c => <SelectItem key={String(c.id)} value={String(c.id)}>{c.nome}</SelectItem>)}
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
                    <TableHead>Realização</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examesFiltrados.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum exame encontrado. Cadastre cargos, riscos e exames, e vincule um cargo ao funcionário.
                    </TableCell></TableRow>
                  )}
                  {examesFiltrados.map(e => {
                    const f = funcionarios.find(x => sameId(x.id, e.id_funcionario));
                    const cat = exames.find(x => sameId(x.id, e.id_exame_ocupacional));
                    return (
                      <TableRow key={String(e.id)}>
                        <TableCell className="font-medium">{f?.nome || "—"}</TableCell>
                        <TableCell>{cat?.nome || "—"}</TableCell>
                        <TableCell>{fmt(e.dataRealizacao)}</TableCell>
                        <TableCell>{fmt(e.dataVencimento)}</TableCell>
                        <TableCell><StatusBadge s={e.situacao} /></TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="outline" onClick={() => abrirRegistrar(e)}>
                            <FileCheck2 className="h-3 w-3 mr-1" />Registrar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => emitirASO(e.id_funcionario)}>
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
              const f = funcionarios.find(x => sameId(x.id, a.id_funcionario));
              const cat = exames.find(x => sameId(x.id, a.id_exame_ocupacional));
              const color = a.nivel === "CRITICO" ? "border-red-500/40 bg-red-500/5" : "border-yellow-500/40 bg-yellow-500/5";
              return (
                <Card key={String(a.id)} className={`p-4 border-l-4 ${color} flex items-start justify-between gap-4`}>
                  <div className="flex gap-3">
                    <Bell className={`h-5 w-5 ${a.nivel === "CRITICO" ? "text-red-600" : "text-yellow-600"}`} />
                    <div>
                      <p className="font-semibold">{f?.nome || "Funcionário"} — {cat?.nome || "Exame"}</p>
                      <p className="text-sm text-muted-foreground">{a.mensagem}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vencimento: {fmt(a.dataVencimento)}
                        {a.diasParaVencer != null && ` • ${a.diasParaVencer} dia(s)`}
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
              <h3 className="font-semibold mb-3">Novo risco ocupacional</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Cargos são gerenciados em "Cadastro de Funcionários". Cada risco pertence a um cargo.
              </p>
              <div className="grid md:grid-cols-4 gap-3">
                <Input
                  placeholder="Descrição"
                  value={novoRisco.descricao}
                  onChange={e => setNovoRisco({ ...novoRisco, descricao: e.target.value })}
                  className="md:col-span-2"
                />
                <Select value={novoRisco.id_cargo} onValueChange={v => setNovoRisco({ ...novoRisco, id_cargo: v })}>
                  <SelectTrigger><SelectValue placeholder="Cargo" /></SelectTrigger>
                  <SelectContent>
                    {cargos.map(c => <SelectItem key={String(c.id)} value={String(c.id)}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={novoRisco.tipo} onValueChange={v => setNovoRisco({ ...novoRisco, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FISICO">Físico</SelectItem>
                    <SelectItem value="QUIMICO">Químico</SelectItem>
                    <SelectItem value="BIOLOGICO">Biológico</SelectItem>
                    <SelectItem value="ERGONOMICO">Ergonômico</SelectItem>
                    <SelectItem value="ACIDENTE">Acidente</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={novoRisco.nivel} onValueChange={v => setNovoRisco({ ...novoRisco, nivel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEVE">Leve</SelectItem>
                    <SelectItem value="MEDIO">Médio</SelectItem>
                    <SelectItem value="GRAVE">Grave</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addRisco} className="md:col-span-4 md:w-auto md:justify-self-end">
                  <Plus className="h-4 w-4 mr-1" />Adicionar
                </Button>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Risco</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Exames vinculados</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riscos.map(r => {
                    const exs = exames.filter(e => sameId(e.id_risco_ocupacional, r.id)).map(e => e.nome);
                    return (
                      <TableRow key={String(r.id)}>
                        <TableCell className="font-medium">{r.descricao}</TableCell>
                        <TableCell><Badge variant="outline" className="gap-1"><Briefcase className="h-3 w-3" />{cargoNome(r.id_cargo)}</Badge></TableCell>
                        <TableCell>{r.tipo}</TableCell>
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
              <p className="text-xs text-muted-foreground mb-3">
                Cada exame pertence a um risco ocupacional.
              </p>
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
                <Input type="number" min={1} placeholder="Periodicidade (meses)" value={novoExame.periodicidadeMeses} onChange={e => setNovoExame({ ...novoExame, periodicidadeMeses: Number(e.target.value) })} />
                <Select value={novoExame.id_risco_ocupacional} onValueChange={v => setNovoExame({ ...novoExame, id_risco_ocupacional: v })}>
                  <SelectTrigger><SelectValue placeholder="Risco" /></SelectTrigger>
                  <SelectContent>
                    {riscos.map(r => <SelectItem key={String(r.id)} value={String(r.id)}>{r.descricao}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={addExame} className="md:col-span-4 md:w-auto md:justify-self-end">
                  <Plus className="h-4 w-4 mr-1" />Adicionar
                </Button>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Risco</TableHead><TableHead>Periodicidade</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {exames.map(e => {
                    const r = riscos.find(x => sameId(x.id, e.id_risco_ocupacional));
                    return (
                      <TableRow key={String(e.id)}>
                        <TableCell className="font-medium">{e.nome}</TableCell>
                        <TableCell><Badge variant="secondary">{e.tipo}</Badge></TableCell>
                        <TableCell>{r?.descricao || "—"}</TableCell>
                        <TableCell>{e.periodicidadeMeses} meses</TableCell>
                        <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => delExame(e.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
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
