import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminPlaceholderProps {
  title: string;
  description?: string;
}

export default function AdminPlaceholder({ title, description }: AdminPlaceholderProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Construction className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground max-w-md">
          {description || "Acest modul va fi disponibil în curând. Lucrăm la implementarea completă."}
        </p>
      </CardContent>
    </Card>
  );
}
