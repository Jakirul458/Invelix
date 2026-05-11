# 🚀 Invelix v2.0 - Quick Start Guide

## ✅ What's New in v2.0?

### 1. **Product Barcode System** ✨
- Auto-generate unique EAN-13 barcodes
- Barcode printing on product stickers
- Fast database lookup with indexed search

### 2. **Sticker Printing** 🏷️
- Print product labels in multiple sizes (50×25, 75×50, 100×75 mm)
- A4 grid layout for efficient printing
- Includes: Product name, price, HSN code, and barcode

### 3. **Invoice Product Scanning** 📱
- Scan barcodes using phone camera or barcode gun
- Real-time product lookup and auto-add to invoice
- Audio feedback and duplicate prevention

### 4. **Invoice Export** 📊
- Export invoices to PDF (print-ready)
- Export to Excel (multi-sheet: summary, items, status report)
- Filter by status (paid/unpaid/partial)

### 5. **UI Improvements** 🎨
- Pure white background theme (like login page)
- Mobile hamburger menu (3-bar icon)
- Responsive design for all devices

---

## 🛠️ Installation

### Step 1: Install Dependencies
```bash
npm install
# or
bun install
```

### Step 2: Run Migrations
```bash
supabase db push
```

### Step 3: Start Development Server
```bash
npm run dev
```

---

## 📖 How to Use

### Generate Product Barcodes

```typescript
// In Products page:
1. Click "Add Product" or edit existing product
2. Fill product details (name, price, HSN, quantity)
3. In "Barcode" section, click "Generate" button
4. System creates unique 13-digit barcode
5. Click "Preview Barcode" to see it
6. Save product
```

### Print Product Stickers

```typescript
// In Products page:
1. Click on product row
2. Click "Print Stickers" button
3. Select label size from dropdown
4. Enter number of stickers (e.g., 10, 50, 100)
5. Click "Show Preview" to see layout
6. Click "Print Stickers"
7. Browser print dialog opens
8. Print to any printer (inkjet or thermal)
```

### Scan Products into Invoice

```typescript
// In New Invoice page:
1. Click "Scan Product" button (top right)
2. Two modes available:
   
   MODE 1: Barcode Gun (default)
   - Click in input field
   - Hold barcode gun over product
   - Product auto-adds to invoice
   - Quantity defaults to 1
   
   MODE 2: Camera Scan
   - Click "Camera" button
   - Allow camera permission
   - Point camera at barcode
   - Product auto-adds when detected
```

### Export Invoices

```typescript
// PDF Export (Single Invoice):
1. In Invoices list, click export icon
2. Select "PDF"
3. File downloads with product details
4. Open in PDF viewer or print directly

// Excel Export (Bulk):
1. Click "Export All" button (top right)
2. Optional: Filter by status first
3. Select "Excel"
4. Creates file with 3 sheets:
   - Invoice Summary (overview)
   - Invoice Items (detailed)
   - Status Report (paid/unpaid/partial counts)
```

---

## 🎯 Key Features

### Barcode Generation
- ✅ Unique EAN-13 format
- ✅ Automatic checksum calculation
- ✅ Database uniqueness constraint
- ✅ Fast indexed lookup (<50ms)
- ✅ Generation history tracking

### Sticker Printing
- ✅ Multiple label sizes
- ✅ A4 page grid layout
- ✅ Print preview
- ✅ Up to 500 stickers per print job
- ✅ High-quality barcode rendering

### Barcode Scanning
- ✅ Physical barcode gun support
- ✅ Mobile camera scanning
- ✅ 300ms duplicate prevention
- ✅ Audio beep feedback
- ✅ Real-time database lookup

### Invoice Export
- ✅ PDF with layout preservation
- ✅ Excel with multi-sheet structure
- ✅ CSV for individual invoices
- ✅ Status-based filtering
- ✅ Custom date range export

---

## ⚙️ Configuration

