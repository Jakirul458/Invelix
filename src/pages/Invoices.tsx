// import { useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { useAuthStore } from "@/lib/auth-store";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { 
//   Loader2, Search, Plus, Eye, Trash2, FileText, 
//   IndianRupee, AlertCircle, CheckCircle2, X 
// } from "lucide-react";
// import {
//   Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
// } from "@/components/ui/table";
// import { inr } from "@/lib/format";
// import { toast } from "sonner";

// type Status = "all" | "paid" | "unpaid" | "partial";

// interface Invoice {
//   id: string;
//   invoice_no: string;
//   customer_name: string;
//   customer_phone: string | null;
//   final_amount: number;
//   paid_amount: number;
//   due_amount: number;
//   status: "paid" | "unpaid" | "partial";
//   created_at: string;
// }

// const STATUS_CONFIG = {
//   paid:    { label: "Paid",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
//   partial: { label: "Partial", cls: "bg-amber-50 text-amber-700 border-amber-200" },
//   unpaid:  { label: "Unpaid",  cls: "bg-red-50 text-red-700 border-red-200" },
// };

// function StatusBadge({ s }: { s: Invoice["status"] }) {
//   const cfg = STATUS_CONFIG[s];
//   return (
//     <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
//       <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 inline-block" />
//       {cfg.label}
//     </span>
//   );
// }

// export default function Invoices() {
//   const { user } = useAuthStore();
//   const queryClient = useQueryClient();
//   const [search, setSearch]     = useState("");
//   const [status, setStatus]     = useState<Status>("all");
//   const [dateFrom, setDateFrom] = useState("");
//   const [dateTo, setDateTo]     = useState("");

//   const { data: invoices = [], isLoading } = useQuery({
//     queryKey: ["invoices", user?.id],
//     enabled: !!user,
//     queryFn: async (): Promise<Invoice[]> => {
//       const { data, error } = await supabase
//         .from("invoices")
//         .select("id, invoice_no, customer_name, customer_phone, final_amount, paid_amount, due_amount, status, created_at")
//         .order("created_at", { ascending: false });
//       if (error) throw error;
//       return (data ?? []) as Invoice[];
//     },
//   });

//   const handleDelete = async (id: string, invoiceNo: string) => {
//     if (!confirm(`Are you sure you want to delete invoice ${invoiceNo}?`)) return;

//     try {
//       const { error } = await supabase.from("invoices").delete().eq("id", id);
//       if (error) throw error;
      
//       toast.success(`Invoice ${invoiceNo} deleted`);
//       queryClient.invalidateQueries({ queryKey: ["invoices", user?.id] });
//     } catch (error: any) {
//       toast.error(error.message || "Failed to delete invoice");
//     }
//   };

//   const filtered = useMemo(() => {
//     const q   = search.trim().toLowerCase();
//     const from = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0)    : null;
//     const to   = dateTo   ? new Date(dateTo).setHours(23, 59, 59, 999) : null;

//     return invoices.filter((i) => {
//       if (status !== "all" && i.status !== status) return false;
//       const t = new Date(i.created_at).getTime();
//       if (from && t < from) return false;
//       if (to   && t > to)   return false;
//       if (!q) return true;
//       return (
//         i.invoice_no.toLowerCase().includes(q) ||
//         i.customer_name.toLowerCase().includes(q) ||
//         (i.customer_phone ?? "").includes(q) ||
//         new Date(i.created_at).toLocaleDateString("en-IN").includes(q)
//       );
//     });
//   }, [invoices, search, status, dateFrom, dateTo]);

//   const totals = useMemo(() => filtered.reduce(
//     (a, i) => ({
//       total:  a.total  + Number(i.final_amount),
//       paid:   a.paid   + Number(i.paid_amount),
//       due:    a.due    + Number(i.due_amount),
//     }),
//     { total: 0, paid: 0, due: 0 },
//   ), [filtered]);

//   const isFiltered = search || status !== "all" || dateFrom || dateTo;

//   function clearFilters() {
//     setSearch("");
//     setStatus("all");
//     setDateFrom("");
//     setDateTo("");
//   }

//   return (
//     <div className="space-y-6 p-1">

