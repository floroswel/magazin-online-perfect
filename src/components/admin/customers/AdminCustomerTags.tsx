import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Tag, X } from "lucide-react";
import { useState } from "react";

const defaultTags = ["VIP", "B2B", "Wholesale", "Fidel", "Nou", "Inactiv", "Problemă", "Influencer"];

export default function AdminCustomerTags() {
  const [tags, setTags] = useState(defaultTags);
  const [newTag, setNewTag] = useState("");

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Tag className="w-5 h-5" /> Etichete (Tag-uri) Clienți</h1>
        <p className="text-sm text-muted-foreground">Adăugare și gestionare tag-uri pe clienți pentru segmentare rapidă.</p>
      </div>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Etichetă nouă..." value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()} className="max-w-xs" />
            <Button size="sm" onClick={addTag}><Plus className="w-4 h-4 mr-1" /> Adaugă</Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-sm px-3 py-1.5 gap-1.5">
                {tag}
                <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{tags.length} etichete definite. Aplică-le din pagina de editare a clientului.</p>
        </CardContent>
      </Card>
    </div>
  );
}
