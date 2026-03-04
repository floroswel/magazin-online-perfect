import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";
import { useState } from "react";

const lockerProviders = [
  { name: "Sameday Easybox", count: "3000+", color: "bg-blue-500/10 text-blue-700" },
  { name: "Fan Courier PUDO", count: "1500+", color: "bg-orange-500/10 text-orange-700" },
  { name: "Cargus Ship&Go", count: "800+", color: "bg-yellow-500/10 text-yellow-700" },
];

export default function AdminLockers() {
  const [search, setSearch] = useState("");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><MapPin className="w-5 h-5" /> Lockere / Easybox</h1>
        <p className="text-sm text-muted-foreground">Hartă lockere, selecție la checkout, configurare provideri.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {lockerProviders.map((p) => (
          <Card key={p.name}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{p.count}</p>
              <p className="text-xs text-muted-foreground">{p.name}</p>
              <Badge className={`${p.color} mt-2 text-[10px]`}>Activ la checkout</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Caută locker după oraș..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-semibold">Hartă lockere</p>
          <p className="text-xs">Activează integrarea cu Sameday sau Fan Courier pentru a afișa harta lockerelor.</p>
        </CardContent>
      </Card>
    </div>
  );
}
