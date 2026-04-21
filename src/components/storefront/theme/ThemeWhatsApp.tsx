import { useSettings } from "@/hooks/useSettings";
import { MessageCircle } from "lucide-react";

const unq = (v?: string) => (v || "").replace(/^"|"$/g, "");

export default function ThemeWhatsApp() {
  const { settings: s } = useSettings();

  const show = s.whatsapp_show === "true";
  const number = unq(s.whatsapp_number) || "";
  const message = unq(s.whatsapp_message) || "";
  const position = unq(s.whatsapp_position) || "right";
  const color = unq(s.whatsapp_color) || "#25D366";

  if (!show || !number) return null;

  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-20 z-40 lg:bottom-6 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform ${position === "left" ? "left-4" : "right-4"}`}
      style={{ background: color }}
      aria-label="WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}
