import { useSettings } from "@/hooks/useSettings";
import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const { settings } = useSettings();

  const show = settings.whatsapp_show === "true" || settings.whatsapp_show === '"true"';
  const number = (settings.whatsapp_number || "").replace(/"/g, "");
  const message = (settings.whatsapp_message || "").replace(/"/g, "");

  if (!show || !number) return null;

  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-[80] lg:bottom-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform group"
      style={{ background: "#25D366" }}
      aria-label="WhatsApp"
      title="Scrie-ne pe WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white" />
    </a>
  );
}
