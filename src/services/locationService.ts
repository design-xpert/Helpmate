const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";

// Fallback list of known active Varanasi service zone pincodes from database
export const KNOWN_VARANASI_PINCODES = new Set<string>([
  "221001", "221002", "221003", "221004", "221005", "221006", "221007", "221008",
  "221010", "221011", "221101", "221104", "221106", "221108", "221110", "221112",
  "221201", "221202", "221204", "221206", "221207", "221307", "221311", "221402",
  "221403", "221405", "232102", "232103", "232106", "232107", "232109", "232110",
  "232111", "232118"
]);

export interface ServiceableLocality {
  id: string;
  name: string;
  pincode: string;
}

let cachedLocalities: ServiceableLocality[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch and cache active serviceable localities from backend
 */
export async function getServiceableLocalities(): Promise<ServiceableLocality[]> {
  const now = Date.now();
  if (cachedLocalities && now - lastFetchTime < CACHE_TTL) {
    return cachedLocalities;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/locality/dropdown`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      const seen = new Set<string>();
      cachedLocalities = json.data
        .map((item: any) => ({
          id: String(item._id || item.id || ""),
          name: String(item.localityName || item.name || "").trim(),
          pincode: String(item.pincode || "").trim(),
        }))
        .filter((item: any) => {
          if (!item.id || seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      lastFetchTime = now;
      return cachedLocalities || [];
    }
  } catch (err) {
    console.warn("Failed to fetch serviceable localities from backend, using known fallback:", err);
  }

  return cachedLocalities || [];
}

export interface GeolocationResult {
  locality: string;
  city: string;
  state: string;
  pincode: string;
  formattedAddress: string;
  isServiceable: boolean;
  latitude: number;
  longitude: number;
}

/**
 * Reverse-geocodes coordinates (lat, lng) to actual user locality, city, pincode
 * using OpenStreetMap Nominatim with BigDataCloud fallback.
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<{
  locality: string;
  city: string;
  state: string;
  pincode: string;
  formattedAddress: string;
}> {
  // Strategy 1: OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    const res = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const locality =
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          addr.quarter ||
          addr.subdistrict ||
          addr.locality ||
          addr.city_district ||
          "";

        const city =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.county ||
          addr.state_district ||
          "";

        const state = addr.state || "";
        const pincode = addr.postcode ? String(addr.postcode).replace(/\D/g, "") : "";

        const parts: string[] = [];
        if (locality) parts.push(locality);
        if (city && city.toLowerCase() !== locality.toLowerCase()) parts.push(city);
        if (!parts.length && state) parts.push(state);

        const formattedAddress = parts.join(", ") || (city || "Detected Location");

        if (city || locality || pincode) {
          return {
            locality,
            city,
            state,
            pincode,
            formattedAddress,
          };
        }
      }
    }
  } catch {
    // Continue to fallback
  }

  // Strategy 2: BigDataCloud Client Reverse Geocoding
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await fetch(bdcUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const locality = data.locality || data.principalSubdivision || "";
      const city = data.city || data.locality || "";
      const state = data.principalSubdivision || "";
      const pincode = data.postcode ? String(data.postcode).replace(/\D/g, "") : "";

      const parts: string[] = [];
      if (locality) parts.push(locality);
      if (city && city.toLowerCase() !== locality.toLowerCase()) parts.push(city);
      const formattedAddress = parts.join(", ") || city || "Detected Location";

      return {
        locality,
        city,
        state,
        pincode,
        formattedAddress,
      };
    }
  } catch {
    // Fallback error
  }

  return {
    locality: "",
    city: "",
    state: "",
    pincode: "",
    formattedAddress: "Detected Location",
  };
}

/**
 * Check whether a given city, pincode, or locality is within Varanasi's serviceable area
 */
export async function checkIsLocationServiceable(
  city: string,
  pincode: string,
  locality?: string
): Promise<boolean> {
  const normCity = (city || "").toLowerCase().trim();
  const normPincode = (pincode || "").trim();
  const isVaranasiCity =
    normCity.includes("varanasi") ||
    normCity.includes("banaras") ||
    normCity.includes("benares") ||
    normCity.includes("kashi");

  // 1. Check known Varanasi pincodes set
  if (normPincode && KNOWN_VARANASI_PINCODES.has(normPincode)) {
    return true;
  }

  // 2. Check active localities from backend
  const activeLocalities = await getServiceableLocalities();
  if (normPincode && activeLocalities.length > 0) {
    const matchPin = activeLocalities.some((loc) => loc.pincode === normPincode);
    if (matchPin) return true;
  }

  // 3. If city is Varanasi and locality matches known zone
  if (isVaranasiCity) {
    if (!normPincode) return true; // Within Varanasi city boundary
    if (locality && activeLocalities.length > 0) {
      const normLoc = locality.toLowerCase().trim();
      const matchLoc = activeLocalities.some((loc) =>
        loc.name.toLowerCase().includes(normLoc) || normLoc.includes(loc.name.toLowerCase())
      );
      if (matchLoc) return true;
    }
    // If it's Varanasi but with a 221xxx pincode
    if (normPincode.startsWith("221") || normPincode.startsWith("232")) {
      return true;
    }
  }

  return false;
}

/**
 * Full workflow: reverse geocode and verify serviceability
 */
export async function reverseGeocodeAndCheckServiceability(
  latitude: number,
  longitude: number
): Promise<GeolocationResult> {
  const geo = await reverseGeocode(latitude, longitude);
  const isServiceable = await checkIsLocationServiceable(geo.city, geo.pincode, geo.locality);

  return {
    ...geo,
    isServiceable,
    latitude,
    longitude,
  };
}

/**
 * Synchronous/quick check for an address object (used in Booking & Checkout screens)
 */
export function isAddressWithinServiceableZone(
  addr: {
    city?: string;
    pincode?: string;
    locality?: string;
    localityId?: string;
  } | null | undefined,
  activeLocalities: ServiceableLocality[] = []
): boolean {
  if (!addr) return true;

  const city = (addr.city || "").toLowerCase().trim();
  const pincode = (addr.pincode || "").trim();
  const isVaranasiCity =
    city.includes("varanasi") ||
    city.includes("banaras") ||
    city.includes("benares") ||
    city.includes("kashi");

  // Check pincode against known static list
  if (pincode && KNOWN_VARANASI_PINCODES.has(pincode)) {
    return true;
  }

  // Check pincode against active backend localities
  if (pincode && activeLocalities.length > 0) {
    const hasMatch = activeLocalities.some((l) => l.pincode === pincode);
    if (hasMatch) return true;
  }

  // Check localityId
  if (addr.localityId && activeLocalities.length > 0) {
    const hasIdMatch = activeLocalities.some((l) => l.id === addr.localityId);
    if (hasIdMatch) return true;
  }

  // If city is non-empty and NOT Varanasi, it's definitively outside
  if (city && !isVaranasiCity) {
    return false;
  }

  // If city is Varanasi and pincode starts with 221xxx or 232xxx
  if (isVaranasiCity && (pincode.startsWith("221") || pincode.startsWith("232"))) {
    return true;
  }

  // If city is Varanasi and no pincode specified yet
  if (isVaranasiCity && !pincode) {
    return true;
  }

  // If no city, but pincode is non-Varanasi
  if (pincode && !KNOWN_VARANASI_PINCODES.has(pincode) && !pincode.startsWith("221") && !pincode.startsWith("232")) {
    return false;
  }

  return true;
}
