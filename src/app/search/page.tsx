"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Mic,
  Star,
  Clock,
  Heart,
  SlidersHorizontal,
  X,
  TrendingUp,
  ArrowRight,
  Volume2,
  Package,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Tag,
  ChevronRight,
  Layers,
  Flame
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { formatImageUrl, getNameInitials } from "@/utils/image";
import { formatDuration } from "@/utils/dateTime";
import { useStore } from "@/store/useStore";
import {
  fetchCustomerCategoriesApi,
  fetchCustomerSubCategoriesApi,
  CategoryItem,
  SubCategoryItem,
} from "@/services/categoryApi";
import {
  fetchCustomerPackagesApi,
  CustomerPackageItem,
} from "@/services/packageApi";
import {
  fetchCustomerTrendingApi,
  TrendingPackageItem,
} from "@/services/trendingApi";
import {
  fetchWebsiteSpotlightApi,
  SpotlightPackageItem,
} from "@/services/spotlightApi";
import { startTopLoader, stopTopLoader } from "@/utils/loader";

// Helper for matching category by ObjectId, exact name, or partial name
function isCategoryMatch(catId: string, catName: string, selected: string) {
  if (!selected) return false;
  if (selected === catId) return true;
  const s = selected.toLowerCase().trim();
  const n = catName.toLowerCase().trim();
  return s === n || n.includes(s) || s.includes(n);
}

// Category Image Display Component with Initials Fallback (2 letters if 2+ words)
function CategoryImageDisplay({
  iconUrl,
  name,
}: {
  iconUrl?: string;
  name: string;
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [iconUrl]);

  const formattedUrl = formatImageUrl(iconUrl);
  const initials = getNameInitials(name, "C");

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

  return (
    <span className="font-black text-xs sm:text-sm uppercase text-accent-lux select-none tracking-tight">
      {initials}
    </span>
  );
}

