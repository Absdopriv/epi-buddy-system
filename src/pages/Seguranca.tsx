import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ShieldAlert, FileText, AlertTriangle, HardHat, ListChecks,
  Save, Trash2, Plus, FileSpreadsheet, Eye, Calendar, Building2, Bell,
  ClipboardList, Info, FolderOpen, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ATIVIDADES, calcularRiscos, cruzarComEpisCadastrados } from "@/lib/seguranca-data";
import { PenLine, Send } from "lucide-react";

interface FormularioRow {
  id: string;
  nome: string;
  setor: string;
  empresa: string;
  email: string;
  ptp: string;
  local: string;
  hora_inicio: string;
  hora_fim: string;
  atividades: string[];
  outras_atividades: string | null;
  riscos: string[];
  epis_sugeridos: string[];
  medidas_controle: string[];
  assinatura_responsavel_equipe?: string | null;
  assinatura_responsavel_site?: string | null;
  assinatura_tecnico_seguranca?: string | null;
  created_at: string;
}

const initialForm = {
  nome: "", setor: "", empresa: "", email: "", ptp: "",
  local: "", hora_inicio: "", hora_fim: "", outras_atividades: "",
  assinatura_responsavel_equipe: "",
  assinatura_responsavel_site: "",
  assinatura_tecnico_seguranca: "",
};

type View = "dashboard" | "novo" | "lista";

