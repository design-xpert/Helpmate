"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Star, Users, Shield, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { services } from "@/utils/mockData";
import { fetchCustomerSearchSuggestionsApi } from "@/services/searchApi";
import { formatImageUrl } from "@/utils/image";
import { formatDuration } from "@/utils/dateTime";
import QuickServices from "@/components/home/QuickServices";

export default function Hero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // Stats counting simulator
  const [completedCount, setCompletedCount] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    // Stats ticker simulation
    let countInterval = setInterval(() => {
      setCompletedCount((prev) => {
        if (prev >= 45000) {
          clearInterval(countInterval);
          return 45280;
        }
        return prev + 1200;
      });
    }, 30);

    let ratingInterval = setInterval(() => {
      setRatingCount((prev) => {
        if (prev >= 4.9) {
          clearInterval(ratingInterval);
          return 4.92;
        }
        return prev + 0.15;
      });
    }, 40);

    return () => {
      clearInterval(countInterval);
      clearInterval(ratingInterval);
    };
  }, []);

  // Fetch search suggestions from API when searchQuery changes
  useEffect(() => {
    let isCancelled = false;
    const query = searchQuery.trim();

    if (!query) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetchCustomerSearchSuggestionsApi(query, 5);
        if (isCancelled) return;

        if (res.success && res.data && res.data.length > 0) {
          const formatted = res.data.map((item) => {
            const catName = item.category?.name || "Service";
            const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            const catId = item.category?.id || (item.category as any)?._id;
            return {
              id: item.packageId,
              name: item.packageName,
              category: catName,
              categorySlug: catSlug,
              categoryId: catId,
              price: item.price,
              duration: item.duration || 60,
              image: formatImageUrl(item.imageUrl || ""),
            };
          });
          setSuggestions(formatted);
        } else {
          // Fallback to local mock filtering if API returns empty
          const filtered = services.filter(
            (s) =>
              s.name.toLowerCase().includes(query.toLowerCase()) ||
              s.category.toLowerCase().includes(query.toLowerCase())
          );
          setSuggestions(
            filtered.slice(0, 5).map((s) => ({
              id: s.id,
              name: s.name,
              category: s.category,
              categorySlug: s.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              price: s.price,
              duration: s.duration || 60,
              image: s.image,
            }))
          );
        }
      } catch (err) {
        if (!isCancelled) {
          setSuggestions([]);
        }
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (item: any) => {
    if (item.categorySlug && item.id) {
      router.push(`/services/${item.categorySlug}?${item.categoryId ? `categoryId=${encodeURIComponent(item.categoryId)}&` : ""}item=${item.id}`);
    } else {
      router.push(`/services/${item.id}`);
    }
  };

  return (
    <section className="relative flex flex-col items-center pt-3 sm:pt-5 pb-16 sm:pb-20 px-4 sm:px-6">

      {/* Background Animated Blobs */}
      <div className="blob-container absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob bg-accent-lux w-[400px] h-[400px] -top-20 -left-20 animate-float-blob" />
        <div className="blob bg-secondary-lux w-[400px] h-[400px] bottom-10 right-10" style={{ animationDelay: "4s" }} />
      </div>

      {/* Quick Services Strip - On top below header (only shows if API returns data) */}
      <QuickServices />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10 font-sans">

        {/* Left Column: Text Content & Controls */}
        <div className="lg:col-span-7 text-left space-y-6 relative z-30">
          {/* Subtitle Badge */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[10px] uppercase font-bold text-accent-lux tracking-widest mb-2"
          >
            Varanasi's Trusted Home Care Circle
          </motion.p>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-bold tracking-tight text-primary-lux dark:text-white leading-tight"
          >
            The End of <br />
            <span className="bg-gradient-to-r from-accent-lux via-secondary-lux to-accent-lux bg-clip-text text-transparent">
              No-Show Domestic Help.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed"
          >
            Book background-verified, uniformed pros in Varanasi in 60 seconds. Flat-rate pricing, 100% on-time guarantee, and zero contracts.
          </motion.p>

          {/* Large Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-2xl relative z-40"
          >
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center p-1.5 sm:p-2 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 shadow-xl dark:shadow-slate-950/50"
            >
              <div className="flex-1 flex items-center pl-3 sm:pl-4 pr-1 sm:pr-2 min-w-0">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mr-2 sm:mr-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Search cleaning, repair, salon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-foreground focus:outline-none placeholder-slate-400 py-2 sm:py-3 min-w-0"
                />
              </div>
              <button
                type="submit"
                className="bg-primary-lux hover:bg-slate-800 text-white dark:bg-accent-lux dark:hover:bg-accent-lux/90 rounded-[24px] px-3.5 sm:px-6 py-2.5 sm:py-3.5 text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md"
              >
                <span>Search</span> <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="absolute left-0 right-0 mt-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl z-50 shadow-2xl text-left max-h-[360px] overflow-y-auto"
                >
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 mb-2">Live Suggestions</p>
                  <div className="space-y-1">
                    {suggestions.map((item, idx) => (
                      <button
                        key={item.id || idx}
                        onClick={() => handleSuggestionClick(item)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <p className="text-xs font-bold text-foreground">{item.name}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{item.category} • {formatDuration(item.duration)}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-accent-lux">₹{item.price}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Quick Recommendation Tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap gap-2.5 text-xs text-slate-400"
          >
            <span>Popular:</span>
            {["Deep Cleaning", "AC Service", "Facial Combo", "Smart Switch"].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSearchQuery(tag);
                  router.push(`/search?q=${encodeURIComponent(tag)}`);
                }}
                className="text-slate-600 dark:text-slate-300 hover:text-accent-lux dark:hover:text-accent-lux transition-colors font-semibold"
              >
                {tag}
              </button>
            ))}
            <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>
            <a
              href="#pricing-calculator"
              className="text-accent-lux hover:text-accent-lux/80 font-bold transition-colors"
            >
              Pricing Calculator ✨
            </a>
          </motion.div>

          {/* Live Statistics Cards */}
          {/* <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.5 }}
            className="grid grid-cols-3 gap-4 mt-8 max-w-xl"
          >
            <div className="glass-panel p-4 flex flex-col items-center text-center">
              <Users className="w-5 h-5 text-accent-lux mb-2" />
              <span className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                {completedCount.toLocaleString()}+
              </span>
              <span className="text-[9px] text-slate-500 uppercase mt-0.5 tracking-wider font-semibold">Jobs Done</span>
            </div>

            <div className="glass-panel p-4 flex flex-col items-center text-center">
              <Star className="w-5 h-5 text-amber-500 mb-2 fill-amber-500" />
              <span className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                {ratingCount.toFixed(2)}/5
              </span>
              <span className="text-[9px] text-slate-500 uppercase mt-0.5 tracking-wider font-semibold">Rating</span>
            </div>

            <div className="glass-panel p-4 flex flex-col items-center text-center">
              <Shield className="w-5 h-5 text-success-lux mb-2" />
              <span className="text-base sm:text-lg font-bold text-foreground tracking-tight">100%</span>
              <span className="text-[9px] text-slate-500 uppercase mt-0.5 tracking-wider font-semibold">Insured</span>
            </div>
          </motion.div> */}
        </div>

        {/* Right Column: Hero Image Showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-5 relative w-full flex justify-center mt-8 lg:mt-0"
        >
          {/* Decorative glows behind the image */}
          <div className="absolute -top-6 -left-6 w-36 h-36 bg-accent-lux/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-6 -right-6 w-36 h-36 bg-secondary-lux/20 rounded-full blur-2xl pointer-events-none" />

          {/* Main Image Frame with Glassmorphism Border */}
          <div className="glass-panel p-3 bg-white/5 border-white/10 dark:bg-slate-900/40 dark:border-slate-800 shadow-2xl relative max-w-md w-full overflow-hidden">
            <img
              src="/hero-showcase.png"
              alt="HelpMate Premium Home Services"
              className="w-full h-auto object-cover rounded-[16px] aspect-square"
            />
            {/* Floating Live Badge */}
            <div className="absolute bottom-6 right-6 bg-white/95 dark:bg-slate-900/95 border border-slate-200/10 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-success-lux rounded-full animate-pulse" />
              <span className="text-[9px] uppercase font-extrabold text-foreground tracking-wider">
                Vetted Varanasi Pros Active
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
