import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Users, Plus, Search, Pencil, Trash2, Eye, Briefcase, UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

type Cargo = { id: string; nome: string };
type FuncionarioRow = {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  cargo_id: string | null;
  setor: string;
  data_nascimento: string | null;
  data_admissao: string | null;
  rg: string | null;
  telefone: string | null;
  email: string | null;
};

const formatCPF = (value: string) => {
  const n = value.replace(/\D/g, "").slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2");
};

const empty = {
  nome: "", cpf: "", cargo_id: "", setor: "",
  data_nascimento: "", data_admissao: "",
  rg: "", telefone: "", email: "",
};

const Funcionarios = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [empresaNome, setEmpresaNome] = useState("Sua Empresa");
  const [funcionarios, setFuncionarios] = useState<FuncionarioRow[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);

  // Cadastro de cargo rápido
  const [novoCargo, setNovoCargo] = useState("");

  // Form (criar/editar)
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<FuncionarioRow | null>(null);

  // Busca + filtro
  const [search, setSearch] = useState("");
  const [filtroCargo, setFiltroCargo] = useState<string>("TODOS");

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const [pf, fn, cg] = await Promise.all([
      supabase.from("profiles").select("razao_social").eq("user_id", user.id).maybeSingle(),
      supabase.from("funcionarios").select("*").order("nome"),
      supabase.from("cargos").select("id,nome").order("nome"),
    ]);
    if (pf.data?.razao_social) setEmpresaNome(pf.data.razao_social);
    setFuncionarios((fn.data || []) as FuncionarioRow[]);
    setCargos((cg.data || []) as Cargo[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [user]);

  const openNew = () => {
    setEditingId(null);
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (f: FuncionarioRow) => {
    setEditingId(f.id);
    setForm({
      nome: f.nome,
      cpf: f.cpf,
      cargo_id: f.cargo_id || "",
      setor: f.setor || "",
      data_nascimento: f.data_nascimento || "",
      data_admissao: f.data_admissao || "",
      rg: f.rg || "",
      telefone: f.telefone || "",
      email: f.email || "",
    });
    setDialogOpen(true);
  };

  const addCargoRapido = async () => {
    if (!user || !novoCargo.trim()) return;
    const { data, error } = await supabase
      .from("cargos")
      .insert({ user_id: user.id, nome: novoCargo.trim() })
      .select().single();
    if (error) return toast.error(error.message);
    setCargos(prev => [...prev, data as Cargo].sort((a, b) => a.nome.localeCompare(b.nome)));
    setForm(prev => ({ ...prev, cargo_id: data.id }));
    setNovoCargo("");
    toast.success("Cargo cadastrado");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.nome.trim() || !form.cpf.trim() || !form.cargo_id || !form.setor.trim()) {
      return toast.error("Preencha nome, CPF, cargo e setor");
    }
    const cargoNome = cargos.find(c => c.id === form.cargo_id)?.nome || "";
    const payload = {
      user_id: user.id,
      nome: form.nome.trim(),
      cpf: form.cpf.trim(),
      cargo: cargoNome,
      cargo_id: form.cargo_id,
      setor: form.setor.trim(),
      data_nascimento: form.data_nascimento || null,
      data_admissao: form.data_admissao || null,
      rg: form.rg.trim() || null,
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("funcionarios").update(payload).eq("id", editingId).select().single();
      if (error) return toast.error(error.message);
      setFuncionarios(prev => prev.map(f => f.id === editingId ? (data as FuncionarioRow) : f));
      toast.success("Funcionário atualizado");
    } else {
      const { data, error } = await supabase
        .from("funcionarios").insert(payload).select().single();
      if (error) return toast.error(error.message);
      setFuncionarios(prev => [...prev, data as FuncionarioRow]
        .sort((a, b) => a.nome.localeCompare(b.nome)));
      toast.success("Funcionário cadastrado");
    }
    setDialogOpen(false);
    setForm(empty);
    setEditingId(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este funcionário? Atribuições de EPI e exames serão removidos.")) return;
    const { error } = await supabase.from("funcionarios").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setFuncionarios(prev => prev.filter(f => f.id !== id));
    toast.success("Funcionário excluído");
  };

  // Busca + filtro com prioridade por relevância
  const lista = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = funcionarios.slice();
    if (filtroCargo !== "TODOS") arr = arr.filter(f => f.cargo_id === filtroCargo);
    if (!q) return arr;
    const score = (f: FuncionarioRow) => {
      const n = f.nome.toLowerCase();
      if (n === q) return 0;
      if (n.startsWith(q)) return 1;
      if (n.includes(q)) return 2;
      if ((f.cpf || "").toLowerCase().includes(q)) return 3;
      if ((f.cargo || "").toLowerCase().includes(q)) return 4;
      if ((f.setor || "").toLowerCase().includes(q)) return 5;
      return 99;
    };
    return arr
      .map(f => ({ f, s: score(f) }))
      .filter(x => x.s < 99)
      .sort((a, b) => a.s - b.s || a.f.nome.localeCompare(b.f.nome))
      .map(x => x.f);
  }, [funcionarios, search, filtroCargo]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar empresaNome={empresaNome} />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-7xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#2c3e50] to-[#4a69bd] text-white">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Cadastro de Funcionários</h1>
              <p className="text-sm text-muted-foreground">
                Fonte única de funcionários e cargos do sistema
              </p>
            </div>
          </div>
          <Button onClick={openNew}>
            <UserPlus className="h-4 w-4 mr-2" /> Novo Funcionário
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-4">
          <CardContent className="pt-6 grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF, cargo ou setor..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={filtroCargo} onValueChange={setFiltroCargo}>
                <SelectTrigger><SelectValue placeholder="Filtrar por cargo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os cargos</SelectItem>
                  {cargos.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-gradient-primary">
            <CardTitle className="text-primary-foreground flex items-center justify-between">
              <span>Funcionários</span>
              <Badge variant="secondary">{lista.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="py-10 flex justify-center">
                <div className="animate-spin h-6 w-6 border-b-2 border-primary rounded-full" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Admissão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lista.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                          {funcionarios.length === 0
                            ? "Nenhum funcionário cadastrado"
                            : "Nenhum resultado para os filtros aplicados"}
                        </TableCell>
                      </TableRow>
                    ) : lista.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.nome}</TableCell>
                        <TableCell>{f.cpf}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Briefcase className="h-3 w-3" />{f.cargo || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>{f.setor || "—"}</TableCell>
                        <TableCell>
                          {f.data_admissao
                            ? format(new Date(f.data_admissao), "dd/MM/yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="icon" variant="outline" onClick={() => setViewing(f)} title="Visualizar">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => openEdit(f)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => remove(f.id)} title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialog Cadastro/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Nome completo *</Label>
                <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div>
                <Label>CPF *</Label>
                <Input
                  value={form.cpf}
                  onChange={e => setForm({ ...form, cpf: formatCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </div>
              <div>
                <Label>RG</Label>
                <Input value={form.rg} onChange={e => setForm({ ...form, rg: e.target.value })} />
              </div>
              <div>
                <Label>Cargo *</Label>
                <Select value={form.cargo_id} onValueChange={v => setForm({ ...form, cargo_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um cargo" /></SelectTrigger>
                  <SelectContent>
                    {cargos.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        Cadastre um cargo abaixo
                      </div>
                    )}
                    {cargos.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Cadastrar novo cargo"
                    value={novoCargo}
                    onChange={e => setNovoCargo(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCargoRapido(); } }}
                  />
                  <Button type="button" variant="outline" onClick={addCargoRapido}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Setor *</Label>
                <Input value={form.setor} onChange={e => setForm({ ...form, setor: e.target.value })} required />
              </div>
              <div>
                <Label>Data de nascimento</Label>
                <Input type="date" value={form.data_nascimento}
                  onChange={e => setForm({ ...form, data_nascimento: e.target.value })} />
              </div>
              <div>
                <Label>Data de admissão</Label>
                <Input type="date" value={form.data_admissao}
                  onChange={e => setForm({ ...form, data_admissao: e.target.value })} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>E-mail</Label>
                <Input type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingId ? "Salvar" : "Cadastrar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Visualização */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{viewing?.nome}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-2 text-sm">
              <p><strong>CPF:</strong> {viewing.cpf}</p>
              <p><strong>RG:</strong> {viewing.rg || "—"}</p>
              <p><strong>Cargo:</strong> {viewing.cargo || "—"}</p>
              <p><strong>Setor:</strong> {viewing.setor || "—"}</p>
              <p><strong>Nascimento:</strong> {viewing.data_nascimento ? format(new Date(viewing.data_nascimento), "dd/MM/yyyy") : "—"}</p>
              <p><strong>Admissão:</strong> {viewing.data_admissao ? format(new Date(viewing.data_admissao), "dd/MM/yyyy") : "—"}</p>
              <p><strong>Telefone:</strong> {viewing.telefone || "—"}</p>
              <p><strong>E-mail:</strong> {viewing.email || "—"}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Funcionarios;