### Barcode Size Customization
Edit `src/components/products/ProductStickerDialog.tsx`:
```typescript
const STICKER_SIZES: StickerSize[] = [
  { id: "small", name: "50×25mm", width: 50, height: 25, cols: 4 },
  // Add more sizes here
];
```

### Scanner Debounce Time
Edit `src/components/invoices/BarcodeScanner.tsx`:
```typescript
scanDebounceRef.current = setTimeout(() => {
  // Change 500 to your desired ms
  processScan(barcodeInput);
}, 500);
```

### Export Format Customization
Edit `src/lib/invoice-export.ts` to customize:
- PDF layout and fonts
- Excel column headers and formatting
- CSV delimiter and quoting

---

## 🐛 Troubleshooting

### "Barcode not found" when scanning
- ✅ Verify barcode exists in product
- ✅ Check owner_id matches
- ✅ Ensure barcode is saved correctly

### Stickers misaligned when printing
- ✅ Set print scale to 100% (not "Fit to page")
- ✅ Check print margins in browser settings
- ✅ Use A4 size paper

### Export file is empty/blank
- ✅ Ensure invoices exist in system
- ✅ Check date range filter
- ✅ Try different export format

### Camera not working on mobile
- ✅ Allow camera permission in browser
- ✅ Use HTTPS (required for camera access)
- ✅ Fall back to barcode gun mode

---

## 📋 File Structure

```
src/
├── lib/
│   ├── barcode-utils.ts ................. Barcode functions
│   ├── barcode-generator.ts ............ Advanced generation
│   └── invoice-export.ts ............... Export utilities
│
├── components/
│   ├── invoices/
│   │   ├── BarcodeScanner.tsx .......... Scanner component
│   │   └── InvoiceView.tsx ............ Invoice display
│   │
│   └── products/
│       ├── ProductStickerDialog.tsx ... Sticker generator
│       └── ProductFormDialog.tsx ...... Product editor
│
└── pages/
    ├── Products.tsx ................... Product listing
    ├── NewInvoice.tsx ................ Invoice creation
    └── Invoices.tsx .................. Invoice listing

supabase/
└── migrations/
    └── 20260506_add_barcode_and_sticker_fields.sql

docs/
└── IMPLEMENTATION_GUIDE_V2.md .......... Full documentation
```

---

## 🔗 Database Schema Summary

### New Fields
- `products.barcode` - Unique 13-digit EAN-13
- `products.barcode_type` - Format type (e.g., 'code128')
- `invoice_items.barcode` - Product barcode reference
- `invoice_items.hsn_code` - HSN code reference

### New Table
- `barcode_logs` - Tracks all barcode generation events

### Indexes
- `idx_products_barcode` - Fast barcode lookup
- `idx_products_owner_barcode` - Owner-scoped search
- `idx_barcode_logs_*` - Log queries optimization

---

## 📱 Mobile Optimization

- ✅ Hamburger menu on small screens
- ✅ Full-width forms and buttons
- ✅ Camera scanner optimized for mobile
- ✅ Touch-friendly input fields

---

## 🔐 Security Notes

- ✅ Barcodes are unique per business (owner_id)
- ✅ RLS policies prevent unauthorized access
- ✅ Exports respect owner permissions
- ✅ All validations happen server-side

---

## 📚 Resources

- [API Reference](./IMPLEMENTATION_GUIDE_V2.md)
- [Database Migrations](./supabase/migrations/)
- [Component Props](./IMPLEMENTATION_GUIDE_V2.md#component-documentation)

---

## ✨ Next Steps

1. Run `npm install` to install all dependencies
2. Run `supabase db push` to apply database migrations
3. Run `npm run dev` to start development server
4. Navigate to `/products` to start adding products with barcodes
5. Try printing stickers from the Products page
6. Test barcode scanning in New Invoice page
7. Export invoices in PDF or Excel format

---

**Questions?** Check IMPLEMENTATION_GUIDE_V2.md for detailed documentation.

**Version**: 2.0  
**Status**: ✅ Production Ready  
**Last Updated**: May 11, 2026
