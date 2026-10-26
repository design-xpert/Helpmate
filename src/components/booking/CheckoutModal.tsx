"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  X,
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
  Phone,
  Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, Address, CartItem, getItemAddonTotal, extractStoredCartAddons } from "@/store/useStore";
import confetti from "canvas-confetti";
import { InlineCustomDatePicker, InlineCustomTimePicker } from "@/components/booking/CustomDateTimePickerModal";
import { isPastDate, isPastTime, formatDuration, formatDDMMYYYY, formatScheduleDateTime } from "@/utils/dateTime";
import { AvailableCouponsSlider } from "@/components/booking/AvailableCouponsSlider";
import { AddAddressForm } from "@/components/booking/AddAddressForm";
import MembershipBanner from "@/components/membership/MembershipBanner";
import { fetchScheduleAvailabilityApi } from "@/services/scheduleApi";
import { formatImageUrl } from "@/utils/image";
import { CartPackageImage } from "@/components/booking/CartPackageImage";
import { CartAddonImage } from "@/components/booking/CartAddonImage";
import { toast } from "@/components/common/Toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceCategory: string;
  serviceDuration: number;
  serviceImage?: string;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  serviceId,
  serviceName,
  servicePrice,
  serviceCategory,
  serviceDuration,
  serviceImage
}: Props) {
  const router = useRouter();
  const {
    cart,
    packageAddonsMap,
    addToCart,
    removeFromCart,
    toggleAddonInCart,
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
    isMember,
    isLoggedIn,
    token
  } = useStore();

  useEffect(() => {
    if (isOpen && token) {
      fetchAddresses();
    }
  }, [isOpen, token, fetchAddresses]);

  const [step, setStep] = useState(0); // 0: Addons/Cart, 1: Schedule, 2: Address, 3: Payment
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // New address form state
  const [newTag, setNewTag] = useState<Address["tag"]>("Home");
  const [newAddressLine, setNewAddressLine] = useState("");
  const [newCity, setNewCity] = useState("Varanasi");

  // Custom Date & Time expand state & refs
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [showCustomTime, setShowCustomTime] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);

  // Dynamic schedule availability from backend API
  const [availableDates, setAvailableDates] = useState<{ label: string; dayNum: number; fullDate: string; iso: string; available?: boolean }[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, token]);

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

  const [packageImageMap] = useState<Record<string, string>>({});
  // Instant synchronous computation from cart & store - ZERO delay, NO API calls!
  const cartPackageAddons = useMemo(() => {
    return extractStoredCartAddons(cart, packageAddonsMap);
  }, [cart, packageAddonsMap]);

  // Initialize cart with current service if empty
  useEffect(() => {
    if (isOpen && cart.length === 0) {
      addToCart({
        id: serviceId,
        name: serviceName,
        price: servicePrice,
        category: serviceCategory,
        duration: serviceDuration,
        image: serviceImage || (serviceId ? `/api/media/package/${serviceId}/image` : undefined)
      });
    }
  }, [isOpen, serviceId, serviceName, servicePrice, serviceCategory, serviceDuration, serviceImage, cart, addToCart]);

  if (!isOpen) return null;

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

  const handleApplyCoupon = () => {
    setCouponError("");
    const success = applyCoupon(couponInput);
    if (success) {
      toast.success("Coupon Applied", `Promo code "${couponInput}" discount activated!`);
      setCouponInput("");
    } else {
      const msg = "Invalid or expired coupon code.";
      setCouponError(msg);
      toast.error("Invalid Coupon", msg);
    }
  };

  const handleAddAddressSubmit = async () => {
    if (!newAddressLine.trim()) {
      toast.error("Address Required", "Please enter a valid service address.");
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

  const isStepCompleted = (idx: number): boolean => {
    if (idx === 0) return cart.length > 0;
    if (idx === 1) return isStepCompleted(0) && Boolean(selectedDate && selectedTimeSlot);
    if (idx === 2) return isStepCompleted(1) && Boolean((token || isLoggedIn) && selectedAddressId && addresses.some((a) => a.id === selectedAddressId));
    if (idx === 3) return step === 4;
    return false;
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep === step) return;

    // Going backwards is always permitted
    if (targetStep < step) {
      setStep(targetStep);
      modalBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Jumping forward: check requirements
    if (targetStep >= 1 && cart.length === 0) {
      toast.error("Cart is Empty", "Your cart is empty. Please select a service to continue.");
      return;
    }

    if (targetStep >= 2 && (!selectedDate || !selectedTimeSlot)) {
      toast.error("Schedule Required", "Please select a date and arrival time window.");
      setStep(1);
      modalBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (targetStep >= 3) {
      if (!token || !isLoggedIn) {
        toast.error("Sign In Required", "Without Sign In or Sign Up, you cannot select an address or book any service.");
        setStep(2);
        modalBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (!selectedAddressId) {
        toast.error("Address Required", "Please select or add a service address.");
        setStep(2);
        modalBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    setStep(targetStep);
    modalBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextStep = () => {
    if (step === 0 && cart.length === 0) {
      toast.error("Cart is Empty", "Your cart is empty. Please select a service to continue.");
      return;
    }
    if (step === 1 && (!selectedDate || !selectedTimeSlot)) {
      toast.error("Schedule Required", "Please select a date and arrival time window.");
      return;
    }
    if (step === 2 && (!token || !isLoggedIn)) {
      toast.error("Sign In Required", "Without Sign In or Sign Up, you cannot select an address or book any service.");
      return;
    }
    if (step === 2 && !selectedAddressId) {
      toast.error("Address Required", "Please select or add a service address.");
      return;
    }
    if (step < 3) {
      setStep(step + 1);
      modalBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      if (!token || !isLoggedIn) {
        toast.error("Authentication Required", "Please Sign In or Sign Up to book a service.");
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
            modalBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 }
            });
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
      modalBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<"pay_after" | "upi" | "card" | "cod">("pay_after");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [showCouponsSlider, setShowCouponsSlider] = useState(false);

  // Simulated booking tracking
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Pricing math
  const itemsSubtotal = cartPricing?.itemsSubtotal ?? cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const addonSubtotal = cartPricing?.addonSubtotal ?? cart.reduce((sum, item) => sum + getItemAddonTotal(item), 0);
  const subtotal = cartPricing?.subtotal ?? (itemsSubtotal + addonSubtotal);
  let couponDiscount = 0;
  if (appliedCoupon === "HELPMATE20") couponDiscount = Math.min(300, Math.round(subtotal * 0.20));
  else if (appliedCoupon === "LUXURY50") couponDiscount = 150;
  else if (appliedCoupon === "COOLING100") couponDiscount = 100;
  else if (appliedCoupon === "SUPERFEST") couponDiscount = Math.min(500, Math.round(subtotal * 0.25));
  else if (appliedCoupon === "WELCOME100") couponDiscount = 100;
  else if (appliedCoupon === "SUPERDEAL") couponDiscount = Math.min(1000, Math.round(subtotal * 0.25));

  const memberDiscount = isMember ? Math.round(subtotal * 0.15) : 0;
  const discount = couponDiscount + memberDiscount;
  const availableGstAmount = typeof cartPricing?.gst === "number" && cartPricing.gst > 0 ? Number(cartPricing.gst) : 0;
  const gstRate = cartPricing?.gstRate ?? 18;
  const hasGst = availableGstAmount > 0;
  const gst = availableGstAmount;
  const convenienceFee = cartPricing?.convenienceFee ?? (subtotal > 0 ? 49 : 0);
  const grandTotal = cartPricing && discount === 0 && !hasGst
    ? cartPricing.grandTotal
    : Math.max(0, Math.round((subtotal - discount + gst + convenienceFee) * 100) / 100);
  const total = grandTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden my-8 relative text-left border border-slate-200 dark:border-slate-800"
      >
        {/* Modal Header */}
        <div className="p-6 bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-lux/10 flex items-center justify-center text-accent-lux">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-foreground tracking-tight">Express Checkout</h3>
              <p className="text-[11px] text-slate-400">Complete your luxury service reservation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Header Bar */}
        {step < 4 && (() => {
          const activeProgressIndex = Math.max(
            step,
            isStepCompleted(2) ? 3 : isStepCompleted(1) ? 2 : isStepCompleted(0) ? 1 : 0
          );

          return (
            <div className="px-3 sm:px-8 pt-5 sm:pt-6 pb-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/20 w-full overflow-hidden">
              <div className="flex items-center justify-between relative max-w-lg mx-auto">
                <div className="absolute left-[14px] sm:left-[18px] right-[14px] sm:right-[18px] top-[14px] sm:top-[18px] h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
                <div
                  className="absolute left-[14px] sm:left-[18px] top-[14px] sm:top-[18px] h-0.5 bg-accent-lux -translate-y-1/2 transition-all duration-500 z-0"
                  style={{ width: `calc(${(activeProgressIndex / 3) * 100}% - ${(activeProgressIndex / 3) * 28}px)` }}
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
                        className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isCurrent
                            ? "bg-accent-lux border-accent-lux text-white scale-110 shadow-lg shadow-accent-lux/30 ring-4 ring-accent-lux/20 font-black"
                            : isCompleted
                              ? "bg-accent-lux border-accent-lux text-white hover:scale-105 shadow-sm"
                              : "bg-background border-slate-200 dark:border-slate-800 text-slate-400 group-hover:border-slate-300 dark:group-hover:border-slate-700"
                        }`}
                      >
                        {isCompleted && !isCurrent ? (
                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                        ) : (
                          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                      </div>
                      <span
                        className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider mt-1.5 sm:mt-2 transition-colors duration-300 ${
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

        {/* Modal Body */}
        <div ref={modalBodyRef} className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
          {/* STEP 0: Cart Review */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-accent-lux" /> Review Service Selections
                </h4>
              </div>

              {/* BOOKED PACKAGES LIST */}
              <div className="space-y-3">
                {cart.length === 0 ? (
                  <div className="py-12 sm:py-14 px-6 text-center flex flex-col items-center justify-center space-y-4 bg-slate-50/70 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/80">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent-lux/10 dark:bg-accent-lux/15 flex items-center justify-center text-accent-lux shadow-xs">
                      <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-accent-lux stroke-[1.75]" />
                    </div>
                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                        No services selected
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        You&apos;ve removed all services from your selection. Add a service to continue booking.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          router.push("/search?view=categories");
                        }}
                        className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-accent-lux hover:bg-accent-lux/95 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-accent-lux/25 transition-all cursor-pointer"
                      >
                        Add Services
                      </button>
                    </div>
                  </div>
                ) : (
                  cart.map((item) => {
                    const addonTotal = (item.selectedAddons || []).reduce(
                      (sum, a) => sum + (a.totalPrice || ((a.price || 0) * (a.quantity || 1))),
                      0
                    );
                    const itemBasePrice = item.price * item.quantity;
                    const itemTotal = itemBasePrice + addonTotal;
                    const rawPkgId = item.packageId || item.itemId || item.id;
                    const hexMatch = String(rawPkgId).match(/[0-9a-fA-F]{24}/);
                    const cleanPkgId = hexMatch ? hexMatch[0] : rawPkgId;
                    const itemImg = item.imageUrl || item.image || packageImageMap[item.id] || (item.itemId && packageImageMap[item.itemId]) || (cleanPkgId && packageImageMap[cleanPkgId]) || packageImageMap[item.name];

                    return (
                      <div
                        key={item.id}
                        className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex justify-between items-center gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <CartPackageImage
                              src={itemImg}
                              name={item.name}
                              category={item.category}
                              pkgId={cleanPkgId}
                              className="w-12 h-12 rounded-xl"
                            />
                            <div className="min-w-0 flex-1 text-left">
                              <span className="text-xs font-bold text-foreground block truncate">{item.name}</span>
                              <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{item.category} • {formatDuration(item.duration)} • Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="text-xs font-extrabold text-foreground font-sans block">₹{itemBasePrice}</span>
                              {addonTotal > 0 && (
                                <span className="text-[9px] font-semibold text-accent-lux font-sans block">₹{addonTotal} addons</span>
                              )}
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-slate-400 hover:text-red-500 cursor-pointer p-1 rounded-lg"
                              title="Remove service"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ADDED ADD-ONS SECTION - Shown Below Packages */}
              {(() => {
                const allAddedAddons = cart.flatMap((item) =>
                  (item.selectedAddons || []).map((addon) => ({
                    ...addon,
                    parentItemId: item.itemId || item.id,
                    parentItemName: item.name,
                  }))
                );

                if (allAddedAddons.length === 0) return null;

                const addonGrandTotal = allAddedAddons.reduce(
                  (sum, a) => sum + (a.totalPrice || ((a.price || 0) * (a.quantity || 1))),
                  0
                );

                return (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-accent-lux tracking-wider flex items-center gap-1.5">
                        Included Add-ons ({allAddedAddons.length})
                      </span>
                      <span className="text-xs font-bold text-slate-500 font-sans">
                        Total: ₹{addonGrandTotal}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allAddedAddons.map((addon) => (
                        <div
                          key={`${addon.parentItemId}-${addon.addonId}`}
                          className="p-2 sm:p-2.5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <CartAddonImage
                              src={addon.imageUrl || addon.image}
                              name={addon.addonName}
                              addonId={addon.addonId}
                              className="w-9 h-9 rounded-lg"
                            />
                            <div className="min-w-0 flex-1 text-left">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-foreground block truncate">
                                  {addon.addonName} {addon.quantity > 1 ? `(x${addon.quantity})` : ""}
                                </span>
                                <span className="text-xs font-extrabold text-accent-lux font-sans shrink-0">
                                  ₹{addon.totalPrice || ((addon.price || 0) * (addon.quantity || 1))}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">
                                For: <span className="font-semibold text-slate-600 dark:text-slate-300">{addon.parentItemName}</span>
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => toggleAddonInCart(addon.parentItemId, addon.addonId, "remove")}
                            className="text-slate-400 hover:text-rose-500 cursor-pointer p-1 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0"
                            title="Remove add-on"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* AVAILABLE ADD-ONS SECTION - Shown Below Everything */}
              {cart.length > 0 && cartPackageAddons.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                      Popular Pairing Recommendations
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">Available Add-ons</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cartPackageAddons.map((addon) => {
                      const targetCartItem = cart.find(
                        (c) => String(c.id) === String(addon.packageId) ||
                               String(c.itemId) === String(addon.packageId) ||
                               String(c.packageId) === String(addon.packageId) ||
                               (addon.packageId && (String(c.id).includes(addon.packageId) || String(c.itemId).includes(addon.packageId))) ||
                               (addon.packageName && c.name.toLowerCase() === addon.packageName.toLowerCase())
                      ) || cart[0];
                      const targetCartItemId = targetCartItem?.itemId || targetCartItem?.id || addon.packageId || addon.id;
                      const isAdded = (targetCartItem?.selectedAddons || []).some((a) => a.addonId === addon.id);

                      return (
                        <div
                          key={`${addon.packageId || 'pkg'}-${addon.id}`}
                          className="p-2 sm:p-2.5 bg-white dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 shadow-2xs hover:shadow-xs rounded-xl text-left transition-all flex items-center justify-between gap-2 group hover:border-accent-lux/40"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <CartAddonImage
                              src={addon.imageUrl}
                              name={addon.name}
                              addonId={addon.id}
                              className="w-9 h-9 rounded-lg"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-foreground group-hover:text-accent-lux transition-colors truncate">
                                  {addon.name}
                                </span>
                                <span className="text-xs font-extrabold text-accent-lux font-sans shrink-0">
                                  ₹{addon.price}
                                </span>
                              </div>
                              {addon.packageName && cart.length > 1 && (
                                <span className="text-[10px] text-slate-400 font-medium block truncate">
                                  For: {addon.packageName}
                                </span>
                              )}
                              {addon.description && (
                                <p className="text-[10px] text-slate-400 line-clamp-1">
                                  {addon.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={async () => {
                              const action = isAdded ? "remove" : "add";
                              await toggleAddonInCart(targetCartItemId, addon.id, action, {
                                addonName: addon.name,
                                price: addon.price,
                                imageUrl: addon.imageUrl,
                              });
                              toast.success(
                                action === "add" ? `"${addon.name}" added.` : `"${addon.name}" removed.`
                              );
                            }}
                            className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isAdded
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500 opacity-90"
                                : "bg-accent-lux text-white hover:bg-accent-lux/90"
                            }`}
                          >
                            {isAdded ? "Added ✓" : "Add"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MEMBERSHIP PROMOTIONAL BANNER */}
              <MembershipBanner variant="compact" />
            </div>
          )}

          {/* STEP 1: Quick Cards with Active Highlight State */}
          {step === 1 && (() => {
            const todayISO = new Date().toISOString().split("T")[0];
            const isPresetDate = dates.slice(0, 5).some((d) => d.iso === selectedDate);
            const isCustomDateActive = !!(selectedDate && (!isPresetDate || showCustomDate));
            const isPresetTime = timeSlots.includes(selectedTimeSlot || "");
            const isCustomTimeActive = !!(selectedTimeSlot && (!isPresetTime || showCustomTime));

            return (
              <div className="space-y-6 text-left">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#782860]" /> Schedule Arrival Slot
                  </h4>
                </div>

                <div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
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
                          <span className="text-[9px] font-bold uppercase tracking-wider opacity-85">{d.label}</span>
                          <span className="text-sm font-extrabold my-0.5">{d.dayNum}</span>
                        </button>
                      );
                    })}

                    {/* Custom Date Card Button */}
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
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-current" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Custom</span>
                        </div>
                        <span className="text-[10px] font-extrabold mt-1 truncate max-w-full">
                          {isCustomDateActive && selectedDate ? formatDDMMYYYY(selectedDate) : "Calendar"}
                        </span>
                      </button>

                      {/* Floating Popover on Top */}
                      <AnimatePresence>
                        {showCustomDate && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.96 }}
                            transition={{ duration: 0.18 }}
                            className="absolute bottom-full right-0 mb-2 z-50 shadow-2xl rounded-2xl"
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

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 relative">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#782860]" /> Select Arrival Time Window
                    </h4>
                    <span className="text-[11px] font-semibold text-slate-400">1-Hour Arrival Window</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 mt-3">
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
                          {slot}
                        </button>
                      );
                    })}

                    {/* Custom Time Card Button */}
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
                        <Clock className="w-3.5 h-3.5 text-current shrink-0" />
                        <span className="text-xs font-bold truncate">
                          {isCustomTimeActive && selectedTimeSlot ? selectedTimeSlot : "Custom"}
                        </span>
                      </button>

                      {/* Floating Popover on Top */}
                      <AnimatePresence>
                        {showCustomTime && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.96 }}
                            transition={{ duration: 0.18 }}
                            className="absolute bottom-full right-0 mb-2 z-50 shadow-2xl rounded-2xl"
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
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 bg-amber-50/70 dark:bg-amber-950/25 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                        Important Availability Note
                      </h4>
                      <p className="text-xs text-amber-900/90 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                        Please note: Available dates and arrival time slots may vary depending on service type, location, and real-time partner availability. Schedules are updated dynamically and may differ over time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* STEP 2: Address configuration */}
          {step === 2 && (
            <div className="space-y-6 text-left">
              {!token || !isLoggedIn ? (
                <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-[#48073d] to-slate-950 text-white rounded-3xl border border-purple-500/30 shadow-2xl text-center space-y-6">
                  <div className="w-16 h-16 rounded-3xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center mx-auto text-purple-300 shadow-inner">
                    <UserPlus className="w-8 h-8" />
                  </div>

                  <div className="max-w-md mx-auto space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Sign In or Sign Up to Continue
                    </h3>
                    <p className="text-xs text-purple-200/80 leading-relaxed">
                      To select your service location and place a booking, please sign in to your HelpMate account or register a new account.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-sm mx-auto">
                    <Link
                      href="/login?redirect=%2Fbooking%3Fstep%3D2"
                      onClick={onClose}
                      className="w-full sm:w-1/2 py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      <span>Sign In</span>
                    </Link>
                    <Link
                      href="/register?redirect=%2Fbooking%3Fstep%3D2"
                      onClick={onClose}
                      className="w-full sm:w-1/2 py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Sign Up</span>
                    </Link>
                  </div>

                  <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-purple-300/70 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Without sign in, service booking cannot be placed</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#782860]" /> Select Service Location
                      </h4>
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
                      className={`px-3.5 py-1.5 font-extrabold text-xs rounded-2xl transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                        showAddAddress
                          ? "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                          : "bg-[#782860]/10 text-[#782860] dark:bg-[#782860]/20 dark:text-purple-300 hover:bg-[#782860] hover:text-white"
                      }`}
                    >
                      {showAddAddress ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Address</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Add Address Form Accordion */}
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
                            const success = editingAddress
                              ? await updateAddressAsync(editingAddress.id, savedAddr)
                              : await addAddressAsync(savedAddr);
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

                  {/* Existing Address Grid */}
                  <div className="space-y-3">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      const TagIcon = addr.tag.toLowerCase().includes("work") || addr.tag.toLowerCase().includes("office") ? Briefcase : addr.tag.toLowerCase().includes("home") ? Home : Building;
                      const RecipientIcon = addr.recipientType === "Family Member" ? Users : addr.recipientType === "Friend / Neighbor" ? HeartHandshake : addr.recipientType === "Office / Work" ? Briefcase : User;

                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4.5 rounded-2xl border cursor-pointer transition-all duration-300 flex items-start justify-between gap-3 select-none ${isSelected
                              ? "border-[#782860] bg-gradient-to-r from-[#782860]/5 via-purple-500/5 to-transparent shadow-md ring-2 ring-[#782860]/30 scale-[1.01]"
                              : "border-slate-200 dark:border-slate-800 hover:border-[#782860]/40 bg-slate-50/50 dark:bg-slate-950/20"
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${isSelected ? "border-[#782860] bg-[#782860]" : "border-slate-300 dark:border-slate-700"
                              }`}>
                              {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                            </div>
                            <div className="space-y-1 text-left">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${isSelected
                                    ? "bg-[#782860] text-white"
                                    : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                  }`}>
                                  <TagIcon className="w-2.5 h-2.5" />
                                  {addr.tag}
                                </span>

                                {addr.recipientType && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                                    <RecipientIcon className="w-2.5 h-2.5" />
                                    {addr.recipientType}
                                  </span>
                                )}

                                {addr.locality && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 font-mono">
                                    <MapPin className="w-2.5 h-2.5" />
                                    {addr.locality} ({addr.pincode || "Varanasi"})
                                  </span>
                                )}
                              </div>

                              {(addr.recipientName || addr.recipientPhone || addr.recipientMobile) && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs font-black text-foreground">
                                  <span>{addr.recipientName}</span>
                                  {(addr.recipientPhone || addr.recipientMobile) && (
                                    <span className="text-[11px] font-bold text-slate-500 font-mono">
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

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAddress(addr);
                                setShowAddAddress(true);
                              }}
                              className="px-2 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 className="w-2.5 h-2.5" /> Edit
                            </button>

                            {isSelected && (
                              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[10px] rounded-xl flex items-center gap-1 border border-emerald-500/20">
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

          {/* STEP 3: Payment & Coupon checkout */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Coupon Code Section */}
              {/* <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Discount Coupon</span>
                  <button
                    type="button"
                    onClick={() => setShowCouponsSlider(true)}
                    className="text-[11px] font-extrabold text-[#782860] dark:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Tag className="w-3 h-3" /> View Admin Offers (5)
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Enter code (HELPMATE20)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-lux"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-5 py-2.5 rounded-xl bg-primary-lux dark:bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-red-500 mt-2 pl-2">{couponError}</p>}
                {appliedCoupon && (
                  <div className="mt-3 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3.5 py-2 rounded-xl text-[11px] font-bold">
                    <span className="flex items-center gap-1.5"><Percent className="w-3.5 h-3.5 text-emerald-500" /> Code {appliedCoupon} Applied!</span>
                    <button type="button" onClick={removeCoupon} className="hover:underline text-[10px] text-rose-500 cursor-pointer">Remove</button>
                  </div>
                )}
              </div> */}

              {/* Payment Options List */}
              <div className="text-left space-y-3">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-accent-lux" /> Complete Secure Checkout
                  </h4>
                </div>

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
            <div className="flex flex-col items-center justify-center text-center py-12 space-y-6">
              <div className="w-16 h-16 rounded-full bg-success-lux/10 border border-success-lux/20 flex items-center justify-center text-success-lux">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-foreground">Luxury Service Confirmed!</h4>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  Your booking ID is <span className="font-bold text-foreground">{createdBookingId}</span>. We've assigned a top background-verified partner who will arrive on schedule.
                </p>
              </div>

              <div className="w-full max-w-md bg-slate-50 dark:bg-slate-950/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 text-left space-y-4">
                <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  <span>Booking details</span>
                  <span>Invoice Ready</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <p><strong>Scheduled Date:</strong> {formatDDMMYYYY(selectedDate)}</p>
                  <p><strong>Arrival Window:</strong> {selectedTimeSlot}</p>
                  <p><strong>Total Authorized:</strong> ₹{total}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  router.push("/profile?tab=bookings");
                }}
                className="w-full max-w-xs bg-primary-lux hover:bg-slate-800 dark:bg-accent-lux dark:hover:bg-accent-lux/95 text-white font-bold text-xs py-3.5 rounded-full shadow-lg cursor-pointer"
              >
                Track Professional Timeline
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer / Navigation Buttons */}
        {step < 4 && (
          <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-4">
            {/* Price Overview */}
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-slate-400">Due Now</span>
              <span className="text-base font-extrabold text-foreground font-sans">₹{grandTotal}</span>
            </div>

            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={handlePrevStep}
                  className="px-5 py-3 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              <button
                onClick={handleNextStep}
                disabled={step === 0 && cart.length === 0}
                className={`px-6 py-3 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md ${
                  step === 0 && cart.length === 0
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-primary-lux hover:bg-slate-800 dark:bg-accent-lux dark:hover:bg-accent-lux/95 text-white cursor-pointer"
                }`}
              >
                {step === 3 ? "Authorize & Book" : "Continue"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Available Admin Coupons Drawer */}
        <AvailableCouponsSlider
          isOpen={showCouponsSlider}
          onClose={() => setShowCouponsSlider(false)}
          cartTotal={subtotal}
          appliedCoupon={appliedCoupon}
          onApplyCoupon={(code) => {
            applyCoupon(code);
          }}
          onRemoveCoupon={removeCoupon}
        />
      </motion.div>
    </div>
  );
}
