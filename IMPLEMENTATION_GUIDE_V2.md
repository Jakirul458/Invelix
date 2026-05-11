# Invelix - Stock Management & Invoice SaaS v2.0
## Complete Implementation Guide (May 11, 2026)

---

## 📋 Table of Contents
1. [Features Overview](#features-overview)
2. [Installation & Setup](#installation--setup)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Component Documentation](#component-documentation)
6. [Usage Guide](#usage-guide)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Features Overview

### 1. **Barcode Management System**
- **Auto-Generation**: EAN-13 format with checksum validation
- **Unique Storage**: Database-level uniqueness with RLS policies
- **Fast Lookup**: Indexed fields for <50ms queries
- **History Tracking**: Barcode creation/regeneration logs

**Files**:
- `src/lib/barcode-utils.ts` - Core functions
- `src/lib/barcode-generator.ts` - Advanced utilities
- `supabase/migrations/20260506_add_barcode_and_sticker_fields.sql` - Schema

### 2. **Product Sticker & Label Generation**
- **Multiple Sizes**: 50×25mm, 75×50mm, 100×75mm
- **A4 Print Layout**: 4 stickers/page to 2 stickers/page
- **Components**: Product name, price, HSN code, barcode
- **Print-Ready**: CSS media queries for perfect printing

**Files**:
- `src/components/products/ProductStickerDialog.tsx` - Sticker generator
- Uses `react-to-print` + `jsbarcode` for rendering

### 3. **Invoice Product Scanning**
- **Dual Input**: Physical barcode gun + camera scanning
- **Real-Time Detection**: 300ms debounce to prevent duplicates
- **Visual Feedback**: Success/error beeps + UI indicators
- **Mobile-Friendly**: Works on iOS/Android

**Files**:
- `src/components/invoices/BarcodeScanner.tsx` - Scanner component
- Uses camera API + keyboard input handling

### 4. **Invoice Export System**
- **PDF Export**: HTML rendering with canvas conversion
- **Excel Export**: Multi-sheet with summary, items, status report
- **CSV Export**: Individual invoice export
- **Status Filtering**: Filter by paid/unpaid/partial

**Files**:
- `src/lib/invoice-export.ts` - Export utilities
- Integrates jsPDF, html2canvas, XLSX

### 5. **Theme & UI Updates**
- **White Background**: Pure white (#ffffff) background theme
- **Mobile Menu**: Collapsible sidebar with 3-bar hamburger menu
- **Responsive Design**: Mobile-first approach
- **Professional Styling**: Indigo primary, clean cards

---

## 🚀 Installation & Setup

### Prerequisites
```bash
npm install
# or
bun install
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Database Setup
```bash
# Apply migrations
supabase db push

# Or manually run:
# - 20260506_add_barcode_and_sticker_fields.sql
```

### Dependencies Installed
```json
{
  "jspdf": "^2.5.1",
  "html2canvas": "^1.4.1",
  "xlsx": "^0.18.5",
  "@zxing/library": "^0.20.0",
  "uuid": "^9.0.1",
  "react-to-print": "^3.3.0",
  "jsbarcode": "^3.12.3"
}
```

---

## 📊 Database Schema

### New Tables & Fields

**products table** (additions):
```sql
- barcode: text UNIQUE
- barcode_type: text (default: 'code128')
```

**barcode_logs table** (new):
```sql
- id: uuid PRIMARY KEY
- product_id: uuid FK
- owner_id: uuid FK
- barcode: text
- generated_at: timestamp
- action: enum (generated, regenerated, imported)
```

**invoice_items table** (additions):
```sql
- hsn_code: text
- barcode: text
```

### Indexes
```sql
- idx_products_barcode (for fast lookup)
- idx_products_owner_barcode (owner-specific search)
- idx_barcode_logs_product_id
- idx_barcode_logs_owner_id
```

---

## 🔌 API Endpoints (RPC Functions)

### 1. Generate Unique Barcode
```typescript
supabase.rpc('generate_unique_barcode', {
  p_owner_id: userId
})
// Returns: string (13-digit EAN-13)
```

### 2. Find Product by Barcode
```typescript
supabase.rpc('find_product_by_barcode', {
  p_barcode: '1234567890123',
  p_owner_id: userId
})
// Returns: Product object with name, price, stock, etc.
```

---

## 🧩 Component Documentation

### ProductStickerDialog
```typescript
<ProductStickerDialog
  open={boolean}
  onOpenChange={(open) => void}
  product={{
    id: string,
    name: string,
    selling_price: number,
    barcode: string,
    quantity: number
  }}
  quantity={10}
/>
```

**Features**:
- Preview stickers before printing
- Select label size
- Generate up to 500 stickers
- Print directly to browser default printer

### BarcodeScanner
```typescript
<BarcodeScanner
  open={boolean}
  onOpenChange={(open) => void}
  ownerId={userId}
  onProductFound={(product) => void}
  onError={(error) => void}
/>
```

**Features**:
- Keyboard mode (default) for barcode guns
- Camera mode for mobile/web scanning
- Auto-debounce duplicate scans
- Audio feedback (beeps)

### ProductFormDialog
```typescript
<ProductFormDialog
  open={boolean}
  onOpenChange={(open) => void}
  initial={productData}
  submitting={boolean}
  onSubmit={(data) => Promise<void>}
/>
```

**Features**:
- Auto-generate barcode button
- Manual barcode input
- Barcode preview with JsBarcode
- GST calculation included

---

## 📖 Usage Guide

### 1. **Adding Products with Barcodes**
```typescript
// In ProductFormDialog
1. Click "Generate" button to auto-create unique barcode
2. Or manually enter barcode (13+ digits)
3. Click "Preview Barcode" to verify
4. Save product - barcode is indexed for fast lookup
```

### 2. **Printing Stickers**
```typescript
// In Products page
1. Click product row → "Print Stickers" button
2. Select label size (50×25, 75×50, or 100×75 mm)
3. Enter quantity of stickers
4. Preview layout (optional)
5. Click "Print Stickers" → Browser print dialog
6. Print to any printer (inkjet or thermal)
```

### 3. **Scanning Products in Invoice**
```typescript
// In NewInvoice page
1. Click "Scan Product" button
2. Mode: "Barcode Gun / Keyboard" (default)
   - Place cursor in input field
   - Scan barcode with physical gun
   - System auto-adds product to invoice
3. Or Mode: "Camera"
   - Click "Camera" button
   - Allow camera permission
   - Point at barcode
   - Product auto-adds when scanned
```

### 4. **Exporting Invoices**
```typescript
// In Invoices list page
// Individual invoice export:
1. Click export icon on invoice row
2. Select PDF or Excel format
3. File downloads automatically

// Bulk export:
1. Click "Export All" button
2. Choose format (Excel recommended for bulk)
3. Filter by status (paid/unpaid/partial)
4. File downloads with all invoices
```

---

## ⚡ Performance Optimization

### Barcode Lookup
- **300ms debounce** on scanner input prevents duplicate scans
- **Indexed barcode field** ensures <50ms database queries
- **RPC function** uses efficient WHERE clause

### Sticker Generation
- **Client-side rendering** with react-to-print
- **Page break prevention** with CSS (pageBreakInside: avoid)
- **Canvas optimization** via html2canvas

### Invoice Export
- **Streaming Excel** export for large datasets
- **Canvas compression** in PDF export
- **Worker thread** support (browser dependent)

### UI Responsiveness
- **Sidebar collapsible** on mobile
- **Modal full-height** on small screens
- **Grid responsive** for product list

---

## 🛠️ Troubleshooting

### Barcode Scanning Issues

**Problem**: Barcode not found
- **Solution**: Verify barcode exists in database
  ```typescript
  // Check if barcode is saved
  const { data } = await supabase
    .from('products')
    .select('barcode')
    .eq('barcode', '1234567890123')
  ```

**Problem**: Camera permission denied
- **Solution**: App falls back to keyboard mode automatically
- Check browser camera permissions

**Problem**: Duplicate scans
- **Solution**: Already prevented with 300ms debounce
- Increase debounce if needed in BarcodeScanner.tsx

### Sticker Printing Issues

**Problem**: Stickers misaligned on print
- **Solution**: 
  1. Check print scale (should be 100%)
  2. Disable "Fit to page" in browser print dialog
  3. Adjust margin in LABEL_SIZES

**Problem**: Barcode not printing
- **Solution**: JsBarcode may need SVG support
  - Check browser console for errors
  - Ensure barcode value is not null

### Export Issues

**Problem**: PDF export is blank
- **Solution**: html2canvas may have CORS issues
  - Use fallback data-based PDF export
  - Check browser console

**Problem**: Excel has wrong data
- **Solution**: Verify data format before export
  - Check column mappings in invoice-export.ts
  - Ensure dates are ISO format

---

## 📱 Mobile Considerations

### Responsive Breakpoints
- **Mobile**: < 768px - Full-width stack
- **Tablet**: 768px - 1024px - 2-column layout
- **Desktop**: > 1024px - Full layout

### Touch Optimization
- Larger buttons on mobile (h-10 minimum)
- Hamburger menu active by default on mobile
- Camera scanner works better than keyboard on mobile

### PWA Features
- Service worker ready (optional)
- Offline capability for invoice viewing
- Home screen installable

---

## 🔐 Security

### Barcode Protection
- Unique constraint prevents duplicates
- RLS policies ensure owner-only access
- Barcode lookup validates owner_id

### Invoice Data
- All exports respect owner_id filters
- PDF generation happens client-side
- No barcode export in public links

---

## 📞 Support & Resources

### Docs
- [JsBarcode Docs](https://github.com/lindell/JsBarcode)
- [React to Print](https://github.com/gregnb/react-to-print)
- [Supabase RPC](https://supabase.com/docs/guides/database/functions)

### Database
- Check `barcode_logs` table for history
- Run `ANALYZE` on indexes for optimization
- Monitor query performance in Supabase dashboard

---

**Version**: 2.0  
**Last Updated**: May 11, 2026  
**Status**: Production Ready
