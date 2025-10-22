import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
  ShieldAlert, 
  Mail, 
  Lock, 
  Building, 
  Factory, 
  Calendar, 
  CreditCard, 
  Phone, 
  MapPin, 
  UserCircle,
  CheckCircle2,
  LogIn,
  UserPlus
} from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    razaoSocial: "",
    ramoAtividade: "",
    dataFundacao: "",
    cnpj: "",
    telefone: "",
    endereco: "",
    email: "",
    responsavel: "",
    senha: "",
    confirmarSenha: ""
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Funcionalidade de login será implementada em breve!");
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerForm.senha !== registerForm.confirmarSenha) {
      toast.error("As senhas não coincidem!");
      return;
    }
    
    toast.success("Registro será implementado em breve!");
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 14);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return numbers.replace(/^(\d{2})(\d*)/, "$1.$2");
    if (numbers.length <= 8) return numbers.replace(/^(\d{2})(\d{3})(\d*)/, "$1.$2.$3");
    if (numbers.length <= 12) return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d*)/, "$1.$2.$3/$4");
    return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d*)/, "$1.$2.$3/$4-$5");
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return numbers.replace(/^(\d{2})(\d*)/, "($1) $2");
    if (numbers.length <= 10) return numbers.replace(/^(\d{2})(\d{4})(\d*)/, "($1) $2-$3");
    return numbers.replace(/^(\d{2})(\d{5})(\d*)/, "($1) $2-$3");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#4a69bd] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <Card className="overflow-hidden bg-background/95 backdrop-blur-sm shadow-2xl border-0">
          <div className="grid lg:grid-cols-2 min-h-[600px]">
            {/* Banner lado esquerdo */}
            <div className="relative bg-gradient-to-br from-primary to-[#2c3e50] p-10 flex flex-col justify-center items-center text-primary-foreground overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 animate-[rotate_60s_linear_infinite]">
                  <ShieldAlert className="w-full h-full" />
                </div>
              </div>
              
              <div className="relative z-10 text-center space-y-6">
                <ShieldAlert className="w-20 h-20 mx-auto" />
                <h1 className="text-4xl font-bold drop-shadow-lg">
                  Gestão de EPI
                </h1>
                <p className="text-lg opacity-90 max-w-md">
                  Gerencie a segurança da sua empresa com eficiência e conformidade com as normas regulamentadoras.
                </p>
                
                <div className="space-y-3 pt-6">
                  <div className="flex items-center gap-3 justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Cadastro digital de EPIs</span>
                  </div>
                  <div className="flex items-center gap-3 justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Controle de funcionários</span>
                  </div>
                  <div className="flex items-center gap-3 justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Relatórios detalhados</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulários lado direito */}
            <div className="p-10 overflow-y-auto max-h-[600px]">
              {/* Tabs */}
              <div className="flex border-b border-border mb-8">
                <button
                  onClick={() => setActiveTab("login")}
                  className={`px-6 py-3 font-semibold transition-all relative ${
                    activeTab === "login"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Login
                  {activeTab === "login" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("register")}
                  className={`px-6 py-3 font-semibold transition-all relative ${
                    activeTab === "register"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Registro
                  {activeTab === "register" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
                  )}
                </button>
              </div>

              {/* Formulário de Login */}
              {activeTab === "login" && (
                <div className="animate-in fade-in duration-500 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Bem-vindo de volta
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Acesse sua conta para gerenciar a segurança da sua empresa
                    </p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10 bg-muted/50"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 bg-muted/50"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      <LogIn className="w-4 h-4 mr-2" />
                      Entrar
                    </Button>

                    <div className="text-center">
                      <Link to="/" className="text-sm text-primary hover:underline">
                        Voltar para início
                      </Link>
                    </div>
                  </form>
                </div>
              )}

              {/* Formulário de Registro */}
              {activeTab === "register" && (
                <div className="animate-in fade-in duration-500 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Crie sua conta
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Registre sua empresa para começar a usar o sistema
                    </p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="razao-social">Razão Social</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="razao-social"
                          placeholder="Empresa XYZ Ltda"
                          className="pl-10 bg-muted/50"
                          value={registerForm.razaoSocial}
                          onChange={(e) => setRegisterForm({ ...registerForm, razaoSocial: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ramo-atividade">Ramo de Atividade</Label>
                        <div className="relative">
                          <Factory className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="ramo-atividade"
                            placeholder="Construção Civil"
                            className="pl-10 bg-muted/50"
                            value={registerForm.ramoAtividade}
                            onChange={(e) => setRegisterForm({ ...registerForm, ramoAtividade: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="data-fundacao">Data de Fundação</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="data-fundacao"
                            type="date"
                            className="pl-10 bg-muted/50"
                            value={registerForm.dataFundacao}
                            onChange={(e) => setRegisterForm({ ...registerForm, dataFundacao: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="cnpj"
                            placeholder="00.000.000/0001-00"
                            className="pl-10 bg-muted/50"
                            value={registerForm.cnpj}
                            onChange={(e) => setRegisterForm({ ...registerForm, cnpj: formatCNPJ(e.target.value) })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="telefone"
                            placeholder="(00) 00000-0000"
                            className="pl-10 bg-muted/50"
                            value={registerForm.telefone}
                            onChange={(e) => setRegisterForm({ ...registerForm, telefone: formatPhone(e.target.value) })}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endereco">Endereço Comercial</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="endereco"
                          placeholder="Rua Exemplo, 123 - Bairro - Cidade/UF"
                          className="pl-10 bg-muted/50"
                          value={registerForm.endereco}
                          onChange={(e) => setRegisterForm({ ...registerForm, endereco: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="contato@empresa.com"
                            className="pl-10 bg-muted/50"
                            value={registerForm.email}
                            onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="responsavel">Responsável</Label>
                        <div className="relative">
                          <UserCircle className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="responsavel"
                            placeholder="Nome do Responsável"
                            className="pl-10 bg-muted/50"
                            value={registerForm.responsavel}
                            onChange={(e) => setRegisterForm({ ...registerForm, responsavel: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="senha">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="senha"
                            type="password"
                            placeholder="••••••••"
                            className="pl-10 bg-muted/50"
                            value={registerForm.senha}
                            onChange={(e) => setRegisterForm({ ...registerForm, senha: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmar-senha">Confirmar Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="confirmar-senha"
                            type="password"
                            placeholder="••••••••"
                            className="pl-10 bg-muted/50"
                            value={registerForm.confirmarSenha}
                            onChange={(e) => setRegisterForm({ ...registerForm, confirmarSenha: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Registrar Empresa
                    </Button>

                    <div className="text-center">
                      <Link to="/" className="text-sm text-primary hover:underline">
                        Voltar para início
                      </Link>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
