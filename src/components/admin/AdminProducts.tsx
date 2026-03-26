import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  Plus, Pencil, Trash2, Search, Upload, X, Image as ImageIcon,
  ChevronRight, ChevronLeft, Package, DollarSign, Warehouse, Camera, Globe,
  Copy, Eye, Check, Layers, Sparkles, Loader2, Link2, GripVertical,
  Barcode, Ruler, Weight, Tag, EyeOff, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AIGeneratorModal from "@/components/admin/products/AIGeneratorModal";
import AttributeExtractorModal from "@/components/admin/products/AttributeExtractorModal";

// ─── Types ───
interface BundleComponent {
  product_id: string;
  variant_id: string | null;
  quantity: number;
}

interface ProductForm {
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price: number;
  old_price: number | null;
  cost_price: number | null;
  stock: number;
  low_stock_threshold: number;
  sku: string;
  ean: string;
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  brand_id: string | null;
  image_url: string;
  images: string[];
  image_alts: Record<string, string>;
  featured: boolean;
  visible: boolean;
  status: string;
  category_id: string | null;
  additional_category_ids: string[];
  tags: string[];
  specs: Record<string, string>;
  meta_title: string;
  meta_description: string;
  related_product_ids: string[];
  product_type: string;
  bundle_pricing_mode: string;
  bundle_discount_percent: number;
  bundle_components: BundleComponent[];
}

interface VariantAttr {
  id: string;
  attribute: string;
  values: string[];
}

interface VariantCombination {
  id?: string;
  attributes: Record<string, string>;
  price: number;
  old_price: number | null;
  stock: number;
  sku: string;
  ean: string;
  image_url: string;
  is_active: boolean;
}

const STEPS = [
  { key: "basic", label: "Informații", icon: <Package className="w-4 h-4" /> },
  { key: "pricing", label: "Prețuri", icon: <DollarSign className="w-4 h-4" /> },
  { key: "variants", label: "Variante", icon: <Layers className="w-4 h-4" /> },
  { key: "bundle", label: "Pachet", icon: <Package className="w-4 h-4" /> },
  { key: "inventory", label: "Stoc & Logistică", icon: <Warehouse className="w-4 h-4" /> },
  { key: "media", label: "Media", icon: <Camera className="w-4 h-4" /> },
  { key: "seo", label: "SEO & Organizare", icon: <Globe className="w-4 h-4" /> },
  { key: "relations", label: "Relații", icon: <Link2 className="w-4 h-4" /> },
];

