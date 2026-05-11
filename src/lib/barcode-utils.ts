import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Barcode utility functions for generation, validation, and lookup
 */

/**
 * Generate a unique barcode for a product
 * Uses the server-side RPC function to ensure uniqueness
 */
export async function generateUniqueBarcode(ownerId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .rpc("generate_unique_barcode", { p_owner_id: ownerId });

    if (error) {
      console.error("Barcode generation error:", error);
      throw new Error("Failed to generate barcode");
    }

    if (!data) {
      throw new Error("No barcode returned from server");
    }

    return data as string;
  } catch (err) {
    console.error("Error generating barcode:", err);
    throw err;
  }
}

/**
 * Find a product by barcode
 */
export async function findProductByBarcode(
  barcode: string,
  ownerId: string
): Promise<{
  id: string;
  name: string;
  selling_price: number;
  cost_price: number;
  gst_rate: number;
  hsn_code: string | null;
  stock_qty: number;
  owner_id: string;
} | null> {
  try {
    const { data, error } = await supabase
      .rpc("find_product_by_barcode", {
        p_barcode: barcode.trim(),
        p_owner_id: ownerId,
      });

    if (error) {
      console.error("Barcode lookup error:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0];
  } catch (err) {
    console.error("Error finding product by barcode:", err);
    return null;
  }
}

/**
 * Calculate EAN-13 check digit
 * Used for generating human-readable barcodes
 */
export function calculateEAN13CheckDigit(ean12: string): string {
  if (ean12.length !== 12) {
    throw new Error("EAN-12 must be exactly 12 digits");
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(ean12[i], 10);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return ean12 + checkDigit.toString();
}

/**
 * Validate EAN-13 barcode
 */
export function validateEAN13(ean13: string): boolean {
  if (!/^\d{13}$/.test(ean13)) {
    return false;
  }

  const ean12 = ean13.substring(0, 12);
  const providedCheck = parseInt(ean13[12], 10);
  const calculatedCheck = parseInt(calculateEAN13CheckDigit(ean12)[12], 10);

  return providedCheck === calculatedCheck;
}

/**
 * Generate a random EAN-13 barcode
 * Format: country code (2) + manufacturer (5) + product (5) + check digit (1)
 */
export function generateRandomEAN13(): string {
  // Use country code 890 (India)
  const countryCode = "890";
  const randomPart = String(Math.floor(Math.random() * 9999999999))
    .padStart(9, "0");
  const ean12 = countryCode + randomPart;
  return calculateEAN13CheckDigit(ean12);
}

/**
 * Format barcode for display
 */
export function formatBarcodeForDisplay(barcode: string): string {
  // For EAN-13: format as X XXXXX XXXXX X
  if (barcode.length === 13) {
    return `${barcode[0]} ${barcode.substring(1, 6)} ${barcode.substring(6, 12)} ${barcode[12]}`;
  }
  return barcode;
}

/**
 * Log barcode generation/regeneration
 */
export async function logBarcodeAction(
  productId: string,
  ownerId: string,
  barcode: string,
  action: "generated" | "regenerated" | "imported"
): Promise<void> {
  try {
    const { error } = await supabase
      .from("barcode_logs")
      .insert({
        product_id: productId,
        owner_id: ownerId,
        barcode,
        action,
      });

    if (error) {
      console.error("Error logging barcode action:", error);
    }
  } catch (err) {
    console.error("Error in logBarcodeAction:", err);
  }
}

/**
 * Get barcode history for a product
 */
export async function getBarcodeHistory(productId: string) {
  try {
    const { data, error } = await supabase
      .from("barcode_logs")
      .select("*")
      .eq("product_id", productId)
      .order("generated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching barcode history:", err);
    return [];
  }
}

/**
 * Check if barcode already exists for owner
 */
export async function barcodeExists(
  barcode: string,
  ownerId: string,
  excludeProductId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from("products")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("barcode", barcode);

    if (excludeProductId) {
      query = query.neq("id", excludeProductId);
    }

    const { data, error } = await query.limit(1);

    if (error) throw error;
    return (data?.length ?? 0) > 0;
  } catch (err) {
    console.error("Error checking barcode existence:", err);
    return false;
  }
}

/**
 * Bulk generate barcodes for products without one
 */
export async function bulkGenerateBarcodes(
  productIds: string[],
  ownerId: string
): Promise<{ [key: string]: string }> {
  const result: { [key: string]: string } = {};

  for (const productId of productIds) {
    try {
      const barcode = await generateUniqueBarcode(ownerId);
      result[productId] = barcode;

      // Update product with barcode
      const { error } = await supabase
        .from("products")
        .update({ barcode })
        .eq("id", productId);

      if (!error) {
        await logBarcodeAction(productId, ownerId, barcode, "generated");
      }
    } catch (err) {
      console.error(`Failed to generate barcode for product ${productId}:`, err);
    }
  }

  return result;
}
