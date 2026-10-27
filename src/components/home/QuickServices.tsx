"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowDown } from "lucide-react";
import { formatImageUrl, getNameInitials } from "@/utils/image";
import { fetchCustomerQuickServicesApi } from "@/services/quickServiceApi";

export interface QuickPackage {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  categoryId?: string;
  price: number;
  originalPrice?: number;
  duration?: number;
  imageUrl?: string;
  rating?: number;
  discountText?: string;
}

// Micro Thumbnail with 2-Letter Initials Fallback
function StripThumbnail({
  imageUrl,
  name,
  pkgId,
}: {
  imageUrl?: string;
  name: string;
  pkgId?: string;
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [imageUrl, pkgId]);

  let targetUrl = imageUrl?.trim() || "";
  if (!targetUrl && pkgId && /^[0-9a-fA-F]{24}$/.test(pkgId)) {
    // If no direct URL was resolved, try the package media route
    targetUrl = `/api/media/package/${pkgId}/image`;
  }

  const formattedUrl = formatImageUrl(targetUrl);
  const initials = getNameInitials(name, "P");

  if (formattedUrl && !imgError) {
    return (
      <img
        src={formattedUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#4a0e4e] to-slate-900 text-white font-black text-[10px] tracking-tight uppercase select-none">
      {initials}
    </div>
  );
}

export default function QuickServices({
  onExploreAll,
  onBookPackage,
  onSelectPackage,
}: {
  onExploreAll?: () => void;
  onBookPackage?: (pkg: QuickPackage) => void;
  onSelectPackage?: (pkg: QuickPackage) => void;
} = {}) {
  const router = useRouter();
  const [packages, setPackages] = useState<QuickPackage[]>([]);
  const [navigatingPkgId, setNavigatingPkgId] = useState<string | null>(null);

  // Smooth scroll down to #categories
  const handleScrollToCategories = () => {
    if (onExploreAll) {
      onExploreAll();
      return;
    }
    const categoriesSection = document.getElementById("categories");
    if (categoriesSection) {
      categoriesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push("/#categories");
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadPackages() {
      try {
        const res = await fetchCustomerQuickServicesApi();
        if (
          isMounted &&
          res.success &&
          res.data &&
          Array.isArray(res.data) &&
          res.data.length > 0
        ) {
          const list: QuickPackage[] = res.data.slice(0, 6).map((item, idx) => {
            const pkgName = item.packageName || (item as any).name || `Quick Service ${idx + 1}`;
            const rawCat =
              typeof item.category === "object"
                ? item.category?.name
                : (item.category || item.categoryName || (item as any).serviceActionId?.categoryId?.name);
            const catName = rawCat || "Quick Service";
            const catSlug =
              (item as any).categorySlug ||
              (item as any).serviceActionId?.categoryId?.slug ||
              (catName !== "Quick Service" ? catName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") : "");
            const rawCatId =
              typeof item.category === "object"
                ? item.category?.id || (item.category as any)?._id
                : (item.categoryId ||
                   (item as any)?.serviceActionId?.categoryId?._id ||
                   (item as any)?.serviceActionId?.categoryId?.id);
            const pkgId = String(item.packageId || item._id || item.id || `quick-${idx}`);

            // Image URL resolution:
            // 1) Full URL (http, https, data:, blob:) -> use directly
            // 2) MinIO bucket key or relative path -> route to /api/media/package/${pkgId}/image
            // 3) Empty or no image -> leave empty so StripThumbnail immediately shows letter initials
            const rawImg = (item.imageUrl || item.thumbnailUrl || "").trim();
            let resolvedImage = "";
            if (rawImg) {
              if (
                rawImg.startsWith("http://") ||
                rawImg.startsWith("https://") ||
                rawImg.startsWith("data:") ||
                rawImg.startsWith("blob:")
              ) {
                resolvedImage = rawImg;
              } else if (/^[0-9a-fA-F]{24}$/.test(pkgId)) {
                resolvedImage = `/api/media/package/${pkgId}/image`;
              } else {
                resolvedImage = rawImg;
              }
            }

            return {
              id: pkgId,
              name: pkgName,
              category: catName,
              categorySlug: catSlug,
              categoryId: rawCatId,
              price: item.price ?? 0,
              originalPrice: item.originalPrice,
              duration: item.duration || 60,
              imageUrl: resolvedImage,
              rating: 4.9,
            };
          });
          setPackages(list);
        } else if (isMounted) {
          setPackages([]);
        }
      } catch (err) {
        if (isMounted) {
          setPackages([]);
        }
      }
    }

    loadPackages();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCardClick = (pkg: QuickPackage) => {
    if (onSelectPackage) {
      onSelectPackage(pkg);
      return;
    }
    if (onBookPackage) {
      onBookPackage(pkg);
      return;
    }

    setNavigatingPkgId(pkg.id);

    const targetCategorySlug =
      pkg.categorySlug && pkg.categorySlug !== "quick-service"
        ? pkg.categorySlug
        : pkg.categoryId
        ? String(pkg.categoryId)
        : "service";

    const queryParams = new URLSearchParams();
    if (pkg.categoryId) {
      queryParams.set("categoryId", String(pkg.categoryId));
    }
    queryParams.set("item", String(pkg.id));

    router.push(`/services/${targetCategorySlug}?${queryParams.toString()}`);
  };

  // When no data from API, do not show the bar at all
  if (packages.length === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto w-full z-20 mb-5 sm:mb-8 animate-fadeIn">
      {/* Sleek, Low-Profile Quick Services Strip */}
      <div className="rounded-2xl sm:rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-md shadow-purple-950/5 py-1.5 px-2.5 sm:px-3 flex items-center justify-between gap-2 sm:gap-3 transition-all">
        
        {/* Left: Quick Label Badge */}
        <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-slate-200/80 dark:border-slate-800">
          <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-accent-lux text-white flex items-center justify-center shadow-xs">
            <Zap className="w-3.5 h-3.5 fill-white" />
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 hidden sm:inline whitespace-nowrap">
            Quick Services
          </span>
        </div>

        {/* Center: 5-6 Compact Package Chips (Horizontal Scroll on Mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar flex-1 py-0.5">
          {packages.slice(0, 6).map((item, idx) => {
            const isLoading = navigatingPkgId === item.id;
            return (
              <button
                key={`${item.id}-${idx}`}
                type="button"
                disabled={isLoading}
                onClick={() => handleCardClick(item)}
                className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl sm:rounded-full bg-slate-100/80 hover:bg-purple-50 dark:bg-slate-800/60 dark:hover:bg-purple-950/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-accent-lux/60 transition-all duration-200 shrink-0 group cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
                  isLoading ? "opacity-60 pointer-events-none" : ""
                }`}
                title={`View ${item.name} (₹${item.price})`}
              >
                {/* Micro Thumbnail with initials fallback */}
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-full overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700 relative">
                  {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center bg-accent-lux text-white">
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  ) : (
                    <StripThumbnail imageUrl={item.imageUrl} name={item.name} pkgId={item.id} />
                  )}
                </div>

                {/* Package Name */}
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-accent-lux transition-colors whitespace-nowrap max-w-[95px] sm:max-w-[125px] truncate">
                  {item.name}
                </span>

                {/* Price */}
                <span className="text-[11px] font-black text-accent-lux shrink-0">
                  ₹{item.price}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Explore All Categories Button (Scrolls Down) */}
        <button
          type="button"
          id="quick-explore-all-btn"
          onClick={handleScrollToCategories}
          className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl sm:rounded-full text-xs font-bold bg-accent-lux text-white hover:bg-accent-lux/90 dark:bg-accent-lux shadow-xs shrink-0 cursor-pointer whitespace-nowrap transition-all duration-200 group"
        >
          <span className="hidden xs:inline">Explore All</span>
          <span className="xs:hidden">All</span>
          <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
        </button>

      </div>
    </div>
  );
}
