import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Trash2, Copy, Image } from "lucide-react";

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size?: number; mimetype?: string } | null;
}

export default function AdminMediaLibrary() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from("product-images").list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setFiles((data || []).filter(f => f.name !== ".emptyFolderPlaceholder") as StorageFile[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const ext = file.name.split(".").pop();
      const path = `media/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) toast.error(`Eroare: ${file.name}`);
    }
    toast.success("Fișiere încărcate");
    setUploading(false);
    e.target.value = "";
    load();
  };

  const getUrl = (name: string) => {
    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(name);
    return publicUrl;
  };

  const copyUrl = (name: string) => {
    navigator.clipboard.writeText(getUrl(name));
    toast.success("URL copiat în clipboard");
  };

  const remove = async (name: string) => {
    if (!confirm(`Ștergi ${name}?`)) return;
    const { error } = await supabase.storage.from("product-images").remove([name]);
    if (error) { toast.error(error.message); return; }
    toast.success("Fișier șters");
    load();
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Media Library</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" disabled={uploading} asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-1" /> {uploading ? "Se încarcă..." : "Upload"}
              <Input type="file" multiple accept="image/*" className="hidden" onChange={upload} />
            </label>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-muted-foreground">Se încarcă...</p> : files.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Niciun fișier. Încarcă prima imagine.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map(f => (
              <div key={f.id || f.name} className="group relative border rounded-lg overflow-hidden bg-muted">
                {isImage(f.name) ? (
                  <img src={getUrl(f.name)} alt={f.name} className="w-full h-32 object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center"><Image className="h-8 w-8 text-muted-foreground" /></div>
                )}
                <div className="p-2">
                  <p className="text-xs truncate text-foreground">{f.name}</p>
                  {f.metadata?.size && <p className="text-[10px] text-muted-foreground">{(f.metadata.size / 1024).toFixed(0)} KB</p>}
                </div>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => copyUrl(f.name)}><Copy className="h-3 w-3" /></Button>
                  <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => remove(f.name)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
