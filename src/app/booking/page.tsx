"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle,
  Check,
  Plus,
  Trash2,
  Percent,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Info,
  Home,
  Briefcase,
  Building,
  Tag,
  Users,
  User,
  UserPlus,
  Lock,
  HeartHandshake,
  Edit3,
  X,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, Address, getItemAddonTotal } from "@/store/useStore";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import confetti from "canvas-confetti";

import { InlineCustomDatePicker, InlineCustomTimePicker } from "@/components/booking/CustomDateTimePickerModal";
import { isPastDate, isPastTime, formatDuration } from "@/utils/dateTime";
import { AvailableCouponsSlider } from "@/components/booking/AvailableCouponsSlider";
import MembershipBanner from "@/components/membership/MembershipBanner";
import { AddAddressForm } from "@/components/booking/AddAddressForm";
import { toast } from "@/components/common/Toast";
import { fetchScheduleAvailabilityApi } from "@/services/scheduleApi";
import { fetchCustomerPackagesApi } from "@/services/packageApi";

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams?.get("step");

  const {
    cart,
    addToCart,
    removeFromCart,
    cartPricing,
    addresses,
    addAddress,
    addAddressAsync,
    updateAddressAsync,
    fetchAddresses,
    selectedAddressId,
    setSelectedAddressId,
    selectedDate,
    setSelectedDate,
    selectedTimeSlot,
    setSelectedTimeSlot,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    createBooking,
    createBookingAsync,
    addNotification,
    toggleAddonInCart,
    bookings,
    isMember,
    membershipTier,
    isLoggedIn,
    token
  } = useStore();

  useEffect(() => {
    if (token) {
      fetchAddresses();
    }
  }, [token, fetchAddresses]);

  const [step, setStep] = useState(0); // 0: Cart/Add-ons, 1: Schedule, 2: Address, 3: Payment, 4: Success

  useEffect(() => {
    if (stepParam !== null && stepParam !== undefined) {
      const parsedStep = parseInt(stepParam, 10);
      if (!isNaN(parsedStep) && parsedStep >= 0 && parsedStep <= 4) {
        setStep(parsedStep);
      }
    }
  }, [stepParam]);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showCouponsSlider, setShowCouponsSlider] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [cartPackageAddons, setCartPackageAddons] = useState<any[]>([]);

  // Load available package addons for items currently in cart
  useEffect(() => {
    let isMounted = true;
    async function loadCartAddons() {
      if (!cart || cart.length === 0) {
        if (isMounted) setCartPackageAddons([]);
        return;
      }

      try {
        const res = await fetchCustomerPackagesApi({ limit: 50 });
        if (isMounted && res.success && res.data) {
          const cartItemIds = cart.map((c) => String(c.id || c.itemId));
          const matchedAddons: any[] = [];
          const seenAddonIds = new Set<string>();

          res.data.forEach((pkgItem: any) => {
            const pkgId = String(pkgItem.package?.id || pkgItem.package?._id);
            const pkgName = pkgItem.package?.name || pkgItem.package?.packageName;
            const isCartMatch = cartItemIds.some((cid) => cid === pkgId || cart.some((c) => c.name === pkgName));

            if (isCartMatch && pkgItem.addons && Array.isArray(pkgItem.addons)) {
              pkgItem.addons.forEach((addon: any) => {
                const aId = String(addon._id || addon.id);
                if (!seenAddonIds.has(aId)) {
                  seenAddonIds.add(aId);
                  matchedAddons.push({
                    id: aId,
                    name: addon.addonName || addon.title || addon.name || "Service Add-on",
                    price: addon.price || 0,
                    description: addon.description || "",
                    imageUrl: addon.imageUrl || "",
                  });
                }
              });
            }
          });

          setCartPackageAddons(matchedAddons);
        }
      } catch (err) {
        console.error("Error fetching cart package addons:", err);
      }
    }

    loadCartAddons();
    return () => {
      isMounted = false;
    };
  }, [cart]);

  // Dynamic schedule availability from backend API
  const [availableDates, setAvailableDates] = useState<{ label: string; dayNum: number; fullDate: string; iso: string; available?: boolean }[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadScheduleAvailability() {
      setIsLoadingSchedule(true);
      try {
        const res = await fetchScheduleAvailabilityApi(token);
        if (isMounted && res.success && res.data) {
          if (res.data.dates && res.data.dates.length > 0) {
            const mappedDates = res.data.dates.map((d) => {
              const dateObj = new Date(d.date + "T00:00:00");
              return {
                label: d.day || dateObj.toLocaleDateString("en-US", { weekday: "short" }),
                dayNum: dateObj.getDate(),
                fullDate: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                iso: d.date,
                available: d.available !== false
              };
            });
            setAvailableDates(mappedDates);
          }
          if (res.data.timeSlots && res.data.timeSlots.length > 0) {
            const mappedSlots = res.data.timeSlots.map((s: any) => {
              if (typeof s === "string") return s;
              return s.startTime || s.value || "";
            }).filter(Boolean);
            setAvailableTimeSlots(mappedSlots);
          }
        }
      } catch (err) {
        console.error("Error fetching schedule availability:", err);
      } finally {
        if (isMounted) setIsLoadingSchedule(false);
      }
    }
    loadScheduleAvailability();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Custom Date and Time expand state & refs
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [showCustomTime, setShowCustomTime] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);

  // Click outside listener for pickers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowCustomDate(false);
      }
      if (timePickerRef.current && !timePickerRef.current.contains(e.target as Node)) {
        setShowCustomTime(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-reset selection if date or time is in the past
  useEffect(() => {
    if (selectedDate && isPastDate(selectedDate)) {
      const todayISO = new Date().toISOString().split("T")[0];
      setSelectedDate(todayISO);
    }
    if (selectedTimeSlot && isPastTime(selectedTimeSlot, selectedDate)) {
      setSelectedTimeSlot(null);
    }
  }, [selectedDate, selectedTimeSlot, setSelectedDate, setSelectedTimeSlot]);

  // New address form state
  const [newTag, setNewTag] = useState<Address["tag"]>("Home");
  const [newAddressLine, setNewAddressLine] = useState("");
  const [newCity, setNewCity] = useState("Varanasi");

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "pay_after" | "cod">("pay_after");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Simulated booking tracking
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Available Time Slots - 1-hour arrival intervals
  const defaultTimeSlots = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
    "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"
  ];
  const timeSlots = availableTimeSlots.length >= 8 ? availableTimeSlots : defaultTimeSlots;

  // Generate next 6 dates starting today (Fallback)
  const getDates = () => {
    const dates = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        fullDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        iso: d.toISOString().split("T")[0],
        available: true
      });
    }
    return dates;
  };

  const dates = availableDates.length > 0 ? availableDates : getDates();

  const format24To12 = (time24: string): string => {
    if (!time24) return "";
    const [hStr, mStr] = time24.split(":");
    let hour = parseInt(hStr, 10);
    if (isNaN(hour)) return time24;
    const minutes = mStr || "00";
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
    return `${hourStr}:${minutes} ${ampm}`;
  };

  const format12To24 = (time12: string): string => {
    if (!time12) return "";
    const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return "";
    let [_, hStr, mStr, ampm] = match;
    let hour = parseInt(hStr, 10);
    if (ampm.toUpperCase() === "PM" && hour < 12) hour += 12;
    if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
    return `${hour < 10 ? '0' : ''}${hour}:${mStr}`;
  };

  const handleApplyCoupon = () => {
    setCouponError("");
    const success = applyCoupon(couponInput);
    if (success) {
      setCouponInput("");
      toast.success("Coupon Applied", `Promo code ${couponInput} applied successfully.`);
    } else {
      setCouponError("Invalid coupon code. Try LUXURY50");
      toast.error("Invalid Coupon", "Invalid coupon code. Please try LUXURY50 or another valid code.");
    }
  };

  const handleAddAddressSubmit = async () => {
    if (!newAddressLine.trim()) {
      toast.error("Missing Address", "Please enter a valid address.");
      return;
    }
    const success = await addAddressAsync({
      tag: newTag,
      addressLine: newAddressLine.trim(),
      city: newCity
    });
    if (success) {
      setNewAddressLine("");
      setShowAddAddress(false);
    }
  };

  const handleNextStep = () => {
    if (step === 0 && cart.length === 0) {
      toast.error("Cart is Empty", "Please select a service before proceeding.");
      return;
    }
    if (step === 1 && (!selectedDate || !selectedTimeSlot)) {
      toast.error("Schedule Required", "Please select a booking date and arrival time window.");
      return;
    }
    if (step === 2 && (!token || !isLoggedIn)) {
      toast.error("Sign In Required", "Please sign in or create an account to select an address and continue.");
      return;
    }
    if (step === 2 && !selectedAddressId) {
      toast.error("Address Required", "Please select or add a service address to proceed.");
      return;
    }
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      if (!token || !isLoggedIn) {
        toast.error("Sign In Required", "Please sign in or create an account to book a service.");
        return;
      }
      // Create final booking via API
      setIsSubmittingBooking(true);
      const methodToPass = (paymentMethod === "pay_after" || paymentMethod === "cod") ? "pay_after_service" : paymentMethod;
      createBookingAsync(methodToPass)
        .then((res) => {
          if (res.success && res.booking) {
            setCreatedBookingId(res.booking.id);
            setStep(4);
            window.scrollTo({ top: 0, behavior: "smooth" });
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.5 }
            });
            toast.success("Booking Confirmed!", "Your service appointment has been booked successfully.");
          } else {
            toast.error("Booking Failed", res.message || "Failed to create booking. Please try again.");
          }
        })
        .finally(() => {
          setIsSubmittingBooking(false);
        });
    }
  };

  const handlePrevStep = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isStepCompleted = (idx: number) => {
    if (idx === 0) return cart.length > 0;
    if (idx === 1) return Boolean(selectedDate && selectedTimeSlot);
    if (idx === 2) return Boolean((token || isLoggedIn) && selectedAddressId);
    if (idx === 3) return step === 4;
    return false;
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep === step) return;

    // Going backwards is always permitted
    if (targetStep < step) {
      setStep(targetStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Jumping forward: check requirements
    if (targetStep >= 1 && cart.length === 0) {
      toast.error("Cart is Empty", "Please select a service before proceeding.");
      return;
    }

    if (targetStep >= 2 && (!selectedDate || !selectedTimeSlot)) {
      toast.error("Schedule Required", "Please select your preferred date and time window first.");
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (targetStep >= 3) {
      if (!token || !isLoggedIn) {
        toast.error("Sign In Required", "Please sign in or create an account to proceed.");
        setStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (!selectedAddressId) {
        toast.error("Address Required", "Please select or add a service address to proceed.");
        setStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    setStep(targetStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Pricing math
  const matchedBooking = step === 4 && createdBookingId
    ? bookings.find(b => b.id === createdBookingId)
    : null;

  const itemsSubtotal = matchedBooking
    ? matchedBooking.totalAmount
    : (cartPricing?.itemsSubtotal ?? cart.reduce((sum, item) => sum + item.price * item.quantity, 0));

  const addonSubtotal = matchedBooking
    ? 0
    : (cartPricing?.addonSubtotal ?? cart.reduce((sum, item) => sum + getItemAddonTotal(item), 0));

  const subtotal = matchedBooking
    ? matchedBooking.totalAmount
    : (cartPricing?.subtotal ?? (itemsSubtotal + addonSubtotal));

  let couponDiscount = 0;
  if (matchedBooking) {
    couponDiscount = matchedBooking.discount;
  } else {
    if (appliedCoupon === "HELPMATE20") couponDiscount = Math.min(300, Math.round(subtotal * 0.20));
    else if (appliedCoupon === "LUXURY50") couponDiscount = 150;
    else if (appliedCoupon === "COOLING100") couponDiscount = 100;
    else if (appliedCoupon === "SUPERFEST") couponDiscount = Math.min(500, Math.round(subtotal * 0.25));
    else if (appliedCoupon === "WELCOME100") couponDiscount = 100;
    else if (appliedCoupon === "SUPERDEAL") couponDiscount = Math.min(1000, Math.round(subtotal * 0.25));
  }

  const memberDiscount = (!matchedBooking && isMember) ? Math.round(subtotal * 0.15) : 0;
  const discount = couponDiscount + memberDiscount;

  const availableGstAmount = matchedBooking
    ? Number((matchedBooking as any).billing?.gst ?? (matchedBooking as any).gst ?? 0)
    : (typeof cartPricing?.gst === "number" && cartPricing.gst > 0 ? Number(cartPricing.gst) : 0);
  const gstRate = cartPricing?.gstRate ?? 18;
  const hasGst = availableGstAmount > 0;
  const gst = availableGstAmount;

  const convenienceFee = matchedBooking
    ? 0
    : (cartPricing?.convenienceFee ?? (subtotal > 0 ? 49 : 0));

  const grandTotal = matchedBooking
    ? matchedBooking.finalAmount
    : (cartPricing && discount === 0 && !hasGst
      ? cartPricing.grandTotal
      : Math.max(0, Math.round((subtotal - discount + gst + convenienceFee) * 100) / 100));

  const total = grandTotal;

  return (
    <>
      <Header />

      <main 
        style={{ paddingTop: "var(--header-total-height, 8.5rem)" }}
        className="flex-1 pt-32 sm:pt-36 font-sans bg-slate-50/50 dark:bg-background pb-20 relative overflow-hidden min-h-screen"
      >
        {/* Glow Effects */}
        <div className="absolute top-24 left-1/4 -translate-x-1/2 w-96 h-96 bg-accent-lux/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-48 right-1/4 translate-x-1/2 w-96 h-96 bg-accent-lux/[0.03] rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 py-6">
          {/* Header Action / Back */}
          {step < 4 && (
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-accent-lux transition-colors mb-6 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to details
            </button>
          )}

          {/* Stepper Status Tracker */}
          {step < 4 && (() => {
            const activeProgressIndex = Math.max(
              step,
              isStepCompleted(2) ? 3 : isStepCompleted(1) ? 2 : isStepCompleted(0) ? 1 : 0
            );

            return (
              <div className="mb-10 max-w-3xl mx-auto">
                <div className="flex items-center justify-between relative">
                  {/* Connector line */}
                  <div className="absolute left-[18px] right-[18px] top-[18px] h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
                  <div
                    className="absolute left-[18px] top-[18px] h-0.5 bg-accent-lux -translate-y-1/2 transition-all duration-500 z-0"
                    style={{ width: `calc(${(activeProgressIndex / 3) * 100}% - ${(activeProgressIndex / 3) * 36}px)` }}
                  />

                  {[
                    { label: "Cart", icon: ShoppingBag },
                    { label: "Schedule", icon: Calendar },
                    { label: "Address", icon: MapPin },
                    { label: "Payment", icon: CreditCard }
                  ].map((s, idx) => {
                    const Icon = s.icon;
                    const isCompleted = isStepCompleted(idx);
                    const isCurrent = step === idx;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleStepClick(idx)}
                        className="flex flex-col items-center relative z-10 group cursor-pointer focus:outline-none transition-transform"
                        title={`Go to ${s.label}`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                            isCurrent
                              ? "bg-accent-lux border-accent-lux text-white scale-110 shadow-lg shadow-accent-lux/30 ring-4 ring-accent-lux/20 font-black"
                              : isCompleted
                                ? "bg-accent-lux border-accent-lux text-white hover:scale-105 shadow-sm"
                                : "bg-background border-slate-200 dark:border-slate-800 text-slate-400 group-hover:border-slate-300 dark:group-hover:border-slate-700"
                          }`}
                        >
                          {isCompleted && !isCurrent ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider mt-2 transition-colors duration-300 ${
                            isCurrent
                              ? "text-accent-lux font-black scale-105"
                              : isCompleted
                                ? "text-accent-lux font-bold"
                                : "text-slate-400"
                          }`}
                        >
                          {s.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Panel Stepper Content */}
            <div className="lg:col-span-8 space-y-6">

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="glass-panel p-6 sm:p-8 shadow-xl rounded-[32px] text-left"
                >

                  {/* STEP 0: Cart Selection & Recommendations */}
                  {step === 0 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                          <ShoppingBag className="w-5 h-5 text-accent-lux" /> Review Service Selections
                        </h2>
                        <p className="text-xs text-slate-450 mt-1">Review items currently slated for your luxury service window.</p>
                      </div>

                      <div className="space-y-3">
                        {cart.length === 0 ? (
                          <div className="py-12 text-center flex flex-col items-center justify-center text-slate-400 space-y-3 bg-slate-50 dark:bg-slate-950/20 rounded-[24px]">
                            <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-800" />
                            <p className="text-xs font-bold uppercase tracking-wider">Your selection is empty</p>
                          </div>
                        ) : (
                          cart.map((item) => {
                            const addonTotal = (item.selectedAddons || []).reduce(
                              (sum, a) => sum + (a.totalPrice || ((a.price || 0) * (a.quantity || 1))),
                              0
                            );
                            const itemTotal = (item.price * item.quantity) + addonTotal;

                            return (
                              <div
                                key={item.id}
                                className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3"
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="text-xs sm:text-sm font-bold text-foreground">{item.name}</span>
                                    <p className="text-[10px] text-slate-450 mt-1 capitalize">{item.category} • {formatDuration(item.duration)} • Qty: {item.quantity}</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm font-bold text-foreground font-sans">₹{itemTotal}</span>
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="text-slate-400 hover:text-red-500 cursor-pointer p-1 rounded-full hover:bg-red-500/5 transition-colors"
                                      title="Remove service"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {item.selectedAddons && item.selectedAddons.length > 0 && (
                                  <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
                                    <span className="text-[10px] uppercase font-bold text-accent-lux flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 animate-pulse" /> Included Add-ons ({item.selectedAddons.length})
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {item.selectedAddons.map((addon) => (
                                        <div key={addon.addonId} className="flex justify-between items-center text-xs bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 px-3 py-2 rounded-xl">
                                          <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate pr-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-accent-lux shrink-0" />
                                            <span className="truncate">{addon.addonName} {addon.quantity > 1 ? `(x${addon.quantity})` : ""}</span>
                                          </span>
                                          <div className="flex items-center gap-2 shrink-0">
                                            <span className="font-bold text-foreground font-sans">+₹{addon.totalPrice || ((addon.price || 0) * (addon.quantity || 1))}</span>
                                            <button
                                              onClick={() => toggleAddonInCart(item.itemId || item.id, addon.addonId, "remove")}
                                              className="text-slate-400 hover:text-rose-500 cursor-pointer p-0.5"
                                              title="Remove add-on"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Add-on Recommendation Cards (Package Addons) */}
                      {cart.length > 0 && cartPackageAddons.length > 0 && (
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 mb-3">
                            <Sparkles className="w-3.5 h-3.5 text-accent-lux animate-pulse" /> Popular Pairing Recommendations
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {cartPackageAddons.map((addon) => {
                              const parentCartItem = cart.find((c) => c.id !== addon.id);
                              const targetCartItemId = parentCartItem?.itemId || parentCartItem?.id || addon.id;
                              const isAdded = (parentCartItem?.selectedAddons || []).some((a) => a.addonId === addon.id) || cart.some((c) => c.id === addon.id);

                              return (
                                <div
                                  key={addon.id}
                                  className="p-4 bg-white dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl text-left transition-all flex flex-col justify-between h-auto group"
                                >
                                  <div>
                                    <div className="flex justify-between items-start">
                                      <span className="text-xs font-bold text-foreground group-hover:text-accent-lux transition-colors">
                                        {addon.name}
                                      </span>
                                      <span className="text-xs font-black text-accent-lux shrink-0">
                                        +₹{addon.price}
                                      </span>
                                    </div>
                                    {addon.description && (
                                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                                        {addon.description}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex justify-end items-center mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                                    <button
                                      onClick={async () => {
                                        const action = isAdded ? "remove" : "add";
                                        await toggleAddonInCart(targetCartItemId, addon.id, action, { addonName: addon.name, price: addon.price });
                                        addNotification(
                                          action === "add" ? "Add-on Added" : "Add-on Removed",
                                          action === "add" ? `"${addon.name}" added to your cart.` : `"${addon.name}" removed from your cart.`,
                                          "info"
                                        );
                                      }}
                                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${isAdded
                                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500 opacity-90"
                                          : "bg-accent-lux text-white hover:bg-accent-lux/90"
                                        }`}
                                    >
                                      {isAdded ? "Added ✓" : <>Add <Plus className="w-3 h-3" /></>}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 1: Premium Schedule Page UI with Active Highlights & Custom Date/Time State */}
                  {step === 1 && (() => {
                    const todayISO = new Date().toISOString().split("T")[0];
                    const isPresetDate = dates.slice(0, 5).some((d) => d.iso === selectedDate);
                    const isCustomDateActive = !!(selectedDate && (!isPresetDate || showCustomDate));
                    const isPresetTime = timeSlots.includes(selectedTimeSlot || "");
                    const isCustomTimeActive = !!(selectedTimeSlot && (!isPresetTime || showCustomTime));

                    return (
                      <div className="space-y-6 text-left">
                        {/* Section Header */}
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h2 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-accent-lux" /> Schedule Arrival Slot
                            </h2>
                            <p className="text-xs text-slate-450 mt-1">Select your preferred date & 1-hour arrival window for service.</p>
                          </div>

                          {/* Selected Slot Quick Badge */}
                          {selectedDate && selectedTimeSlot && (
                            <div className="self-start sm:self-auto px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2.5">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <div className="text-left">
                                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block leading-tight">Selected Arrival</span>
                                <span className="text-xs font-black text-foreground">
                                  {selectedDate} @ {selectedTimeSlot}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* DATE SELECTION SECTION */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-accent-lux" /> 1. Select Service Date
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-400">Next 7 Days</span>
                          </div>

                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {dates.slice(0, 5).map((d) => {
                              const isPast = isPastDate(d.iso);
                              const isSelected = selectedDate === d.iso && !showCustomDate && !isCustomDateActive;
                              return (
                                <button
                                  key={d.iso}
                                  type="button"
                                  disabled={isPast}
                                  onClick={() => {
                                    if (isPast) return;
                                    setSelectedDate(d.iso);
                                    setShowCustomDate(false);
                                  }}
                                  className={`relative py-2 px-1.5 sm:px-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-200 ${
                                    isPast
                                      ? "opacity-40 line-through bg-slate-100 dark:bg-slate-900/40 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed pointer-events-none"
                                      : isSelected
                                      ? "bg-gradient-to-br from-[#782860] via-[#8a2f6e] to-[#a03480] text-white border-transparent shadow-md ring-2 ring-[#782860]/40 scale-103 cursor-pointer"
                                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-[#782860]/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
                                    }`}
                                >
                                  {isSelected && (
                                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-md">
                                      <CheckCircle className="w-3 h-3 fill-emerald-500 text-white" />
                                    </span>
                                  )}
                                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-85">{d.label}</span>
                                  <span className="text-sm font-extrabold my-0.5">{d.dayNum}</span>
                                </button>
                              );
                            })}

                            {/* Custom Date Card Button with Active Indicator */}
                            <div ref={datePickerRef} className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCustomDate((prev) => {
                                    const next = !prev;
                                    if (next) setShowCustomTime(false);
                                    return next;
                                  });
                                  if (!selectedDate || isPresetDate) {
                                    setSelectedDate(todayISO);
                                  }
                                }}
                                className={`w-full h-full py-2 px-1.5 sm:px-2 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${isCustomDateActive || showCustomDate
                                    ? "bg-gradient-to-br from-[#782860] via-[#8a2f6e] to-[#a03480] text-white border-transparent shadow-md ring-2 ring-[#782860]/40 scale-103"
                                    : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-[#782860]/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                                  }`}
                              >
                                {(isCustomDateActive || showCustomDate) && (
                                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-md">
                                    <CheckCircle className="w-3 h-3 fill-emerald-500 text-white" />
                                  </span>
                                )}
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-current" />
                                  <span className="text-[9px] font-bold uppercase tracking-wider">Custom</span>
                                </div>
                                <span className="text-[10px] font-extrabold mt-1 truncate max-w-full">
                                  {isCustomDateActive && selectedDate ? selectedDate : "Calendar"}
                                </span>
                              </button>

                              {/* Floating Calendar Popover */}
                              <AnimatePresence>
                                {showCustomDate && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                    transition={{ duration: 0.18 }}
                                    className="absolute top-full right-0 mt-2 z-50 shadow-2xl rounded-3xl"
                                  >
                                    <InlineCustomDatePicker
                                      selectedDate={selectedDate}
                                      onSelectDate={(iso) => {
                                        setSelectedDate(iso);
                                        setShowCustomDate(false);
                                      }}
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>

                        {/* TIME SELECTION SECTION */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-accent-lux" /> 2. Select Arrival Time Window
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-400">1-Hour Arrival Window</span>
                          </div>

                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
                            {timeSlots.map((slot) => {
                              const isPast = isPastTime(slot, selectedDate);
                              const isSelected = selectedTimeSlot === slot && !isCustomTimeActive && !showCustomTime;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  disabled={isPast}
                                  onClick={() => {
                                    if (isPast) return;
                                    setSelectedTimeSlot(slot);
                                    setShowCustomTime(false);
                                  }}
                                  className={`relative py-2 px-2 rounded-xl border text-center text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                                    isPast
                                      ? "opacity-40 line-through bg-slate-100 dark:bg-slate-900/40 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed pointer-events-none"
                                      : isSelected
                                      ? "bg-gradient-to-br from-[#782860] via-[#8a2f6e] to-[#a03480] text-white border-transparent shadow-md ring-2 ring-[#782860]/40 scale-103 cursor-pointer"
                                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-[#782860]/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
                                    }`}
                                >
                                  {isSelected && (
                                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-md">
                                      <CheckCircle className="w-3 h-3 fill-emerald-500 text-white" />
                                    </span>
                                  )}
                                  {slot}
                                </button>
                              );
                            })}

                            {/* Custom Time Card Button with Active Indicator */}
                            <div ref={timePickerRef} className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCustomTime((prev) => {
                                    const next = !prev;
                                    if (next) setShowCustomDate(false);
                                    return next;
                                  });
                                  if (!selectedTimeSlot || isPresetTime) {
                                    setSelectedTimeSlot("09:00 AM");
                                  }
                                }}
                                className={`w-full h-full py-2 px-2 rounded-xl border text-center cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 ${isCustomTimeActive || showCustomTime
                                    ? "bg-gradient-to-br from-[#782860] via-[#8a2f6e] to-[#a03480] text-white border-transparent shadow-md ring-2 ring-[#782860]/40 scale-103"
                                    : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-[#782860]/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                                  }`}
                              >
                                {(isCustomTimeActive || showCustomTime) && (
                                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-md">
                                    <CheckCircle className="w-3 h-3 fill-emerald-500 text-white" />
                                  </span>
                                )}
                                <Clock className="w-3.5 h-3.5 text-current shrink-0" />
                                <span className="text-xs font-bold truncate">
                                  {isCustomTimeActive && selectedTimeSlot ? selectedTimeSlot : "Custom"}
                                </span>
                              </button>

                              {/* Floating Time Popover */}
                              <AnimatePresence>
                                {showCustomTime && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                    transition={{ duration: 0.18 }}
                                    className="absolute bottom-full right-0 mb-2 z-50 shadow-2xl rounded-3xl"
                                  >
                                    <InlineCustomTimePicker
                                      selectedTime={selectedTimeSlot}
                                      selectedDate={selectedDate}
                                      onSelectTime={(time12) => {
                                        setSelectedTimeSlot(time12);
                                        setShowCustomTime(false);
                                      }}
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>

                        {/* IMPORTANT AVAILABILITY NOTE BANNER */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/70 dark:border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-left">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                              <Info className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h4 className="text-[11px] font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                                Real-Time Arrival Window
                              </h4>
                              <p className="text-[11px] text-amber-900/90 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                                Arrival time slots update dynamically based on real-time specialist availability in your area.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] rounded-lg flex items-center gap-1 border border-amber-500/20">
                              <Sparkles className="w-3 h-3 text-amber-500" /> Live Scheduling
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* STEP 2: Premium Address UI & Form */}
                  {step === 2 && (
                    <div className="space-y-6 text-left">
                      {!token || !isLoggedIn ? (
                        <div className="p-8 sm:p-10 bg-gradient-to-br from-slate-900 via-[#48073d] to-slate-950 text-white rounded-3xl border border-purple-500/30 shadow-2xl text-center space-y-6">
                          <div className="w-16 h-16 rounded-3xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center mx-auto text-purple-300 shadow-inner">
                            <UserPlus className="w-8 h-8" />
                          </div>

                          <div className="max-w-md mx-auto space-y-2">
                            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                              Sign In or Sign Up to Continue
                            </h3>
                            <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
                              To select your service address and place your booking, please sign in to your HelpMate account or register a new account.
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 max-w-sm mx-auto">
                            <Link
                              href="/login?redirect=%2Fbooking%3Fstep%3D2"
                              className="w-full sm:w-1/2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <User className="w-4 h-4" />
                              <span>Sign In</span>
                            </Link>
                            <Link
                              href="/register?redirect=%2Fbooking%3Fstep%3D2"
                              className="w-full sm:w-1/2 py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs sm:text-sm border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <UserPlus className="w-4 h-4" />
                              <span>Sign Up</span>
                            </Link>
                          </div>

                          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-purple-300/70 font-medium">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Without sign in, service booking cannot be placed</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Section Header */}
                          <div className="border-b border-slate-100 dark:border-slate-800 pb-5 flex items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2.5 py-0.5 rounded-full bg-[#782860]/10 text-[#782860] dark:bg-[#782860]/20 dark:text-purple-300 text-[10px] font-black tracking-wider uppercase">
                                  Step 3 of 4
                                </span>
                                <span className="text-xs text-slate-400 font-medium">• Service Location</span>
                              </div>
                              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
                                <MapPin className="w-6 h-6 text-[#782860]" /> Select Service Location
                              </h2>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Specify where our verified professional team will arrive to deliver service.</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (showAddAddress) {
                                  setShowAddAddress(false);
                                  setEditingAddress(null);
                                } else {
                                  setEditingAddress(null);
                                  setShowAddAddress(true);
                                }
                              }}
                              className="px-4 py-2 bg-[#782860]/10 text-[#782860] dark:bg-[#782860]/20 dark:text-purple-300 hover:bg-[#782860] hover:text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                            >
                              <Plus className="w-4 h-4" /> {showAddAddress ? "Cancel" : "Add Address"}
                            </button>
                          </div>

                          {/* Add Address Form Drawer Panel */}
                          <AnimatePresence>
                            {showAddAddress && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <AddAddressForm
                                  initialData={editingAddress || undefined}
                                  onSave={async (savedAddr) => {
                                    let success = false;
                                    if (editingAddress) {
                                      success = await updateAddressAsync(editingAddress.id, savedAddr);
                                    } else {
                                      success = await addAddressAsync(savedAddr);
                                    }
                                    if (success) {
                                      setEditingAddress(null);
                                      setShowAddAddress(false);
                                    }
                                  }}
                                  onCancel={() => {
                                    setEditingAddress(null);
                                    setShowAddAddress(false);
                                  }}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Existing Address Cards Grid */}
                          <div className="space-y-3">
                            {addresses.map((addr) => {
                              const isSelected = selectedAddressId === addr.id;
                              const TagIcon = addr.tag.toLowerCase().includes("work") || addr.tag.toLowerCase().includes("office") ? Briefcase : addr.tag.toLowerCase().includes("home") ? Home : Building;
                              const RecipientIcon = addr.recipientType === "Family Member" ? Users : addr.recipientType === "Friend / Neighbor" ? HeartHandshake : addr.recipientType === "Office / Work" ? Briefcase : User;

                              return (
                                <div
                                  key={addr.id}
                                  onClick={() => setSelectedAddressId(addr.id)}
                                  className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 flex items-start justify-between gap-4 select-none ${isSelected
                                      ? "border-[#782860] bg-gradient-to-r from-[#782860]/5 via-purple-500/5 to-transparent shadow-md ring-2 ring-[#782860]/30 scale-[1.01]"
                                      : "border-slate-200 dark:border-slate-800/80 hover:border-[#782860]/40 bg-slate-50/50 dark:bg-slate-950/40"
                                    }`}
                                >
                                  <div className="flex items-start gap-3.5">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${isSelected ? "border-[#782860] bg-[#782860]" : "border-slate-300 dark:border-slate-700"
                                      }`}>
                                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <div className="space-y-1.5 text-left">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider ${isSelected
                                            ? "bg-[#782860] text-white"
                                            : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                          }`}>
                                          <TagIcon className="w-3 h-3" />
                                          {addr.tag}
                                        </span>

                                        {addr.recipientType && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                                            <RecipientIcon className="w-3 h-3" />
                                            {addr.recipientType}
                                          </span>
                                        )}

                                        {addr.locality && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 font-mono">
                                            <MapPin className="w-3 h-3" />
                                            {addr.locality} ({addr.pincode || "Varanasi"})
                                          </span>
                                        )}
                                      </div>

                                      {(addr.recipientName || addr.recipientPhone || addr.recipientMobile) && (
                                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs font-black text-foreground">
                                          <span>{addr.recipientName}</span>
                                          {(addr.recipientPhone || addr.recipientMobile) && (
                                            <span className="text-xs font-bold text-slate-500 font-mono">
                                              ({addr.recipientPhone || addr.recipientMobile})
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                                        {addr.addressLine}
                                        {addr.landmark && (
                                          <span className="text-slate-500 dark:text-slate-400">, {addr.landmark.toLowerCase().startsWith("near") ? addr.landmark : `Near ${addr.landmark}`}</span>
                                        )}
                                        {addr.locality && <span className="text-slate-500 dark:text-slate-400">, {addr.locality}</span>}
                                        {addr.pincode && <span className="text-slate-500 dark:text-slate-400"> - {addr.pincode}</span>}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingAddress(addr);
                                        setShowAddAddress(true);
                                      }}
                                      className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                    >
                                      <Edit3 className="w-3 h-3" /> Edit
                                    </button>

                                    {isSelected && (
                                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[10px] rounded-xl flex items-center gap-1 border border-emerald-500/20">
                                        <CheckCircle className="w-3 h-3" /> Selected
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* STEP 3: Secure Payment details */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-accent-lux" /> Complete Secure Checkout
                        </h2>
                        <p className="text-xs text-slate-450 mt-1">Select authorization method. No amount will be debited until work is done.</p>
                      </div>

                      {/* Payment Options List */}
                      <div className="space-y-3">
                        {/* Pay After Service - Available & Selected */}
                        <div
                          onClick={() => setPaymentMethod("pay_after")}
                          className="flex items-start justify-between p-4 sm:p-5 rounded-2xl border-2 border-accent-lux bg-accent-lux/5 dark:bg-accent-lux/10 cursor-pointer transition-all shadow-xs"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="w-5 h-5 rounded-full border-2 border-accent-lux flex items-center justify-center shrink-0 mt-0.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-accent-lux" />
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-accent-lux/15 text-accent-lux flex items-center justify-center shrink-0">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-extrabold text-foreground">Pay After Service</span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-[9px] font-black uppercase tracking-wider">
                                  Available
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                Pay only after your service is fully completed to your total satisfaction. No advance payment required.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Instant UPI - Not Available */}
                        <div
                          className="flex items-start justify-between p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-55 cursor-not-allowed select-none"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5" />
                            <div className="w-10 h-10 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                              <Smartphone className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Instant UPI (GPay / PhonePe / Paytm)</span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300/50 dark:border-slate-700 text-[9px] font-black uppercase tracking-wider">
                                  Not Available
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                                Online UPI payment is temporarily unavailable.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Credit / Debit Card - Not Available */}
                        <div
                          className="flex items-start justify-between p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-55 cursor-not-allowed select-none"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5" />
                            <div className="w-10 h-10 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Credit / Debit Card</span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300/50 dark:border-slate-700 text-[9px] font-black uppercase tracking-wider">
                                  Not Available
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                                Card payment gateway is temporarily unavailable.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Success confirmation screen */}
                  {step === 4 && (
                    <div className="flex flex-col items-center justify-center text-center py-10 space-y-6 max-w-xl mx-auto">
                      <div className="w-16 h-16 rounded-full bg-success-lux/10 border border-success-lux/20 flex items-center justify-center text-success-lux">
                        <CheckCircle className="w-10 h-10 animate-bounce" />
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-2xl font-black text-foreground tracking-tight">Luxury Service Booked!</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                          Your booking ID is <span className="font-extrabold text-foreground">{createdBookingId}</span>. We've assigned a top background-verified partner who will arrive on schedule.
                        </p>
                      </div>

                      <div className="w-full bg-slate-50 dark:bg-slate-950/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 text-left space-y-4 shadow-sm">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest font-black">
                          <span>Booking Summary</span>
                          <span>Invoice Ready</span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-650 dark:text-slate-350">
                          <p><strong>Scheduled Date:</strong> {selectedDate}</p>
                          <p><strong>Arrival Window:</strong> {selectedTimeSlot}</p>
                          <p><strong>Total Authorized:</strong> ₹{total}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                          onClick={() => router.push(`/invoices/${createdBookingId}`)}
                          className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-full shadow-md cursor-pointer transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700"
                        >
                          <FileText className="w-4 h-4 text-accent-lux" />
                          <span>View Invoice</span>
                        </button>
                        <button
                          onClick={() => router.push("/profile?tab=bookings")}
                          className="px-8 py-3.5 bg-accent-lux hover:bg-accent-lux/95 text-white font-bold text-xs rounded-full shadow-lg cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
                        >
                          Track Professional Timeline
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Stepper Navigation Actions */}
                  {step < 4 && (
                    <div className="flex justify-between items-center pt-8 border-t border-slate-100 dark:border-slate-800/80 mt-8 gap-4">
                      {step > 0 ? (
                        <button
                          onClick={handlePrevStep}
                          className="px-5 py-3 rounded-full border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                      ) : (
                        <div />
                      )}

                      <button
                        onClick={handleNextStep}
                        className="px-6 py-3 rounded-full bg-accent-lux hover:bg-accent-lux/95 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-transform duration-300 hover:scale-103 active:scale-97"
                      >
                        {step === 3 ? "Authorize & Book" : "Continue"} <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Sticky Summary Sidebar */}
            {step <= 4 && (
              <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">

                {/* Price Breakdown Invoice Card */}
                <div className="glass-panel p-6 space-y-5 text-left">
                  <div>
                    <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Booking Invoice</h3>
                  </div>

                  <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Services Base Subtotal</span>
                      <span className="font-bold text-foreground">₹{itemsSubtotal}</span>
                    </div>

                    {addonSubtotal > 0 && (
                      <div className="flex justify-between items-center text-accent-lux font-bold">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-accent-lux" /> Selected Add-ons Subtotal
                        </span>
                        <span>+₹{addonSubtotal}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-extrabold border-t border-slate-100/60 dark:border-slate-800/60 pt-2">
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>

                    {couponDiscount > 0 && (
                      <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>Promo Coupon ({appliedCoupon})</span>
                        <span>-₹{couponDiscount}</span>
                      </div>
                    )}

                    {memberDiscount > 0 && (
                      <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 font-bold">
                        <span className="flex items-center gap-1">👑 VIP Member Discount (15%)</span>
                        <span>-₹{memberDiscount}</span>
                      </div>
                    )}

                    {hasGst && gst > 0 && (
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Taxes &amp; GST ({gstRate}%)</span>
                        <span className="font-bold text-foreground">₹{gst}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-slate-500">
                      <span>Convenience & Dispatch Fee</span>
                      <span className="font-bold text-foreground">{convenienceFee > 0 ? `₹${convenienceFee}` : "FREE"}</span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4 text-sm">
                      <span className="font-extrabold text-foreground">Total Due Now</span>
                      <span className="font-black text-accent-lux text-base">₹{grandTotal}</span>
                    </div>
                  </div>

                  {/* Promo Coupon Section inside Summary Card */}
                  {/* <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Discount Coupon</span>
                      <button
                        type="button"
                        onClick={() => setShowCouponsSlider(true)}
                        className="text-[11px] font-extrabold text-[#782860] dark:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Tag className="w-3 h-3" /> View Offers (5)
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-lux animate-fadeIn"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-750 text-xs font-bold text-white cursor-pointer transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="text-[10px] text-red-500 pl-2 animate-shake">{couponError}</p>}
                    {appliedCoupon && (
                      <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3.5 py-2 rounded-xl text-[11px] font-bold animate-fadeIn">
                        <span className="flex items-center gap-1.5"><Percent className="w-3.5 h-3.5 text-emerald-500" /> Code {appliedCoupon} Active</span>
                        <button onClick={removeCoupon} className="hover:underline text-[10px] text-rose-500 cursor-pointer">Remove</button>
                      </div>
                    )}
                  </div> */}

                  <div className="space-y-3 text-[10px] text-slate-400 dark:text-slate-455 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> Flat-rate guaranteed pricing
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#782860]" /> Arrives within the scheduling window
                    </div>
                  </div>
                </div>

                {/* MEMBERSHIP PROMOTIONAL CARD */}
                {/* <MembershipBanner variant="checkout" /> */}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Available Admin Coupons Slider / Drawer */}
      <AvailableCouponsSlider
        isOpen={showCouponsSlider}
        onClose={() => setShowCouponsSlider(false)}
        cartTotal={subtotal}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={(code) => {
          applyCoupon(code);
          addNotification("Coupon Applied!", `Code ${code} discount activated.`, "success");
        }}
        onRemoveCoupon={removeCoupon}
      />

      <Footer />
    </>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">Loading booking details...</div>}>
      <BookingContent />
    </Suspense>
  );
}
