// import { useMemo, useState } from "react";
// import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { useAuthStore } from "@/lib/auth-store";
// import { toast } from "@/hooks/use-toast";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Loader2, Plus, Search, Pencil, Trash2, Package, AlertTriangle, TrendingUp, Barcode, Tag } from "lucide-react";
// import {
//   Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
// } from "@/components/ui/table";
// import {
//   AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
//   AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { ProductFormDialog } from "@/components/products/ProductFormDialog";
// import { ProductStickerDialog } from "@/components/products/ProductStickerDialog";
// import { inr, num } from "@/lib/format";
// import type { ProductFormValues } from "@/lib/schemas";

// interface Product {
//   id: string;
//   name: string;
//   hsn_code: string | null;
//   stock_qty: number;
//   cost_price: number;
//   selling_price: number;
//   gst_rate: number | null;
//   barcode?: string | null;
// }

// const LOW_STOCK = 5;

// function marginPct(cost: number, sell: number): number {
//   if (!sell) return 0;
//   return Math.round(((sell - cost) / sell) * 100);
// }

// interface StatCardProps {
//   icon: React.ReactNode;
//   iconClass: string;
//   accentClass: string;
//   value: string;
//   label: string;
// }

// function StatCard({ icon, iconClass, accentClass, value, label }: StatCardProps) {
//   return (
//     <div className="relative bg-background rounded-xl border border-border/60 p-4 overflow-hidden shadow-none">
//       <div className={`absolute top-0 left-0 right-0 h-[3px] ${accentClass}`} />
//       <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-3 ${iconClass}`}>
//         {icon}
//       </div>
//       <div className="text-xl font-semibold font-mono tracking-tight leading-none">{value}</div>
//       <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mt-1.5">
//         {label}
//       </div>
//     </div>
//   );
// }

// export default function Products() {
//   const { user } = useAuthStore();
//   const qc = useQueryClient();
//   const [search, setSearch] = useState("");
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [stickerDialogOpen, setStickerDialogOpen] = useState(false);
//   const [selectedProductForSticker, setSelectedProductForSticker] = useState<any>(null);
//   const [editing, setEditing] = useState<Product | null>(null);
//   const [deletingId, setDeletingId] = useState<string | null>(null);

//   const { data: products = [], isLoading } = useQuery({
//     queryKey: ["products", user?.id],
//     enabled: !!user,
//     queryFn: async (): Promise<Product[]> => {
//       const { data, error } = await supabase
//         .from("products")
//         .select("id, name, hsn_code, stock_qty, cost_price, selling_price, gst_rate, barcode")
//         .order("created_at", { ascending: false });
//       if (error) throw error;
//       return data ?? [];
//     },
//   });

//   const filtered = useMemo(() => {
//     const q = search.trim().toLowerCase();
//     if (!q) return products;
//     return products.filter(
//       (p) => p.name.toLowerCase().includes(q) || (p.hsn_code ?? "").toLowerCase().includes(q),
//     );
//   }, [products, search]);

//   const lowStockCount = products.filter((p) => Number(p.stock_qty) <= LOW_STOCK).length;
//   const inventoryValue = products.reduce(
//     (s, p) => s + Number(p.stock_qty) * Number(p.cost_price), 0,
//   );

