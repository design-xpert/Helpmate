import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  User,
  Users,
  HeartHandshake,
  Briefcase,
  HelpCircle,
  Home,
  Building,
  Check,
  Loader2,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Address, AddressRecipientType, useStore } from "@/store/useStore";
import { getLocalitiesApi } from "@/services/addressApi";
import { toast } from "@/components/common/Toast";

interface AddAddressFormProps {
  onSave: (address: Omit<Address, "id"> & { localityId?: string }) => void;
  onCancel?: () => void;
  initialData?: Partial<Address>;
  className?: string;
  compact?: boolean;
}

export const AddAddressForm: React.FC<AddAddressFormProps> = ({
  onSave,
  onCancel,
  initialData,
  className = "",
  compact = false,
}) => {
  const userName = useStore((state) => state.userName);
  const userPhone = useStore((state) => state.userPhone);
  const addNotification = useStore((state) => state.addNotification);

  const currentUser = {
    name: userName || "Customer",
    phone: userPhone || "",
  };

  // Form states
  const [tag, setTag] = useState<string>(initialData?.tag || "Home");
  const [recipientType, setRecipientType] = useState<AddressRecipientType>(
    initialData?.recipientType || "Self"
  );
  const [recipientName, setRecipientName] = useState<string>(
    initialData?.recipientName || (initialData?.recipientType === "Self" || !initialData?.recipientType ? currentUser.name : "")
  );
  const [recipientPhone, setRecipientPhone] = useState<string>(
    initialData?.recipientPhone || (initialData?.recipientType === "Self" || !initialData?.recipientType ? currentUser.phone : "")
  );

  // Dynamic Varanasi Active Zones API State (No hardcoded fallback)
  const [localities, setLocalities] = useState<{ id: string; name: string; pincode: string }[]>([]);
  const [isLoadingLocalities, setIsLoadingLocalities] = useState<boolean>(true);

  // Custom Locality Dropdown States
  const [isLocalityDropdownOpen, setIsLocalityDropdownOpen] = useState<boolean>(false);
  const [localitySearch, setLocalitySearch] = useState<string>("");
  const [isSearchingLocality, setIsSearchingLocality] = useState<boolean>(false);
  const localityDropdownRef = useRef<HTMLDivElement>(null);
  const allLocalitiesRef = useRef<{ id: string; name: string; pincode: string }[]>([]);

  const [locality, setLocality] = useState<string>(initialData?.locality || "");
  const [localityId, setLocalityId] = useState<string>(initialData?.localityId || "");
  const [pincode, setPincode] = useState<string>(initialData?.pincode || "");
  const [landmark, setLandmark] = useState<string>(initialData?.landmark || "");
  const [streetAddress, setStreetAddress] = useState<string>(
    initialData?.addressLine || initialData?.houseNo || ""
  );
  const [city, setCity] = useState<string>(initialData?.city || "Varanasi");
  const [isDefault, setIsDefault] = useState<boolean>(initialData?.isDefault || false);

  // Fetch Varanasi active zones dynamically from API
  useEffect(() => {
    let isMounted = true;
    async function loadLocalities() {
      try {
        setIsLoadingLocalities(true);
        const res = await getLocalitiesApi();
        if (!isMounted) return;

        if (res && res.success) {
          const rawList: any[] = res.data?.localities || (Array.isArray(res.data) ? res.data : []) || (res as any).localities || [];
          const seen = new Set<string>();
          const mapped = rawList
            .filter((loc) => loc.status !== false)
            .map((loc) => ({
              id: String(loc._id || loc.id),
              name: loc.localityName || loc.name || "Locality",
              pincode: loc.pincode || "",
            }))
            .filter((loc) => {
              if (!loc.id || seen.has(loc.id)) return false;
              seen.add(loc.id);
              return true;
            });

          allLocalitiesRef.current = mapped;
          setLocalities(mapped);

          if (mapped.length > 0 && initialData?.locality) {
            const match = mapped.find(
              (m) =>
                m.name.toLowerCase() === initialData.locality?.toLowerCase() ||
                m.id === initialData.localityId
            );
            if (match) {
              setLocality(match.name);
              setLocalityId(match.id);
              if (!initialData?.pincode && match.pincode) {
                setPincode(match.pincode);
              }
            }
          }
        } else {
          setLocalities([]);
          if (!initialData?.locality) {
            setLocality("");
            setLocalityId("");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setLocalities([]);
          if (!initialData?.locality) {
            setLocality("");
            setLocalityId("");
          }
          console.error("Error loading localities:", err);
        }
      } finally {
        if (isMounted) setIsLoadingLocalities(false);
      }
    }
    loadLocalities();
    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize form states whenever initialData changes
  useEffect(() => {
    if (initialData) {
      setTag(initialData.tag || "Home");
      setRecipientType(initialData.recipientType || "Self");
      setRecipientName(
        initialData.recipientName ||
        (initialData.recipientType === "Self" || !initialData.recipientType ? currentUser.name : "")
      );
      setRecipientPhone(
        initialData.recipientPhone || initialData.recipientMobile ||
        (initialData.recipientType === "Self" || !initialData.recipientType ? currentUser.phone : "")
      );
      setLocality(initialData.locality || "");
      setLocalityId(initialData.localityId || "");
      setPincode(initialData.pincode || "");
      setLandmark(initialData.landmark || "");
      setStreetAddress(initialData.addressLine || (initialData as any).houseNo || "");
      setCity(initialData.city || "Varanasi");
      setIsDefault(initialData.isDefault || false);

      if (allLocalitiesRef.current.length > 0 && (initialData.locality || initialData.localityId)) {
        const match = allLocalitiesRef.current.find(
          (m) =>
            (initialData.localityId && m.id === initialData.localityId) ||
            (initialData.locality && m.name.toLowerCase() === initialData.locality.toLowerCase())
        );
        if (match) {
          setLocality(match.name);
          setLocalityId(match.id);
          if (match.pincode) setPincode(match.pincode);
        }
      }
    } else {
      setTag("Home");
      setRecipientType("Self");
      setRecipientName(currentUser.name);
      setRecipientPhone(currentUser.phone);
      setLocality("");
      setLocalityId("");
      setPincode("");
      setLandmark("");
      setStreetAddress("");
      setCity("Varanasi");
      setIsDefault(false);
    }
  }, [initialData]);

  // Recipient Badge Configurations
  const recipientBadges = [
    {
      type: "Self" as AddressRecipientType,
      label: "Self",
      icon: User,
      activeBg: "bg-purple-600 text-white shadow-purple-500/30",
      inactiveBg: "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200",
    },
    {
      type: "Family Member" as AddressRecipientType,
      label: "Family",
      icon: Users,
      activeBg: "bg-blue-600 text-white shadow-blue-500/30",
      inactiveBg: "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200",
    },
    {
      type: "Friend / Neighbor" as AddressRecipientType,
      label: "Friend",
      icon: HeartHandshake,
      activeBg: "bg-emerald-600 text-white shadow-emerald-500/30",
      inactiveBg: "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200",
    },
    {
      type: "Office / Work" as AddressRecipientType,
      label: "Office",
      icon: Briefcase,
      activeBg: "bg-amber-600 text-white shadow-amber-500/30",
      inactiveBg: "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200",
    },
    {
      type: "Other" as AddressRecipientType,
      label: "Other",
      icon: HelpCircle,
      activeBg: "bg-slate-700 text-white shadow-slate-500/30",
      inactiveBg: "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200",
    },
  ];

  // Click outside to close custom locality dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        localityDropdownRef.current &&
        !localityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLocalityDropdownOpen(false);
      }
    }
    if (isLocalityDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLocalityDropdownOpen]);

  // Dynamic API search for localities with debounce
  useEffect(() => {
    if (!isLocalityDropdownOpen) return;

    const trimmed = localitySearch.trim();
    if (!trimmed) {
      if (allLocalitiesRef.current.length > 0) {
        setLocalities(allLocalitiesRef.current);
      }
      setIsSearchingLocality(false);
      return;
    }

    let isCancelled = false;
    setIsSearchingLocality(true);

    const timer = setTimeout(async () => {
      try {
        const res = await getLocalitiesApi(trimmed);
        if (isCancelled) return;

        if (res && res.success) {
          const rawList: any[] =
            res.data?.localities ||
            (Array.isArray(res.data) ? res.data : []) ||
            (res as any).localities ||
            [];
          const seenSearch = new Set<string>();
          const mapped = rawList
            .filter((loc) => loc.status !== false)
            .map((loc) => ({
              id: String(loc._id || loc.id),
              name: loc.localityName || loc.name || "Locality",
              pincode: loc.pincode || "",
            }))
            .filter((loc) => {
              if (!loc.id || seenSearch.has(loc.id)) return false;
              seenSearch.add(loc.id);
              return true;
            });
          setLocalities(mapped);
        }
      } catch (err) {
        console.error("Error searching localities via API:", err);
      } finally {
        if (!isCancelled) {
          setIsSearchingLocality(false);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [localitySearch, isLocalityDropdownOpen]);

  const selectLocality = (loc: { id: string; name: string; pincode: string }) => {
    setLocality(loc.name);
    setLocalityId(loc.id);
    if (loc.pincode) {
      setPincode(loc.pincode);
    }
    setIsLocalityDropdownOpen(false);
    setLocalitySearch("");
    if (allLocalitiesRef.current.length > 0) {
      setLocalities(allLocalitiesRef.current);
    }
  };

  const filteredLocalities = localities.filter((loc) => {
    if (!localitySearch.trim()) return true;
    const q = localitySearch.toLowerCase();
    return loc.name.toLowerCase().includes(q) || loc.pincode.toLowerCase().includes(q);
  });

  const handleRecipientTypeSelect = (type: AddressRecipientType) => {
    setRecipientType(type);
    if (type === "Self") {
      setRecipientName(currentUser.name);
      setRecipientPhone(currentUser.phone);
    } else if (recipientName === currentUser.name) {
      setRecipientName("");
      setRecipientPhone("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!streetAddress || !streetAddress.trim()) {
      toast.error("Address Required", "Please enter flat/house no., building and street address.");
      return;
    }

    if (!tag || !tag.trim()) {
      toast.error("Tag Required", "Please enter an address title tag (e.g. Home, Work).");
      return;
    }

    if (!locality || !locality.trim()) {
      toast.error(
        "Active Zone Required",
        localities.length === 0
          ? "No active localities are currently available. Please contact support or try again later."
          : "Please select an active service locality."
      );
      return;
    }

    const cleanPin = (pincode || "").trim().replace(/\D/g, "");
    const finalPincode =
      cleanPin.length === 6
        ? cleanPin
        : localities.find((l) => l.id === localityId || l.name.toLowerCase() === locality.toLowerCase())?.pincode ||
        "221010";

    const cleanPhone = (recipientPhone || "").trim().replace(/\D/g, "");
    if (recipientType !== "Self") {
      if (!recipientName || !recipientName.trim()) {
        toast.error("Recipient Name Required", "Please enter the recipient's full name.");
        return;
      }
      if (cleanPhone.length !== 10) {
        toast.error("Invalid Mobile Number", "Please enter a valid 10-digit recipient mobile number.");
        return;
      }
    }

    onSave({
      tag: tag.trim() || "Home",
      recipientType,
      recipientName: recipientName?.trim() || currentUser.name,
      recipientPhone: cleanPhone || currentUser.phone,
      recipientMobile: cleanPhone || currentUser.phone,
      locality,
      localityId: localityId || "",
      pincode: finalPincode,
      landmark: landmark.trim(),
      addressLine: streetAddress.trim(),
      city,
      isDefault,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg text-left transition-all ${className}`}
    >
      {/* HEADER */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="p-1.5 rounded-lg bg-[#782860]/10 text-[#782860] dark:bg-[#782860]/20 dark:text-purple-300">
          <MapPin className="w-4 h-4" />
        </div>
        <h4 className="font-bold text-sm text-foreground tracking-tight">
          Address Details
        </h4>
      </div>

      {/* 1. VARANASI LOCALITY & PINCODE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div ref={localityDropdownRef} className="relative">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Locality (Varanasi) *
          </label>

          {/* Custom Dropdown Trigger */}
          <button
            type="button"
            onClick={() => {
              if (!isLoadingLocalities) {
                setIsLocalityDropdownOpen((prev) => !prev);
              }
            }}
            disabled={isLoadingLocalities}
            className={`w-full bg-slate-50 dark:bg-slate-800/80 border text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${isLocalityDropdownOpen
                ? "border-[#782860] ring-2 ring-[#782860]/20 bg-white dark:bg-slate-900"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#782860] shrink-0" />
              {isLoadingLocalities ? (
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-[#782860]" /> Loading localities...
                </span>
              ) : locality ? (
                <span className="text-foreground truncate font-bold flex items-center gap-2">
                  <span>{locality}</span>
                  {pincode && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#782860]/10 text-[#782860] dark:bg-[#782860]/20 dark:text-purple-300 border border-[#782860]/20">
                      PIN: {pincode}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-slate-400">Select locality</span>
              )}
            </div>

            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isLocalityDropdownOpen ? "rotate-180 text-[#782860]" : ""
                }`}
            />
          </button>

          {/* Custom Animated Menu */}
          <AnimatePresence>
            {isLocalityDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden text-left"
              >
                {/* Search Input inside Dropdown */}
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={localitySearch}
                      onChange={(e) => setLocalitySearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault();
                      }}
                      placeholder="Search locality name or pincode..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 pl-8 pr-7 py-1.5 rounded-xl text-xs text-foreground placeholder:text-slate-400 focus:outline-none focus:border-[#782860]"
                      autoFocus
                    />
                    {isSearchingLocality ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#782860] animate-spin absolute right-2.5 pointer-events-none" />
                    ) : localitySearch ? (
                      <button
                        type="button"
                        onClick={() => {
                          setLocalitySearch("");
                          if (allLocalitiesRef.current.length > 0) {
                            setLocalities(allLocalitiesRef.current);
                          }
                        }}
                        className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Localities List */}
                <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5">
                  {isSearchingLocality && filteredLocalities.length === 0 ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-1.5 text-xs text-slate-400">
                      <Loader2 className="w-4 h-4 text-[#782860] animate-spin" />
                      <span>Searching localities...</span>
                    </div>
                  ) : filteredLocalities.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">
                      {localitySearch ? `No locality found matching "${localitySearch}"` : "No matching locality found"}
                    </div>
                  ) : (
                    filteredLocalities.map((loc, lIdx) => {
                      const isSelected = loc.name.toLowerCase() === locality.toLowerCase() || loc.id === localityId;
                      return (
                        <button
                          key={`${loc.id}-${lIdx}`}
                          type="button"
                          onClick={() => selectLocality(loc)}
                          className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${isSelected
                              ? "bg-[#782860]/10 text-[#782860] dark:text-purple-300 font-bold"
                              : "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <span className="truncate">{loc.name}</span>
                            {loc.pincode && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                                {loc.pincode}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-[#782860] shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Pincode
          </label>
          <input
            type="text"
            value={pincode}
            readOnly
            placeholder="Pincode from locality"
            className="w-full bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300 cursor-not-allowed select-none focus:outline-none"
          />
        </div>
      </div>

      {/* 2. ADDRESS LINE & LANDMARK */}
      <div>
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
          Address (House / Flat / Street) *
        </label>
        <textarea
          rows={2}
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          placeholder="Flat / House no., Building, Street, Area..."
          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs text-foreground font-semibold focus:outline-none focus:border-[#782860]"
          required
        />
      </div>

      <div>
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
          Landmark (Optional)
        </label>
        <input
          type="text"
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
          placeholder="Nearby landmark or spot"
          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs text-foreground font-semibold focus:outline-none focus:border-[#782860]"
        />
      </div>

      {/* 3. ADDRESS TITLE TAG (SLIM & SMALL) */}
      <div className="space-y-1.5 pt-1">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
          Address Tag *
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          {["Home", "Work", "Other"].map((t) => {
            const isSelected = t === "Other" ? (tag !== "Home" && tag !== "Work") : tag === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  if (t === "Other") {
                    if (tag === "Home" || tag === "Work") setTag("");
                  } else {
                    setTag(t);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${isSelected
                    ? "bg-[#782860] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#782860]/40"
                  }`}
              >
                {t === "Home" ? <Home className="w-3 h-3" /> : t === "Work" ? <Briefcase className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                {t}
              </button>
            );
          })}
          {(tag !== "Home" && tag !== "Work") && (
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Tag name (e.g. Parents)"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:border-[#782860] w-36"
              autoFocus
              required
            />
          )}
        </div>
      </div>

      {/* 4. WHO IS THIS SERVICE ADDRESS FOR (SLIM & SMALL) */}
      <div className="space-y-1.5 pt-1">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
          Who is this for?
        </label>
        <div className="flex flex-wrap gap-1.5">
          {recipientBadges.map((b) => {
            const Icon = b.icon;
            const isSelected = recipientType === b.type;
            return (
              <button
                key={b.type}
                type="button"
                onClick={() => handleRecipientTypeSelect(b.type)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${isSelected
                    ? "bg-[#782860] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#782860]/40"
                  }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span>{b.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RECIPIENT CONTACT (IF NON-SELF) */}
      {recipientType !== "Self" && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in duration-200">
          <div>
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Recipient Name *
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Name"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#782860]"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Recipient Mobile *
            </label>
            <input
              type="tel"
              maxLength={10}
              value={recipientPhone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                setRecipientPhone(digits);
              }}
              placeholder="10-digit mobile"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:border-[#782860]"
              required
            />
          </div>
        </div>
      )}

      {/* 5. DEFAULT ADDRESS CHECKBOX */}
      <label className="flex items-center gap-2 cursor-pointer pt-1 select-none">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="w-4 h-4 accent-[#782860] rounded cursor-pointer"
        />
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Set as default address
        </span>
      </label>

      {/* 6. ACTION BUTTONS */}
      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 rounded-xl border border-[#782860] text-[#782860] dark:text-purple-300 bg-[#782860]/5 dark:bg-[#782860]/15 hover:bg-[#782860] hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
        >
          <Check className="w-3.5 h-3.5" /> Save Address
        </button>
      </div>
    </form>
  );
};
