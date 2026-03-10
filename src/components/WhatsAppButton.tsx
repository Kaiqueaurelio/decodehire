import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const phone = "5511939222885";
  const message = encodeURIComponent("Olá! Gostaria de saber mais sobre o Decode Analytics.");
  const url = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-110"
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}
