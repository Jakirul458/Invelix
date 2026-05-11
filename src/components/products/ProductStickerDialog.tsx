
import React, { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

import { Download, Eye } from "lucide-react";
import { inr } from "@/lib/format";

/* =========================================================
   STICKER SIZES
========================================================= */

export interface StickerSize {
  id: string;
  name: string;
  width: number; // mm
  height: number; // mm
}

const STICKER_SIZES: StickerSize[] = [
  {
    id: "40x20",
    name: "40 × 20 mm (Recommended)",
    width: 40,
    height: 20,
  },
  {
    id: "50x25",
    name: "50 × 25 mm (Retail Standard)",
    width: 50,
    height: 25,
  },
  {
    id: "60x30",
    name: "60 × 30 mm (Large)",
    width: 60,
    height: 30,
  },
];

/* =========================================================
   TYPES
========================================================= */

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

/* =========================================================
   SINGLE STICKER
========================================================= */

function Sticker({
  product,
  size,
}: {
  product: StickerProduct;
  size: StickerSize;
}) {
  // const barcodeRef = useRef<SVGSVGElement>(null);
  const barcodeRef = useRef<HTMLCanvasElement>(null);

  const isSmall = size.height <= 20;

  useEffect(() => {
    if (barcodeRef.current && product.barcode) {
      try {
        JsBarcode(barcodeRef.current, product.barcode, {
          format: "CODE128",
          width: 1,
          height: isSmall ? 10 : 14,
          margin: 0,
          displayValue: false,
        });
      } catch (error) {
        console.error("Barcode error:", error);
      }
    }
  }, [product.barcode, isSmall]);

  return (
    <div
      style={{
        width: `${size.width}mm`,
        height: `${size.height}mm`,
        border: "1px solid #ef4444",
        background: "#fff",

        boxSizing: "border-box",

        display: "flex",
        flexDirection: "column",

        justifyContent: "space-between",
        alignItems: "center",

        overflow: "hidden",

        padding: "1.2mm",

        textAlign: "center",
      }}
    >
      {/* PRODUCT NAME */}
      <div
        style={{
          fontSize: isSmall ? "11px" : "14px",
          fontWeight: 700,

          lineHeight: 1,

          width: "100%",

          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {product.name}
      </div>

      {/* PRICE */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          lineHeight: 1,
        }}
      >
       
        <span
          style={{
            fontSize: isSmall ? "11px" : "13px",
            fontWeight: 700,
          }}
        >
         MRP {inr(product.selling_price)}
        </span>

        
      </div>

      {/* HSN */}
      {!isSmall && product.hsn_code && (
        <div
          style={{
            fontSize: "6px",
            lineHeight: 1,
          }}
        >
          HSN: {product.hsn_code}
        </div>
      )}

      {/* BARCODE */}
      {product.barcode && (
        <canvas
          ref={barcodeRef}
          style={{
            width: "100%",
            height: isSmall ? "10mm" : "14mm",
            objectFit: "contain",
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   STICKER GRID
========================================================= */

const StickerGrid = React.forwardRef<
  HTMLDivElement,
  {
    products: StickerProduct[];
    size: StickerSize;
  }
>(({ products, size }, ref) => {
  const A4_WIDTH = 210;
  const A4_HEIGHT = 297;

  const PAGE_PADDING = 5;

  const usableWidth = A4_WIDTH - PAGE_PADDING * 2;

  const cols = Math.floor(usableWidth / size.width);

  return (
    <div
      ref={ref}
      id="print-area"
      style={{
        width: `${A4_WIDTH}mm`,
        minHeight: `${A4_HEIGHT}mm`,

        background: "#fff",

        padding: `${PAGE_PADDING}mm`,

        boxSizing: "border-box",

        display: "grid",

        gridTemplateColumns: `repeat(${cols}, ${size.width}mm)`,

        gridAutoRows: `${size.height}mm`,

        justifyContent: "start",
        alignContent: "start",

        gap: "0mm",

        overflow: "hidden",
      }}
    >
      {products.map((product, index) => (
        <Sticker
          key={`${product.id}-${index}`}
          product={product}
          size={size}
        />
      ))}
    </div>
  );
});

StickerGrid.displayName = "StickerGrid";

/* =========================================================
   MAIN COMPONENT
========================================================= */

export function ProductStickerDialog({
  open,
  onOpenChange,
  product,
  quantity = 1,
}: ProductStickerDialogProps) {
  const [selectedSize, setSelectedSize] =
    useState<StickerSize>(STICKER_SIZES[0]);

  const [customQuantity, setCustomQuantity] =
    useState(quantity);

  const [showPreview, setShowPreview] =
    useState(false);

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setCustomQuantity(quantity);
      setShowPreview(true);
    }
  }, [open, quantity]);

  if (!product) return null;

  /* =========================================================
     GENERATE PRODUCTS
  ========================================================= */

  const stickersToGenerate = Array.from(
    { length: customQuantity },
    () => product
  );

  /* =========================================================
     PRINT / DOWNLOAD PDF
  ========================================================= */

  const handleDownloadPDF = () => {
    const printContent =
      document.getElementById("print-area");

    if (!printContent) return;

    const printWindow = window.open(
      "",
      "_blank",
      "width=1000,height=800"
    );

    if (!printWindow) {
      alert("Popup blocked!");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Product Stickers</title>

          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }

            html,
            body {
              width: 210mm;
              margin: 0;
              padding: 0;
              background: white;
            }

            * {
              box-sizing: border-box;

              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            #print-area {
              width: 210mm;
            }

            svg {
              width: 100%;
              height: auto;
              overflow: visible;
            }
          </style>
        </head>

        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl rounded-xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Generate Product Stickers
          </DialogTitle>

          <DialogDescription>
            Print professional barcode stickers for
            <strong> {product.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* SIZE */}
          <div className="space-y-2">
            <Label>Sticker Size</Label>

            <Select
              value={selectedSize.id}
              onValueChange={(id) => {
                const found = STICKER_SIZES.find(
                  (s) => s.id === id
                );

                if (found) {
                  setSelectedSize(found);
                }
              }}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {STICKER_SIZES.map((size) => (
                  <SelectItem
                    key={size.id}
                    value={size.id}
                  >
                    {size.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* QUANTITY */}
          <div className="space-y-2">
            <Label>Sticker Quantity</Label>

            <Input
              type="number"
              min={1}
              max={5000}
              value={customQuantity}
              onChange={(e) =>
                setCustomQuantity(
                  Math.max(
                    1,
                    parseInt(e.target.value) || 1
                  )
                )
              }
              className="font-mono"
            />

            <p className="text-xs text-muted-foreground">
              Total stickers: {customQuantity}
            </p>
          </div>

          {/* PREVIEW */}
          {showPreview && (
            <div className="border rounded-lg overflow-auto bg-muted/20 p-3">
              <StickerGrid
                ref={gridRef}
                products={stickersToGenerate}
                size={selectedSize}
              />
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 gap-2">
          {/* PREVIEW BUTTON */}
          <Button
            variant="outline"
            className="gap-2 rounded-lg"
            onClick={() =>
              setShowPreview(!showPreview)
            }
          >
            <Eye className="h-4 w-4" />

            {showPreview
              ? "Hide Preview"
              : "Show Preview"}
          </Button>

          {/* DOWNLOAD BUTTON */}
          <Button
            onClick={handleDownloadPDF}
            className="gap-2 rounded-lg"
          >
            <Download className="h-4 w-4" />

            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProductStickerDialog;