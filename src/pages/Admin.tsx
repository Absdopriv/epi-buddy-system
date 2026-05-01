import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { Trash2, Send, MailOpen, Mail, LogOut, ShieldAlert, Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Ticket {
  id: string; user_id: string; user_name: string; user_email: string;
  subject: string; status: string | null; read_by_admin: boolean;
  created_at: string | null; updated_at: string | null;
}
interface Msg {
  id: string; ticket_id: string; message: string; image_url: string | null;
  is_admin: boolean | null; created_at: string | null; sender_id: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      if (!user) { navigate("/admin-login"); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!data) { setIsAdmin(false); navigate("/admin-login"); return; }
      setIsAdmin(true);
      loadTickets();
    })();
  }, [user]);

  useEffect(() => {
    const ch = supabase.channel("admin-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => loadTickets())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, (payload) => {
        if (selected && (payload.new as Msg).ticket_id === selected.id) {
          setMessages((p) => [...p, payload.new as Msg]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selected]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadTickets = async () => {
    const { data } = await supabase.from("support_tickets").select("*").order("updated_at", { ascending: false });
    setTickets((data as Ticket[]) || []);
  };

  const openTicket = async (t: Ticket) => {
    setSelected(t);
    const { data } = await supabase.from("support_messages").select("*").eq("ticket_id", t.id).order("created_at", { ascending: true });
    setMessages((data as Msg[]) || []);
    if (!t.read_by_admin) {
      await supabase.from("support_tickets").update({ read_by_admin: true }).eq("id", t.id);
      loadTickets();
    }
  };

  const sendReply = async () => {
    if (!selected || !user || !reply.trim()) return;
    setSending(true);
    const { error } = await supabase.from("support_messages").insert({
      ticket_id: selected.id, sender_id: user.id,
      message: reply.trim(), is_admin: true,
    });
    if (error) { toast.error("Erro ao enviar"); setSending(false); return; }
    await supabase.from("support_tickets").update({ updated_at: new Date().toISOString() }).eq("id", selected.id);
    setReply(""); setSending(false);
  };

  const toggleRead = async (t: Ticket) => {
    await supabase.from("support_tickets").update({ read_by_admin: !t.read_by_admin }).eq("id", t.id);
    loadTickets();
  };

  const deleteTicket = async (t: Ticket) => {
    await supabase.from("support_messages").delete().eq("ticket_id", t.id);
    await supabase.from("support_tickets").delete().eq("id", t.id);
    if (selected?.id === t.id) { setSelected(null); setMessages([]); }
    toast.success("Conversa deletada");
    loadTickets();
  };

  const getImageUrl = async (path: string) => {
    const { data } = await supabase.storage.from("support-images").createSignedUrl(path, 3600);
    return data?.signedUrl;
  };

  const handleLogout = async () => { await signOut(); navigate("/auth"); };

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#4a69bd] p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 text-white">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" />
            <h1 className="text-xl font-bold">Painel Administrativo - Suporte</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-120px)]">
          {/* Sidebar */}
          <Card className="overflow-y-auto p-2">
            <h2 className="font-semibold p-2 sticky top-0 bg-background border-b">Conversas ({tickets.length})</h2>
            {tickets.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhuma conversa ainda.</p>}
            {tickets.map((t) => (
              <div key={t.id} onClick={() => openTicket(t)}
                className={`p-3 border-b cursor-pointer hover:bg-muted ${selected?.id === t.id ? "bg-muted" : ""}`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-medium text-sm truncate">{t.user_name}</span>
                  {!t.read_by_admin && <Badge variant="destructive" className="text-[9px]">NOVO</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{t.subject}</p>
                <p className="text-[10px] text-muted-foreground">
                  {t.updated_at && format(new Date(t.updated_at), "dd/MM/yy HH:mm")}
                </p>
              </div>
            ))}
          </Card>

          {/* Chat area */}
          <Card className="md:col-span-2 flex flex-col">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Selecione uma conversa
              </div>
            ) : (
              <>
                <div className="p-3 border-b flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selected.user_name}</h3>
                    <p className="text-xs text-muted-foreground">{selected.user_email} • {selected.subject}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => toggleRead(selected)}>
                      {selected.read_by_admin ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deletar conversa?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTicket(selected)}>Deletar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/30">
                  {messages.map((m) => <AdminBubble key={m.id} msg={m} getImageUrl={getImageUrl} />)}
                </div>

                <div className="p-3 border-t flex gap-2">
                  <Textarea value={reply} onChange={(e) => setReply(e.target.value)}
                    placeholder="Resposta..." rows={2} maxLength={2000}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }} />
                  <Button onClick={sendReply} disabled={sending}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

const AdminBubble = ({ msg, getImageUrl }: { msg: Msg; getImageUrl: (p: string) => Promise<string | undefined> }) => {
  const [imgUrl, setImgUrl] = useState<string | undefined>();
  useEffect(() => { if (msg.image_url) getImageUrl(msg.image_url).then(setImgUrl); }, [msg.image_url]);
  const isAdmin = msg.is_admin;
  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] rounded-lg p-2 text-sm ${isAdmin ? "bg-primary text-primary-foreground" : "bg-background border"}`}>
        {imgUrl && <img src={imgUrl} alt="anexo" className="rounded mb-1 max-h-60 object-contain" />}
        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
        <p className={`text-[10px] mt-1 ${isAdmin ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {isAdmin ? "Admin" : "Usuário"} • {msg.created_at && format(new Date(msg.created_at), "dd/MM HH:mm")}
        </p>
      </div>
    </div>
  );
};

export default Admin;