//   const upsertMutation = useMutation({
//     mutationFn: async (values: ProductFormValues & { barcode?: string | null }) => {
//       const payload = {
//         name: values.name,
//         hsn_code: values.hsn_code || null,
//         stock_qty: values.stock_qty,
//         cost_price: values.cost_price,
//         selling_price: values.selling_price,
//         gst_rate: values.gst_rate,
//         barcode: values.barcode || null,
//         owner_id: user!.id,
//       };
//       if (editing?.id) {
//         const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
//         if (error) throw error;
//       } else {
//         const { data, error } = await supabase.from("products").insert(payload).select("id").single();
//         if (error) throw error;
//         // Log barcode generation if it was provided
//         if (values.barcode && data?.id) {
//           try {
//             await supabase
//               .from("barcode_logs")
//               .insert({
//                 product_id: data.id,
//                 owner_id: user!.id,
//                 barcode: values.barcode,
//                 action: "generated",
//               });
//           } catch (err) {
//             console.error("Failed to log barcode:", err);
//           }
//         }
//       }
//     },
//     onSuccess: () => {
//       toast({ title: editing ? "Product updated" : "Product created" });
//       setDialogOpen(false);
//       setEditing(null);
//       qc.invalidateQueries({ queryKey: ["products"] });
//     },
//     onError: (e: Error) =>
//       toast({ title: "Save failed", description: e.message, variant: "destructive" }),
//   });

//   const deleteMutation = useMutation({
//     mutationFn: async (id: string) => {
//       const { error } = await supabase.from("products").delete().eq("id", id);
//       if (error) throw error;
//     },
//     onSuccess: () => {
//       toast({ title: "Product deleted" });
//       setDeletingId(null);
//       qc.invalidateQueries({ queryKey: ["products"] });
//     },
//     onError: (e: Error) =>
//       toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
//   });

//   return (
//     <div className="space-y-6 p-1">
//       <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-semibold tracking-tight text-foreground">Products</h1>
//           <p className="text-sm text-muted-foreground mt-1">
//             Manage inventory, pricing &amp; GST rates
//           </p>
//         </div>
//         <Button
//           onClick={() => { setEditing(null); setDialogOpen(true); }}
//           className="gap-2 bg-foreground text-background hover:bg-foreground/85 h-9 px-4 text-sm font-medium rounded-lg shadow-none"
//         >
//           <Plus className="h-3.5 w-3.5" />
//           New product
//         </Button>
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//         <StatCard
//           icon={<Package className="h-4 w-4" />}
//           iconClass="bg-blue-50 text-blue-600"
//           accentClass="bg-blue-500"
//           value={String(products.length)}
//           label="Total products"
//         />
//         <StatCard
//           icon={<AlertTriangle className="h-4 w-4" />}
//           iconClass="bg-amber-50 text-amber-600"
//           accentClass="bg-amber-500"
//           value={String(lowStockCount)}
//           label={`Low stock (≤ ${LOW_STOCK} units)`}
//         />
//         <StatCard
//           icon={<TrendingUp className="h-4 w-4" />}
//           iconClass="bg-emerald-50 text-emerald-600"
//           accentClass="bg-emerald-500"
//           value={inr(inventoryValue)}
//           label="Inventory value (cost)"
//         />
//       </div>

//       <Card className="rounded-xl border border-border/60 shadow-none overflow-hidden p-0">
//         <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-muted/30">
//           <div className="relative max-w-xs w-full">
//             <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
//             <Input
//               placeholder="Search by name or HSN…"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="pl-8 h-8 text-sm bg-background border-border/60 rounded-lg shadow-none focus-visible:ring-1"
//             />
//           </div>
//           {!isLoading && (
//             <span className="text-xs text-muted-foreground font-medium hidden sm:block">
//               {filtered.length} of {products.length} products
//             </span>
//           )}
//         </div>

