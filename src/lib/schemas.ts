import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  hsn_code: z.string().trim().max(20).optional().or(z.literal("")),
  stock_qty: z.coerce.number().min(0, "Stock cannot be negative"),
  cost_price: z.coerce.number().min(0, "Cost price cannot be negative"),
  selling_price: z.coerce.number().min(0, "Selling price cannot be negative"),
  gst_rate: z.coerce.number().min(0).max(50).default(18),
});
export type ProductFormValues = z.infer<typeof productSchema>;

export const businessSchema = z.object({
  business_name: z.string().trim().max(120).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  gst_number: z.string().trim().max(20).optional().or(z.literal("")),
  pan_number: z.string().trim().max(20).optional().or(z.literal("")),
  bank_holder: z.string().trim().max(120).optional().or(z.literal("")),
  bank_name: z.string().trim().max(120).optional().or(z.literal("")),
  bank_account: z.string().trim().max(40).optional().or(z.literal("")),
  bank_branch: z.string().trim().max(120).optional().or(z.literal("")),
  bank_ifsc: z.string().trim().max(20).optional().or(z.literal("")),
});
export type BusinessFormValues = z.infer<typeof businessSchema>;

export const invoiceItemSchema = z.object({
  product_id: z.string().uuid().nullable(),
  product_name: z.string().trim().min(1, "Product required").max(120),
  quantity: z.coerce.number().positive("Quantity must be > 0"),
  cost_price: z.coerce.number().min(0),
  selling_price: z.coerce.number().min(0),
  gst_rate: z.coerce.number().min(0).max(50),
});
export type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>;

export const invoiceSchema = z.object({
  customer_name: z.string().trim().min(1, "Customer name is required").max(120),
  customer_phone: z.string().trim().max(20).optional().or(z.literal("")),
  customer_address: z.string().trim().max(300).optional().or(z.literal("")),
  customer_gstin: z.string().trim().max(20).optional().or(z.literal("")),
  gst_enabled: z.boolean(),
  discount: z.coerce.number().min(0).default(0),
  paid_amount: z.coerce.number().min(0).default(0),
  items: z.array(invoiceItemSchema).min(1, "Add at least one item"),
});
export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
