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
import { toast } from "sonner";
import { format } from "date-fns";
import {
  BkFuncionario, BkCargo, BkSetor,
  listarFuncionarios, criarFuncionario, atualizarFuncionario, deletarFuncionario,
  listarCargos, criarCargo,
  listarSetores, criarSetor,
} from "@/lib/admissionalApi";

const STATUS_OPTIONS = ["ATIVO", "INATIVO", "AFASTADO"];

const empty = {
  matricula: "", nome: "", dataAdmissao: "",
  status: "ATIVO", id_cargo: "", id_setor: "",
};

const Funcionarios = () => {
  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState<BkFuncionario[]>([]);
  const [cargos, setCargos] = useState<BkCargo[]>([]);
  const [setores, setSetores] = useState<BkSetor[]>([]);
  const [loading, setLoading] = useState(true);

  const [novoCargo, setNovoCargo] = useState("");
  const [novoSetor, setNovoSetor] = useState("");

  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<BkFuncionario | null>(null);

  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fns, cgs, sts] = await Promise.all([
        listarFuncionarios(),
        listarCargos(),
        listarSetores(),
      ]);
      setFuncionarios(fns);
      setCargos(cgs);
      setSetores(sts);
    } catch (err) {
      toast.error("Erro ao carregar dados do servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (f: BkFuncionario) => {
    setEditingId(f.id ?? null);
    setForm({
      matricula: f.matricula,
      nome: f.nome,
      dataAdmissao: f.dataAdmissao ? String(f.dataAdmissao).slice(0, 10) : "",
      status: f.status,
      id_cargo: f.id_cargo != null ? String(f.id_cargo) : "",
      id_setor: f.id_setor != null ? String(f.id_setor) : "",
    });
    setDialogOpen(true);
  };

  const addCargoRapido = async () => {
    if (!novoCargo.trim()) return;
    try {
      const novo = await criarCargo({ nome: novoCargo.trim() });
      setCargos(prev => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)));
      setForm(prev => ({ ...prev, id_cargo: String(novo.id) }));
      setNovoCargo("");
      toast.success("Cargo cadastrado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar cargo");
    }
  };

  const addSetorRapido = async () => {
    if (!novoSetor.trim()) return;
    try {
      const novo = await criarSetor({ nome: novoSetor.trim(), descricao: novoSetor.trim(), id_empresa: 1 });
      setSetores(prev => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)));
      setForm(prev => ({ ...prev, id_setor: String(novo.id) }));
      setNovoSetor("");
      toast.success("Setor cadastrado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar setor");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.matricula.trim() || !form.nome.trim() || !form.dataAdmissao || !form.id_cargo || !form.id_setor) {
      return toast.error("Preencha todos os campos obrigatórios");
    }
    const payload = {
      matricula: form.matricula.trim(),
      nome: form.nome.trim(),
      dataAdmissao: form.dataAdmissao,
      status: form.status,
      id_cargo: parseInt(form.id_cargo),
      id_setor: parseInt(form.id_setor),
    };
    try {
      if (editingId != null) {
        await atualizarFuncionario(editingId, payload);
        toast.success("Funcionário atualizado");
      } else {
        const novo = await criarFuncionario(payload);
        setFuncionarios(prev => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)));
        toast.success("Funcionário cadastrado");
      }
      await fetchAll();
      setDialogOpen(false);
      setForm(empty);
      setEditingId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Excluir este funcionário?")) return;
    try {
      await deletarFuncionario(id);
      setFuncionarios(prev => prev.filter(f => f.id !== id));
      toast.success("Funcionário excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  const getNomeCargo = (id: number | null) =>
    cargos.find(c => c.id === id)?.nome || "—";

  const getNomeSetor = (id: number | null) =>
    setores.find(s => s.id === id)?.nome || "—";

  const lista = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = funcionarios.slice();
    if (filtroStatus !== "TODOS") arr = arr.filter(f => f.status === filtroStatus);
    if (!q) return arr;
    const score = (f: BkFuncionario) => {
      const n = f.nome.toLowerCase();
      if (n === q) return 0;
      if (n.startsWith(q)) return 1;
      if (n.includes(q)) return 2;
      if ((f.matricula || "").toLowerCase().includes(q)) return 3;
      if (getNomeCargo(f.id_cargo).toLowerCase().includes(q)) return 4;
      if (getNomeSetor(f.id_setor).toLowerCase().includes(q)) return 5;
      return 99;
    };
    return arr
      .map(f => ({ f, s: score(f) }))
      .filter(x => x.s < 99)
      .sort((a, b) => a.s - b.s || a.f.nome.localeCompare(b.f.nome))
      .map(x => x.f);
  }, [funcionarios, search, filtroStatus, cargos, setores]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar empresaNome="Sistema" />
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
                placeholder="Buscar por nome, matrícula, cargo ou setor..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os status</SelectItem>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
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
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                          {funcionarios.length === 0
                            ? "Nenhum funcionário cadastrado"
                            : "Nenhum resultado para os filtros aplicados"}
                        </TableCell>
                      </TableRow>
                    ) : lista.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="font-mono text-sm">{f.matricula}</TableCell>
                        <TableCell className="font-medium">{f.nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Briefcase className="h-3 w-3" />{getNomeCargo(f.id_cargo)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getNomeSetor(f.id_setor)}</TableCell>
                        <TableCell>
                          <Badge variant={f.status === "ATIVO" ? "default" : "secondary"}>
                            {f.status}
                          </Badge>
                        </TableCell>
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
                          <Button size="icon" variant="outline" onClick={() => remove(f.id!)} title="Excluir">
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
            <DialogTitle>{editingId != null ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Matrícula *</Label>
                <Input
                  value={form.matricula}
                  onChange={e => setForm({ ...form, matricula: e.target.value })}
                  placeholder="Ex: MAT-001"
                  required
                />
              </div>
              <div>
                <Label>Nome completo *</Label>
                <Input
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Status *</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data de admissão *</Label>
                <Input
                  type="date"
                  value={form.dataAdmissao}
                  onChange={e => setForm({ ...form, dataAdmissao: e.target.value })}
                  required
                />
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
                <Label>Setor *</Label>
                <Select value={form.id_setor} onValueChange={v => setForm({ ...form, id_setor: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um setor" /></SelectTrigger>
                  <SelectContent>
                    {setores.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        Cadastre um setor abaixo
                      </div>
                    )}
                    {setores.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Cadastrar novo setor"
                    value={novoSetor}
                    onChange={e => setNovoSetor(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSetorRapido(); } }}
                  />
                  <Button type="button" variant="outline" onClick={addSetorRapido}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingId != null ? "Salvar" : "Cadastrar"}</Button>
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
              <p><strong>Matrícula:</strong> {viewing.matricula}</p>
              <p><strong>Status:</strong> {viewing.status}</p>
              <p><strong>Cargo:</strong> {getNomeCargo(viewing.id_cargo)}</p>
              <p><strong>Setor:</strong> {getNomeSetor(viewing.id_setor)}</p>
              <p><strong>Admissão:</strong>{" "}
                {viewing.dataAdmissao
                  ? format(new Date(viewing.dataAdmissao), "dd/MM/yyyy")
                  : "—"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Funcionarios;
