import { useExtendedTheme } from "@/hooks/useTheme";

export default function TrustIcons() {
  const { trust_icons } = useExtendedTheme();

  if (!trust_icons || trust_icons.length === 0) return null;

  return (
    <section className="bg-card py-4 border-t border-border">
      <div className="container px-4">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {trust_icons.map((icon, i) => (
            icon.url ? (
              <img
                key={i}
                src={icon.url}
                alt={icon.alt || "Trust icon"}
                className="h-10 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
              />
            ) : null
          ))}
        </div>
      </div>
    </section>
  );
}
