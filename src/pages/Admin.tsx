import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupportChat } from "@/components/SupportChat";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, MessageSquare, Clock, CheckCircle } from "lucide-react";

interface Ticket {
  id: string;
  user_name: string;
  user_email: string;
  subject: string;
  status: string;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchTickets();
      
      const channel = supabase
        .channel("admin-tickets")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "support_tickets"
          },
          () => {
            fetchTickets();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar autenticado");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Acesso negado: você não é administrador");
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin status:", error);
      toast.error("Erro ao verificar permissões");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
      return;
    }

    setTickets(data || []);
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    const { error } = await supabase
      .from("support_tickets")
      .update({ status })
      .eq("id", ticketId);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    toast.success("Status atualizado!");
    fetchTickets();
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: "default",
      in_progress: "secondary",
      closed: "outline"
    } as const;

    const labels = {
      open: "Aberto",
      in_progress: "Em Progresso",
      closed: "Fechado"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Painel Administrativo - Suporte</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Tickets de Suporte</h2>
              
              <Tabs defaultValue="open" className="space-y-4">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="open">Abertos</TabsTrigger>
                  <TabsTrigger value="in_progress">Em Andamento</TabsTrigger>
                  <TabsTrigger value="closed">Fechados</TabsTrigger>
                </TabsList>

                {["open", "in_progress", "closed"].map((status) => (
                  <TabsContent key={status} value={status} className="space-y-2">
                    {tickets
                      .filter((t) => t.status === status)
                      .map((ticket) => (
                        <Card
                          key={ticket.id}
                          className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedTicket === ticket.id ? "bg-muted" : ""
                          }`}
                          onClick={() => setSelectedTicket(ticket.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{ticket.user_name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {ticket.user_email}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm")}
                              </p>
                            </div>
                            <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                          <p className="text-sm mt-2 line-clamp-2">{ticket.subject}</p>
                        </Card>
                      ))}
                    {tickets.filter((t) => t.status === status).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum ticket nesta categoria
                      </p>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="space-y-4">
                {tickets
                  .filter((t) => t.id === selectedTicket)
                  .map((ticket) => (
                    <Card key={ticket.id} className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold">{ticket.user_name}</h3>
                            <p className="text-sm text-muted-foreground">{ticket.user_email}</p>
                          </div>
                          {getStatusBadge(ticket.status)}
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm font-medium mb-2">Assunto:</p>
                          <p className="text-sm">{ticket.subject}</p>
                        </div>

                        <div className="flex gap-2">
                          {ticket.status === "open" && (
                            <Button
                              size="sm"
                              onClick={() => updateTicketStatus(ticket.id, "in_progress")}
                              className="gap-2"
                            >
                              <Clock className="h-4 w-4" />
                              Marcar Em Progresso
                            </Button>
                          )}
                          {ticket.status === "in_progress" && (
                            <Button
                              size="sm"
                              onClick={() => updateTicketStatus(ticket.id, "closed")}
                              className="gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Marcar como Resolvido
                            </Button>
                          )}
                          {ticket.status === "closed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTicketStatus(ticket.id, "open")}
                            >
                              Reabrir Ticket
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}

                <SupportChat ticketId={selectedTicket} isAdmin={true} />
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione um ticket para visualizar e responder</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;