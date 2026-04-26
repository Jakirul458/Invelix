import type { InvoiceItemFormValues } from "@/lib/schemas";

export interface Totals {
  subtotal: number;
  cgst_total: number;
  sgst_total: number;
  total_amount: number;
  final_amount: number;
  due_amount: number;
  profit: number;
}

export function computeItem(item: InvoiceItemFormValues, gstEnabled: boolean) {
  const qty = Number(item.quantity) || 0;
  const sp = Number(item.selling_price) || 0;
  const cp = Number(item.cost_price) || 0;
  const rate = gstEnabled ? Number(item.gst_rate) || 0 : 0;
  const base = sp * qty;
  const cgst = (base * rate) / 200;
  const sgst = (base * rate) / 200;
  const total_price = base + cgst + sgst;
  const profit = (sp - cp) * qty;
  return { base, cgst, sgst, total_price, profit };
}

export function computeTotals(
  items: InvoiceItemFormValues[],
  opts: { gstEnabled: boolean; discount: number; paid: number },
): Totals {
  let subtotal = 0;
  let cgst_total = 0;
  let sgst_total = 0;
  let profit = 0;
  for (const it of items) {
    const r = computeItem(it, opts.gstEnabled);
    subtotal += r.base;
    cgst_total += r.cgst;
    sgst_total += r.sgst;
    profit += r.profit;
  }
  const total_amount = subtotal + cgst_total + sgst_total;
  const final_amount = Math.max(0, total_amount - (Number(opts.discount) || 0));
  const due_amount = Math.max(0, final_amount - (Number(opts.paid) || 0));
  return { subtotal, cgst_total, sgst_total, total_amount, final_amount, due_amount, profit };
}

export function statusFor(paid: number, final: number): "paid" | "unpaid" | "partial" {
  if (paid <= 0) return "unpaid";
  if (paid >= final) return "paid";
  return "partial";
}