const Seguranca = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [empresaNome, setEmpresaNome] = useState("Sua Empresa");
  const [view, setView] = useState<View>("dashboard");
  const [form, setForm] = useState(initialForm);
  const [atividades, setAtividades] = useState<string[]>([]);
  const [episEmpresa, setEpisEmpresa] = useState<{ id: string; nome: string; tipo: string; ca: string }[]>([]);
  const [historico, setHistorico] = useState<FormularioRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<FormularioRow | null>(null);

  const fetchAll = async () => {
    if (!user) return;
    const [profileRes, episRes, formRes] = await Promise.all([
      supabase.from("profiles").select("razao_social").eq("user_id", user.id).single(),
      supabase.from("epis").select("id,nome,tipo,ca"),
      supabase.from("formularios_seguranca").select("*").order("created_at", { ascending: false }),
    ]);
    if (profileRes.data?.razao_social) {
      setEmpresaNome(profileRes.data.razao_social);
      setForm(f => ({ ...f, empresa: f.empresa || profileRes.data.razao_social }));
    }
    if (episRes.data) setEpisEmpresa(episRes.data);
    if (formRes.data) setHistorico(formRes.data as FormularioRow[]);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [user]);

  const calc = useMemo(() => calcularRiscos(atividades), [atividades]);
  const episSugeridos = useMemo(
    () => cruzarComEpisCadastrados(calc.epiTipos, episEmpresa),
    [calc.epiTipos, episEmpresa]
  );

  const stats = useMemo(() => {
    const now = new Date();
    const mes = now.getMonth(), ano = now.getFullYear();
    const doMes = historico.filter(h => {
      const d = new Date(h.created_at);
      return d.getMonth() === mes && d.getFullYear() === ano;
    }).length;
    const empresas = new Set(historico.map(h => h.empresa).filter(Boolean)).size;
    const alertas = historico.filter(h => h.riscos.length >= 5).length;
    return { total: historico.length, doMes, empresas, alertas };
  }, [historico]);

  const toggleAtividade = (a: string) => {
    setAtividades(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (atividades.length === 0 && !form.outras_atividades.trim()) {
      toast.error("Selecione ao menos uma atividade.");
      return;
    }
    setSaving(true);
    const episLabels = episSugeridos.length > 0
      ? episSugeridos.map(e => `${e.nome} (CA ${e.ca})`)
      : calc.epiTipos;

    const { error } = await supabase.from("formularios_seguranca").insert({
      user_id: user.id,
      ...form,
      atividades,
      outras_atividades: form.outras_atividades || null,
      riscos: calc.riscos,
      epis_sugeridos: episLabels,
      medidas_controle: calc.medidas,
    });
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar formulário: " + error.message);
      return;
    }
    toast.success("Formulário registrado com sucesso!");
    setForm({ ...initialForm, empresa: empresaNome });
    setAtividades([]);
    fetchAll();
    setView("dashboard");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("formularios_seguranca").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Formulário excluído.");
    fetchAll();
  };

  const exportarExcel = () => {
    if (historico.length === 0) {
      toast.error("Nenhum formulário para exportar.");
      return;
    }
    const headers = ["ID","Nome","Empresa","PTP","Setor","Local","Horário","Atividades","Riscos","EPIs Sugeridos","Medidas","Data"];
    const rows = historico.map(h => [
      h.id, h.nome, h.empresa, h.ptp, h.setor, h.local,
      `${h.hora_inicio} - ${h.hora_fim}`,
      h.atividades.join("; "),
      h.riscos.join("; "),
      h.epis_sugeridos.join("; "),
      h.medidas_controle.join("; "),
      new Date(h.created_at).toLocaleString("pt-BR"),
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Relatorio_Seguranca_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar empresaNome={empresaNome} />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Page header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-7 w-7 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Segurança do Trabalho</h1>
              </div>
            </div>
            {view === "dashboard" && (
              <Button onClick={() => setView("novo")} className="gap-2">
                <Plus className="h-4 w-4" /> Novo Formulário
              </Button>
            )}
            {view !== "dashboard" && (
              <Button variant="outline" onClick={() => setView("dashboard")} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Dashboard
              </Button>
            )}
          </div>

          {/* DASHBOARD */}
          {view === "dashboard" && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard icon={<FileText className="h-8 w-8" />} value={stats.total}
                  label="Formulários Totais" colorClass="bg-gradient-primary text-primary-foreground" />
                <StatCard icon={<Calendar className="h-8 w-8" />} value={stats.doMes}
                  label="Formulários do Mês" colorClass="bg-secondary-foreground text-background dark:bg-card dark:text-foreground border" />
                <StatCard icon={<Building2 className="h-8 w-8" />} value={stats.empresas}
                  label="Empresas Ativas" colorClass="bg-gradient-accent text-accent-foreground" />
                <StatCard icon={<Bell className="h-8 w-8" />} value={stats.alertas}
                  label="Alertas Pendentes" colorClass="bg-foreground text-background" />
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Recentes */}
                <Card className="lg:col-span-2 overflow-hidden">
                  <div className="bg-primary text-primary-foreground px-5 py-3 flex items-center gap-2 font-semibold">
                    <ClipboardList className="h-4 w-4" /> Formulários Recentes
                  </div>
                  <div className="p-2">
                    {historico.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum formulário encontrado.</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {historico.slice(0, 5).map(h => (
                          <div key={h.id}
                            className="p-4 hover:bg-muted/50 cursor-pointer transition flex items-start justify-between gap-4"
                            onClick={() => setViewing(h)}>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">
                                {h.setor} — {h.local}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">{h.empresa}</p>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(h.created_at).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge className="bg-success text-success-foreground hover:bg-success">Concluído</Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Eye className="h-3 w-3" /> Visualizar
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {historico.length > 0 && (
                      <div className="p-3 border-t">
                        <Button variant="outline" className="w-full" onClick={() => setView("lista")}>
                          Ver Todos os Formulários
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Sidebar */}
                <div className="space-y-4">
                  <Card className="overflow-hidden">
                    <div className="bg-accent text-accent-foreground px-5 py-3 flex items-center gap-2 font-semibold">
                      <Plus className="h-4 w-4" /> Acesso Rápido
                    </div>
                    <div className="p-4 space-y-2">
                      <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setView("novo")}>
                        <Plus className="h-4 w-4" /> Novo Formulário
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setView("lista")}>
                        <ListChecks className="h-4 w-4" /> Ver Formulários
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-2" onClick={exportarExcel}>
                        <FileSpreadsheet className="h-4 w-4" /> Exportar Relatórios
                      </Button>
                    </div>
                  </Card>

                  <Card className="overflow-hidden">
                    <div className="bg-primary text-primary-foreground px-5 py-3 flex items-center gap-2 font-semibold">
                      <Info className="h-4 w-4" /> Informações
                    </div>
                    <div className="p-4 text-sm space-y-2">
                      <p className="text-muted-foreground">Este sistema gerencia formulários de segurança incluindo:</p>
                      <ul className="space-y-1">
                        {ATIVIDADES.map(a => (
                          <li key={a} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />{a}
                          </li>
                        ))}
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />Outras atividades
                        </li>
                      </ul>
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}

          {/* NOVO FORMULÁRIO */}
          {view === "novo" && (
            <Card className="overflow-hidden">
              <div className="bg-primary text-primary-foreground px-6 py-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h2 className="text-xl font-bold">Formulário de Trabalho Seguro</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Etapa 1 */}
                  <section className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-primary mb-4 pb-2 border-b-2 border-primary inline-block">
                      Etapa 1: Identificação
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Nome dos Trabalhadores" id="nome" value={form.nome} onChange={v => setForm({ ...form, nome: v })} required />
                      <Field label="Empresa" id="empresa" value={form.empresa} onChange={v => setForm({ ...form, empresa: v })} required />
                      <Field label="Setor" id="setor" value={form.setor} onChange={v => setForm({ ...form, setor: v })} required />
                      <Field label="Número do PTP" id="ptp" value={form.ptp} onChange={v => setForm({ ...form, ptp: v })} required />
                      <div className="sm:col-span-2">
                        <Field label="Local Específico do Trabalho" id="local" value={form.local} onChange={v => setForm({ ...form, local: v })} required />
                      </div>
                      <Field label="Email" id="email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} required />
                      <div />
                      <Field label="Hora de Início" id="hora_inicio" type="time" value={form.hora_inicio} onChange={v => setForm({ ...form, hora_inicio: v })} required />
                      <Field label="Previsão de Término" id="hora_fim" type="time" value={form.hora_fim} onChange={v => setForm({ ...form, hora_fim: v })} required />
                    </div>
                  </section>

                  {/* Etapa 2 */}
                  <section>
                    <h3 className="text-lg font-semibold text-primary mb-4 pb-2 border-b-2 border-primary inline-block">
                      Etapa 2: Tipo de Trabalho
                    </h3>
                    <div className="bg-muted/50 rounded-lg border p-4 space-y-2 mb-4">
                      {ATIVIDADES.map(a => (
                        <label key={a} className="flex items-center gap-3 cursor-pointer hover:bg-background rounded p-2 transition">
                          <Checkbox checked={atividades.includes(a)} onCheckedChange={() => toggleAtividade(a)} />
                          <span className="text-sm font-medium">{a}</span>
                        </label>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="outras">Outras atividades (especifique)</Label>
                      <Textarea id="outras" placeholder="Descreva outras atividades..."
                        value={form.outras_atividades}
                        onChange={(e) => setForm({ ...form, outras_atividades: e.target.value })} />
                    </div>
                  </section>

                  {/* Etapa 3: Assinaturas */}
                  <section>
                    <h3 className="text-lg font-semibold text-primary mb-4 pb-2 border-b-2 border-primary inline-flex items-center gap-2">
                      <PenLine className="h-5 w-5" /> Etapa 3: Assinaturas
                    </h3>
                    <div className="space-y-4">
                      <Field label="Assinatura do Responsável da Equipe de Trabalho" id="ass_equipe"
                        value={form.assinatura_responsavel_equipe}
                        onChange={v => setForm({ ...form, assinatura_responsavel_equipe: v })} required />
                      <Field label="Assinatura do Responsável do Site" id="ass_site"
                        value={form.assinatura_responsavel_site}
                        onChange={v => setForm({ ...form, assinatura_responsavel_site: v })} required />
                      <Field label="Assinatura do Técnico de Segurança" id="ass_tecnico"
                        value={form.assinatura_tecnico_seguranca}
                        onChange={v => setForm({ ...form, assinatura_tecnico_seguranca: v })} required />
                    </div>
                  </section>

                  <Button type="submit" className="w-full" size="lg" disabled={saving}>
                    <Send className="h-4 w-4 mr-2" />
                    {saving ? "Enviando..." : "Enviar Formulário"}
                  </Button>
                </div>

                {/* Painel lateral dinâmico */}
                <div className="space-y-4">
                  <Card className="overflow-hidden">
                    <div className="bg-destructive text-destructive-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Riscos Identificados
                    </div>
                    <div className="p-4">
                      {calc.riscos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Selecione atividades para visualizar.</p>
                      ) : (
                        <ul className="space-y-1 text-sm">
                          {calc.riscos.map(r => <li key={r} className="flex gap-2"><span className="text-destructive">•</span>{r}</li>)}
                        </ul>
                      )}
                    </div>
                  </Card>

                  <Card className="overflow-hidden">
                    <div className="bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2">
                      <HardHat className="h-4 w-4" /> EPIs Recomendados
                    </div>
                    <div className="p-4">
                      {calc.epiTipos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aguardando seleção.</p>
                      ) : (
                        <div className="space-y-3">
                          {episSugeridos.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Disponíveis na empresa:</p>
                              <div className="flex flex-wrap gap-1">
                                {episSugeridos.map(e => (
                                  <Badge key={e.id} variant="default" className="text-xs">{e.nome} (CA {e.ca})</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Necessários:</p>
                            <div className="flex flex-wrap gap-1">
                              {calc.epiTipos.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="overflow-hidden">
                    <div className="bg-accent text-accent-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2">
                      <ListChecks className="h-4 w-4" /> Medidas de Controle
                    </div>
                    <div className="p-4">
                      {calc.medidas.length === 0 ? (
                        <p className="text-sm text-muted-foreground">—</p>
                      ) : (
                        <ul className="space-y-1 text-sm">
                          {calc.medidas.map(m => <li key={m} className="flex gap-2"><span className="text-primary">✓</span>{m}</li>)}
                        </ul>
                      )}
                    </div>
                  </Card>
                </div>
              </form>
            </Card>
          )}

          {/* LISTA */}
          {view === "lista" && (
            <Card className="overflow-hidden">
              <div className="bg-primary text-primary-foreground px-5 py-3 flex items-center justify-between">
                <span className="font-semibold flex items-center gap-2">
                  <ListChecks className="h-4 w-4" /> Todos os Formulários ({historico.length})
                </span>
                <Button size="sm" variant="secondary" onClick={exportarExcel} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" /> Exportar
                </Button>
              </div>
              {historico.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  Nenhum formulário registrado.
                </div>
              ) : (
                <div className="divide-y">
                  {historico.map(h => (
                    <div key={h.id} className="p-5 hover:bg-muted/30 transition">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-foreground">{h.nome} — {h.setor}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(h.created_at).toLocaleString("pt-BR")} • PTP {h.ptp} • {h.local}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewing(h)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(h.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-3 text-sm">
                        <InfoBlock label="Atividades">
                          <div className="flex flex-wrap gap-1">
                            {h.atividades.map(a => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}
                          </div>
                        </InfoBlock>
                        <InfoBlock label="Riscos">
                          <p className="text-xs">{h.riscos.join(", ") || "—"}</p>
                        </InfoBlock>
                        <InfoBlock label="EPIs">
                          <p className="text-xs">{h.epis_sugeridos.join(", ") || "—"}</p>
                        </InfoBlock>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </main>

      {/* Modal de visualização */}
      {viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-primary text-primary-foreground px-5 py-3 flex items-center justify-between">
              <span className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" /> Formulário #{viewing.id.slice(0, 8)}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setViewing(null)} className="text-primary-foreground hover:bg-primary-foreground/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <InfoBlock label="Nome">{viewing.nome}</InfoBlock>
                <InfoBlock label="Empresa">{viewing.empresa}</InfoBlock>
                <InfoBlock label="Setor">{viewing.setor}</InfoBlock>
                <InfoBlock label="PTP">{viewing.ptp}</InfoBlock>
                <InfoBlock label="Local">{viewing.local}</InfoBlock>
                <InfoBlock label="Email">{viewing.email}</InfoBlock>
                <InfoBlock label="Horário">{viewing.hora_inicio} - {viewing.hora_fim}</InfoBlock>
                <InfoBlock label="Data">{new Date(viewing.created_at).toLocaleString("pt-BR")}</InfoBlock>
              </div>
              <InfoBlock label="Atividades">
                <div className="flex flex-wrap gap-1">
                  {viewing.atividades.map(a => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}
                </div>
              </InfoBlock>
              {viewing.outras_atividades && (
                <InfoBlock label="Outras atividades"><p className="text-sm">{viewing.outras_atividades}</p></InfoBlock>
              )}
              <InfoBlock label="Riscos">
                <ul className="text-sm space-y-1">
                  {viewing.riscos.map(r => <li key={r} className="flex gap-2"><span className="text-destructive">•</span>{r}</li>)}
                </ul>
              </InfoBlock>
              <InfoBlock label="EPIs Sugeridos">
                <div className="flex flex-wrap gap-1">
                  {viewing.epis_sugeridos.map(e => <Badge key={e} className="text-xs">{e}</Badge>)}
                </div>
              </InfoBlock>
              <InfoBlock label="Medidas de Controle">
                <ul className="text-sm space-y-1">
                  {viewing.medidas_controle.map(m => <li key={m} className="flex gap-2"><span className="text-primary">✓</span>{m}</li>)}
                </ul>
              </InfoBlock>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, value, label, colorClass }: {
  icon: React.ReactNode; value: number; label: string; colorClass: string;
}) => (
  <Card className={`p-5 ${colorClass} border-0`}>
    <div className="opacity-90 mb-2">{icon}</div>
    <div className="text-3xl font-bold">{value}</div>
    <div className="text-sm opacity-90">{label}</div>
  </Card>
);

const InfoBlock = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{label}</p>
    <div>{children}</div>
  </div>
);

const Field = ({ label, id, value, onChange, type = "text", required }: {
  label: string; id: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-foreground font-semibold">{label}</Label>
    <Input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} required={required} />
  </div>
);

export default Seguranca;
