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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, addMonths, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { generateASOPdf } from "@/lib/asoPdf";

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

const fmt = (d?: string | null) => (d ? format(new Date(d), "dd/MM/yyyy", { locale: ptBR }) : "—");

const ExameAdmissional = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [empresaNome, setEmpresaNome] = useState("Sua Empresa");

  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [riscos, setRiscos] = useState<Risco[]>([]);
  const [exames, setExames] = useState<ExameOcup[]>([]);
  const [cargoRiscos, setCargoRiscos] = useState<{ cargo_id: string; risco_id: string }[]>([]);
  const [riscoExames, setRiscoExames] = useState<{ risco_id: string; exame_id: string }[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [examesFunc, setExamesFunc] = useState<ExameFunc[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [empresa, setEmpresa] = useState<{ razao_social: string | null; cnpj: string | null }>({ razao_social: null, cnpj: null });

  // forms
  const [novoCargo, setNovoCargo] = useState({ nome: "", descricao: "" });
  const [novoRisco, setNovoRisco] = useState({ descricao: "", nivel: "medio", tipo: "" });
  const [novoExame, setNovoExame] = useState({ nome: "", tipo: "Clínico", periodicidade_meses: 12 });

  const [vincCargo, setVincCargo] = useState<string>("");
  const [vincRisco, setVincRisco] = useState<string>("");
  const [vincRiscoEx, setVincRiscoEx] = useState<string>("");
  const [vincExameEx, setVincExameEx] = useState<string>("");

  const [filtros, setFiltros] = useState({ funcionario: "", situacao: "TODOS", cargo: "TODOS" });
  const [registrar, setRegistrar] = useState<ExameFunc | null>(null);
  const [regForm, setRegForm] = useState({ data_realizacao: "", resultado: "APTO", medico_responsavel: "", crm_medico: "", observacoes: "" });

  const fetchAll = async () => {
    if (!user) return;
    const [pf, c, r, ex, cr, re, fn, ef, al] = await Promise.all([
      supabase.from("profiles").select("razao_social,cnpj").eq("user_id", user.id).maybeSingle(),
      supabase.from("cargos").select("*").order("nome"),
      supabase.from("riscos_ocupacionais").select("*").order("descricao"),
      supabase.from("exames_ocupacionais").select("*").order("nome"),
      supabase.from("cargo_riscos").select("cargo_id,risco_id"),
      supabase.from("risco_exames").select("risco_id,exame_id"),
      supabase.from("funcionarios").select("*").order("nome"),
      supabase.from("exames_funcionario").select("*").order("created_at", { ascending: false }),
      supabase.from("alertas").select("*").order("created_at", { ascending: false }),
    ]);
    if (pf.data) { setEmpresa(pf.data); setEmpresaNome(pf.data.razao_social || "Sua Empresa"); }
    setCargos(c.data || []);
    setRiscos(r.data || []);
    setExames(ex.data || []);
    setCargoRiscos(cr.data || []);
    setRiscoExames(re.data || []);
    setFuncionarios((fn.data || []) as Funcionario[]);
    setExamesFunc((ef.data || []) as ExameFunc[]);
    setAlertas((al.data || []) as Alerta[]);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [user]);

  // --- recalcular alertas automáticos
  useEffect(() => {
    if (!user || examesFunc.length === 0) return;
    (async () => {
      const hoje = new Date();
      const novosAlertas: any[] = [];
      for (const e of examesFunc) {
        let nivel = ""; let mensagem = ""; let dias: number | null = null;
        if (e.situacao === "PENDENTE") {
          nivel = "WARN";
          mensagem = "Exame admissional pendente";
        } else if (e.data_vencimento) {
          dias = differenceInDays(new Date(e.data_vencimento), hoje);
          if (dias < 0) { nivel = "CRITICO"; mensagem = `Exame vencido há ${Math.abs(dias)} dias`; }
          else if (dias <= 30) { nivel = "WARN"; mensagem = `Exame vence em ${dias} dias`; }
        }
        if (nivel) {
          const existe = alertas.find(a => a.exame_funcionario_id === e.id && !a.resolvido);
          if (!existe) {
            novosAlertas.push({
              user_id: user.id,
              funcionario_id: e.funcionario_id,
              exame_funcionario_id: e.id,
              exame_ocupacional_id: e.exame_id,
              data_vencimento: e.data_vencimento,
              dias_para_vencer: dias,
              nivel, mensagem, resolvido: false,
            });
          }
        }
      }
      if (novosAlertas.length > 0) {
        await supabase.from("alertas").insert(novosAlertas);
        const { data } = await supabase.from("alertas").select("*").order("created_at", { ascending: false });
        setAlertas((data || []) as Alerta[]);
      }
    })();
    // eslint-disable-next-line
  }, [examesFunc.length]);

  const audit = async (tabela: string, registro_id: string, acao: string, antes: any, depois: any) => {
    if (!user) return;
    await supabase.from("auditoria").insert({ user_id: user.id, tabela, registro_id, acao, dados_antes: antes, dados_depois: depois });
  };

  // --- CRUD catálogos
  const addCargo = async () => {
    if (!user || !novoCargo.nome.trim()) return;
    const { data, error } = await supabase.from("cargos").insert({ user_id: user.id, ...novoCargo }).select().single();
    if (error) return toast.error(error.message);
    toast.success("Cargo cadastrado");
    setNovoCargo({ nome: "", descricao: "" });
    setCargos([...cargos, data as Cargo]);
    audit("cargos", data.id, "CREATE", null, data);
  };
  const delCargo = async (id: string) => {
    const antes = cargos.find(c => c.id === id);
    const { error } = await supabase.from("cargos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setCargos(cargos.filter(c => c.id !== id));
    audit("cargos", id, "DELETE", antes, null);
    toast.success("Removido");
  };

  const addRisco = async () => {
    if (!user || !novoRisco.descricao.trim()) return;
    const { data, error } = await supabase.from("riscos_ocupacionais").insert({ user_id: user.id, ...novoRisco }).select().single();
    if (error) return toast.error(error.message);
    setRiscos([...riscos, data as Risco]);
    setNovoRisco({ descricao: "", nivel: "medio", tipo: "" });
    audit("riscos_ocupacionais", data.id, "CREATE", null, data);
    toast.success("Risco cadastrado");
  };
  const delRisco = async (id: string) => {
    const antes = riscos.find(r => r.id === id);
    const { error } = await supabase.from("riscos_ocupacionais").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRiscos(riscos.filter(r => r.id !== id));
    audit("riscos_ocupacionais", id, "DELETE", antes, null);
  };

  const addExame = async () => {
    if (!user || !novoExame.nome.trim()) return;
    const { data, error } = await supabase.from("exames_ocupacionais").insert({ user_id: user.id, ...novoExame }).select().single();
    if (error) return toast.error(error.message);
    setExames([...exames, data as ExameOcup]);
    setNovoExame({ nome: "", tipo: "Clínico", periodicidade_meses: 12 });
    audit("exames_ocupacionais", data.id, "CREATE", null, data);
    toast.success("Exame cadastrado");
  };
  const delExame = async (id: string) => {
    const antes = exames.find(e => e.id === id);
    const { error } = await supabase.from("exames_ocupacionais").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setExames(exames.filter(e => e.id !== id));
    audit("exames_ocupacionais", id, "DELETE", antes, null);
  };

  // vínculos
  const vincularCargoRisco = async () => {
    if (!user || !vincCargo || !vincRisco) return;
    const { error } = await supabase.from("cargo_riscos").insert({ user_id: user.id, cargo_id: vincCargo, risco_id: vincRisco });
    if (error) return toast.error(error.message);
    setCargoRiscos([...cargoRiscos, { cargo_id: vincCargo, risco_id: vincRisco }]);
    toast.success("Risco vinculado ao cargo");
  };
  const vincularRiscoExame = async () => {
    if (!user || !vincRiscoEx || !vincExameEx) return;
    const { error } = await supabase.from("risco_exames").insert({ user_id: user.id, risco_id: vincRiscoEx, exame_id: vincExameEx });
    if (error) return toast.error(error.message);
    setRiscoExames([...riscoExames, { risco_id: vincRiscoEx, exame_id: vincExameEx }]);
    toast.success("Exame vinculado ao risco");
  };

  // --- Registrar exame realizado
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
    if (!registrar || !user) return;
    const exame = exames.find(x => x.id === registrar.exame_id);
    const periodicidade = exame?.periodicidade_meses || 12;
    const dataReal = new Date(regForm.data_realizacao);
    const venc = addMonths(dataReal, periodicidade);
    const update = {
      data_realizacao: regForm.data_realizacao,
      data_vencimento: format(venc, "yyyy-MM-dd"),
      resultado: regForm.resultado,
      situacao: "CONCLUIDO",
      medico_responsavel: regForm.medico_responsavel,
      crm_medico: regForm.crm_medico,
      observacoes: regForm.observacoes,
    };
    const { data, error } = await supabase.from("exames_funcionario").update(update).eq("id", registrar.id).select().single();
    if (error) return toast.error(error.message);
    setExamesFunc(examesFunc.map(e => e.id === registrar.id ? data as ExameFunc : e));
    audit("exame_funcionario", registrar.id, "UPDATE", registrar, data);
    toast.success("Exame registrado e vencimento calculado");
    setRegistrar(null);
  };

  const excluirExame = async (id: string) => {
    if (!confirm("Remover este exame? Será registrado em auditoria.")) return;
    const antes = examesFunc.find(e => e.id === id);
    const { error } = await supabase.from("exames_funcionario").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setExamesFunc(examesFunc.filter(e => e.id !== id));
    audit("exame_funcionario", id, "DELETE", antes, null);
    toast.success("Exame removido");
  };

  // --- Emitir ASO
  const emitirASO = async (funcionarioId: string) => {
    if (!user) return;
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
      .sort((a, b) => a.getTime() - b.getTime())[0];
    const medico = examesDoFunc.find(e => e.medico_responsavel)?.medico_responsavel || "";
    const crm = examesDoFunc.find(e => e.crm_medico)?.crm_medico || "";

    const novoAso = {
      user_id: user.id,
      funcionario_id: funcionarioId,
      tipo_exame: "Admissional",
      data_emissao: format(new Date(), "yyyy-MM-dd"),
      aptidao,
      restricoes: inaptos.map(i => i.observacoes).filter(Boolean).join("; ") || null,
      proximo_aso: proximaData ? format(proximaData, "yyyy-MM-dd") : null,
      medico_responsavel: medico,
      crm_medico: crm,
    };
    const { data, error } = await supabase.from("asos").insert(novoAso).select().single();
    if (error) return toast.error(error.message);
    audit("asos", data.id, "CREATE", null, data);

    generateASOPdf({
      empresa,
      funcionario: { ...f },
      aso: novoAso,
      exames: examesDoFunc.map(ef => {
        const cat = exames.find(x => x.id === ef.exame_id);
        return { nome: cat?.nome || "—", tipo: cat?.tipo || "—", data_realizacao: ef.data_realizacao, resultado: ef.resultado };
      }),
    });
    toast.success("ASO emitido e PDF gerado");
  };

  const resolverAlerta = async (id: string) => {
    const { error } = await supabase.from("alertas").update({ resolvido: true }).eq("id", id);
    if (error) return toast.error(error.message);
    setAlertas(alertas.map(a => a.id === id ? { ...a, resolvido: true } : a));
  };

  // --- filtros
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

        <Tabs defaultValue="exames">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-1 mb-6">
            <TabsTrigger value="exames"><Activity className="h-4 w-4 mr-1" />Exames</TabsTrigger>
            <TabsTrigger value="alertas"><Bell className="h-4 w-4 mr-1" />Alertas{alertasAtivos.length > 0 && <Badge className="ml-2 h-5 px-1.5">{alertasAtivos.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="cargos"><Briefcase className="h-4 w-4 mr-1" />Cargos</TabsTrigger>
            <TabsTrigger value="riscos"><AlertTriangle className="h-4 w-4 mr-1" />Riscos</TabsTrigger>
            <TabsTrigger value="catalogo"><ClipboardList className="h-4 w-4 mr-1" />Exames Cat.</TabsTrigger>
          </TabsList>

          {/* ===== EXAMES DOS FUNCIONÁRIOS ===== */}
          <TabsContent value="exames" className="space-y-4">
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
              const ef = examesFunc.find(x => x.id === a.exame_funcionario_id);
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
                        Vencimento: {fmt(a.data_vencimento)} • {format(new Date(a.created_at), "dd/MM HH:mm")}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => resolverAlerta(a.id)}>Resolver</Button>
                </Card>
              );
            })}
          </TabsContent>

          {/* ===== CARGOS ===== */}
          <TabsContent value="cargos" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Plus className="h-4 w-4" />Novo cargo</h3>
              <div className="grid md:grid-cols-3 gap-3">
                <Input placeholder="Nome do cargo" value={novoCargo.nome} onChange={e => setNovoCargo({ ...novoCargo, nome: e.target.value })} />
                <Input placeholder="Descrição (opcional)" value={novoCargo.descricao} onChange={e => setNovoCargo({ ...novoCargo, descricao: e.target.value })} className="md:col-span-2" />
                <Button onClick={addCargo}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Vincular risco a cargo</h3>
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
            </Card>

            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Cargo</TableHead><TableHead>Riscos vinculados</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {cargos.map(c => {
                    const rs = cargoRiscos.filter(x => x.cargo_id === c.id).map(x => riscos.find(r => r.id === x.risco_id)?.descricao).filter(Boolean);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.nome}</TableCell>
                        <TableCell><div className="flex flex-wrap gap-1">{rs.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}</div></TableCell>
                        <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => delCargo(c.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ===== RISCOS ===== */}
          <TabsContent value="riscos" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Novo risco ocupacional</h3>
              <div className="grid md:grid-cols-4 gap-3">
                <Input placeholder="Descrição" value={novoRisco.descricao} onChange={e => setNovoRisco({ ...novoRisco, descricao: e.target.value })} className="md:col-span-2" />
                <Select value={novoRisco.nivel} onValueChange={v => setNovoRisco({ ...novoRisco, nivel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="grave">Grave</SelectItem>
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