//         {isLoading ? (
//           <div className="grid place-items-center py-16">
//             <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
//           </div>
//         ) : filtered.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
//             <Package className="h-8 w-8 text-muted-foreground/40" />
//             <p className="text-sm text-muted-foreground">
//               {products.length === 0
//                 ? "No products yet. Create your first one."
//                 : "No products match your search."}
//             </p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/60">
//                   <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-5 py-2.5 w-[240px]">Product</TableHead>
//                   <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5">HSN</TableHead>
//                   <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5 text-right">Stock</TableHead>
//                   <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5 text-right">Cost</TableHead>
//                   <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5 text-right">Price</TableHead>
//                   <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5 text-right">Margin</TableHead>
//                   <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5 text-right">GST</TableHead>
//                   <TableHead className="py-2.5 pr-5 w-[72px]" />
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filtered.map((p) => {
//                   const low = Number(p.stock_qty) <= LOW_STOCK;
//                   const m = marginPct(Number(p.cost_price), Number(p.selling_price));
//                   return (
//                     <TableRow key={p.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
//                       <TableCell className="pl-5 py-3">
//                         <p className="font-medium text-sm text-foreground leading-tight">{p.name}</p>
//                         <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.hsn_code ?? "—"}</p>
//                       </TableCell>
//                       <TableCell className="font-mono text-xs text-muted-foreground py-3">
//                         {p.hsn_code ?? "—"}
//                       </TableCell>
//                       <TableCell className="text-right py-3">
//                         <div className="flex items-center justify-end gap-2">
//                           <span className={`font-mono text-sm font-medium ${low ? "text-amber-600" : "text-foreground"}`}>
//                             {num(p.stock_qty)}
//                           </span>
//                           {low && (
//                             <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
//                               <span className="w-1 h-1 rounded-full bg-amber-500 inline-block" />
//                               Low
//                             </span>
//                           )}
//                         </div>
//                       </TableCell>
//                       <TableCell className="text-right font-mono text-sm text-muted-foreground py-3">
//                         {inr(p.cost_price)}
//                       </TableCell>
//                       <TableCell className="text-right font-mono text-sm font-medium py-3">
//                         {inr(p.selling_price)}
//                       </TableCell>
//                       <TableCell className="text-right py-3">
//                         <span className={`inline-block text-[11px] font-semibold font-mono px-1.5 py-0.5 rounded ${m >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
//                           {m}%
//                         </span>
//                       </TableCell>
//                       <TableCell className="text-right py-3">
//                         <span className="inline-block text-[11px] font-semibold font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
//                           {num(p.gst_rate ?? 0)}%
//                         </span>
//                       </TableCell>
//                       <TableCell className="text-right pr-4 py-3">
//                         <div className="flex items-center justify-end gap-0.5">
//                           {p.barcode && (
//                             <button
//                               onClick={() => {
//                                 setSelectedProductForSticker({
//                                   id: p.id,
//                                   name: p.name,
//                                   selling_price: p.selling_price,
//                                   hsn_code: p.hsn_code,
//                                   barcode: p.barcode,
//                                   quantity: Number(p.stock_qty),
//                                 });
//                                 setStickerDialogOpen(true);
//                               }}
//                               className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
//                               title="Print stickers"
//                             >
//                               <Tag className="h-3.5 w-3.5" />
//                             </button>
//                           )}
//                           <button
//                             onClick={() => { setEditing(p); setDialogOpen(true); }}
//                             className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
//                           >
//                             <Pencil className="h-3.5 w-3.5" />
//                           </button>
//                           <button
//                             onClick={() => setDeletingId(p.id)}
//                             className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
//                           >
//                             <Trash2 className="h-3.5 w-3.5" />
//                           </button>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   );
//                 })}
//               </TableBody>
//             </Table>
//           </div>
//         )}
//       </Card>

//       <ProductFormDialog
//         open={dialogOpen}
//         onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null); }}
//         initial={
//           editing
//             ? {
//                 id: editing.id,
//                 name: editing.name,
//                 hsn_code: editing.hsn_code ?? "",
//                 stock_qty: Number(editing.stock_qty),
//                 cost_price: Number(editing.cost_price),
//                 selling_price: Number(editing.selling_price),
//                 gst_rate: Number(editing.gst_rate ?? 18),
//                 barcode: editing.barcode,
//               }
//             : undefined
//         }
//         submitting={upsertMutation.isPending}
//         onSubmit={(v) => upsertMutation.mutateAsync(v)}
//       />

//       <ProductStickerDialog
//         open={stickerDialogOpen}
//         onOpenChange={setStickerDialogOpen}
//         product={selectedProductForSticker}
//         quantity={selectedProductForSticker?.quantity || 1}
//       />

//       <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
//         <AlertDialogContent className="rounded-xl">
//           <AlertDialogHeader>
//             <AlertDialogTitle>Delete this product?</AlertDialogTitle>
//             <AlertDialogDescription>
//               This cannot be undone. Existing invoices referencing this product will retain their snapshot.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
//               onClick={() => deletingId && deleteMutation.mutate(deletingId)}
//             >
//               Delete
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }






import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search, Pencil, Trash2, Package, AlertTriangle, TrendingUp, Tag } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { ProductStickerDialog } from "@/components/products/ProductStickerDialog";
import { inr, num } from "@/lib/format";
import type { ProductFormValues } from "@/lib/schemas";

