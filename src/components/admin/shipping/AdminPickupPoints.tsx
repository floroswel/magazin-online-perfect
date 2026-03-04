import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

export default function AdminPickupPoints() {
  const { data: carriers = [] } = useQuery({
    queryKey: ["carriers-pickup"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courier_configs").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><MapPin className="w-5 h-5" /> Puncte de Ridicare</h1>
        <p className="text-sm text-muted-foreground">Easybox, PUDO și alte puncte de ridicare disponibile la checkout.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {carriers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              <MapPin className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
              <p>Activează curieri cu suport puncte de ridicare (Sameday Easybox, Fan Courier PUDO).</p>
            </CardContent>
          </Card>
        ) : carriers.map((c: any) => (
          <Card key={c.id}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-semibold text-sm">{c.display_name}</p>
                <Badge variant="outline" className="text-[10px]">{c.courier}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {c.default_pickup_address ? "✅ Adresă ridicare configurată" : "⚠️ Configurează adresa de ridicare"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
