"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Check,
  Clock,
  ShieldCheck,
  UserCheck,
  Phone,
  User,
  MapPin,
  Calendar,
  MessageSquare,
  Send,
  CheckCircle2,
  PhoneCall,
  MessageCircle,
  RotateCcw,
  Zap,
  Building2,
  ChevronDown,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { getLocalitiesApi } from "@/services/addressApi";
import { toast } from "@/components/common/Toast";
import { formatDuration } from "@/utils/dateTime";

interface CalculatorProps {
  onBook: (data: {
    id: string;
    name: string;
    price: number;
    category: string;
    duration: number;
  }) => void;
}

interface EnquiryFormData {
  fullName: string;
  phone: string;
  locality: string;
  preferredSlot: string;
  notes: string;
}

interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface CustomDropdownProps {
  label: string;
  icon?: React.ReactNode;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  error?: string;
}

function CustomDropdown({
  label,
  icon,
  options,
  value,
  onChange,
  searchable = false,
  searchPlaceholder = "Search...",
  error,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen, searchable]);

  const filteredOptions = searchable
    ? options.filter((opt) => {
        const query = searchQuery.toLowerCase().trim();
        return (
          opt.label.toLowerCase().includes(query) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(query)) ||
          (opt.badge && opt.badge.toLowerCase().includes(query))
        );
      })
    : options;

  return (
    <div className="relative text-left w-full" ref={dropdownRef}>
      <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
        {icon} {label}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-slate-900/80 hover:bg-slate-900 border text-left rounded-xl px-3 py-2 text-xs text-white flex items-center justify-between transition-all cursor-pointer shadow-sm ${
          error
            ? "border-red-500"
            : isOpen
            ? "border-accent-lux ring-1 ring-accent-lux/40 bg-slate-900"
            : "border-white/10 hover:border-white/25"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate pr-2 font-medium text-slate-100">
          {selectedOption ? selectedOption.label : options.length === 0 ? "No data available" : "Select..."}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-accent-lux" : ""
          }`}
        />
      </button>

      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 left-0 right-0 mt-1.5 bg-[#0f172a] border border-white/15 rounded-2xl shadow-2xl p-2 overflow-hidden backdrop-blur-xl"
            style={{ minWidth: "100%" }}
          >
            {/* Search Input if enabled */}
            {searchable && (
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800/90 border border-white/10 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-accent-lux transition-colors"
                />
              </div>
            )}

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-accent-lux text-white font-semibold shadow-sm"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="block truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span
                            className={`block text-[10px] mt-0.5 truncate ${
                              isSelected ? "text-white/80" : "text-slate-400"
                            }`}
                          >
                            {opt.sublabel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {opt.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-white/10 text-slate-300"
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-3 text-center text-xs text-slate-400">
                  {options.length === 0 ? "No data available" : "No matching options found"}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PricingCalculator({ onBook }: CalculatorProps) {
  const [activeTab, setActiveTab] = useState<"deep" | "chores" | "custom">("deep");
  const [viewMode, setViewMode] = useState<"enquire" | "book">("enquire");
  const { clearCart, addToCart, cart, userName, userPhone, addNotification } = useStore();

  // Deep Cleaning states
  const [homeSize, setHomeSize] = useState<"1bhk" | "2bhk" | "3bhk" | "4bhk">("2bhk");
  const [deepAddons, setDeepAddons] = useState<string[]>([]);

  // Chores states
  const [selectedChores, setSelectedChores] = useState<string[]>(["mopping", "dishes"]);

  // Custom commercial needs
  const [selectedCustomNeed, setSelectedCustomNeed] = useState<string>("office");

  // Dynamic API localities State
  const [apiLocalities, setApiLocalities] = useState<{ id: string; name: string; pincode: string }[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchLocalities() {
      try {
        const res = await getLocalitiesApi();
        if (!isMounted) return;
        if (res && res.success) {
          const rawList: any[] = res.data?.localities || (Array.isArray(res.data) ? res.data : []) || (res as any).localities || [];
          const seenNames = new Set<string>();
          const mapped = rawList
            .filter((loc) => loc.status !== false)
            .map((loc) => ({
              id: String(loc._id || loc.id),
              name: loc.localityName || loc.name,
              pincode: loc.pincode || "",
            }))
            .filter((loc) => {
              if (!loc.name) return false;
              const lower = loc.name.toLowerCase().trim();
              if (seenNames.has(lower)) return false;
              seenNames.add(lower);
              return true;
            });
          setApiLocalities(mapped);
          if (mapped.length > 0) {
            setEnquiryForm((prev) => ({
              ...prev,
              locality: prev.locality || mapped[0].name,
            }));
          }
        }
      } catch (e) {
        console.error("Error loading localities in PricingCalculator:", e);
      }
    }
    fetchLocalities();
    return () => {
      isMounted = false;
    };
  }, []);

  const localityOptions: DropdownOption[] = apiLocalities.map((loc) => ({
    value: loc.name,
    label: loc.name,
    sublabel: loc.pincode ? `PIN: ${loc.pincode}` : undefined,
    badge: "Varanasi",
  }));

  const slotOptions: DropdownOption[] = [
    {
      value: "Today Express (Within 2 hrs)",
      label: "Today Express (Within 2 hrs)",
      sublabel: "Immediate dispatch available",
      badge: "⚡ 2h Express",
    },
    {
      value: "Tomorrow Morning (8 AM - 12 PM)",
      label: "Tomorrow Morning (8 AM - 12 PM)",
      sublabel: "Early slot • Fresh start",
      badge: "Morning",
    },
    {
      value: "Tomorrow Afternoon (12 PM - 4 PM)",
      label: "Tomorrow Afternoon (12 PM - 4 PM)",
      sublabel: "Mid-day slot",
      badge: "Afternoon",
    },
    {
      value: "Tomorrow Evening (4 PM - 8 PM)",
      label: "Tomorrow Evening (4 PM - 8 PM)",
      sublabel: "Post-work convenience",
      badge: "Evening",
    },
    {
      value: "This Weekend",
      label: "This Weekend (Sat / Sun)",
      sublabel: "Weekend comprehensive slot",
      badge: "Weekend",
    },
    {
      value: "Flexible / Schedule Callback",
      label: "Flexible / Schedule Callback",
      sublabel: "Supervisor coordinates time",
      badge: "Anytime",
    },
  ];

  // Enquiry Form State
  const [enquiryForm, setEnquiryForm] = useState<EnquiryFormData>({
    fullName: userName || "",
    phone: userPhone || "",
    locality: "",
    preferredSlot: "Tomorrow Morning (8 AM - 12 PM)",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<{
    refId: string;
    fullName: string;
    phone: string;
    service: string;
    price: number;
    duration: number;
    locality: string;
    preferredSlot: string;
    notes: string;
    createdAt: string;
  } | null>(null);

  // Sync user profile if available
  useEffect(() => {
    if (userName && !enquiryForm.fullName) {
      setEnquiryForm((prev) => ({ ...prev, fullName: userName }));
    }
    if (userPhone && !enquiryForm.phone) {
      setEnquiryForm((prev) => ({ ...prev, phone: userPhone }));
    }
  }, [userName, userPhone]);

  // Urgency indicator
  const [availablePros, setAvailablePros] = useState(4);
  useEffect(() => {
    const interval = setInterval(() => {
      setAvailablePros((prev) => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const next = prev + change;
        return next < 2 ? 2 : next > 7 ? 7 : next;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const deepCleanBHKs = {
    "1bhk": { name: "1 BHK Deep Clean", price: 1899, duration: 180 },
    "2bhk": { name: "2 BHK Deep Clean", price: 2899, duration: 240 },
    "3bhk": { name: "3 BHK Deep Clean", price: 3899, duration: 300 },
    "4bhk": { name: "4 BHK Deep Clean", price: 4899, duration: 360 },
  };

  const deepCleanAddons = [
    { id: "kitchen", label: "Kitchen Degreasing", price: 599, duration: 60 },
    { id: "bathroom", label: "Bathroom Intensive Descaling", price: 399, duration: 45 },
    { id: "balcony", label: "Balcony Scrubbing", price: 299, duration: 30 },
    { id: "fridge", label: "Fridge Interior Sanitizing", price: 199, duration: 20 },
  ];

  const choreOptions = [
    { id: "mopping", label: "Sweeping & Mopping", price: 149, duration: 45 },
    { id: "dishes", label: "Utensil Dishwashing", price: 99, duration: 30 },
    { id: "ironing", label: "Ironing & Folding", price: 120, duration: 45 },
    { id: "chopping", label: "Kitchen Veggie Chopping", price: 149, duration: 45 },
    { id: "dusting", label: "Bathroom Express Dusting", price: 120, duration: 30 },
    { id: "balcony-tidy", label: "Balcony Tidy Up", price: 99, duration: 20 },
  ];

  const customNeeds = [
    { id: "office", label: "Commercial Office / Clinic", basePrice: 4999, desc: "Desks, glass facades, restrooms & sanitization" },
    { id: "villa", label: "Duplex / Luxury Villa Scrub", basePrice: 5999, desc: "Multi-floor deep scouring & exterior terrace wash" },
    { id: "post-construction", label: "Post-Construction Scrape", basePrice: 4499, desc: "Cement haze, paint drop & sawdust deep scrub" },
    { id: "move-in", label: "Move-in / Move-out Refresh", basePrice: 3499, desc: "Cupboards, appliances & disinfectant fogging" },
  ];

  // Deep Clean calculations
  const baseSelection = deepCleanBHKs[homeSize];
  const deepAddonSum = deepCleanAddons
    .filter((a) => deepAddons.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  const deepDurationSum = deepCleanAddons
    .filter((a) => deepAddons.includes(a.id))
    .reduce((sum, a) => sum + a.duration, 0);

  const deepTotalPrice = baseSelection.price + deepAddonSum;
  const deepTotalDuration = baseSelection.duration + deepDurationSum;

  // Chores calculations (Base fare minimum of ₹299 applies)
  const choreSum = choreOptions
    .filter((c) => selectedChores.includes(c.id))
    .reduce((sum, c) => sum + c.price, 0);
  const choreDurationSum = choreOptions
    .filter((c) => selectedChores.includes(c.id))
    .reduce((sum, c) => sum + c.duration, 0);

  const choresTotalPrice = Math.max(299, choreSum);
  const choresTotalDuration = choreDurationSum;

  // Resolved current service details for display and quote
  let currentServiceName = "";
  let currentPrice = 0;
  let currentDuration = 0;

  if (activeTab === "deep") {
    const selectedAddonLabels = deepCleanAddons
      .filter((a) => deepAddons.includes(a.id))
      .map((a) => a.label);
    currentServiceName = `${baseSelection.name}${
      selectedAddonLabels.length > 0 ? ` (+ ${selectedAddonLabels.join(", ")})` : ""
    }`;
    currentPrice = deepTotalPrice;
    currentDuration = deepTotalDuration;
  } else if (activeTab === "chores") {
    const selectedChoreLabels = choreOptions
      .filter((c) => selectedChores.includes(c.id))
      .map((c) => c.label);
    currentServiceName = `Daily Chores Bundle: ${
      selectedChoreLabels.length > 0 ? selectedChoreLabels.join(", ") : "Custom Selection"
    }`;
    currentPrice = choresTotalPrice;
    currentDuration = choresTotalDuration;
  } else {
    const custom = customNeeds.find((c) => c.id === selectedCustomNeed) || customNeeds[0];
    currentServiceName = `Custom Solution: ${custom.label}`;
    currentPrice = custom.basePrice;
    currentDuration = 360;
  }

  const toggleDeepAddon = (id: string) => {
    setDeepAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleChore = (id: string) => {
    setSelectedChores((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!enquiryForm.fullName.trim()) {
      errors.fullName = "Please enter your full name";
    }

    const cleanPhone = enquiryForm.phone.replace(/\D/g, "");
    if (!cleanPhone) {
      errors.phone = "Phone number is required";
    } else if (cleanPhone.length < 10) {
      errors.phone = "Enter a valid 10-digit mobile number";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      const refId = `HM-ENQ-${Math.floor(100000 + Math.random() * 900000)}`;
      const newEnquiry = {
        refId,
        fullName: enquiryForm.fullName.trim(),
        phone: cleanPhone,
        service: currentServiceName,
        price: currentPrice,
        duration: currentDuration,
        locality: enquiryForm.locality,
        preferredSlot: enquiryForm.preferredSlot,
        notes: enquiryForm.notes.trim(),
        createdAt: new Date().toISOString(),
      };

      try {
        const existing = JSON.parse(localStorage.getItem("helpmate_enquiries") || "[]");
        localStorage.setItem("helpmate_enquiries", JSON.stringify([newEnquiry, ...existing]));
      } catch {
        // ignore
      }

      setSubmittedEnquiry(newEnquiry);
      setIsSubmitting(false);

      addNotification(
        "Enquiry Received!",
        `Thank you ${newEnquiry.fullName}. Our Varanasi manager will call you at +91 ${newEnquiry.phone} within 15 minutes.`,
        "success"
      );
    }, 600);
  };

  const handleBookNow = () => {
    if (activeTab === "deep") {
      const selectedAddonLabels = deepCleanAddons
        .filter((a) => deepAddons.includes(a.id))
        .map((a) => a.label);

      const customServiceName = `${baseSelection.name} ${
        selectedAddonLabels.length > 0 ? `(+ ${selectedAddonLabels.join(", ")})` : ""
      }`;
      const targetId = `custom-deep-${homeSize}`;
      const isAlreadyInCart = cart.some(
        (c) => String(c.id) === targetId || String(c.itemId) === targetId
      );

      if (!isAlreadyInCart) {
        addToCart({
          id: targetId,
          name: customServiceName,
          price: deepTotalPrice,
          category: "cleaning",
          duration: deepTotalDuration,
        });
      }

      onBook({
        id: targetId,
        name: customServiceName,
        price: deepTotalPrice,
        category: "cleaning",
        duration: deepTotalDuration,
      });
    } else if (activeTab === "chores") {
      const selectedChoreLabels = choreOptions
        .filter((c) => selectedChores.includes(c.id))
        .map((c) => c.label);

      if (selectedChoreLabels.length === 0) {
        toast.error("Selection Required", "Please select at least one chore task.");
        return;
      }

      const customServiceName = `Daily Chores Bundle: ${selectedChoreLabels.join(", ")}`;
      const targetId = "custom-chores-bundle";
      const isAlreadyInCart = cart.some(
        (c) => String(c.id) === targetId || String(c.itemId) === targetId
      );

      if (!isAlreadyInCart) {
        addToCart({
          id: targetId,
          name: customServiceName,
          price: choresTotalPrice,
          category: "cleaning",
          duration: choresTotalDuration,
        });
      }

      onBook({
        id: targetId,
        name: customServiceName,
        price: choresTotalPrice,
        category: "cleaning",
        duration: choresTotalDuration,
      });
    } else {
      const custom = customNeeds.find((c) => c.id === selectedCustomNeed) || customNeeds[0];
      const targetId = `custom-${custom.id}`;
      const isAlreadyInCart = cart.some(
        (c) => String(c.id) === targetId || String(c.itemId) === targetId
      );

      if (!isAlreadyInCart) {
        addToCart({
          id: targetId,
          name: `Custom Solution: ${custom.label}`,
          price: custom.basePrice,
          category: "cleaning",
          duration: 360,
        });
      }

      onBook({
        id: targetId,
        name: `Custom Solution: ${custom.label}`,
        price: custom.basePrice,
        category: "cleaning",
        duration: 360,
      });
    }
  };

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto font-sans relative" id="pricing-calculator">
      <div className="text-left mb-12">
        <span className="text-[10px] uppercase font-bold text-accent-lux tracking-widest block mb-3">
          Instant Estimate & Enquiry
        </span>
        <h2 className="text-3xl font-bold tracking-tight text-primary-lux dark:text-white mt-1">
          Interactive Pricing Calculator
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-sm max-w-lg">
          Configure your layout or chore checklist for an instant transparent estimate, then submit an enquiry for a 15-minute callback or book directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Interactive Configuration Panel */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 flex flex-col justify-between border border-slate-200/10">
          <div>
            {/* Tabs Selector */}
            <div className="flex flex-wrap gap-2.5 mb-8 w-full">
              <button
                type="button"
                onClick={() => setActiveTab("deep")}
                className={`py-2.5 px-4 sm:px-5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  activeTab === "deep"
                    ? "bg-accent-lux text-white shadow-md hover:bg-accent-lux/95"
                    : "bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800"
                }`}
              >
                Premium Deep Cleaning
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("chores")}
                className={`py-2.5 px-4 sm:px-5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  activeTab === "chores"
                    ? "bg-accent-lux text-white shadow-md hover:bg-accent-lux/95"
                    : "bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800"
                }`}
              >
                Daily Hourly Chores
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("custom")}
                className={`py-2.5 px-4 sm:px-5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  activeTab === "custom"
                    ? "bg-accent-lux text-white shadow-md hover:bg-accent-lux/95"
                    : "bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800"
                }`}
              >
                Custom / Commercial
              </button>
            </div>

            {/* TAB CONTENT */}
            <AnimatePresence mode="wait">
              {activeTab === "deep" ? (
                <motion.div
                  key="deep"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Tab Explainer Text */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-left mb-6">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-accent-lux" /> What is Premium Deep Cleaning?
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      A comprehensive, 3+ hour intense scrub-down of your home by verified experts. Includes specialized machines, bathroom descaling, deep kitchen degreasing, and eco-sanitization. Ideal for monthly refreshers or moving in.
                    </p>
                  </div>

                  {/* Home BHK size grid */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-3">
                      Select Home Layout Size
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(["1bhk", "2bhk", "3bhk", "4bhk"] as const).map((size) => {
                        const isSelected = homeSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setHomeSize(size)}
                            className={`py-3.5 px-3 rounded-xl border text-center font-bold text-xs capitalize transition-all cursor-pointer ${
                              isSelected
                                ? "bg-accent-lux border-accent-lux text-white shadow-lg shadow-accent-lux/10"
                                : "bg-slate-50 dark:bg-slate-900 border-slate-200/10 text-slate-700 dark:text-slate-300 hover:border-slate-350"
                            }`}
                          >
                            {size}
                            <span className="block text-[9px] font-normal opacity-80 mt-1">
                              ₹{deepCleanBHKs[size].price}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add-ons Checklist */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-3">
                      Add-on Intensive Care Checklist
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {deepCleanAddons.map((addon) => {
                        const isChecked = deepAddons.includes(addon.id);
                        return (
                          <div
                            key={addon.id}
                            onClick={() => toggleDeepAddon(addon.id)}
                            className={`p-3.5 rounded-xl border cursor-pointer select-none flex items-center justify-between transition-all duration-300 ${
                              isChecked
                                ? "border-accent-lux/60 bg-accent-lux/[0.03]"
                                : "border-slate-200/10 bg-slate-50/40 dark:bg-slate-950/20 hover:border-slate-300"
                            }`}
                          >
                            <div>
                              <span className="text-xs font-bold text-foreground block">
                                {addon.label}
                              </span>
                              <span className="text-[9px] text-slate-400 mt-0.5 block flex items-center gap-1">
                                <Clock className="w-3 h-3" /> +{addon.duration} mins
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-extrabold text-accent-lux">
                                ₹{addon.price}
                              </span>
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                  isChecked
                                    ? "bg-accent-lux border-accent-lux text-white"
                                    : "border-slate-300 dark:border-slate-700"
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === "chores" ? (
                /* TAB CONTENT: CHORES */
                <motion.div
                  key="chores"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Tab Explainer Text */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-left mb-6">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-accent-lux" /> What are Daily Hourly Chores?
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Quick, flexible support for regular daily chores (dishwashing, sweeping & mopping, clothes ironing, veggie chopping). Book a custom checklist as needed without any monthly commitments or long-term contracts.
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Build Daily Chore Checklist
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold italic">
                        Min. base fare ₹299 applies
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {choreOptions.map((chore) => {
                        const isChecked = selectedChores.includes(chore.id);
                        return (
                          <div
                            key={chore.id}
                            onClick={() => toggleChore(chore.id)}
                            className={`p-3.5 rounded-xl border cursor-pointer select-none flex items-center justify-between transition-all duration-300 ${
                              isChecked
                                ? "border-accent-lux/60 bg-accent-lux/[0.03]"
                                : "border-slate-200/10 bg-slate-50/40 dark:bg-slate-950/20 hover:border-slate-300"
                            }`}
                          >
                            <div>
                              <span className="text-xs font-bold text-foreground block">
                                {chore.label}
                              </span>
                              <span className="text-[9px] text-slate-400 mt-0.5 block flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {chore.duration} mins
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-extrabold text-accent-lux">
                                ₹{chore.price}
                              </span>
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                  isChecked
                                    ? "bg-accent-lux border-accent-lux text-white"
                                    : "border-slate-300 dark:border-slate-700"
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* TAB CONTENT: CUSTOM / COMMERCIAL */
                <motion.div
                  key="custom"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-left mb-6">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-accent-lux" /> Bespoke Commercial & Custom Services
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Need tailored solutions for offices, clinics, entire villas, or post-construction clearance? Select your project scope below and submit an enquiry. Our Varanasi operations team conducts a free site evaluation and provides a customized quote within 15 minutes.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-3">
                      Select Project Scope
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {customNeeds.map((need) => {
                        const isSelected = selectedCustomNeed === need.id;
                        return (
                          <div
                            key={need.id}
                            onClick={() => setSelectedCustomNeed(need.id)}
                            className={`p-3.5 rounded-xl border cursor-pointer select-none flex items-start justify-between transition-all duration-300 ${
                              isSelected
                                ? "border-accent-lux/60 bg-accent-lux/[0.04]"
                                : "border-slate-200/10 bg-slate-50/40 dark:bg-slate-950/20 hover:border-slate-300"
                            }`}
                          >
                            <div className="pr-2">
                              <span className="text-xs font-bold text-foreground block">
                                {need.label}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {need.desc}
                              </span>
                              <span className="text-[10px] text-accent-lux font-bold mt-1.5 inline-block">
                                From ₹{need.basePrice}
                              </span>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isSelected
                                  ? "bg-accent-lux border-accent-lux text-white"
                                  : "border-slate-300 dark:border-slate-700"
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel: Enquiry Form & Summary */}
        <div className="lg:col-span-5 bg-primary-lux dark:bg-slate-900 text-white rounded-[24px] p-6 sm:p-7 flex flex-col justify-between relative shadow-2xl border border-white/5">
          {/* Subtle Ambient Glow */}
          <div className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-44 h-44 bg-accent-lux/10 rounded-full blur-3xl" />
          </div>

          <div className="space-y-5 z-10">
            {/* Header with Mode Switcher & Active Pros */}
            <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-white/10 gap-2">
              <div className="flex bg-white/10 p-1 rounded-full border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode("enquire")}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === "enquire"
                      ? "bg-accent-lux text-white shadow"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <PhoneCall className="w-3 h-3" />
                  Enquiry Form
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("book")}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === "book"
                      ? "bg-accent-lux text-white shadow"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  Instant Book
                </button>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] text-success-lux bg-success-lux/10 px-2 py-0.5 rounded-full font-bold">
                <UserCheck className="w-3.5 h-3.5 text-success-lux" /> {availablePros} Pros Active
              </span>
            </div>

            {/* LIVE QUOTE PREVIEW CARD */}
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">
                  Configured Estimate
                </span>
                <p className="text-xs font-bold text-white truncate mt-0.5">
                  {currentServiceName}
                </p>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-accent-lux" /> ~
                  {formatDuration(currentDuration)}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">
                  Est. Total
                </span>
                <span className="text-xl font-black text-accent-lux">
                  ₹{currentPrice}
                </span>
              </div>
            </div>

            {/* MODE A: ENQUIRY FORM */}
            {viewMode === "enquire" ? (
              <div>
                {submittedEnquiry ? (
                  /* SUBMITTED SUCCESS STATE */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4 space-y-4"
                  >
                    <div className="w-13 h-13 bg-success-lux/20 text-success-lux border border-success-lux/30 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-success-lux/10">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-success-lux bg-success-lux/10 px-2.5 py-0.5 rounded-full">
                        Enquiry Received • Ref: {submittedEnquiry.refId}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-2">
                        We'll Call You in 15 Minutes!
                      </h3>
                      <p className="text-[11px] text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
                        Thank you, <strong className="text-white">{submittedEnquiry.fullName}</strong>. Our Varanasi operations manager is reviewing your request.
                      </p>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 text-left space-y-2 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-400 text-[11px]">Service:</span>
                        <span className="font-bold text-white text-right text-[11px]">
                          {submittedEnquiry.service}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Est. Total:</span>
                        <span className="font-extrabold text-accent-lux">
                          ₹{submittedEnquiry.price}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Area & Slot:</span>
                        <span className="text-slate-200">
                          {submittedEnquiry.locality} • {submittedEnquiry.preferredSlot}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Contact:</span>
                        <span className="font-semibold text-white">
                          +91 {submittedEnquiry.phone}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-1">
                      <a
                        href={`https://wa.me/919123456789?text=${encodeURIComponent(
                          `Hi HelpMate Team! I just submitted an enquiry (${submittedEnquiry.refId}) for ${submittedEnquiry.service} (Est. ₹${submittedEnquiry.price}) in ${submittedEnquiry.locality}. Please connect with me.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs py-3 px-4 rounded-full shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chat on WhatsApp (+91 91234 56789)
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setSubmittedEnquiry(null);
                          setEnquiryForm({
                            fullName: userName || "",
                            phone: userPhone || "",
                            locality: apiLocalities[0]?.name || "",
                            preferredSlot: "Tomorrow Morning (8 AM - 12 PM)",
                            notes: "",
                          });
                        }}
                        className="w-full bg-white/10 hover:bg-white/15 text-white font-medium text-xs py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Submit Another Enquiry
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* ENQUIRY FORM INPUTS */
                  <form onSubmit={handleEnquirySubmit} className="space-y-3.5 text-left">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-accent-lux" /> Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={enquiryForm.fullName}
                        onChange={(e) => {
                          setEnquiryForm({ ...enquiryForm, fullName: e.target.value });
                          if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: "" });
                        }}
                        className={`w-full bg-white/5 border ${
                          formErrors.fullName ? "border-red-500" : "border-white/10 focus:border-accent-lux"
                        } rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors`}
                      />
                      {formErrors.fullName && (
                        <p className="text-[10px] text-red-400 mt-1">{formErrors.fullName}</p>
                      )}
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-accent-lux" /> Mobile Number *
                      </label>
                      <div className="relative flex">
                        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-white/10 bg-white/10 text-slate-300 text-xs font-semibold">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="10-digit mobile number"
                          value={enquiryForm.phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setEnquiryForm({ ...enquiryForm, phone: val });
                            if (formErrors.phone) setFormErrors({ ...formErrors, phone: "" });
                          }}
                          className={`w-full bg-white/5 border ${
                            formErrors.phone ? "border-red-500" : "border-white/10 focus:border-accent-lux"
                          } rounded-r-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors`}
                        />
                      </div>
                      {formErrors.phone && (
                        <p className="text-[10px] text-red-400 mt-1">{formErrors.phone}</p>
                      )}
                    </div>

                    {/* Custom Dropdown Grid: Locality & Preferred Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <CustomDropdown
                        label="Area in Varanasi"
                        icon={<MapPin className="w-3 h-3 text-accent-lux" />}
                        options={localityOptions}
                        value={enquiryForm.locality}
                        onChange={(val) =>
                          setEnquiryForm((prev) => ({ ...prev, locality: val }))
                        }
                        searchable={true}
                        searchPlaceholder="Search locality or pincode..."
                      />

                      <CustomDropdown
                        label="Preferred Time"
                        icon={<Calendar className="w-3 h-3 text-accent-lux" />}
                        options={slotOptions}
                        value={enquiryForm.preferredSlot}
                        onChange={(val) =>
                          setEnquiryForm((prev) => ({ ...prev, preferredSlot: val }))
                        }
                        searchable={false}
                      />
                    </div>

                    {/* Special Notes */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-accent-lux" /> Special Requirements / Notes
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Need focus on kitchen chimney, pet at home, or specific timing..."
                        value={enquiryForm.notes}
                        onChange={(e) =>
                          setEnquiryForm({ ...enquiryForm, notes: e.target.value })
                        }
                        className="w-full bg-white/5 border border-white/10 focus:border-accent-lux rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-accent-lux hover:bg-accent-lux/95 disabled:opacity-60 text-white font-bold text-xs py-3.5 rounded-full shadow-lg shadow-accent-lux/20 cursor-pointer transition-all flex items-center justify-center gap-2 group mt-2"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting Enquiry...
                        </span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Submit Free Enquiry & Get Callback
                          <span className="opacity-70 group-hover:translate-x-0.5 transition-transform">
                            →
                          </span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 text-center pt-1">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-success-lux" /> No Spam Guarantee
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-accent-lux" /> 15-Min Callback
                      </span>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* MODE B: DIRECT BOOKING VIEW */
              <div className="space-y-5">
                {/* Calculations List */}
                <div className="space-y-3.5 text-left">
                  {activeTab === "deep" ? (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Base Fare ({baseSelection.name})</span>
                        <span className="font-bold">₹{baseSelection.price}</span>
                      </div>
                      {deepAddons.length > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">
                            Add-on Checklist ({deepAddons.length})
                          </span>
                          <span className="font-bold text-accent-lux">₹{deepAddonSum}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs pt-3 border-t border-white/5">
                        <span className="text-slate-400">Estimated Effort</span>
                        <span className="font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {Math.round(deepTotalDuration / 60)} Hours ({deepTotalDuration} min)
                        </span>
                      </div>
                    </>
                  ) : activeTab === "chores" ? (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Chore Checklist Sum</span>
                        <span className="font-bold">₹{choreSum}</span>
                      </div>
                      {choresTotalPrice > choreSum && (
                        <div className="flex justify-between text-xs text-amber-400">
                          <span>Minimum Booking Adjustment</span>
                          <span className="font-bold">₹{choresTotalPrice - choreSum}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs pt-3 border-t border-white/5">
                        <span className="text-slate-400">Estimated Effort</span>
                        <span className="font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {choresTotalDuration} min work window
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Project Type</span>
                        <span className="font-bold">{currentServiceName}</span>
                      </div>
                      <div className="flex justify-between text-xs pt-3 border-t border-white/5">
                        <span className="text-slate-400">Site Assessment</span>
                        <span className="font-bold text-success-lux">Free On-site Inspection</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Guarantees Box */}
                <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5 space-y-2 text-[11px] text-slate-350 text-left">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-success-lux shrink-0 mt-0.5" />
                    <p>
                      <strong>₹1,000 No-Show Penalty:</strong> If our Pro is late or cancels, we refund ₹1,000 instantly.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success-lux shrink-0 mt-0.5" />
                    <p>
                      <strong>3-Tier Vetting:</strong> Criminal check, Aadhaar matches, and local background audits.
                    </p>
                  </div>
                </div>

                {/* Direct Checkout CTA */}
                <div className="pt-3 border-t border-white/10">
                  <div className="flex justify-between items-baseline mb-3.5">
                    <span className="text-xs text-slate-400 uppercase font-bold">Total (All Inclusive)</span>
                    <span className="text-2xl font-black text-white">
                      ₹{currentPrice}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleBookNow}
                    className="w-full bg-accent-lux hover:bg-accent-lux/95 text-white font-bold text-xs py-3.5 rounded-full shadow-lg cursor-pointer transition-colors flex items-center justify-center gap-2 group"
                  >
                    Book Verified Pro Now
                    <span className="opacity-70 group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-2.5">
                    No registration charge. Cancel or reschedule anytime up to 2 hours before.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
