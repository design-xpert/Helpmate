"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { formatImageUrl, getNameInitials } from "@/utils/image";
import { startTopLoader } from "@/utils/loader";
import { fetchQuickServiceSectionsApi } from "@/services/quickServiceSectionsApi";

export interface SimpleServiceCard {
  id: string;
  title: string;
  image: string;
  targetUrl: string;
}

export interface CategorySectionData {
  id: string;
  badge?: string;
  title: string;
  subtitle?: string;
  categorySlug: string;
  seeAllUrl: string;
  services: SimpleServiceCard[];
}

// Service Card Image: displays the uploaded API image if available,
// or gracefully falls back to HelpMate luxury brand initial letters when no image exists or loading fails
function ServiceImageCard({ image, title }: { image: string; title: string }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [image]);

  const initials = getNameInitials(title, "S");
  const resolvedUrl = image ? (image.startsWith("/") ? image : formatImageUrl(image)) : "";

  if (!imgError && resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt={title}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        onError={() => setImgError(true)}
      />
    );
  }

  // Graceful fallback with HelpMate brand gradient and letter initials
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#48073d] via-[#610c52] to-[#801C6E] text-white select-none">
      <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white font-black text-xl flex items-center justify-center shadow-md">
        {initials}
      </div>
    </div>
  );
}

// Category Slider Row matching In The Spotlight's smooth sliding UX & navigation controls
function SectionRow({ section }: { section: CategorySectionData }) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [section.services]);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 390;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!section.services || section.services.length === 0) {
    return null;
  }

  return (
    <div className="py-7 sm:py-9 border-b border-[#48073d]/8 dark:border-white/5 last:border-0">
      {/* Category Row Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary-lux dark:text-white mt-1">
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-sm">
              {section.subtitle}
            </p>
          )}
        </div>

        <Link
          href={section.seeAllUrl}
          onClick={() => startTopLoader()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-lux hover:underline shrink-0 cursor-pointer"
        >
          View all {section.title.toLowerCase()} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Cards Slider Track: Image + Title ONLY */}
      <div className="relative group/carousel">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2"
        >
          {section.services.map((service, sIdx) => (
            <div
              key={`${service.id}-${sIdx}`}
              onClick={() => {
                startTopLoader();
                router.push(service.targetUrl);
              }}
              className="group w-[155px] sm:w-[195px] md:w-[225px] shrink-0 cursor-pointer select-none text-left snap-start"
            >
              {/* Image Container with HelpMate Border Hover & Glow */}
              <div className="w-full aspect-[4/3] sm:aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-xs border border-slate-200/70 dark:border-slate-800 group-hover:border-[#801C6E]/50 group-hover:shadow-[0_12px_28px_-6px_rgba(72,7,61,0.20)] transition-all duration-300 relative">
                <ServiceImageCard
                  image={service.image}
                  title={service.title}
                />
              </div>

              {/* Title Below - Strictly Nothing Else */}
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-2 sm:mt-2.5 line-clamp-2 leading-snug group-hover:text-[#801C6E] dark:group-hover:text-pink-300 transition-colors px-0.5">
                {service.title}
              </h4>
            </div>
          ))}
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
  );
}

export default function CategoryServiceSections() {
  const [sections, setSections] = useState<CategorySectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load live quick service sections strictly from GET /api/quick-service-sections
  useEffect(() => {
    let isCancelled = false;

    async function loadSectionsData() {
      try {
        const res = await fetchQuickServiceSectionsApi();

        if (
          !isCancelled &&
          res.success &&
          Array.isArray(res.data) &&
          res.data.length > 0
        ) {
          const dynamicSections: CategorySectionData[] = res.data
            .map((secItem) => {
              const cat = secItem.category;
              if (!cat) return null;

              const catSlug =
                cat.slug ||
                cat.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

              // Display up to 10 packages for this category section
              const packagesList = (secItem.packages || []).slice(0, 10);

              const services: SimpleServiceCard[] = packagesList.map((pkg) => {
                const qp = new URLSearchParams();
                if (cat._id) qp.set("categoryId", cat._id);
                if (pkg.serviceAction?.subCategoryId) {
                  qp.set("sub", pkg.serviceAction.subCategoryId);
                }
                if (pkg.serviceAction?._id) {
                  qp.set("act", pkg.serviceAction._id);
                }
                qp.set("item", pkg._id);

                return {
                  id: pkg._id,
                  title: pkg.packageName,
                  image: pkg.imageUrl || (pkg._id ? `/api/media/package/${pkg._id}/image` : ""),
                  targetUrl: `/services/${catSlug}?${qp.toString()}`,
                };
              });

              return {
                id: cat._id,
                title: cat.categoryName,
                categorySlug: catSlug,
                seeAllUrl: `/services/${catSlug}?categoryId=${cat._id}`,
                services,
              };
            })
            .filter((sec): sec is CategorySectionData => sec !== null && sec.services.length > 0);

          setSections(dynamicSections);
        } else if (!isCancelled) {
          setSections([]);
        }
      } catch (err) {
        console.error("Error loading quick service sections:", err);
        if (!isCancelled) setSections([]);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadSectionsData();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (!isLoading && sections.length === 0) {
    return null;
  }

  return (
    <section id="category-services" className="py-6 sm:py-10 px-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-2">
        {isLoading ? (
          <div className="py-7 sm:py-9">
            <div className="w-56 h-8 bg-slate-200/70 dark:bg-slate-800/70 rounded-lg animate-pulse mb-8" />
            <div className="flex gap-4 sm:gap-6 overflow-x-hidden">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="w-[155px] sm:w-[195px] md:w-[225px] shrink-0"
                >
                  <div className="w-full aspect-square rounded-2xl sm:rounded-3xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse border border-slate-200/20 mb-3" />
                  <div className="w-3/4 h-4 bg-slate-200/70 dark:bg-slate-800/70 rounded-md animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          sections.map((section, secIdx) => (
            <SectionRow key={`${section.id}-${secIdx}`} section={section} />
          ))
        )}
      </div>
    </section>
  );
}
