import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EPIForm } from "@/components/EPIForm";
import { FuncionarioForm } from "@/components/FuncionarioForm";
import { EPITable } from "@/components/EPITable";
import { FuncionarioTable } from "@/components/FuncionarioTable";
import { UpdateCAModal } from "@/components/UpdateCAModal";
import { HardHat, User, List, Users } from "lucide-react";
import { EPI, Funcionario } from "@/types";

const Index = () => {
  const [epis, setEpis] = useState<EPI[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [selectedEPI, setSelectedEPI] = useState<EPI | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const savedEpis = localStorage.getItem("epis");
    const savedFuncionarios = localStorage.getItem("funcionarios");
    if (savedEpis) setEpis(JSON.parse(savedEpis));
    if (savedFuncionarios) setFuncionarios(JSON.parse(savedFuncionarios));
  }, []);

  useEffect(() => {
    localStorage.setItem("epis", JSON.stringify(epis));
  }, [epis]);

  useEffect(() => {
    localStorage.setItem("funcionarios", JSON.stringify(funcionarios));
  }, [funcionarios]);

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

  const openUpdateModal = (epi: EPI) => {
    setSelectedEPI(epi);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <Tabs defaultValue="epi" className="space-y-6">
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
            <TabsTrigger value="lista-epi" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Lista de EPIs</span>
              <span className="sm:hidden">EPIs</span>
            </TabsTrigger>
            <TabsTrigger value="lista-funcionario" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Lista de Funcionários</span>
              <span className="sm:hidden">Funcionários</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="epi">
            <EPIForm onAdd={handleAddEPI} />
          </TabsContent>

          <TabsContent value="funcionario">
            <FuncionarioForm onAdd={handleAddFuncionario} />
          </TabsContent>

          <TabsContent value="lista-epi">
            <EPITable
              epis={epis}
              onDelete={handleDeleteEPI}
              onUpdateCA={openUpdateModal}
            />
          </TabsContent>

          <TabsContent value="lista-funcionario">
            <FuncionarioTable
              funcionarios={funcionarios}
              onDelete={handleDeleteFuncionario}
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
