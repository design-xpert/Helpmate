const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";

export interface SpotlightPackageItem {
  packageId: string;
  packageName: string;
  subtitle?: string;
  description?: string;
  includeInPackage?: string[];
  excludeFromPackage?: string[];
  category?: {
    id: string;
    name: string;
  };
  subCategory?: {
    id: string;
    name: string;
  };
  serviceAction?: {
    id: string;
    name: string;
  };
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  duration?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  addons?: string[];
  badge?: string;
  displayOrder?: number;
}

export interface SpotlightResponse {
  success: boolean;
  message: string;
  data?: SpotlightPackageItem[];
}

const memoryCache = new Map<string, any>();

/**
 * Fetch website spotlight packages for customer.
 * GET /api/website/spotlight
 */
export async function fetchWebsiteSpotlightApi(
  token?: string | null
): Promise<SpotlightResponse> {
  const cacheKey = `spotlight_${token || "guest"}`;
  if (memoryCache.has(cacheKey)) {
    // Refresh in background
    const bgHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (token) bgHeaders["Authorization"] = `Bearer ${token}`;
    const endpoint = typeof window !== "undefined" ? "/api/website/spotlight" : `${API_BASE_URL}/api/website/spotlight`;
    fetch(endpoint, { method: "GET", headers: bgHeaders })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success) memoryCache.set(cacheKey, data);
      })
      .catch(() => {});

    return memoryCache.get(cacheKey);
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const endpoint = typeof window !== "undefined" ? "/api/website/spotlight" : `${API_BASE_URL}/api/website/spotlight`;
    const res = await fetch(endpoint, {
      method: "GET",
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch spotlight items.",
      };
    }

    if (data && data.success) {
      memoryCache.set(cacheKey, data);
    }

    return data;
  } catch (err: any) {
    console.error("fetchWebsiteSpotlightApi error:", err);
    return {
      success: false,
      message: err.message || "Network error while fetching spotlight items.",
    };
  }
}
