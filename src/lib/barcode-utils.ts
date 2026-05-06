// import { supabase } from "@/integrations/supabase/client";
// import { toast } from "@/hooks/use-toast";
// import JsBarcode from "jsbarcode";

// /**
//  * Barcode utility functions for generation, validation, rendering, and lookup
//  */

// /**
//  * Generate a unique barcode for a product
//  * Uses the server-side RPC function to ensure uniqueness
//  */
// export async function generateUniqueBarcode(ownerId: string): Promise<string> {
//   try {
//     const { data, error } = await supabase
//       .rpc("generate_unique_barcode", { p_owner_id: ownerId });

//     if (error) {
//       console.error("Barcode generation error:", error);
//       throw new Error("Failed to generate barcode");
//     }

//     if (!data) {
//       throw new Error("No barcode returned from server");
//     }

//     return data as string;
//   } catch (err) {
//     console.error("Error generating barcode:", err);
//     throw err;
//   }
// }

// /**
//  * Find a product by barcode (with caching for performance)
//  */
// const barcodeCache = new Map<string, any>();

// export async function findProductByBarcode(
//   barcode: string,
//   ownerId: string
// ): Promise<{
//   id: string;
//   name: string;
//   selling_price: number;
//   cost_price: number;
//   gst_rate: number;
//   hsn_code: string | null;
//   stock_qty: number;
//   owner_id: string;
// } | null> {
//   const cacheKey = `${ownerId}:${barcode}`;
  
//   // Check cache first
//   if (barcodeCache.has(cacheKey)) {
//     return barcodeCache.get(cacheKey);
//   }

//   try {
//     const { data, error } = await supabase
//       .rpc("find_product_by_barcode", {
//         p_barcode: barcode.trim(),
//         p_owner_id: ownerId,
//       });

//     if (error) {
//       console.error("Barcode lookup error:", error);
//       return null;
//     }

//     if (!data || data.length === 0) {
//       return null;
//     }

//     const product = data[0];
    
//     // Cache the result for 5 minutes
//     barcodeCache.set(cacheKey, product);
//     setTimeout(() => barcodeCache.delete(cacheKey), 5 * 60 * 1000);
    
//     return product;
//   } catch (err) {
//     console.error("Error finding product by barcode:", err);
//     return null;
//   }
// }

// /**
//  * Render barcode to SVG element using JsBarcode
//  */
// export function renderBarcodeToElement(
//   elementId: string,
//   barcode: string,
//   options: {
//     format?: string;
//     width?: number;
//     height?: number;
//     margin?: number;
//     lineColor?: string;
//     background?: string;
//     displayValue?: boolean;
//     fontSize?: number;
//   } = {}
// ): void {
//   const defaults = {
//     format: "CODE128",
//     width: 2,
//     height: 50,
//     margin: 5,
//     lineColor: "#000000",
//     background: "#ffffff",
//     displayValue: true,
//     fontSize: 12,
//   };

//   const mergedOptions = { ...defaults, ...options };

//   try {
//     JsBarcode(`#${elementId}`, barcode, mergedOptions);
//   } catch (err) {
//     console.error("Barcode rendering error:", err);
//   }
// }

// /**
//  * Generate barcode as SVG string
//  */
// export async function generateBarcodeSVG(
//   barcode: string,
//   options?: {
//     format?: string;
//     width?: number;
//     height?: number;
//     margin?: number;
//     fontSize?: number;
//   }
// ): Promise<string> {
//   return new Promise((resolve, reject) => {
//     try {
//       // Create a temporary SVG element
//       const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
//       const tempContainer = document.createElement("div");
//       tempContainer.style.display = "none";
//       tempContainer.appendChild(tempSvg);
//       document.body.appendChild(tempContainer);

//       const defaults = {
//         format: "CODE128",
//         width: 2,
//         height: 50,
//         margin: 5,
//         fontSize: 12,
//       };

//       const mergedOptions = { ...defaults, ...options };

//       JsBarcode(tempSvg, barcode, mergedOptions);
//       const svgString = tempContainer.innerHTML;

//       document.body.removeChild(tempContainer);
//       resolve(svgString);
//     } catch (err) {
//       reject(err);
//     }
//   });
// }

// /**
//  * Calculate EAN-13 check digit
//  * Used for generating human-readable barcodes
//  */
// export function calculateEAN13CheckDigit(ean12: string): string {
//   if (ean12.length !== 12) {
//     throw new Error("EAN-12 must be exactly 12 digits");
//   }

//   let sum = 0;
//   for (let i = 0; i < 12; i++) {
//     const digit = parseInt(ean12[i], 10);
//     sum += digit * (i % 2 === 0 ? 1 : 3);
//   }

