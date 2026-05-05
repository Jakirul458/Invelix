import { useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Printer, IndianRupee, Trash2, AlertCircle } from "lucide-react";
import { InvoiceView, type InvoiceData, type InvoiceItem, type BusinessData } from "@/components/invoices/InvoiceView";
import { PaymentModal } from "@/components/invoices/PaymentModal";
import { statusFor } from "@/lib/invoice-calc";
import { inr } from "@/lib/format";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SIGNED_URL_TTL = 60 * 60;

async function signedUrl(path: string | null, bucket: "signatures" | "logos" | "qrcodes") {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
}

const STATUS_CONFIG = {
  paid:    { label: "Paid",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  partial: { label: "Partial", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  unpaid:  { label: "Unpaid",  cls: "bg-red-50 text-red-700 border-red-200" },
};

function StatusBadge({ s }: { s: "paid" | "partial" | "unpaid" }) {
  const cfg = STATUS_CONFIG[s];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 inline-block" />
      {cfg.label}
    </span>
  );
}

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["invoice", id],
    enabled: !!id && !!user,
    retry: 1,
    queryFn: async () => {
      /* ── 1. invoice ── */
      const { data: inv, error: e1 } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id!)
        .single();
      if (e1) throw new Error(`Invoice not found: ${e1.message}`);

      /* ── 2. items ── */
      const { data: items, error: e2 } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id!)
        .order("created_at");
      if (e2) throw new Error(`Items error: ${e2.message}`);

      /* ── 3. owner — never throw, fall back to empty ── */
      const { data: owner } = await supabase
        .from("owners")
        .select("*")
        .eq("id", user!.id)
        .single();

      /* ── 4. signed URLs — only if owner exists ── */
      const [logoUrl, sigUrl, qrUrl] = owner
        ? await Promise.all([
            signedUrl(owner.logo_url ?? null, "logos"),
            signedUrl(owner.signature_url ?? null, "signatures"),
            signedUrl((owner as any).qr_code_url ?? null, "qrcodes"),
          ])
        : [null, null, null];

      const itemsWithHsn = ((items ?? []) as any[]).map((it) => ({
        ...it,
        hsn_code: it.hsn_code ?? null,
      })) as InvoiceItem[];

      const business: BusinessData = owner
        ? { ...owner, logo_url: logoUrl, signature_url: sigUrl, qr_code_url: qrUrl }
        : ({} as BusinessData);

      return { invoice: inv as InvoiceData, items: itemsWithHsn, business };
    },
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: data?.invoice.invoice_no ?? "invoice",
  });

  const payMutation = useMutation({
    mutationFn: async (newPaid: number) => {
      if (!data) return;
      const due_amount = Math.max(0, data.invoice.final_amount - newPaid);
      const status = statusFor(newPaid, data.invoice.final_amount);
      const { error } = await supabase
        .from("invoices")
        .update({ paid_amount: newPaid, due_amount, status })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Payment recorded" });
      setPayOpen(false);
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: Error) =>
      toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invoices").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Invoice deleted" });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      navigate("/invoices");
    },
    onError: (e: Error) =>
      toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="grid place-items-center py-32">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /* ── Error state ── */
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {error ? (error as Error).message : "Invoice not found."}
        </p>
        <Button asChild variant="outline" size="sm" className="rounded-lg mt-1">
          <Link to="/invoices">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to invoices
          </Link>
        </Button>
      </div>
    );
  }

  const { invoice } = data;

  return (
    <div className="space-y-5 max-w-5xl mx-auto p-1">

      {/* ── Topbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <Link to="/invoices">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back
            </Link>
          </Button>

          <div className="w-px h-5 bg-border/60" />

          <div>
            <h1 className="text-lg font-semibold tracking-tight font-mono leading-tight">
              {invoice.invoice_no}
            </h1>
            <p className="text-xs text-muted-foreground">
              {new Date(invoice.created_at).toLocaleString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>

          <StatusBadge s={invoice.status as "paid" | "partial" | "unpaid"} />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap print:hidden">
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
          <button
            onClick={() => setPayOpen(true)}
            disabled={invoice.due_amount <= 0}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <IndianRupee className="h-3.5 w-3.5" />
            Add payment
          </button>
          <button
            onClick={() => handlePrint?.()}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-foreground text-background hover:bg-foreground/85 transition-all"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-3 gap-3 print:hidden">
        {[
          { label: "Total",  value: inr(invoice.final_amount), cls: "text-foreground",      accent: "bg-blue-500" },
          { label: "Paid",   value: inr(invoice.paid_amount),  cls: "text-emerald-600",     accent: "bg-emerald-500" },
          { label: "Due",    value: inr(invoice.due_amount),   cls: "text-amber-600",       accent: "bg-amber-500" },
        ].map((s) => (
          <div key={s.label} className="relative bg-background rounded-xl border border-border/60 px-4 py-3 overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${s.accent}`} />
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-lg font-semibold font-mono ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Collection progress ── */}
      {invoice.final_amount > 0 && (
        <div className="bg-background rounded-xl border border-border/60 px-5 py-3 print:hidden">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">Collection progress</span>
            <span className="text-xs font-semibold font-mono">
              {Math.min(100, Math.round((invoice.paid_amount / invoice.final_amount) * 100))}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (invoice.paid_amount / invoice.final_amount) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Invoice view ── */}
      <div className="bg-muted/30 rounded-xl border border-border/60 p-3 sm:p-5 overflow-x-auto">
        <InvoiceView
          ref={printRef}
          invoice={data.invoice}
          items={data.items}
          business={data.business}
        />
      </div>

      {/* ── Payment modal ── */}
      <PaymentModal
        open={payOpen}
        onOpenChange={setPayOpen}
        finalAmount={invoice.final_amount}
        paidAmount={invoice.paid_amount}
        submitting={payMutation.isPending}
        onSubmit={(p) => payMutation.mutateAsync(p)}
      />

      {/* ── Delete confirm ── */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the invoice and its items. Stock won't be restored automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
              onClick={() => deleteMutation.mutate()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}