import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `Você é o assistente virtual do Decode Analytics, uma plataforma de análise de currículos com IA.
Responda de forma breve, amigável e em português brasileiro.
Ajude os usuários com dúvidas sobre:
- Como usar a plataforma (upload de currículos, análise, histórico, comparação)
- Planos e preços
- Análise em lote
- Problemas técnicos
Se não souber responder, sugira entrar em contato pelo WhatsApp ou página de contato.`;

export default function SupportChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá! 👋 Sou o assistente do Decode Analytics. Como posso ajudar?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("support-chat", {
        body: {
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          systemPrompt: SYSTEM_PROMPT,
        },
      });

      if (error) throw error;
      setMessages((prev) => [...prev, { role: "assistant", content: data?.reply || "Desculpe, não consegui responder. Tente novamente." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erro ao conectar. Tente novamente ou entre em contato pelo WhatsApp." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-5 z-50 w-[340px] max-w-[calc(100vw-2rem)] h-[420px] max-h-[calc(100vh-8rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5" />
          <div>
            <p className="font-display font-semibold text-sm">Suporte Decode</p>
            <p className="text-xs opacity-80">Respostas com IA • Online</p>
          </div>
        </div>
        <button onClick={onClose} className="opacity-80 hover:opacity-100 transition-opacity">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            }`}>
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 items-center">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua dúvida..."
            className="flex-1 bg-muted rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            disabled={loading}
          />
          <Button type="submit" size="icon" className="rounded-xl shrink-0" disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
