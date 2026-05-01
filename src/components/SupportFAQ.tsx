import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface Message {
  id: string;
  message: string;
  image_url: string | null;
  is_admin: boolean | null;
  created_at: string | null;
}

export const SupportFAQ = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !user) return;
    loadOrCreateTicket();
  }, [open, user]);

  useEffect(() => {
    if (!ticketId) return;
    const ch = supabase
      .channel(`support-${ticketId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${ticketId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [ticketId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadOrCreateTicket = async () => {
    if (!user) return;
    setLoading(true);
    const { data: tickets } = await supabase
      .from("support_tickets").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1);

    if (tickets && tickets.length > 0) {
      setTicketId(tickets[0].id);
      const { data: msgs } = await supabase.from("support_messages")
        .select("*").eq("ticket_id", tickets[0].id).order("created_at", { ascending: true });
      setMessages((msgs as Message[]) || []);
    }
    setLoading(false);
  };

  const createTicket = async () => {
    if (!user || !subject.trim()) return null;
    const { data, error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      user_name: user.user_metadata?.razao_social || user.email || "Usuário",
      user_email: user.email || "",
      subject: subject.trim(),
    }).select().single();
    if (error) { toast.error("Erro ao abrir conversa"); return null; }
    return data.id as string;
  };

  const handleSend = async () => {
    if (!user) { toast.error("Faça login para enviar mensagem"); return; }
    if (!text.trim() && !imageFile) return;
    setSending(true);

    let tid = ticketId;
    if (!tid) {
      if (!subject.trim()) { toast.error("Informe o assunto"); setSending(false); return; }
      tid = await createTicket();
      if (!tid) { setSending(false); return; }
      setTicketId(tid);
    }

    let imageUrl: string | null = null;
    if (imageFile) {
      if (imageFile.size > 5 * 1024 * 1024) {
        toast.error("Imagem deve ter até 5MB"); setSending(false); return;
      }
      if (!imageFile.type.startsWith("image/")) {
        toast.error("Apenas imagens são permitidas"); setSending(false); return;
      }
      const path = `${user.id}/${tid}/${Date.now()}-${imageFile.name}`;
      const { error: upErr } = await supabase.storage.from("support-images").upload(path, imageFile);
      if (upErr) { toast.error("Erro no upload da imagem"); setSending(false); return; }
      imageUrl = path;
    }

    const { error } = await supabase.from("support_messages").insert({
      ticket_id: tid, sender_id: user.id, message: text.trim() || "(imagem)",
      image_url: imageUrl, is_admin: false,
    });
    if (error) { toast.error("Erro ao enviar"); setSending(false); return; }

    await supabase.from("support_tickets").update({
      read_by_admin: false, updated_at: new Date().toISOString()
    }).eq("id", tid);

    setText(""); setImageFile(null); setSending(false);
  };

  const getImageUrl = async (path: string) => {
    const { data } = await supabase.storage.from("support-images").createSignedUrl(path, 3600);
    return data?.signedUrl;
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}
        className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">
        <MessageCircle className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Suporte</span>
      </Button>

      {open && (
        <Card className="fixed bottom-4 right-4 w-[360px] h-[520px] shadow-2xl z-50 flex flex-col bg-background border-2">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#2c3e50] to-[#4a69bd] text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Suporte</h3>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setOpen(false)} className="h-7 w-7 text-white hover:bg-white/20">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {!user ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Faça login para abrir uma conversa de suporte.
            </div>
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin" /></div>
          ) : !ticketId ? (
            <div className="flex-1 p-4 space-y-3">
              <p className="text-sm text-muted-foreground">Inicie uma nova conversa de suporte:</p>
              <Input placeholder="Assunto" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={100} />
              <Textarea placeholder="Escreva sua mensagem..." value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={2000} />
              <div className="flex items-center gap-2">
                <label className="cursor-pointer flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ImagePlus className="h-4 w-4" />
                  {imageFile ? imageFile.name.slice(0, 20) : "Anexar imagem"}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <Button onClick={handleSend} disabled={sending} className="w-full">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" />Enviar</>}
              </Button>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-6">Nenhuma mensagem ainda.</p>
                )}
                {messages.map((m) => <ChatBubble key={m.id} msg={m} getImageUrl={getImageUrl} />)}
              </div>
              <div className="p-2 border-t space-y-2">
                {imageFile && (
                  <div className="text-xs text-muted-foreground flex items-center justify-between bg-muted p-1 rounded">
                    <span className="truncate">📎 {imageFile.name}</span>
                    <button onClick={() => setImageFile(null)}><X className="h-3 w-3" /></button>
                  </div>
                )}
                <div className="flex gap-1">
                  <label className="cursor-pointer self-center p-2 hover:bg-muted rounded">
                    <ImagePlus className="h-4 w-4" />
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                  </label>
                  <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Mensagem..."
                    rows={1} maxLength={2000}
                    className="resize-none min-h-[40px] max-h-[80px]"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                  <Button size="icon" onClick={handleSend} disabled={sending}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
};

const ChatBubble = ({ msg, getImageUrl }: { msg: Message; getImageUrl: (p: string) => Promise<string | undefined> }) => {
  const [imgUrl, setImgUrl] = useState<string | undefined>();
  useEffect(() => { if (msg.image_url) getImageUrl(msg.image_url).then(setImgUrl); }, [msg.image_url]);
  const isAdmin = msg.is_admin;
  return (
    <div className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[75%] rounded-lg p-2 text-sm ${isAdmin ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
        {imgUrl && <img src={imgUrl} alt="anexo" className="rounded mb-1 max-h-40 object-contain" />}
        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
        <p className={`text-[10px] mt-1 ${isAdmin ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
          {msg.created_at && format(new Date(msg.created_at), "dd/MM HH:mm")}
        </p>
      </div>
    </div>
  );
};
