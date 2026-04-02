import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight, ShieldCheck, Flame, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface BrandStoryData {
  title: string;
  subtitle: string;
  text: string;
  image: string;
  stat1_value: string;
  stat1_label: string;
  stat2_value: string;
  stat2_label: string;
  stat3_value: string;
  stat3_label: string;
}

const DEFAULTS: BrandStoryData = {
  title: "Magazinul Nr. 1 de Lumânări Artizanale",
  subtitle: "",
  text: "Creăm lumânări artizanale cu ingrediente naturale pentru iubitorii de arome din toată România. Fiecare lumânare este turnată manual, cu grija și atenția pe care le meriți.",
  image: "https://images.unsplash.com/photo-1602607167093-5ac4af65e1cd?w=600&h=500&fit=crop",
  stat1_value: "", stat1_label: "Artizani",
  stat2_value: "", stat2_label: "Clienți Mulțumiți",
  stat3_value: "100%", stat3_label: "Natural & Handmade",
};

export default function BrandStory() {
  const ref = useScrollReveal();
  const [content, setContent] = useState<BrandStoryData>(DEFAULTS);

  // Real stats from DB
  const { data: stats } = useQuery({
    queryKey: ["brand-story-stats"],
    queryFn: async () => {
      const [brandsRes, customersRes] = await Promise.all([
        supabase.from("brands").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("user_id").not("user_id", "is", null),
      ]);
      const uniqueCustomers = new Set((customersRes.data || []).map((o: any) => o.user_id)).size;
      return {
        brands: brandsRes.count || 0,
        customers: uniqueCustomers,
      };
    },
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "brand_story_content").maybeSingle()
      .then(({ data }) => {
        if (data?.value_json && typeof data.value_json === "object") {
          setContent(prev => ({ ...prev, ...(data.value_json as any) }));
        }
      });
  }, []);

  const stat1Value = content.stat1_value || (stats ? `${stats.brands}+` : "50+");
  const stat2Value = content.stat2_value || (stats ? `${stats.customers.toLocaleString("ro-RO")}+` : "0");

  return (
    <section className="bg-card border-y border-border" ref={ref}>
      <div className="container py-8 md:py-14 px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center reveal stagger-1">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-card-foreground mb-4">
              {content.title}
            </h2>
            {content.subtitle && (
              <p className="text-primary font-medium text-sm mb-2">{content.subtitle}</p>
            )}
            <p className="text-muted-foreground text-sm md:text-base mb-6 leading-relaxed">
              {content.text}
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center bg-muted rounded-lg p-4">
                <Flame className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-card-foreground">{stat1Value}</p>
                <p className="text-[11px] text-muted-foreground">{content.stat1_label}</p>
              </div>
              <div className="text-center bg-muted rounded-lg p-4">
                <Users className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-card-foreground">{stat2Value}</p>
                <p className="text-[11px] text-muted-foreground">{content.stat2_label}</p>
              </div>
              <div className="text-center bg-muted rounded-lg p-4">
                <ShieldCheck className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-card-foreground">{content.stat3_value}</p>
                <p className="text-[11px] text-muted-foreground">{content.stat3_label}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/catalog" className="bg-primary text-primary-foreground font-semibold text-sm px-6 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
                Explorează Colecția <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/povestea-noastra" className="border border-border text-card-foreground font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-muted transition-colors">
                Povestea Noastră
              </Link>
            </div>
          </div>
          <div className="relative">
            <img
              src={content.image}
              alt="Lumânări artizanale handmade"
              className="w-full rounded-xl shadow-lg"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
