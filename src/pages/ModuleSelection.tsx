import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HardHat, ShieldAlert, ArrowRight, CheckCircle2, FileText, ClipboardList, BadgeCheck, Stethoscope, Bell, Activity, Users, Briefcase, IdCard } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ModuleSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [empresaNome, setEmpresaNome] = useState("Sua Empresa");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("razao_social").eq("user_id", user.id).single()
      .then(({ data }) => { if (data?.razao_social) setEmpresaNome(data.razao_social); });
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar empresaNome={empresaNome} />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Bem-vindo ao Sistema</h1>
            <p className="text-muted-foreground text-lg">Escolha o módulo que deseja acessar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Módulo Cadastro de Funcionários (central) */}
            <Card className="group p-8 hover:shadow-lg transition-all border-2 hover:border-primary/40 cursor-pointer flex flex-col"
              onClick={() => navigate("/funcionarios")}>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#2c3e50] to-[#4a69bd] text-primary-foreground">
                  <Users className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-1">Cadastro de Funcionários</h2>
                  <p className="text-sm text-muted-foreground">Fonte única de funcionários e cargos</p>
                </div>
              </div>
              <p className="text-foreground/80 mb-6">
                Cadastre funcionários e cargos uma única vez. Todos os módulos consomem esta base.
              </p>
              <div className="space-y-2 mb-6 flex-1">
                {[
                  { icon: IdCard, label: "Dados completos do colaborador" },
                  { icon: Briefcase, label: "Cargos centralizados" },
                  { icon: CheckCircle2, label: "Integração total com EPI e ASO" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 text-primary" /><span>{label}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full group-hover:gap-3 transition-all">
                Acessar Módulo <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Card>

            {/* Módulo EPIs */}
            <Card className="group p-8 hover:shadow-lg transition-all border-2 hover:border-primary/40 cursor-pointer flex flex-col h-full"
              onClick={() => navigate("/epis")}>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-gradient-primary text-primary-foreground">
                  <HardHat className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-1">Gerenciamento de EPIs</h2>
                  <p className="text-sm text-muted-foreground">Controle completo dos seus equipamentos</p>
                </div>
              </div>
              <p className="text-foreground/80 mb-4">
                Cadastre EPIs, controle atribuições e validades de equipamentos.
              </p>
              <div className="space-y-2 mb-6 flex-1">
                {["Cadastro de EPIs", "Atribuição de equipamentos", "Controle de validade e CA"].map(t => (
                  <div key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" /><span>{t}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full group-hover:gap-3 transition-all">
                Acessar Módulo <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Card>

            {/* Módulo Segurança */}
            <Card className="group p-8 hover:shadow-lg transition-all border-2 hover:border-primary/40 cursor-pointer flex flex-col h-full"
              onClick={() => navigate("/seguranca")}>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#2c3e50] to-[#4a69bd] text-primary-foreground">
                  <ShieldAlert className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-1">Segurança do Trabalho</h2>
                  <p className="text-sm text-muted-foreground">Conformidade com normas regulamentadoras</p>
                </div>
              </div>
              <p className="text-foreground/80 mb-4">
                Gerencie segurança com conformidade às normas regulamentadoras.
              </p>
              <div className="space-y-2 mb-6 flex-1">
                {[
                  { icon: FileText, label: "Formulários digitais" },
                  { icon: ClipboardList, label: "Relatórios detalhados" },
                  { icon: BadgeCheck, label: "Conformidade com NRs" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 text-primary" /><span>{label}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full group-hover:gap-3 transition-all">
                Acessar Módulo <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Card>

            {/* Módulo Exame Admissional */}
            <Card className="group p-8 hover:shadow-lg transition-all border-2 hover:border-primary/40 cursor-pointer flex flex-col h-full"
              onClick={() => navigate("/exame-admissional")}>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#2c3e50] to-[#4a69bd] text-primary-foreground">
                  <Stethoscope className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-1">Exame Admissional</h2>
                  <p className="text-sm text-muted-foreground">ASO, riscos por cargo e alertas</p>
                </div>
              </div>
              <p className="text-foreground/80 mb-4">
                Cadastre cargos, riscos e exames. Gere ASO e receba alertas de vencimento.
              </p>
              <div className="space-y-2 mb-6 flex-1">
                {[
                  { icon: Activity, label: "Exames por funcionário" },
                  { icon: FileText, label: "Emissão automática de ASO" },
                  { icon: Bell, label: "Alertas de vencimento" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 text-primary" /><span>{label}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full group-hover:gap-3 transition-all">
                Acessar Módulo <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ModuleSelection;
