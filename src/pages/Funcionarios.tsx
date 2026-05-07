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
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Users, Plus, Search, Pencil, Trash2, Eye, Briefcase, UserPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  cargos as cargosApi,
  funcionarios as funcionariosApi,
  setores as setoresApi,
  type Cargo,
  type Funcionario,
  type FuncionarioStatus,
  type Setor,
  type ID,
} from "@/lib/api";

const formatCPF = (value: string) => {
  const n = value.replace(/\D/g, "").slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2");
};

interface FormState {
  matricula: string;
  nome: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  dataAdmissao: string;
  telefone: string;
  email: string;
  status: FuncionarioStatus;
  id_cargo: string;
  id_setor: string;
}

const empty: FormState = {
  matricula: "", nome: "", cpf: "", rg: "",
  dataNascimento: "", dataAdmissao: "",
  telefone: "", email: "",
  status: "ATIVO",
  id_cargo: "", id_setor: "",
};

const Funcionarios = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [empresaNome, setEmpresaNome] = useState("Sua Empresa");

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);

  const [novoCargo, setNovoCargo] = useState("");

  const [form, setForm] = useState<FormState>(empty);
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<Funcionario | null>(null);

  const [search, setSearch] = useState("");
  const [filtroCargo, setFiltroCargo] = useState<string>("TODOS");

  const cargoNome = (id?: ID | null) =>
    cargos.find(c => String(c.id) === String(id))?.nome || "—";
  const setorNome = (id?: ID | null) =>
    setores.find(s => String(s.id) === String(id))?.nome || "—";

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fn, cg, st] = await Promise.all([
        funcionariosApi.list(),
        cargosApi.list(),
        setoresApi.list(),
      ]);
      setFuncionarios(fn);
      setCargos(cg);
      setSetores(st);
    } catch (e: any) {
      toast.error(`Erro ao carregar dados: ${e.message}`);
    } finally {
      setLoading(false);
    }

    if (user) {
      const { data } = await supabase
        .from("profiles").select("razao_social").eq("user_id", user.id).maybeSingle();
      if (data?.razao_social) setEmpresaNome(data.razao_social);
    }
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [user]);

  const openNew = () => {
    setEditingId(null);
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (f: Funcionario) => {
    setEditingId(f.id);
    setForm({
      matricula: f.matricula || "",
      nome: f.nome,
      cpf: f.cpf || "",
      rg: f.rg || "",
      dataNascimento: f.dataNascimento || "",
      dataAdmissao: f.dataAdmissao || "",
      telefone: f.telefone || "",
      email: f.email || "",
      status: f.status || "ATIVO",
      id_cargo: f.id_cargo != null ? String(f.id_cargo) : "",
      id_setor: f.id_setor != null ? String(f.id_setor) : "",
    });
    setDialogOpen(true);
  };

  const addCargoRapido = async () => {
    if (!novoCargo.trim()) return;
    try {
      const created = await cargosApi.create({
        nome: novoCargo.trim(),
        id_setor: form.id_setor ? Number(form.id_setor) : undefined,
      });
      setCargos(prev => [...prev, created].sort((a, b) => a.nome.localeCompare(b.nome)));
      setForm(prev => ({ ...prev, id_cargo: String(created.id) }));
      setNovoCargo("");
      toast.success("Cargo cadastrado");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.matricula.trim() || !form.id_cargo || !form.id_setor) {
      return toast.error("Preencha matrícula, nome, cargo e setor");
    }
    const payload: Partial<Funcionario> = {
      matricula: form.matricula.trim(),
      nome: form.nome.trim(),
      cpf: form.cpf.trim() || null,
      rg: form.rg.trim() || null,
      dataNascimento: form.dataNascimento || null,
      dataAdmissao: form.dataAdmissao || null,
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      status: form.status,
      id_cargo: Number(form.id_cargo),
      id_setor: Number(form.id_setor),
    };

    try {
      if (editingId != null) {
        const updated = await funcionariosApi.update(editingId, payload);
        setFuncionarios(prev => prev.map(f => String(f.id) === String(editingId) ? updated : f));
        toast.success("Funcionário atualizado");
      } else {
        const created = await funcionariosApi.create(payload);
        setFuncionarios(prev => [...prev, created]
          .sort((a, b) => a.nome.localeCompare(b.nome)));
        toast.success("Funcionário cadastrado");
      }
      setDialogOpen(false);
      setForm(empty);
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const remove = async (id: ID) => {
    if (!confirm("Excluir este funcionário?")) return;
    try {
      await funcionariosApi.remove(id);
      setFuncionarios(prev => prev.filter(f => String(f.id) !== String(id)));
      toast.success("Funcionário excluído");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const lista = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = funcionarios.slice();
    if (filtroCargo !== "TODOS") arr = arr.filter(f => String(f.id_cargo) === filtroCargo);
    if (!q) return arr;
    const score = (f: Funcionario) => {
      const n = f.nome.toLowerCase();
      if (n === q) return 0;
      if (n.startsWith(q)) return 1;
      if (n.includes(q)) return 2;
      if ((f.cpf || "").toLowerCase().includes(q)) return 3;
      if ((f.matricula || "").toLowerCase().includes(q)) return 4;
      if (cargoNome(f.id_cargo).toLowerCase().includes(q)) return 5;
      if (setorNome(f.id_setor).toLowerCase().includes(q)) return 6;
      return 99;
    };
    return arr
      .map(f => ({ f, s: score(f) }))
      .filter(x => x.s < 99)
      .sort((a, b) => a.s - b.s || a.f.nome.localeCompare(b.f.nome))
      .map(x => x.f);
  }, [funcionarios, search, filtroCargo, cargos, setores]);

  const statusBadge = (s: FuncionarioStatus) => {
    const map: Record<string, string> = {
      ATIVO: "bg-green-500/10 text-green-700 border-green-500/30",
      INATIVO: "bg-gray-500/10 text-gray-700 border-gray-500/30",
      AFASTADO: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
    };
    return <Badge variant="outline" className={map[s] || ""}>{s}</Badge>;
  };

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

        <Card className="mb-4">
          <CardContent className="pt-6 grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF, matrícula, cargo ou setor..."
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
                    <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
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
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Admissão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lista.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                          {funcionarios.length === 0
                            ? "Nenhum funcionário cadastrado"
                            : "Nenhum resultado para os filtros aplicados"}
                        </TableCell>
                      </TableRow>
                    ) : lista.map(f => (
                      <TableRow key={String(f.id)}>
                        <TableCell className="text-xs font-mono">{f.matricula}</TableCell>
                        <TableCell className="font-medium">{f.nome}</TableCell>
                        <TableCell>{f.cpf || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Briefcase className="h-3 w-3" />{cargoNome(f.id_cargo)}
                          </Badge>
                        </TableCell>
                        <TableCell>{setorNome(f.id_setor)}</TableCell>
                        <TableCell>{statusBadge(f.status)}</TableCell>
                        <TableCell>
                          {f.dataAdmissao
                            ? format(new Date(f.dataAdmissao), "dd/MM/yyyy")
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Matrícula *</Label>
                <Input value={form.matricula} onChange={e => setForm({ ...form, matricula: e.target.value })} required />
              </div>
              <div>
                <Label>Status *</Label>
                <Select value={form.status} onValueChange={(v: FuncionarioStatus) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="INATIVO">Inativo</SelectItem>
                    <SelectItem value="AFASTADO">Afastado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Nome completo *</Label>
                <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div>
                <Label>CPF</Label>
                <Input
                  value={form.cpf}
                  onChange={e => setForm({ ...form, cpf: formatCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              <div>
                <Label>RG</Label>
                <Input value={form.rg} onChange={e => setForm({ ...form, rg: e.target.value })} />
              </div>
              <div>
                <Label>Setor *</Label>
                <Select value={form.id_setor} onValueChange={v => setForm({ ...form, id_setor: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um setor" /></SelectTrigger>
                  <SelectContent>
                    {setores.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        Nenhum setor cadastrado
                      </div>
                    )}
                    {setores.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cargo *</Label>
                <Select value={form.id_cargo} onValueChange={v => setForm({ ...form, id_cargo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um cargo" /></SelectTrigger>
                  <SelectContent>
                    {cargos.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        Cadastre um cargo abaixo
                      </div>
                    )}
                    {cargos.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
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
                <Label>Data de nascimento</Label>
                <Input type="date" value={form.dataNascimento}
                  onChange={e => setForm({ ...form, dataNascimento: e.target.value })} />
              </div>
              <div>
                <Label>Data de admissão</Label>
                <Input type="date" value={form.dataAdmissao}
                  onChange={e => setForm({ ...form, dataAdmissao: e.target.value })} />
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
              <Button type="submit">{editingId != null ? "Salvar" : "Cadastrar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{viewing?.nome}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-2 text-sm">
              <p><strong>Matrícula:</strong> {viewing.matricula}</p>
              <p><strong>Status:</strong> {viewing.status}</p>
              <p><strong>CPF:</strong> {viewing.cpf || "—"}</p>
              <p><strong>RG:</strong> {viewing.rg || "—"}</p>
              <p><strong>Cargo:</strong> {cargoNome(viewing.id_cargo)}</p>
              <p><strong>Setor:</strong> {setorNome(viewing.id_setor)}</p>
              <p><strong>Nascimento:</strong> {viewing.dataNascimento ? format(new Date(viewing.dataNascimento), "dd/MM/yyyy") : "—"}</p>
              <p><strong>Admissão:</strong> {viewing.dataAdmissao ? format(new Date(viewing.dataAdmissao), "dd/MM/yyyy") : "—"}</p>
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
