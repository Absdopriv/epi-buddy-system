import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldAlert, FileText, AlertTriangle, HardHat, ListChecks, Save, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ATIVIDADES, calcularRiscos, cruzarComEpisCadastrados } from "@/lib/seguranca-data";

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
  created_at: string;
}

const initialForm = {
  nome: "", setor: "", empresa: "", email: "", ptp: "",
  local: "", hora_inicio: "", hora_fim: "", outras_atividades: "",
};

const Seguranca = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [empresaNome, setEmpresaNome] = useState("Sua Empresa");
  const [form, setForm] = useState(initialForm);
  const [atividades, setAtividades] = useState<string[]>([]);
  const [episEmpresa, setEpisEmpresa] = useState<{ id: string; nome: string; tipo: string; ca: string }[]>([]);
  const [historico, setHistorico] = useState<FormularioRow[]>([]);
  const [saving, setSaving] = useState(false);

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
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("formularios_seguranca").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Formulário excluído.");
    fetchAll();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar empresaNome={empresaNome} />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Segurança do Trabalho</h1>
              </div>
            </div>
          </div>

          <Tabs defaultValue="novo" className="space-y-6">
            <TabsList>
              <TabsTrigger value="novo"><FileText className="h-4 w-4 mr-2" />Novo Formulário</TabsTrigger>
              <TabsTrigger value="historico"><ListChecks className="h-4 w-4 mr-2" />Histórico ({historico.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="novo">
              <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Etapa 1 */}
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Badge variant="secondary">1</Badge> Identificação
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Nome" id="nome" value={form.nome} onChange={v => setForm({ ...form, nome: v })} required />
                      <Field label="Setor" id="setor" value={form.setor} onChange={v => setForm({ ...form, setor: v })} required />
                      <Field label="Empresa" id="empresa" value={form.empresa} onChange={v => setForm({ ...form, empresa: v })} required />
                      <Field label="Email" id="email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} required />
                      <Field label="PTP (Permissão de Trabalho)" id="ptp" value={form.ptp} onChange={v => setForm({ ...form, ptp: v })} required />
                      <Field label="Local específico" id="local" value={form.local} onChange={v => setForm({ ...form, local: v })} required />
                      <Field label="Hora de início" id="hora_inicio" type="time" value={form.hora_inicio} onChange={v => setForm({ ...form, hora_inicio: v })} required />
                      <Field label="Hora de término" id="hora_fim" type="time" value={form.hora_fim} onChange={v => setForm({ ...form, hora_fim: v })} required />
                    </div>
                  </Card>

                  {/* Etapa 2 */}
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Badge variant="secondary">2</Badge> Atividades
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-3 mb-4">
                      {ATIVIDADES.map(a => (
                        <label key={a} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition">
                          <Checkbox checked={atividades.includes(a)} onCheckedChange={() => toggleAtividade(a)} />
                          <span className="text-sm font-medium">{a}</span>
                        </label>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="outras">Outras atividades</Label>
                      <Textarea id="outras" placeholder="Descreva outras atividades..."
                        value={form.outras_atividades}
                        onChange={(e) => setForm({ ...form, outras_atividades: e.target.value })} />
                    </div>
                  </Card>
                </div>

                {/* Painel dinâmico */}
                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" /> Riscos Identificados
                    </h3>
                    {calc.riscos.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Selecione atividades para visualizar os riscos.</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {calc.riscos.map(r => <li key={r} className="flex gap-2"><span className="text-destructive">•</span>{r}</li>)}
                      </ul>
                    )}
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                      <HardHat className="h-4 w-4" /> EPIs Recomendados
                    </h3>
                    {calc.epiTipos.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aguardando seleção de atividades.</p>
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
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                      <ListChecks className="h-4 w-4" /> Medidas de Controle
                    </h3>
                    {calc.medidas.length === 0 ? (
                      <p className="text-sm text-muted-foreground">—</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {calc.medidas.map(m => <li key={m} className="flex gap-2"><span className="text-primary">✓</span>{m}</li>)}
                      </ul>
                    )}
                  </Card>

                  <Button type="submit" className="w-full" size="lg" disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Salvando..." : "Registrar Formulário"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="historico">
              {historico.length === 0 ? (
                <Card className="p-10 text-center text-muted-foreground">
                  Nenhum formulário registrado ainda.
                </Card>
              ) : (
                <div className="space-y-3">
                  {historico.map(h => (
                    <Card key={h.id} className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{h.nome} — {h.setor}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(h.created_at).toLocaleString("pt-BR")} • PTP {h.ptp} • {h.local}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(h.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Atividades</p>
                          <div className="flex flex-wrap gap-1">
                            {h.atividades.map(a => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Riscos</p>
                          <p className="text-xs">{h.riscos.join(", ") || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">EPIs</p>
                          <p className="text-xs">{h.epis_sugeridos.join(", ") || "—"}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

const Field = ({ label, id, value, onChange, type = "text", required }: {
  label: string; id: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} required={required} />
  </div>
);

export default Seguranca;
