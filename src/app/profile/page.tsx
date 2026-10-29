"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
  ChevronLeft,
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
  ShoppingCart,
  Video,
  Film,
  UploadCloud,
  ArrowLeft,
  FileText,
  Search,
  Filter,
  Tag,
  RotateCcw,
  X,
  ChevronDown,
  CalendarDays,
  PhoneCall,
  Save,
  CheckCircle2,
  Sparkles,
  Loader2
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
    userAvatar,
    userAlternatePhone,
    userEmail: storeEmail,
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
    cart,
    cancelBooking,
    rescheduleBooking,
    updateBookingStatus,
    addNotification,
    updateProfile,
    updateCustomerProfileAsync,
    uploadCustomerProfileImageAsync,
    addWalletFunds,
    redeemLoyaltyPoints,
    fetchCustomerProfile,
    createReviewAsync,
    updateReviewAsync,
    deleteReviewAsync,
    attachReviewToBooking,
    token
  } = useStore();


  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!token) {
      router.push("/login?redirect=%2Fprofile");
    } else {
      fetchCustomerProfile();
      fetchAddresses();
      fetchBookmarks();
      fetchBookings();
    }
  }, [mounted, token, router, fetchCustomerProfile, fetchAddresses, fetchBookmarks, fetchBookings]);

  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "saved"
      ? "bookmarks"
      : searchParams.get("tab") === "settings"
        ? "profile"
        : (searchParams.get("tab") || "bookings")
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "saved" || tab === "bookmarks") {
      setActiveTab("bookmarks");
    } else if (tab === "settings") {
      setActiveTab("profile");
    } else if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === "addresses" && token) {
      fetchAddresses(true);
    }
  }, [activeTab, token, fetchAddresses]);

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

  // Booking History Search and Filter States
  const [bookingSearchQuery, setBookingSearchQuery] = useState("");
  const [bookingCategoryFilter, setBookingCategoryFilter] = useState("all");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [bookingDateFilter, setBookingDateFilter] = useState<"all" | "today" | "this_week" | "this_month" | "last_3_months" | "custom">("all");
  const [bookingCustomStartDate, setBookingCustomStartDate] = useState("");
  const [bookingCustomEndDate, setBookingCustomEndDate] = useState("");

  // Custom Calendar State for Date Range Picker
  const [dateFilterView, setDateFilterView] = useState<"presets" | "calendar">("presets");
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarHoverDate, setCalendarHoverDate] = useState<string | null>(null);

  // Custom Dropdown Open State and Refs for Click-Outside
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);
  const dateDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Dynamically extract ONLY categories present in user's bookings with counts
  const bookingCategories = React.useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number }>();

    bookings.forEach((b) => {
      const catsInBooking = new Set<string>();

      if (b.categoryName) {
        catsInBooking.add(b.categoryName.trim());
      }
      b.items?.forEach((item) => {
        if (item.categoryName) {
          catsInBooking.add(item.categoryName.trim());
        } else if (item.category && item.category !== "general") {
          const formatted = item.category
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          catsInBooking.add(formatted);
        }
      });

      catsInBooking.forEach((catLabel) => {
        const lower = catLabel.toLowerCase();
        const existing = map.get(lower);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(lower, { key: lower, label: catLabel, count: 1 });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [bookings]);

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const formatDateKey = (year: number, month: number, day: number): string => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return dateStr;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatDisplayDateRange = (startStr: string, endStr: string): string => {
    if (!startStr && !endStr) return "Custom";
    if (startStr && !endStr) return `From ${formatDisplayDate(startStr)}`;
    if (!startStr && endStr) return `Up to ${formatDisplayDate(endStr)}`;
    if (startStr === endStr) return formatDisplayDate(startStr);
    return `${formatDisplayDate(startStr)} - ${formatDisplayDate(endStr)}`;
  };

  const getDateFilterLabel = () => {
    if (bookingDateFilter === "all") return "All Time";
    if (bookingDateFilter === "today") return "Today";
    if (bookingDateFilter === "this_week") return "This Week";
    if (bookingDateFilter === "this_month") return "This Month";
    if (bookingDateFilter === "last_3_months") return "3 Months";
    if (bookingDateFilter === "custom") {
      if (bookingCustomStartDate && bookingCustomEndDate) {
        return formatDisplayDateRange(bookingCustomStartDate, bookingCustomEndDate);
      }
      if (bookingCustomStartDate) return `From ${formatDisplayDate(bookingCustomStartDate)}`;
      if (bookingCustomEndDate) return `Up to ${formatDisplayDate(bookingCustomEndDate)}`;
      return "Custom";
    }
    return "All Time";
  };

  // Date parsing helper
  const getBookingDates = (b: Booking): Date[] => {
    const dates: Date[] = [];
    const candidates = [b.rawBookingDate, b.date, b.rawCreatedAt, b.dateCreated];
    for (const c of candidates) {
      if (!c) continue;
      const parsed = new Date(c);
      if (!isNaN(parsed.getTime())) {
        dates.push(parsed);
      }
    }
    return dates;
  };

  const isToday = (d: Date) => {
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const isThisWeek = (d: Date) => {
    const now = new Date();
    const diffDays = Math.abs(d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  const isThisMonth = (d: Date) => {
    const now = new Date();
    const isSameMonth = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    const diffDays = Math.abs(d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return isSameMonth || diffDays <= 30;
  };

  const isLast3Months = (d: Date) => {
    const now = new Date();
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= -7 && diffDays <= 90;
  };

  const isCustomRange = (d: Date) => {
    if (bookingCustomStartDate) {
      const [sy, sm, sd] = bookingCustomStartDate.split("-").map(Number);
      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      if (d < start) return false;
    }
    if (bookingCustomEndDate) {
      const [ey, em, ed] = bookingCustomEndDate.split("-").map(Number);
      const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  };

  // Filter evaluation
  const filteredBookings = React.useMemo(() => {
    return [...bookings]
      .filter((b) => {
        // Search filter
        if (bookingSearchQuery.trim()) {
          const q = bookingSearchQuery.toLowerCase().trim();
          const matchesId = (b.bookingNumber || "").toLowerCase().includes(q) || (b.id || "").toLowerCase().includes(q);
          const matchesStatus = (b.status || "").toLowerCase().includes(q);
          const matchesAddress =
            (b.address?.addressLine || "").toLowerCase().includes(q) ||
            (b.address?.city || "").toLowerCase().includes(q) ||
            (b.address?.tag || "").toLowerCase().includes(q);
          const matchesPro = (b.professional?.name || "").toLowerCase().includes(q);
          const matchesDate = (b.date || "").toLowerCase().includes(q) || (b.timeSlot || "").toLowerCase().includes(q);
          const matchesItems = b.items?.some((item) =>
            (item.name || "").toLowerCase().includes(q) ||
            (item.category || "").toLowerCase().includes(q) ||
            (item.categoryName || "").toLowerCase().includes(q)
          );
          const matchesCat = (b.categoryName || "").toLowerCase().includes(q);

          if (!matchesId && !matchesStatus && !matchesAddress && !matchesPro && !matchesDate && !matchesItems && !matchesCat) {
            return false;
          }
        }

        // Category filter
        if (bookingCategoryFilter !== "all") {
          const target = bookingCategoryFilter.toLowerCase().trim();
          const targetSlug = target.replace(/[^a-z0-9]+/g, "-");
          const targetNormalized = target.replace(/[^a-z0-9]/g, "");

          const catNameMatches = (b.categoryName || "").toLowerCase().includes(target);
          const itemsMatch = b.items?.some((item) => {
            const itemCatName = (item.categoryName || "").toLowerCase();
            const itemCat = (item.category || "").toLowerCase();
            const itemCatNormalized = itemCat.replace(/[^a-z0-9]/g, "");

            return (
              itemCatName.includes(target) ||
              target.includes(itemCatName) ||
              itemCat.includes(targetSlug) ||
              targetSlug.includes(itemCat) ||
              itemCatNormalized.includes(targetNormalized)
            );
          });

          if (!catNameMatches && !itemsMatch) {
            return false;
          }
        }

        // Status filter
        if (bookingStatusFilter !== "all") {
          if ((b.status || "").toLowerCase() !== bookingStatusFilter.toLowerCase()) {
            return false;
          }
        }

        // Date filter
        if (bookingDateFilter !== "all") {
          const dates = getBookingDates(b);
          if (dates.length > 0) {
            if (bookingDateFilter === "today") {
              const isTodayMatch = dates.some(isToday) || (b.date || "").toLowerCase() === "today";
              if (!isTodayMatch) return false;
            } else if (bookingDateFilter === "this_week") {
              if (!dates.some(isThisWeek)) return false;
            } else if (bookingDateFilter === "this_month") {
              if (!dates.some(isThisMonth)) return false;
            } else if (bookingDateFilter === "last_3_months") {
              if (!dates.some(isLast3Months)) return false;
            } else if (bookingDateFilter === "custom") {
              if (!dates.some(isCustomRange)) return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
  }, [
    bookings,
    bookingSearchQuery,
    bookingCategoryFilter,
    bookingStatusFilter,
    bookingDateFilter,
    bookingCustomStartDate,
    bookingCustomEndDate
  ]);

  const hasActiveFilters =
    bookingSearchQuery.trim() !== "" ||
    bookingCategoryFilter !== "all" ||
    bookingStatusFilter !== "all" ||
    bookingDateFilter !== "all" ||
    bookingCustomStartDate !== "" ||
    bookingCustomEndDate !== "";

  const handleResetFilters = () => {
    setBookingSearchQuery("");
    setBookingCategoryFilter("all");
    setBookingStatusFilter("all");
    setBookingDateFilter("all");
    setBookingCustomStartDate("");
    setBookingCustomEndDate("");
    setDateFilterView("presets");
    setIsCategoryDropdownOpen(false);
    setIsDateDropdownOpen(false);
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
  // Helper to extract 10 phone digits
  const extractPhoneDigits = (val?: string) => {
    if (!val) return "";
    return val.replace(/\D/g, "").slice(-10);
  };

  const [editName, setEditName] = useState(userName || "");
  const [editPhone, setEditPhone] = useState(extractPhoneDigits(userPhone) || "");
  const [editAlternatePhone, setEditAlternatePhone] = useState(extractPhoneDigits(userAlternatePhone) || "");
  const [editEmail, setEditEmail] = useState(storeEmail || "");
  const [editSecondaryEmail, setEditSecondaryEmail] = useState("");
  const sanitizeAvatar = (url?: string | null) => {
    if (!url) return "";
    if (url.includes("unsplash.com") && url.includes("photo-1472099645785")) return "";
    return url;
  };

  const [avatarUrl, setAvatarUrl] = useState(sanitizeAvatar(userAvatar));
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; alternatePhone?: string }>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    setEditName(userName || "");
    setEditPhone(extractPhoneDigits(userPhone) || "");
    setEditAlternatePhone(extractPhoneDigits(userAlternatePhone) || "");
    setAvatarUrl(sanitizeAvatar(userAvatar));
    if (storeEmail) setEditEmail(storeEmail);
  }, [userName, userPhone, userAlternatePhone, userAvatar, storeEmail]);

  // Profile completeness score (4 key items, 25% each)
  const profileScore = Math.min(100,
    (editName.trim().length >= 2 ? 25 : 0) +
    (editPhone.replace(/\D/g, "").length === 10 ? 25 : 0) +
    (avatarUrl ? 25 : 0) +
    (editAlternatePhone.replace(/\D/g, "").length === 10 ? 25 : 0)
  );

  const hasUnsavedChanges =
    editName.trim() !== (userName || "").trim() ||
    editPhone.replace(/\D/g, "") !== extractPhoneDigits(userPhone) ||
    editAlternatePhone.replace(/\D/g, "") !== extractPhoneDigits(userAlternatePhone) ||
    avatarUrl !== sanitizeAvatar(userAvatar) ||
    editEmail.trim() !== (storeEmail || "").trim();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      const err = "Please select a valid image file (JPG, PNG, or WebP).";
      setAvatarError(err);
      toast.error("Invalid File", err);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const err = "Image file size must be less than 5 MB.";
      setAvatarError(err);
      toast.error("File Too Large", err);
      return;
    }

    setAvatarError(null);
    setAvatarFile(file);

    // Show immediate local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setAvatarUrl(event.target.result);
        setAvatarLoaded(true);
      }
    };
    reader.readAsDataURL(file);

    // Upload directly via PUT /api/customer/auth/profile/image
    if (token) {
      setIsUploadingAvatar(true);
      try {
        const res = await uploadCustomerProfileImageAsync(file);
        if (res.success) {
          toast.success("Profile Photo Uploaded", res.message || "Your profile image was updated successfully.");
        } else {
          toast.error("Upload Failed", res.message || "Failed to upload profile image.");
        }
      } catch (err: any) {
        toast.error("Upload Error", err?.message || "Failed to upload profile image.");
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarError(null);
    setAvatarUrl("");
    setAvatarLoaded(false);
    if (avatarFileInputRef.current) {
      avatarFileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    const errors: { name?: string; phone?: string; alternatePhone?: string } = {};

    const trimmedName = editName.trim();
    if (!trimmedName) {
      errors.name = "Full name is required.";
    } else if (trimmedName.length < 2) {
      errors.name = "Full name must be at least 2 characters.";
    }

    const cleanPrimary = editPhone.replace(/\D/g, "");
    if (!cleanPrimary) {
      errors.phone = "Primary mobile number is required.";
    } else if (cleanPrimary.length !== 10) {
      errors.phone = "Primary mobile number must be exactly 10 digits.";
    }

    const cleanAlt = editAlternatePhone.replace(/\D/g, "");
    if (cleanAlt) {
      if (cleanAlt.length !== 10) {
        errors.alternatePhone = "Alternate mobile number must be exactly 10 digits.";
      } else if (cleanAlt === cleanPrimary) {
        errors.alternatePhone = "Alternate mobile number must be different from primary mobile.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fix the validation errors before saving.");
      return;
    }

    setFormErrors({});
    setIsSavingProfile(true);

    try {
      if (token) {
        await updateCustomerProfileAsync({
          fullName: trimmedName,
          email: editEmail.trim(),
          alternatePhone: cleanAlt,
        });
      }

      const formattedPrimary = `+91 ${cleanPrimary.slice(0, 5)} ${cleanPrimary.slice(5)}`;
      const formattedAlt = cleanAlt ? `+91 ${cleanAlt.slice(0, 5)} ${cleanAlt.slice(5)}` : "";

      updateProfile(trimmedName, formattedPrimary, formattedAlt, avatarUrl, editEmail.trim());
      addNotification("Profile Updated", "Your profile photo and contact details have been securely updated.", "success");
    } catch (err: any) {
      toast.error("Update Failed", err?.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResetProfile = () => {
    setEditName(userName || "");
    setEditPhone(extractPhoneDigits(userPhone) || "");
    setEditAlternatePhone(extractPhoneDigits(userAlternatePhone) || "");
    setAvatarUrl(sanitizeAvatar(userAvatar));
    setAvatarFile(null);
    setAvatarError(null);
    setFormErrors({});
    if (avatarFileInputRef.current) {
      avatarFileInputRef.current.value = "";
    }
    toast.info("Changes discarded.");
  };





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
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 space-y-4 sm:space-y-6">
          {/* Top Bar Navigation: Back Button & Breadcrumbs */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-extrabold shadow-sm transition-all cursor-pointer hover:border-accent-lux/40 active:scale-95"
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">

          {/* Profile Navigation Sidebar - Sticky On Desktop */}
          <nav className="lg:col-span-3 glass-panel p-4 sm:p-6 space-y-2 shrink-0 rounded-2xl sm:rounded-3xl lg:sticky lg:top-28 z-20 self-start transition-all lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto no-scrollbar shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="pb-4 sm:pb-6 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center gap-3.5 sm:gap-4 text-left">
              <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center shrink-0">
                <svg className="w-full h-full absolute inset-0 -rotate-90 pointer-events-none" viewBox="0 0 72 72">
                  <circle
                    cx="36"
                    cy="36"
                    r="32"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    className="text-slate-200 dark:text-slate-800"
                    fill="transparent"
                  />
                  <circle
                    cx="36"
                    cy="36"
                    r="32"
                    stroke="#D97706"
                    strokeWidth="3.5"
                    strokeDasharray={201.06}
                    strokeDashoffset={201.06 - (201.06 * profileScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                    fill="transparent"
                  />
                </svg>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden p-0.5 bg-white dark:bg-slate-900 shadow-md relative flex items-center justify-center">
                  {isUploadingAvatar ? (
                    <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-accent-lux" />
                    </div>
                  ) : avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={userName || "Profile"}
                      className="w-full h-full object-cover rounded-full"
                      onError={() => setAvatarUrl("")}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse flex flex-col items-center justify-center pt-1.5 overflow-hidden">
                      <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700 mb-0.5" />
                      <div className="w-8 h-4 rounded-t-full bg-slate-300 dark:bg-slate-700" />
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-0.5 text-[8px] font-black bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-1.5 py-0.5 rounded-full shadow border border-white dark:border-slate-900">
                  {profileScore}%
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5 justify-start">
                  <h3 className="font-bold text-sm sm:text-base text-foreground truncate">{userName}</h3>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 sm:mt-1 truncate">{userPhone}</p>
                {userAlternatePhone ? (
                  <p className="text-[9px] text-slate-400/80 truncate">Alt: {userAlternatePhone}</p>
                ) : null}
                <div className="flex items-center gap-2 mt-1.5 sm:mt-2 justify-start">
                  <span className="bg-gradient-to-r from-accent-lux to-secondary-lux text-white text-[8px] font-extrabold px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wider">
                    Elite Member
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 sm:pt-4 flex flex-row lg:flex-col overflow-x-auto no-scrollbar gap-1.5 sm:space-y-1 pb-1 lg:pb-0">
              {[
                { id: "profile", label: "Profile Details", icon: <User className="w-4 h-4" /> },
                { id: "bookings", label: "Booking History", icon: <Calendar className="w-4 h-4" /> },
                { id: "bookmarks", label: "Saved Packages", icon: <Bookmark className="w-4 h-4" /> },
                { id: "addresses", label: "Manage Address", icon: <MapPin className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    router.replace(`/profile?tab=${tab.id}`, { scroll: false });
                  }}
                  className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer shrink-0 whitespace-nowrap ${(activeTab === tab.id || (tab.id === "profile" && activeTab === "settings"))
                    ? "bg-accent-lux text-white shadow-lg shadow-accent-lux/10"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                  {tab.icon} <span>{tab.label}</span>
                </button>
              ))}

              <div className="hidden lg:block pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
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
                {isLoadingBookings ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                          Service Booking History
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Search, filter, track and review all your home service bookings and tax invoices.
                        </p>
                      </div>    
                    </div>
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
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                          Service Booking History
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-accent-lux/10 text-accent-lux">
                            0
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Search, filter, track and review all your home service bookings and tax invoices.
                        </p>
                      </div>    
                    </div>
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
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Search & Custom Filter Toolbar on Top (Sticky) */}
                    <div className="sticky top-20 sm:top-24 lg:top-28 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/90 shadow-md space-y-3.5">
                      {/* Top Header: Title + Live Filtered Count */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                            Service Booking History
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-accent-lux/10 text-accent-lux">
                              {filteredBookings.length === bookings.length
                                ? bookings.length
                                : `${filteredBookings.length} of ${bookings.length}`}
                            </span>
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Search, filter, track and review all your home service bookings and tax invoices.
                          </p>
                        </div>
                      </div>

                      {/* Filter Controls Row: Search + Custom Category Dropdown + Custom Date Dropdown + Reset */}
                      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
                        {/* Search Input */}
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={bookingSearchQuery}
                            onChange={(e) => setBookingSearchQuery(e.target.value)}
                            placeholder="Search by ID, package, pro, locality..."
                            className="w-full bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800 pl-9 pr-8 py-2 rounded-xl text-xs font-medium text-foreground placeholder:text-slate-400 focus:outline-none focus:border-accent-lux focus:ring-2 focus:ring-accent-lux/20 transition-all shadow-2xs"
                          />
                          {bookingSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setBookingSearchQuery("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                              title="Clear search"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Custom Category Dropdown (Only categories that have bookings) */}
                        <div ref={categoryDropdownRef} className="relative md:w-48 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                              setIsDateDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              isCategoryDropdownOpen
                                ? "border-accent-lux ring-2 ring-accent-lux/20 bg-white dark:bg-slate-900 text-foreground shadow-sm"
                                : bookingCategoryFilter !== "all"
                                ? "border-accent-lux bg-accent-lux/10 text-accent-lux font-bold shadow-2xs"
                                : "border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Tag className={`w-3.5 h-3.5 shrink-0 ${bookingCategoryFilter !== "all" ? "text-accent-lux" : "text-slate-400"}`} />
                              <span className="truncate">
                                {bookingCategoryFilter === "all"
                                  ? "All Categories"
                                  : bookingCategories.find(c => c.key === bookingCategoryFilter)?.label || "Category"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                bookingCategoryFilter !== "all"
                                  ? "bg-accent-lux text-white shadow-2xs"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                              }`}>
                                {bookingCategoryFilter === "all"
                                  ? bookings.length
                                  : bookingCategories.find(c => c.key === bookingCategoryFilter)?.count || 0}
                              </span>
                              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isCategoryDropdownOpen ? "rotate-180 text-accent-lux" : ""}`} />
                            </div>
                          </button>

                          <AnimatePresence>
                            {isCategoryDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 right-0 md:left-auto md:w-56 mt-2 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 space-y-1 max-h-64 overflow-y-auto"
                              >
                                <div className="px-2.5 py-1.5 text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                                  <span>Categories with Bookings</span>
                                  <span className="text-[9px] text-accent-lux font-bold">{bookingCategories.length} active</span>
                                </div>

                                {/* All Categories Option */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBookingCategoryFilter("all");
                                    setIsCategoryDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                                    bookingCategoryFilter === "all"
                                      ? "bg-accent-lux text-white font-bold shadow-xs"
                                      : "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${bookingCategoryFilter === "all" ? "bg-white" : "bg-slate-300 dark:bg-slate-600"}`} />
                                    <span>All Categories</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                      bookingCategoryFilter === "all" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                    }`}>
                                      {bookings.length}
                                    </span>
                                    {bookingCategoryFilter === "all" && <Check className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                </button>

                                {/* Only Categories with Bookings */}
                                {bookingCategories.map((cat) => {
                                  const isSelected = bookingCategoryFilter === cat.key;
                                  return (
                                    <button
                                      key={cat.key}
                                      type="button"
                                      onClick={() => {
                                        setBookingCategoryFilter(cat.key);
                                        setIsCategoryDropdownOpen(false);
                                      }}
                                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                                        isSelected
                                          ? "bg-accent-lux text-white font-bold shadow-xs"
                                          : "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? "bg-white" : "bg-accent-lux"}`} />
                                        <span className="truncate">{cat.label}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                          isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                        }`}>
                                          {cat.count}
                                        </span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Custom Date Dropdown */}
                        <div ref={dateDropdownRef} className="relative md:w-44 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const nextOpen = !isDateDropdownOpen;
                              setIsDateDropdownOpen(nextOpen);
                              setIsCategoryDropdownOpen(false);
                              if (nextOpen) {
                                if (bookingDateFilter === "custom") {
                                  setDateFilterView("calendar");
                                  if (bookingCustomStartDate) {
                                    const [y, m] = bookingCustomStartDate.split("-").map(Number);
                                    if (y && m) {
                                      setCalendarYear(y);
                                      setCalendarMonth(m - 1);
                                    }
                                  }
                                } else {
                                  setDateFilterView("presets");
                                }
                              }
                            }}
                            className={`w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              isDateDropdownOpen
                                ? "border-accent-lux ring-2 ring-accent-lux/20 bg-white dark:bg-slate-900 text-foreground shadow-sm"
                                : bookingDateFilter !== "all"
                                ? "border-accent-lux bg-accent-lux/10 text-accent-lux font-bold shadow-2xs"
                                : "border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Calendar className={`w-3.5 h-3.5 shrink-0 ${bookingDateFilter !== "all" ? "text-accent-lux" : "text-slate-400"}`} />
                              <span className="truncate">{getDateFilterLabel()}</span>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isDateDropdownOpen ? "rotate-180 text-accent-lux" : ""}`} />
                          </button>

                          <AnimatePresence>
                            {isDateDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className={`absolute right-0 mt-2 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 transition-all ${
                                  dateFilterView === "presets" ? "w-48 sm:w-52" : "w-72 max-w-[calc(100vw-2rem)]"
                                }`}
                              >
                                {dateFilterView === "presets" ? (
                                  <div className="space-y-1">
                                    <div className="px-2 py-1 text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                      <span>Filter by Date</span>
                                      <button
                                        type="button"
                                        onClick={() => setIsDateDropdownOpen(false)}
                                        className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <div className="space-y-0.5 pt-0.5">
                                      {[
                                        { id: "all", label: "All Time" },
                                        { id: "today", label: "Today" },
                                        { id: "this_week", label: "This Week" },
                                        { id: "this_month", label: "This Month" },
                                        { id: "last_3_months", label: "3 Months" },
                                        { id: "custom", label: "Custom" },
                                      ].map((preset) => {
                                        const isSelected = bookingDateFilter === preset.id;
                                        return (
                                          <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => {
                                              if (preset.id === "custom") {
                                                setBookingDateFilter("custom");
                                                setDateFilterView("calendar");
                                                if (bookingCustomStartDate) {
                                                  const [y, m] = bookingCustomStartDate.split("-").map(Number);
                                                  if (y && m) {
                                                    setCalendarYear(y);
                                                    setCalendarMonth(m - 1);
                                                  }
                                                } else {
                                                  const now = new Date();
                                                  setCalendarYear(now.getFullYear());
                                                  setCalendarMonth(now.getMonth());
                                                }
                                              } else {
                                                setBookingDateFilter(preset.id as any);
                                                setBookingCustomStartDate("");
                                                setBookingCustomEndDate("");
                                                setIsDateDropdownOpen(false);
                                              }
                                            }}
                                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                                              isSelected
                                                ? "bg-accent-lux text-white font-bold shadow-xs"
                                                : "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                                            }`}
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              {preset.id === "custom" && (
                                                <CalendarDays className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-white" : "text-accent-lux"}`} />
                                              )}
                                              <span className="text-xs font-semibold">{preset.label}</span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 ml-1.5">
                                              {preset.id === "custom" && bookingCustomStartDate && bookingCustomEndDate && (
                                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                                  isSelected ? "bg-white/20 text-white" : "bg-accent-lux/10 text-accent-lux"
                                                }`}>
                                                  {formatDisplayDate(bookingCustomStartDate)} - {formatDisplayDate(bookingCustomEndDate)}
                                                </span>
                                              )}
                                              {isSelected && <Check className="w-3 h-3 text-white" />}
                                              {preset.id === "custom" && (
                                                <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? "text-white/80" : "text-slate-400"}`} />
                                              )}
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  /* Custom Date Range Calendar View */
                                  <div className="space-y-2">
                                    {/* Header */}
                                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                                      <button
                                        type="button"
                                        onClick={() => setDateFilterView("presets")}
                                        className="flex items-center gap-0.5 text-[11px] font-bold text-accent-lux hover:opacity-80 transition-opacity cursor-pointer"
                                      >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                        <span>Presets</span>
                                      </button>
                                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                                        Custom Range
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setIsDateDropdownOpen(false)}
                                        className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Month Navigation */}
                                    <div className="flex items-center justify-between px-0.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (calendarMonth === 0) {
                                            setCalendarMonth(11);
                                            setCalendarYear((y) => y - 1);
                                          } else {
                                            setCalendarMonth((m) => m - 1);
                                          }
                                        }}
                                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                        title="Previous Month"
                                      >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                      </button>
                                      <div className="text-xs font-bold text-foreground">
                                        {MONTH_NAMES[calendarMonth]} {calendarYear}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (calendarMonth === 11) {
                                            setCalendarMonth(0);
                                            setCalendarYear((y) => y + 1);
                                          } else {
                                            setCalendarMonth((m) => m + 1);
                                          }
                                        }}
                                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                        title="Next Month"
                                      >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Weekdays Row */}
                                    <div className="grid grid-cols-7 gap-0.5 text-center">
                                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                                        <div key={day} className="text-[9px] font-black uppercase text-slate-400 py-0.5">
                                          {day}
                                        </div>
                                      ))}
                                    </div>

                                    {/* Calendar Days Grid */}
                                    {(() => {
                                      const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                                      const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
                                      const todayDateKey = formatDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

                                      const handleCalendarDateClick = (dateStr: string) => {
                                        if (!bookingCustomStartDate || (bookingCustomStartDate && bookingCustomEndDate)) {
                                          setBookingCustomStartDate(dateStr);
                                          setBookingCustomEndDate("");
                                        } else if (bookingCustomStartDate && !bookingCustomEndDate) {
                                          if (dateStr < bookingCustomStartDate) {
                                            setBookingCustomStartDate(dateStr);
                                          } else {
                                            setBookingCustomEndDate(dateStr);
                                          }
                                        }
                                      };

                                      return (
                                        <div
                                          className="grid grid-cols-7 gap-y-0.5 gap-x-0"
                                          onMouseLeave={() => setCalendarHoverDate(null)}
                                        >
                                          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                                            <div key={`empty-${i}`} className="h-7 w-full" />
                                          ))}
                                          {Array.from({ length: daysInMonth }, (_, i) => {
                                            const dayNum = i + 1;
                                            const dateStr = formatDateKey(calendarYear, calendarMonth, dayNum);
                                            const isStart = bookingCustomStartDate === dateStr;
                                            const isEnd = bookingCustomEndDate === dateStr;

                                            const hoverEnd =
                                              !bookingCustomEndDate &&
                                              bookingCustomStartDate &&
                                              calendarHoverDate &&
                                              calendarHoverDate >= bookingCustomStartDate
                                                ? calendarHoverDate
                                                : null;
                                            const effectiveEnd = bookingCustomEndDate || hoverEnd;

                                            const isInRange = Boolean(
                                              bookingCustomStartDate &&
                                              effectiveEnd &&
                                              dateStr > bookingCustomStartDate &&
                                              dateStr < effectiveEnd
                                            );

                                            const isHoverTarget = Boolean(
                                              !bookingCustomEndDate &&
                                              bookingCustomStartDate &&
                                              calendarHoverDate === dateStr &&
                                              dateStr >= bookingCustomStartDate
                                            );

                                            const isTodayDate = dateStr === todayDateKey;

                                            return (
                                              <div
                                                key={dateStr}
                                                className={`h-7 w-full flex items-center justify-center relative transition-colors ${
                                                  isInRange ? "bg-accent-lux/15 dark:bg-accent-lux/25" : ""
                                                } ${
                                                  isStart && effectiveEnd && effectiveEnd !== bookingCustomStartDate
                                                    ? "bg-gradient-to-r from-transparent to-accent-lux/15 dark:to-accent-lux/25 rounded-l-md"
                                                    : ""
                                                } ${
                                                  (isEnd || isHoverTarget) && bookingCustomStartDate && bookingCustomStartDate !== dateStr
                                                    ? "bg-gradient-to-l from-transparent to-accent-lux/15 dark:to-accent-lux/25 rounded-r-md"
                                                    : ""
                                                }`}
                                                onMouseEnter={() => {
                                                  if (bookingCustomStartDate && !bookingCustomEndDate) {
                                                    setCalendarHoverDate(dateStr);
                                                  }
                                                }}
                                              >
                                                <button
                                                  type="button"
                                                  onClick={() => handleCalendarDateClick(dateStr)}
                                                  className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center text-[11px] font-semibold transition-all cursor-pointer ${
                                                    isStart || isEnd
                                                      ? "bg-accent-lux text-white font-bold shadow-xs scale-105 z-10"
                                                      : isHoverTarget
                                                      ? "border border-accent-lux text-accent-lux font-bold z-10"
                                                      : isInRange
                                                      ? "text-accent-lux font-bold hover:bg-accent-lux/30"
                                                      : isTodayDate
                                                      ? "border border-accent-lux/60 text-accent-lux font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                                                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                  }`}
                                                >
                                                  {dayNum}
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}

                                    {/* Quick Shortcut Tags */}
                                    <div className="flex items-center gap-1 flex-wrap pt-1.5 border-t border-slate-100 dark:border-slate-800">
                                      <span className="text-[9px] font-bold uppercase text-slate-400 mr-0.5">Quick:</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const now = new Date();
                                          const past7 = new Date();
                                          past7.setDate(now.getDate() - 7);
                                          setBookingCustomStartDate(formatDateKey(past7.getFullYear(), past7.getMonth(), past7.getDate()));
                                          setBookingCustomEndDate(formatDateKey(now.getFullYear(), now.getMonth(), now.getDate()));
                                          setCalendarYear(now.getFullYear());
                                          setCalendarMonth(now.getMonth());
                                        }}
                                        className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-accent-lux/10 hover:text-accent-lux text-[9px] font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                      >
                                        Last 7 Days
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const now = new Date();
                                          const past30 = new Date();
                                          past30.setDate(now.getDate() - 30);
                                          setBookingCustomStartDate(formatDateKey(past30.getFullYear(), past30.getMonth(), past30.getDate()));
                                          setBookingCustomEndDate(formatDateKey(now.getFullYear(), now.getMonth(), now.getDate()));
                                          setCalendarYear(now.getFullYear());
                                          setCalendarMonth(now.getMonth());
                                        }}
                                        className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-accent-lux/10 hover:text-accent-lux text-[9px] font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                      >
                                        Last 30 Days
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const now = new Date();
                                          const first = new Date(now.getFullYear(), now.getMonth(), 1);
                                          const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                                          setBookingCustomStartDate(formatDateKey(first.getFullYear(), first.getMonth(), first.getDate()));
                                          setBookingCustomEndDate(formatDateKey(last.getFullYear(), last.getMonth(), last.getDate()));
                                          setCalendarYear(now.getFullYear());
                                          setCalendarMonth(now.getMonth());
                                        }}
                                        className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-accent-lux/10 hover:text-accent-lux text-[9px] font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                      >
                                        This Month
                                      </button>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                                      <div className="min-w-0">
                                        <div className="text-[9px] uppercase font-bold text-slate-400">Selected</div>
                                        <div className="text-[11px] font-bold text-foreground truncate">
                                          {bookingCustomStartDate && bookingCustomEndDate ? (
                                            `${formatDisplayDate(bookingCustomStartDate)} — ${formatDisplayDate(bookingCustomEndDate)}`
                                          ) : bookingCustomStartDate ? (
                                            <span className="text-accent-lux">Pick end date...</span>
                                          ) : (
                                            <span className="text-slate-400">Pick range</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {(bookingCustomStartDate || bookingCustomEndDate) && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setBookingCustomStartDate("");
                                              setBookingCustomEndDate("");
                                            }}
                                            className="px-2 py-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold transition-colors cursor-pointer"
                                          >
                                            Clear
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (bookingCustomStartDate && !bookingCustomEndDate) {
                                              setBookingCustomEndDate(bookingCustomStartDate);
                                            }
                                            setIsDateDropdownOpen(false);
                                          }}
                                          disabled={!bookingCustomStartDate}
                                          className="px-2.5 py-1 rounded-lg bg-accent-lux hover:bg-accent-lux/95 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold cursor-pointer shadow-xs transition-all active:scale-95"
                                        >
                                          Apply Range
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Reset Filters button */}
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer shrink-0 active:scale-95"
                            title="Reset all filters"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Reset</span>
                          </button>
                        )}
                      </div>

                    
                    </div>

                    {/* Bookings List or Empty Search State */}
                    {filteredBookings.length === 0 ? (
                      <div className="glass-panel p-10 sm:p-14 rounded-3xl text-center flex flex-col items-center justify-center space-y-3.5 border border-slate-200/60 dark:border-slate-800">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xs">
                          <Search className="w-6 h-6" />
                        </div>
                        <div className="space-y-1 max-w-sm">
                          <h4 className="text-sm sm:text-base font-extrabold text-foreground">
                            No Bookings Match Your Filters
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            No service bookings matched your search query or filter selection. Try adjusting the keywords or resetting filters.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent-lux hover:bg-accent-lux/95 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Clear Filters</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredBookings.map((b) => (
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
                        key={editingAddress ? `edit-${editingAddress.id}` : "add-address"}
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
                            await fetchAddresses(true);
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
                      const isCartAdded = cart?.some(
                        (c) => String(c.id) === String(packageId) || String(c.itemId) === String(packageId) || String((c as any).packageId) === String(packageId)
                      );

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
                            {/* Add to Cart Icon Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (isCartAdded) {
                                  toast.info("Package is already in your cart.");
                                  return;
                                }
                                addToCart({
                                  id: packageId,
                                  itemId: packageId,
                                  packageId: packageId,
                                  name: pkg.packageName,
                                  price: pkg.price,
                                  category: pkg.serviceAction?.name || "Service",
                                  duration: pkg.duration || 30,
                                  image: displayImg,
                                  imageUrl: displayImg,
                                });
                                toast.success(`${pkg.packageName} added to cart!`);
                              }}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95 ${
                                isCartAdded
                                  ? "bg-accent-lux/10 text-accent-lux border-accent-lux/40 shadow-xs"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-accent-lux/10 hover:text-accent-lux hover:border-accent-lux/30"
                              }`}
                              title={isCartAdded ? "Already in Cart" : "Add to Cart"}
                            >
                              {isCartAdded ? (
                                <Check className="w-4 h-4 text-accent-lux" />
                              ) : (
                                <ShoppingCart className="w-4 h-4" />
                              )}
                            </button>

                            {/* Book Now Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (!isCartAdded) {
                                  addToCart({
                                    id: packageId,
                                    itemId: packageId,
                                    packageId: packageId,
                                    name: pkg.packageName,
                                    price: pkg.price,
                                    category: pkg.serviceAction?.name || "Service",
                                    duration: pkg.duration || 30,
                                    image: displayImg,
                                    imageUrl: displayImg,
                                  });
                                }
                                router.push("/booking");
                              }}
                              className="flex-1 py-2.5 px-3.5 rounded-xl bg-accent-lux hover:bg-accent-lux/95 active:scale-95 text-white text-xs font-black tracking-wide shadow-md shadow-accent-lux/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>Book Now</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Icon Button */}
                            <button
                              type="button"
                              onClick={() => {
                                toggleBookmark(packageId);
                                toast.info("Removed from saved packages");
                              }}
                              className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
                              title="Remove from Saved Packages"
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

            {/* TAB: PROFILE & SETTINGS */}
            {(activeTab === "settings" || activeTab === "profile") && (
              <div className="glass-panel p-5 sm:p-8 space-y-7 text-left">
                {/* Header with Account Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-accent-lux/10 text-accent-lux border border-accent-lux/20 shrink-0">
                      <User className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight flex items-center gap-2">
                        Profile
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                        Manage your profile image, Name and primary mobile number.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Profile Photo Upload Card with Integrated Circular Progress Meter */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs uppercase font-extrabold text-muted-lux tracking-wider flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-accent-lux" /> Profile Photo &amp; Completion
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Upload your photo. The progress ring reflects your profile completion status.
                      </p>
                    </div>
                  </div>

                  {avatarError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{avatarError}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-1">
                    {/* Circular Progress Ring Around Profile Image */}
                    <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
                      {/* SVG Circular Progress Track */}
                      <svg className="w-full h-full absolute inset-0 -rotate-90 pointer-events-none" viewBox="0 0 140 140">
                        <defs>
                          <linearGradient id="avatarProgressRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="60%" stopColor="#eab308" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                        {/* Background track circle */}
                        <circle
                          cx="70"
                          cy="70"
                          r="62"
                          stroke="currentColor"
                          strokeWidth="5"
                          className="text-slate-200 dark:text-slate-800"
                          fill="transparent"
                        />
                        {/* Dynamic progress circle */}
                        <circle
                          cx="70"
                          cy="70"
                          r="62"
                          stroke="url(#avatarProgressRingGradient)"
                          strokeWidth="6"
                          strokeDasharray={389.56}
                          strokeDashoffset={389.56 - (389.56 * profileScore) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-700 ease-out"
                          fill="transparent"
                        />
                      </svg>

                      {/* Avatar Image Circle inside the Ring */}
                      <div
                        onClick={() => !isUploadingAvatar && avatarFileInputRef.current?.click()}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden p-1 bg-white dark:bg-slate-950 shadow-md cursor-pointer relative group flex items-center justify-center"
                        title="Click to change photo"
                      >
                        {isUploadingAvatar && (
                          <div className="absolute inset-1 rounded-full bg-slate-900/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-20">
                            <Loader2 className="w-6 h-6 animate-spin text-accent-lux mb-1" />
                            <span className="text-[9px] font-bold">Uploading...</span>
                          </div>
                        )}
                        {avatarUrl ? (
                          <>
                            {!avatarLoaded && (
                              <div className="absolute inset-1 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse flex flex-col items-center justify-center pt-3 overflow-hidden">
                                <div className="w-9 h-9 rounded-full bg-slate-300 dark:bg-slate-700 mb-1.5" />
                                <div className="w-16 h-8 rounded-t-full bg-slate-300 dark:bg-slate-700" />
                              </div>
                            )}
                            <img
                              src={avatarUrl}
                              alt={editName || "User avatar"}
                              onLoad={() => setAvatarLoaded(true)}
                              onError={() => {
                                setAvatarUrl("");
                                setAvatarLoaded(false);
                              }}
                              className={`w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300 ${!avatarLoaded ? "opacity-0" : "opacity-100"}`}
                            />
                          </>
                        ) : (
                          <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse flex flex-col items-center justify-center pt-3 overflow-hidden">
                            <div className="w-9 h-9 rounded-full bg-slate-300 dark:bg-slate-700 mb-1.5" />
                            <div className="w-16 h-8 rounded-t-full bg-slate-300 dark:bg-slate-700" />
                          </div>
                        )}
                        {!isUploadingAvatar && (
                          <div className="absolute inset-1 rounded-full bg-black/45 backdrop-blur-[1px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white">
                            <Camera className="w-5 h-5 mb-0.5" />
                            <span className="text-[9px] font-bold">Change</span>
                          </div>
                        )}
                      </div>

                      {/* Camera Button at Top-Right of circle */}
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        className="absolute top-0 right-0 p-2 rounded-full bg-accent-lux text-white shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-slate-900 z-10"
                        title="Upload Image"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>

                      {/* Profile Percentage Pill Badge directly on Profile Image Circle */}
                      <div
                        className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-[10px] sm:text-[11px] font-black shadow-lg border-2 border-white dark:border-slate-900 whitespace-nowrap flex items-center gap-1 z-10 select-none"
                        title={`${profileScore}% profile completed`}
                      >
                        <span>{profileScore}%</span>
                        {profileScore === 100 && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        )}
                      </div>
                    </div>

                    {/* Upload Controls & Format Details */}
                    <div className="flex-1 text-center sm:text-left space-y-3 pt-2">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => avatarFileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="px-4 py-2.5 rounded-xl bg-accent-lux hover:bg-accent-lux/90 text-white text-xs font-bold shadow-md shadow-accent-lux/10 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-60"
                        >
                          {isUploadingAvatar ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UploadCloud className="w-4 h-4" />
                          )}
                          <span>{isUploadingAvatar ? "Uploading..." : "Upload Image"}</span>
                        </button>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-400">
                        <p className="flex items-center justify-center sm:justify-start gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-lux shrink-0" />
                          Recommended 1:1 square aspect ratio, minimum 200x200px.
                        </p>
                        <p className="flex items-center justify-center sm:justify-start gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-lux shrink-0" />
                          Supports JPG, PNG, or WebP. Maximum size 1 MB.
                        </p>
                      </div>

                      {/* Hidden File Input */}
                      <input
                        ref={avatarFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Details Form (Name, Mobile, Alternate Mobile, Email) */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    {/* 1. FULL NAME */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-extrabold text-muted-lux tracking-wider flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-accent-lux" /> Full Name <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[9px] text-slate-400 font-bold">{editName.length}/50</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={50}
                          value={editName}
                          onChange={(e) => {
                            setEditName(e.target.value);
                            if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                          }}
                          placeholder="e.g. Rohan Verma"
                          className={`w-full bg-slate-50 dark:bg-slate-950 border ${formErrors.name ? "border-rose-500 focus:ring-rose-500/20" : "border-slate-200 dark:border-slate-800 focus:border-accent-lux focus:ring-accent-lux/20"} px-4 py-3 rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 transition-all`}
                        />
                      </div>
                      {formErrors.name && (
                        <p className="text-[10px] text-rose-500 flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3 h-3" /> {formErrors.name}
                        </p>
                      )}
                    </div>

                    {/* 2. PRIMARY MOBILE NUMBER */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-extrabold text-muted-lux tracking-wider flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5 text-accent-lux" /> Mobile Number <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> OTP Verified
                        </span>
                      </div>
                      <div className={`relative flex rounded-xl overflow-hidden border ${formErrors.phone ? "border-rose-500 focus-within:ring-rose-500/20" : "border-slate-200 dark:border-slate-800 focus-within:border-accent-lux focus-within:ring-accent-lux/20"} focus-within:ring-2 bg-slate-50 dark:bg-slate-950 transition-all`}>
                        <div className="flex items-center gap-1.5 px-3 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs select-none border-r border-slate-200 dark:border-slate-800 shrink-0">
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <input
                          type="tel"
                          maxLength={10}
                          value={editPhone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setEditPhone(val);
                            if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: undefined }));
                          }}
                          placeholder="98765 01928"
                          className="w-full bg-transparent px-3.5 py-3 text-xs sm:text-sm text-foreground focus:outline-none tracking-wide"
                        />
                      </div>
                      {formErrors.phone && (
                        <p className="text-[10px] text-rose-500 flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3 h-3" /> {formErrors.phone}
                        </p>
                      )}
                    </div>

                    {/* 3. ALTERNATE MOBILE NUMBER */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-extrabold text-muted-lux tracking-wider flex items-center gap-1">
                          <PhoneCall className="w-3.5 h-3.5 text-accent-lux" /> Alternate Mobile Number
                        </label>
                        <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold uppercase px-2 py-0.5 rounded-full">
                          Backup Contact
                        </span>
                      </div>
                      <div className={`relative flex rounded-xl overflow-hidden border ${formErrors.alternatePhone ? "border-rose-500 focus-within:ring-rose-500/20" : "border-slate-200 dark:border-slate-800 focus-within:border-accent-lux focus-within:ring-accent-lux/20"} focus-within:ring-2 bg-slate-50 dark:bg-slate-950 transition-all`}>
                        <div className="flex items-center gap-1.5 px-3 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs select-none border-r border-slate-200 dark:border-slate-800 shrink-0">
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <input
                          type="tel"
                          maxLength={10}
                          value={editAlternatePhone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setEditAlternatePhone(val);
                            if (formErrors.alternatePhone) setFormErrors((prev) => ({ ...prev, alternatePhone: undefined }));
                          }}
                          placeholder="e.g. 98765 43210"
                          className="w-full bg-transparent px-3.5 py-3 text-xs sm:text-sm text-foreground focus:outline-none tracking-wide"
                        />
                        {editAlternatePhone && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditAlternatePhone("");
                              if (formErrors.alternatePhone) setFormErrors((prev) => ({ ...prev, alternatePhone: undefined }));
                            }}
                            className="px-3 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Clear alternate number"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {formErrors.alternatePhone && (
                        <p className="text-[10px] text-rose-500 flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3 h-3" /> {formErrors.alternatePhone}
                        </p>
                      )}
                    </div>

                    {/* 4. EMAIL ADDRESS */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-extrabold text-muted-lux tracking-wider flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-accent-lux" /> Email Address
                        </label>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Official Invoices</span>
                      </div>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent-lux focus:ring-2 focus:ring-accent-lux/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Save and Discard Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="bg-gradient-to-r from-accent-lux to-secondary-lux hover:opacity-95 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider px-6 sm:px-8 py-3 rounded-xl shadow-lg shadow-accent-lux/20 cursor-pointer flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSavingProfile ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Saving Changes...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" /> Save Profile Details
                          </>
                        )}
                      </button>

                      {hasUnsavedChanges && (
                        <button
                          type="button"
                          onClick={handleResetProfile}
                          disabled={isSavingProfile}
                          className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Discard
                        </button>
                      )}
                    </div>

                    {hasUnsavedChanges && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Unsaved modifications
                      </span>
                    )}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
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
              className="relative w-full max-w-md glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col space-y-4 max-h-[92vh] overflow-y-auto"
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
