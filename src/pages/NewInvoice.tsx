import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, Save, Package, User, Receipt, ChevronDown, Barcode } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { invoiceSchema, type InvoiceFormValues } from "@/lib/schemas";
import { computeItem, computeTotals, statusFor } from "@/lib/invoice-calc";
import { inr, num } from "@/lib/format";
import { BarcodeScanner } from "@/components/invoices/BarcodeScanner";

interface ProductRow {
  id: string;
  name: string;
  stock_qty: number;
  cost_price: number;
  selling_price: number;
  gst_rate: number | null;
  barcode?: string | null;
  hsn_code?: string | null;
}

function Section({
  label, icon, children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background rounded-xl border border-border/60 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 bg-muted/20">
        <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Field({
  id, label, error, required, children,
}: {
  id?: string; label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-foreground/80">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

export default function NewInvoice() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["products", user?.id, "for-invoice"],
    enabled: !!user,
    queryFn: async (): Promise<ProductRow[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock_qty, cost_price, selling_price, gst_rate, barcode, hsn_code")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const {
    register, control, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      customer_address: "",
      customer_gstin: "",
      gst_enabled: false,
      discount: 0,
      paid_amount: 0,
      items: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({ control, name: "items" });

  const items      = watch("items");
  const gstEnabled = watch("gst_enabled");
  const discount   = watch("discount");
  const paid       = watch("paid_amount");

  const totals = useMemo(
    () => computeTotals(items, {
      gstEnabled,
      discount: Number(discount) || 0,
      paid: Number(paid) || 0,
    }),
    [items, gstEnabled, discount, paid],
  );

  useEffect(() => {
    if (Number(paid) > totals.final_amount) setValue("paid_amount", totals.final_amount);
  }, [totals.final_amount, paid, setValue]);

  const addProduct = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    append({
      product_id: p.id,
      product_name: p.name,
      quantity: 1,
      cost_price: Number(p.cost_price),
      selling_price: Number(p.selling_price),
      gst_rate: Number(p.gst_rate ?? 18),
      hsn_code: p.hsn_code || null,
      barcode: p.barcode || null,
    });
  };

  const handleScannedProduct = (scannedItem: any) => {
    // Check if product already in invoice
    const existingIndex = items.findIndex(
      (item) => item.product_id === scannedItem.product_id
    );

    if (existingIndex >= 0) {
      // Increase quantity if already added
      const currentQty = items[existingIndex].quantity || 1;
      update(existingIndex, {
        ...items[existingIndex],
        quantity: currentQty + 1,
      });
      toast({ title: "Quantity updated", description: `${scannedItem.product_name} qty increased` });
    } else {
      // Add new item
      append({
        product_id: scannedItem.product_id,
        product_name: scannedItem.product_name,
        quantity: 1,
        cost_price: Number(scannedItem.cost_price),
        hsn_code: scannedItem.hsn_code || null,
        barcode: scannedItem.product_barcode || scannedItem.barcode || null,
        selling_price: Number(scannedItem.selling_price),
        gst_rate: Number(scannedItem.gst_rate ?? 18),
      });
      toast({ title: "Product added", description: scannedItem.product_name });
    }
  };

  const addCustom = () => {
    append({
      product_id: null,
      product_name: "",
      quantity: 1,
      cost_price: 0,
      selling_price: 0,
      gst_rate: 18,
    });
  };

  const createMutation = useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      for (const it of values.items) {
        if (!it.product_id) continue;
        const p = products.find((x) => x.id === it.product_id);
        if (p && Number(it.quantity) > Number(p.stock_qty)) {
          throw new Error(`Not enough stock for "${p.name}" (available: ${p.stock_qty})`);
        }
      }

      const { data: invNo, error: noErr } = await supabase.rpc("next_invoice_no", { _owner_id: user!.id });
      if (noErr) throw noErr;

      const t = computeTotals(values.items, {
        gstEnabled: values.gst_enabled,
        discount: Number(values.discount) || 0,
        paid: Number(values.paid_amount) || 0,
      });

      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .insert({
          owner_id: user!.id,
          invoice_no: invNo as string,
          customer_name: values.customer_name,
          customer_phone: values.customer_phone || null,
          customer_address: values.customer_address || null,
          customer_gstin: values.customer_gstin || null,
          gst_enabled: values.gst_enabled,
          discount: Number(values.discount) || 0,
          subtotal: t.subtotal,
          cgst_total: t.cgst_total,
          sgst_total: t.sgst_total,
          total_amount: t.total_amount,
          final_amount: t.final_amount,
          paid_amount: Number(values.paid_amount) || 0,
          due_amount: t.due_amount,
          profit: t.profit,
          status: statusFor(Number(values.paid_amount) || 0, t.final_amount),
        })
        .select("id")
        .single();
      if (invErr) throw invErr;

      const itemsPayload = values.items.map((it) => {
        const r = computeItem(it, values.gst_enabled);
        return {
          invoice_id: inv.id,
          product_id: it.product_id,
          product_name: it.product_name,
          quantity: it.quantity,
          cost_price: it.cost_price,
          selling_price: it.selling_price,
          gst_rate: values.gst_enabled ? it.gst_rate : 0,
          cgst: r.cgst,
          sgst: r.sgst,
          total_price: r.total_price,
          profit: r.profit,
        };
      });

      const { error: itErr } = await supabase.from("invoice_items").insert(itemsPayload);
      if (itErr) throw itErr;
      return inv.id as string;
    },
    onSuccess: (id) => {
      toast({ title: "Invoice created" });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      navigate(`/invoices/${id}`);
    },
    onError: (e: Error) =>
      toast({ title: "Failed to create", description: e.message, variant: "destructive" }),
  });

  const onSubmit = async (values: InvoiceFormValues) => {
    setSubmitting(true);
    try { await createMutation.mutateAsync(values); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-5xl pb-28">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">New invoice</h1>
        <p className="text-sm text-muted-foreground mt-1">Create a GST-ready invoice for your customer</p>
      </div>

      {/* ── Customer info ── */}
      <Section label="Customer details" icon={<User className="h-3.5 w-3.5" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="customer_name" label="Customer name" error={errors.customer_name?.message} required>
            <Input
              id="customer_name"
              placeholder="e.g. Rahul Sharma"
              {...register("customer_name")}
              className="h-9 text-sm rounded-lg"
            />
          </Field>
          <Field id="customer_phone" label="Phone number">
            <Input
              id="customer_phone"
              placeholder="+91 98765 43210"
              {...register("customer_phone")}
              className="h-9 text-sm rounded-lg font-mono"
            />
          </Field>
          <Field id="customer_address" label="Address">
            <Input
              id="customer_address"
              placeholder="Street, City, State, PIN"
              {...register("customer_address")}
              className="h-9 text-sm rounded-lg sm:col-span-2"
            />
          </Field>
          <Field id="customer_gstin" label="GSTIN">
            <Input
              id="customer_gstin"
              placeholder="Optional"
              {...register("customer_gstin")}
              className="h-9 text-sm rounded-lg font-mono uppercase"
            />
          </Field>
        </div>
      </Section>

      {/* ── GST toggle ── */}
      <div className="bg-background rounded-xl border border-border/60 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Apply GST on items</p>
          <p className="text-xs text-muted-foreground mt-0.5">CGST 9% + SGST 9% will be added to each item</p>
        </div>
        <Controller
          control={control}
          name="gst_enabled"
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      {/* ── Add items panel ── */}
      <Section label="Add items" icon={<Package className="h-3.5 w-3.5" />}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select onValueChange={addProduct}>
              <SelectTrigger className="h-9 text-sm rounded-lg">
                <SelectValue placeholder="Pick a product from inventory…" />
              </SelectTrigger>
              <SelectContent>
                {products.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No products yet.</div>
                )}
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs font-mono">
                      stock: {num(p.stock_qty)} · {inr(p.selling_price)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setScannerOpen(true)}
            className="h-9 rounded-lg text-sm gap-2"
            title="Scan product barcode"
          >
            <Barcode className="h-3.5 w-3.5" />
            Scan
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={addCustom}
            className="h-9 rounded-lg text-sm gap-2 border-dashed"
          >
            <Plus className="h-3.5 w-3.5" />
            Custom line
          </Button>
        </div>
      </Section>

      {/* ── Items table ── */}
      <div className="bg-background rounded-xl border border-border/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
              <Receipt className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Line items
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            {fields.length} {fields.length === 1 ? "item" : "items"}
          </span>
        </div>

        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-center">
            <Package className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No items yet — pick a product or add a custom line</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-muted/10">
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left py-2.5 pl-5 pr-2">
                    Product
                  </th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right py-2.5 px-2 w-24">
                    Qty
                  </th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right py-2.5 px-2 w-32">
                    Price (₹)
                  </th>
                  {gstEnabled && (
                    <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right py-2.5 px-2 w-24">
                      GST %
                    </th>
                  )}
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right py-2.5 px-2 w-32">
                    Total
                  </th>
                  <th className="w-12 py-2.5 pr-3" />
                </tr>
              </thead>
              <tbody>
                {fields.map((field, idx) => {
                  const it = items[idx];
                  const r  = it ? computeItem(it, gstEnabled) : { total_price: 0 };
                  return (
                    <tr key={field.id} className="border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="py-2.5 pl-5 pr-2">
                        <Input
                          value={it?.product_name ?? ""}
                          onChange={(e) => update(idx, { ...it, product_name: e.target.value })}
                          placeholder="Item name"
                          className="h-8 text-sm rounded-lg border-border/60 bg-transparent"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={it?.quantity ?? 0}
                          onChange={(e) => update(idx, { ...it, quantity: Number(e.target.value) })}
                          className="h-8 text-sm text-right font-mono rounded-lg border-border/60 bg-transparent"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={it?.selling_price ?? 0}
                          onChange={(e) => update(idx, { ...it, selling_price: Number(e.target.value) })}
                          className="h-8 text-sm text-right font-mono rounded-lg border-border/60 bg-transparent"
                        />
                      </td>
                      {gstEnabled && (
                        <td className="py-2.5 px-2">
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            max={100}
                            value={it?.gst_rate ?? 0}
                            onChange={(e) => update(idx, { ...it, gst_rate: Number(e.target.value) })}
                            className="h-8 text-sm text-right font-mono rounded-lg border-border/60 bg-transparent"
                          />
                        </td>
                      )}
                      <td className="py-2.5 px-2 text-right font-mono text-sm font-medium">
                        {inr(r.total_price)}
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {errors.items && (
          <p className="text-[11px] text-destructive px-5 pb-3">{errors.items.message as string}</p>
        )}
      </div>

      {/* ── Adjustments + Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Adjustments */}
        <div className="lg:col-span-2 bg-background rounded-xl border border-border/60 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 bg-muted/20">
            <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Adjustments
            </span>
          </div>
          <div className="px-5 py-4 space-y-4">
            <Field id="discount" label="Discount (₹)">
              <Input
                id="discount"
                type="number"
                step="0.01"
                min={0}
                placeholder="0.00"
                {...register("discount")}
                className="h-9 text-sm rounded-lg font-mono"
              />
            </Field>
            <Field id="paid_amount" label="Paid now (₹)">
              <Input
                id="paid_amount"
                type="number"
                step="0.01"
                min={0}
                placeholder="0.00"
                {...register("paid_amount")}
                className="h-9 text-sm rounded-lg font-mono"
              />
            </Field>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-3 bg-background rounded-xl border border-border/60 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 bg-muted/20">
            <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
              <Receipt className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Summary
            </span>
          </div>
          <div className="px-5 py-4 space-y-2.5">
            <SummaryRow label="Subtotal" value={inr(totals.subtotal)} />
            {gstEnabled && (
              <>
                <SummaryRow label="CGST (9%)" value={inr(totals.cgst_total)} />
                <SummaryRow label="SGST (9%)" value={inr(totals.sgst_total)} />
              </>
            )}
            <SummaryRow label="Discount" value={`− ${inr(Number(discount) || 0)}`} muted />
            <div className="border-t border-border/60 pt-2.5">
              <SummaryRow
                label="Final amount"
                value={inr(totals.final_amount)}
                bold
              />
            </div>
            <SummaryRow
              label="Paid now"
              value={inr(Number(paid) || 0)}
              valueClass="text-emerald-600"
            />
            <SummaryRow
              label="Due amount"
              value={inr(totals.due_amount)}
              valueClass={totals.due_amount > 0 ? "text-amber-600" : "text-muted-foreground"}
            />

            {/* Mini progress bar */}
            {totals.final_amount > 0 && (
              <div className="pt-1">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (Number(paid) / totals.final_amount) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 text-right font-mono">
                  {Math.min(100, Math.round((Number(paid) / totals.final_amount) * 100))}% collected
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Save button — fixed bottom center ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 pointer-events-none">
        <div className="pointer-events-auto bg-background/80 backdrop-blur-md border border-border/60 rounded-2xl shadow-xl px-6 py-3 flex items-center gap-4">
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Total</p>
            <p className="text-base font-semibold font-mono">{inr(totals.final_amount)}</p>
          </div>
          <div className="w-px h-8 bg-border/60" />
          <Button
            type="submit"
            disabled={submitting}
            className="gap-2 bg-foreground text-background hover:bg-foreground/85 h-10 px-6 text-sm font-medium rounded-xl shadow-none"
          >
            {submitting
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Save className="h-4 w-4" />
            }
            Save invoice
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ── SummaryRow ── */
function SummaryRow({
  label, value, muted, bold, valueClass,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${muted || !bold ? "text-muted-foreground" : "text-foreground font-semibold"}`}>
        {label}
      </span>
      <span className={`font-mono text-sm ${bold ? "font-semibold text-foreground text-base" : ""} ${valueClass ?? ""}`}>
        {value}
      </span>
    </div>
  );
}