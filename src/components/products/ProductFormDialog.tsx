import React, { useEffect, useId, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, IndianRupee, Percent, Barcode, RefreshCw, Eye } from "lucide-react";
import { productSchema, type ProductFormValues } from "@/lib/schemas";
import { inr } from "@/lib/format";
import { generateUniqueBarcode, formatBarcodeForDisplay, logBarcodeAction } from "@/lib/barcode-utils";
import { useAuthStore } from "@/lib/auth-store";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: ProductFormValues & { id?: string; barcode?: string | null };
  submitting: boolean;
  onSubmit: (v: ProductFormValues & { barcode?: string | null }) => Promise<void>;
}

const GST_OPTIONS = [0, 5, 12, 18, 28];

function marginFromPrices(cost: number, sell: number): string {
  if (!cost || !sell || sell <= 0) return "";
  return (((sell - cost) / sell) * 100).toFixed(1);
}

function sellFromMargin(cost: number, pct: number): string {
  if (!cost || isNaN(pct) || pct >= 100) return "";
  return (cost / (1 - pct / 100)).toFixed(0);
}

export function ProductFormDialog({ open, onOpenChange, initial, submitting, onSubmit }: Props) {
  const uid = useId();
  const { user } = useAuthStore();
  const [barcodeValue, setBarcodeValue] = useState<string | null>(null);
  const [generatingBarcode, setGeneratingBarcode] = useState(false);
  const [showBarcodePreview, setShowBarcodePreview] = useState(false);

  const {
    register, handleSubmit, watch, setValue, reset, control,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      hsn_code: "",
      stock_qty: 0,
      cost_price: 0,
      selling_price: 0,
      gst_rate: 18,
    },
  });

  useEffect(() => {
    if (open) {
      reset(initial ?? {
        name: "", hsn_code: "", stock_qty: 0, cost_price: 0, selling_price: 0, gst_rate: 18,
      });
      setBarcodeValue(initial?.barcode || null);
      setShowBarcodePreview(false);
    }
  }, [open, initial, reset]);

  const cost    = Number(watch("cost_price"))    || 0;
  const sell    = Number(watch("selling_price")) || 0;
  const gstRate = Number(watch("gst_rate"))      || 0;

  const profit       = sell - cost;
  const marginPct    = sell > 0 ? (profit / sell) * 100 : 0;
  const markupPct    = cost > 0 ? (profit / cost) * 100 : 0;
  const priceWithGst = sell + sell * (gstRate / 100);
  const isProfit     = profit >= 0;

  function handleSellChange(raw: string) {
    setValue("selling_price", Number(raw) || 0, { shouldValidate: true });
  }

  function handleMarginInput(raw: string) {
    const pct = parseFloat(raw);
    if (!isNaN(pct) && cost > 0) {
      const computed = sellFromMargin(cost, pct);
      if (computed) setValue("selling_price", Number(computed), { shouldValidate: true });
    }
  }

  async function onValid(values: ProductFormValues) {
    try {
      await onSubmit({ ...values, barcode: barcodeValue });
      if (barcodeValue && initial?.id) {
        await logBarcodeAction(initial.id, user!.id, barcodeValue, "regenerated");
      } else if (barcodeValue && !initial?.id) {
        // Will be logged in parent after product creation with ID
      }
    } catch (err) {
      console.error("Form submission error:", err);
      throw err;
    }
  }

  async function handleGenerateBarcode() {
    if (!user?.id) return;
    
    setGeneratingBarcode(true);
    try {
      const barcode = await generateUniqueBarcode(user.id);
      setBarcodeValue(barcode);
    } catch (err) {
      console.error("Barcode generation failed:", err);
    } finally {
      setGeneratingBarcode(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60">
          <DialogTitle className="text-base font-semibold">
            {initial?.id ? "Edit product" : "Add new product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onValid)}>
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

            {/* Basic info */}
            <Section label="Basic info">
              <div className="space-y-3">
                <Field id={`${uid}-name`} label="Product name" error={errors.name?.message} required>
                  <Input
                    id={`${uid}-name`}
                    placeholder="e.g. Premium Cotton T-Shirt"
                    {...register("name")}
                    className="h-9 text-sm rounded-lg"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field id={`${uid}-hsn`} label="HSN code" error={errors.hsn_code?.message}>
                    <Input
                      id={`${uid}-hsn`}
                      placeholder="e.g. 6109"
                      {...register("hsn_code")}
                      className="h-9 text-sm rounded-lg font-mono"
                    />
                  </Field>
                  <Field id={`${uid}-stock`} label="Stock quantity" error={errors.stock_qty?.message} required>
                    <Input
                      id={`${uid}-stock`}
                      type="number"
                      min={0}
                      placeholder="0"
                      {...register("stock_qty", { valueAsNumber: true })}
                      className="h-9 text-sm rounded-lg font-mono"
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* Barcode */}
            <Section label="Barcode (Optional)">
              <div className="space-y-3">
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
                  <Field id={`${uid}-barcode`} label="Barcode">
                    <div className="flex gap-2">
                      <Input
                        id={`${uid}-barcode`}
                        placeholder="Auto-generated or manual"
                        value={barcodeValue || ""}
                        onChange={(e) => setBarcodeValue(e.target.value || null)}
                        className="h-9 text-sm rounded-lg font-mono flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateBarcode}
                        disabled={generatingBarcode}
                        className="px-3"
                      >
                        {generatingBarcode ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </Field>

                  {barcodeValue && (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowBarcodePreview(!showBarcodePreview)}
                        className="w-full justify-center gap-2"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {showBarcodePreview ? "Hide" : "Show"} Barcode Preview
                      </Button>

                      {showBarcodePreview && (
                        <div className="flex flex-col items-center gap-2 p-3 bg-white rounded border border-dashed border-border">
                          <Barcode className="h-6 w-6 text-muted-foreground" />
                          <div className="font-mono text-sm font-semibold">
                            {formatBarcodeForDisplay(barcodeValue)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            EAN-13 Barcode
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* Pricing */}
            <Section label="Pricing">
              <div className="space-y-4">

                {/* Cost price */}
                <Field id={`${uid}-cost`} label="Cost price (₹)" error={errors.cost_price?.message} required>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      id={`${uid}-cost`}
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      {...register("cost_price", { valueAsNumber: true })}
                      className="h-9 text-sm rounded-lg font-mono pl-8"
                    />
                  </div>
                </Field>

                {/* Selling price ↔ Margin % two-way */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Selling price &amp; margin
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <Field id={`${uid}-sell`} label="Selling price (₹)" error={errors.selling_price?.message} required>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          id={`${uid}-sell`}
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          value={sell || ""}
                          onChange={(e) => handleSellChange(e.target.value)}
                          className="h-9 text-sm rounded-lg font-mono pl-8"
                        />
                      </div>
                    </Field>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-foreground/80">
                        Margin %{" "}
                        <span className="text-muted-foreground font-normal">(auto-fills price)</span>
                      </Label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          type="number"
                          min={0}
                          max={99}
                          step="0.1"
                          placeholder={marginFromPrices(cost, sell) || "0.0"}
                          onChange={(e) => handleMarginInput(e.target.value)}
                          className="h-9 text-sm rounded-lg font-mono pl-8"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live profit panel */}
                  {cost > 0 && sell > 0 && (
                    <div className={`rounded-lg border p-3 transition-colors ${
                      isProfit ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                    }`}>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        {isProfit
                          ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                          : <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                        }
                        <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                          isProfit ? "text-emerald-700" : "text-red-700"
                        }`}>
                          {isProfit ? "Profitable" : "Below cost"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <StatRow
                          label="Profit / unit"
                          value={inr(Math.abs(profit))}
                          sub={profit < 0 ? "loss" : undefined}
                          isProfit={isProfit}
                        />
                        <StatRow
                          label="Margin"
                          value={`${Math.abs(marginPct).toFixed(1)}%`}
                          isProfit={isProfit}
                        />
                        <StatRow
                          label="Markup on cost"
                          value={`${Math.abs(markupPct).toFixed(1)}%`}
                          isProfit={isProfit}
                        />
                        <StatRow
                          label={`Price + GST (${gstRate}%)`}
                          value={inr(priceWithGst)}
                          isProfit={isProfit}
                          neutral
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* GST */}
                <Field id={`${uid}-gst`} label="GST rate" error={errors.gst_rate?.message}>
                  <Controller
                    control={control}
                    name="gst_rate"
                    render={({ field }) => (
                      <Select
                        value={String(field.value)}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger className="h-9 text-sm rounded-lg font-mono">
                          <SelectValue placeholder="Select GST" />
                        </SelectTrigger>
                        <SelectContent>
                          {GST_OPTIONS.map((r) => (
                            <SelectItem key={r} value={String(r)} className="font-mono text-sm">
                              {r}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>
            </Section>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/20 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-lg text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-9 rounded-lg text-sm bg-foreground text-background hover:bg-foreground/85 min-w-[100px]"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
              {initial?.id ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Sub-components ── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}

function Field({
  id, label, error, required, children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-foreground/80">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

function StatRow({
  label, value, sub, isProfit, neutral,
}: {
  label: string;
  value: string;
  sub?: string;
  isProfit: boolean;
  neutral?: boolean;
}) {
  const color = neutral
    ? "text-foreground"
    : isProfit ? "text-emerald-700" : "text-red-700";
  return (
    <div>
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-semibold font-mono ${color}`}>
        {value}
        {sub && <span className="text-[10px] ml-1 font-normal opacity-70">{sub}</span>}
      </p>
    </div>
  );
}