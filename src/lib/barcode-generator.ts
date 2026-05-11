import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";

/**
 * Generate a unique barcode for a product
 * Uses EAN-13 format (13 digits)
 */
export async function generateUniqueBarcodeForOwner(
  ownerId: string,
): Promise<string> {
  try {
    const { data, error } = await supabase.rpc(
      "generate_unique_barcode",
      { p_owner_id: ownerId },
    );

    if (error) {
      console.error("Error generating barcode:", error);
      // Fallback: generate locally
      return generateLocalBarcode();
    }

    return data as string;
  } catch (err) {
    console.error("Barcode generation error:", err);
    return generateLocalBarcode();
  }
}

/**
 * Local barcode generation as fallback
 * Generates EAN-13 format barcode
 */
function generateLocalBarcode(): string {
  // Generate 12 random digits, then calculate checksum for 13th digit
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += Math.floor(Math.random() * 10);
  }

  // Calculate EAN-13 checksum
  let sum = 0;
  for (let i = 0; i < code.length; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit;
}

/**
 * Find product by barcode for the current user
 */
export async function findProductByBarcode(
  barcode: string,
  ownerId: string,
): Promise<any> {
  try {
    const { data, error } = await supabase.rpc(
      "find_product_by_barcode",
      {
        p_barcode: barcode.trim(),
        p_owner_id: ownerId,
      },
    );

    if (error) {
      console.error("Error finding product:", error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error("Product lookup error:", err);
    return null;
  }
}

/**
 * Validate barcode format
 */
export function isValidBarcode(barcode: string): boolean {
  // Accept EAN-13, UPC-A, or any numeric code 6-20 digits
  const barcodePattern = /^\d{6,20}$/;
  return barcodePattern.test(barcode.trim());
}

/**
 * Generate barcode data URL for display
 * This is handled by jsbarcode library in components
 */
export function getBarcodeImageUrl(
  barcode: string,
  format: string = "code128",
): string {
  // Return barcode for rendering - actual rendering done in components
  return barcode;
}

/**
 * Log barcode generation action
 */
export async function logBarcodeAction(
  productId: string,
  ownerId: string,
  barcode: string,
  action: "generated" | "regenerated" | "imported",
): Promise<void> {
  try {
    await supabase.from("barcode_logs").insert({
      product_id: productId,
      owner_id: ownerId,
      barcode,
      action,
    });
  } catch (err) {
    console.error("Error logging barcode action:", err);
  }
}

/**
 * Get barcode history for a product
 */
export async function getBarcodeHistory(
  productId: string,
): Promise<any[]> {
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
