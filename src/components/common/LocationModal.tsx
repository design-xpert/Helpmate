"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  MapPin, 
  MapPinOff,
  Navigation, 
  Search, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  X, 
  Loader2, 
  Compass,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { citiesServed } from "@/utils/mockData";
import { fetchCustomerNeighborhoodZonesApi, NeighborhoodZoneItem } from "@/services/neighborhoodApi";
import { 
  reverseGeocodeAndCheckServiceability, 
  checkIsLocationServiceable, 
  GeolocationResult 
} from "@/services/locationService";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoPrompt?: boolean;
}

export default function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const { 
    selectedLocation, 
    setSelectedLocation, 
    locationPermissionDenied, 
    setLocationPermissionDenied,
    addNotification,
    setIsLocationSet,
    setHasPromptedLocation,
    setIsOutOfServiceZone
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"prompt" | "detecting" | "manual" | "success" | "out_of_zone">("prompt");
  const [detectedInfo, setDetectedInfo] = useState<GeolocationResult | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [, setErrorMessage] = useState<string | null>(null);
  const [zones, setZones] = useState<NeighborhoodZoneItem[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when Location Modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    async function loadZones() {
      const res = await fetchCustomerNeighborhoodZonesApi();
      if (res.success && res.data && res.data.length > 0) {
        setZones(res.data);
      }
    }
    loadZones();
  }, []);

  const handleCloseModal = () => {
    setIsLocationSet(true);
    setHasPromptedLocation(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("helpmate_location_set", "true");
    }
    onClose();
  };

  // If permission was previously denied, default directly to manual input mode when opened
  useEffect(() => {
    if (isOpen) {
      if (locationPermissionDenied) {
        setMode("manual");
      } else {
        setMode("prompt");
      }
      setErrorMessage(null);
    }
  }, [isOpen, locationPermissionDenied]);

  // Request browser Geolocation API
  const handleAllowLocation = () => {
    setMode("detecting");
    setErrorMessage(null);

    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser. Please enter your location manually.");
      setLocationPermissionDenied(true);
      setMode("manual");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const geo = await reverseGeocodeAndCheckServiceability(lat, lng);
          setDetectedInfo(geo);

          const detectedArea = geo.formattedAddress || (geo.city ? `${geo.city}` : "Detected Location");
          setLocationPermissionDenied(false);
          setIsLocationSet(true);
          setHasPromptedLocation(true);

          if (geo.isServiceable) {
            setSelectedLocation(detectedArea);
            setIsOutOfServiceZone(false);

            if (typeof window !== "undefined") {
              localStorage.setItem("helpmate_location_set", "true");
              localStorage.setItem("helpmate_user_location", detectedArea);
              localStorage.setItem("helpmate_out_of_zone", "false");
            }
            setMode("success");

            addNotification(
              "Location Access Granted",
              `Detected location: ${detectedArea}. Showing nearby service partners.`,
              "success"
            );

            setTimeout(() => {
              onClose();
            }, 1200);
          } else {
            // Outside of serviceable zone
            setSelectedLocation(detectedArea);
            setIsOutOfServiceZone(true);

            if (typeof window !== "undefined") {
              localStorage.setItem("helpmate_location_set", "true");
              localStorage.setItem("helpmate_user_location", detectedArea);
              localStorage.setItem("helpmate_out_of_zone", "true");
            }
            setMode("out_of_zone");

            addNotification(
              "Outside Serviceable Area",
              `We detected you are in ${geo.city || "a non-serviceable city"}. We are working to come to your city soon!`,
              "warning"
            );
          }
        } catch (err) {
          console.warn("Reverse geocode failed:", err);
          setErrorMessage("Failed to resolve your location coordinates. Please choose your area manually.");
          setMode("manual");
        }
      },
      (error) => {
        console.warn("Geolocation permission error:", error);
        setLocationPermissionDenied(true);
        setErrorMessage("Location permission denied or unavailable. Please enter your location manually.");
        setMode("manual");
        
        addNotification(
          "Location Permission Denied",
          "You denied location access. Please enter your location manually.",
          "warning"
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    const formattedLoc = manualInput.trim();
    setSelectedLocation(formattedLoc);
    setIsLocationSet(true);
    setHasPromptedLocation(true);

    const isServiceable = await checkIsLocationServiceable(formattedLoc, "", formattedLoc);
    setIsOutOfServiceZone(!isServiceable);

    if (typeof window !== "undefined") {
      localStorage.setItem("helpmate_location_set", "true");
      localStorage.setItem("helpmate_user_location", formattedLoc);
      localStorage.setItem("helpmate_out_of_zone", isServiceable ? "false" : "true");
    }

    if (!isServiceable) {
      setDetectedInfo({
        locality: formattedLoc,
        city: formattedLoc,
        state: "",
        pincode: "",
        formattedAddress: formattedLoc,
        isServiceable: false,
        latitude: 0,
        longitude: 0,
      });
      setMode("out_of_zone");
      return;
    }

    addNotification("Location Set", `Service location set to "${formattedLoc}".`, "info");
    onClose();
  };

  const handleSelectQuickCity = (cityName: string) => {
    setSelectedLocation(cityName);
    setIsLocationSet(true);
    setIsOutOfServiceZone(false);
    setHasPromptedLocation(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("helpmate_location_set", "true");
      localStorage.setItem("helpmate_user_location", cityName);
      localStorage.setItem("helpmate_out_of_zone", "false");
    }
    addNotification("Location Updated", `Selected zone: ${cityName}`, "success");
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 md:p-6 font-sans overflow-y-auto"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md pointer-events-none"
          />

          {/* Main Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl sm:rounded-[32px] shadow-2xl z-10 my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[min(90vh,720px)] flex flex-col text-left overflow-hidden"
          >
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between p-5 pb-4 sm:p-6 sm:pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              {mode === "manual" ? (
                <div className="flex items-center gap-3">
                  {!locationPermissionDenied && (
                    <button
                      type="button"
                      onClick={() => setMode("prompt")}
                      className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="Back to auto-detect"
                      aria-label="Back to auto-detect"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <div className="w-10 h-10 rounded-2xl bg-accent-lux/10 text-accent-lux flex items-center justify-center border border-accent-lux/20 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold tracking-widest text-accent-lux">
                      Manual Selection
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                      Choose Service Location
                    </h3>
                  </div>
                </div>
              ) : mode === "detecting" ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent-lux/10 text-accent-lux flex items-center justify-center border border-accent-lux/20 shrink-0">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold tracking-widest text-accent-lux">
                      Detecting
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                      Finding Your Area...
                    </h3>
                  </div>
                </div>
              ) : mode === "success" ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400">
                      Confirmed
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                      Location Updated
                    </h3>
                  </div>
                </div>
              ) : mode === "out_of_zone" ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                    <MapPinOff className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold tracking-widest text-amber-600 dark:text-amber-400">
                      Service Area Notice
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                      Outside Service Zone
                    </h3>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent-lux/10 text-accent-lux flex items-center justify-center border border-accent-lux/20 shrink-0">
                    <Navigation className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold tracking-widest text-accent-lux">
                      Location Permission
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                      Allow Location Access
                    </h3>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-3"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar space-y-5">
              {/* MODE 1: PROMPT VIEW (FIRST OPEN / ALLOW LOCATION) */}
              {mode === "prompt" && (
                <div className="space-y-5">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Allowing location access helps us find background-verified specialists &amp; real-time arrival estimates near your home.
                  </p>

                  {/* Action Buttons */}
                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleAllowLocation}
                      className="w-full py-3.5 px-6 rounded-2xl bg-accent-lux hover:bg-accent-lux/90 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                      <Navigation className="w-4 h-4 text-white" />
                      <span className="text-white">Allow Location Access</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("manual")}
                      className="w-full py-3 px-6 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      Enter Location Manually Instead
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-[10px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Your privacy is protected. Location is strictly used for service delivery.</span>
                  </div>
                </div>
              )}

              {/* MODE 2: DETECTING / LOADING */}
              {mode === "detecting" && (
                <div className="py-8 flex flex-col items-center text-center space-y-4">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-accent-lux/20 animate-ping" />
                    <Loader2 className="w-8 h-8 text-accent-lux animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Detecting Your Location...</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                      Please respond to the browser permission prompt to allow location access.
                    </p>
                  </div>
                </div>
              )}

              {/* MODE 3: SUCCESS DETECTED */}
              {mode === "success" && (
                <div className="py-6 flex flex-col items-center text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
                    <Check className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Location Detected Successfully!</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Set to <strong className="text-slate-900 dark:text-white font-bold">{selectedLocation}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* MODE: OUT OF SERVICE ZONE (COMING SOON NOTICE) */}
              {mode === "out_of_zone" && (
                <div className="py-2 space-y-5 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm">
                    <MapPinOff className="w-8 h-8" />
                  </div>

                  <div className="space-y-2 max-w-sm mx-auto">
                    <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      We are working to come to your city!
                    </h4>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block mb-1">
                        Detected Location
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {detectedInfo?.formattedAddress || selectedLocation}
                      </span>
                      {detectedInfo?.pincode && (
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-mono mt-1">
                          Postal Code: {detectedInfo.pincode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                      HelpMate currently delivers verified luxury home services exclusively across <strong className="text-slate-800 dark:text-slate-200 font-bold">Varanasi</strong>. We are actively expanding and working hard to bring services to {detectedInfo?.city || "your city"} soon!
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLocation("Varanasi");
                        setIsOutOfServiceZone(false);
                        if (typeof window !== "undefined") {
                          localStorage.setItem("helpmate_location_set", "true");
                          localStorage.setItem("helpmate_user_location", "Varanasi");
                          localStorage.setItem("helpmate_out_of_zone", "false");
                        }
                        onClose();
                      }}
                      className="w-full py-3.5 px-6 rounded-2xl bg-accent-lux hover:bg-accent-lux/90 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                      <span>Explore Varanasi Services Anyway</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("manual")}
                      className="w-full py-3 px-6 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      Choose a Varanasi Service Hub Manually
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 4: MANUAL INPUT VIEW */}
              {mode === "manual" && (
                <div className="space-y-5">
                  {locationPermissionDenied && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <span>Location access was denied or unavailable. Please choose or type your location below.</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Type your area or select from Varanasi active service hubs.
                  </p>

                  {/* Manual Search Form */}
                  <form onSubmit={handleManualSubmit} className="space-y-2.5">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        placeholder="Enter city, area or street address (e.g. Assi Ghat, Sigra)..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-16 py-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-accent-lux font-medium transition-colors"
                        autoFocus
                      />
                      {manualInput && (
                        <button
                          type="button"
                          onClick={() => setManualInput("")}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold px-1 py-0.5 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!manualInput.trim()}
                      className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                        manualInput.trim()
                          ? "bg-accent-lux text-white shadow-md shadow-accent-lux/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <span className={manualInput.trim() ? "text-white" : ""}>Save &amp; Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {/* Quick Select Varanasi Zones */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Popular Varanasi Service Zones
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {zones.length > 0 ? zones.length : citiesServed.length} Hubs
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 sm:max-h-64 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                      {zones.length > 0
                        ? zones.map((zone) => {
                            const isSelected = selectedLocation === zone.zoneName;
                            return (
                              <button
                                key={zone._id}
                                type="button"
                                onClick={() => handleSelectQuickCity(zone.zoneName)}
                                className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                                  isSelected
                                    ? "bg-accent-lux/10 border-accent-lux text-accent-lux shadow-xs"
                                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-800 hover:border-accent-lux/50 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <span className="text-xs font-bold truncate block">{zone.zoneName}</span>
                                  <span className="text-[9px] text-slate-400">
                                    {zone.proCount ? `${zone.proCount}+ Verified Pros` : "Varanasi Area"}
                                  </span>
                                </div>
                                <Check className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "opacity-100 text-accent-lux" : "opacity-0 group-hover:opacity-40"}`} />
                              </button>
                            );
                          })
                        : citiesServed.map((city) => {
                            const isSelected = selectedLocation === city.name;
                            return (
                              <button
                                key={city.name}
                                type="button"
                                onClick={() => handleSelectQuickCity(city.name)}
                                className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                                  isSelected
                                    ? "bg-accent-lux/10 border-accent-lux text-accent-lux shadow-xs"
                                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-800 hover:border-accent-lux/50 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <span className="text-xs font-bold truncate block">{city.name}</span>
                                  <span className="text-[9px] text-slate-400">{city.activePros}+ Verified Pros</span>
                                </div>
                                <Check className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "opacity-100 text-accent-lux" : "opacity-0 group-hover:opacity-40"}`} />
                              </button>
                            );
                          })}
                    </div>
                  </div>

                  {/* Option to retry auto-detection */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setMode("prompt")}
                      className="text-xs text-accent-lux hover:underline font-semibold flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" /> Retry Auto-Detecting Geolocation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