interface Product {
  id: string;
  name: string;
  hsn_code: string | null;
  stock_qty: number;
  cost_price: number;
  selling_price: number;
  gst_rate: number | null;
  barcode?: string | null;
}

const LOW_STOCK = 5;

function marginPct(cost: number, sell: number): number {
  if (!sell) return 0;
  return Math.round(((sell - cost) / sell) * 100);
}

interface StatCardProps {
  icon: React.ReactNode;
  iconClass: string;
  accentClass: string;
  value: string;
  label: string;
}

function StatCard({ icon, iconClass, accentClass, value, label }: StatCardProps) {
  return (
    <div className="relative bg-background rounded-xl border border-border/60 p-4 overflow-hidden shadow-none">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${accentClass}`} />
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-3 ${iconClass}`}>
        {icon}
      </div>
      <div className="text-xl font-semibold font-mono tracking-tight leading-none">{value}</div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mt-1.5">
        {label}
      </div>
    </div>
  );
}

export default function Products() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stickerDialogOpen, setStickerDialogOpen] = useState(false);
  const [selectedProductForSticker, setSelectedProductForSticker] = useState<any>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, hsn_code, stock_qty, cost_price, selling_price, gst_rate, barcode")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.hsn_code ?? "").toLowerCase().includes(q),
    );
  }, [products, search]);

  const lowStockCount = products.filter((p) => Number(p.stock_qty) <= LOW_STOCK).length;
  const inventoryValue = products.reduce(
    (s, p) => s + Number(p.stock_qty) * Number(p.cost_price), 0,
  );

  const upsertMutation = useMutation({
    mutationFn: async (values: ProductFormValues & { barcode?: string | null }) => {
      const payload = {
        name: values.name,
        hsn_code: values.hsn_code || null,
        stock_qty: values.stock_qty,
        cost_price: values.cost_price,
        selling_price: values.selling_price,
        gst_rate: values.gst_rate,
        barcode: values.barcode || null,
        owner_id: user!.id,
      };
      if (editing?.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        // Log barcode generation if it was provided
        if (values.barcode && data?.id) {
          try {
            await supabase
              .from("barcode_logs")
              .insert({
                product_id: data.id,
                owner_id: user!.id,
                barcode: values.barcode,
                action: "generated",
              });
          } catch (err) {
            console.error("Failed to log barcode:", err);
          }
        }
      }
    },
    onSuccess: () => {
      toast({ title: editing ? "Product updated" : "Product created" });
      setDialogOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Product deleted" });
      setDeletingId(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) =>
      toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="h-full flex flex-col space-y-6 p-1">
      {/* Fixed Header Section */}
      <div className="flex-none space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Products</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage inventory, pricing &amp; GST rates
            </p>
          </div>
          <Button
            onClick={() => { setEditing(null); setDialogOpen(true); }}
            className="gap-2 bg-foreground text-background hover:bg-foreground/85 h-9 px-4 text-sm font-medium rounded-lg shadow-none"
          >
            <Plus className="h-3.5 w-3.5" />
            New product
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Package className="h-4 w-4" />}
            iconClass="bg-blue-50 text-blue-600"
            accentClass="bg-blue-500"
            value={String(products.length)}
            label="Total products"
          />
          <StatCard
            icon={<AlertTriangle className="h-4 w-4" />}
            iconClass="bg-amber-50 text-amber-600"
            accentClass="bg-amber-500"
            value={String(lowStockCount)}
            label={`Low stock (≤ ${LOW_STOCK} units)`}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            iconClass="bg-emerald-50 text-emerald-600"
            accentClass="bg-emerald-500"
            value={inr(inventoryValue)}
            label="Inventory value (cost)"
          />
        </div>
      </div>

      {/* Scrollable Table Section */}
      <Card className="flex-1 flex flex-col rounded-xl border border-border/60 shadow-none overflow-hidden p-0 min-h-0">
        {/* Fixed Search Header */}
        <div className="flex-none flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-muted/30 sticky top-0 z-10">
          <div className="relative max-w-xs w-full">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name or HSN…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm bg-background border-border/60 rounded-lg shadow-none focus-visible:ring-1"
            />
          </div>
          {!isLoading && (
            <span className="text-xs text-muted-foreground font-medium hidden sm:block">
              {filtered.length} of {products.length} products
            </span>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
              <Package className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {products.length === 0
                  ? "No products yet. Create your first one."
                  : "No products match your search."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/20">
                <TableRow className="hover:bg-muted/20 border-b border-border/60">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-5 py-2.5 w-[240px] bg-muted/20">Product</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5 bg-muted/20">HSN</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5 text-right bg-muted/20">Stock</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5 text-right bg-muted/20">Cost</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5 text-right bg-muted/20">Price</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5 text-right bg-muted/20">Margin</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5 text-right bg-muted/20">GST</TableHead>
                  <TableHead className="py-2.5 pr-5 w-[72px] bg-muted/20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const low = Number(p.stock_qty) <= LOW_STOCK;
                  const m = marginPct(Number(p.cost_price), Number(p.selling_price));
                  return (
                    <TableRow key={p.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <TableCell className="pl-5 py-3">
                        <p className="font-medium text-sm text-foreground leading-tight">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.hsn_code ?? "—"}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground py-3">
                        {p.hsn_code ?? "—"}
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`font-mono text-sm font-medium ${low ? "text-amber-600" : "text-foreground"}`}>
                            {num(p.stock_qty)}
                          </span>
                          {low && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1 h-1 rounded-full bg-amber-500 inline-block" />
                              Low
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground py-3">
                        {inr(p.cost_price)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium py-3">
                        {inr(p.selling_price)}
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <span className={`inline-block text-[11px] font-semibold font-mono px-1.5 py-0.5 rounded ${m >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {m}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <span className="inline-block text-[11px] font-semibold font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                          {num(p.gst_rate ?? 0)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          {p.barcode && (
                            <button
                              onClick={() => {
                                setSelectedProductForSticker({
                                  id: p.id,
                                  name: p.name,
                                  selling_price: p.selling_price,
                                  hsn_code: p.hsn_code,
                                  barcode: p.barcode,
                                  quantity: Number(p.stock_qty),
                                });
                                setStickerDialogOpen(true);
                              }}
                              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="Print stickers"
                            >
                              <Tag className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => { setEditing(p); setDialogOpen(true); }}
                            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(p.id)}
                            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null); }}
        initial={
          editing
            ? {
                id: editing.id,
                name: editing.name,
                hsn_code: editing.hsn_code ?? "",
                stock_qty: Number(editing.stock_qty),
                cost_price: Number(editing.cost_price),
                selling_price: Number(editing.selling_price),
                gst_rate: Number(editing.gst_rate ?? 18),
                barcode: editing.barcode,
              }
            : undefined
        }
        submitting={upsertMutation.isPending}
        onSubmit={(v) => upsertMutation.mutateAsync(v)}
      />

      <ProductStickerDialog
        open={stickerDialogOpen}
        onOpenChange={setStickerDialogOpen}
        product={selectedProductForSticker}
        quantity={selectedProductForSticker?.quantity || 1}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Existing invoices referencing this product will retain their snapshot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}