const emptyForm: ProductForm = {
  name: "", slug: "", short_description: "", description: "",
  price: 0, old_price: null, cost_price: null,
  stock: 0, low_stock_threshold: 5, sku: "", ean: "",
  weight_kg: null, length_cm: null, width_cm: null, height_cm: null,
  brand_id: null, image_url: "", images: [], image_alts: {},
  featured: false, visible: true, status: "active",
  category_id: null, additional_category_ids: [], tags: [],
  specs: {}, meta_title: "", meta_description: "", related_product_ids: [],
  product_type: "simple", bundle_pricing_mode: "fixed", bundle_discount_percent: 0, bundle_components: [],
};

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [variantAttrs, setVariantAttrs] = useState<VariantAttr[]>([]);
  const [variantCombos, setVariantCombos] = useState<VariantCombination[]>([]);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const [specKey, setSpecKey] = useState("");
  const [specVal, setSpecVal] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [previewOpen, setPreviewOpen] = useState<any>(null);
  const [removingBg, setRemovingBg] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [attrExtractorOpen, setAttrExtractorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const variantImageRef = useRef<HTMLInputElement>(null);
  const [uploadingVariantIdx, setUploadingVariantIdx] = useState<number | null>(null);

  // ─── Queries ───
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select("*, categories(name), brands(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: variantStats = {} as Record<string, { count: number; totalStock: number }> } = useQuery({
    queryKey: ["admin-variant-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("product_variants").select("product_id, stock, is_active");
      const stats: Record<string, { count: number; totalStock: number }> = {};
      (data || []).forEach((v: any) => {
        if (!stats[v.product_id]) stats[v.product_id] = { count: 0, totalStock: 0 };
        stats[v.product_id].count++;
        stats[v.product_id].totalStock += v.stock || 0;
      });
      return stats;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, parent_id").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: brandsList = [] } = useQuery({
    queryKey: ["admin-brands-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: allProductsForRelation = [] } = useQuery({
    queryKey: ["admin-products-for-relation"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, image_url, price").order("name").limit(200);
      if (error) throw error;
      return data;
    },
  });

  // ─── Helpers ───
  const generateSlug = (name: string) =>
    name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const removeBackground = async (imageUrl: string, target: "main" | number) => {
    setRemovingBg(target === "main" ? "main" : `gallery-${target}`);
    try {
      const { data, error } = await supabase.functions.invoke("remove-background", { body: { image_url: imageUrl } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (target === "main") {
        setForm((f) => ({ ...f, image_url: data.url }));
      } else {
        setForm((f) => ({ ...f, images: f.images.map((img, i) => (i === target ? data.url : img)) }));
      }
      toast.success("Fundal eliminat!");
    } catch (err: any) {
      toast.error(err.message || "Eroare");
    }
    setRemovingBg(null);
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, image_url: url }));
      toast.success("Imagine încărcată!");
    } catch (err: any) { toast.error("Eroare: " + err.message); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) urls.push(await uploadImage(file));
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
      toast.success(`${urls.length} imagini încărcate!`);
    } catch (err: any) { toast.error("Eroare: " + err.message); }
    setUploading(false);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingVariantIdx === null) return;
    try {
      const url = await uploadImage(file);
      setVariantCombos((prev) => prev.map((vc, i) => i === uploadingVariantIdx ? { ...vc, image_url: url } : vc));
      toast.success("Imagine variantă încărcată!");
    } catch (err: any) { toast.error("Eroare: " + err.message); }
    setUploadingVariantIdx(null);
    if (variantImageRef.current) variantImageRef.current.value = "";
  };

  // ─── Drag & Drop image reorder ───
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setForm((f) => {
      const imgs = [...f.images];
      const [moved] = imgs.splice(dragIdx, 1);
      imgs.splice(idx, 0, moved);
      return { ...f, images: imgs };
    });
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  // ─── Variant helpers ───
  const generateVariantCombos = () => {
    const valid = variantAttrs.filter((v) => v.attribute && v.values.some(Boolean));
    if (!valid.length) { setVariantCombos([]); return; }
    const combos = valid.reduce<Record<string, string>[]>((acc, v) => {
      const filtered = v.values.filter(Boolean);
      if (!filtered.length) return acc;
      if (!acc.length) return filtered.map((val) => ({ [v.attribute]: val }));
      return acc.flatMap((combo) => filtered.map((val) => ({ ...combo, [v.attribute]: val })));
    }, []);
    setVariantCombos((prev) =>
      combos.map((attrs, idx) => {
        const key = JSON.stringify(attrs);
        const existing = prev.find((vc) => JSON.stringify(vc.attributes) === key);
        if (existing) return existing;
        return {
          attributes: attrs,
          price: form.price,
          old_price: form.old_price,
          stock: 0,
          sku: `${form.slug || "var"}-v${idx + 1}`,
          ean: "",
          image_url: "",
          is_active: true,
        };
      })
    );
  };

  const applyBulkPrice = () => {
    const p = Number(bulkPrice);
    if (!p || p <= 0) return;
    setVariantCombos((prev) => prev.map((vc) => ({ ...vc, price: p })));
    toast.success(`Preț ${p} aplicat la toate variantele`);
    setBulkPrice("");
  };

  const applyBulkStock = () => {
    const s = Number(bulkStock);
    if (isNaN(s) || s < 0) return;
    setVariantCombos((prev) => prev.map((vc) => ({ ...vc, stock: s })));
    toast.success(`Stoc ${s} aplicat la toate variantele`);
    setBulkStock("");
  };

  // ─── Save ───
  const saveMutation = useMutation({
    mutationFn: async (product: ProductForm & { id?: string }) => {
      const payload: any = {
        name: product.name,
        slug: product.slug || generateSlug(product.name),
        short_description: product.short_description || null,
        description: product.description,
        brand_id: product.brand_id || null,
        image_url: product.image_url,
        images: product.images,
        image_alts: product.image_alts,
        featured: product.featured,
        visible: product.visible,
        status: product.status,
        category_id: product.category_id,
        tags: product.tags,
        price: product.price,
        old_price: product.old_price,
        cost_price: product.cost_price,
        stock: product.stock,
        low_stock_threshold: product.low_stock_threshold,
        sku: product.sku || null,
        ean: product.ean || null,
        weight_kg: product.weight_kg,
        length_cm: product.length_cm,
        width_cm: product.width_cm,
        height_cm: product.height_cm,
        meta_title: product.meta_title || null,
        meta_description: product.meta_description || null,
        specs: product.specs,
        product_type: product.product_type,
        bundle_pricing_mode: product.bundle_pricing_mode,
        bundle_discount_percent: product.bundle_discount_percent,
      };

      if (!payload.meta_title && product.name) {
        payload.meta_title = product.name.slice(0, 60);
      }
      if (!payload.meta_description && product.description) {
        const text = product.description.replace(/<[^>]*>/g, "").slice(0, 160);
        payload.meta_description = text;
      }

      let productId = product.id;

      if (product.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        productId = inserted.id;
      }

      // Sync additional categories
      if (productId) {
        await supabase.from("product_categories").delete().eq("product_id", productId);
        if (product.additional_category_ids.length > 0) {
          const rows = product.additional_category_ids.map((cid) => ({ product_id: productId!, category_id: cid }));
          await supabase.from("product_categories").insert(rows);
        }
      }

      // Sync related products
      if (productId) {
        await supabase.from("product_relations").delete().eq("product_id", productId);
        if (product.related_product_ids.length > 0) {
          const rows = product.related_product_ids.map((rid, idx) => ({
            product_id: productId!,
            related_product_id: rid,
            relation_type: "related",
            sort_order: idx,
          }));
          await supabase.from("product_relations").insert(rows);
        }
      }

      // Sync variant combinations to product_variants table
      if (productId) {
        await supabase.from("product_variants").delete().eq("product_id", productId);
        if (variantCombos.length > 0) {
          const variantRows = variantCombos.map((vc) => ({
            product_id: productId!,
            attributes: vc.attributes,
            price: vc.price,
            old_price: vc.old_price,
            stock: vc.stock,
            sku: vc.sku || null,
            ean: vc.ean || null,
            image_url: vc.image_url || null,
            is_active: vc.is_active,
          }));
          await supabase.from("product_variants").insert(variantRows);
        }
      }

      // Sync bundle components
      if (productId) {
        await supabase.from("product_bundle_items").delete().eq("bundle_product_id", productId);
        if (product.product_type === "bundle" && product.bundle_components.length > 0) {
          const bundleRows = product.bundle_components.map((bc, idx) => ({
            bundle_product_id: productId!,
            component_product_id: bc.product_id,
            component_variant_id: bc.variant_id || null,
            quantity: bc.quantity,
            sort_order: idx,
          }));
          await supabase.from("product_bundle_items").insert(bundleRows);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-variant-stats"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setStep(0);
      setVariantAttrs([]);
      setVariantCombos([]);
      toast.success(editingId ? "Produs actualizat!" : "Produs adăugat!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("product_variants").delete().eq("product_id", id);
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-variant-stats"] });
      setDeleteConfirm(null);
      toast.success("Produs șters!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = async (product: any) => {
    const specs = product.specs || {};

    // Load additional categories
    let additionalCats: string[] = [];
    const { data: pcData } = await supabase.from("product_categories").select("category_id").eq("product_id", product.id);
    if (pcData) additionalCats = pcData.map((r: any) => r.category_id);

    // Load related products
    let relatedIds: string[] = [];
    const { data: relData } = await supabase.from("product_relations").select("related_product_id").eq("product_id", product.id).order("sort_order");
    if (relData) relatedIds = relData.map((r: any) => r.related_product_id);

    // Load existing variant combinations
    const { data: existingVariants } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id);

    let loadedAttrs: VariantAttr[] = [];
    let loadedCombos: VariantCombination[] = [];

    if (existingVariants?.length) {
      // Reconstruct attribute definitions from combinations
      const attrMap: Record<string, Set<string>> = {};
      existingVariants.forEach((v: any) => {
        const attrs = (typeof v.attributes === "object" && v.attributes) ? v.attributes as Record<string, string> : {};
        Object.entries(attrs).forEach(([k, val]) => {
          if (!attrMap[k]) attrMap[k] = new Set();
          attrMap[k].add(String(val));
        });
      });
      loadedAttrs = Object.entries(attrMap).map(([attr, vals]) => ({
        id: crypto.randomUUID(),
        attribute: attr,
        values: Array.from(vals),
      }));

      loadedCombos = existingVariants.map((v: any) => ({
        id: v.id,
        attributes: (typeof v.attributes === "object" && v.attributes) ? v.attributes as Record<string, string> : {},
        price: v.price,
        old_price: v.old_price,
        stock: v.stock || 0,
        sku: v.sku || "",
        ean: v.ean || "",
        image_url: v.image_url || "",
        is_active: v.is_active ?? true,
      }));
    }

    // Load bundle components
    let bundleComponents: BundleComponent[] = [];
    const { data: bundleData } = await supabase.from("product_bundle_items").select("*").eq("bundle_product_id", product.id).order("sort_order");
    if (bundleData) {
      bundleComponents = bundleData.map((b: any) => ({ product_id: b.component_product_id, variant_id: b.component_variant_id, quantity: b.quantity }));
    }

    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      short_description: product.short_description || "",
      description: product.description || "",
      price: product.price,
      old_price: product.old_price,
      cost_price: product.cost_price || null,
      stock: product.stock,
      low_stock_threshold: product.low_stock_threshold ?? 5,
      sku: product.sku || "",
      ean: product.ean || "",
      weight_kg: product.weight_kg || null,
      length_cm: product.length_cm || null,
      width_cm: product.width_cm || null,
      height_cm: product.height_cm || null,
      brand_id: product.brand_id || null,
      image_url: product.image_url || "",
      images: product.images || [],
      image_alts: product.image_alts || {},
      featured: product.featured || false,
      visible: product.visible ?? true,
      status: product.status || "active",
      category_id: product.category_id || null,
      additional_category_ids: additionalCats,
      tags: product.tags || [],
      specs: specs,
      meta_title: product.meta_title || "",
      meta_description: product.meta_description || "",
      related_product_ids: relatedIds,
      product_type: product.product_type || "simple",
      bundle_pricing_mode: product.bundle_pricing_mode || "fixed",
      bundle_discount_percent: product.bundle_discount_percent || 0,
      bundle_components: bundleComponents,
    });
    setVariantAttrs(loadedAttrs);
    setVariantCombos(loadedCombos);
    setStep(0);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setVariantAttrs([]);
    setVariantCombos([]);
    setStep(0);
    setDialogOpen(true);
  };

  const addVariantAttr = () => setVariantAttrs((v) => [...v, { id: crypto.randomUUID(), attribute: "", values: [""] }]);
  const updateVariantAttr = (id: string, field: string, value: any) => setVariantAttrs((vs) => vs.map((v) => v.id === id ? { ...v, [field]: value } : v));
  const removeVariantAttr = (id: string) => { setVariantAttrs((vs) => vs.filter((v) => v.id !== id)); };
  const addSpec = () => { if (!specKey.trim()) return; setForm((f) => ({ ...f, specs: { ...f.specs, [specKey.trim()]: specVal.trim() } })); setSpecKey(""); setSpecVal(""); };
  const removeSpec = (key: string) => setForm((f) => { const { [key]: _, ...rest } = f.specs; return { ...f, specs: rest }; });
  const addTag = () => { if (!tagInput.trim()) return; setForm((f) => ({ ...f, tags: [...f.tags.filter(t => t !== tagInput.trim()), tagInput.trim()] })); setTagInput(""); };
  const removeTag = (tag: string) => setForm((f) => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const filtered = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brands?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.slug?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const canProceed = () => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return form.price > 0;
    return true;
  };

  const handleSubmit = () => {
    if (!form.name.trim() || form.price <= 0) {
      toast.error("Completează numele și prețul!");
      return;
    }
    saveMutation.mutate({ ...form, slug: form.slug || generateSlug(form.name), id: editingId || undefined });
  };

  // ─── Variant combo label ───
  const comboLabel = (attrs: Record<string, string>) => Object.values(attrs).join(" / ");

  // ─── Wizard Steps ───
  const renderStep = () => {
    switch (step) {
      case 0: // Basic Info
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nume produs *</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: !editingId ? generateSlug(name) : f.slug }));
                }}
                placeholder="ex: Samsung Galaxy S24 Ultra"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="samsung-galaxy-s24-ultra" />
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={form.brand_id || "none"} onValueChange={(v) => setForm({ ...form, brand_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Selectează brand" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Fără brand</SelectItem>
                    {brandsList.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Descriere scurtă</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setAiModalOpen(true)} className="gap-1.5 text-xs" disabled={!form.name.trim()}>
                  <Sparkles className="w-3 h-3" /> Generează cu AI ✨
                </Button>
              </div>
              <Textarea value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} rows={2} placeholder="Rezumat scurt afișat pe card/listing..." />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Descriere completă (rich text)</Label>
                <Button
                  type="button" variant="outline" size="sm"
                  disabled={!form.name.trim()}
                  onClick={() => setAiModalOpen(true)}
                  className="gap-1.5 text-xs"
                >
                  <Sparkles className="w-3 h-3" />
                  Generează cu AI ✨
                </Button>
              </div>
              <RichTextEditor content={form.description} onChange={(html) => setForm((f) => ({ ...f, description: html }))} />
            </div>

            {/* Status & Visibility */}
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activ</SelectItem>
                    <SelectItem value="draft">Ciornă</SelectItem>
                    <SelectItem value="archived">Arhivat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.featured} onCheckedChange={(c) => setForm({ ...form, featured: c })} id="featured" />
                <Label htmlFor="featured" className="text-sm">Recomandat</Label>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.visible} onCheckedChange={(c) => setForm({ ...form, visible: c })} id="visible" />
                <Label htmlFor="visible" className="text-sm">Vizibil pe site</Label>
              </div>
            </div>

            {/* Specs */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label>Specificații tehnice</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setAttrExtractorOpen(true)} disabled={!form.description?.trim()} className="gap-1.5 text-xs">
                  <Sparkles className="w-3 h-3" /> Extrage atribute din descriere ✨
                </Button>
              </div>
              {Object.entries(form.specs).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(form.specs).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-sm bg-muted/50 rounded px-3 py-1.5">
                      <span className="font-medium text-foreground">{k}:</span>
                      <span className="text-muted-foreground flex-1">{v}</span>
                      <button type="button" onClick={() => removeSpec(k)} className="text-destructive hover:text-destructive/80">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input placeholder="Cheie (ex: Memorie)" value={specKey} onChange={(e) => setSpecKey(e.target.value)} className="flex-1" />
                <Input placeholder="Valoare (ex: 12GB)" value={specVal} onChange={(e) => setSpecVal(e.target.value)} className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={addSpec} disabled={!specKey.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 1: // Pricing
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Preț vânzare (RON) *</Label>
                <Input type="number" step="0.01" min="0" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="199.99" />
              </div>
              <div className="space-y-2">
                <Label>Preț comparat (RON)</Label>
                <Input type="number" step="0.01" min="0" value={form.old_price ?? ""} onChange={(e) => setForm({ ...form, old_price: e.target.value ? Number(e.target.value) : null })} placeholder="299.99" />
                <p className="text-xs text-muted-foreground">Afișat tăiat pe storefront</p>
              </div>
              <div className="space-y-2">
                <Label>Preț cost (RON)</Label>
                <Input type="number" step="0.01" min="0" value={form.cost_price ?? ""} onChange={(e) => setForm({ ...form, cost_price: e.target.value ? Number(e.target.value) : null })} placeholder="99.99" />
                <p className="text-xs text-muted-foreground">Vizibil doar în admin</p>
              </div>
            </div>
            {form.old_price && form.old_price > form.price && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm">
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Reducere: {Math.round(((form.old_price - form.price) / form.old_price) * 100)}%
                </span>
                <span className="text-muted-foreground ml-2">(economie {(form.old_price - form.price).toFixed(2)} RON)</span>
              </div>
            )}
            {form.cost_price && form.price > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm">
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  Marjă: {((1 - form.cost_price / form.price) * 100).toFixed(1)}%
                </span>
                <span className="text-muted-foreground ml-2">(profit {(form.price - form.cost_price).toFixed(2)} RON / buc.)</span>
              </div>
            )}
          </div>
        );

      case 2: // Variants
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4" /> Atribute Variante
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addVariantAttr} className="gap-1">
                <Plus className="w-4 h-4" /> Adaugă atribut
              </Button>
            </div>
            {variantAttrs.length === 0 && (
              <p className="text-sm text-muted-foreground">Nicio variantă. Adaugă atribute precum Culoare, Mărime, Capacitate etc.</p>
            )}
            {variantAttrs.map((variant) => (
              <Card key={variant.id} className="bg-muted/30 border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input placeholder="Nume atribut (ex: Culoare)" value={variant.attribute} onChange={(e) => updateVariantAttr(variant.id, "attribute", e.target.value)} className="flex-1" />
                    <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeVariantAttr(variant.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {variant.values.map((val, vi) => (
                      <div key={vi} className="flex items-center gap-1">
                        <Input value={val} onChange={(e) => { const nv = [...variant.values]; nv[vi] = e.target.value; updateVariantAttr(variant.id, "values", nv); }} placeholder={`Valoare ${vi + 1}`} className="w-32 h-8 text-sm" />
                        {variant.values.length > 1 && <button type="button" onClick={() => updateVariantAttr(variant.id, "values", variant.values.filter((_, i) => i !== vi))} className="text-destructive"><X className="w-3 h-3" /></button>}
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => updateVariantAttr(variant.id, "values", [...variant.values, ""])}>
                      <Plus className="w-3 h-3 mr-1" /> Valoare
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {variantAttrs.length > 0 && variantAttrs.some((v) => v.attribute && v.values.some(Boolean)) && (
              <Button type="button" onClick={generateVariantCombos} className="gap-2 w-full" variant="secondary">
                <RefreshCw className="w-4 h-4" /> Generează / Actualizează combinații ({
                  variantAttrs.reduce((acc, v) => {
                    const f = v.values.filter(Boolean).length;
                    return acc ? acc * (f || 1) : f;
                  }, 0)
                } variante)
              </Button>
            )}

            {/* Variant Combinations Table */}
            {variantCombos.length > 0 && (
              <div className="space-y-3 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">{variantCombos.length} Combinații</Label>
                  <div className="flex gap-2">
                    <div className="flex gap-1">
                      <Input placeholder="Preț" value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)} className="w-24 h-8 text-xs" type="number" />
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={applyBulkPrice}>Aplică preț</Button>
                    </div>
                    <div className="flex gap-1">
                      <Input placeholder="Stoc" value={bulkStock} onChange={(e) => setBulkStock(e.target.value)} className="w-20 h-8 text-xs" type="number" />
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={applyBulkStock}>Aplică stoc</Button>
                    </div>
                  </div>
                </div>
                <input ref={variantImageRef} type="file" accept="image/*" onChange={handleVariantImageUpload} className="hidden" />
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {variantCombos.map((vc, idx) => (
                    <Card key={idx} className={cn("border", !vc.is_active && "opacity-50")}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {vc.image_url ? (
                              <img src={vc.image_url} className="w-10 h-10 rounded object-cover border border-border cursor-pointer" onClick={() => { setUploadingVariantIdx(idx); variantImageRef.current?.click(); }} />
                            ) : (
                              <button type="button" onClick={() => { setUploadingVariantIdx(idx); variantImageRef.current?.click(); }} className="w-10 h-10 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                <Camera className="w-4 h-4 text-muted-foreground/50" />
                              </button>
                            )}
                            <div>
                              <p className="text-sm font-medium">{comboLabel(vc.attributes)}</p>
                              <div className="flex gap-1">
                                {Object.entries(vc.attributes).map(([k, v]) => (
                                  <Badge key={k} variant="outline" className="text-[10px]">{k}: {v}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <Switch checked={vc.is_active} onCheckedChange={(c) => setVariantCombos((prev) => prev.map((v, i) => i === idx ? { ...v, is_active: c } : v))} />
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px]">Preț</Label>
                            <Input type="number" step="0.01" value={vc.price || ""} onChange={(e) => setVariantCombos((prev) => prev.map((v, i) => i === idx ? { ...v, price: Number(e.target.value) } : v))} className="h-8 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Preț comparat</Label>
                            <Input type="number" step="0.01" value={vc.old_price ?? ""} onChange={(e) => setVariantCombos((prev) => prev.map((v, i) => i === idx ? { ...v, old_price: e.target.value ? Number(e.target.value) : null } : v))} className="h-8 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Stoc</Label>
                            <Input type="number" min="0" value={vc.stock} onChange={(e) => setVariantCombos((prev) => prev.map((v, i) => i === idx ? { ...v, stock: Number(e.target.value) } : v))} className="h-8 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">SKU</Label>
                            <Input value={vc.sku} onChange={(e) => setVariantCombos((prev) => prev.map((v, i) => i === idx ? { ...v, sku: e.target.value } : v))} className="h-8 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">EAN</Label>
                            <Input value={vc.ean} onChange={(e) => setVariantCombos((prev) => prev.map((v, i) => i === idx ? { ...v, ean: e.target.value } : v))} className="h-8 text-xs" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3: // Bundle
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tip produs</Label>
              <Select value={form.product_type} onValueChange={(v) => setForm({ ...form, product_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simplu</SelectItem>
                  <SelectItem value="variable">Cu variante</SelectItem>
                  <SelectItem value="bundle">Pachet (Bundle)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.product_type !== "bundle" ? (
              <p className="text-sm text-muted-foreground">Selectează tipul „Pachet (Bundle)" pentru a configura componentele pachetului.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Mod de preț</Label>
                  <Select value={form.bundle_pricing_mode} onValueChange={(v) => setForm({ ...form, bundle_pricing_mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Preț fix (setat manual la pasul Prețuri)</SelectItem>
                      <SelectItem value="dynamic">Preț dinamic (suma componentelor - discount %)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.bundle_pricing_mode === "dynamic" && (
                  <div className="space-y-2">
                    <Label>Discount pachet (%)</Label>
                    <Input type="number" min="0" max="100" step="1" value={form.bundle_discount_percent || ""} onChange={(e) => setForm({ ...form, bundle_discount_percent: Number(e.target.value) })} placeholder="10" />
                  </div>
                )}

                {/* Dynamic price preview */}
                {form.bundle_pricing_mode === "dynamic" && form.bundle_components.length >= 2 && (
                  (() => {
                    const sumPrices = form.bundle_components.reduce((sum, bc) => {
                      const p = allProductsForRelation.find((pr: any) => pr.id === bc.product_id);
                      return sum + (p ? Number(p.price) * bc.quantity : 0);
                    }, 0);
                    const discounted = sumPrices * (1 - form.bundle_discount_percent / 100);
                    return (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm">
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          Preț dinamic: {discounted.toFixed(2)} RON (economie {(sumPrices - discounted).toFixed(2)} RON / {form.bundle_discount_percent}%)
                        </span>
                      </div>
                    );
                  })()
                )}

                <div className="space-y-2 pt-2 border-t border-border">
                  <Label className="text-base font-semibold">Componente pachet ({form.bundle_components.length})</Label>
                  {form.bundle_components.length < 2 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">Minim 2 componente necesare.</p>
                  )}
                  {form.bundle_components.map((bc, idx) => {
                    const comp = allProductsForRelation.find((p: any) => p.id === bc.product_id);
                    return (
                      <div key={idx} className="flex items-center gap-3 bg-muted/30 rounded-lg p-2">
                        {comp?.image_url ? <img src={comp.image_url} className="w-10 h-10 object-cover rounded border border-border" /> : <div className="w-10 h-10 bg-muted rounded" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{comp?.name || "?"}</p>
                          <p className="text-xs text-muted-foreground">{Number(comp?.price || 0).toFixed(2)} RON</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Label className="text-xs">×</Label>
                          <Input type="number" min="1" value={bc.quantity} onChange={(e) => setForm((f) => ({ ...f, bundle_components: f.bundle_components.map((b, i) => i === idx ? { ...b, quantity: Math.max(1, Number(e.target.value)) } : b) }))} className="w-16 h-8 text-xs" />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setForm((f) => ({ ...f, bundle_components: f.bundle_components.filter((_, i) => i !== idx) }))}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <div className="border border-input rounded-md max-h-48 overflow-y-auto">
                  {allProductsForRelation
                    .filter((p: any) => p.id !== editingId && !form.bundle_components.some(bc => bc.product_id === p.id))
                    .map((p: any) => (
                      <button key={p.id} type="button" onClick={() => setForm((f) => ({ ...f, bundle_components: [...f.bundle_components, { product_id: p.id, variant_id: null, quantity: 1 }] }))} className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                        {p.image_url ? <img src={p.image_url} className="w-8 h-8 object-cover rounded" /> : <div className="w-8 h-8 bg-muted rounded" />}
                        <span className="text-sm flex-1 truncate">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{Number(p.price).toFixed(2)} RON</span>
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>
        );

      case 4: // Stock & Logistics
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Barcode className="w-3.5 h-3.5" /> SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Barcode className="w-3.5 h-3.5" /> EAN (cod de bare)</Label>
                <Input value={form.ean} onChange={(e) => setForm({ ...form, ean: e.target.value })} placeholder="5901234123457" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stoc disponibil * {variantCombos.length > 0 && <span className="text-muted-foreground font-normal">(bază — variantele au stoc individual)</span>}</Label>
                <Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Prag alertă stoc scăzut</Label>
                <Input type="number" min="0" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} />
              </div>
            </div>
            <div className={cn(
              "rounded-lg p-4 text-sm",
              form.stock === 0 ? "bg-destructive/10 border border-destructive/20" :
              form.stock <= form.low_stock_threshold ? "bg-yellow-500/10 border border-yellow-500/20" :
              "bg-green-500/10 border border-green-500/20"
            )}>
              {form.stock === 0 ? (
                <p className="text-destructive font-medium">⚠️ Stoc epuizat — produsul nu va fi disponibil pentru cumpărare</p>
              ) : form.stock <= form.low_stock_threshold ? (
                <p className="text-yellow-600 dark:text-yellow-500 font-medium">⚡ Stoc scăzut — sub pragul de {form.low_stock_threshold} unități</p>
              ) : (
                <p className="text-green-600 dark:text-green-400 font-medium">✓ Stoc suficient ({form.stock} buc.)</p>
              )}
            </div>

            <div className="pt-2 border-t border-border space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2"><Weight className="w-4 h-4" /> Greutate & Dimensiuni (pt. calcul transport)</Label>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Greutate (kg)</Label>
                  <Input type="number" step="0.01" min="0" value={form.weight_kg ?? ""} onChange={(e) => setForm({ ...form, weight_kg: e.target.value ? Number(e.target.value) : null })} placeholder="0.5" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Lungime (cm)</Label>
                  <Input type="number" step="0.1" min="0" value={form.length_cm ?? ""} onChange={(e) => setForm({ ...form, length_cm: e.target.value ? Number(e.target.value) : null })} placeholder="30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Lățime (cm)</Label>
                  <Input type="number" step="0.1" min="0" value={form.width_cm ?? ""} onChange={(e) => setForm({ ...form, width_cm: e.target.value ? Number(e.target.value) : null })} placeholder="20" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Înălțime (cm)</Label>
                  <Input type="number" step="0.1" min="0" value={form.height_cm ?? ""} onChange={(e) => setForm({ ...form, height_cm: e.target.value ? Number(e.target.value) : null })} placeholder="10" />
                </div>
              </div>
              {form.length_cm && form.width_cm && form.height_cm && (
                <p className="text-xs text-muted-foreground">Volum: {((form.length_cm * form.width_cm * form.height_cm) / 1000000).toFixed(4)} m³</p>
              )}
            </div>
          </div>
        );

      case 5: // Media
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Imagine principală</Label>
              <div className="flex gap-3 items-start">
                {form.image_url ? (
                  <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-border">
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setForm({ ...form, image_url: "" })} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
                  <div className="flex gap-2 flex-wrap">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      <Upload className="w-4 h-4 mr-1" /> {uploading ? "Se încarcă..." : "Încarcă"}
                    </Button>
                    {form.image_url && (
                      <Button type="button" variant="outline" size="sm" disabled={removingBg === "main"} onClick={() => removeBackground(form.image_url, "main")} className="gap-1.5">
                        {removingBg === "main" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Elimină fundal
                      </Button>
                    )}
                  </div>
                  <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="sau URL imagine..." className="text-xs" />
                  {form.image_url && (
                    <div className="space-y-1">
                      <Label className="text-xs">Alt text (imagine principală)</Label>
                      <Input
                        value={form.image_alts[form.image_url] || ""}
                        onChange={(e) => setForm((f) => ({ ...f, image_alts: { ...f.image_alts, [f.image_url]: e.target.value } }))}
                        placeholder="Descriere imagine..."
                        className="text-xs h-7"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Galerie imagini ({form.images.length}) — trageți pentru reordonare</Label>
              <div className="flex flex-wrap gap-2">
                {form.images.map((url, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "relative w-24 rounded-lg overflow-hidden border border-border group cursor-grab",
                      dragIdx === idx && "opacity-50 ring-2 ring-primary"
                    )}
                  >
                    <div className="aspect-square">
                      <img src={url} alt={form.image_alts[url] || `Gallery ${idx}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute top-0 left-0 right-0 flex justify-between p-0.5">
                      <GripVertical className="w-3.5 h-3.5 text-white drop-shadow" />
                      <button type="button" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))} className="bg-destructive text-destructive-foreground rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, image_url: url }))}
                      className="absolute bottom-0.5 left-0.5 bg-primary/80 text-primary-foreground rounded text-[9px] px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Setează ca principală"
                    >
                      ★ Main
                    </button>
                    <button
                      type="button"
                      disabled={removingBg === `gallery-${idx}`}
                      onClick={() => removeBackground(url, idx)}
                      className="absolute bottom-0.5 right-0.5 bg-primary text-primary-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Elimină fundal"
                    >
                      {removingBg === `gallery-${idx}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    </button>
                  </div>
                ))}
                <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={uploading} className="w-24 aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors">
                  <Plus className="w-5 h-5 text-muted-foreground/60" />
                  <span className="text-[10px] text-muted-foreground/60">Adaugă</span>
                </button>
              </div>
            </div>

            {form.images.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <Label className="text-sm">Alt text per imagine</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {form.images.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <img src={url} className="w-8 h-8 rounded object-cover border border-border" />
                      <Input
                        value={form.image_alts[url] || ""}
                        onChange={(e) => setForm((f) => ({ ...f, image_alts: { ...f.image_alts, [url]: e.target.value } }))}
                        placeholder={`Alt text imagine ${idx + 1}...`}
                        className="text-xs h-7 flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 6: // SEO & Organization
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categorie principală</Label>
              <Select value={form.category_id || "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Selectează" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Fără categorie</SelectItem>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.parent_id ? "  └ " : ""}{c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categorii adiționale (multi-select)</Label>
              <div className="border border-input rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
                {categories.filter((c: any) => c.id !== form.category_id).map((c: any) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                    <Checkbox
                      checked={form.additional_category_ids.includes(c.id)}
                      onCheckedChange={(checked) => {
                        setForm((f) => ({
                          ...f,
                          additional_category_ids: checked
                            ? [...f.additional_category_ids, c.id]
                            : f.additional_category_ids.filter((id) => id !== c.id),
                        }));
                      }}
                    />
                    {c.parent_id ? "└ " : ""}{c.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Etichete</Label>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {form.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Adaugă etichetă..." className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">SEO</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setAiModalOpen(true)} disabled={!form.name.trim()} className="gap-1.5 text-xs">
                  <Sparkles className="w-3 h-3" /> Generează cu AI ✨
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Meta titlu</Label>
                <Input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} placeholder={form.name || "Titlu pagină produs"} maxLength={60} />
                <p className="text-xs text-muted-foreground">{(form.meta_title || form.name).length}/60 caractere{!form.meta_title && form.name && " (auto-generat din numele produsului)"}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Meta descriere</Label>
                <Textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} placeholder="Descriere scurtă pentru motoarele de căutare..." rows={3} maxLength={160} />
                <p className="text-xs text-muted-foreground">{form.meta_description.length}/160 caractere{!form.meta_description && " (se auto-generează la salvare)"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Preview Google</Label>
                <div className="bg-muted/30 rounded-lg p-4 space-y-1">
                  <p className="text-blue-500 text-sm font-medium truncate">{form.meta_title || form.name || "Titlu produs"}</p>
                  <p className="text-xs text-green-600">example.ro/product/{form.slug || "slug-produs"}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{form.meta_description || form.description?.replace(/<[^>]*>/g, "").slice(0, 160) || "Descriere produs..."}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 7: // Relations
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold flex items-center gap-2"><Link2 className="w-4 h-4" /> Produse înrudite</Label>
              <p className="text-sm text-muted-foreground">Selectează produsele afișate pe pagina de detaliu ca recomandări.</p>
            </div>
            {form.related_product_ids.length > 0 && (
              <div className="space-y-1.5">
                {form.related_product_ids.map((rid) => {
                  const rp = allProductsForRelation.find((p: any) => p.id === rid);
                  if (!rp) return null;
                  return (
                    <div key={rid} className="flex items-center gap-3 bg-muted/30 rounded-lg p-2">
                      {rp.image_url ? <img src={rp.image_url} className="w-10 h-10 object-cover rounded border border-border" /> : <div className="w-10 h-10 bg-muted rounded" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{rp.name}</p>
                        <p className="text-xs text-muted-foreground">{Number(rp.price).toFixed(2)} RON</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setForm((f) => ({ ...f, related_product_ids: f.related_product_ids.filter(id => id !== rid) }))}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="border border-input rounded-md max-h-60 overflow-y-auto">
              {allProductsForRelation
                .filter((p: any) => p.id !== editingId && !form.related_product_ids.includes(p.id))
                .map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, related_product_ids: [...f.related_product_ids, p.id] }))}
                    className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                  >
                    {p.image_url ? <img src={p.image_url} className="w-8 h-8 object-cover rounded" /> : <div className="w-8 h-8 bg-muted rounded" />}
                    <span className="text-sm flex-1 truncate">{p.name}</span>
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produse ({products.length})</h1>
          <p className="text-sm text-muted-foreground">Gestionare catalog de produse</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {selectedIds.size > 0 && (
            <Button variant="destructive" onClick={() => setBulkDeleteConfirm(true)} disabled={bulkDeleting} className="gap-2">
              <Trash2 className="w-4 h-4" />
              {bulkDeleting ? "Se șterg..." : `Șterge ${selectedIds.size}`}
            </Button>
          )}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Caută produse..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-full sm:w-64" />
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Produs Nou
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filtered.length > 0 && filtered.every((p: any) => selectedIds.has(p.id))}
                      onCheckedChange={(checked) => setSelectedIds(checked ? new Set(filtered.map((p: any) => p.id)) : new Set())}
                    />
                  </TableHead>
                  <TableHead>Produs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Preț</TableHead>
                  <TableHead>Stoc</TableHead>
                  <TableHead>Variante</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: any) => {
                  const vs = (variantStats as Record<string, { count: number; totalStock: number }>)[p.id];
                  return (
                    <TableRow key={p.id} className={cn("group", selectedIds.has(p.id) && "bg-primary/5")}>
                      <TableCell>
                        <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={(checked) => {
                          setSelectedIds((prev) => { const next = new Set(prev); if (checked) next.add(p.id); else next.delete(p.id); return next; });
                        }} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded border border-border" />
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center"><ImageIcon className="w-5 h-5 text-muted-foreground" /></div>
                          )}
                          <div>
                            <p className="font-medium text-sm text-foreground">{p.name}</p>
                            <div className="flex gap-1 mt-0.5">
                              {p.product_type === "bundle" && <Badge variant="default" className="text-xs">📦 Pachet</Badge>}
                              {p.featured && <Badge variant="secondary" className="text-xs">★</Badge>}
                              {p.visible === false && <Badge variant="outline" className="text-xs text-muted-foreground"><EyeOff className="w-3 h-3 mr-0.5" />Ascuns</Badge>}
                              {p.sku && <Badge variant="outline" className="text-xs">{p.sku}</Badge>}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === "active" ? "default" : p.status === "draft" ? "secondary" : "outline"} className="text-xs capitalize">
                          {p.status || "active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-sm">{Number(p.price).toFixed(2)} RON</span>
                        {p.old_price && <span className="text-xs text-muted-foreground line-through ml-2">{Number(p.old_price).toFixed(2)}</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.stock > (p.low_stock_threshold || 5) ? "default" : p.stock > 0 ? "secondary" : "destructive"}>
                          {p.stock}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {vs ? (
                          <div className="text-xs">
                            <span className="font-medium">{vs.count}</span>
                            <span className="text-muted-foreground ml-1">var.</span>
                            <br />
                            <span className="text-muted-foreground">stoc: {vs.totalStock}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.brands?.name || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewOpen(p)} title="Preview"><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} title="Editează"><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            const dup = { ...emptyForm, name: p.name + " (copie)", slug: generateSlug(p.name + " copie"), price: p.price, old_price: p.old_price, stock: p.stock, description: p.description || "", brand_id: p.brand_id || null, image_url: p.image_url || "", images: p.images || [], category_id: p.category_id };
                            setForm(dup); setEditingId(null); setStep(0); setDialogOpen(true); toast.info("Produs duplicat — editează și salvează");
                          }} title="Duplică"><Copy className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(p.id)} title="Șterge"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Niciun produs găsit.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Product Wizard Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditingId(null); setForm(emptyForm); setStep(0); setVariantAttrs([]); setVariantCombos([]); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editează Produs" : "Produs Nou"}</DialogTitle>
            <DialogDescription>Pasul {step + 1} din {STEPS.length}: {STEPS[step].label}</DialogDescription>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            {STEPS.map((s, i) => (
              <button key={s.key} type="button" onClick={() => setStep(i)} className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                i === step ? "bg-primary text-primary-foreground" :
                i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {i < step ? <Check className="w-3 h-3" /> : s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="min-h-[300px]">{renderStep()}</div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Înapoi
            </Button>
            <div className="flex gap-2">
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="gap-1">
                  Continuă <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={saveMutation.isPending} className="gap-1">
                  {saveMutation.isPending ? "Se salvează..." : editingId ? "Actualizează" : "Creează produs"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmare ștergere</DialogTitle>
            <DialogDescription>Ești sigur că vrei să ștergi acest produs? Acțiunea este ireversibilă.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Renunță</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Se șterge..." : "Șterge definitiv"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete */}
      <Dialog open={bulkDeleteConfirm} onOpenChange={(open) => !open && setBulkDeleteConfirm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ștergere în masă</DialogTitle>
            <DialogDescription>Ești sigur că vrei să ștergi {selectedIds.size} produse?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkDeleteConfirm(false)}>Renunță</Button>
            <Button variant="destructive" disabled={bulkDeleting} onClick={async () => {
              setBulkDeleting(true);
              try {
                const ids = Array.from(selectedIds);
                for (let i = 0; i < ids.length; i += 50) {
                  const { error } = await supabase.from("products").delete().in("id", ids.slice(i, i + 50));
                  if (error) throw error;
                }
                queryClient.invalidateQueries({ queryKey: ["admin-products"] });
                queryClient.invalidateQueries({ queryKey: ["admin-variant-stats"] });
                toast.success(`${ids.length} produse șterse!`);
                setSelectedIds(new Set());
                setBulkDeleteConfirm(false);
              } catch (err: any) { toast.error(err.message); } finally { setBulkDeleting(false); }
            }}>
              {bulkDeleting ? "Se șterg..." : `Șterge ${selectedIds.size}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={!!previewOpen} onOpenChange={(open) => !open && setPreviewOpen(null)}>
        <DialogContent className="max-w-lg">
          {previewOpen && (
            <>
              <DialogHeader>
                <DialogTitle>{previewOpen.name}</DialogTitle>
                <DialogDescription>{previewOpen.brands?.name || "Fără brand"} • {previewOpen.categories?.name || "Fără categorie"}</DialogDescription>
              </DialogHeader>
              {previewOpen.image_url && <img src={previewOpen.image_url} alt={previewOpen.name} className="w-full h-48 object-cover rounded-lg border border-border" />}
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-xs">Preț</p>
                  <p className="font-bold text-foreground">{Number(previewOpen.price).toFixed(2)}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-xs">Stoc</p>
                  <p className="font-bold text-foreground">{previewOpen.stock}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-xs">Status</p>
                  <p className="font-bold text-foreground capitalize">{previewOpen.status || "active"}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-xs">Variante</p>
                  <p className="font-bold text-foreground">{(variantStats as any)[previewOpen.id]?.count || 0}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setPreviewOpen(null); openEdit(previewOpen); }}>
                  <Pencil className="w-4 h-4 mr-2" /> Editează
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Generator Modal */}
      <AIGeneratorModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        productName={form.name}
        currentValues={{
          description: form.description,
          short_description: form.short_description,
          meta_title: form.meta_title,
          meta_description: form.meta_description,
          tags: form.tags,
        }}
        brand={brandsList.find((b: any) => b.id === form.brand_id)?.name}
        category={categories.find((c: any) => c.id === form.category_id)?.name}
        specs={form.specs}
        onApply={(field, value) => {
          setForm((f) => ({ ...f, [field]: value }));
        }}
        onApplyAll={(values) => {
          setForm((f) => ({
            ...f,
            description: values.description,
            short_description: values.short_description,
            meta_title: values.meta_title,
            meta_description: values.meta_description,
            tags: values.tags,
          }));
        }}
      />

      {/* Attribute Extractor Modal */}
      <AttributeExtractorModal
        open={attrExtractorOpen}
        onClose={() => setAttrExtractorOpen(false)}
        productName={form.name}
        description={form.description}
        currentSpecs={form.specs}
        onApply={(specs) => setForm((f) => ({ ...f, specs }))}
      />
    </div>
  );
}
