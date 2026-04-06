import { useSettings } from "@/hooks/useSettings";
import { useEditableContent } from "@/hooks/useEditableContent";

export interface StoreBranding {
  name: string;
  emoji: string;
  tagline: string;
  phone: string;
  email: string;
  copyright: string;
}

export function useStoreBranding(): StoreBranding {
  const { settings } = useSettings();
  const { header_topbar } = useEditableContent();

  const name = settings.site_name || "MamaLucica";

  return {
    name,
    emoji: "🕯️",
    tagline: settings.site_tagline || "Lumânări artizanale",
    phone: settings.contact_phone || header_topbar.phone || "",
    email: settings.contact_email || "contact@mamalucica.ro",
    copyright: settings.copyright_text || `© ${new Date().getFullYear()} ${name}. Toate drepturile rezervate.`,
  };
}
