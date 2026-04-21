import { useSettings } from "@/hooks/useSettings";
import { MessageCircle } from "lucide-react";

export default function ThemeWhatsApp() {
  const { settings } = useSettings();

  const show = settings.whatsapp_show === "true";
  const number = settings.whatsapp_number || "";
  const message = settings.whatsapp_message || "";

  if (!show || !number) return null;

  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-40 lg:bottom-6 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      aria-label="WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}
