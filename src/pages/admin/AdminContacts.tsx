import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle, Circle, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminContacts() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setMessages(data);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const toggleRead = async (msg: ContactMessage) => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: !msg.is_read })
      .eq("id", msg.id);
    if (!error) {
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_read: !m.is_read } : m));
    }
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Mensagem excluída" });
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Mensagens de Contato</h1>
          <p className="text-muted-foreground text-sm">
            {unreadCount > 0 ? `${unreadCount} não lida(s)` : "Nenhuma mensagem não lida"}
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Mail className="w-3 h-3" />
          {messages.length}
        </Badge>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma mensagem recebida ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <Card key={msg.id} className={msg.is_read ? "opacity-70" : "border-primary/30"}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {msg.is_read ? (
                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Circle className="w-4 h-4 text-primary fill-primary" />
                      )}
                      <span className="font-semibold text-foreground text-sm">{msg.name}</span>
                      <span className="text-xs text-muted-foreground">— {msg.email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(msg.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                    </p>
                    {expandedId !== msg.id && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{msg.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {expandedId === msg.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    <Button variant="ghost" size="icon" onClick={() => toggleRead(msg)} title={msg.is_read ? "Marcar como não lida" : "Marcar como lida"}>
                      {msg.is_read ? <Circle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMessage(msg.id)} title="Excluir">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {expandedId === msg.id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
