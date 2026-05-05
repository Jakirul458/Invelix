import { forwardRef, type ReactNode } from "react";
import { inr, num } from "@/lib/format";
import { numberToWordsIN } from "@/lib/num-to-words";

export interface InvoiceItem {
  product_name: string;
  quantity: number;
  selling_price: number;
  gst_rate: number;
  cgst: number;
  sgst: number;
  total_price: number;
  hsn_code?: string | null;
}

export interface InvoiceData {
  invoice_no: string;
  customer_name: string;
  customer_phone: string | null;
  customer_address?: string | null;
  customer_gstin?: string | null;
  created_at: string;
  gst_enabled: boolean;
  subtotal: number;
  cgst_total: number;
  sgst_total: number;
  total_amount: number;
  discount: number;
  final_amount: number;
  paid_amount: number;
  due_amount: number;
  status: "paid" | "unpaid" | "partial";
}

export interface BusinessData {
  business_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string;
  gst_number: string | null;
  pan_number: string | null;
  logo_url: string | null;
  signature_url: string | null;
  qr_code_url?: string | null;
  bank_name?: string | null;
  bank_account?: string | null;
  bank_ifsc?: string | null;
  bank_branch?: string | null;
  bank_holder?: string | null;
}

interface Props {
  invoice: InvoiceData;
  items: InvoiceItem[];
  business: BusinessData;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });

