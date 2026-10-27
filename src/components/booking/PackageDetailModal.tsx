"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Check,
  Star,
  Clock,
  Bookmark,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Layers,
  ShoppingBag,
  Plus
} from "lucide-react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fullDetails, setFullDetails] = useState<CustomerPackageDetailsData | null>(null);
  const token = useStore((state) => state.token);
  const setPackageAddons = useStore((state) => state.setPackageAddons);
  const cart = useStore((state) => state.cart);
  const toggleAddonInCart = useStore((state) => state.toggleAddonInCart);
  const addNotification = useStore((state) => state.addNotification);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pkgId = packageItem?.id || packageItem?._id;
  const cartItem = cart.find(
    (c) =>
      (pkgId && (String(c.id) === String(pkgId) || String(c.itemId) === String(pkgId))) ||
      (packageItem?._id && (String(c.id) === String(packageItem._id) || String(c.itemId) === String(packageItem._id))) ||
      (packageItem?.id && (String(c.id) === String(packageItem.id) || String(c.itemId) === String(packageItem.id)))
  );

  // Reset img error on package change
  useEffect(() => {
    setImgError(false);
  }, [pkgId]);

  // Sync selected addon IDs from cart or reset on new package
  useEffect(() => {
    if (isOpen && packageItem) {
      if (cartItem && Array.isArray(cartItem.selectedAddons) && cartItem.selectedAddons.length > 0) {
        setSelectedAddonIds(cartItem.selectedAddons.map((a: any) => String(a.addonId || a.id || a._id)));
      } else {
        setSelectedAddonIds([]);
      }
    } else {
      setSelectedAddonIds([]);
    }
  }, [isOpen, pkgId]);

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
    const targetPkgId = packageItem?.id || packageItem?._id;

    if (isOpen && targetPkgId) {
      if (/^[0-9a-fA-F]{24}$/.test(targetPkgId)) {
        setIsLoading(true);
        fetchCustomerPackageDetailsApi(targetPkgId, token || undefined)
          .then((res) => {
            if (!isCancelled) {
              if (res.success && res.data) {
                setFullDetails(res.data);
                if (res.data.addons && res.data.addons.length > 0) {
                  setPackageAddons(targetPkgId, res.data.addons, res.data.package?.name || packageItem?.name);
                }
              }
              setIsLoading(false);
            }
          })
          .catch((err) => {
            console.error("Error fetching package modal details:", err);
            if (!isCancelled) {
              setIsLoading(false);
            }
          });
      } else {
        // If not a MongoDB ObjectId, use provided packageItem without loading delay
        setFullDetails(null);
        setIsLoading(false);
      }
    } else {
      setFullDetails(null);
      setIsLoading(true);
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen, pkgId, token]);

  if (!mounted || !isOpen || !packageItem) return null;

  // Real data resolved from API response or packageItem without hardcoded mock fallbacks
  const name = fullDetails?.package?.name || packageItem.name || packageItem.packageName || "Package Details";
  const price = fullDetails?.package?.price ?? packageItem.price ?? 0;
  const originalPrice = fullDetails?.package?.originalPrice ?? packageItem.originalPrice;
  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;
  const duration = fullDetails?.package?.duration ?? packageItem.duration;
  const subtitle = fullDetails?.package?.subtitle || packageItem.subtitle || "";
  const description = fullDetails?.package?.description || packageItem.description || "";

  const rawImg =
    fullDetails?.package?.imageUrl ||
    fullDetails?.package?.thumbnailUrl ||
    packageItem.image ||
    packageItem.imageUrl;
  const initialCandidate = rawImg
    ? formatImageUrl(rawImg)
    : pkgId && /^[0-9a-fA-F]{24}$/.test(pkgId)
      ? `/api/media/package/${pkgId}/image`
      : "";

  // Strictly API-sourced Inclusions and Exclusions (no hardcoded fallback items)
  const inclusions: string[] =
    Array.isArray(fullDetails?.package?.includeInPackage) && fullDetails.package.includeInPackage.length > 0
      ? fullDetails.package.includeInPackage
      : Array.isArray(packageItem.includeInPackage) && packageItem.includeInPackage.length > 0
        ? packageItem.includeInPackage
        : [];

  const exclusions: string[] =
    Array.isArray(fullDetails?.package?.excludeFromPackage) && fullDetails.package.excludeFromPackage.length > 0
      ? fullDetails.package.excludeFromPackage
      : Array.isArray(packageItem.excludeFromPackage) && packageItem.excludeFromPackage.length > 0
        ? packageItem.excludeFromPackage
        : [];

  // Strictly API-sourced Addons
  const addons =
    Array.isArray(fullDetails?.addons) && fullDetails.addons.length > 0
      ? fullDetails.addons
      : Array.isArray(packageItem.addons) && packageItem.addons.length > 0
        ? packageItem.addons
        : [];

  // Strictly API-sourced Ratings
  const rating = fullDetails?.reviews?.averageRating ?? packageItem.rating ?? null;
  const totalReviews = fullDetails?.reviews?.totalReviews ?? packageItem.reviewsCount ?? null;

  // Addon selection and dynamic total calculations
  const basePrice = Number(price) || 0;
  const selectedAddonsTotal = addons
    .filter((a: any) => selectedAddonIds.includes(String(a._id || a.id)))
    .reduce((sum: number, a: any) => sum + (Number(a.price) || 0), 0);
  const currentTotal = basePrice + selectedAddonsTotal;

  const handleToggleAddon = async (addon: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const addonId = String(addon._id || addon.id);
    const isSelected = selectedAddonIds.includes(addonId);
    const action = isSelected ? "remove" : "add";

    const nextSelected = isSelected
      ? selectedAddonIds.filter((id) => id !== addonId)
      : [...selectedAddonIds, addonId];

    setSelectedAddonIds(nextSelected);

    if (cartItem && pkgId) {
      const addonName = addon.addonName || addon.title || addon.name || "Add-on";
      const addonPrice = Number(addon.price) || 0;
      const addonImg = addon.imageUrl || addon.image;
      await toggleAddonInCart(pkgId, addonId, action, {
        addonName,
        price: addonPrice,
        imageUrl: addonImg,
      });
      addNotification?.(
        action === "add" ? "Add-on Added" : "Add-on Removed",
        action === "add" ? `"${addonName}" added to package.` : `"${addonName}" removed from package.`,
        "info"
      );
    }
  };

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
        <div className="min-h-full flex items-center justify-center p-3 sm:p-5 text-center">
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
            className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-[820px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-[28px] sm:rounded-[32px] shadow-2xl shadow-black/25 dark:shadow-black/60 overflow-hidden text-left flex flex-col max-h-[90vh] relative font-sans my-auto transform-gpu transition-all"
          >
            {/* Top Navigation & Breadcrumb Bar */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 text-xs flex-wrap">
                {isLoading && !categoryName ? (
                  <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                ) : categoryName ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-accent-lux/10 text-accent-lux font-bold text-[10px] tracking-wide shrink-0">
                    {categoryName}
                  </span>
                ) : null}
                {subCategoryName && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs truncate max-w-[140px] sm:max-w-[200px]">
                      {subCategoryName}
                    </span>
                  </>
                )}
                {serviceActionName && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs truncate max-w-[150px] sm:max-w-[220px]">
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
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-all active:scale-90 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            {isLoading ? (
              /* Shimmer Loading Skeleton until API calls complete */
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 space-y-5 animate-pulse custom-scrollbar">
                {/* Hero Banner Shimmer */}
                <div className="h-48 sm:h-60 md:h-64 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 relative overflow-hidden flex items-end p-4">
                  <div className="flex justify-between w-full items-center">
                    <div className="flex gap-2">
                      <div className="h-6 w-20 bg-slate-300 dark:bg-slate-700 rounded-full" />
                      <div className="h-6 w-28 bg-slate-300 dark:bg-slate-700 rounded-full" />
                    </div>
                    <div className="h-6 w-20 bg-slate-300 dark:bg-slate-700 rounded-full" />
                  </div>
                </div>

                {/* Title & Price Shimmer */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="h-6 sm:h-7 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                      <div className="h-4 w-1/2 bg-slate-200/70 dark:bg-slate-800/70 rounded-lg" />
                    </div>
                    <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
                  </div>
                </div>

                {/* Overview Shimmer */}
                <div className="space-y-2 pt-1">
                  <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3.5 w-full bg-slate-200/70 dark:bg-slate-800/70 rounded" />
                  <div className="h-3.5 w-5/6 bg-slate-200/70 dark:bg-slate-800/70 rounded" />
                  <div className="h-3.5 w-2/3 bg-slate-200/70 dark:bg-slate-800/70 rounded" />
                </div>

                {/* Inclusions & Exclusions Shimmer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 space-y-3">
                    <div className="h-3.5 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-slate-200/60 dark:bg-slate-800/60 rounded" />
                      <div className="h-3 w-4/5 bg-slate-200/60 dark:bg-slate-800/60 rounded" />
                      <div className="h-3 w-3/4 bg-slate-200/60 dark:bg-slate-800/60 rounded" />
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 space-y-3">
                    <div className="h-3.5 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-slate-200/60 dark:bg-slate-800/60 rounded" />
                      <div className="h-3 w-4/5 bg-slate-200/60 dark:bg-slate-800/60 rounded" />
                    </div>
                  </div>
                </div>

                {/* Addons Shimmer Grid */}
                <div className="space-y-3 pt-1">
                  <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="h-16 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800" />
                    <div className="h-16 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800" />
                  </div>
                </div>
              </div>
            ) : (
              /* Actual Content Body */
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 space-y-5 custom-scrollbar">
                {/* Media Hero Banner */}
                <div className="relative h-48 sm:h-60 md:h-64 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-white/10 shadow-xs group">
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
                      <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                        {initials}
                      </div>
                      <span className="text-xs font-bold text-slate-300 mt-2 text-center max-w-[85%]">
                        {name}
                      </span>
                    </div>
                  )}

                  {/* Subtle vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                  {/* Bookmark Button */}
                  {onToggleBookmark && (
                    <button
                      type="button"
                      onClick={(e) => onToggleBookmark(pkgId, e)}
                      aria-label={isBookmarked ? "Remove from bookmarks" : "Save package"}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all active:scale-90 shadow-sm z-10 cursor-pointer ${isBookmarked
                          ? "bg-accent-lux text-white shadow-accent-lux/30"
                          : "bg-black/40 text-white hover:bg-black/60"
                        }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-white" : ""}`} />
                    </button>
                  )}

                  {/* Floating Badges */}
                  {((duration && Number(duration) > 0) || (rating && Number(rating) > 0)) && (
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 flex-wrap">
                      {duration && Number(duration) > 0 ? (
                        <span className="bg-black/65 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-sm">
                          <Clock className="w-3 h-3 text-amber-300" />
                          {formatDuration(Number(duration))}
                        </span>
                      ) : (
                        <div />
                      )}

                      {rating && Number(rating) > 0 ? (
                        <span className="bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-amber-300/30 flex items-center gap-1.5 shadow-sm">
                          <Star className="w-3 h-3 fill-white" />
                          {Number(rating).toFixed(1)} Rating
                          {totalReviews ? ` (${totalReviews})` : ""}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Title & Pricing Block */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h2
                        id="package-modal-title"
                        className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug"
                      >
                        {name}
                      </h2>
                      {subtitle && (
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {subtitle}
                        </p>
                      )}
                    </div>

                    {/* Pricing Box with Dynamic Addon Total */}
                    <div className="sm:text-right shrink-0 bg-slate-50 dark:bg-slate-800/50 sm:bg-transparent sm:dark:bg-transparent p-2.5 sm:p-0 rounded-xl flex sm:flex-col items-center sm:items-end justify-between sm:justify-start">
                      <div className="flex items-baseline justify-end gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black text-accent-lux font-sans">
                          ₹{currentTotal}
                        </span>
                        {originalPrice && originalPrice > basePrice && (
                          <span className="text-xs sm:text-sm font-normal text-slate-400 line-through font-sans">
                            ₹{originalPrice + selectedAddonsTotal}
                          </span>
                        )}
                      </div>
                      {selectedAddonIds.length > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 font-bold text-[10px] tracking-wide mt-0.5 sm:mt-1">
                          Base ₹{basePrice} + ₹{selectedAddonsTotal} add-on{selectedAddonIds.length > 1 ? "s" : ""}
                        </span>
                      ) : discount ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 font-bold text-[10px] uppercase tracking-wider mt-0.5 sm:mt-1">
                          {discount}% OFF
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Highlights Banner if subtitle is present */}
                  {subtitle && subtitle.trim().length > 0 && (
                    <div className="p-3 sm:p-3.5 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold uppercase tracking-wider text-[9px] text-amber-600 dark:text-amber-400 block mb-0.5">
                          Key Package Highlight
                        </span>
                        <p className="text-xs leading-relaxed">{subtitle}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Service Description (Only shown when present in API) */}
                {description && description.trim().length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                      Service Overview
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {description}
                    </p>
                  </div>
                )}

                {/* Inclusions & Exclusions (Only shown when present in API) */}
                {(inclusions.length > 0 || exclusions.length > 0) && (
                  <div className={`grid gap-3.5 ${inclusions.length > 0 && exclusions.length > 0 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                    {/* Inclusions */}
                    {inclusions.length > 0 && (
                      <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 space-y-2.5">
                        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Included in Package
                        </h4>
                        <ul className="space-y-2">
                          {inclusions.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Exclusions */}
                    {exclusions.length > 0 && (
                      <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/40 space-y-2.5">
                        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" /> Excluded From Package
                        </h4>
                        <ul className="space-y-2">
                          {exclusions.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Addons List with Selectable Options (Only shown when available) */}
                {addons && addons.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-accent-lux" /> Available Add-ons
                      </h3>
                      {selectedAddonIds.length > 0 ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {selectedAddonIds.length} added (+₹{selectedAddonsTotal})
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          Click Add to include in package
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {addons.map((addon: any, aIdx: number) => {
                        const aId = String(addon._id || addon.id || `addon-${aIdx}`);
                        const isSelected = selectedAddonIds.includes(aId);
                        const aName = addon.addonName || addon.title || addon.name || "Add-on";
                        const aPrice = Number(addon.price) || 0;
                        const aDesc = addon.description || "";

                        return (
                          <div
                            key={`${aId}-${aIdx}`}
                            onClick={(e) => handleToggleAddon(addon, e)}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all cursor-pointer select-none ${isSelected
                                ? "bg-accent-lux/[0.04] dark:bg-accent-lux/[0.08] border-accent-lux shadow-xs ring-1 ring-accent-lux/30"
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                              }`}
                          >
                            <div className="min-w-0 pr-1 flex-1">
                              <p className={`font-bold text-xs truncate ${isSelected ? "text-accent-lux" : "text-foreground"}`}>
                                {aName}
                              </p>
                              {aDesc && (
                                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                  {aDesc}
                                </p>
                              )}
                              <span className="font-extrabold text-accent-lux text-xs font-sans mt-1 inline-block">
                                +₹{aPrice}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleToggleAddon(addon, e)}
                              className={`px-3 py-1.5 rounded-full font-bold text-[11px] shrink-0 transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs ${isSelected
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold"
                                  : "bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-accent-lux text-foreground hover:text-accent-lux"
                                }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sticky Bottom Action Footer with Dynamic Total & Addon Breakdown */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-3 sticky bottom-0 z-20">
              {isLoading ? (
                <div className="w-full flex items-center justify-between animate-pulse">
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-10 w-24 sm:w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="h-10 w-28 sm:w-32 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Total Package Price
                      </span>
                      {selectedAddonIds.length > 0 && (
                        <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
                          +{selectedAddonIds.length} add-on{selectedAddonIds.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl sm:text-3xl font-black text-accent-lux font-sans leading-none">
                        ₹{currentTotal}
                      </span>
                      {selectedAddonIds.length > 0 && (
                        <span className="text-[11px] text-slate-400 font-semibold font-sans">
                          (₹{basePrice} + ₹{selectedAddonsTotal})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        if (isAdded) {
                          onClose();
                          router.push("/booking");
                          return;
                        }

                        const selectedAddonsList = addons
                          .filter((a: any) => selectedAddonIds.includes(String(a._id || a.id)))
                          .map((a: any) => {
                            const aId = String(a._id || a.id);
                            const aName = a.addonName || a.title || a.name || "Add-on";
                            const aPrice = Number(a.price) || 0;
                            return {
                              addonId: aId,
                              id: aId,
                              addonName: aName,
                              name: aName,
                              price: aPrice,
                              quantity: 1,
                              totalPrice: aPrice,
                              imageUrl: a.imageUrl || a.image,
                              image: a.imageUrl || a.image,
                            };
                          });

                        const itemWithAddons = {
                          ...packageItem,
                          addons: (fullDetails?.addons && fullDetails.addons.length > 0) ? fullDetails.addons : packageItem.addons,
                          availableAddons: (fullDetails?.addons && fullDetails.addons.length > 0) ? fullDetails.addons : packageItem.addons,
                          selectedAddons: selectedAddonsList,
                        };
                        onAddToCart(e, itemWithAddons);
                      }}
                      className={`px-4 sm:px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all active:scale-95 border shadow-xs cursor-pointer flex items-center gap-1.5 ${isAdded
                          ? "bg-accent-lux/10 border-accent-lux text-accent-lux hover:bg-accent-lux hover:text-white"
                          : "bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-foreground"
                        }`}
                    >
                      {isAdded ? (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" /> Go to Cart
                        </>
                      ) : (
                        "Add to Cart"
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        const selectedAddonsList = addons
                          .filter((a: any) => selectedAddonIds.includes(String(a._id || a.id)))
                          .map((a: any) => {
                            const aId = String(a._id || a.id);
                            const aName = a.addonName || a.title || a.name || "Add-on";
                            const aPrice = Number(a.price) || 0;
                            return {
                              addonId: aId,
                              id: aId,
                              addonName: aName,
                              name: aName,
                              price: aPrice,
                              quantity: 1,
                              totalPrice: aPrice,
                              imageUrl: a.imageUrl || a.image,
                              image: a.imageUrl || a.image,
                            };
                          });

                        const itemWithAddons = {
                          ...packageItem,
                          addons: (fullDetails?.addons && fullDetails.addons.length > 0) ? fullDetails.addons : packageItem.addons,
                          availableAddons: (fullDetails?.addons && fullDetails.addons.length > 0) ? fullDetails.addons : packageItem.addons,
                          selectedAddons: selectedAddonsList,
                        };
                        onBookNow(e, itemWithAddons);
                      }}
                      className="px-5 sm:px-7 py-2.5 rounded-full bg-accent-lux hover:bg-accent-lux/95 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-accent-lux/25 transition-all cursor-pointer flex items-center gap-1.5 relative overflow-hidden"
                    >
                      <span>Book Now</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
