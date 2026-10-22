"use client";

import React, { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { fetchWebsiteBannerApi, WebsiteBannerData } from "@/services/websiteBannerApi";
import { formatImageUrl } from "@/utils/image";

export default function PromoModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [banner, setBanner] = useState<WebsiteBannerData | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadBanner() {
      try {
        const res = await fetchWebsiteBannerApi();
        if (isCancelled) return;

        // Strictly verify that API banner exists, is active, and has a non-empty mainImageUrl
        const bannerData = res?.data;
        const mainImg = bannerData?.mainImageUrl?.trim();

        if (!res?.success || !bannerData || !bannerData.isActive || !mainImg) {
          // No banner or no image from API: strictly do NOT show anything (no hardcoded fallback)
          return;
        }

        // Check display frequency rules
        const frequency = bannerData.displayFrequency || "once-per-session";
        if (frequency === "once-per-session") {
          const hasSeen = typeof window !== "undefined" && sessionStorage.getItem(`helpmate_banner_seen_${bannerData._id}`);
          if (hasSeen) return;
        } else if (frequency === "once-per-day") {
          const todayStr = new Date().toDateString();
          const lastSeenDate = typeof window !== "undefined" && localStorage.getItem(`helpmate_banner_day_${bannerData._id}`);
          if (lastSeenDate === todayStr) return;
        }

        // Preload image to ensure it loads successfully from the API media server
        // If the image fails to load (404, network error, or invalid file), do NOT open or display any banner
        const resolvedImgUrl = formatImageUrl(mainImg);
        const preloadImg = new Image();
        preloadImg.src = resolvedImgUrl;

        preloadImg.onload = () => {
          if (isCancelled) return;

          setBanner(bannerData);

          const delayMs = Math.max(0, (bannerData.popupDelaySeconds ?? 2) * 1000);
          const timer = setTimeout(() => {
            if (!isCancelled) {
              setIsOpen(true);

              // Mark as viewed according to frequency policy
              if (typeof window !== "undefined") {
                if (frequency === "once-per-session") {
                  sessionStorage.setItem(`helpmate_banner_seen_${bannerData._id}`, "true");
                } else if (frequency === "once-per-day") {
                  localStorage.setItem(`helpmate_banner_day_${bannerData._id}`, new Date().toDateString());
                }
              }
            }
          }, delayMs);

          return () => clearTimeout(timer);
        };

        preloadImg.onerror = () => {
          // Image failed to load from API: strictly omit the modal
          console.warn("Website banner image failed to load from API. Omitting banner modal.");
        };

      } catch (err) {
        console.error("Failed to load website banner:", err);
      }
    }

    loadBanner();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // If no banner or no image from API, strictly do not render anything
  if (!isOpen || !banner || !banner.mainImageUrl || !banner.mainImageUrl.trim()) {
    return null;
  }

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsOpen(false);
  };

  const handleBannerClick = () => {
    if (!banner.clickTargetUrl) return;

    setIsOpen(false);

    const target = banner.clickTargetUrl.trim();
    if (target.startsWith("http://") || target.startsWith("https://")) {
      try {
        const urlObj = new URL(target);
        if (typeof window !== "undefined" && urlObj.host === window.location.host) {
          router.push(urlObj.pathname + urlObj.search + urlObj.hash);
          return;
        }
      } catch {
        // Fallback to opening external
      }
      window.open(target, "_blank", "noopener,noreferrer");
    } else {
      router.push(target);
    }
  };

  const formattedMainImg = formatImageUrl(banner.mainImageUrl);
  const formattedBadgeIcon = banner.badgeIconUrl ? formatImageUrl(banner.badgeIconUrl) : "";

  // Badge position classes
  const getBadgePositionClass = (position?: string) => {
    switch (position) {
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-14"; // Clearance for close button
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-left":
      default:
        return "bottom-4 left-4";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 font-sans">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={() => handleClose()}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 18 }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            role="dialog"
            aria-modal="true"
            aria-label="Promotional Announcement"
            className="relative z-10 w-full max-w-lg sm:max-w-xl md:max-w-2xl bg-slate-950 rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-2xl shadow-black/60 border border-white/10 my-auto text-left"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close promotion"
              className="absolute top-3.5 right-3.5 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/65 hover:bg-black/90 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-md transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Clickable Banner Area */}
            <div
              onClick={handleBannerClick}
              className={`relative w-full overflow-hidden select-none ${
                banner.clickTargetUrl ? "cursor-pointer group" : ""
              }`}
            >
              {/* Main Banner Image */}
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[75vh] bg-slate-900 flex items-center justify-center overflow-hidden">
                <img
                  src={formattedMainImg}
                  alt={banner.badgeText || "Special Promotion"}
                  className="w-full h-full object-cover object-center group-hover:scale-[1.015] transition-transform duration-500 ease-out"
                  onError={() => {
                    // If image fails to render, immediately close modal to avoid showing broken or hardcoded display
                    setIsOpen(false);
                  }}
                />

                {/* Subtle Bottom Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
              </div>

              {/* Floating Promotional Badge */}
              {(banner.badgeText || formattedBadgeIcon) && (
                <div
                  className={`absolute ${getBadgePositionClass(banner.badgePosition)} z-20 flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/25 text-white shadow-xl pointer-events-none max-w-[85%]`}
                >
                  {formattedBadgeIcon && (
                    <img
                      src={formattedBadgeIcon}
                      alt=""
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  {banner.badgeText && (
                    <span className="text-[11px] sm:text-xs font-black tracking-wide leading-tight truncate">
                      {banner.badgeText}
                    </span>
                  )}
                </div>
              )}

              {/* Interactive Target Hint Callout if clickTargetUrl exists */}
              {banner.clickTargetUrl && (
                <div className="absolute bottom-3.5 right-3.5 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-lux/90 hover:bg-accent-lux text-white text-[10px] font-bold shadow-lg backdrop-blur-md border border-white/20 group-hover:scale-105 transition-all">
                  <span>Explore Offer</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
