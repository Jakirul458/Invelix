import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import { inr } from "@/lib/format";

interface InvoiceExportData {
  invoiceId: string;
  invoiceNumber: string;
  date: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    gstin?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    rate: number;
    amount: number;
    gst_rate?: number;
    gst_amount?: number;
    hsn_code?: string;
  }>;
  totals: {
    subtotal: number;
    gst_total: number;
    total: number;
    discount?: number;
  };
  status: "paid" | "unpaid" | "partial";
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessGSTIN?: string;
  signature?: string;
}

/**
 * Export invoice to PDF format
 */
export async function exportInvoiceToPDF(
  data: InvoiceExportData,
  htmlElement?: HTMLElement,
): Promise<void> {
  try {
    if (htmlElement) {
      // Use html2canvas for accurate rendering
      const canvas = await html2canvas(htmlElement, {
        scale: 2,
        useCORS: true,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice_${data.invoiceNumber}.pdf`);
    } else {
      // Fallback: Generate from data
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      let yPosition = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      // Header
      pdf.setFontSize(16);
      pdf.text(data.businessName, margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.text(`Phone: ${data.businessPhone}`, margin, yPosition);
      yPosition += 5;
      pdf.text(`GSTIN: ${data.businessGSTIN || "N/A"}`, margin, yPosition);
      yPosition += 8;

      // Invoice details
      pdf.setFontSize(12);
      pdf.text(`INVOICE #${data.invoiceNumber}`, margin, yPosition);
      yPosition += 5;

      pdf.setFontSize(10);
      pdf.text(`Date: ${data.date}`, margin, yPosition);
      yPosition += 5;
      pdf.text(
        `Status: ${data.status.toUpperCase()}`,
        margin,
        yPosition,
      );
      yPosition += 8;

      // Customer details
      pdf.text("BILL TO:", margin, yPosition);
      yPosition += 5;
      pdf.text(data.customer.name, margin + 2, yPosition);
      yPosition += 4;
      pdf.text(`Phone: ${data.customer.phone}`, margin + 2, yPosition);
      yPosition += 4;
      pdf.text(`Address: ${data.customer.address}`, margin + 2, yPosition);
      yPosition += 8;

      // Table Header
      const tableTop = yPosition;
      const col1 = margin;
      const col2 = margin + 60;
      const col3 = margin + 90;
      const col4 = margin + 110;
      const col5 = margin + 135;

      pdf.setFont(undefined, "bold");
      pdf.text("Item", col1, tableTop);
      pdf.text("Qty", col2, tableTop);
      pdf.text("Rate", col3, tableTop);
      pdf.text("GST%", col4, tableTop);
      pdf.text("Amount", col5, tableTop);

      yPosition = tableTop + 5;
      pdf.setFont(undefined, "normal");

      // Table rows
      data.items.forEach((item) => {
        pdf.text(item.name.substring(0, 30), col1, yPosition);
        pdf.text(item.quantity.toString(), col2, yPosition);
        pdf.text(inr(item.rate), col3, yPosition);
        pdf.text((item.gst_rate || 0).toString(), col4, yPosition);
        pdf.text(inr(item.amount), col5, yPosition);
        yPosition += 5;

        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
      });

      // Totals
      yPosition += 5;
      pdf.setFont(undefined, "bold");
      pdf.text(`Subtotal: ${inr(data.totals.subtotal)}`, col1, yPosition);
      yPosition += 5;

      if (data.totals.gst_total > 0) {
        pdf.text(`GST Total: ${inr(data.totals.gst_total)}`, col1, yPosition);
        yPosition += 5;
      }

      if (data.totals.discount && data.totals.discount > 0) {
        pdf.text(`Discount: ${inr(data.totals.discount)}`, col1, yPosition);
        yPosition += 5;
      }

      pdf.setFont(undefined, "bold");
      pdf.setFontSize(12);
      pdf.text(`TOTAL: ${inr(data.totals.total)}`, col1, yPosition);

      pdf.save(`Invoice_${data.invoiceNumber}.pdf`);
    }
  } catch (error) {
    console.error("PDF export error:", error);
    throw error;
  }
}

/**
 * Export invoices to Excel format
 */
export async function exportInvoicesToExcel(
  invoices: InvoiceExportData[],
  filters?: {
    status?: "paid" | "unpaid" | "partial";
    startDate?: string;
    endDate?: string;
  },
): Promise<void> {
  try {
    // Filter invoices
    let filtered = invoices;
    if (filters?.status) {
      filtered = filtered.filter((inv) => inv.status === filters.status);
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Invoice Summary
    const summary = filtered.map((inv) => ({
      "Invoice Number": inv.invoiceNumber,
      Date: inv.date,
      Customer: inv.customer.name,
      "Phone": inv.customer.phone,
      "Address": inv.customer.address,
      Subtotal: inv.totals.subtotal,
      GST: inv.totals.gst_total,
      Total: inv.totals.total,
      Status: inv.status.toUpperCase(),
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Invoice Summary");

    // Sheet 2: Detailed Items
    const details: any[] = [];
    filtered.forEach((inv) => {
      inv.items.forEach((item) => {
        details.push({
          "Invoice Number": inv.invoiceNumber,
          "Invoice Date": inv.date,
          "Item Name": item.name,
          "Quantity": item.quantity,
          "Rate": item.rate,
          "Amount": item.amount,
          "GST Rate %": item.gst_rate || 0,
          "GST Amount": item.gst_amount || 0,
          "HSN Code": item.hsn_code || "-",
        });
      });
    });

    const detailsSheet = XLSX.utils.json_to_sheet(details);
    XLSX.utils.book_append_sheet(wb, detailsSheet, "Invoice Items");

    // Sheet 3: Status Report
    const statusReport = [
      { Status: "PAID", Count: filtered.filter((i) => i.status === "paid").length },
      { Status: "UNPAID", Count: filtered.filter((i) => i.status === "unpaid").length },
      { Status: "PARTIAL", Count: filtered.filter((i) => i.status === "partial").length },
    ];

    const statusSheet = XLSX.utils.json_to_sheet(statusReport);
    XLSX.utils.book_append_sheet(wb, statusSheet, "Status Report");

    // Download
    XLSX.writeFile(wb, `Invoices_${new Date().toISOString().split("T")[0]}.xlsx`);
  } catch (error) {
    console.error("Excel export error:", error);
    throw error;
  }
}

/**
 * Export single invoice items to CSV
 */
export function exportInvoiceItemsToCSV(
  invoice: InvoiceExportData,
): void {
  try {
    const headers = [
      "Item Name",
      "Quantity",
      "Rate",
      "Amount",
      "GST Rate %",
      "GST Amount",
      "HSN Code",
    ];

    const rows = invoice.items.map((item) => [
      item.name,
      item.quantity,
      item.rate,
      item.amount,
      item.gst_rate || 0,
      item.gst_amount || 0,
      item.hsn_code || "-",
    ]);

    const csv = [
      [`Invoice: ${invoice.invoiceNumber}`, `Date: ${invoice.date}`],
      [],
      headers,
      ...rows,
      [],
      [`Subtotal: ${invoice.totals.subtotal}`],
      [`GST: ${invoice.totals.gst_total}`],
      [`Total: ${invoice.totals.total}`],
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice_${invoice.invoiceNumber}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("CSV export error:", error);
    throw error;
  }
}
