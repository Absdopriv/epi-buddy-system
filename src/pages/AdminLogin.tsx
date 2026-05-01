import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, ShieldAlert, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Você precisa estar logado.");
      navigate("/auth");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-login", { body: { password } });
    setLoading(false);
    if (error || !data?.ok) {
      toast.error(data?.error || error?.message || "Senha incorreta");
      return;
    }
    toast.success("Acesso administrativo concedido");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#4a69bd] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <ShieldAlert className="h-12 w-12 text-primary mb-2" />
          <h1 className="text-2xl font-bold">Acesso Administrativo</h1>
          <p className="text-sm text-muted-foreground">Restrito a administradores</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-pwd">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="admin-pwd" type="password" required autoFocus
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="pl-10" placeholder="••••••••" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Validando..." : "Entrar"}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/auth")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao login
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
