"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  MapPin,
  Search,
  Bell,
  User,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  Wallet,
  Calendar,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  X,
  ShoppingCart,
  Trash2,
  Bookmark
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, getItemAddonTotal } from "@/store/useStore";
import { formatImageUrl } from "@/utils/image";
import { formatDuration } from "@/utils/dateTime";
import { citiesServed, services } from "@/utils/mockData";
import LocationModal from "./LocationModal";
import BetaBanner from "./BetaBanner";
import { fetchCustomerPackagesApi, CustomerPackageItem } from "@/services/packageApi";

function HeaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const currentQuery = searchParams?.toString();
  const currentUrl = pathname ? (currentQuery ? `${pathname}?${currentQuery}` : pathname) : "/";
  const loginHref = pathname && pathname !== "/login" && pathname !== "/register"
    ? `/login?redirect=${encodeURIComponent(currentUrl)}`
    : "/login";

  const {
    theme,
    toggleTheme,
    userName,
    walletBalance,
    isLoggedIn,
    logout,
    notifications,
    clearNotifications,
    setChatOpen,
    setGuestMode,
    cart,
    removeFromCart,
    clearCart,
    updateCartQuantity,
    toggleAddonInCart,
    cartPricing,
    selectedLocation,
    setSelectedLocation,
    hasPromptedLocation,
    setHasPromptedLocation,
    isLocationSet,
    bookmarkedPackageIds
  } = useStore();

  const [scrolled, setScrolled] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [suggestions, setSuggestions] = useState<typeof services>([]);

  // Auto prompt location modal on first visit/open
  useEffect(() => {
    const isLocationSavedInStorage =
      typeof window !== "undefined" && localStorage.getItem("helpmate_location_set") === "true";

    if (!hasPromptedLocation && !isLocationSet && !isLocationSavedInStorage) {
      const timer = setTimeout(() => {
        setShowLocationModal(true);
        setHasPromptedLocation(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("helpmate_location_set", "true");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasPromptedLocation, isLocationSet, setHasPromptedLocation]);

  // Refs for outside click tracking
  const searchRef = useRef<HTMLFormElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [apiSuggestions, setApiSuggestions] = useState<CustomerPackageItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (!searchQuery.trim()) {
      setApiSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await fetchCustomerPackagesApi({ search: searchQuery.trim(), limit: 4 });
      if (isMounted && res.success && res.data) {
        setApiSuggestions(res.data);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        setShowCartDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCitySelect = (city: string) => {
    setSelectedLocation(city);
    setShowLocationModal(false);
  };

  const headerRef = useRef<HTMLElement>(null);
  const lastHeaderHeightRef = useRef<number>(0);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        const diff = Math.abs(height - lastHeaderHeightRef.current);

        // Update on initial load, when at top of page, or when height changes significantly (e.g. beta banner closed/resized)
        if (lastHeaderHeightRef.current === 0 || window.scrollY <= 10 || diff > 15) {
          lastHeaderHeightRef.current = height;
          document.documentElement.style.setProperty("--header-total-height", `${height}px`);
        }
      }
    };

    updateHeaderHeight();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && headerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateHeaderHeight();
      });
      resizeObserver.observe(headerRef.current);
    }

    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 font-sans ${scrolled
          ? "bg-background/90 dark:bg-background/90 backdrop-blur-xl shadow-xs"
          : "bg-background/70 dark:bg-background/75 backdrop-blur-md"
          }`}
      >
      {/* Top Beta Notice Strip - Above Header Navigation */}
      <BetaBanner />

      <div className={`transition-all duration-300 ${scrolled ? "py-2 sm:py-2.5" : "py-3 sm:py-3.5"}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-6">

        {/* LOGO */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img src="/logo-transparent.png" alt="HelpMate Logo" className="h-9 sm:h-13 w-auto object-contain" />
          </Link>

          {/* Location Picker */}
          <button
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200/10 transition-all duration-300 text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shrink-0"
            title="Change service location"
          >
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-lux shrink-0" />
            <span className="truncate max-w-[65px] xs:max-w-[85px] sm:max-w-[140px]">{selectedLocation || "Location"}</span>
            <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-60 shrink-0" />
          </button>
        </div>

        {/* Search Bar */}
        <form
          ref={searchRef}
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-md hidden sm:block relative"
        >
          <input
            type="text"
            placeholder="Search luxury cleaning, AC repair..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200/10 focus:border-accent-lux/30 focus:bg-white dark:focus:bg-slate-900 rounded-full py-2.5 pl-10 pr-4 text-xs focus:outline-none transition-all duration-300 text-foreground"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />

          {/* Auto Suggestions Dropdown */}
          <AnimatePresence>
            {apiSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="absolute left-0 right-0 mt-2 p-2.5 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl z-50 shadow-2xl text-left"
              >
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider px-2.5 mb-1.5">Live Packages</p>
                <div className="space-y-0.5">
                  {apiSuggestions.map((item) => {
                    const catSlug = item.category?.name
                      ? item.category.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")
                      : "service";
                    const catId = item.category?.id || (item.category as any)?._id;
                    const subId = item.subCategory?.id;
                    const actId = item.serviceAction?.id;
                    const pkgId = item.package.id;
                    const targetUrl = `/services/${catSlug}?${catId ? `categoryId=${encodeURIComponent(catId)}&` : ""}${subId ? `sub=${encodeURIComponent(subId)}&` : ""}${actId ? `act=${encodeURIComponent(actId)}&` : ""}item=${encodeURIComponent(pkgId)}`;

                    return (
                      <button
                        key={item.package.id}
                        type="button"
                        onClick={() => {
                          setApiSuggestions([]);
                          setSearchQuery("");
                          router.push(targetUrl);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          {item.package.imageUrl ? (
                            <img src={formatImageUrl(item.package.imageUrl)} alt={item.package.name} referrerPolicy="no-referrer" className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-accent-lux/10 flex items-center justify-center text-accent-lux text-xs font-bold">
                              {item.package.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-[11px] font-bold text-foreground line-clamp-1">{item.package.name}</p>
                            <p className="text-[9px] text-slate-400 capitalize">
                              {item.category?.name || "Service"} • {formatDuration(item.package.duration || 60)}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-accent-lux shrink-0">₹{item.package.price}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Right Nav Options */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme Switcher */}
          {/* <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors text-slate-600 dark:text-slate-300 cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button> */}

          {/* Shopping Cart Indicator */}
          <div ref={cartRef} className="relative">
            <button
              onClick={() => {
                setShowCartDropdown(!showCartDropdown);
                setShowNotifications(false);
                setShowProfileMenu(false);
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors text-slate-600 dark:text-slate-300 relative cursor-pointer shrink-0"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 sm:w-5 sm:h-5 bg-accent-lux text-white text-[8px] sm:text-[9px] font-black rounded-full flex items-center justify-center border border-white dark:border-slate-900 shadow-md">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Cart Dropdown Menu */}
            <AnimatePresence>
              {showCartDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-[calc(100vw-1.5rem)] max-w-sm sm:w-84 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-50 p-3 text-left font-sans"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <span className="font-bold text-xs text-foreground">Selected Services</span>
                    {cart.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => clearCart()}
                          className="text-[10px] font-bold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Clear All
                        </button>
                        <span className="text-[10px] text-slate-400 font-bold">{cart.length} items</span>
                      </div>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 mt-2 no-scrollbar">
                    {cart.length === 0 ? (
                      <div className="py-8 text-center flex flex-col items-center justify-center text-slate-400 space-y-2">
                        <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Your cart is empty</span>
                      </div>
                    ) : (
                      cart.map((item) => {
                        const addonTotal = (item.selectedAddons || []).reduce(
                          (sum, a) => sum + (a.totalPrice || ((a.price || 0) * (a.quantity || 1))),
                          0
                        );
                        const itemTotal = (item.price * (item.quantity || 1)) + addonTotal;

                        return (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0 pr-2">
                                <h4 className="text-[11px] font-bold text-foreground truncate leading-tight">{item.name}</h4>
                                <p className="text-[9px] text-slate-400 mt-0.5 capitalize">⏱ {formatDuration(item.duration)}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold font-sans px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                                  Qty: {item.quantity || 1}
                                </span>

                                <span className="text-xs font-black text-accent-lux font-sans min-w-[40px] text-right">
                                  ₹{itemTotal}
                                </span>
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-slate-400 hover:text-red-500 cursor-pointer p-0.5"
                                  title="Remove item"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Render Selected Add-ons inside Cart Dropdown */}
                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                              <div className="pt-1 border-t border-slate-200/50 dark:border-slate-800/80 space-y-1">
                                <span className="text-[9px] uppercase font-bold text-accent-lux tracking-wider">Add-ons ({item.selectedAddons.length})</span>
                                {item.selectedAddons.map((addon) => (
                                  <div key={addon.addonId} className="flex items-center justify-between text-[9px] bg-white/60 dark:bg-slate-800/50 px-2 py-0.5 rounded-md">
                                    <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[140px]">
                                      {addon.addonName} {addon.quantity > 1 ? `(x${addon.quantity})` : ""}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <span className="font-bold text-foreground">₹{addon.totalPrice || ((addon.price || 0) * (addon.quantity || 1))}</span>
                                      <button
                                        onClick={() => toggleAddonInCart(item.itemId || item.id, addon.addonId, "remove")}
                                        className="text-slate-400 hover:text-rose-500 ml-0.5 cursor-pointer"
                                        title="Remove add-on"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Subtotal Amount</span>
                        <span className="font-black text-foreground font-sans">
                          ₹{cartPricing ? cartPricing.subtotal : cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)) + getItemAddonTotal(item), 0)}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setShowCartDropdown(false);
                          router.push("/booking");
                        }}
                        className="w-full bg-accent-lux hover:bg-accent-lux/90 text-white font-bold text-[11px] py-2.5 rounded-full shadow-md text-center block cursor-pointer transition-colors"
                      >
                        Proceed to Booking Slot
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          {/* {!isHomePage && isLoggedIn && (
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors text-slate-600 dark:text-slate-300 relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-lux rounded-full animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-50 p-2"
                  >
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-xs text-foreground">Notifications</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearNotifications}
                          className="text-[10px] text-accent-lux hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto p-1 mt-1 space-y-1 no-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-[11px] text-slate-400">
                          No new updates
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-2.5 items-start"
                          >
                            <CheckCircle2 className="w-4 h-4 text-success-lux mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-foreground">{notif.title}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )} */}

          {/* User Profile or Sign In / Signup Button */}
          {isLoggedIn ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-1.5 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-accent-lux/10 border border-accent-lux/20 text-accent-lux flex items-center justify-center font-bold text-xs">
                  {userName ? userName.slice(0, 2).toUpperCase() : "AT"}
                </div>
                <ChevronDown className="w-3 h-3 opacity-60 text-foreground" />
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-50 p-2"
                  >
                    <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-foreground">{userName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Elite Member</p>
                      <div className="mt-2.5 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Wallet className="w-3 h-3 text-accent-lux" /> Wallet
                        </span>
                        <span className="text-xs font-bold text-foreground">₹{walletBalance}</span>
                      </div>
                    </div>
                    <div className="p-1 space-y-0.5">
                      {/* <Link
                        href="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <User className="w-3.5 h-3.5" /> Dashboard & Address
                      </Link> */}
                      <Link
                        href="/profile?tab=bookings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" /> My Bookings
                      </Link>
                      <Link
                        href="/profile?tab=bookmarks"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bookmark className="w-3.5 h-3.5 text-accent-lux" /> Saved Packages
                        </div>
                        {bookmarkedPackageIds.length > 0 && (
                          <span className="bg-accent-lux/10 text-accent-lux font-bold text-[10px] px-2 py-0.5 rounded-full border border-accent-lux/20">
                            {bookmarkedPackageIds.length}
                          </span>
                        )}
                      </Link>
                      {/* <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setChatOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-left"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Live Support Chat
                      </button> */}
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Log Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href={loginHref}
              onClick={() => {
                if (typeof window !== "undefined" && currentUrl && currentUrl !== "/login" && currentUrl !== "/register") {
                  try {
                    sessionStorage.setItem("helpmate_redirect", currentUrl);
                  } catch {}
                }
              }}
              className="px-2.5 sm:px-4.5 py-1.5 sm:py-2 rounded-full bg-accent-lux hover:bg-accent-lux/95 text-white font-bold text-[11px] sm:text-xs shadow-md shadow-accent-lux/20 transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap"
            >
              <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="hidden sm:inline">Sign In / Sign Up</span>
              <span className="sm:hidden">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  </header>

      {/* Location Selector Modal with Geolocation & Manual Fallback */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </>
  );
}

export default function Header() {
  return (
    <Suspense fallback={<div className="fixed top-0 left-0 w-full h-16 bg-transparent z-40" />}>
      <HeaderContent />
    </Suspense>
  );
}
