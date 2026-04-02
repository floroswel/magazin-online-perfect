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
  const { store_general, header_topbar } = useEditableContent();

  return {
    name: store_general.store_name || "MamaLucica",
    emoji: "🕯️",
    tagline: store_general.store_slogan || "Lumânări artizanale",
    phone: header_topbar.phone || "",
    email: store_general.store_email || "contact@mamalucica.ro",
    copyright: `© ${new Date().getFullYear()} ${store_general.store_name || "MamaLucica"}. Toate drepturile rezervate.`,
  };
}
