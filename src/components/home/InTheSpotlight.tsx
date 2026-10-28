"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { formatImageUrl } from "@/utils/image";
import { fetchWebsiteSpotlightApi } from "@/services/spotlightApi";

interface SpotlightBanner {
  id: string;
  badge?: string;
  badgeBg?: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaTheme: "white" | "accent";
  overlayGradient: string;
  image: string;
  targetUrl: string;
  price?: number;
  originalPrice?: number;
  discountPercentage?: number;
}

function BannerImage({
  src,
  alt,
  onImageError,
}: {
  src: string;
  alt: string;
  onImageError?: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const resolvedSrc = formatImageUrl(src);

  if (!imgError && resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => {
          setImgError(true);
          onImageError?.();
        }}
        className="w-full h-full object-cover object-right group-hover:scale-105 transition-transform duration-700 ease-out"
      />
    );
  }

  return null;
}

export default function InTheSpotlight() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [banners, setBanners] = useState<SpotlightBanner[]>([]);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live spotlight items exclusively from backend GET /api/website/spotlight
  useEffect(() => {
    let isCancelled = false;
    async function loadSpotlightData() {
      try {
        const res = await fetchWebsiteSpotlightApi();
        if (res.success && Array.isArray(res.data) && res.data.length > 0 && !isCancelled) {
          const gradientPresets = [
            "linear-gradient(90deg, #48073d 0%, #48073d 44%, rgba(72, 7, 61, 0.92) 62%, rgba(72, 7, 61, 0) 100%)",
            "linear-gradient(90deg, #801c6e 0%, #801c6e 44%, rgba(128, 28, 110, 0.92) 62%, rgba(128, 28, 110, 0) 100%)",
            "linear-gradient(90deg, #3d0532 0%, #3d0532 44%, rgba(61, 5, 50, 0.92) 62%, rgba(61, 5, 50, 0) 100%)",
            "linear-gradient(90deg, #590d4b 0%, #590d4b 44%, rgba(89, 13, 75, 0.92) 62%, rgba(89, 13, 75, 0) 100%)",
            "linear-gradient(90deg, #2b0323 0%, #2b0323 44%, rgba(43, 3, 35, 0.92) 62%, rgba(43, 3, 35, 0) 100%)",
          ];

          const dynamicBanners: SpotlightBanner[] = res.data.map((item, idx) => {
            const catSlug = (item.category?.name || "services")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-");

            const qp = new URLSearchParams();
            if (item.category?.id) qp.set("categoryId", item.category.id);
            if (item.subCategory?.id) qp.set("sub", item.subCategory.id);
            if (item.serviceAction?.id) qp.set("act", item.serviceAction.id);
            qp.set("item", item.packageId);
            qp.set("view", "details");

            // Clean badge formatting
            let badgeText = item.badge || "Featured";
            const lowerBadge = badgeText.toLowerCase();
            if (lowerBadge === "best-seller" || lowerBadge === "bestseller") badgeText = "Bestseller";
            else if (lowerBadge === "top-rated") badgeText = "Top Rated";
            else if (lowerBadge === "new-launch") badgeText = "New Launch";
            else if (lowerBadge === "summer-special") badgeText = "Summer Special";
            else badgeText = badgeText.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

            // Clean subtitle formatting
            let sub = item.subtitle?.trim();
            if (!sub) {
              sub = `Starting ₹${item.price}`;
              if (item.discountPercentage && item.discountPercentage > 0) {
                sub += ` • ${item.discountPercentage}% OFF`;
              }
            }

            return {
              id: item.packageId,
              badge: badgeText,
              badgeBg: idx % 2 === 0 ? "var(--accent, #801C6E)" : "var(--primary, #48073d)",
              title: item.packageName,
              subtitle: sub,
              ctaText: "Book now",
              ctaTheme: "white",
              overlayGradient: gradientPresets[idx % gradientPresets.length],
              image: item.imageUrl || item.thumbnailUrl || "",
              targetUrl: `/services/${catSlug}?${qp.toString()}`,
              price: item.price,
              originalPrice: item.originalPrice,
              discountPercentage: item.discountPercentage,
            };
          });

          setBanners(dynamicBanners);
        } else if (!isCancelled) {
          setBanners([]);
        }
      } catch (err) {
        console.error("Error fetching spotlight banners:", err);
        if (!isCancelled) setBanners([]);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadSpotlightData();
    return () => {
      isCancelled = true;
    };
  }, []);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const visibleBanners = banners.filter(
    (b) => Boolean(b.image && b.image.trim()) && !failedImages.has(b.id)
  );

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [visibleBanners]);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 390;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleCardClick = (targetUrl: string) => {
    router.push(targetUrl);
  };

  if (!isLoading && visibleBanners.length === 0) {
    return null;
  }

  return (
    <section id="spotlight" className="py-8 sm:py-12 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading - styled like Trending */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 sm:mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary-lux dark:text-white mt-1">
              In the Spotlight
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-sm">
              Flagship curated experiences and season-special home solutions.
            </p>
          </div>
          <Link
            href="/search?view=spotlight"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-lux hover:underline shrink-0 cursor-pointer"
          >
            View all spotlight <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Carousel Container */}
        <div className="relative group/carousel">
          {/* Scrollable Track */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1"
          >
            {isLoading ? (
              [1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="w-[310px] sm:w-[370px] md:w-[410px] h-[190px] sm:h-[215px] shrink-0 rounded-2xl sm:rounded-3xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse border border-slate-200/20"
                />
              ))
            ) : (
              visibleBanners.map((banner, bIdx) => (
                <div
                  key={`${banner.id}-${bIdx}`}
                  onClick={() => handleCardClick(banner.targetUrl)}
                  className="group relative w-[310px] sm:w-[370px] md:w-[410px] h-[190px] sm:h-[215px] shrink-0 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer select-none shadow-md hover:shadow-xl transition-all duration-300 border border-[#48073d]/10 dark:border-white/10 snap-start"
                >
                  {/* Background Image Layer */}
                  <div className="absolute inset-0 z-0">
                    <BannerImage
                      src={banner.image}
                      alt={banner.title.replace("\n", " ")}
                      onImageError={() => {
                        setFailedImages((prev) => new Set(prev).add(banner.id));
                      }}
                    />
                  </div>

                  {/* HelpMate Project Palette Gradient Overlay */}
                  <div
                    className="absolute inset-0 z-1 pointer-events-none"
                    style={{ background: banner.overlayGradient }}
                  />

                  {/* Content Overlay */}
                  <div className="relative z-10 h-full p-5 sm:p-6 flex flex-col justify-between max-w-[64%] sm:max-w-[60%] text-white">
                    {/* Header: Badge + Title + Subtitle */}
                    <div>
                      {banner.badge && (
                        <div className="mb-2">
                          <span
                            className="inline-block text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-md tracking-wide shadow-xs border border-white/15"
                            style={{ backgroundColor: banner.badgeBg }}
                          >
                            {banner.badge}
                          </span>
                        </div>
                      )}

                      <h3 className="font-extrabold text-lg sm:text-xl md:text-[22px] leading-tight whitespace-pre-line tracking-tight text-white drop-shadow-xs">
                        {banner.title}
                      </h3>

                      <p className="text-xs sm:text-[13px] font-medium mt-1 leading-snug text-pink-100/90">
                        {banner.subtitle}
                      </p>
                    </div>

                    {/* Bottom CTA Button */}
                    <div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(banner.targetUrl);
                        }}
                        className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-extrabold tracking-tight transition-all active:scale-95 shadow-md cursor-pointer bg-white text-primary-lux hover:bg-pink-50"
                      >
                        {banner.ctaText}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Left Arrow Navigation Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScroll("left")}
              aria-label="Scroll left"
              className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white dark:bg-[#2b0425] text-primary-lux dark:text-white rounded-full shadow-xl border border-[#48073d]/15 dark:border-white/10 items-center justify-center hover:scale-110 hover:border-accent-lux hover:text-accent-lux active:scale-95 transition-all z-20 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Right Arrow Navigation Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScroll("right")}
              aria-label="Scroll right"
              className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white dark:bg-[#2b0425] text-primary-lux dark:text-white rounded-full shadow-xl border border-[#48073d]/15 dark:border-white/10 items-center justify-center hover:scale-110 hover:border-accent-lux hover:text-accent-lux active:scale-95 transition-all z-20 cursor-pointer"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
