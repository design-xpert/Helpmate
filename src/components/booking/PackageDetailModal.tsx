"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Check,
  Star,
  Clock,
  ShieldCheck,
  Bookmark,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Award,
  Layers,
  HeartHandshake
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatImageUrl, getNameInitials } from "@/utils/image";
import { formatDuration } from "@/utils/dateTime";
import { fetchCustomerPackageDetailsApi, CustomerPackageDetailsData } from "@/services/packageApi";
import { useStore } from "@/store/useStore";

interface PackageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageItem: any | null;
  categoryName?: string;
  subCategoryName?: string;
  serviceActionName?: string;
  isAdded: boolean;
  onAddToCart: (e: React.MouseEvent, item: any) => void;
  onBookNow: (e: React.MouseEvent, item: any) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (pkgId: string, e: React.MouseEvent) => void;
}

export default function PackageDetailModal({
  isOpen,
  onClose,
  packageItem,
  categoryName,
  subCategoryName,
  serviceActionName,
  isAdded,
  onAddToCart,
  onBookNow,
  isBookmarked = false,
  onToggleBookmark,
}: PackageDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [fullDetails, setFullDetails] = useState<CustomerPackageDetailsData | null>(null);
  const token = useStore((state) => state.token);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background body scrolling with smooth lock
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch complete details from backend if package ID is a valid MongoDB ObjectId
  useEffect(() => {
    let isCancelled = false;
    const pkgId = packageItem?.id || packageItem?._id;

    if (isOpen && pkgId && /^[0-9a-fA-F]{24}$/.test(pkgId)) {
      fetchCustomerPackageDetailsApi(pkgId, token || undefined)
        .then((res) => {
          if (!isCancelled && res.success && res.data) {
            setFullDetails(res.data);
          }
        })
        .catch((err) => {
          console.error("Error fetching package modal details:", err);
        });
    } else {
      setFullDetails(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen, packageItem, token]);

  if (!mounted || !isOpen || !packageItem) return null;

  const pkgId = packageItem.id || packageItem._id;
  const name = packageItem.name || packageItem.packageName || "Package Details";
  const price = packageItem.price || 0;
  const originalPrice = packageItem.originalPrice || fullDetails?.package?.originalPrice;
  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;
  const duration = packageItem.duration || fullDetails?.package?.duration || 60;
  const subtitle = packageItem.subtitle || fullDetails?.package?.subtitle || "";
  const description =
    packageItem.description ||
    fullDetails?.package?.description ||
    `${name} performed by background-verified and certified Helpmate professionals in Varanasi.`;

  const rawImg =
    packageItem.image ||
    packageItem.imageUrl ||
    fullDetails?.package?.imageUrl ||
    fullDetails?.package?.thumbnailUrl;
  const initialCandidate = rawImg
    ? formatImageUrl(rawImg)
    : pkgId && /^[0-9a-fA-F]{24}$/.test(pkgId)
    ? `/api/media/package/${pkgId}/image`
    : "";

  // Inclusions and Exclusions
  const inclusions: string[] =
    fullDetails?.package?.includeInPackage && fullDetails.package.includeInPackage.length > 0
      ? fullDetails.package.includeInPackage
      : packageItem.includeInPackage && packageItem.includeInPackage.length > 0
      ? packageItem.includeInPackage
      : [
          "Complete professional diagnostics & inspection",
          "Certified & background-verified local specialists",
          "Helpmate post-service quality assurance checklist",
          "Standard tools and certified equipment usage included",
          "30-day HelpMate service warranty included",
        ];

  const exclusions: string[] =
    fullDetails?.package?.excludeFromPackage && fullDetails.package.excludeFromPackage.length > 0
      ? fullDetails.package.excludeFromPackage
      : packageItem.excludeFromPackage && packageItem.excludeFromPackage.length > 0
      ? packageItem.excludeFromPackage
      : [
          "Spare parts and replacement hardware charges",
          "Unlisted structural or major masonry modifications",
        ];

  // Addons
  const addons =
    fullDetails?.addons && fullDetails.addons.length > 0
      ? fullDetails.addons
      : packageItem.addons && packageItem.addons.length > 0
      ? packageItem.addons
      : [];

  const initials = getNameInitials(name, "P");

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
        {/* Smooth Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-md"
          aria-hidden="true"
        />

        {/* Modal Centering Wrapper */}
        <div className="min-h-full flex items-center justify-center p-3.5 sm:p-5 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{
              duration: 0.26,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="package-modal-title"
            className="w-full max-w-[475px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-[28px] shadow-2xl shadow-black/25 dark:shadow-black/60 overflow-hidden text-left flex flex-col max-h-[85vh] relative font-sans my-auto transform-gpu"
          >
            {/* Top Navigation & Breadcrumb Bar */}
            <div className="px-4.5 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-1.5 min-w-0 text-xs">
                {categoryName && (
                  <span className="px-2.5 py-0.5 rounded-full bg-accent-lux/10 text-accent-lux font-bold text-[10px] tracking-wide shrink-0">
                    {categoryName}
                  </span>
                )}
                {subCategoryName && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-600 dark:text-slate-300 text-[11px] truncate max-w-[110px]">
                      {subCategoryName}
                    </span>
                  </>
                )}
                {serviceActionName && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[120px]">
                      {serviceActionName}
                    </span>
                  </>
                )}
              </div>

              {/* Close Button with micro-spring */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-all active:scale-90 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4.5 custom-scrollbar">
              {/* Media Hero Banner (Slim Proportions) */}
              <div className="relative h-44 sm:h-48 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-white/10 shadow-xs group">
                {initialCandidate && !imgError ? (
                  <img
                    src={initialCandidate}
                    alt={name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    onError={() => {
                      if (
                        pkgId &&
                        /^[0-9a-fA-F]{24}$/.test(pkgId) &&
                        !initialCandidate.includes(`/api/media/package/${pkgId}/image`)
                      ) {
                        setImgError(false);
                      } else {
                        setImgError(true);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#48073d] via-slate-900 to-slate-950 text-white select-none">
                    <div className="w-13 h-13 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-xl flex items-center justify-center shadow-lg">
                      {initials}
                    </div>
                    <span className="text-[11px] font-bold text-slate-300 mt-2 text-center max-w-[85%]">
                      {name}
                    </span>
                  </div>
                )}

                {/* Subtle vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />

                {/* Bookmark Button */}
                {onToggleBookmark && (
                  <button
                    type="button"
                    onClick={(e) => onToggleBookmark(pkgId, e)}
                    aria-label={isBookmarked ? "Remove from bookmarks" : "Save package"}
                    className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md transition-all active:scale-90 shadow-sm z-10 cursor-pointer ${
                      isBookmarked
                        ? "bg-accent-lux text-white shadow-accent-lux/30"
                        : "bg-black/40 text-white hover:bg-black/60"
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-white" : ""}`} />
                  </button>
                )}

                {/* Floating Badges */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/15 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-300" />
                      {formatDuration(duration)}
                    </span>
                    <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Verified
                    </span>
                  </div>

                  <span className="bg-amber-500/90 backdrop-blur-md text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300/30 flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-white" />
                    4.95
                  </span>
                </div>
              </div>

              {/* Title & Pricing Block */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2
                      id="package-modal-title"
                      className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight leading-snug"
                    >
                      {name}
                    </h2>
                    {subtitle && (
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {subtitle}
                      </p>
                    )}
                  </div>

                  {/* Pricing Box */}
                  <div className="text-right shrink-0">
                    <div className="flex items-baseline justify-end gap-1.5">
                      <span className="text-xl sm:text-2xl font-black text-accent-lux font-sans">
                        ₹{price}
                      </span>
                      {originalPrice && originalPrice > price && (
                        <span className="text-xs font-normal text-slate-400 line-through font-sans">
                          ₹{originalPrice}
                        </span>
                      )}
                    </div>
                    {discount && (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 font-bold text-[9px] uppercase tracking-wider mt-0.5">
                        {discount}% OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Highlights Banner if subtitle is present */}
                {subtitle && (
                  <div className="p-3 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold uppercase tracking-wider text-[8px] text-amber-600 dark:text-amber-400 block mb-0.5">
                        Key Highlight
                      </span>
                      <p className="text-[11px] leading-relaxed">{subtitle}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Service Description */}
              <div className="space-y-1.5">
                <h3 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                  Service Overview
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              </div>

              {/* Inclusions & Exclusions (Stacked for Slim Form Factor) */}
              <div className="space-y-2.5">
                {/* Inclusions */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 space-y-2">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" /> Included in Package
                  </h4>
                  <ul className="space-y-1.5">
                    {inclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exclusions */}
                <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/40 space-y-2">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <XCircle className="w-3 h-3" /> Excluded From Package
                  </h4>
                  <ul className="space-y-1.5">
                    {exclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                        <X className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Addons List if present */}
              {addons && addons.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h3 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-accent-lux" /> Available Add-ons
                  </h3>
                  <div className="space-y-1.5">
                    {addons.map((addon: any) => (
                      <div
                        key={addon._id || addon.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-[11px] text-foreground truncate">
                            {addon.addonName || addon.title || addon.name}
                          </p>
                          {addon.description && (
                            <p className="text-[10px] text-slate-400 line-clamp-1">{addon.description}</p>
                          )}
                        </div>
                        <span className="font-extrabold text-accent-lux shrink-0 text-xs">
                          +₹{addon.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Helpmate Trust Guarantees (Compact 4-column strip) */}
              <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="space-y-0.5">
                    <Award className="w-3.5 h-3.5 text-accent-lux mx-auto" />
                    <p className="text-[9px] font-bold text-foreground leading-tight">30-Day</p>
                    <p className="text-[8px] text-slate-400 leading-none">Warranty</p>
                  </div>
                  <div className="space-y-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                    <p className="text-[9px] font-bold text-foreground leading-tight">Audited</p>
                    <p className="text-[8px] text-slate-400 leading-none">Specialists</p>
                  </div>
                  <div className="space-y-0.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500 mx-auto" />
                    <p className="text-[9px] font-bold text-foreground leading-tight">On-Time</p>
                    <p className="text-[8px] text-slate-400 leading-none">Arrival</p>
                  </div>
                  <div className="space-y-0.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                    <p className="text-[9px] font-bold text-foreground leading-tight">No Hidden</p>
                    <p className="text-[8px] text-slate-400 leading-none">Costs</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Bottom Action Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-2.5 sticky bottom-0 z-20">
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  Price
                </span>
                <span className="text-xl sm:text-2xl font-black text-accent-lux font-sans leading-none">
                  ₹{price}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isAdded}
                  onClick={(e) => onAddToCart(e, packageItem)}
                  className={`px-3.5 py-2 rounded-full font-bold text-xs transition-all active:scale-95 border shadow-xs cursor-pointer ${
                    isAdded
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-450 opacity-90 cursor-not-allowed"
                      : "bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-foreground"
                  }`}
                >
                  {isAdded ? "Added ✓" : "Add to Cart"}
                </button>

                <button
                  type="button"
                  onClick={(e) => onBookNow(e, packageItem)}
                  className="px-4.5 py-2 rounded-full bg-accent-lux hover:bg-accent-lux/95 active:scale-95 text-white font-bold text-xs shadow-md shadow-accent-lux/20 transition-all cursor-pointer flex items-center gap-1 relative overflow-hidden"
                >
                  <span>Book Now</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
