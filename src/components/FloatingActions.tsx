import { useState } from "react";
import { MessageCircle, Headset, X } from "lucide-react";
import SupportChat from "@/components/SupportChat";

export default function FloatingActions() {
  const [expanded, setExpanded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const phone = "5511939222885";
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre o Decode Analytics.")}`;

  if (chatOpen) {
    return <SupportChat onClose={() => setChatOpen(false)} />;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col-reverse items-end gap-2">
      {/* Main toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all hover:scale-105 hover:shadow-xl"
        aria-label="Abrir opções de suporte"
      >
        {expanded ? <X className="w-5 h-5" /> : <Headset className="w-5 h-5" />}
      </button>

      {/* Sub-actions */}
      {expanded && (
        <div className="flex flex-col items-end gap-2 animate-in slide-in-from-bottom-2 fade-in duration-150">
          {/* WhatsApp */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[hsl(142,70%,45%)] text-white rounded-full pl-3 pr-4 py-2 shadow-md hover:shadow-lg hover:scale-105 transition-all text-xs font-medium"
            aria-label="WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>

          {/* Chat IA */}
          <button
            onClick={() => { setChatOpen(true); setExpanded(false); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-full pl-3 pr-4 py-2 shadow-md hover:shadow-lg hover:scale-105 transition-all text-xs font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            Chat IA
          </button>
        </div>
      )}
    </div>
  );
}
