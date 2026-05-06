import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EPIForm } from "@/components/EPIForm";

import { FuncionarioEPIManager } from "@/components/FuncionarioEPIManager";
import { EPIsVencidas } from "@/components/EPIsVencidas";
import { UpdateCAModal } from "@/components/UpdateCAModal";
import { ViewEPIModal } from "@/components/ViewEPIModal";
import { EditEPIModal } from "@/components/EditEPIModal";
import { HardHat, Users, AlertTriangle } from "lucide-react";
import { EPI, Funcionario, EPIAtribuicao } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();
  const [epis, setEpis] = useState<EPI[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [atribuicoes, setAtribuicoes] = useState<EPIAtribuicao[]>([]);
  const [selectedEPI, setSelectedEPI] = useState<EPI | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewEPI, setViewEPI] = useState<EPI | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editEPI, setEditEPI] = useState<EPI | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [empresaNome, setEmpresaNome] = useState("Sua Empresa");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [episRes, funcRes, atribRes, profileRes] = await Promise.all([
      supabase.from("epis").select("*").order("created_at", { ascending: false }),
      supabase.from("funcionarios").select("*").order("created_at", { ascending: false }),
      supabase.from("epi_atribuicoes").select("*"),
      supabase.from("profiles").select("razao_social").eq("user_id", user.id).single(),
    ]);

    if (episRes.data) {
      setEpis(episRes.data.map(e => ({
        id: e.id, nome: e.nome, ca: e.ca, validade: e.validade,
        tipo: e.tipo, uso: e.uso, fabricante: e.fabricante, entrega: e.entrega,
      })));
    }
    if (funcRes.data) {
      setFuncionarios(funcRes.data.map(f => ({
        id: f.id, nome: f.nome, cpf: f.cpf, cargo: f.cargo, setor: f.setor,
      })));
    }
    if (atribRes.data) {
      setAtribuicoes(atribRes.data.map(a => ({
        id: a.id, epiId: a.epi_id, funcionarioId: a.funcionario_id,
        dataEntrega: a.data_entrega, validade: a.validade,
      })));
    }
    if (profileRes.data?.razao_social) {
      setEmpresaNome(profileRes.data.razao_social);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddEPI = async (epi: EPI) => {
    if (!user) return;
    const { data, error } = await supabase.from("epis").insert({
      user_id: user.id, nome: epi.nome, ca: epi.ca, validade: epi.validade,
      tipo: epi.tipo, uso: epi.uso, fabricante: epi.fabricante, entrega: epi.entrega,
    }).select().single();
    if (error) { toast.error("Erro ao cadastrar EPI"); return; }
    setEpis(prev => [{ id: data.id, nome: data.nome, ca: data.ca, validade: data.validade, tipo: data.tipo, uso: data.uso, fabricante: data.fabricante, entrega: data.entrega }, ...prev]);
  };

  const handleDeleteEPI = async (id: string) => {
    const { error } = await supabase.from("epis").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir EPI"); return; }
    setEpis(prev => prev.filter(e => e.id !== id));
  };

  const handleUpdateCA = async (id: string, ca: string, validade: string) => {
    const { error } = await supabase.from("epis").update({ ca, validade }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar CA"); return; }
    setEpis(prev => prev.map(e => e.id === id ? { ...e, ca, validade } : e));
  };

  const handleUpdateEPI = async (updatedEPI: EPI) => {
    const { error } = await supabase.from("epis").update({
      nome: updatedEPI.nome, ca: updatedEPI.ca, validade: updatedEPI.validade,
      tipo: updatedEPI.tipo, uso: updatedEPI.uso, fabricante: updatedEPI.fabricante, entrega: updatedEPI.entrega,
    }).eq("id", updatedEPI.id);
    if (error) { toast.error("Erro ao atualizar EPI"); return; }
    setEpis(prev => prev.map(e => e.id === updatedEPI.id ? updatedEPI : e));
  };

  const handleDeleteFuncionario = async (id: string) => {
    const { error } = await supabase.from("funcionarios").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir funcionário"); return; }
    setFuncionarios(prev => prev.filter(f => f.id !== id));
    setAtribuicoes(prev => prev.filter(a => a.funcionarioId !== id));
  };

  const handleAssignEPI = async (epiId: string, funcionarioId: string) => {
    if (!user) return;
    const epi = epis.find(e => e.id === epiId);
    const { data, error } = await supabase.from("epi_atribuicoes").insert({
      user_id: user.id, epi_id: epiId, funcionario_id: funcionarioId,
      data_entrega: new Date().toISOString().split('T')[0],
      validade: epi?.validade || new Date().toISOString().split('T')[0],
    }).select().single();
    if (error) { toast.error("Erro ao atribuir EPI"); return; }
    setAtribuicoes(prev => [...prev, {
      id: data.id, epiId: data.epi_id, funcionarioId: data.funcionario_id,
      dataEntrega: data.data_entrega, validade: data.validade,
    }]);
    toast.success("EPI atribuído ao funcionário!");
  };

  const handleUnassignEPI = async (atribuicaoId: string) => {
    const { error } = await supabase.from("epi_atribuicoes").delete().eq("id", atribuicaoId);
    if (error) { toast.error("Erro ao desvincular EPI"); return; }
    setAtribuicoes(prev => prev.filter(a => a.id !== atribuicaoId));
    toast.success("EPI desvinculado do funcionário!");
  };

  const handleUpdateFuncionario = async (updatedFuncionario: Funcionario) => {
    const { error } = await supabase.from("funcionarios").update({
      nome: updatedFuncionario.nome, cpf: updatedFuncionario.cpf,
      cargo: updatedFuncionario.cargo, setor: updatedFuncionario.setor,
    }).eq("id", updatedFuncionario.id);
    if (error) { toast.error("Erro ao atualizar funcionário"); return; }
    setFuncionarios(prev => prev.map(f => f.id === updatedFuncionario.id ? updatedFuncionario : f));
  };

  const handleUpdateAtribuicaoValidade = async (atribuicaoId: string, validade: string) => {
    const { error } = await supabase.from("epi_atribuicoes").update({ validade }).eq("id", atribuicaoId);
    if (error) { toast.error("Erro ao atualizar validade"); return; }
    setAtribuicoes(prev => prev.map(a => a.id === atribuicaoId ? { ...a, validade } : a));
  };

  const openUpdateModal = (epi: EPI) => { setSelectedEPI(epi); setModalOpen(true); };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar empresaNome={empresaNome} />
        <main className="container mx-auto px-4 pt-24 pb-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar empresaNome={empresaNome} />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <Tabs defaultValue="gerenciar" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="epi" className="flex items-center gap-2">
              <HardHat className="h-4 w-4" />
              <span className="hidden sm:inline">Cadastro de EPI</span>
              <span className="sm:hidden">EPI</span>
            </TabsTrigger>
            <TabsTrigger value="gerenciar" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Funcionários e EPIs</span>
              <span className="sm:hidden">Gerenciar</span>
            </TabsTrigger>
            <TabsTrigger value="vencidas" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">EPIs Vencidas</span>
              <span className="sm:hidden">Vencidas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="epi">
            <EPIForm onAdd={handleAddEPI} />
          </TabsContent>
          <TabsContent value="gerenciar">
            <FuncionarioEPIManager
              funcionarios={funcionarios} epis={epis} atribuicoes={atribuicoes}
              onAssignEPI={handleAssignEPI} onUnassignEPI={handleUnassignEPI}
              onUpdateCA={openUpdateModal} onDeleteEPI={handleDeleteEPI}
              onUpdateFuncionario={handleUpdateFuncionario}
              onUpdateAtribuicaoValidade={handleUpdateAtribuicaoValidade}
              onDeleteFuncionario={handleDeleteFuncionario}
              onViewEPI={(epi) => { setViewEPI(epi); setViewModalOpen(true); }}
              onEditEPI={(epi) => { setEditEPI(epi); setEditModalOpen(true); }}
            />
          </TabsContent>
          <TabsContent value="vencidas">
            <EPIsVencidas epis={epis} funcionarios={funcionarios} atribuicoes={atribuicoes} onUpdateCA={openUpdateModal} />
          </TabsContent>
        </Tabs>
      </main>

      <UpdateCAModal epi={selectedEPI} open={modalOpen} onClose={() => setModalOpen(false)} onUpdate={handleUpdateCA} />
      <ViewEPIModal epi={viewEPI} open={viewModalOpen} onClose={() => setViewModalOpen(false)} />
      <EditEPIModal epi={editEPI} open={editModalOpen} onClose={() => setEditModalOpen(false)} onUpdate={handleUpdateEPI} />
    </div>
  );
};

export default Index;