// Package Image Display Component with Initials Fallback (2 letters if 2+ words)
function PackageImageDisplay({
  imageUrl,
  name,
  className = "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500",
}: {
  imageUrl?: string;
  name: string;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  const formattedUrl = formatImageUrl(imageUrl);
  const initials = getNameInitials(name, "P");

  if (formattedUrl && !imgError) {
    return (
      <img
        src={formattedUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className={className}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#4a0e4e] via-slate-900 to-slate-950 text-white select-none relative">
      <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform tracking-tight">
        {initials}
      </div>
      <span className="text-xs font-bold text-slate-200 mt-2 text-center line-clamp-1 max-w-[85%]">
        {name}
      </span>
    </div>
  );
}

// Package Thumbnail for Search Suggestions with Initials Fallback
function PackageThumbnailDisplay({
  imageUrl,
  name,
}: {
  imageUrl?: string;
  name: string;
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  const formattedUrl = formatImageUrl(imageUrl);
  const initials = getNameInitials(name, "P");

  if (formattedUrl && !imgError) {
    return (
      <img
        src={formattedUrl}
        alt={name}
        className="w-8 h-8 rounded-lg object-cover"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-accent-lux font-black text-[11px] flex items-center justify-center uppercase select-none border border-purple-200/50 dark:border-purple-800/50 shrink-0 tracking-tight">
      {initials}
    </div>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { wishlist, toggleWishlist, addNotification, addToCart, cart, token, isLoggedIn } = useStore();

  // View Mode: "categories" | "trending" | "packages" | "spotlight"
  const [viewMode, setViewMode] = useState<"categories" | "trending" | "packages" | "spotlight">(() => {
    const view = searchParams.get("view");
    const type = searchParams.get("type");
    const cat = searchParams.get("categoryId") || searchParams.get("category");
    const q = searchParams.get("q");
    if (type === "trending" || view === "trending") return "trending";
    if (type === "spotlight" || view === "spotlight") return "spotlight";
    if (view === "packages" || cat || q) return "packages";
    return "categories";
  });

  // Dynamic API Categories & Subcategories State
  const [dynamicCategories, setDynamicCategories] = useState<CategoryItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>("");

  const [activeSubCategories, setActiveSubCategories] = useState<SubCategoryItem[]>([]);
  const [selectedSubCat, setSelectedSubCat] = useState<string>("");

  // Search & Filter queries for Packages view
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCat, setSelectedCat] = useState(
    searchParams.get("categoryId") || searchParams.get("category") || ""
  );
  const [minRating, setMinRating] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [isBudgetApplied, setIsBudgetApplied] = useState<boolean>(false);
  const [searchSuggestions, setSearchSuggestions] = useState<CustomerPackageItem[]>([]);

  // Trending Packages State (Only fetched when viewMode === "trending")
  const [trendingPackages, setTrendingPackages] = useState<CustomerPackageItem[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState<boolean>(false);

  // Spotlight Packages State (Only fetched when viewMode === "spotlight")
  const [spotlightPackages, setSpotlightPackages] = useState<CustomerPackageItem[]>([]);
  const [isLoadingSpotlight, setIsLoadingSpotlight] = useState<boolean>(false);

  // Sync viewMode & filters from URL searchParams
  useEffect(() => {
    const view = searchParams.get("view");
    const type = searchParams.get("type");
    const q = searchParams.get("q");
    const cat = searchParams.get("categoryId") || searchParams.get("category");
    const sub = searchParams.get("subCategoryId") || searchParams.get("sub");
    const trending = searchParams.get("trending");

    setQuery(q || "");
    if (cat) setSelectedCat(cat);
    if (sub) setSelectedSubCat(sub);

    if (type === "trending" || view === "trending" || trending === "true") {
      setViewMode("trending");
    } else if (type === "spotlight" || view === "spotlight") {
      setViewMode("spotlight");
    } else if (view === "packages" || q || cat || sub) {
      setViewMode("packages");
    } else if (view === "categories" || type === "categories") {
      setViewMode("categories");
    } else {
      // Default view mode when navigating via View All Services
      setViewMode("categories");
    }
  }, [searchParams]);

  // Normalize selectedCat to cat._id if passed by name/slug in URL
  useEffect(() => {
    if (selectedCat && dynamicCategories.length > 0) {
      const match = dynamicCategories.find((c) => isCategoryMatch(c._id, c.categoryName, selectedCat));
      if (match && selectedCat !== match._id) {
        setSelectedCat(match._id);
      }
    }
  }, [dynamicCategories, selectedCat]);
  useEffect(() => {
    async function loadCategories() {
      setIsLoadingCategories(true);
      startTopLoader();
      const res = await fetchCustomerCategoriesApi();
      if (res.success && res.data) {
        setDynamicCategories(res.data);
      } else {
        setDynamicCategories([]);
      }
      setIsLoadingCategories(false);
      stopTopLoader();
    }
    loadCategories();
  }, []);

  // Fetch Trending Packages from GET /api/customer/trending when viewMode === "trending"
  useEffect(() => {
    let isMounted = true;
    async function loadTrending() {
      if (viewMode !== "trending") return;
      setIsLoadingTrending(true);
      startTopLoader();
      try {
        const res = await fetchCustomerTrendingApi(token);
        if (isMounted && res.success && res.data && Array.isArray(res.data)) {
          const mapped: CustomerPackageItem[] = res.data.map((item) => ({
            package: {
              id: item.packageId,
              name: item.packageName,
              subtitle: item.subtitle,
              description: item.description,
              price: item.price,
              originalPrice: item.originalPrice,
              discountPercentage: item.discountPercentage,
              duration: item.duration || 60,
              imageUrl: item.imageUrl || item.thumbnailUrl,
              isBookmarked: item.isBookmarked,
            },
            category: item.category,
            subCategory: item.subCategory,
            serviceAction: item.serviceAction,
            addons: [],
          }));
          setTrendingPackages(mapped);
        } else if (isMounted) {
          setTrendingPackages([]);
        }
      } catch (err) {
        console.error("Error loading trending packages:", err);
      } finally {
        if (isMounted) {
          setIsLoadingTrending(false);
          stopTopLoader();
        }
      }
    }

    loadTrending();
    return () => {
      isMounted = false;
    };
  }, [viewMode, token]);

  // Fetch Spotlight Packages from GET /api/website/spotlight when viewMode === "spotlight"
  useEffect(() => {
    let isMounted = true;
    async function loadSpotlight() {
      if (viewMode !== "spotlight") return;
      setIsLoadingSpotlight(true);
      startTopLoader();
      try {
        const res = await fetchWebsiteSpotlightApi(token);
        if (isMounted && res.success && res.data && Array.isArray(res.data)) {
          const mapped: CustomerPackageItem[] = res.data.map((item) => ({
            package: {
              id: item.packageId,
              name: item.packageName,
              subtitle: item.subtitle,
              description: item.description,
              price: item.price,
              originalPrice: item.originalPrice,
              discountPercentage: item.discountPercentage,
              duration: item.duration || 60,
              imageUrl: item.imageUrl || item.thumbnailUrl,
              includeInPackage: item.includeInPackage || [],
              excludeFromPackage: item.excludeFromPackage || [],
            },
            category: item.category,
            subCategory: item.subCategory,
            serviceAction: item.serviceAction,
            addons: [],
          }));
          setSpotlightPackages(mapped);
        } else if (isMounted) {
          setSpotlightPackages([]);
        }
      } catch (err) {
        console.error("Error loading spotlight packages:", err);
      } finally {
        if (isMounted) {
          setIsLoadingSpotlight(false);
          stopTopLoader();
        }
      }
    }

    loadSpotlight();
    return () => {
      isMounted = false;
    };
  }, [viewMode, token]);

  // Dynamic Packages State from Backend API for All Packages view
  const [apiPackages, setApiPackages] = useState<CustomerPackageItem[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Fetch subcategories when a category is selected in Packages view
  useEffect(() => {
    async function loadSubCategories() {
      if (!selectedCat) {
        setActiveSubCategories([]);
        setSelectedSubCat("");
        return;
      }

      const foundCat = dynamicCategories.find(
        (c) => isCategoryMatch(c._id, c.categoryName, selectedCat)
      );

      if (foundCat) {
        startTopLoader();
        const res = await fetchCustomerSubCategoriesApi(foundCat._id);
        if (res.success && res.data) {
          setActiveSubCategories(res.data);
        }
        stopTopLoader();
      }
    }

    loadSubCategories();
  }, [selectedCat, dynamicCategories]);

  // Fetch packages from GET /api/customer/packages when viewMode === "packages"
  useEffect(() => {
    let isMounted = true;
    async function loadPackages() {
      if (viewMode !== "packages") return;
      setIsLoadingPackages(true);
      startTopLoader();
      try {
        const foundCat = selectedCat
          ? dynamicCategories.find(
            (c) => isCategoryMatch(c._id, c.categoryName, selectedCat)
          )
          : undefined;

        const foundSubCat = selectedSubCat
          ? activeSubCategories.find(
            (sc) => sc._id === selectedSubCat || sc.name.toLowerCase() === selectedSubCat.toLowerCase()
          )
          : undefined;

        const categoryIdParam = selectedCat ? (foundCat?._id || (selectedCat.length === 24 ? selectedCat : undefined)) : undefined;
        const subCategoryIdParam = selectedSubCat ? (foundSubCat?._id || (selectedSubCat.length === 24 ? selectedSubCat : undefined)) : undefined;

        const res = await fetchCustomerPackagesApi({
          categoryId: categoryIdParam,
          subCategoryId: subCategoryIdParam,
          search: query.trim() || undefined,
          maxBudget: isBudgetApplied ? maxPrice : undefined,
          page: currentPage,
          limit: 12
        });

        if (isMounted && res.success) {
          setApiPackages(res.data || []);
          if (res.pagination) {
            setTotalPages(res.pagination.totalPages);
            setTotalItems(res.pagination.total);
          } else {
            setTotalPages(1);
            setTotalItems((res.data || []).length);
          }
        }
      } catch (err) {
        console.error("Error loading packages from API:", err);
        if (isMounted) {
          setApiPackages([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPackages(false);
          stopTopLoader();
        }
      }
    }

    loadPackages();
    return () => {
      isMounted = false;
    };
  }, [viewMode, query, selectedCat, selectedSubCat, maxPrice, isBudgetApplied, currentPage, dynamicCategories, activeSubCategories]);

  // Ref for outside click detection & live search suggestions
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }
    const targetPool = viewMode === "trending" ? trendingPackages : viewMode === "spotlight" ? spotlightPackages : apiPackages;
    const filtered = targetPool.filter((item) =>
      item.package.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category?.name.toLowerCase().includes(query.toLowerCase()) ||
      item.subCategory?.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchSuggestions(filtered.slice(0, 4));
  }, [query, apiPackages, trendingPackages, spotlightPackages, viewMode]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setSearchSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // UI state
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceText, setVoiceText] = useState("Listening for your request...");

  // Voice recognition simulation
  const startVoiceSearch = () => {
    setVoiceActive(true);
    setVoiceText("Listening for your service request...");

    setTimeout(() => {
      setVoiceText('Recognizing: "Split AC breakdown repair"...');
    }, 1500);

    setTimeout(() => {
      setVoiceText('Searching live catalog...');
    }, 2800);

    setTimeout(() => {
      setVoiceActive(false);
      setQuery("AC");
      setViewMode("packages");
      router.push(`/search?q=${encodeURIComponent("AC")}`);
      addNotification("Voice Request Resolved", 'Filtered results for "AC"', "info");
    }, 3800);
  };

  const handleWishlistToggle = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn && !token) {
      addNotification("Login Required", "Please log in to save or bookmark packages.", "warning");
      return;
    }
    toggleWishlist(id);
    const isSaved = wishlist.includes(id);
    addNotification(
      isSaved ? "Removed from Saved" : "Saved Package",
      isSaved ? `${name} removed.` : `${name} saved.`,
      "info"
    );
  };

  const handleAddToCart = (e: React.MouseEvent, item: CustomerPackageItem) => {
    e.preventDefault();
    e.stopPropagation();
    const pkg = item.package;
    const isAlreadyInCart = cart.some(
      (c) => String(c.id) === String(pkg.id) || String(c.itemId) === String(pkg.id)
    );
    if (isAlreadyInCart) return;

    addToCart({
      id: pkg.id,
      itemId: pkg.id,
      category: item.category?.name || "Service",
      name: pkg.name,
      price: pkg.price,
      duration: pkg.duration || 60,
      selectedAddons: (item.addons || []).map((a) => ({
        addonId: a._id,
        addonName: a.addonName,
        price: a.price,
        quantity: 1,
        totalPrice: a.price,
      })),
    });
  };

  const handleBookNow = (e: React.MouseEvent, item: CustomerPackageItem) => {
    e.preventDefault();
    e.stopPropagation();
    const pkg = item.package;
    const isAlreadyInCart = cart.some(
      (c) => String(c.id) === String(pkg.id) || String(c.itemId) === String(pkg.id)
    );

    if (!isAlreadyInCart) {
      addToCart({
        id: pkg.id,
        itemId: pkg.id,
        category: item.category?.name || "Service",
        name: pkg.name,
        price: pkg.price,
        duration: pkg.duration || 60,
        selectedAddons: (item.addons || []).map((a) => ({
          addonId: a._id,
          addonName: a.addonName,
          price: a.price,
          quantity: 1,
          totalPrice: a.price,
        })),
      });
    }

    router.push("/booking");
  };

  // Category click handler -> Navigate directly to step-by-step wizard page
  const handleCategoryClick = (cat: CategoryItem) => {
    const categorySlug = cat.categoryName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    const catId = cat._id;
    router.push(`/services/${categorySlug}?categoryId=${encodeURIComponent(catId)}`);
  };

  // Filter categories by local search query in categories view
  const filteredCategories = dynamicCategories.filter((cat) =>
    cat.categoryName.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  // Filter trending packages locally if search query or category chip selected
  const displayTrendingPackages = trendingPackages.filter((item) => {
    const matchesQuery = !query.trim() ||
      item.package.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category?.name.toLowerCase().includes(query.toLowerCase()) ||
      item.subCategory?.name.toLowerCase().includes(query.toLowerCase());

    const matchesCategory = !selectedCat ||
      item.category?.id === selectedCat ||
      item.category?.name.toLowerCase().includes(selectedCat.toLowerCase());

    return matchesQuery && matchesCategory;
  });

  // Filter spotlight packages locally if search query or category chip selected
  const displaySpotlightPackages = spotlightPackages.filter((item) => {
    const matchesQuery = !query.trim() ||
      item.package.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category?.name.toLowerCase().includes(query.toLowerCase()) ||
      item.subCategory?.name.toLowerCase().includes(query.toLowerCase());

    const matchesCategory = !selectedCat ||
      item.category?.id === selectedCat ||
      item.category?.name.toLowerCase().includes(selectedCat.toLowerCase());

    return matchesQuery && matchesCategory;
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <>
      <Header />

      <main 
        style={{ paddingTop: "var(--header-total-height, 8.5rem)" }}
        className="flex-1 pt-32 sm:pt-36 font-sans bg-slate-50/50 dark:bg-background pb-16"
      >
        <div className="max-w-7xl mx-auto px-6">

          {/* Top View Switcher & Title */}
          <div className="pt-2 pb-6 border-b border-slate-200/70 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-accent-lux tracking-widest block mb-1">
                  {viewMode === "categories"
                    ? "Verified Categories"
                    : viewMode === "trending"
                    ? "Best Sellers Only"
                    : viewMode === "spotlight"
                    ? "Flagship Experiences"
                    : "Service Catalog"}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {viewMode === "categories"
                    ? "All Service Categories"
                    : viewMode === "trending"
                    ? "Trending Services"
                    : viewMode === "spotlight"
                    ? "In the Spotlight"
                    : "All Packages & Services"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {viewMode === "categories"
                    ? "Browse all service categories. Select any category to open step-by-step options."
                    : viewMode === "trending"
                    ? "Showing exclusively verified trending packages booked by Varanasi residents this week."
                    : viewMode === "spotlight"
                    ? "Flagship curated experiences and season-special home solutions handpicked for you."
                    : "Browse verified professional packages delivered by certified specialists in Varanasi."}
                </p>
              </div>

              {/* View Switcher Toggle Tabs */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-full border border-slate-200 dark:border-slate-800 self-start md:self-auto flex-wrap">
                <button
                  onClick={() => {
                    setViewMode("categories");
                    router.push("/search?view=categories");
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "categories"
                      ? "bg-[#48073d] text-white dark:bg-accent-lux shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-foreground"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> All Categories
                </button>

                <button
                  onClick={() => {
                    setViewMode("spotlight");
                    router.push("/search?view=spotlight");
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "spotlight"
                      ? "bg-[#48073d] text-white dark:bg-accent-lux shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-foreground"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Spotlight
                </button>

                <button
                  onClick={() => {
                    setViewMode("trending");
                    router.push("/search?type=trending");
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "trending"
                      ? "bg-[#48073d] text-white dark:bg-accent-lux shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-foreground"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Trending Services
                </button>

                <button
                  onClick={() => {
                    setViewMode("packages");
                    router.push("/search?view=packages");
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "packages"
                      ? "bg-[#48073d] text-white dark:bg-accent-lux shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-foreground"
                  }`}
                >
                  <Package className="w-3.5 h-3.5" /> All Packages
                </button>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: SHOW ONLY ALL CATEGORIES */}
          {viewMode === "categories" && (
            <div className="py-8 space-y-8">
              {/* Category Search Filter */}
              <div className="max-w-md relative">
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-3 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-accent-lux focus:ring-1 focus:ring-accent-lux text-foreground shadow-sm"
                />
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                {categorySearchQuery && (
                  <button
                    onClick={() => setCategorySearchQuery("")}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isLoadingCategories ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <div
                      key={n}
                      className="bg-white dark:bg-slate-900/60 border border-slate-200/10 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between h-60 animate-pulse"
                    >
                      <div className="bg-slate-200/70 dark:bg-slate-800/70 rounded-2xl aspect-[4/3] w-full" />
                      <div className="space-y-2 mt-4">
                        <div className="h-4 bg-slate-200/80 dark:bg-slate-800/80 rounded w-2/3" />
                        <div className="h-3 bg-slate-200/50 dark:bg-slate-800/50 rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="glass-panel p-12 text-center text-slate-500 text-xs rounded-3xl border border-slate-200/10 max-w-lg mx-auto">
                  <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="font-bold text-sm text-foreground">No matching categories found</p>
                  <p className="mt-1 text-slate-400">Try searching for another service category or clear your search.</p>
                  {categorySearchQuery && (
                    <button
                      onClick={() => setCategorySearchQuery("")}
                      className="mt-4 px-5 py-2 rounded-full bg-accent-lux text-white text-xs font-bold"
                    >
                      Clear Category Filter
                    </button>
                  )}
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredCategories.map((cat) => (
                      <motion.div
                        key={cat._id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="show"
                        exit="hidden"
                        layout
                        onClick={() => handleCategoryClick(cat)}
                        className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-accent-lux/50 dark:hover:border-accent-lux/50 rounded-2xl p-3.5 flex items-center gap-3 hover:shadow-md transition-all duration-300 group cursor-pointer relative select-none"
                      >
                        {/* Small Icon Badge */}
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100/60 dark:border-purple-900/40 flex items-center justify-center p-2 shrink-0 group-hover:scale-105 group-hover:bg-purple-100/80 transition-all text-accent-lux">
                          <CategoryImageDisplay iconUrl={cat.iconUrl} name={cat.categoryName} />
                        </div>

                        {/* Category Title & Micro Arrow */}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 leading-tight truncate group-hover:text-accent-lux transition-colors">
                            {cat.categoryName}
                          </h3>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                            <span>Explore</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:text-accent-lux transition-transform" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: SHOW ONLY TRENDING SERVICES */}
          {viewMode === "trending" && (
            <div className="py-8 space-y-6">

              {/* Header banner for Trending view */}
              <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-purple-900/10 to-slate-900/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                    <Flame className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-foreground">Top Booked Trending Packages</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Showing exclusively the trending services & packages on Helpmate</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-amber-500 text-white shrink-0 shadow-sm">
                  {displayTrendingPackages.length} Trending Items
                </span>
              </div>

              {/* Dynamic Category Filter Chips for Trending */}
              {dynamicCategories.length > 0 && (
                <div className="py-1 flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 mr-1">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> Filter Trending:
                  </span>
                  <button
                    onClick={() => setSelectedCat("")}
                    className={`text-[11px] font-semibold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                      selectedCat === ""
                        ? "bg-[#48073d] text-white dark:bg-accent-lux border-[#48073d] dark:border-accent-lux"
                        : "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-accent-lux"
                    }`}
                  >
                    All Trending
                  </button>
                  {dynamicCategories.map((cat) => {
                    const isActive = selectedCat === cat._id || selectedCat === cat.categoryName;
                    return (
                      <button
                        key={cat._id}
                        onClick={() => setSelectedCat(isActive ? "" : cat._id)}
                        className={`text-[11px] font-semibold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#48073d] text-white dark:bg-accent-lux border-[#48073d] dark:border-accent-lux"
                            : "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-accent-lux"
                        }`}
                      >
                        {cat.categoryName}
                      </button>
                    );
                  })}
                </div>
              )}

              {isLoadingTrending ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 space-y-4 border border-slate-100 dark:border-slate-800 animate-pulse">
                      <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : displayTrendingPackages.length === 0 ? (
                <div className="glass-panel p-12 text-center flex flex-col items-center max-w-lg mx-auto border border-slate-200/10 rounded-3xl">
                  <Flame className="w-12 h-12 text-amber-500 mb-4 opacity-70" />
                  <h3 className="font-bold text-base text-foreground">No Trending Packages Found</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                    No trending packages available for this specific category filter at the moment.
                  </p>
                  <button
                    onClick={() => setSelectedCat("")}
                    className="mt-6 px-6 py-2.5 rounded-full bg-accent-lux text-white text-xs font-bold shadow-md cursor-pointer hover:brightness-110"
                  >
                    View All Trending Packages
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayTrendingPackages.map((item, idx) => {
                    const pkg = item.package;
                    const isFavorited = wishlist.includes(pkg.id);
                    const isCartAdded = cart.some(c => c.id === pkg.id || c.itemId === pkg.id);
                    const categorySlug = item.category?.name
                      ? item.category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                      : (item.category?.id || pkg.id);

                    const catId = item.category?.id || (item.category as any)?._id;

                    return (
                      <motion.div
                        key={pkg.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.04 }}
                        onClick={() => router.push(`/services/${categorySlug}?${catId ? `categoryId=${encodeURIComponent(catId)}&` : ""}item=${pkg.id}`)}
                        className="group relative bg-white dark:bg-slate-900/80 rounded-2xl border border-amber-500/20 dark:border-slate-800 hover:border-amber-500/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1"
                      >
                        {/* Card Top Banner / Media */}
                        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <PackageImageDisplay imageUrl={pkg.imageUrl} name={pkg.name} />

                          {/* Overlay Gradients */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                          {/* Trending Fire Badge */}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-md flex items-center gap-1">
                              <Flame className="w-3 h-3 fill-white" /> Trending
                            </span>
                            {item.category?.name && (
                              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-850 dark:text-slate-100 backdrop-blur-md shadow-sm">
                                {item.category.name}
                              </span>
                            )}
                          </div>

                          {/* Wishlist / Bookmark Toggle */}
                          <button
                            onClick={(e) => handleWishlistToggle(e, pkg.id, pkg.name)}
                            className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-sm z-10 ${
                              isFavorited || pkg.isBookmarked
                                ? "bg-rose-500 text-white"
                                : "bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-rose-500 hover:bg-white"
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFavorited || pkg.isBookmarked ? "fill-white" : ""}`} />
                          </button>

                          {/* Discount Badge */}
                          {pkg.discountPercentage && pkg.discountPercentage > 0 ? (
                            <span className="absolute bottom-3 left-3 bg-emerald-500 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md tracking-wider">
                              {pkg.discountPercentage}% OFF
                            </span>
                          ) : null}

                          {/* Duration Badge */}
                          {pkg.duration && (
                            <span className="absolute bottom-3 right-3 text-[9px] font-bold text-slate-200 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1 font-sans">
                              <Clock className="w-3 h-3 text-amber-400" /> {formatDuration(pkg.duration)}
                            </span>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-accent-lux transition-colors leading-snug">
                              {pkg.name}
                            </h3>

                            {pkg.subtitle && (
                              <p className="text-[11px] font-semibold text-accent-lux mt-0.5 line-clamp-1">
                                {pkg.subtitle}
                              </p>
                            )}

                            {pkg.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                                {pkg.description}
                              </p>
                            )}
                          </div>

                          {/* Card Footer: Price & Actions */}
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            <div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-black text-slate-900 dark:text-white font-sans">
                                  ₹{pkg.price}
                                </span>
                                {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                                  <span className="text-[11px] font-normal text-slate-400 line-through font-sans">
                                    ₹{pkg.originalPrice}
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-amber-500 font-bold block">
                                ★ Top Seller This Week
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={(e) => handleAddToCart(e, item)}
                                disabled={isCartAdded}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer ${
                                  isCartAdded
                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 cursor-not-allowed opacity-90"
                                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                                }`}
                              >
                                {isCartAdded ? "Added ✓" : "+ Cart"}
                              </button>

                              <button
                                onClick={(e) => handleBookNow(e, item)}
                                className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold bg-accent-lux hover:bg-accent-lux/90 text-white active:scale-95 transition-all shadow-md flex items-center gap-1 cursor-pointer"
                              >
                                <span>Book Now</span> <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE: SHOW IN THE SPOTLIGHT */}
          {viewMode === "spotlight" && (
            <div className="py-8 space-y-6">

              {/* Header banner for Spotlight view */}
              <div className="glass-panel p-6 rounded-3xl border border-accent-lux/20 bg-gradient-to-r from-accent-lux/10 via-purple-900/10 to-slate-900/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-accent-lux/20 border border-accent-lux/30 flex items-center justify-center text-accent-lux shrink-0">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-foreground">In the Spotlight Packages</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Flagship curated experiences and season-special solutions</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-accent-lux text-white shrink-0 shadow-sm">
                  {displaySpotlightPackages.length} Spotlight Items
                </span>
              </div>

              {/* Dynamic Category Filter Chips for Spotlight */}
              {dynamicCategories.length > 0 && (
                <div className="py-1 flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 mr-1">
                    <Sparkles className="w-3.5 h-3.5 text-accent-lux" /> Filter Spotlight:
                  </span>
                  <button
                    onClick={() => setSelectedCat("")}
                    className={`text-[11px] font-semibold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                      selectedCat === ""
                        ? "bg-[#48073d] text-white dark:bg-accent-lux border-[#48073d] dark:border-accent-lux"
                        : "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-accent-lux"
                    }`}
                  >
                    All Spotlight
                  </button>
                  {dynamicCategories.map((cat) => {
                    const isActive = selectedCat === cat._id || selectedCat === cat.categoryName;
                    return (
                      <button
                        key={cat._id}
                        onClick={() => setSelectedCat(isActive ? "" : cat._id)}
                        className={`text-[11px] font-semibold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#48073d] text-white dark:bg-accent-lux border-[#48073d] dark:border-accent-lux"
                            : "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-accent-lux"
                        }`}
                      >
                        {cat.categoryName}
                      </button>
                    );
                  })}
                </div>
              )}

              {isLoadingSpotlight ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 space-y-4 border border-slate-100 dark:border-slate-800 animate-pulse">
                      <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : displaySpotlightPackages.length === 0 ? (
                <div className="glass-panel p-12 text-center flex flex-col items-center max-w-lg mx-auto border border-slate-200/10 rounded-3xl">
                  <Sparkles className="w-12 h-12 text-accent-lux mb-4 opacity-70" />
                  <h3 className="font-bold text-base text-foreground">No Spotlight Packages Found</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                    No spotlight packages available for this specific category filter at the moment.
                  </p>
                  <button
                    onClick={() => setSelectedCat("")}
                    className="mt-6 px-6 py-2.5 rounded-full bg-accent-lux text-white text-xs font-bold shadow-md cursor-pointer hover:brightness-110"
                  >
                    View All Spotlight Packages
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displaySpotlightPackages.map((item, idx) => {
                    const pkg = item.package;
                    const isFavorited = wishlist.includes(pkg.id);
                    const isCartAdded = cart.some((c) => c.id === pkg.id || c.itemId === pkg.id);
                    const categorySlug = item.category?.name
                      ? item.category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                      : (item.category?.id || pkg.id);

                    const catId = item.category?.id || (item.category as any)?._id;
                    const subId = item.subCategory?.id;
                    const actId = item.serviceAction?.id;
                    const qp = new URLSearchParams();
                    if (catId) qp.set("categoryId", catId);
                    if (subId) qp.set("sub", subId);
                    if (actId) qp.set("act", actId);
                    qp.set("item", pkg.id);

                    return (
                      <motion.div
                        key={pkg.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.04 }}
                        onClick={() => router.push(`/services/${categorySlug}?${qp.toString()}`)}
                        className="group relative bg-white dark:bg-slate-900/80 rounded-2xl border border-accent-lux/20 dark:border-slate-800 hover:border-accent-lux/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1"
                      >
                        {/* Card Top Banner / Media */}
                        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <PackageImageDisplay imageUrl={pkg.imageUrl} name={pkg.name} />

                          {/* Overlay Gradients */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                          {/* Spotlight Badge */}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent-lux text-white shadow-md flex items-center gap-1">
                              <Sparkles className="w-3 h-3 fill-white" /> Spotlight
                            </span>
                            {item.category?.name && (
                              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-850 dark:text-slate-100 backdrop-blur-md shadow-sm">
                                {item.category.name}
                              </span>
                            )}
                          </div>

                          {/* Wishlist / Bookmark Toggle */}
                          <button
                            onClick={(e) => handleWishlistToggle(e, pkg.id, pkg.name)}
                            className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-sm z-10 ${
                              isFavorited || pkg.isBookmarked
                                ? "bg-rose-500 text-white"
                                : "bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-rose-500 hover:bg-white"
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFavorited || pkg.isBookmarked ? "fill-white" : ""}`} />
                          </button>

                          {/* Discount Badge */}
                          {pkg.discountPercentage && pkg.discountPercentage > 0 ? (
                            <span className="absolute bottom-3 left-3 bg-emerald-500 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md tracking-wider">
                              {pkg.discountPercentage}% OFF
                            </span>
                          ) : null}

                          {/* Duration Badge */}
                          {pkg.duration && (
                            <span className="absolute bottom-3 right-3 text-[9px] font-bold text-slate-200 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1 font-sans">
                              <Clock className="w-3 h-3 text-amber-400" /> {formatDuration(pkg.duration)}
                            </span>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-accent-lux transition-colors leading-snug">
                              {pkg.name}
                            </h3>

                            {pkg.subtitle && (
                              <p className="text-[11px] font-semibold text-accent-lux mt-0.5 line-clamp-1">
                                {pkg.subtitle}
                              </p>
                            )}

                            {pkg.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                                {pkg.description}
                              </p>
                            )}
                          </div>

                          {/* Card Footer: Price & Actions */}
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex flex-col">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-extrabold text-foreground font-sans">
                                  ₹{pkg.price}
                                </span>
                                {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                                  <span className="text-xs text-slate-400 line-through font-sans">
                                    ₹{pkg.originalPrice}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                ✓ Verified Pros
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(e, item);
                                }}
                                disabled={isCartAdded}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer ${
                                  isCartAdded
                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 cursor-not-allowed opacity-90"
                                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                                }`}
                              >
                                {isCartAdded ? "Added ✓" : "+ Cart"}
                              </button>

                              <button
                                onClick={(e) => handleBookNow(e, item)}
                                className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold bg-accent-lux hover:bg-accent-lux/90 text-white active:scale-95 transition-all shadow-md flex items-center gap-1 cursor-pointer"
                              >
                                <span>Book Now</span> <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 3: SHOW ALL PACKAGES & CATALOG */}
          {viewMode === "packages" && (
            <div className="space-y-6 pt-4">

              {/* Top Search Banner */}
              <div className="py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div ref={searchWrapperRef} className="flex-1 relative">
                  <form onSubmit={(e) => { e.preventDefault(); router.push(`/search?view=packages&q=${encodeURIComponent(query)}`); setSearchSuggestions([]); }}>
                    <input
                      type="text"
                      placeholder="What service can we clean, fix, or style today?"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-3.5 pl-12 pr-12 text-sm focus:outline-none focus:border-accent-lux focus:ring-1 focus:ring-accent-lux text-foreground shadow-sm"
                    />
                  </form>
                  <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />

                  {/* Voice Trigger */}
                  <button
                    onClick={startVoiceSearch}
                    className="absolute right-4 top-3.5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-accent-lux hover:text-white dark:hover:bg-accent-lux text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all duration-300 cursor-pointer"
                    title="Voice Search"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Auto Suggestions Dropdown from live API Packages */}
                  <AnimatePresence>
                    {searchSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        className="absolute left-0 right-0 mt-2 p-2.5 glass-panel z-50 shadow-2xl text-left border border-slate-200/20 rounded-2xl bg-white dark:bg-slate-900"
                      >
                        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider px-2.5 mb-1.5">Package Suggestions</p>
                        <div className="space-y-0.5">
                          {searchSuggestions.map((item) => {
                            const pkg = item.package;
                            const categorySlug = item.category?.name
                              ? item.category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                              : (item.category?.id || pkg.id);

                            const catId = item.category?.id || (item.category as any)?._id;

                            return (
                              <button
                                key={pkg.id}
                                type="button"
                                onClick={() => {
                                  setSearchSuggestions([]);
                                  router.push(`/services/${categorySlug}?${catId ? `categoryId=${encodeURIComponent(catId)}&` : ""}item=${pkg.id}`);
                                }}
                                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5">
                                  <PackageThumbnailDisplay imageUrl={pkg.imageUrl} name={pkg.name} />
                                  <div>
                                    <p className="text-[11px] font-bold text-foreground line-clamp-1">{pkg.name}</p>
                                    <p className="text-[9px] text-slate-400 capitalize">{item.category?.name || "Service"} • {formatDuration(pkg.duration || 60)}</p>
                                  </div>
                                </div>
                                <span className="text-[11px] font-bold text-accent-lux shrink-0">₹{pkg.price}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile Filters Trigger */}
                <button
                  onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                  className="md:hidden flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4 text-accent-lux" /> Filters
                </button>
              </div>

              {/* Dynamic Category Quick-Chips */}
              {dynamicCategories.length > 0 && (
                <div className="py-2 flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 mr-1">
                    <TrendingUp className="w-3.5 h-3.5 text-accent-lux" /> Categories:
                  </span>
                  {dynamicCategories.map((cat) => {
                    const isActive = isCategoryMatch(cat._id, cat.categoryName, selectedCat);
                    return (
                      <button
                        key={cat._id}
                        onClick={() => {
                          if (isActive) {
                            setSelectedCat("");
                            setSelectedSubCat("");
                          } else {
                            setSelectedCat(cat._id);
                            setSelectedSubCat("");
                          }
                          setCurrentPage(1);
                        }}
                        className={`text-[11px] font-semibold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer shadow-sm ${isActive
                            ? "bg-[#48073d] text-white dark:bg-accent-lux border-[#48073d] dark:border-accent-lux"
                            : "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-accent-lux"
                          }`}
                      >
                        {cat.categoryName}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Core Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mt-4">

                {/* Left Filter Sidebar */}
                <aside
                  style={{ top: "calc(var(--header-total-height, 8rem) + 1rem)" }}
                  className={`md:block md:col-span-3 md:sticky md:max-h-[calc(100vh-var(--header-total-height,8rem)-2rem)] md:overflow-y-auto no-scrollbar glass-panel p-6 border border-slate-200/10 space-y-6 z-20 ${showFiltersMobile ? "block" : "hidden"}`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-xs font-bold text-foreground">Filter Catalog</span>
                    <button
                      onClick={() => {
                        setQuery("");
                        setSelectedCat("");
                        setSelectedSubCat("");
                        setMinRating(null);
                        setMaxPrice(10000);
                        setIsBudgetApplied(false);
                        setCurrentPage(1);
                      }}
                      className="text-[10px] text-accent-lux font-bold hover:underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>

                  {/* Categories */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Service Category</span>
                    <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                      <button
                        onClick={() => {
                          setSelectedCat("");
                          setSelectedSubCat("");
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg font-bold transition-all cursor-pointer ${selectedCat === ""
                            ? "bg-accent-lux/10 text-accent-lux"
                            : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                      >
                        All Categories
                      </button>

                      {dynamicCategories.map((cat) => {
                        const isSelected = isCategoryMatch(cat._id, cat.categoryName, selectedCat);
                        return (
                          <button
                            key={cat._id}
                            onClick={() => {
                              setSelectedCat(isSelected ? "" : cat._id);
                              setSelectedSubCat("");
                              setCurrentPage(1);
                            }}
                            className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg font-bold transition-all capitalize cursor-pointer ${isSelected
                                ? "bg-accent-lux/10 text-accent-lux"
                                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                          >
                            {cat.categoryName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subcategories (Dynamic when category selected) */}
                  {activeSubCategories.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-accent-lux tracking-wider">Subcategories</span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeSubCategories.map((subCat) => {
                          const isActive = selectedSubCat === subCat._id || selectedSubCat === subCat.name;
                          return (
                            <button
                              key={subCat._id}
                              onClick={() => {
                                if (isActive) {
                                  setSelectedSubCat("");
                                } else {
                                  setSelectedSubCat(subCat._id);
                                }
                                setCurrentPage(1);
                              }}
                              className={`text-[10px] font-normal px-2.5 py-1 rounded-full border transition-all cursor-pointer ${isActive
                                  ? "bg-accent-lux text-white border-accent-lux"
                                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-accent-lux"
                                }`}
                            >
                              {subCat.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Price range */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <span>Max Budget {isBudgetApplied ? "(Applied)" : "(Off)"}</span>
                      <span className="text-foreground font-sans font-bold">₹{maxPrice}</span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="10000"
                      step="50"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(Number(e.target.value));
                        setIsBudgetApplied(true);
                      }}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent-lux"
                    />
                    {isBudgetApplied && (
                      <button
                        onClick={() => {
                          setIsBudgetApplied(false);
                          setMaxPrice(10000);
                        }}
                        className="text-[9px] text-accent-lux font-bold hover:underline block"
                      >
                        Remove budget filter
                      </button>
                    )}
                  </div>
                </aside>

                {/* Right Search Grid */}
                <div className="md:col-span-9 space-y-6">

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-slate-500 font-medium">
                        Showing <span className="font-bold text-foreground font-sans">{totalItems || apiPackages.length}</span> verified packages
                      </p>
                      {(() => {
                        const activeCatObj = dynamicCategories.find((c) => isCategoryMatch(c._id, c.categoryName, selectedCat));
                        if (!activeCatObj) return null;
                        return (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#48073d]/10 dark:bg-accent-lux/20 text-[#48073d] dark:text-accent-lux border border-[#48073d]/20 dark:border-accent-lux/30 flex items-center gap-1">
                            Category: {activeCatObj.categoryName}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCat("");
                                setSelectedSubCat("");
                                setCurrentPage(1);
                              }}
                              className="hover:opacity-75 cursor-pointer ml-1 font-bold"
                              title="Clear category filter"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })()}
                    </div>
                    {totalPages > 1 && (
                      <p className="text-xs text-slate-400 font-semibold font-sans">
                        Page {currentPage} of {totalPages}
                      </p>
                    )}
                  </div>

                  {/* Loading Skeleton */}
                  {isLoadingPackages ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 space-y-4 border border-slate-100 dark:border-slate-800 animate-pulse">
                          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                          <div className="flex justify-between items-center pt-2">
                            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : apiPackages.length === 0 ? (
                    <div className="glass-panel p-12 text-center flex flex-col items-center max-w-lg mx-auto border border-slate-200/10 rounded-3xl">
                      <Package className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                      <h3 className="font-bold text-base text-foreground">No Packages Found</h3>
                      <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                        We couldn't find matching packages for this selection. Try clearing your filters or selecting another category.
                      </p>
                      <button
                        onClick={() => {
                          setQuery("");
                          setSelectedCat("");
                          setSelectedSubCat("");
                          setMinRating(null);
                          setMaxPrice(10000);
                          setIsBudgetApplied(false);
                          setCurrentPage(1);
                        }}
                        className="mt-6 px-6 py-2.5 rounded-full bg-[#48073d] text-white dark:bg-accent-lux text-xs font-bold shadow-md cursor-pointer hover:brightness-110"
                      >
                        Reset Filter View
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Dynamic API Package Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {apiPackages.map((item, idx) => {
                          const pkg = item.package;
                          const isFavorited = wishlist.includes(pkg.id);
                          const isCartAdded = cart.some(c => c.id === pkg.id || c.itemId === pkg.id);
                          const categorySlug = item.category?.name
                            ? item.category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                            : (item.category?.id || pkg.id);

                          const catId = item.category?.id || (item.category as any)?._id;

                          return (
                            <motion.div
                              key={pkg.id}
                              initial={{ opacity: 0, y: 16 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.04 }}
                              onClick={() => router.push(`/services/${categorySlug}?${catId ? `categoryId=${encodeURIComponent(catId)}&` : ""}item=${pkg.id}`)}
                              className="group relative bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/60 dark:border-slate-800 hover:border-accent-lux/40 dark:hover:border-accent-lux/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1"
                            >
                              {/* Card Top Banner / Media */}
                              <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                <PackageImageDisplay imageUrl={pkg.imageUrl} name={pkg.name} />

                                {/* Overlay Gradients */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                                {/* Category & Subcategory Pills */}
                                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 max-w-[80%]">
                                  {item.category?.name && (
                                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-850 dark:text-slate-100 backdrop-blur-md shadow-sm">
                                      {item.category.name}
                                    </span>
                                  )}
                                  {item.subCategory?.name && (
                                    <span className="text-[9px] font-normal uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#48073d]/90 text-white backdrop-blur-md shadow-sm">
                                      {item.subCategory.name}
                                    </span>
                                  )}
                                </div>

                                {/* Wishlist / Bookmark Toggle */}
                                <button
                                  onClick={(e) => handleWishlistToggle(e, pkg.id, pkg.name)}
                                  className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-sm z-10 ${isFavorited || pkg.isBookmarked
                                      ? "bg-rose-500 text-white"
                                      : "bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-rose-500 hover:bg-white"
                                    }`}
                                >
                                  <Heart className={`w-3.5 h-3.5 ${isFavorited || pkg.isBookmarked ? "fill-white" : ""}`} />
                                </button>

                                {/* Discount Badge */}
                                {pkg.discountPercentage && pkg.discountPercentage > 0 ? (
                                  <span className="absolute bottom-3 left-3 bg-emerald-500 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md tracking-wider">
                                    {pkg.discountPercentage}% OFF
                                  </span>
                                ) : null}

                                {/* Duration Badge */}
                                {pkg.duration && (
                                  <span className="absolute bottom-3 right-3 text-[9px] font-bold text-slate-200 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1 font-sans">
                                    <Clock className="w-3 h-3 text-amber-400" /> {formatDuration(pkg.duration)}
                                  </span>
                                )}
                              </div>

                              {/* Card Body */}
                              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                                <div>
                                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-accent-lux transition-colors leading-snug">
                                    {pkg.name}
                                  </h3>

                                  {pkg.subtitle && (
                                    <p className="text-[11px] font-semibold text-accent-lux mt-0.5 line-clamp-1">
                                      {pkg.subtitle}
                                    </p>
                                  )}

                                  {pkg.description && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                                      {pkg.description}
                                    </p>
                                  )}

                                  {/* Service Action details */}
                                  {item.serviceAction?.name && (
                                    <div className="mt-2.5 flex items-center gap-1">
                                      <span className="text-[9px] font-normal text-slate-400 uppercase tracking-wider">Action:</span>
                                      <span className="text-[9px] font-normal text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                        {item.serviceAction.name}
                                      </span>
                                    </div>
                                  )}

                                  {/* Addons List */}
                                  {item.addons && item.addons.length > 0 && (
                                    <div className="mt-2.5 flex flex-wrap gap-1">
                                      {item.addons.slice(0, 2).map((addon) => (
                                        <span key={addon._id} className="text-[8px] font-bold bg-accent-lux/10 text-accent-lux px-2 py-0.5 rounded-full">
                                          +{addon.addonName} (₹{addon.price})
                                        </span>
                                      ))}
                                      {item.addons.length > 2 && (
                                        <span className="text-[8px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                                          +{item.addons.length - 2} more
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Card Footer: Price & Both Actions (Add to Cart & Book Now) */}
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                  <div>
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="text-base font-black text-slate-900 dark:text-white font-sans">
                                        ₹{pkg.price}
                                      </span>
                                      {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                                        <span className="text-[11px] font-normal text-slate-400 line-through font-sans">
                                          ₹{pkg.originalPrice}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-450 font-bold block">
                                      ✓ Verified Pro Service
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Add to Cart Button */}
                                    <button
                                      onClick={(e) => handleAddToCart(e, item)}
                                      disabled={isCartAdded}
                                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer ${isCartAdded
                                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 cursor-not-allowed opacity-90"
                                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                                        }`}
                                    >
                                      {isCartAdded ? "Added ✓" : "+ Cart"}
                                    </button>

                                    {/* Book Now Button -> opens 4-step booking flow at /booking */}
                                    <button
                                      onClick={(e) => handleBookNow(e, item)}
                                      className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold bg-accent-lux hover:bg-accent-lux/90 text-white active:scale-95 transition-all shadow-md flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>Book Now</span> <ChevronRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                          <button
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            Previous
                          </button>
                          <span className="text-xs font-bold text-slate-500 font-sans">
                            {currentPage} / {totalPages}
                          </span>
                          <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="px-4 py-2 rounded-full bg-accent-lux text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-lux/90 transition-colors cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      </main>

      {/* Voice Search Simulation Overlay */}
      <AnimatePresence>
        {voiceActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="relative w-full max-w-md glass-panel bg-white/10 border-white/10 p-8 flex flex-col items-center text-center shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-accent-lux/20 border border-accent-lux/30 flex items-center justify-center text-white relative">
                <Volume2 className="w-8 h-8 animate-pulse text-white" />
                <div className="absolute inset-0 w-full h-full rounded-full border border-accent-lux/40 animate-ping" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider animate-pulse">Voice Assistant Active</span>
                <p className="text-sm font-bold text-white leading-relaxed">{voiceText}</p>
              </div>

              {/* Dynamic waveform lines */}
              <div className="flex items-center gap-1 pt-4 justify-center h-8">
                {[...Array(8)].map((_, i) => (
                  <span
                    key={i}
                    className="w-1 bg-accent-lux rounded-full animate-pulse"
                    style={{
                      height: `${15 + Math.random() * 20}px`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: `${0.4 + Math.random() * 0.5}s`
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => setVoiceActive(false)}
                className="px-6 py-2 rounded-full bg-white/10 border border-white/10 text-white hover:bg-white/20 text-[10px] font-bold tracking-wider uppercase cursor-pointer"
              >
                Cancel Assistant
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 text-xs font-bold">Loading services catalog...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