export const InvoiceView = forwardRef<HTMLDivElement, Props>(({ invoice, items, business }, ref) => {
  const finalRounded = Math.round(invoice.final_amount);
  const roundOff     = Number((invoice.final_amount - finalRounded).toFixed(2));
  const totalQty     = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
  const hasPaid      = Number(invoice.paid_amount) > 0;
  const hasDue       = Number(invoice.due_amount)  > 0;
  const colSpanMid   = invoice.gst_enabled ? 4 : 3; // cols between sl# desc and amount

  return (
    <div
      ref={ref}
      className="invoice-print bg-white text-black mx-auto font-serif"
      style={{ width: "210mm", minHeight: "297mm", padding: "10mm", fontSize: "11px", lineHeight: 1.35 }}
    >
      <div className="border-2 border-black">

        {/* ── Top title bar ── */}
        <div className="grid grid-cols-3 border-b-2 border-black">
          <div className="col-span-1" />
          <div className="col-span-1 text-center py-1.5 font-bold text-base tracking-wide border-l border-r border-black">
            INVOICE
          </div>
          <div className="col-span-1 text-right py-1.5 px-2 text-[10px] italic">
            (ORIGINAL FOR RECIPIENT)
          </div>
        </div>

        {/* ── Seller + Invoice meta ── */}
        <div className="grid grid-cols-2 border-b-2 border-black">
          <div className="p-2 border-r-2 border-black">
            <div className="flex items-start gap-2">
              {business.logo_url && (
                <img
                  src={business.logo_url}
                  alt="Logo"
                  crossOrigin="anonymous"
                  className="h-12 w-12 object-contain"
                />
              )}
              <div className="flex-1">
                <div className="font-bold uppercase text-[13px] leading-tight">
                  {business.business_name || "Your Business"}
                </div>
                {business.address    && <div>{business.address}</div>}
                {(business.city || business.state) && (
                  <div>{business.city}{business.state ? `, ${business.state}` : ""}</div>
                )}
                {business.postal_code && <div>Pin- <span className="font-sans">{business.postal_code}</span></div>}
                {business.gst_number  && <div>GSTIN/UIN: <span className="font-sans font-semibold">{business.gst_number}</span></div>}
                {business.state       && <div>State Name: {business.state}</div>}
                {business.phone       && <div>Contact: <span className="font-sans">{business.phone}</span></div>}
                {business.email       && <div>E-Mail: <span className="font-sans">{business.email}</span></div>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 text-[10.5px]">
            <Cell label="Invoice No."           value={<span className="font-semibold">{invoice.invoice_no}</span>} />
            <Cell label="Dated"                 value={<span className="font-semibold">{fmtDate(invoice.created_at)}</span>} />
            <Cell label="Delivery Note"         value="" />
            <Cell label="Mode/Terms of Payment" value={invoice.status === "paid" ? "Paid" : invoice.status === "partial" ? "Partial" : "Credit"} />
            <Cell label="Reference No. & Date." value="" />
            <Cell label="Other References"      value="" />
            <Cell label="Buyer's Order No."     value="" />
            <Cell label="Dated"                 value="" />
            <Cell label="Dispatch Doc No."      value="" />
            <Cell label="Delivery Note Date"    value="" />
            <Cell label="Dispatched through"    value="" last />
            <Cell label="Destination"           value="" last />
          </div>
        </div>

        {/* ── Buyer ── */}
        <div className="grid grid-cols-2 border-b-2 border-black">
          <div className="p-2 border-r-2 border-black">
            <div className="text-[10px]">Buyer (Bill to)</div>
            <div className="font-bold uppercase mt-0.5">{invoice.customer_name}</div>
            {invoice.customer_address && <div>{invoice.customer_address}</div>}
            {invoice.customer_phone   && <div>Contact: <span className="font-sans">{invoice.customer_phone}</span></div>}
            {invoice.customer_gstin   && <div>GSTIN/UIN: <span className="font-sans font-semibold">{invoice.customer_gstin}</span></div>}
            {business.state           && <div>State Name: {business.state}</div>}
          </div>
          <div className="p-2" />
        </div>

        {/* ── Items table ── */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-center border-b border-black">
              <th className="border-r border-black py-1 px-1 w-8 font-semibold align-middle text-[10px]">Sl<br/>No.</th>
              <th className="border-r border-black py-1 px-1 text-left font-semibold align-middle text-[10px]">Description of Goods</th>
              <th className="border-r border-black py-1 px-1 w-14 font-semibold align-middle text-[10px]">HSN/SAC</th>
              {invoice.gst_enabled && (
                <th className="border-r border-black py-1 px-1 w-12 font-semibold align-middle text-[10px]">GST<br/>Rate</th>
              )}
              <th className="border-r border-black py-1 px-1 w-14 font-semibold align-middle text-right text-[10px]">Qty</th>
              <th className="border-r border-black py-1 px-1 w-16 font-semibold align-middle text-right text-[10px]">Rate</th>
              <th className="border-r border-black py-1 px-1 w-10 font-semibold align-middle text-center text-[10px]">per</th>
              <th className="py-1 px-1 w-20 font-semibold align-middle text-right text-[10px]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* Item rows */}
            {items.map((it, idx) => (
              <tr key={idx} className="align-top border-b border-gray-300">
                <td className="border-r border-black px-1 py-1 text-center text-[10px]">{idx + 1}</td>
                <td className="border-r border-black px-1 py-1 font-semibold uppercase text-[10px]">{it.product_name}</td>
                <td className="border-r border-black px-1 py-1 text-center text-[10px] font-sans">{it.hsn_code || "-"}</td>
                {invoice.gst_enabled && (
                  <td className="border-r border-black px-1 py-1 text-center font-sans text-[10px]">{num(it.gst_rate)}%</td>
                )}
                <td className="border-r border-black px-1 py-1 text-right font-sans text-[10px]">{num(it.quantity)}</td>
                <td className="border-r border-black px-1 py-1 text-right font-sans text-[10px]">{inr(it.selling_price)}</td>
                <td className="border-r border-black px-1 py-1 text-center text-[10px]">PCS</td>
                <td className="px-1 py-1 text-right font-sans text-[10px]">{inr(it.selling_price * it.quantity)}</td>
              </tr>
            ))}

            {/* GST rows */}
            {invoice.gst_enabled && invoice.cgst_total > 0 && (
              <SummaryRow gstEnabled={invoice.gst_enabled} label="CGST" value={num(invoice.cgst_total)} />
            )}
            {invoice.gst_enabled && invoice.sgst_total > 0 && (
              <SummaryRow gstEnabled={invoice.gst_enabled} label="SGST" value={num(invoice.sgst_total)} />
            )}

            {/* Discount */}
            {invoice.discount > 0 && (
              <SummaryRow gstEnabled={invoice.gst_enabled} label="Discount" value={`(−) ${num(invoice.discount)}`} />
            )}

            {/* Round off */}
            {Math.abs(roundOff) > 0 && (
              <SummaryRow
                gstEnabled={invoice.gst_enabled}
                label="Round Off (−/+)"
                value={roundOff > 0 ? `(−) ${num(roundOff)}` : `(+) ${num(-roundOff)}`}
              />
            )}

            {/* Spacer */}
            <tr>
              <td className="border-r border-black h-16" />
              <td className="border-r border-black" />
              <td className="border-r border-black" />
              {invoice.gst_enabled && <td className="border-r border-black" />}
              <td className="border-r border-black" />
              <td className="border-r border-black" />
              <td className="border-r border-black" />
              <td />
            </tr>

            {/* ── GRAND TOTAL ── */}
            <tr className="border-t-2 border-black font-bold bg-gray-50">
              <td className="border-r border-black" />
              <td className="border-r border-black px-1 py-1 text-right text-[10px]">Total</td>
              <td className="border-r border-black" />
              {invoice.gst_enabled && <td className="border-r border-black" />}
              <td className="border-r border-black px-1 py-1 text-right font-sans text-[10px]">{num(totalQty)}</td>
              <td className="border-r border-black" />
              <td className="border-r border-black" />
              <td className="px-1 py-1 text-right font-sans font-bold text-[10px]">{inr(finalRounded)}</td>
            </tr>

            {/* ── PAID AMOUNT ROW REMOVED ── */}
            {/* ── BALANCE DUE ── HIDDEN FROM CUSTOMER VIEW ── */}
            {/* Balance due row removed from display - kept in backend for internal tracking */}
          </tbody>
        </table>

        {/* ── Amount in words ── */}
        <div className="border-t-2 border-black p-2">
          <div className="text-[10px]">Amount Chargeable (in words)</div>
          <div className="flex justify-between items-end">
            <div className="font-bold uppercase">INR {numberToWordsIN(finalRounded)}</div>
            <div className="italic text-[10px]">E. & O.E</div>
          </div>
        </div>

        {/* ── Bottom: Remarks + Bank + Signature ── */}
        <div className="grid grid-cols-2 border-t-2 border-black">
          <div className="p-2 border-r-2 border-black space-y-1">
            <div>
              <span className="italic">Remarks:</span>{" "}
              <span className="font-semibold uppercase">{invoice.customer_name}</span>
            </div>
            <div className="italic">Declaration</div>
            <div className="text-[10px] leading-snug">
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </div>
            <div className="pt-10 text-[10px] border-t border-dashed border-black mt-6 inline-block px-4">
              Customer's Signature
            </div>
          </div>

          <div className="p-2 relative min-h-[140px]">
            <div className="text-[10px]">Company's Bank Details</div>
            <div className="grid grid-cols-[110px_1fr] gap-x-2 mt-1">
              <div>A/c Holder's Name</div>
              <div>: <span className="font-semibold uppercase">{business.bank_holder || business.business_name || "-"}</span></div>
              <div>Bank Name</div>
              <div>: <span className="font-semibold uppercase">{business.bank_name || "-"}</span></div>
              <div>A/c No.</div>
              <div>: <span className="font-semibold">{business.bank_account || "-"}</span></div>
              <div>Branch & IFSC Code</div>
              <div>: <span className="font-semibold uppercase">{[business.bank_branch, business.bank_ifsc].filter(Boolean).join(" & ") || "-"}</span></div>
            </div>

            <div className="absolute bottom-1 right-2 text-center">
              {business.qr_code_url && (
                <div className="mb-2">
                  <img
                    src={business.qr_code_url}
                    alt="QR Code"
                    crossOrigin="anonymous"
                    className="h-14 w-14 object-contain ml-auto border border-black p-0.5"
                  />
                </div>
              )}
              {business.signature_url && (
                <img
                  src={business.signature_url}
                  alt="Signature"
                  crossOrigin="anonymous"
                  className="h-12 object-contain ml-auto"
                />
              )}
              <div className="border-t border-black pt-0.5 px-2 text-[10px]">
                for <span className="font-bold uppercase">{business.business_name || "Your Business"}</span>
              </div>
              <div className="text-[10px] italic">Authorised Signatory</div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t-2 border-black text-center py-1 text-[10px] uppercase tracking-wide">
          SUBJECT TO {(business.state || "LOCAL").toUpperCase()} JURISDICTION
        </div>
        <div className="text-center text-[10px] italic pb-1">
          This is a Computer Generated Invoice
        </div>
      </div>
    </div>
  );
});
InvoiceView.displayName = "InvoiceView";

/* ── Cell helper ── */
function Cell({ label, value, last }: { label: string; value: ReactNode; last?: boolean }) {
  return (
    <div className={`px-2 py-1 border-l border-black ${last ? "" : "border-b"} border-black`}>
      <div className="text-[9.5px] leading-tight">{label}</div>
      <div className="leading-tight min-h-[14px]">{value}</div>
    </div>
  );
}

/* ── Summary row helper (GST, discount, roundoff, paid, due) ── */
function SummaryRow({
  gstEnabled, label, value,
}: {
  gstEnabled: boolean;
  label: string;
  value: string;
}) {
  return (
    <tr>
      <td className="border-r border-black" />
      <td className="border-r border-black px-1 italic text-right">{label}</td>
      <td className="border-r border-black" />
      {gstEnabled && <td className="border-r border-black" />}
      <td className="border-r border-black" />
      <td className="border-r border-black" />
      <td className="border-r border-black" />
      <td className="px-1 text-right font-sans">{value}</td>
    </tr>
  );
}