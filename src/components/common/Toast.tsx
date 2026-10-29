"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

let toastItems: ToastItem[] = [];
let listeners: ToastListener[] = [];
const recentToastTimestamps = new Map<string, number>();

function notifyListeners() {
  const current = [...toastItems];
  listeners.forEach((listener) => listener(current));
}

export const toast = {
  show: (type: ToastType, title: string, message?: string, duration = 4500): string => {
    // Deduplication check: prevent identical or rapid duplicate toasts within 1200ms
    const normalizedKey = `${type}:${(title || "").trim().toLowerCase()}`;
    const now = Date.now();
    const lastSeen = recentToastTimestamps.get(normalizedKey) || 0;
    if (now - lastSeen < 1200) {
      return "";
    }
    // Also avoid adding if currently visible active toasts already contain this exact title & type
    if (toastItems.some((t) => t.type === type && t.title.trim().toLowerCase() === (title || "").trim().toLowerCase())) {
      return "";
    }
    recentToastTimestamps.set(normalizedKey, now);

    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newToast: ToastItem = { id, type, title, message, duration };
    toastItems = [...toastItems, newToast];
    notifyListeners();

    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }
    return id;
  },
  success: (title: string, message?: string, duration?: number) => toast.show("success", title, message, duration),
  error: (title: string, message?: string, duration?: number) => toast.show("error", title, message, duration),
  warning: (title: string, message?: string, duration?: number) => toast.show("warning", title, message, duration),
  info: (title: string, message?: string, duration?: number) => toast.show("info", title, message, duration),
  dismiss: (id: string) => {
    toastItems = toastItems.filter((t) => t.id !== id);
    notifyListeners();
  },
  clear: () => {
    toastItems = [];
    notifyListeners();
  },
};

export function ToastContainer() {
  const [activeToasts, setActiveToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleChange = (newToasts: ToastItem[]) => {
      setActiveToasts(newToasts);
    };
    listeners.push(handleChange);
    return () => {
      listeners = listeners.filter((l) => l !== handleChange);
    };
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-live="polite"
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[999999] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] sm:w-96 select-none pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {activeToasts.map((t) => {
          const isError = t.type === "error";
          const isSuccess = t.type === "success";
          const isWarning = t.type === "warning";

          const containerStyles = isError
            ? "bg-rose-950/95 border-rose-500/40 text-rose-50 shadow-rose-950/40 ring-1 ring-rose-500/20"
            : isSuccess
            ? "bg-emerald-950/95 border-emerald-500/40 text-emerald-50 shadow-emerald-950/40 ring-1 ring-emerald-500/20"
            : isWarning
            ? "bg-amber-950/95 border-amber-500/40 text-amber-50 shadow-amber-950/40 ring-1 ring-amber-500/20"
            : "bg-[#280422]/95 border-[#782860]/50 text-purple-50 shadow-purple-950/40 ring-1 ring-[#782860]/30";

          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.92, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3 pointer-events-auto ${containerStyles}`}
            >
              <div className="shrink-0 mt-0.5">
                {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {!isError && !isSuccess && !isWarning && <Info className="w-5 h-5 text-purple-300" />}
              </div>

              <div className="flex-1 min-w-0 space-y-0.5 text-left">
                <h4 className="text-xs font-extrabold tracking-wide text-white leading-tight">
                  {t.title}
                </h4>
                {t.message && (
                  <p className="text-[11px] font-normal leading-relaxed text-slate-200/90 break-words">
                    {t.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                aria-label="Close notification"
                className="shrink-0 text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body
  );
}

export default ToastContainer;