//       {/* ── Header ── */}
//       <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-semibold tracking-tight text-foreground">Invoices</h1>
//           <p className="text-sm text-muted-foreground mt-1">Search, filter and manage all your invoices</p>
//         </div>
//         <Button
//           asChild
//           className="gap-2 bg-foreground text-background hover:bg-foreground/85 h-9 px-4 text-sm font-medium rounded-lg shadow-none"
//         >
//           <Link to="/invoices/new">
//             <Plus className="h-3.5 w-3.5" />
//             New invoice
//           </Link>
//         </Button>
//       </div>

//       {/* ── Summary stat strip ── */}
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//         <MiniStat
//           label="Filtered invoices"
//           value={String(filtered.length)}
//           icon={<FileText className="h-3.5 w-3.5" />}
//           iconClass="bg-violet-50 text-violet-600"
//           accentClass="bg-violet-500"
//         />
//         <MiniStat
//           label="Total amount"
//           value={inr(totals.total)}
//           icon={<IndianRupee className="h-3.5 w-3.5" />}
//           iconClass="bg-blue-50 text-blue-600"
//           accentClass="bg-blue-500"
//         />
//         <MiniStat
//           label="Amount collected"
//           value={inr(totals.paid)}
//           icon={<CheckCircle2 className="h-3.5 w-3.5" />}
//           iconClass="bg-emerald-50 text-emerald-600"
//           accentClass="bg-emerald-500"
//         />
//         <MiniStat
//           label="Amount due"
//           value={inr(totals.due)}
//           icon={<AlertCircle className="h-3.5 w-3.5" />}
//           iconClass="bg-amber-50 text-amber-600"
//           accentClass="bg-amber-500"
//         />
//       </div>

//       {/* ── Filters card ── */}
//       <div className="bg-background rounded-xl border border-border/60 overflow-hidden">
//         <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
//           <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
//             Filters
//           </span>
//           {isFiltered && (
//             <button
//               onClick={clearFilters}
//               className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
//             >
//               <X className="h-3 w-3" /> Clear all
//             </button>
//           )}
//         </div>

//         <div className="px-5 py-4 flex flex-col sm:flex-row gap-3 flex-wrap">
//           <div className="relative flex-1 min-w-[200px]">
//             <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
//             <Input
//               placeholder="Invoice no, customer, phone…"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="pl-8 h-8 text-sm bg-muted/30 border-border/60 rounded-lg shadow-none focus-visible:ring-1"
//             />
//           </div>

//           <div className="flex flex-col gap-1">
//             <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">From</label>
//             <Input
//               type="date"
//               value={dateFrom}
//               onChange={(e) => setDateFrom(e.target.value)}
//               className="h-8 text-sm font-mono bg-muted/30 border-border/60 rounded-lg shadow-none focus-visible:ring-1 w-[140px]"
//             />
//           </div>

//           <div className="flex flex-col gap-1">
//             <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">To</label>
//             <Input
//               type="date"
//               value={dateTo}
//               onChange={(e) => setDateTo(e.target.value)}
//               className="h-8 text-sm font-mono bg-muted/30 border-border/60 rounded-lg shadow-none focus-visible:ring-1 w-[140px]"
//             />
//           </div>

//           <div className="flex flex-col gap-1">
//             <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">Status</label>
//             <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1 border border-border/40 h-8">
//               {(["all", "paid", "partial", "unpaid"] as Status[]).map((s) => (
//                 <button
//                   key={s}
//                   onClick={() => setStatus(s)}
//                   className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold capitalize transition-all ${
//                     status === s
//                       ? "bg-background text-foreground shadow-sm border border-border/60"
//                       : "text-muted-foreground hover:text-foreground"
//                   }`}
//                 >
//                   {s}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ── Table card ── */}
//       <div className="bg-background rounded-xl border border-border/60 overflow-hidden">
//         <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-muted/20">
//           <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
//             {filtered.length} {filtered.length === 1 ? "invoice" : "invoices"}
//           </span>
//           {isFiltered && (
//             <span className="text-[11px] text-muted-foreground">
//               of {invoices.length} total
//             </span>
//           )}
//         </div>

