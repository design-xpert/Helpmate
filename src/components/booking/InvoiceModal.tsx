"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  Download,
  FileText,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { fetchInvoiceApi, fetchInvoicePdfBlob, InvoiceData } from "@/services/invoiceApi";

interface InvoiceModalProps {
  bookingId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  bookingId,
  isOpen,
  onClose,
}) => {
  const { token } = useStore();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (isOpen && bookingId) {
      loadInvoice();
    } else {
      setInvoice(null);
      setError(null);
    }
  }, [isOpen, bookingId, token]);

  const loadInvoice = async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchInvoiceApi(bookingId, token);
      if (res.success && res.data) {
        setInvoice(res.data);
      } else {
        setError(res.message || "Unable to fetch invoice details.");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
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
      console.error("Download PDF error:", err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end print:block print:inset-0">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm print:hidden"
          />

          {/* Right side slide-over drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative w-full max-w-2xl sm:max-w-3xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col z-10 print:h-auto print:max-h-none print:shadow-none print:border-none print:w-full print:bg-white"
          >
            {/* Modal Top Controls Bar (Hidden on Print) */}
            <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 print:hidden shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-100 text-[#581c4f] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-foreground">Tax Invoice</h3>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Official Service Receipt</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {invoice && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="hidden xs:flex px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#581c4f]" />
                      <span>Print</span>
                    </button>
                    <button
                      type="button"
                      disabled={downloadingPdf}
                      onClick={handleDownloadPdf}
                      className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#581c4f] hover:bg-[#4a0e4e] text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {downloadingPdf ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden xs:inline">PDF Download</span>
                      <span className="xs:hidden">PDF</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body / Printable Invoice Sheet */}
            <div className="p-3.5 sm:p-6 md:p-8 overflow-y-auto space-y-4 sm:space-y-6 print:p-6 print:overflow-visible font-sans">
              {loading ? (
                <div className="py-20 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-[#581c4f] animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-500">Loading invoice details...</p>
                </div>
              ) : error ? (
                <div className="py-16 px-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h4 className="text-sm font-bold text-foreground">Invoice Unavailable</h4>
                    <p className="text-xs text-slate-400 mt-1">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadInvoice}
                    className="px-4 py-2 bg-[#581c4f] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#4a0e4e] transition-all cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : invoice ? (
                <div className="space-y-6 printable-invoice-content" id="printable-invoice">
                  
                  {/* Top Header Banner matching reference image */}
                  <div className="bg-[#fcf5fa] dark:bg-purple-950/20 p-4 sm:p-6 rounded-2xl border border-purple-100/60 dark:border-purple-900/30 flex items-center justify-between gap-4">
                    {/* Brand Logo Box */}
                    <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-purple-100 shadow-xs shrink-0">
                      <img
                        src="/logo-white.png"
                        alt="HELP MATE"
                        className="h-9 sm:h-14 w-auto object-contain"
                      />
                    </div>

                    {/* Right Header Status & Title */}
                    <div className="text-right space-y-1">
                      <h1 className="text-xl sm:text-3xl font-black tracking-wide text-[#4e0e47] dark:text-purple-300">
                        INVOICE
                      </h1>
                      <div>
                        <span className="bg-[#e6f7f0] dark:bg-emerald-950/60 text-[#10b981] dark:text-emerald-400 font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full inline-block border border-emerald-500/20">
                          {invoice.invoiceStatus || "GENERATED"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BILL TO & INVOICE DETAILS Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Left Card: BILL TO */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-purple-100/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs space-y-2 text-left">
                      <span className="text-xs font-black uppercase text-[#8a1562] dark:text-purple-400 tracking-wider block">
                        BILL TO
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
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
                    <div className="p-4 sm:p-5 rounded-2xl border border-purple-100/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs space-y-2 text-left">
                      <span className="text-xs font-black uppercase text-[#8a1562] dark:text-purple-400 tracking-wider block">
                        INVOICE DETAILS
                      </span>
                      <div className="space-y-2 pt-1 text-xs">
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
                    <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider text-left">
                      ORDER ITEMS
                    </h3>

                    <div className="rounded-2xl border border-purple-100/80 dark:border-slate-800 overflow-x-auto bg-white dark:bg-slate-900">
                      <table className="w-full min-w-[440px] text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#f6eaf3] dark:bg-purple-950/40 text-[#581c4f] dark:text-purple-300 uppercase text-[10px] font-black tracking-wider">
                            <th className="py-3.5 px-4 text-left">SERVICE DETAILS</th>
                            <th className="py-3.5 px-4 text-center">QTY</th>
                            <th className="py-3.5 px-4 text-right">UNIT PRICE</th>
                            <th className="py-3.5 px-4 text-right">AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {invoice.items.map((item, idx) => (
                            <React.Fragment key={idx}>
                              <tr>
                                <td className="py-4 px-4 space-y-0.5 text-left">
                                  <span className="font-bold text-slate-900 dark:text-white text-xs block">
                                    {item.packageName}
                                  </span>
                                  <span className="text-[11px] text-slate-400 block">
                                    {item.categoryName || item.subCategoryName || "Service"}
                                    {item.serviceActionName ? ` / ${item.serviceActionName}` : ""}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                                  {item.quantity}
                                </td>
                                <td className="py-4 px-4 text-right text-slate-600 dark:text-slate-400">
                                  Rs. {Number(item.unitPrice || 0).toFixed(2)}
                                </td>
                                <td className="py-4 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                                  Rs. {Number(item.totalPrice || item.unitPrice * item.quantity || 0).toFixed(2)}
                                </td>
                              </tr>

                              {/* Selected Addons if present */}
                              {item.selectedAddons && item.selectedAddons.length > 0 && (
                                item.selectedAddons.map((addon, aIdx) => (
                                  <tr key={`addon-${idx}-${aIdx}`} className="bg-amber-500/[0.03]">
                                    <td className="py-2.5 px-4 pl-8 text-left">
                                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">
                                        {addon.name}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-center text-[11px] text-slate-600">
                                      {addon.quantity}
                                    </td>
                                    <td className="py-2.5 px-4 text-right text-[11px] text-slate-600">
                                      Rs. {Number(addon.unitPrice || 0).toFixed(2)}
                                    </td>
                                    <td className="py-2.5 px-4 text-right text-[11px] font-bold text-amber-700">
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
                          className={`font-black text-xs uppercase px-4 py-1.5 rounded-full ${
                            invoice.billing.paymentStatus?.toLowerCase() === "paid"
                              ? "bg-[#e8f7f0] text-[#10b981]"
                              : "bg-[#fde8ef] text-[#e11d48]"
                          }`}
                        >
                          {invoice.billing.paymentStatus?.toUpperCase() || "PENDING"}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium capitalize">
                          Paid via {invoice.billing.paymentMethod?.replace(/_/g, " ") || "upi"}
                        </span>
                      </div>
                    </div>

                    {/* Right Column: Amount Breakdown & GRAND TOTAL */}
                    <div className="space-y-2.5 text-right">
                      <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                        <span>MRP</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Rs. {Number(invoice.billing.mrp || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                        <span>Service price</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Rs. {Number(invoice.billing.sellingPrice || invoice.billing.mrp || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-emerald-600 font-medium">
                        <span>Discount</span>
                        <span>- Rs. {Number(invoice.billing.discount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                        <span>Platform fee</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Rs. {Number(invoice.billing.platformFee || 0).toFixed(2)}
                        </span>
                      </div>
                      {Number(invoice.billing.gst || 0) > 0 && (
                        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 pb-1">
                          <span>GST</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Rs. {Number(invoice.billing.gst || 0).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* GRAND TOTAL Banner Box matching image */}
                      <div className="bg-[#4e0e47] text-white p-4 sm:p-4.5 rounded-2xl flex items-center justify-between shadow-md">
                        <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-white">
                          GRAND TOTAL
                        </span>
                        <span className="text-lg sm:text-xl font-black text-white">
                          Rs. {Number(invoice.billing.totalAmount || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
