"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  Download,
  FileText,
  ArrowLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { useStore } from "@/store/useStore";
import { fetchInvoiceApi, fetchInvoicePdfBlob, InvoiceData } from "@/services/invoiceApi";

export default function InvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = (params?.id as string) || "";
  const { token } = useStore();

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (bookingId) {
      loadInvoice();
    }
  }, [bookingId, token]);

  const loadInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchInvoiceApi(bookingId, token);
      if (res.success && res.data) {
        setInvoice(res.data);
      } else {
        setError(res.message || "Failed to load invoice details.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred while fetching invoice.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!bookingId) return;
    setDownloadingPdf(true);
    try {
      const blob = await fetchInvoicePdfBlob(bookingId, token);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Invoice_${invoice?.invoiceNumber || bookingId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        window.print();
      }
    } catch (err) {
      console.error("PDF download error:", err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <div className="print:hidden">
        <Header />
      </div>

      <main 
        style={{ paddingTop: "var(--header-total-height, 8.5rem)" }}
        className="flex-1 pt-32 sm:pt-36 pb-16 font-sans bg-slate-50/50 dark:bg-background print:pt-0 print:pb-0 print:bg-white"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 print:px-0 print:max-w-none">
          
          {/* Top Bar Navigation (Hidden on Print) */}
          <div className="flex items-center justify-between print:hidden">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-extrabold shadow-sm transition-all cursor-pointer hover:border-purple-300 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-[#581c4f]" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
              <Link href="/" className="hover:text-[#581c4f] transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/profile?tab=bookings" className="hover:text-[#581c4f] transition-colors">Bookings</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground font-bold">Tax Invoice</span>
            </div>
          </div>

          {/* Action Bar (Print / PDF Download) (Hidden on Print) */}
          {invoice && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#581c4f] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Tax Invoice #{invoice.invoiceNumber}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Ref Booking #{invoice.bookingNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#581c4f]" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  disabled={downloadingPdf}
                  onClick={handleDownloadPdf}
                  className="px-4 py-2 rounded-xl bg-[#581c4f] hover:bg-[#4a0e4e] text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {downloadingPdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Invoice Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6 print:border-none print:shadow-none print:p-4 print:rounded-none">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#581c4f] animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">Fetching official invoice...</p>
              </div>
            ) : error ? (
              <div className="py-16 px-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto">
                  <h4 className="text-base font-bold text-foreground">Invoice Not Found</h4>
                  <p className="text-xs text-slate-400 mt-1">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={loadInvoice}
                  className="px-5 py-2.5 bg-[#581c4f] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#4a0e4e] transition-all cursor-pointer"
                >
                  Retry Loading
                </button>
              </div>
            ) : invoice ? (
              <div className="space-y-6 printable-invoice-content" id="printable-invoice">
                
                {/* Top Header Banner matching reference image */}
                <div className="bg-[#fcf5fa] dark:bg-purple-950/20 p-6 sm:p-8 rounded-2xl border border-purple-100/60 dark:border-purple-900/30 flex items-center justify-between gap-4">
                  {/* Brand Logo Box */}
                  <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-xs">
                    <img
                      src="/logo-white.png"
                      alt="HELP MATE"
                      className="h-14 sm:h-16 w-auto object-contain"
                    />
                  </div>

                  {/* Right Header Status & Title */}
                  <div className="text-right space-y-1">
                    <h1 className="text-2xl sm:text-4xl font-black tracking-wide text-[#4e0e47] dark:text-purple-300">
                      INVOICE
                    </h1>
                    <div>
                      <span className="bg-[#e6f7f0] dark:bg-emerald-950/60 text-[#10b981] dark:text-emerald-400 font-extrabold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full inline-block border border-emerald-500/20">
                        {invoice.invoiceStatus || "GENERATED"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BILL TO & INVOICE DETAILS Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left Card: BILL TO */}
                  <div className="p-5 sm:p-6 rounded-2xl border border-purple-100/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs space-y-2 text-left">
                    <span className="text-xs font-black uppercase text-[#8a1562] dark:text-purple-400 tracking-wider block">
                      BILL TO
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      {invoice.customer.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {invoice.customer.mobile}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {invoice.address.serviceAddress}
                      {invoice.address.landmark ? `, ${invoice.address.landmark}` : ""}
                      {invoice.address.localityName ? `, ${invoice.address.localityName}` : ""}
                      {invoice.address.pincode ? `, ${invoice.address.pincode}` : ""}
                    </p>
                  </div>

                  {/* Right Card: INVOICE DETAILS */}
                  <div className="p-5 sm:p-6 rounded-2xl border border-purple-100/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs space-y-2 text-left">
                    <span className="text-xs font-black uppercase text-[#8a1562] dark:text-purple-400 tracking-wider block">
                      INVOICE DETAILS
                    </span>
                    <div className="space-y-2.5 pt-1 text-xs sm:text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Invoice no.</span>
                        <span className="font-extrabold text-slate-900 dark:text-white font-mono">
                          {invoice.invoiceNumber}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Booking no.</span>
                        <span className="font-extrabold text-slate-900 dark:text-white font-mono">
                          {invoice.bookingNumber}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Date</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {formatDate(invoice.generatedAt || invoice.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ORDER ITEMS Section */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider text-left">
                    ORDER ITEMS
                  </h3>

                  <div className="rounded-2xl border border-purple-100/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="bg-[#f6eaf3] dark:bg-purple-950/40 text-[#581c4f] dark:text-purple-300 uppercase text-[10px] sm:text-xs font-black tracking-wider">
                          <th className="py-4 px-5 text-left">SERVICE DETAILS</th>
                          <th className="py-4 px-5 text-center">QTY</th>
                          <th className="py-4 px-5 text-right">UNIT PRICE</th>
                          <th className="py-4 px-5 text-right">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {invoice.items.map((item, idx) => (
                          <React.Fragment key={idx}>
                            <tr>
                              <td className="py-4.5 px-5 space-y-0.5 text-left">
                                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
                                  {item.packageName}
                                </span>
                                <span className="text-[11px] sm:text-xs text-slate-400 block">
                                  {item.categoryName || item.subCategoryName || "Service"}
                                  {item.serviceActionName ? ` / ${item.serviceActionName}` : ""}
                                </span>
                              </td>
                              <td className="py-4.5 px-5 text-center font-bold text-slate-700 dark:text-slate-300">
                                {item.quantity}
                              </td>
                              <td className="py-4.5 px-5 text-right text-slate-600 dark:text-slate-400">
                                Rs. {Number(item.unitPrice || 0).toFixed(2)}
                              </td>
                              <td className="py-4.5 px-5 text-right font-extrabold text-slate-900 dark:text-white">
                                Rs. {Number(item.totalPrice || item.unitPrice * item.quantity || 0).toFixed(2)}
                              </td>
                            </tr>

                            {/* Selected Addons */}
                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                              item.selectedAddons.map((addon, aIdx) => (
                                <tr key={`addon-${idx}-${aIdx}`} className="bg-amber-500/[0.03]">
                                  <td className="py-3 px-5 pl-10 text-left">
                                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block">
                                      {addon.name}
                                    </span>
                                  </td>
                                  <td className="py-3 px-5 text-center text-xs text-slate-600">
                                    {addon.quantity}
                                  </td>
                                  <td className="py-3 px-5 text-right text-xs text-slate-600">
                                    Rs. {Number(addon.unitPrice || 0).toFixed(2)}
                                  </td>
                                  <td className="py-3 px-5 text-right text-xs font-bold text-amber-700">
                                    Rs. {Number(addon.totalPrice || 0).toFixed(2)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* PAYMENT & FINANCIAL SUMMARY Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start pt-4 border-t border-slate-100 dark:border-slate-800">
                  {/* Left Column: PAYMENT Status */}
                  <div className="space-y-3 text-left">
                    <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                      PAYMENT
                    </h4>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-black text-xs uppercase px-4.5 py-2 rounded-full ${
                          invoice.billing.paymentStatus?.toLowerCase() === "paid"
                            ? "bg-[#e8f7f0] text-[#10b981]"
                            : "bg-[#fde8ef] text-[#e11d48]"
                        }`}
                      >
                        {invoice.billing.paymentStatus?.toUpperCase() || "PENDING"}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium capitalize">
                        Paid via {invoice.billing.paymentMethod?.replace(/_/g, " ") || "upi"}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Amount Breakdown & GRAND TOTAL */}
                  <div className="space-y-2.5 text-right">
                    <div className="flex justify-between items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      <span>MRP</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Rs. {Number(invoice.billing.mrp || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      <span>Service price</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Rs. {Number(invoice.billing.sellingPrice || invoice.billing.mrp || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm text-emerald-600 font-medium">
                      <span>Discount</span>
                      <span>- Rs. {Number(invoice.billing.discount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      <span>Platform fee</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Rs. {Number(invoice.billing.platformFee || 0).toFixed(2)}
                      </span>
                    </div>
                    {Number(invoice.billing.gst || 0) > 0 && (
                      <div className="flex justify-between items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 pb-1">
                        <span>GST</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Rs. {Number(invoice.billing.gst || 0).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* GRAND TOTAL Banner Box matching image */}
                    <div className="bg-[#4e0e47] text-white p-4 sm:p-5 rounded-2xl flex items-center justify-between shadow-md">
                      <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-white">
                        GRAND TOTAL
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-white">
                        Rs. {Number(invoice.billing.totalAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            ) : null}
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </>
  );
}