//   const checkDigit = (10 - (sum % 10)) % 10;
//   return ean12 + checkDigit.toString();
// }

// /**
//  * Validate EAN-13 barcode
//  */
// export function validateEAN13(ean13: string): boolean {
//   if (!/^\d{13}$/.test(ean13)) {
//     return false;
//   }

//   const ean12 = ean13.substring(0, 12);
//   const providedCheck = parseInt(ean13[12], 10);
//   const calculatedCheck = parseInt(calculateEAN13CheckDigit(ean12)[12], 10);

//   return providedCheck === calculatedCheck;
// }

// /**
//  * Validate Code128 barcode format (alphanumeric)
//  */
// export function validateCode128(barcode: string): boolean {
//   // Code128 accepts ASCII 0-127
//   return /^[\x00-\x7F]+$/.test(barcode) && barcode.length > 0 && barcode.length <= 80;
// }

// /**
//  * Generate a random EAN-13 barcode
//  * Format: country code (2) + manufacturer (5) + product (5) + check digit (1)
//  */
// export function generateRandomEAN13(): string {
//   // Use country code 890 (India)
//   const countryCode = "890";
//   const randomPart = String(Math.floor(Math.random() * 9999999999))
//     .padStart(9, "0");
//   const ean12 = countryCode + randomPart;
//   return calculateEAN13CheckDigit(ean12);
// }

// /**
//  * Format barcode for display
//  */
// export function formatBarcodeForDisplay(barcode: string): string {
//   // For EAN-13: format as X XXXXX XXXXX X
//   if (barcode.length === 13) {
//     return `${barcode[0]} ${barcode.substring(1, 6)} ${barcode.substring(6, 12)} ${barcode[12]}`;
//   }
//   return barcode;
// }

// /**
//  * Clear barcode cache (useful for testing or after bulk operations)
//  */
// export function clearBarcodeCache(): void {
//   barcodeCache.clear();
// }

// /**
//  * Play beep sound for barcode scan feedback
//  */
// export function playBeep(type: "success" | "error" = "success"): void {
//   try {
//     // Create audio context
//     const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
//     const oscillator = audioContext.createOscillator();
//     const gainNode = audioContext.createGain();

//     oscillator.connect(gainNode);
//     gainNode.connect(audioContext.destination);

//     if (type === "success") {
//       // Two quick beeps for success
//       oscillator.frequency.value = 1000;
//       gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
//       gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
//       oscillator.start(audioContext.currentTime);
//       oscillator.stop(audioContext.currentTime + 0.1);

//       oscillator.start(audioContext.currentTime + 0.15);
//       oscillator.stop(audioContext.currentTime + 0.25);
//     } else {
//       // Single lower beep for error
//       oscillator.frequency.value = 400;
//       gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
//       gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
//       oscillator.start(audioContext.currentTime);
//       oscillator.stop(audioContext.currentTime + 0.2);
//     }
//   } catch (err) {
//     console.error("Audio playback error:", err);
//   }
// }
//     }
//   } catch (err) {
//     console.error("Error in logBarcodeAction:", err);
//   }
// }

// /**
//  * Get barcode history for a product
//  */
// export async function getBarcodeHistory(productId: string) {
//   try {
//     const { data, error } = await supabase
//       .from("barcode_logs")
//       .select("*")
//       .eq("product_id", productId)
//       .order("generated_at", { ascending: false });

//     if (error) throw error;
//     return data || [];
//   } catch (err) {
//     console.error("Error fetching barcode history:", err);
//     return [];
//   }
// }

// /**
//  * Check if barcode already exists for owner
//  */
// export async function barcodeExists(
//   barcode: string,
//   ownerId: string,
//   excludeProductId?: string
// ): Promise<boolean> {
//   try {
//     let query = supabase
//       .from("products")
//       .select("id")
//       .eq("owner_id", ownerId)
//       .eq("barcode", barcode);

//     if (excludeProductId) {
//       query = query.neq("id", excludeProductId);
//     }

//     const { data, error } = await query.limit(1);

//     if (error) throw error;
//     return (data?.length ?? 0) > 0;
//   } catch (err) {
//     console.error("Error checking barcode existence:", err);
//     return false;
//   }
// }

// /**
//  * Bulk generate barcodes for products without one
//  */
// export async function bulkGenerateBarcodes(
//   productIds: string[],
//   ownerId: string
// ): Promise<{ [key: string]: string }> {
//   const result: { [key: string]: string } = {};

//   for (const productId of productIds) {
//     try {
//       const barcode = await generateUniqueBarcode(ownerId);
//       result[productId] = barcode;

//       // Update product with barcode
//       const { error } = await supabase
//         .from("products")
//         .update({ barcode })
//         .eq("id", productId);

