"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { formatImageUrl, getNameInitials } from "@/utils/image";
import { startTopLoader } from "@/utils/loader";
import {
  fetchCustomerCategoriesApi,
  CategoryItem,
} from "@/services/categoryApi";

interface UnifiedCategory {
  _id?: string;
  id: string;
  name: string;
  iconUrl?: string;
}

function CategoryImageDisplay({
  iconUrl,
  name,
}: {
  iconUrl?: string;
  name: string;
  id: string;
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [iconUrl]);

  const formattedUrl = formatImageUrl(iconUrl);

  if (formattedUrl && !imgError) {
    return (
      <img
        src={formattedUrl}
        alt={name || "Category Icon"}
        className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
    );
  }

  const initials = getNameInitials(name, "C");

  return (
    <span className="font-black text-xs sm:text-sm uppercase text-accent-lux select-none tracking-tight">
      {initials}
    </span>
  );
}

export default function Categories() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [categoriesList, setCategoriesList] = useState<UnifiedCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [navigatingCatId, setNavigatingCatId] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      setIsLoadingCategories(true);
      const res = await fetchCustomerCategoriesApi();
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const fetched: UnifiedCategory[] = res.data.map((cat: CategoryItem) => ({
          _id: cat._id,
          id: cat._id,
          name: cat.categoryName,
          iconUrl: cat.iconUrl,
        }));
        setCategoriesList(fetched);
      } else {
        setCategoriesList([]);
      }
      setIsLoadingCategories(false);
    }

    loadCategories();
  }, []);

  // Smooth scroll directly to categories when hash is #categories
  useEffect(() => {
    const checkHashAndScroll = () => {
      if (typeof window !== "undefined" && window.location.hash === "#categories") {
        const el = document.getElementById("categories");
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: "smooth" });
          }, 80);
        }
      }
    };

    checkHashAndScroll();
    window.addEventListener("hashchange", checkHashAndScroll);
    return () => window.removeEventListener("hashchange", checkHashAndScroll);
  }, [isLoadingCategories]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 15 } }
  };

  const handleCategoryClick = (cat: UnifiedCategory) => {
    const categorySlug = cat.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    const catId = cat._id || cat.id;
    setNavigatingCatId(catId);
    startTopLoader();
    router.push(`/services/${categorySlug}?categoryId=${encodeURIComponent(catId)}`);
  };

  const visibleCategories = isExpanded ? categoriesList : categoriesList.slice(0, 12);

  return (
    <section id="categories" className="scroll-mt-24 py-16 px-6 font-sans relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary-lux dark:text-white mt-1">
              Explore Services
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-sm">
              Browse through our verified service categories in Varanasi.
            </p>
          </div>
          <Link
            href="/search?view=categories"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-lux hover:underline shrink-0 cursor-pointer"
          >
            View all categories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      {isLoadingCategories ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 animate-pulse"
            >
              <div className="w-11 h-11 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 bg-slate-200/80 dark:bg-slate-800/80 rounded w-4/5" />
                <div className="h-2 bg-slate-200/50 dark:bg-slate-800/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : categoriesList.length === 0 ? (
        <div className="glass-panel p-10 text-center text-slate-500 text-xs rounded-2xl">
          No categories found.
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4"
        >
          <AnimatePresence mode="popLayout">
            {visibleCategories.map((cat) => {
              const catId = cat._id || cat.id;
              const isNavigating = navigatingCatId === catId;
              return (
                <motion.div
                  key={catId}
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  layout
                  onClick={() => handleCategoryClick(cat)}
                  className={`bg-white dark:bg-slate-900/80 border rounded-2xl p-3.5 flex items-center gap-3 transition-all duration-300 group cursor-pointer relative select-none overflow-hidden ${
                    isNavigating
                      ? "border-accent-lux ring-2 ring-accent-lux/40 shadow-lg scale-[1.02] bg-purple-50/40 dark:bg-purple-950/40 animate-pulse"
                      : "border-slate-200/80 dark:border-slate-800 hover:border-accent-lux/50 dark:hover:border-accent-lux/50 hover:shadow-md"
                  }`}
                >
                  {/* Subtle Shimmer highlight on click */}
                  {isNavigating && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-300/30 dark:via-purple-500/20 to-transparent animate-shimmer pointer-events-none" />
                  )}

                  {/* Small Icon Badge */}
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center p-2 shrink-0 transition-all text-accent-lux ${
                    isNavigating
                      ? "bg-purple-100 dark:bg-purple-900/60 border-accent-lux scale-105"
                      : "bg-purple-50 dark:bg-purple-950/50 border-purple-100/60 dark:border-purple-900/40 group-hover:scale-105 group-hover:bg-purple-100/80"
                  }`}>
                    <CategoryImageDisplay iconUrl={cat.iconUrl} name={cat.name} id={cat.id} />
                  </div>

                  {/* Title & Micro Arrow */}
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-bold text-xs sm:text-[13px] leading-tight truncate transition-colors ${
                      isNavigating ? "text-accent-lux font-black" : "text-slate-800 dark:text-slate-100 group-hover:text-accent-lux"
                    }`}>
                      {cat.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                      <span>{isNavigating ? "Loading..." : "Explore"}</span>
                      <ArrowRight className={`w-3 h-3 transition-transform ${
                        isNavigating ? "translate-x-1 text-accent-lux" : "group-hover:translate-x-0.5 group-hover:text-accent-lux"
                      }`} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* View More / View Less Toggle Button */}
      {!isLoadingCategories && categoriesList.length > 12 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-6 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs font-black tracking-wide text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            {isExpanded ? (
              <>
                Show Less <ChevronUp className="w-3.5 h-3.5 text-accent-lux" />
              </>
            ) : (
              <>
                More Options / Show All Categories ({categoriesList.length}) <ChevronDown className="w-3.5 h-3.5 text-accent-lux" />
              </>
            )}
          </button>
        </div>
      )}
      </div>
    </section>
  );
}
