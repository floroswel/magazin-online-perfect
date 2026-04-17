import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, Globe } from "lucide-react";

export default function AdminSessions() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Sesiuni Active</h1>
        <p className="text-sm text-muted-foreground">Vizualizare sesiuni active ale utilizatorilor admin.</p>
      </div>
      <Card>
        <CardContent className="pt-4">
          <div className="text-center py-8 text-muted-foreground">
            <Monitor className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="mb-2">Sesiunile sunt gestionate de sistemul de autentificare.</p>
            <p className="text-xs">Utilizatorii pot fi delogați prin schimbarea parolei sau dezactivarea contului.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