//       if (!error) {
//         await logBarcodeAction(productId, ownerId, barcode, "generated");
//       }
//     } catch (err) {
//       console.error(`Failed to generate barcode for product ${productId}:`, err);
//     }
//   }

//   return result;
// }










import { supabase } from "@/integrations/supabase/client";
import JsBarcode from "jsbarcode";

/**
 * Generate a unique barcode
 */
export async function generateUniqueBarcode(ownerId: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("generate_unique_barcode", {
      p_owner_id: ownerId,
    });

    if (error) throw error;
    if (!data) throw new Error("No barcode returned");

    return data as string;
  } catch (err) {
    console.error("Error generating barcode:", err);
    throw err;
  }
}

/**
 * Barcode cache
 */
const barcodeCache = new Map<string, any>();

/**
 * Find product by barcode
 */
export async function findProductByBarcode(barcode: string, ownerId: string) {
  const cacheKey = `${ownerId}:${barcode}`;

  if (barcodeCache.has(cacheKey)) {
    return barcodeCache.get(cacheKey);
  }

  try {
    const { data, error } = await supabase.rpc(
      "find_product_by_barcode",
      {
        p_barcode: barcode.trim(),
        p_owner_id: ownerId,
      }
    );

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const product = data[0];

    barcodeCache.set(cacheKey, product);
    setTimeout(() => barcodeCache.delete(cacheKey), 5 * 60 * 1000);

    return product;
  } catch (err) {
    console.error("Barcode lookup error:", err);
    return null;
  }
}

/**
 * Render barcode
 */
export function renderBarcodeToElement(
  elementId: string,
  barcode: string,
  options: any = {}
) {
  const defaults = {
    format: "CODE128",
    width: 2,
    height: 50,
    margin: 5,
    displayValue: true,
  };

  try {
    JsBarcode(`#${elementId}`, barcode, { ...defaults, ...options });
  } catch (err) {
    console.error("Barcode render error:", err);
  }
}

/**
 * Generate SVG barcode
 */
export async function generateBarcodeSVG(barcode: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );

      JsBarcode(svg, barcode, {
        format: "CODE128",
      });

      resolve(svg.outerHTML);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * EAN check digit
 */
export function calculateEAN13CheckDigit(ean12: string): string {
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    const digit = parseInt(ean12[i], 10);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }

  const check = (10 - (sum % 10)) % 10;
  return ean12 + check;
}

/**
 * Validate EAN
 */
export function validateEAN13(ean13: string): boolean {
  if (!/^\d{13}$/.test(ean13)) return false;

  const check = calculateEAN13CheckDigit(ean13.slice(0, 12));
  return check === ean13;
}

/**
 * Generate random EAN
 */
export function generateRandomEAN13(): string {
  const base = "890" + Math.floor(Math.random() * 1e9).toString().padStart(9, "0");
  return calculateEAN13CheckDigit(base);
}

/**
 * Format barcode
 */
export function formatBarcodeForDisplay(barcode: string): string {
  if (barcode.length === 13) {
    return `${barcode[0]} ${barcode.slice(1, 6)} ${barcode.slice(6, 12)} ${barcode[12]}`;
  }
  return barcode;
}

/**
 * Clear cache
 */
export function clearBarcodeCache() {
  barcodeCache.clear();
}

/**
 * Play beep sound
 */
export function playBeep(type: "success" | "error" = "success") {
  try {
    const ctx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.frequency.value = 1000;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else {
      osc.frequency.value = 400;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (err) {
    console.error("Audio error:", err);
  }
}

/**
 * ✅ FIXED: logBarcodeAction (you were missing this)
 */
export async function logBarcodeAction(
  productId: string,
  ownerId: string,
  barcode: string,
  action: string
) {
  try {
    const { error } = await supabase.from("barcode_logs").insert({
      product_id: productId,
      owner_id: ownerId,
      barcode,
      action,
    });

    if (error) throw error;
  } catch (err) {
    console.error("Error logging barcode:", err);
  }
}

/**
 * Get barcode history
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
    console.error("Error fetching history:", err);
    return [];
  }
}

/**
 * Check if barcode exists
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
    console.error("Error checking barcode:", err);
    return false;
  }
}

/**
 * Bulk generate
 */
export async function bulkGenerateBarcodes(
  productIds: string[],
  ownerId: string
) {
  const result: Record<string, string> = {};

  for (const id of productIds) {
    try {
      const barcode = await generateUniqueBarcode(ownerId);
      result[id] = barcode;

      await supabase
        .from("products")
        .update({ barcode })
        .eq("id", id);

      await logBarcodeAction(id, ownerId, barcode, "generated");
    } catch (err) {
      console.error("Bulk barcode error:", err);
    }
  }

  return result;
}