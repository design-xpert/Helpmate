"use client";

import { useState, useEffect } from "react";
import { 
  Star, 
  ShieldCheck, 
  Quote
  /*
  Play, 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ShoppingBag, 
  Maximize2 
  */
} from "lucide-react";
import { fetchCustomerReviewsApi } from "@/services/reviewApi";
import { getNameInitials } from "@/utils/image";
// import { motion, AnimatePresence } from "framer-motion";
// import { useStore } from "@/store/useStore";
// import { useRouter } from "next/navigation";

interface CustomerReviewItem {
  id: string;
  name: string;
  serviceName: string;
  rating: number;
  comment: string;
  date: string;
}

function formatReviewDate(dateString?: string): string {
  if (!dateString) return "Recently";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recently";
  }
}

export default function Reviews() {
  const [reviewsList, setReviewsList] = useState<CustomerReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadReviews() {
      try {
        const res = await fetchCustomerReviewsApi();
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const list: CustomerReviewItem[] = res.data.map((item: any, idx: number) => {
            const rawCustomer = typeof item.customerId === "object" ? item.customerId?.fullName : (item.customerName || item.customerId);
            const customerName = rawCustomer || "Verified Customer";
            const rawPackage = typeof item.packageId === "object" ? item.packageId?.packageName : (item.packageName || item.serviceName);
            const serviceName = rawPackage || "Helpmate Service";
            const reviewText = item.review || item.comment || "Great service!";
            const ratingVal = typeof item.rating === "number" ? Math.max(1, Math.min(5, Math.round(item.rating))) : 5;
            const reviewId = item._id || item.id || `rev-${idx}`;

            return {
              id: String(reviewId),
              name: customerName,
              serviceName,
              rating: ratingVal,
              comment: reviewText,
              date: formatReviewDate(item.createdAt),
            };
          });
          setReviewsList(list);
        } else if (isMounted) {
          setReviewsList([]);
        }
      } catch {
        if (isMounted) {
          setReviewsList([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  // Duplicate reviews into two identical halves for seamless -50% marquee loop
  const minHalfSize = 6;
  const multiplier = Math.max(1, Math.ceil(minHalfSize / Math.max(reviewsList.length, 1)));
  const baseHalf = Array(multiplier).fill(reviewsList).flat();
  const marqueeReviews = [...baseHalf, ...baseHalf];

  // Auto-hide section if not loading and no reviews exist
  if (!loading && reviewsList.length === 0) {
    return null;
  }

  /* Video reviews scroll reference & modal states (Commented out)
  const router = useRouter();
  const { addToCart, cart } = useStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const modalVideoRef = useRef<HTMLVideoElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const handleBookService = (serviceId: string) => {
    const foundService = services.find((s) => s.id === serviceId) || services[0];
    const isAlreadyInCart = cart.some(
      (c) => String(c.id) === String(foundService.id) || String(c.itemId) === String(foundService.id)
    );

    if (!isAlreadyInCart) {
      addToCart({
        id: foundService.id,
        name: foundService.name,
        price: foundService.price,
        category: foundService.category,
        duration: foundService.duration,
        image: foundService.image,
        imageUrl: foundService.image,
      });
    }

    setActiveVideoIndex(null);
    router.push("/booking");
  };

  useEffect(() => {
    if (activeVideoIndex !== null && modalVideoRef.current) {
      if (isPlaying) {
        modalVideoRef.current.play().catch(() => {});
      } else {
        modalVideoRef.current.pause();
      }
    }
  }, [activeVideoIndex, isPlaying]);

  const currentVideo = activeVideoIndex !== null ? videoReviews[activeVideoIndex] : null;
  */

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-800/40 overflow-hidden font-sans relative">
      {/* Main Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-primary-lux dark:text-white mt-1">
          Reviews
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-sm">
          Honest feedback &amp; real service transformations.
        </p>
      </div>

      {loading ? (
        <div className="max-w-7xl mx-auto px-6 flex gap-6 overflow-hidden select-none">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="w-[320px] sm:w-[380px] p-6 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/40 dark:border-slate-800 animate-pulse space-y-4 shrink-0"
            >
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded w-full" />
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Infinite Marquee Container */
        <div className="relative w-full flex items-center justify-start py-4">
          <div className="animate-marquee flex gap-8">
            {marqueeReviews.map((rev, idx) => (
              <div
                key={`${rev.id}-${idx}`}
                className="glass-panel w-[320px] sm:w-[380px] p-6 shrink-0 flex flex-col justify-between border border-slate-200/10 hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-slate-900/70"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating
                              ? "fill-amber-500 text-amber-500"
                              : "text-slate-300 dark:text-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{rev.date}</span>
                  </div>

                  <div className="relative">
                    <Quote className="w-8 h-8 text-accent-lux/10 absolute -top-3 -left-3 rotate-180" />
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic pl-4 relative z-10">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#4a0e4e] to-slate-900 text-white font-black text-xs uppercase shadow-xs shrink-0 select-none border border-white/20">
                      {getNameInitials(rev.name, "C")}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
                        {rev.name}
                        <ShieldCheck className="w-3.5 h-3.5 text-success-lux" />
                      </h4>
                      <p className="text-[9px] text-slate-400 uppercase mt-0.5 tracking-wider font-semibold">
                        {rev.serviceName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= Video Reviews Section (Commented Out) ================= */}
      {/* 
      <div className="max-w-7xl mx-auto px-6 border-t border-slate-200/40 dark:border-slate-800/60 pt-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-accent-lux tracking-widest block">
              Live Transformations
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-primary-lux dark:text-white mt-1">
              Video Reviews
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Watch real service video reviews in Instagram size (9:16 portrait ratio).
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={scrollLeft}
              className="p-2.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all"
              aria-label="Previous Video Reviews"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={scrollRight}
              className="p-2.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all"
              aria-label="Next Video Reviews"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {videoReviews.map((item, idx) => {
            const isHovered = hoveredId === item.id;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => {
                  setActiveVideoIndex(idx);
                  setIsPlaying(true);
                }}
                className="shrink-0 snap-start cursor-pointer group relative w-[240px] sm:w-[270px] aspect-[9/16] rounded-[24px] overflow-hidden border border-slate-200/20 dark:border-slate-800 bg-slate-950 shadow-xl hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between"
              >
                {isHovered ? (
                  <video
                    src={item.videoUrl}
                    poster={item.poster}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <img
                    src={item.poster}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90 pointer-events-none" />

                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-amber-300">
                    {item.serviceName}
                  </span>
                  <div className="p-1.5 rounded-full bg-black/50 backdrop-blur-md text-white/80">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-black group-hover:border-transparent transition-all duration-300">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 z-10 space-y-2 pointer-events-none">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 3 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-slate-300 text-[10px]">{item.date}</span>
                  </div>

                  <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed italic">
                    "{item.comment}"
                  </p>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="w-7 h-7 rounded-full object-cover border border-white/20"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1">
                          {item.name}
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        </h4>
                        <span className="text-[9px] text-slate-400 block">{item.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      */}

      {/* ================= Video Lightbox Modal (Commented Out) ================= */}
      {/* 
      <AnimatePresence>
        {activeVideoIndex !== null && currentVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              onClick={() => setActiveVideoIndex(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all"
              aria-label="Close Video Review"
            >
              <X className="w-6 h-6" />
            </button>

            {activeVideoIndex > 0 && (
              <button
                onClick={() => {
                  setActiveVideoIndex(activeVideoIndex - 1);
                  setIsPlaying(true);
                }}
                className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-50 p-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {activeVideoIndex < videoReviews.length - 1 && (
              <button
                onClick={() => {
                  setActiveVideoIndex(activeVideoIndex + 1);
                  setIsPlaying(true);
                }}
                className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-50 p-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full sm:w-[360px] h-[640px] max-h-[85vh] bg-black sm:rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between"
            >
              <video
                ref={modalVideoRef}
                src={currentVideo.videoUrl}
                poster={currentVideo.poster}
                loop
                muted={isMuted}
                playsInline
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
              />

              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />

              {!isPlaying && (
                <div 
                  onClick={() => setIsPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer z-20"
                >
                  <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </div>
                </div>
              )}

              <div className="relative z-30 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={currentVideo.avatar}
                    alt={currentVideo.name}
                    className="w-8 h-8 rounded-full object-cover border border-white/20"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1">
                      {currentVideo.name}
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </h4>
                    <span className="text-[10px] text-slate-300 block">{currentVideo.location}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-white" />}
                </button>
              </div>

              <div className="relative z-30 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                    {currentVideo.serviceName}
                  </span>
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-100 italic leading-relaxed">
                  "{currentVideo.comment}"
                </p>

                <button
                  onClick={() => handleBookService(currentVideo.serviceId)}
                  className="w-full py-2.5 px-4 rounded-xl bg-accent-lux hover:bg-accent-lux/90 text-primary-lux text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Book {currentVideo.serviceName}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      */}
    </section>
  );
}
