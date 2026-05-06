import React, { useRef, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import JsBarcode from "jsbarcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Printer, Eye } from "lucide-react";
import { inr } from "@/lib/format";

export interface StickerSize {
  id: string;
  name: string;
  width: number; // mm
  height: number; // mm
  cols: number; // stickers per row on A4
}

const STICKER_SIZES: StickerSize[] = [
  { id: "small", name: "Small (50×25mm)", width: 50, height: 25, cols: 4 },
  { id: "medium", name: "Medium (75×50mm)", width: 75, height: 50, cols: 3 },
  { id: "large", name: "Large (100×75mm)", width: 100, height: 75, cols: 2 },
];

interface StickerProduct {
  id: string;
  name: string;
  selling_price: number;
  hsn_code?: string | null;
  barcode?: string | null;
  quantity: number;
}

interface ProductStickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: StickerProduct;
  quantity?: number;
}

/**
 * Individual sticker component for rendering with JsBarcode
 */
function Sticker({
  product,
  size,
}: {
  product: StickerProduct;
  size: StickerSize;
}) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const containerId = `barcode-${product.id}-${Math.random()}`;

  useEffect(() => {
    if (!product.barcode || !barcodeRef.current) return;

    try {
      JsBarcode(barcodeRef.current, product.barcode, {
        format: "CODE128",
        width: 1.5,
        height: 30,
        margin: 2,
        lineColor: "#000000",
        background: "#ffffff",
        displayValue: true,
        fontSize: 10,
      });
    } catch (err) {
      console.error("Barcode rendering error:", err);
    }
  }, [product.barcode]);

  return (
    <div
      className="flex flex-col items-center justify-center bg-white border-2 border-black rounded"
      style={{
        width: `${size.width}mm`,
        height: `${size.height}mm`,
        padding: "2mm",
        fontSize: `${Math.max(7, size.height / 12)}px`,
        pageBreakInside: "avoid",
        boxSizing: "border-box",
      }}
    >
      {/* Product Name */}
      <div className="font-bold text-black text-center truncate w-full leading-tight mb-0.5">
        {product.name.substring(0, 25)}
      </div>

      {/* Price */}
      <div className="font-semibold text-black text-center mb-0.5">
        {inr(product.selling_price)}
      </div>

      {/* HSN Code */}
      {product.hsn_code && (
        <div className="text-black text-center text-[10px] mb-0.5">
          HSN: {product.hsn_code}
        </div>
      )}

      {/* Barcode SVG */}
      {product.barcode && (
        <svg
          ref={barcodeRef}
          id={containerId}
          style={{
            maxWidth: "95%",
            maxHeight: "40%",
            marginTop: "1mm",
          }}
        />
      )}
    </div>
  );
}

/**
 * Sticker grid for printing (fits multiple stickers on A4)
 */
const StickerGrid = React.forwardRef<
  HTMLDivElement,
  { products: StickerProduct[]; size: StickerSize }
>(({ products, size }, ref) => {
  const A4_WIDTH = 210; // mm
  const A4_HEIGHT = 297; // mm
  const MARGIN = 5; // mm

  const availableWidth = A4_WIDTH - MARGIN * 2;
  const cols = size.cols;
  const actualStickerWidth = availableWidth / cols;
  const gap = (availableWidth - actualStickerWidth * cols) / (cols - 1);

  return (
    <div
      ref={ref}
      className="bg-white p-5mm"
      style={{
        width: `${A4_WIDTH}mm`,
        minHeight: `${A4_HEIGHT}mm`,
        padding: `${MARGIN}mm`,
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: `${gap}mm`,
        pageBreakInside: "avoid",
      }}
    >
      {products.map((product, idx) => (
        <div key={`${product.id}-${idx}`} style={{ pageBreakInside: "avoid" }}>
          <Sticker product={product} size={size} />
        </div>
      ))}
    </div>
  );
});

StickerGrid.displayName = "StickerGrid";

/**
 * Dialog for generating and printing product stickers
 */
export function ProductStickerDialog({
  open,
  onOpenChange,
  product,
  quantity = 1,
}: ProductStickerDialogProps) {
  const [selectedSize, setSelectedSize] = useState<StickerSize>(STICKER_SIZES[1]);
  const [customQuantity, setCustomQuantity] = useState(quantity);
  const [showPreview, setShowPreview] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => gridRef.current,
    documentTitle: `${product?.name || "Product"} Stickers`,
    pageStyle: `
      @page {
        size: A4;
        margin: 0mm;
        padding: 0mm;
      }
      @media print {
        * {
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
        }
        body {
          margin: 0;
          padding: 0;
          background: white;
        }
        html {
          margin: 0;
          padding: 0;
        }
      }
    `,
    onAfterPrint: () => {
      console.log("Print completed successfully");
    },
  });

  if (!product) return null;

  // Duplicate product for each quantity
  const stickersToGenerate = Array(customQuantity).fill(product);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Product Stickers</DialogTitle>
          <DialogDescription>
            Create printable stickers for {product.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sticker Size Selection */}
          <div className="space-y-2">
            <Label htmlFor="size-select">Sticker Size</Label>
            <Select
              value={selectedSize.id}
              onValueChange={(id) => {
                const size = STICKER_SIZES.find((s) => s.id === id);
                if (size) setSelectedSize(size);
              }}
            >
              <SelectTrigger id="size-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STICKER_SIZES.map((size) => (
                  <SelectItem key={size.id} value={size.id}>
                    {size.name} ({size.cols} per row)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="qty-input">Quantity of stickers</Label>
            <Input
              id="qty-input"
              type="number"
              min={1}
              max={100}
              value={customQuantity}
              onChange={(e) => setCustomQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="h-9"
            />
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
              <StickerGrid ref={gridRef} products={stickersToGenerate} size={selectedSize} />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? "Hide" : "Preview"}
          </Button>
          <Button
            onClick={() => {
              setShowPreview(true);
              setTimeout(handlePrint, 100);
            }}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Stickers
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProductStickerDialog;
