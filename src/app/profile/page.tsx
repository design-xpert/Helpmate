"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Calendar,
  Wallet,
  Settings,
  MapPin,
  ShieldCheck,
  Star,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Award,
  RefreshCw,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Smile,
  AlertCircle,
  Plus,
  Copy,
  Check,
  Camera,
  Key,
  Bell,
  Smartphone,
  Mail,
  Users,
  HeartHandshake,
  Briefcase,
  Building,
  Trash2,
  Edit3,
  Bookmark,
  ShoppingBag,
  Video,
  Film,
  UploadCloud,
  ArrowLeft,
  FileText,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { useStore, Booking, Address, CartItem } from "@/store/useStore";
import { AddAddressForm } from "@/components/booking/AddAddressForm";
import { toast } from "@/components/common/Toast";
import { formatImageUrl } from "@/utils/image";
import { formatDuration } from "@/utils/dateTime";
import { InvoiceModal } from "@/components/booking/InvoiceModal";


function ProfilePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    userName,
    userPhone,
    walletBalance,
    loyaltyPoints,
    bookings,
    isLoadingBookings,
    isLoadingAddresses,
    isLoadingBookmarks,
    fetchBookings,
    addresses,
    addAddress,
    addAddressAsync,
    removeAddress,
    updateAddressAsync,
    fetchAddresses,
    bookmarkedPackages,
    fetchBookmarks,
    toggleBookmark,
    addToCart,
    cancelBooking,
    rescheduleBooking,
    updateBookingStatus,
    addNotification,
    updateProfile,
    addWalletFunds,
    redeemLoyaltyPoints,
    fetchCustomerProfile,
    createReviewAsync,
    updateReviewAsync,
    deleteReviewAsync,
    attachReviewToBooking,
    token
  } = useStore();


  useEffect(() => {
    if (token) {
      fetchCustomerProfile();
      fetchAddresses();
      fetchBookmarks();
      fetchBookings();
    }
  }, [token, fetchCustomerProfile, fetchAddresses, fetchBookmarks, fetchBookings]);

  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "saved" ? "bookmarks" : (searchParams.get("tab") || "dashboard")
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "saved" || tab === "bookmarks") {
      setActiveTab("bookmarks");
    } else if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Reschedule state
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");

  // Review state
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
  const [reviewingPackageId, setReviewingPackageId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewVideoFile, setReviewVideoFile] = useState<File | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Invoice Modal state
  const [invoiceModalBookingId, setInvoiceModalBookingId] = useState<string | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const handleOpenInvoice = (bookingId: string) => {
    setInvoiceModalBookingId(bookingId);
    setIsInvoiceModalOpen(true);
  };

  // Inline card review state for booking history packages
  const [inlineRatings, setInlineRatings] = useState<Record<string, number>>({});
  const [inlineComments, setInlineComments] = useState<Record<string, string>>({});
  const [inlineVideoFiles, setInlineVideoFiles] = useState<Record<string, File | null>>({});
  const [submittingReviewBookingId, setSubmittingReviewBookingId] = useState<string | null>(null);

  const handleInlineReviewSubmit = async (booking: Booking, pkgItem?: CartItem) => {
    const pkgId = pkgItem?.id || (booking.items && booking.items[0]?.id) || undefined;
    const itemKey = pkgItem ? `${booking.id}_${pkgItem.id}` : booking.id;

    const rating = inlineRatings[itemKey] || 0;
    if (!rating || rating < 1) {
      toast.error("Rating Required", "Please select a star rating before submitting your review.");
      return;
    }
    const comment = (inlineComments[itemKey] || "").trim();
    const videoFile = inlineVideoFiles[itemKey] || null;

    setSubmittingReviewBookingId(itemKey);

    try {
      const res = await createReviewAsync({
        bookingId: booking.id,
        packageId: pkgId,
        rating,
        review: comment,
        video: videoFile,
      });

      if (res.success) {
        const newReviewId = res.data?._id || res.data?.id;
        const newReviewObj = {
          reviewId: newReviewId,
          rating,
          comment,
          dateCreated: "Just now",
        };
        addNotification(
          "Review Posted Successfully!",
          res.message || `Thank you for rating ${pkgItem?.name || "your service"}.`,
          "success"
        );
        attachReviewToBooking(booking.id, newReviewObj, pkgId);
        setInlineRatings((prev) => {
          const copy = { ...prev };
          delete copy[itemKey];
          return copy;
        });
        setInlineComments((prev) => {
          const copy = { ...prev };
          delete copy[itemKey];
          return copy;
        });
        setInlineVideoFiles((prev) => {
          const copy = { ...prev };
          delete copy[itemKey];
          return copy;
        });
      } else {
        addNotification("Submission Failed", res.message || "Failed to post review.", "warning");
      }
    } catch (err: any) {
      addNotification("Error", err.message || "An unexpected error occurred while posting review.", "warning");
    } finally {
      setSubmittingReviewBookingId(null);
    }
  };


  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [newTag, setNewTag] = useState<"Home" | "Work" | "Other">("Home");
  const [newAddressLine, setNewAddressLine] = useState("");
  const [newCity, setNewCity] = useState("Varanasi");

  // Enhanced Profile & Wallet States
  const [localTransactions, setLocalTransactions] = useState([
    { id: "tx-1", type: "credit", desc: "Referral Reward (Aditi Sharma)", amount: "₹250", points: "", date: "Jul 18, 2026", status: "Success" },
    { id: "tx-2", type: "debit", desc: "AC Service Booking BK-109283", amount: "₹1599", points: "", date: "Jul 17, 2026", status: "Success" },
    { id: "tx-3", type: "points", desc: "Review Bonus Arjun Mehta", amount: "", points: "+50 pts", date: "Jul 15, 2026", status: "Earned" },
    { id: "tx-4", type: "debit", desc: "Deep Cleaning Booking BK-432109", amount: "₹2499", points: "", date: "Jul 12, 2026", status: "Success" }
  ]);
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editPhone, setEditPhone] = useState(userPhone);
  const [editEmail, setEditEmail] = useState("mukund@kvtmedia.com");
  const [editSecondaryEmail, setEditSecondaryEmail] = useState("recovery.mukund@kvtmedia.com");
  const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [smsUpdates, setSmsUpdates] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    setEditName(userName);
    setEditPhone(userPhone);
  }, [userName, userPhone]);



  // Sync tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Address Submit Handler
  const handleAddAddress = () => {
    if (!newAddressLine.trim()) return;
    addAddress({
      tag: newTag,
      addressLine: newAddressLine.trim(),
      city: newCity
    });
    setNewAddressLine("");
    setShowAddressForm(false);
    addNotification("Address Saved", "Your service location was successfully added.", "success");
  };

  // Status Simulation Action
  const advanceSimulatedBooking = (bookingId: string, currentStatus: Booking["status"]) => {
    if (currentStatus === "Assigned") {
      updateBookingStatus(bookingId, "In-Transit");
      addNotification("Professional In-Transit", `Your technician has started traveling. ETA 15 mins.`, "info");
    } else if (currentStatus === "In-Transit") {
      updateBookingStatus(bookingId, "Arrived");
      addNotification("Professional Arrived", `Your HelpMate specialist has arrived at your doorstep.`, "success");
    } else if (currentStatus === "Arrived") {
      updateBookingStatus(bookingId, "In-Progress");
      addNotification("Service Started", `Work has commenced for your booking ${bookingId}.`, "info");
    } else if (currentStatus === "In-Progress") {
      updateBookingStatus(bookingId, "Completed");
      addNotification("Service Completed!", `Your booking has been successfully finalized. Rate your professional!`, "success");
    }
  };

  const handleCancelBooking = (id: string) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      cancelBooking(id);
    }
  };

  const handleRescheduleSubmit = (id: string) => {
    if (!rescheduleDate || !rescheduleSlot) return;
    rescheduleBooking(id, rescheduleDate, rescheduleSlot);
    setReschedulingId(null);
    setRescheduleDate("");
    setRescheduleSlot("");
  };

  const handleReviewSubmit = async () => {
    if (!reviewingBooking) return;
    if (!reviewRating || reviewRating < 1) {
      toast.error("Rating Required", "Please select a star rating before submitting your review.");
      return;
    }
    setIsSubmittingReview(true);
    const targetBookingId = reviewingBooking.id;

    try {
      const pkgId = reviewingPackageId || (reviewingBooking.items && reviewingBooking.items[0]?.id) || undefined;

      if (editingReviewId) {
        const res = await updateReviewAsync(editingReviewId, {
          rating: reviewRating,
          review: reviewComment.trim(),
        });
        if (res.success) {
          addNotification("Review Updated!", res.message || "Your review has been updated successfully.", "success");
          attachReviewToBooking(targetBookingId, {
            reviewId: editingReviewId,
            rating: reviewRating,
            comment: reviewComment.trim(),
            dateCreated: "Edited just now",
          }, pkgId);
          setReviewingBooking(null);
          setReviewingPackageId(null);
          setReviewComment("");
          setReviewRating(0);
          setEditingReviewId(null);
        } else {
          addNotification("Update Failed", res.message || "Failed to update review.", "warning");
        }
      } else {
        const res = await createReviewAsync({
          bookingId: targetBookingId,
          packageId: pkgId,
          rating: reviewRating,
          review: reviewComment.trim(),
        });
        if (res.success) {
          const newReviewId = res.data?._id || res.data?.id;
          addNotification(
            "Review Submitted!",
            res.message || `Thank you for rating ${reviewingBooking?.professional?.name || "our service"}.`,
            "success"
          );
          attachReviewToBooking(targetBookingId, {
            reviewId: newReviewId,
            rating: reviewRating,
            comment: reviewComment.trim(),
            dateCreated: "Just now",
          }, pkgId);
          setReviewingBooking(null);
          setReviewingPackageId(null);
          setReviewComment("");
          setReviewRating(0);
          setEditingReviewId(null);
        } else {
          addNotification("Submission Failed", res.message || "Failed to submit review.", "warning");
        }
      }
    } catch (err: any) {
      addNotification("Error", err.message || "An unexpected error occurred.", "warning");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string, bookingId?: string, packageId?: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await deleteReviewAsync(reviewId);
      if (res.success) {
        addNotification("Review Deleted", res.message || "Review deleted successfully.", "info");
        const targetBId = bookingId || reviewingBooking?.id;
        const targetPId = packageId || reviewingPackageId || undefined;
        if (targetBId) {
          attachReviewToBooking(targetBId, null, targetPId);
        } else {
          fetchBookings();
        }
        setReviewingBooking(null);
        setReviewingPackageId(null);
        setReviewComment("");
        setReviewRating(0);
        setEditingReviewId(null);
      } else {
        addNotification("Delete Failed", res.message || "Failed to delete review.", "warning");
      }
    } catch (err: any) {
      addNotification("Error", err.message || "Failed to delete review.", "warning");
    }
  };




  const handleBack = () => {
    if (
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      document.referrer &&
      document.referrer.includes(window.location.host) &&
      !document.referrer.includes("/profile")
    ) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <Header />

      <main 
        style={{ paddingTop: "var(--header-total-height, 8.5rem)" }}
        className="flex-1 pt-32 sm:pt-36 font-sans bg-slate-50/50 dark:bg-background pb-16"
      >
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          {/* Top Bar Navigation: Back Button & Breadcrumbs */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-extrabold shadow-sm transition-all cursor-pointer hover:border-accent-lux/40 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-accent-lux" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
              <Link href="/" className="hover:text-accent-lux transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground font-bold">My Profile</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Profile Navigation Sidebar */}
          <nav className="lg:col-span-3 glass-panel p-6 space-y-2 shrink-0">
            <div className="pb-6 border-b border-slate-100 dark:border-slate-800 text-center lg:text-left flex lg:flex-col items-center lg:items-start gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-accent-lux shadow-md shrink-0">
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">{userName}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{userPhone}</p>
                <span className="inline-block mt-2 bg-gradient-to-r from-accent-lux to-secondary-lux text-white text-[8px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  Elite Member
                </span>
              </div>
            </div>

            <div className="pt-4 space-y-1">
              {[
                // { id: "dashboard", label: "Dashboard Overview", icon: <Award className="w-4 h-4" /> },
                { id: "bookings", label: "Booking History", icon: <Calendar className="w-4 h-4" /> },
                { id: "bookmarks", label: "Saved Packages", icon: <Bookmark className="w-4 h-4" /> },
                { id: "addresses", label: "Manage Locations", icon: <MapPin className="w-4 h-4" /> },
                // { id: "wallet", label: "Wallet & Loyalty", icon: <Wallet className="w-4 h-4" /> },
                // { id: "settings", label: "Account Settings", icon: <Settings className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    router.replace(`/profile?tab=${tab.id}`, { scroll: false });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === tab.id
                    ? "bg-accent-lux text-white shadow-lg shadow-accent-lux/10"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-accent-lux transition-all text-left cursor-pointer border border-dashed border-slate-200 dark:border-slate-800"
                >
                  <ArrowLeft className="w-4 h-4 text-accent-lux" />
                  <span>Back to Home</span>
                </button>
              </div>
            </div>
          </nav>

          {/* Main Panel Content */}
          <div className="lg:col-span-9 space-y-6">

            {/* TAB: DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Wallet Card */}
                  <div className="glass-panel p-6 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-lux tracking-wider">Wallet Balance</span>
                      <h4 className="text-2xl font-black text-foreground mt-2">₹{walletBalance}</h4>
                    </div>
                    <span className="text-[10px] text-accent-lux font-bold mt-4 flex items-center gap-1">
                      Refer friend, earn ₹250 <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Loyalty Card */}
                  <div className="glass-panel p-6 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-lux tracking-wider">Loyalty Points</span>
                      <h4 className="text-2xl font-black text-foreground mt-2">{loyaltyPoints} pts</h4>
                    </div>
                    <span className="text-[10px] text-success-lux font-bold mt-4">
                      Elite tier bonus active
                    </span>
                  </div>

                  {/* Booking count card */}
                  <div className="glass-panel p-6 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-lux tracking-wider">Total Bookings</span>
                      <h4 className="text-2xl font-black text-foreground mt-2">{bookings.length} Services</h4>
                    </div>
                    {bookings.length === 0 ? (
                      <Link
                        href="/#categories"
                        className="text-[11px] font-bold text-accent-lux hover:underline mt-4 inline-flex items-center gap-1 cursor-pointer"
                      >
                        Book Now →
                      </Link>
                    ) : (
                      <span className="text-[10px] text-muted-lux mt-4 block font-semibold">
                        Last booked recently
                      </span>
                    )}
                  </div>
                </div>

                {/* Active Tracking Module */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4.5 h-4.5 text-accent-lux" /> Real-time Booking Tracker
                  </h3>

                  {isLoadingBookings ? (
                    <div className="space-y-4">
                      {[1, 2].map((n) => (
                        <div key={n} className="glass-panel p-6 space-y-4 animate-pulse">
                          <div className="flex justify-between items-center">
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-24" />
                          </div>
                          <div className="h-12 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl w-full" />
                        </div>
                      ))}
                    </div>
                  ) : bookings.filter((b) => b.status !== "Completed" && b.status !== "Cancelled").length === 0 ? (
                    <div className="glass-panel p-8 rounded-2xl text-center flex flex-col items-center justify-center space-y-3 border border-slate-200/60 dark:border-slate-800">
                      <p className="text-xs text-slate-400">
                        {bookings.length === 0
                          ? "You have 0 booked services. Explore categories to start scheduling."
                          : "No active bookings in progress. Explore categories to start scheduling."}
                      </p>
                      {bookings.length === 0 && (
                        <Link
                          href="/#categories"
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-accent-lux hover:bg-accent-lux/95 text-white text-xs font-bold shadow-md shadow-accent-lux/20 hover:scale-105 active:scale-95 transition-all cursor-pointer font-sans"
                        > Book Now
                        </Link>
                      )}
                    </div>
                  ) : (
                    [...bookings]
                      .filter((b) => b.status !== "Completed" && b.status !== "Cancelled")
                      .sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())
                      .map((b) => (
                        <div key={b.id} className="glass-panel p-6 space-y-6">
                          {/* Top Row */}
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-muted-lux">Active Tracker</span>
                              <h4 className="text-sm font-bold text-foreground mt-0.5">Booking #{b.bookingNumber || b.id}</h4>
                              <p className="text-[10px] text-slate-400 capitalize mt-0.5">{b.items[0]?.name}</p>
                            </div>

                            {/* Simulator Trigger */}
                            <button
                              onClick={() => advanceSimulatedBooking(b.id, b.status)}
                              className="px-4 py-2 bg-gradient-to-r from-accent-lux to-secondary-lux hover:from-accent-lux hover:to-accent-lux text-white text-[10px] font-bold tracking-wider uppercase rounded-xl flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Simulate Partner Progress
                            </button>
                          </div>

                          {/* Professional summary */}
                          {b.professional && (
                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-800">
                              <img src={b.professional.avatar} alt={b.professional.name} className="w-12 h-12 rounded-full object-cover" />
                              <div>
                                <span className="text-xs font-bold text-foreground block">{b.professional.name}</span>
                                <span className="text-[10px] text-muted-lux block mt-0.5">HelpMate Certified Specialist</span>
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  <span className="text-[10px] font-bold text-foreground">{b.professional.rating}</span>
                                  <span className="text-[10px] text-slate-400">({b.professional.completedJobs} jobs)</span>
                                </div>
                              </div>
                              <span className="ml-auto text-xs font-bold bg-success-lux/10 text-success-lux px-3 py-1 rounded-full">
                                OTP: {b.otp}
                              </span>
                            </div>
                          )}

                          {/* Progress Stepper Timeline */}
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 pt-2">
                            {b.timeline.map((step, sIdx) => (
                              <div key={step.status} className="flex sm:flex-col items-start sm:items-center text-left sm:text-center relative">
                                {/* Connector line */}
                                {sIdx < b.timeline.length - 1 && (
                                  <div className="hidden sm:block absolute top-3.5 left-[60%] right-[-40%] h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
                                )}

                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${step.done
                                  ? "bg-accent-lux text-white shadow-lg shadow-accent-lux/20"
                                  : "bg-slate-100 dark:bg-slate-900 border border-slate-200 text-slate-400"
                                  }`}>
                                  <CheckCircle className="w-4 h-4" />
                                </div>

                                <div className="ml-3 sm:ml-0 mt-0.5 sm:mt-3">
                                  <p className="text-[11px] font-bold text-foreground leading-tight">{step.status}</p>
                                  <p className="text-[9px] text-slate-400 mt-1">{step.time}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: BOOKINGS HISTORY */}
            {activeTab === "bookings" && (
              <div className="space-y-6">
                <h3 className="font-bold text-sm text-foreground">Service Booking History</h3>

                {isLoadingBookings ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="glass-panel p-6 space-y-4 animate-pulse">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div className="space-y-2 w-1/3">
                            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" />
                          </div>
                          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-16" />
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="glass-panel p-10 sm:p-16 rounded-3xl text-center flex flex-col items-center justify-center space-y-4 border border-slate-200/60 dark:border-slate-800">
                    <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/40 flex items-center justify-center text-accent-lux shadow-sm">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5 max-w-md">
                      <h4 className="text-base sm:text-lg font-black text-foreground">
                        No Booked Services
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        You have 0 booked services in your account. Explore our verified home, repair, and lifestyle services to schedule your appointment today.
                      </p>
                    </div>
                    <Link
                      href="/#categories"
                      className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent-lux hover:bg-accent-lux/95 text-white text-xs font-black tracking-wide shadow-md shadow-accent-lux/20 hover:scale-105 active:scale-95 transition-all cursor-pointer font-sans"
                    > Book Now
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...bookings]
                      .sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())
                      .map((b) => (
                        <div key={b.id} className="glass-panel p-6 space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{b.dateCreated}</span>
                              <h4 className="text-xs sm:text-sm font-bold text-foreground mt-0.5 flex items-center gap-2">
                                Booking #{b.bookingNumber || b.id}
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                  b.status === "Completed" ? "bg-success-lux/10 text-success-lux" :
                                  b.status === "Cancelled" ? "bg-red-500/10 text-red-500" :
                                  b.status === "Pending" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" :
                                  "bg-accent-lux/10 text-accent-lux"
                                }`}>
                                  {b.status}
                                </span>
                              </h4>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <span className="text-xs sm:text-sm font-extrabold text-foreground">₹{b.finalAmount}</span>
                              <button
                                type="button"
                                onClick={() => handleOpenInvoice(b.id)}
                                className="px-2.5 py-1 rounded-xl bg-accent-lux/10 hover:bg-accent-lux/20 text-accent-lux text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer border border-accent-lux/20 shadow-xs"
                                title="View / Download Tax Invoice"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Invoice</span>
                              </button>
                            </div>
                          </div>

                          {/* Package Name & Review Section */}
                          <div className="space-y-3 text-left pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-extrabold text-accent-lux tracking-wider">
                                {b.items && b.items.length > 1 ? `Services (${b.items.length})` : "Service Package"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {b.date} • {b.timeSlot}
                              </span>
                            </div>
                            <div className="space-y-4">
                              {b.items && b.items.length > 0 ? (
                                b.items.map((sItem, sIdx) => {
                                  const itemKey = `${b.id}_${sItem.id || sIdx}`;
                                  const pkgReview = sItem.review || (b.items.length === 1 ? b.review : undefined);
                                  const currentRating = inlineRatings[itemKey] || 0;

                                  return (
                                    <div key={sIdx} className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/60 first:border-0 first:pt-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-xs sm:text-sm font-extrabold text-foreground flex items-center gap-2 min-w-0">
                                          <ShoppingBag className="w-4 h-4 text-accent-lux shrink-0" />
                                          <span className="truncate">{sItem.name} {sItem.quantity > 1 ? `(x${sItem.quantity})` : ""}</span>
                                        </h3>
                                        <span className="text-xs font-semibold text-slate-400 shrink-0">₹{sItem.price * (sItem.quantity || 1)}</span>
                                      </div>

                                      {/* Package Rating & Review Display (Visible if completed or reviewed) */}
                                      {(pkgReview || b.status === "Completed") && (
                                        <div className="w-full pt-1">
                                          {pkgReview ? (
                                            <div className="bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-2xl border border-amber-500/20 dark:border-amber-500/30 space-y-2 text-left shadow-sm relative overflow-hidden">
                                              <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div className="flex items-center gap-2">
                                                  <div className="flex items-center gap-1 text-amber-500">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                      <Star
                                                        key={star}
                                                        className={`w-3.5 h-3.5 ${star <= pkgReview.rating ? "fill-amber-500 text-amber-500" : "text-slate-300 dark:text-slate-700"}`}
                                                      />
                                                    ))}
                                                  </div>
                                                  <span className="text-[11px] font-black text-foreground font-sans px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                    {pkgReview.rating}.0 / 5.0
                                                  </span>
                                                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                                                    <CheckCircle className="w-2.5 h-2.5 text-emerald-500" /> Rated Package
                                                  </span>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                  <button
                                                    onClick={() => {
                                                      setReviewingBooking(b);
                                                      setReviewingPackageId(sItem.id);
                                                      setReviewRating(pkgReview.rating);
                                                      setReviewComment(pkgReview.comment || "");
                                                      setEditingReviewId(pkgReview.reviewId || null);
                                                    }}
                                                    className="px-2.5 py-1 rounded-full bg-accent-lux/10 hover:bg-accent-lux/20 text-accent-lux text-[10px] font-extrabold transition-colors flex items-center gap-1 cursor-pointer border border-accent-lux/20"
                                                  >
                                                    <Edit3 className="w-3 h-3" /> Edit Review
                                                  </button>
                                                  <button
                                                    onClick={() => handleDeleteReview(pkgReview.reviewId || b.id, b.id, sItem.id)}
                                                    className="px-2.5 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-extrabold transition-colors flex items-center gap-1 cursor-pointer border border-red-500/20"
                                                  >
                                                    <Trash2 className="w-3 h-3" /> Delete
                                                  </button>
                                                </div>
                                              </div>

                                              {pkgReview.comment ? (
                                                <div className="p-2.5 bg-white/80 dark:bg-slate-950/80 rounded-xl border border-slate-200/60 dark:border-slate-800">
                                                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed italic">
                                                    "{pkgReview.comment}"
                                                  </p>
                                                </div>
                                              ) : (
                                                <p className="text-[10px] text-slate-400 italic">No comment provided with rating.</p>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="bg-slate-50/90 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-left">
                                              <div className="flex items-center justify-between">
                                                <h5 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Rate &amp; Review Package
                                                </h5>
                                                <span className="text-[10px] text-slate-400 font-semibold">{sItem.name}</span>
                                              </div>

                                              {/* Interactive 5-Star Rating Selector */}
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Rating:</span>
                                                <div className="flex items-center gap-0.5">
                                                  {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                      key={star}
                                                      type="button"
                                                      onClick={() => setInlineRatings({ ...inlineRatings, [itemKey]: star })}
                                                      className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                                                      title={`${star} Star${star > 1 ? 's' : ''}`}
                                                    >
                                                      <Star
                                                        className={`w-4.5 h-4.5 ${star <= currentRating ? "fill-amber-500 text-amber-500" : "text-slate-300 dark:text-slate-700"}`}
                                                      />
                                                    </button>
                                                  ))}
                                                </div>
                                                <span className="text-xs font-black text-amber-600 dark:text-amber-400 ml-1 font-sans">
                                                  {currentRating > 0 ? `${currentRating}.0 Stars` : "Select rating"}
                                                </span>
                                              </div>

                                              {/* Comment Textarea Input */}
                                              <div>
                                                <textarea
                                                  placeholder={`Write your review for ${sItem.name}...`}
                                                  value={inlineComments[itemKey] || ""}
                                                  onChange={(e) => setInlineComments({ ...inlineComments, [itemKey]: e.target.value })}
                                                  rows={2}
                                                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs font-medium text-foreground focus:outline-none focus:border-accent-lux placeholder:text-slate-400 transition-all"
                                                />
                                              </div>

                                              {/* Video Upload input & Post Review button */}
                                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                                                {!inlineVideoFiles[itemKey] ? (
                                                  <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer transition-colors border border-slate-200/60 dark:border-slate-700">
                                                    <Video className="w-3 h-3 text-accent-lux" /> Add Video Clip (Optional)
                                                    <input
                                                      type="file"
                                                      accept="video/*"
                                                      className="hidden"
                                                      onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                          if (file.size > 100 * 1024 * 1024) {
                                                            toast.error("File Too Large", "Video file size must be less than 100MB");
                                                            return;
                                                          }
                                                          setInlineVideoFiles((prev) => ({ ...prev, [itemKey]: file }));
                                                        }
                                                      }}
                                                    />
                                                  </label>
                                                ) : (
                                                  <div className="flex items-center gap-2 bg-slate-900 text-white px-2.5 py-1 rounded-xl text-[10px] border border-slate-800">
                                                    <Video className="w-3 h-3 text-accent-lux shrink-0" />
                                                    <span className="truncate max-w-[110px] font-bold text-slate-200">{inlineVideoFiles[itemKey]!.name}</span>
                                                    <button
                                                      type="button"
                                                      onClick={() => setInlineVideoFiles((prev) => {
                                                        const copy = { ...prev };
                                                        delete copy[itemKey];
                                                        return copy;
                                                      })}
                                                      className="text-slate-400 hover:text-red-400 p-0.5 cursor-pointer ml-0.5"
                                                      title="Remove video"
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                )}

                                                <div className="flex items-center gap-2 ml-auto">
                                                  <span className="hidden sm:flex text-[9px] text-slate-400 font-semibold items-center gap-1">
                                                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified
                                                  </span>
                                                  <button
                                                    type="button"
                                                    disabled={submittingReviewBookingId === itemKey}
                                                    onClick={() => handleInlineReviewSubmit(b, sItem)}
                                                    className="px-3.5 py-1.5 bg-accent-lux hover:bg-accent-lux/95 disabled:opacity-50 text-white text-[11px] font-extrabold rounded-xl shadow-md shadow-accent-lux/20 transition-all cursor-pointer flex items-center gap-1.5"
                                                  >
                                                    {submittingReviewBookingId === itemKey ? (
                                                      <>
                                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                                        <span>Posting...</span>
                                                      </>
                                                    ) : (
                                                      <>
                                                        <Star className="w-3 h-3 fill-white text-white" />
                                                        <span>Post Review</span>
                                                      </>
                                                    )}
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <h3 className="text-xs sm:text-sm font-extrabold text-foreground flex items-center gap-2">
                                  <ShoppingBag className="w-4 h-4 text-accent-lux shrink-0" />
                                  Service Package
                                </h3>
                              )}
                            </div>
                          </div>

                          {/* Reschedule / Cancel Actions */}
                          {/* {b.status !== "Completed" && b.status !== "Cancelled" && (
                            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <button
                                onClick={() => setReschedulingId(b.id)}
                                className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-[10px] font-bold rounded-xl cursor-pointer"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleCancelBooking(b.id)}
                                className="px-3.5 py-2 border border-red-200 text-red-500 hover:bg-red-500/10 text-[10px] font-bold rounded-xl cursor-pointer"
                              >
                                Cancel Booking
                              </button>
                            </div>
                          )} */}

                          {/* Rescheduling Form Panel */}
                          {reschedulingId === b.id && (() => {
                            const todayISO = new Date().toISOString().split("T")[0];
                            return (
                              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 mt-4 text-left">
                                <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-accent-lux" /> Select New Reschedule Date & Time
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Pick Date (Calendar)</label>
                                    <input
                                      type="date"
                                      min={todayISO}
                                      value={rescheduleDate}
                                      onChange={(e) => setRescheduleDate(e.target.value)}
                                      onClick={(e) => {
                                        try {
                                          (e.currentTarget as HTMLInputElement).showPicker?.();
                                        } catch (err) { }
                                      }}
                                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-accent-lux cursor-pointer"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Pick Arrival Time</label>
                                    <div className="flex gap-2">
                                      <select
                                        value={["08:00 AM", "10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"].includes(rescheduleSlot) ? rescheduleSlot : "custom"}
                                        onChange={(e) => {
                                          if (e.target.value !== "custom") {
                                            setRescheduleSlot(e.target.value);
                                          }
                                        }}
                                        className="w-1/2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs text-foreground font-semibold cursor-pointer"
                                      >
                                        <option value="">Preset Slot</option>
                                        <option value="08:00 AM">08:00 AM</option>
                                        <option value="10:00 AM">10:00 AM</option>
                                        <option value="12:00 PM">12:00 PM</option>
                                        <option value="02:00 PM">02:00 PM</option>
                                        <option value="04:00 PM">04:00 PM</option>
                                        <option value="06:00 PM">06:00 PM</option>
                                        <option value="custom">Custom...</option>
                                      </select>
                                      <input
                                        type="time"
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val) {
                                            const [hStr, mStr] = val.split(":");
                                            let hour = parseInt(hStr, 10);
                                            const ampm = hour >= 12 ? "PM" : "AM";
                                            hour = hour % 12;
                                            if (hour === 0) hour = 12;
                                            const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
                                            setRescheduleSlot(`${hourStr}:${mStr || '00'} ${ampm}`);
                                          }
                                        }}
                                        onClick={(e) => {
                                          try {
                                            (e.currentTarget as HTMLInputElement).showPicker?.();
                                          } catch (err) { }
                                        }}
                                        className="w-1/2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs text-foreground font-semibold cursor-pointer"
                                        title="Open Time Picker"
                                      />
                                    </div>
                                    {rescheduleSlot && (
                                      <p className="text-[10px] text-accent-lux font-semibold mt-1">
                                        Selected Slot: {rescheduleSlot}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => setReschedulingId(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleRescheduleSubmit(b.id)}
                                    className="px-4 py-2 rounded-xl bg-accent-lux hover:bg-accent-lux/95 text-white text-[10px] font-bold cursor-pointer shadow-md"
                                  >
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: MANAGE LOCATIONS */}
            {activeTab === "addresses" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <MapPin className="w-4.5 h-4.5 text-accent-lux" /> Vetted Service Locations
                  </h3>
                  <button
                    onClick={() => {
                      if (showAddressForm) {
                        setShowAddressForm(false);
                        setEditingAddress(null);
                      } else {
                        setEditingAddress(null);
                        setShowAddressForm(true);
                      }
                    }}
                    className="text-xs text-accent-lux font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showAddressForm ? "Cancel" : "Add Address"}
                  </button>
                </div>

                <AnimatePresence>
                  {showAddressForm && (
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
                            setShowAddressForm(false);
                          }
                        }}
                        onCancel={() => {
                          setEditingAddress(null);
                          setShowAddressForm(false);
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {isLoadingAddresses ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="glass-panel p-5 space-y-3 animate-pulse border border-slate-200/60 dark:border-slate-800 rounded-3xl">
                        <div className="flex items-center gap-2">
                          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
                          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-24" />
                        </div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="glass-panel p-12 text-center text-slate-500 text-xs rounded-3xl">
                    No saved service locations found. Add your primary home or office address above.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => {
                      const TagIcon = addr.tag.toLowerCase().includes("work") || addr.tag.toLowerCase().includes("office") ? Briefcase : addr.tag.toLowerCase().includes("home") ? User : Building;
                      const RecipientIcon = addr.recipientType === "Family Member" ? Users : addr.recipientType === "Friend / Neighbor" ? HeartHandshake : addr.recipientType === "Office / Work" ? Briefcase : User;

                      return (
                        <div
                          key={addr.id}
                          className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200/60 dark:border-slate-800 rounded-3xl text-left"
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-3 py-0.5 rounded-full bg-[#782860] text-white uppercase tracking-wider">
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

                              {addr.isDefault && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  Primary Default
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

                          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAddress(addr);
                                setShowAddressForm(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => removeAddress(addr.id)}
                              className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: SAVED BOOKMARKS */}
            {activeTab === "bookmarks" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Bookmark className="w-4.5 h-4.5 text-accent-lux fill-accent-lux" /> Saved Bookmarked Packages
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Your saved service packages for fast one-click booking.</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {bookmarkedPackages.length} Saved
                  </span>
                </div>

                {isLoadingBookmarks ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((n) => (
                      <div key={n} className="glass-panel p-5 space-y-4 animate-pulse border border-slate-200/60 dark:border-slate-800 rounded-3xl">
                        <div className="flex gap-4 items-start">
                          <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 mt-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : bookmarkedPackages.length === 0 ? (
                  <div className="glass-panel p-12 rounded-3xl text-center flex flex-col items-center justify-center space-y-3">
                    <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                    <p className="text-sm font-bold text-foreground">No Bookmarked Packages Yet</p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Click the bookmark icon on any service package to save it here for fast access and booking.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bookmarkedPackages.map((item) => {
                      const pkg = item.package;
                      if (!pkg) return null;

                      const rawImg = pkg.imageUrl || pkg.thumbnailUrl || (pkg as any).image;
                      const packageId = pkg._id || (pkg as any).id;
                      const displayImg = rawImg 
                        ? formatImageUrl(rawImg) 
                        : (packageId ? `/api/media/package/${packageId}/image` : "");

                      return (
                        <div
                          key={item.bookmarkId || pkg._id}
                          className="glass-panel p-5 border border-slate-200/60 dark:border-slate-800 rounded-3xl text-left flex flex-col justify-between space-y-4 hover:shadow-lg transition-all"
                        >
                          <div className="flex gap-4 items-start">
                            <img
                              src={displayImg || `/api/media/package/${packageId}/image`}
                              alt={pkg.packageName}
                              referrerPolicy="no-referrer"
                              className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (packageId && !target.src.includes(`/api/media/package/${packageId}/image`)) {
                                  target.src = `/api/media/package/${packageId}/image`;
                                }
                              }}
                            />

                            <div className="space-y-1 min-w-0 flex-1">
                              <span className="text-[9px] font-normal uppercase tracking-wider text-accent-lux px-2 py-0.5 rounded-md bg-accent-lux/10 inline-block">
                                {pkg.serviceAction?.name || "Service Package"}
                              </span>
                              <h4 className="font-extrabold text-sm text-foreground truncate">{pkg.packageName}</h4>
                              <p className="text-[11px] text-slate-400 line-clamp-2">{pkg.description || pkg.subtitle || ""}</p>
                              <div className="flex items-center gap-2 pt-1">
                                <span className="text-sm font-black text-accent-lux">₹{pkg.price}</span>
                                {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                                  <span className="text-xs text-slate-400 line-through">₹{pkg.originalPrice}</span>
                                )}
                                {pkg.duration && (
                                  <span className="text-[10px] text-slate-400 font-medium ml-auto">• {formatDuration(pkg.duration)}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            <button
                              type="button"
                              onClick={() => {
                                addToCart({
                                  id: pkg._id,
                                  name: pkg.packageName,
                                  price: pkg.price,
                                  category: pkg.serviceAction?.name || "Service",
                                  duration: pkg.duration || 30,
                                });
                              }}
                              className="flex-1 py-2 px-3 rounded-xl bg-accent-lux text-white text-xs font-bold hover:bg-accent-lux/90 transition-all text-center cursor-pointer"
                            >
                              Add to Cart
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                toggleBookmark(pkg._id);
                                addNotification("Bookmark Removed", `${pkg.packageName} removed from saved list.`, "info");
                              }}
                              className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                              title="Remove Bookmark"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: WALLET & LOYALTY */}
            {activeTab === "wallet" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Luxury Wallet Card */}
                  <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-950 dark:to-slate-900 text-slate-800 dark:text-white rounded-[28px] relative overflow-hidden flex flex-col justify-between h-[210px] shadow-md dark:shadow-xl border border-slate-200 dark:border-slate-800/80 group">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-accent-lux/5 dark:bg-accent-lux/5 rounded-full blur-3xl group-hover:bg-accent-lux/10 transition-all duration-700 pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-white/70 tracking-wider">HelpMate Luxury Purse</span>
                        <h4 className="text-3xl font-black tracking-tight mt-1 text-slate-900 dark:text-white">₹{walletBalance}</h4>
                      </div>
                      <div className="w-10 h-7 bg-slate-200/80 dark:bg-white/10 rounded-lg flex items-center justify-center border border-slate-300 dark:border-white/10 text-xs tracking-widest font-black text-slate-600 dark:text-white/80 select-none">
                        HM
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 font-mono tracking-widest">**** **** **** 1098</p>
                      <div className="flex justify-between items-end mt-4">
                        <div>
                          <span className="text-[8px] text-slate-500 dark:text-slate-300 uppercase block font-semibold">Purse Holder</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">{userName}</span>
                        </div>
                        <button
                          onClick={() => setShowAddFundsModal(true)}
                          className="bg-accent-lux hover:bg-accent-lux/90 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-full cursor-pointer flex items-center gap-1 shadow-md hover:scale-[1.03] transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Funds
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Loyalty Points Card */}
                  <div className="glass-panel p-6 rounded-[28px] flex flex-col justify-between h-[210px] border border-slate-200/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-lux tracking-wider flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-accent-lux" /> Helpmate Elite Club
                        </span>
                        <h4 className="text-3xl font-black text-foreground tracking-tight mt-1">{loyaltyPoints} <span className="text-xs text-slate-450 font-normal">pts</span></h4>
                      </div>
                      <span className="bg-success-lux/10 text-success-lux text-[8px] font-extrabold px-2.5 py-0.5 rounded tracking-wider uppercase">
                        Elite Tier Active
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-400">Next Milestone: Gold Elite Club</span>
                        <span className="text-foreground">{loyaltyPoints} / 500</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-accent-lux to-secondary-lux h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (loyaltyPoints / 500) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Earn {Math.max(0, 500 - loyaltyPoints)} more points to unlock Gold Tier (10% flat cashback on all luxury bookings).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Add Funds Simulation section */}
                {showAddFundsModal && (
                  <div className="glass-panel p-5 border border-accent-lux/20 bg-accent-lux/[0.02] rounded-[24px] space-y-4 text-left animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-accent-lux">Simulated Payment Center</h4>
                      <button
                        onClick={() => {
                          setShowAddFundsModal(false);
                          setAddFundsAmount("");
                        }}
                        className="text-xs text-slate-400 hover:text-slate-250 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[100, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setAddFundsAmount(amt.toString())}
                          className="py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-foreground hover:border-accent-lux transition-colors cursor-pointer"
                        >
                          +₹{amt}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Or enter custom amount (₹)"
                        value={addFundsAmount}
                        onChange={(e) => setAddFundsAmount(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-lux"
                      />
                      <button
                        onClick={() => {
                          const amt = parseInt(addFundsAmount);
                          if (isNaN(amt) || amt <= 0) return;
                          addWalletFunds(amt);
                          const newTx = {
                            id: "tx-" + Math.random().toString(),
                            type: "credit",
                            desc: "Purse Refill (Simulated Gateway)",
                            amount: `₹${amt}`,
                            points: "",
                            date: "Today",
                            status: "Success"
                          };
                          setLocalTransactions([newTx, ...localTransactions]);
                          addNotification("Funds Added", `₹${amt} credited to your HelpMate Luxury Purse.`, "success");
                          setAddFundsAmount("");
                          setShowAddFundsModal(false);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-accent-lux hover:bg-accent-lux/95 text-xs font-bold text-white cursor-pointer"
                      >
                        Load Purse
                      </button>
                    </div>
                  </div>
                )}

                {/* Redeem Rewards Shop */}
                <div className="glass-panel p-6 space-y-4">
                  <h4 className="text-xs uppercase font-extrabold text-muted-lux tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-accent-lux" /> Points Redemption Center
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Redeem your earned loyalty points for direct cash credits in your Purse.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Reward Item 1 */}
                    <div className="p-4 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center group">
                      <div>
                        <span className="text-xs font-bold text-foreground">₹100 Wallet Credit</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Deducts 200 loyalty points</p>
                      </div>
                      <button
                        onClick={() => {
                          if (loyaltyPoints < 200) {
                            addNotification("Insufficient Points", "You need " + (200 - loyaltyPoints) + " more points to claim this voucher.", "warning");
                            return;
                          }
                          redeemLoyaltyPoints(200);
                          addWalletFunds(100);
                          const newTx = {
                            id: "tx-" + Math.random().toString(),
                            type: "credit",
                            desc: "Loyalty points redemption (₹100 credit)",
                            amount: "₹100",
                            points: "-200 pts",
                            date: "Today",
                            status: "Success"
                          };
                          setLocalTransactions([newTx, ...localTransactions]);
                          addNotification("Redemption Successful", "₹100 has been credited to your purse.", "success");
                        }}
                        className="px-3.5 py-1.5 bg-accent-lux text-white text-[10px] font-extrabold rounded-full cursor-pointer hover:bg-accent-lux/90"
                      >
                        Redeem
                      </button>
                    </div>

                    {/* Reward Item 2 */}
                    <div className="p-4 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center group">
                      <div>
                        <span className="text-xs font-bold text-foreground">₹250 Wallet Credit</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Deducts 400 loyalty points</p>
                      </div>
                      <button
                        onClick={() => {
                          if (loyaltyPoints < 400) {
                            addNotification("Insufficient Points", "You need " + (400 - loyaltyPoints) + " more points to claim this voucher.", "warning");
                            return;
                          }
                          redeemLoyaltyPoints(400);
                          addWalletFunds(250);
                          const newTx = {
                            id: "tx-" + Math.random().toString(),
                            type: "credit",
                            desc: "Loyalty points redemption (₹250 credit)",
                            amount: "₹250",
                            points: "-400 pts",
                            date: "Today",
                            status: "Success"
                          };
                          setLocalTransactions([newTx, ...localTransactions]);
                          addNotification("Redemption Successful", "₹250 has been credited to your purse.", "success");
                        }}
                        className="px-3.5 py-1.5 bg-accent-lux text-white text-[10px] font-extrabold rounded-full cursor-pointer hover:bg-accent-lux/90"
                      >
                        Redeem
                      </button>
                    </div>
                  </div>
                </div>

                {/* Purse Transaction History Activity Log */}
                <div className="glass-panel p-6 space-y-4">
                  <h4 className="text-xs uppercase font-extrabold text-muted-lux tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-accent-lux" /> Activity &amp; Transaction Ledger
                  </h4>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {localTransactions.map((tx) => (
                      <div key={tx.id} className="py-3 flex justify-between items-center text-left">
                        <div>
                          <span className="text-xs font-bold text-foreground block">{tx.desc}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">{tx.date} • {tx.status}</span>
                        </div>
                        <div className="text-right">
                          {tx.amount && (
                            <span className={`text-xs font-black block font-sans ${tx.type === "credit" ? "text-success-lux" : "text-slate-450 dark:text-slate-350"}`}>
                              {tx.type === "credit" ? "+" : "-"}{tx.amount}
                            </span>
                          )}
                          {tx.points && (
                            <span className="text-[10px] font-bold text-amber-500 block">
                              {tx.points}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Referral Module */}
                <div className="glass-panel p-6 space-y-4">
                  <h4 className="text-xs uppercase font-extrabold text-muted-lux tracking-wider flex items-center gap-1.5">
                    <Smile className="w-4 h-4 text-accent-lux" /> Invite Friends, Earn Cash
                  </h4>
                  <p className="text-xs text-slate-550 leading-relaxed">
                    Share your unique invitation link. When they confirm their first premium cleaning or jet wash service, we will add ₹250 to your wallet balance instantly.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value="https://helpmate.lux/refer/rohan50"
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs text-slate-500 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("https://helpmate.lux/refer/rohan50");
                        addNotification("Referral Link Copied", "Share it with friends to earn credits.", "info");
                      }}
                      className="px-5 py-2.5 rounded-xl bg-accent-lux hover:bg-accent-lux/95 text-xs font-bold text-white cursor-pointer"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === "settings" && (
              <div className="glass-panel p-6 sm:p-8 space-y-8 text-left">
                <div>
                  <h3 className="font-extrabold text-base text-foreground tracking-tight flex items-center gap-2">
                    <Settings className="w-5 h-5 text-accent-lux" /> Account &amp; Privacy Control
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Configure account settings, security updates, and push parameters.</p>
                </div>

                {/* Avatar and Profile Strength banner */}
                <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-slate-100 dark:border-slate-800/80 pb-6">
                  <div className="relative group cursor-pointer w-20 h-20 rounded-full overflow-hidden border-4 border-accent-lux shadow-lg shrink-0">
                    <img src={avatarUrl} alt={userName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="space-y-1 w-full text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-foreground">Profile Completion Score</h4>
                      <span className="text-[10px] font-extrabold text-success-lux">75% Completed</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-success-lux h-full rounded-full w-3/4" />
                    </div>
                    <p className="text-[10px] text-slate-450 pt-1">Add a secondary backup email to achieve 100% account security score.</p>
                  </div>
                </div>

                {/* Account Details Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-extrabold text-muted-lux tracking-wider flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-accent-lux" /> Full Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-lux"
                      />
                    </div>

                    {/* Mobile Line */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-extrabold text-muted-lux tracking-wider flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5 text-accent-lux" /> Mobile Line
                        </label>
                        <span className="text-[8px] bg-emerald-550/10 text-emerald-600 dark:text-emerald-500 font-extrabold uppercase px-2 py-0.5 rounded tracking-wide flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> OTP Verified
                        </span>
                      </div>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-lux"
                      />
                    </div>

                    {/* Primary Email */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-extrabold text-muted-lux tracking-wider flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-accent-lux" /> Primary Email Address
                        </label>
                        <span className="text-[8px] bg-emerald-550/10 text-emerald-600 dark:text-emerald-500 font-extrabold uppercase px-2 py-0.5 rounded tracking-wide flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Primary &amp; Verified
                        </span>
                      </div>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-lux"
                      />
                    </div>

                    {/* Secondary Email */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-extrabold text-muted-lux tracking-wider flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-accent-lux" /> Secondary / Recovery Email
                        </label>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide">
                          Optional Recovery
                        </span>
                      </div>
                      <input
                        type="email"
                        value={editSecondaryEmail}
                        onChange={(e) => setEditSecondaryEmail(e.target.value)}
                        placeholder="recovery.email@mail.com"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-lux"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!editName.trim() || !editPhone.trim()) return;
                      setIsSavingProfile(true);
                      setTimeout(() => {
                        updateProfile(editName.trim(), editPhone.trim());
                        setIsSavingProfile(false);
                        addNotification("Profile Updated", "Your modifications have been securely saved.", "success");
                      }, 1000);
                    }}
                    disabled={isSavingProfile}
                    className="bg-accent-lux hover:bg-accent-lux/95 text-white font-extrabold text-[10px] uppercase tracking-wider px-6 py-3 rounded-full shadow-md cursor-pointer flex items-center gap-1.5 mt-2 transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingProfile ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving Changes...
                      </>
                    ) : (
                      "Save Profile Details"
                    )}
                  </button>
                </div>

                {/* Notifications Panel */}
                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800/80">
                  <h4 className="text-xs uppercase font-extrabold text-muted-lux tracking-wider flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-accent-lux" /> Alert Preferences
                  </h4>
                  <p className="text-xs text-slate-550 leading-relaxed">
                    Select communication channels to receive real-time updates regarding service simulation alerts, ETAs, and coupons.
                  </p>

                  <div className="space-y-3">
                    {/* WhatsApp Toggle */}
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <div>
                        <span className="text-xs font-bold text-foreground">WhatsApp Instant Alerts</span>
                        <p className="text-[10px] text-slate-450 mt-0.5">Receive specialist assignments, tracking details, and bills directly.</p>
                      </div>
                      <button
                        onClick={() => setWhatsappUpdates(!whatsappUpdates)}
                        className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${whatsappUpdates ? "bg-success-lux" : "bg-slate-300 dark:bg-slate-800"}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${whatsappUpdates ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>

                    {/* SMS Toggle */}
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <div>
                        <span className="text-xs font-bold text-foreground">SMS Booking Verification</span>
                        <p className="text-[10px] text-slate-455 mt-0.5">Standard check-in credentials and status updates via texting.</p>
                      </div>
                      <button
                        onClick={() => setSmsUpdates(!smsUpdates)}
                        className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${smsUpdates ? "bg-success-lux" : "bg-slate-300 dark:bg-slate-800"}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${smsUpdates ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>

                    {/* Email Toggle */}
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <div>
                        <span className="text-xs font-bold text-foreground">Email Newsletter &amp; Offers</span>
                        <p className="text-[10px] text-slate-455 mt-0.5">Receive monthly promotions, invoice PDFs, and loyalty milestones updates.</p>
                      </div>
                      <button
                        onClick={() => setEmailUpdates(!emailUpdates)}
                        className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${emailUpdates ? "bg-success-lux" : "bg-slate-300 dark:bg-slate-800"}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${emailUpdates ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Collapsible settings */}
                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="text-xs font-extrabold text-accent-lux hover:underline flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                  >
                    <Key className="w-4 h-4" /> {showPasswordChange ? "Cancel security update" : "Update Account Password"}
                  </button>

                  <AnimatePresence>
                    {showPasswordChange && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 overflow-hidden pt-2 text-left"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-lux">Current Password</label>
                            <input
                              type="password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-lux">New Password</label>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-lux">Verify Password</label>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (!currentPassword || !newPassword || !confirmPassword) return;
                            if (newPassword !== confirmPassword) {
                              addNotification("Password Mismatch", "New passwords do not match.", "warning");
                              return;
                            }
                            addNotification("Password Saved", "Your security parameters have been updated.", "success");
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                            setShowPasswordChange(false);
                          }}
                          className="bg-slate-900 dark:bg-accent-lux hover:bg-slate-850 text-white font-extrabold text-[10px] uppercase tracking-wider px-6 py-3 rounded-full shadow-md cursor-pointer"
                        >
                          Modify Password
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>

      {/* Review Modal popup */}
      <AnimatePresence>
        {reviewingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewingBooking(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md glass-panel p-6 shadow-2xl flex flex-col space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
                <h4 className="font-bold text-sm text-foreground">Review service partner</h4>
                <button
                  onClick={() => setReviewingBooking(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-foreground" />
                </button>
              </div>

              {/* Partner Overview */}
              <div className="flex items-center gap-3">
                <img src={reviewingBooking.professional?.avatar} alt={reviewingBooking.professional?.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <span className="font-bold text-xs text-foreground block">{reviewingBooking.professional?.name}</span>
                  <span className="text-[10px] text-muted-lux uppercase block tracking-wider font-semibold">Service Specialist</span>
                </div>
              </div>

              {/* Star selector */}
              <div className="flex flex-col items-center justify-center gap-1.5 py-4 border-y border-slate-50 dark:border-slate-900">
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star className={`w-8 h-8 ${star <= reviewRating ? "fill-amber-500 text-amber-500" : "text-slate-350 dark:text-slate-700"}`} />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 font-sans">
                  {reviewRating > 0 ? `${reviewRating}.0 Stars Selected` : "Tap a star to rate"}
                </span>
              </div>

              {/* Message */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-bold text-muted-lux">Review Comment</label>
                <textarea
                  placeholder="Share details of your luxury service experience..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs text-foreground focus:outline-none"
                />
              </div>

              {/* Video Upload Section */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] uppercase font-bold text-muted-lux flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-accent-lux" /> Upload Video Review (Optional)
                  </span>
                  <span className="text-[9px] text-slate-400 font-normal">MP4, MOV, WEBM</span>
                </label>

                {!reviewVideoFile ? (
                  <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 cursor-pointer transition-all group">
                    <div className="w-9 h-9 rounded-full bg-accent-lux/10 text-accent-lux flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                      <Film className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-extrabold text-foreground">Click to select video clip</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Share short clip of service results</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 100 * 1024 * 1024) {
                            toast.error("File Too Large", "Video file size must be less than 100MB");
                            return;
                          }
                          setReviewVideoFile(file);
                        }
                      }}
                    />
                  </label>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-900 text-white relative flex flex-col gap-2 overflow-hidden border border-slate-800 shadow-md">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <Video className="w-4 h-4 text-accent-lux shrink-0" />
                        <span className="font-bold truncate text-[11px] text-slate-200">{reviewVideoFile.name}</span>
                        <span className="text-[9px] text-slate-400 shrink-0 font-mono">({(reviewVideoFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReviewVideoFile(null)}
                        className="p-1 rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Remove video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="relative rounded-xl overflow-hidden max-h-36 bg-black border border-slate-800">
                      <video
                        controls
                        src={URL.createObjectURL(reviewVideoFile)}
                        className="w-full h-full object-cover max-h-36"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {editingReviewId && (
                  <button
                    disabled={isSubmittingReview}
                    onClick={() => handleDeleteReview(editingReviewId)}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs py-3 rounded-full cursor-pointer transition-colors border border-red-500/20"
                  >
                    Delete Review
                  </button>
                )}
                <button
                  disabled={isSubmittingReview}
                  onClick={handleReviewSubmit}
                  className="flex-1 bg-accent-lux hover:bg-accent-lux/95 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-full cursor-pointer transition-colors"
                >
                  {isSubmittingReview ? "Processing..." : editingReviewId ? "Update Review" : "Submit Feedback"}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Modal */}
      <InvoiceModal
        bookingId={invoiceModalBookingId}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />

      <Footer />
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 text-xs">Loading profile dashboard...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
