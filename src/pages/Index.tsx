import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EPIForm } from "@/components/EPIForm";
import { FuncionarioForm } from "@/components/FuncionarioForm";
import { FuncionarioEPIManager } from "@/components/FuncionarioEPIManager";
import { EPIsVencidas } from "@/components/EPIsVencidas";
import { UpdateCAModal } from "@/components/UpdateCAModal";
import { HardHat, User, Users, AlertTriangle } from "lucide-react";
import { EPI, Funcionario, EPIAtribuicao } from "@/types";
import { toast } from "sonner";

const Index = () => {
  const [epis, setEpis] = useState<EPI[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [atribuicoes, setAtribuicoes] = useState<EPIAtribuicao[]>([]);
  const [selectedEPI, setSelectedEPI] = useState<EPI | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const savedEpis = localStorage.getItem("epis");
    const savedFuncionarios = localStorage.getItem("funcionarios");
    const savedAtribuicoes = localStorage.getItem("atribuicoes");
    if (savedEpis) setEpis(JSON.parse(savedEpis));
    if (savedFuncionarios) setFuncionarios(JSON.parse(savedFuncionarios));
    if (savedAtribuicoes) setAtribuicoes(JSON.parse(savedAtribuicoes));
  }, []);

  useEffect(() => {
    localStorage.setItem("epis", JSON.stringify(epis));
  }, [epis]);

  useEffect(() => {
    localStorage.setItem("funcionarios", JSON.stringify(funcionarios));
  }, [funcionarios]);

  useEffect(() => {
    localStorage.setItem("atribuicoes", JSON.stringify(atribuicoes));
  }, [atribuicoes]);

  const handleAddEPI = (epi: EPI) => {
    setEpis([...epis, epi]);
  };

  const handleDeleteEPI = (id: string) => {
    setEpis(epis.filter((epi) => epi.id !== id));
  };

  const handleUpdateCA = (id: string, ca: string, validade: string) => {
    setEpis(
      epis.map((epi) =>
        epi.id === id ? { ...epi, ca, validade } : epi
      )
    );
  };

  const handleAddFuncionario = (funcionario: Funcionario) => {
    setFuncionarios([...funcionarios, funcionario]);
  };

  const handleDeleteFuncionario = (id: string) => {
    setFuncionarios(funcionarios.filter((func) => func.id !== id));
  };

  const handleAssignEPI = (epiId: string, funcionarioId: string) => {
    const novaAtribuicao: EPIAtribuicao = {
      id: `${epiId}-${funcionarioId}-${Date.now()}`,
      epiId,
      funcionarioId,
      dataEntrega: new Date().toISOString().split('T')[0]
    };
    setAtribuicoes([...atribuicoes, novaAtribuicao]);
    toast.success("EPI atribuído ao funcionário!");
  };

  const handleUnassignEPI = (atribuicaoId: string) => {
    setAtribuicoes(atribuicoes.filter(at => at.id !== atribuicaoId));
    toast.success("EPI desvinculado do funcionário!");
  };

  const handleUpdateFuncionario = (updatedFuncionario: Funcionario) => {
    setFuncionarios(
      funcionarios.map(f => f.id === updatedFuncionario.id ? updatedFuncionario : f)
    );
  };

  const openUpdateModal = (epi: EPI) => {
    setSelectedEPI(epi);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <Tabs defaultValue="gerenciar" className="space-y-6">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full">
            <TabsTrigger value="epi" className="flex items-center gap-2">
              <HardHat className="h-4 w-4" />
              <span className="hidden sm:inline">Cadastro de EPI</span>
              <span className="sm:hidden">EPI</span>
            </TabsTrigger>
            <TabsTrigger value="funcionario" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Cadastro de Funcionário</span>
              <span className="sm:hidden">Funcionário</span>
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

          <TabsContent value="funcionario">
            <FuncionarioForm onAdd={handleAddFuncionario} />
          </TabsContent>

          <TabsContent value="gerenciar">
            <FuncionarioEPIManager
              funcionarios={funcionarios}
              epis={epis}
              atribuicoes={atribuicoes}
              onAssignEPI={handleAssignEPI}
              onUnassignEPI={handleUnassignEPI}
              onUpdateCA={openUpdateModal}
              onDeleteEPI={handleDeleteEPI}
              onUpdateFuncionario={handleUpdateFuncionario}
            />
          </TabsContent>

          <TabsContent value="vencidas">
            <EPIsVencidas
              epis={epis}
              funcionarios={funcionarios}
              atribuicoes={atribuicoes}
              onUpdateCA={openUpdateModal}
            />
          </TabsContent>
        </Tabs>
      </main>

      <UpdateCAModal
        epi={selectedEPI}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpdate={handleUpdateCA}
      />
    </div>
  );
};

export default Index;