//         {isLoading ? (
//           <div className="grid place-items-center py-16">
//             <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
//           </div>
//         ) : filtered.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-16 gap-2">
//             <FileText className="h-8 w-8 text-muted-foreground/30" />
//             <p className="text-sm text-muted-foreground">
//               {invoices.length === 0 ? "No invoices yet." : "No invoices match your filters."}
//             </p>
//             {isFiltered && (
//               <button onClick={clearFilters} className="text-xs text-muted-foreground underline underline-offset-2 mt-1">
//                 Clear filters
//               </button>
//             )}
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/60">
//                   {["Invoice", "Customer", "Date", "Total", "Paid", "Due", "Status", ""].map((h, i) => (
//                     <TableHead
//                       key={h + i}
//                       className={`text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5 ${
//                         i === 0 ? "pl-5" : ""
//                       } ${["Total", "Paid", "Due"].includes(h) ? "text-right" : ""} ${h === "" ? "pr-4 w-[140px]" : ""}`}
//                     >
//                       {h}
//                     </TableHead>
//                   ))}
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filtered.map((i) => (
//                   <TableRow
//                     key={i.id}
//                     className="border-b border-border/40 hover:bg-muted/20 transition-colors"
//                   >
//                     <TableCell className="pl-5 py-3">
//                       <span className="font-mono text-sm font-medium text-foreground">{i.invoice_no}</span>
//                     </TableCell>

//                     <TableCell className="py-3">
//                       <p className="font-medium text-sm text-foreground leading-tight">{i.customer_name}</p>
//                       {i.customer_phone && (
//                         <p className="text-xs text-muted-foreground font-mono mt-0.5">{i.customer_phone}</p>
//                       )}
//                     </TableCell>

//                     <TableCell className="py-3">
//                       <span className="text-sm text-muted-foreground font-mono">
//                         {new Date(i.created_at).toLocaleDateString("en-IN", {
//                           day: "2-digit", month: "short", year: "numeric",
//                         })}
//                       </span>
//                     </TableCell>

//                     <TableCell className="text-right font-mono text-sm font-medium py-3">
//                       {inr(i.final_amount)}
//                     </TableCell>

//                     <TableCell className="text-right font-mono text-sm text-emerald-600 py-3">
//                       {inr(i.paid_amount)}
//                     </TableCell>

//                     <TableCell className="text-right font-mono text-sm py-3">
//                       <span className={Number(i.due_amount) > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}>
//                         {inr(i.due_amount)}
//                       </span>
//                     </TableCell>

//                     <TableCell className="py-3">
//                       <StatusBadge s={i.status} />
//                     </TableCell>

//                     <TableCell className="text-right pr-4 py-3">
//                       <div className="flex items-center justify-end gap-2">
//                         <Link
//                           to={`/invoices/${i.id}`}
//                           className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border/60 transition-all"
//                         >
//                           <Eye className="h-3.5 w-3.5" />
//                           View
//                         </Link>
//                         <button
//                           onClick={() => handleDelete(i.id, i.invoice_no)}
//                           className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
//                         >
//                           <Trash2 className="h-3.5 w-3.5" />
//                           Delete
//                         </button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>

//             {/* Footer totals row */}
//             <div className="flex items-center justify-end gap-8 px-5 py-3 border-t border-border/60 bg-muted/20">
//               <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Totals</span>
//               <span className="font-mono text-sm font-semibold text-foreground min-w-[90px] text-right">{inr(totals.total)}</span>
//               <span className="font-mono text-sm font-semibold text-emerald-600 min-w-[90px] text-right">{inr(totals.paid)}</span>
//               <span className="font-mono text-sm font-semibold text-amber-600 min-w-[90px] text-right">{inr(totals.due)}</span>
//               <span className="min-w-[60px]" />
//               <span className="min-w-[140px]" />
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// /* ── MiniStat ── */
// interface MiniStatProps {
//   label: string;
//   value: string;
//   icon: React.ReactNode;
//   iconClass: string;
//   accentClass: string;
// }

// function MiniStat({ label, value, icon, iconClass, accentClass }: MiniStatProps) {
//   return (
//     <div className="relative bg-background rounded-xl border border-border/60 px-4 py-3 overflow-hidden">
//       <div className={`absolute top-0 left-0 right-0 h-[3px] ${accentClass}`} />
//       <div className="flex items-center gap-2 mb-1.5">
//         <div className={`h-6 w-6 rounded-md flex items-center justify-center ${iconClass}`}>{icon}</div>
//         <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
//       </div>
//       <div className="text-base font-semibold font-mono tracking-tight">{value}</div>
//     </div>
//   );
// }






import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Loader2, Search, Plus, Eye, FileText,
  IndianRupee, AlertCircle, CheckCircle2, X, Trash2,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { inr } from "@/lib/format";

type Status = "all" | "paid" | "unpaid" | "partial";

interface Invoice {
  id: string;
  invoice_no: string;
  customer_name: string;
  customer_phone: string | null;
  final_amount: number;
  paid_amount: number;
  due_amount: number;
  status: "paid" | "unpaid" | "partial";
  created_at: string;
}

const STATUS_CONFIG = {
  paid:    { label: "Paid",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  partial: { label: "Partial", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  unpaid:  { label: "Unpaid",  cls: "bg-red-50 text-red-700 border-red-200" },
};

function StatusBadge({ s }: { s: Invoice["status"] }) {
  const cfg = STATUS_CONFIG[s];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 inline-block" />
      {cfg.label}
    </span>
  );
}

export default function Invoices() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch]         = useState("");
  const [status, setStatus]         = useState<Status>("all");
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingNo, setDeletingNo] = useState<string>("");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Invoice[]> => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_no, customer_name, customer_phone, final_amount, paid_amount, due_amount, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Invoice[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Invoice deleted" });
      setDeletingId(null);
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: Error) =>
      toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    const q    = search.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0)    : null;
    const to   = dateTo   ? new Date(dateTo).setHours(23, 59, 59, 999) : null;
    return invoices.filter((i) => {
      if (status !== "all" && i.status !== status) return false;
      const t = new Date(i.created_at).getTime();
      if (from && t < from) return false;
      if (to   && t > to)   return false;
      if (!q) return true;
      return (
        i.invoice_no.toLowerCase().includes(q) ||
        i.customer_name.toLowerCase().includes(q) ||
        (i.customer_phone ?? "").includes(q) ||
        new Date(i.created_at).toLocaleDateString("en-IN").includes(q)
      );
    });
  }, [invoices, search, status, dateFrom, dateTo]);

  const totals = useMemo(() => filtered.reduce(
    (a, i) => ({ total: a.total + Number(i.final_amount), paid: a.paid + Number(i.paid_amount), due: a.due + Number(i.due_amount) }),
    { total: 0, paid: 0, due: 0 },
  ), [filtered]);

  const isFiltered = search || status !== "all" || dateFrom || dateTo;

  function clearFilters() { setSearch(""); setStatus("all"); setDateFrom(""); setDateTo(""); }
  function confirmDelete(inv: Invoice) { setDeletingId(inv.id); setDeletingNo(inv.invoice_no); }

  return (
    <div className="space-y-6 p-1">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Search, filter and manage all your invoices</p>
        </div>
        <Button asChild className="gap-2 bg-foreground text-background hover:bg-foreground/85 h-9 px-4 text-sm font-medium rounded-lg shadow-none">
          <Link to="/invoices/new"><Plus className="h-3.5 w-3.5" />New invoice</Link>
        </Button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Filtered invoices" value={String(filtered.length)} icon={<FileText className="h-3.5 w-3.5" />} iconClass="bg-violet-50 text-violet-600" accentClass="bg-violet-500" />
        <MiniStat label="Total amount" value={inr(totals.total)} icon={<IndianRupee className="h-3.5 w-3.5" />} iconClass="bg-blue-50 text-blue-600" accentClass="bg-blue-500" />
        <MiniStat label="Amount collected" value={inr(totals.paid)} icon={<CheckCircle2 className="h-3.5 w-3.5" />} iconClass="bg-emerald-50 text-emerald-600" accentClass="bg-emerald-500" />
        <MiniStat label="Amount due" value={inr(totals.due)} icon={<AlertCircle className="h-3.5 w-3.5" />} iconClass="bg-amber-50 text-amber-600" accentClass="bg-amber-500" />
      </div>

      {/* Filters */}
      <div className="bg-background rounded-xl border border-border/60 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Filters</span>
          {isFiltered && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>
        <div className="px-5 py-4 flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input placeholder="Invoice no, customer, phone…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm bg-muted/30 border-border/60 rounded-lg shadow-none focus-visible:ring-1" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">From</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 text-sm font-mono bg-muted/30 border-border/60 rounded-lg shadow-none focus-visible:ring-1 w-[140px]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">To</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="h-8 text-sm font-mono bg-muted/30 border-border/60 rounded-lg shadow-none focus-visible:ring-1 w-[140px]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">Status</label>
            <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1 border border-border/40 h-8">
              {(["all", "paid", "partial", "unpaid"] as Status[]).map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold capitalize transition-all ${
                    status === s ? "bg-background text-foreground shadow-sm border border-border/60" : "text-muted-foreground hover:text-foreground"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-background rounded-xl border border-border/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-muted/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "invoice" : "invoices"}
          </span>
          {isFiltered && <span className="text-[11px] text-muted-foreground">of {invoices.length} total</span>}
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <FileText className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{invoices.length === 0 ? "No invoices yet." : "No invoices match your filters."}</p>
            {isFiltered && <button onClick={clearFilters} className="text-xs text-muted-foreground underline underline-offset-2 mt-1">Clear filters</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/60">
                  {["Invoice", "Customer", "Date", "Total", "Paid", "Due", "Status", ""].map((h, i) => (
                    <TableHead key={h + i} className={`text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5
                      ${i === 0 ? "pl-5" : ""}
                      ${["Total","Paid","Due"].includes(h) ? "text-right" : ""}
                      ${h === "" ? "pr-4 w-[110px]" : ""}`}>
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => (
                  <TableRow key={i.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                    <TableCell className="pl-5 py-3">
                      <span className="font-mono text-sm font-medium text-foreground">{i.invoice_no}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <p className="font-medium text-sm text-foreground leading-tight">{i.customer_name}</p>
                      {i.customer_phone && <p className="text-xs text-muted-foreground font-mono mt-0.5">{i.customer_phone}</p>}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm text-muted-foreground font-mono">
                        {new Date(i.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium py-3">{inr(i.final_amount)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-600 py-3">{inr(i.paid_amount)}</TableCell>
                    <TableCell className="text-right font-mono text-sm py-3">
                      <span className={Number(i.due_amount) > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                        {inr(i.due_amount)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3"><StatusBadge s={i.status} /></TableCell>

                    {/* ── View + Delete ── */}
                    <TableCell className="text-right pr-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/invoices/${i.id}`}
                          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border/60 transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                        <button
                          onClick={() => confirmDelete(i)}
                          title={`Delete ${i.invoice_no}`}
                          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Totals footer */}
            <div className="flex items-center justify-end gap-8 px-5 py-3 border-t border-border/60 bg-muted/20">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Totals</span>
              <span className="font-mono text-sm font-semibold text-foreground min-w-[90px] text-right">{inr(totals.total)}</span>
              <span className="font-mono text-sm font-semibold text-emerald-600 min-w-[90px] text-right">{inr(totals.paid)}</span>
              <span className="font-mono text-sm font-semibold text-amber-600 min-w-[90px] text-right">{inr(totals.due)}</span>
              <span className="min-w-[110px]" />
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingNo}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the invoice and its items. Stock won't be restored automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
            >
              {deleteMutation.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : "Delete"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ── MiniStat ── */
interface MiniStatProps {
  label: string; value: string;
  icon: React.ReactNode; iconClass: string; accentClass: string;
}
function MiniStat({ label, value, icon, iconClass, accentClass }: MiniStatProps) {
  return (
    <div className="relative bg-background rounded-xl border border-border/60 px-4 py-3 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${accentClass}`} />
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`h-6 w-6 rounded-md flex items-center justify-center ${iconClass}`}>{icon}</div>
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="text-base font-semibold font-mono tracking-tight">{value}</div>
    </div>
  );
}