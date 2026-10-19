const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";

export interface QuickServiceSectionPackage {
  _id: string;
  serviceActionId: string;
  packageName: string;
  subtitle?: string;
  description?: string;
  includeInPackage?: string[];
  excludeFromPackage?: string[];
  price: number;
  originalPrice?: number;
  duration?: number;
  imageUrl?: string;
  imageMimeType?: string;
  imageSize?: number;
  addons?: Array<{
    _id: string;
    addonName: string;
    description?: string;
    price: number;
    unit?: string;
    imageUrl?: string;
  }>;
  status: boolean;
  serviceAction?: {
    _id: string;
    categoryId: string;
    subCategoryId: string;
    serviceAction: string;
  };
}

export interface QuickServiceSectionCategory {
  _id: string;
  categoryName: string;
  slug?: string;
  iconUrl?: string;
}

export interface QuickServiceSectionItem {
  category: QuickServiceSectionCategory;
  packages: QuickServiceSectionPackage[];
}

export interface QuickServiceSectionsResponse {
  success: boolean;
  message: string;
  data?: QuickServiceSectionItem[];
}

const memoryCache = new Map<string, any>();

/**
 * Fetch website quick service sections from GET /api/quick-service-sections
 */
export async function fetchQuickServiceSectionsApi(
  token?: string | null
): Promise<QuickServiceSectionsResponse> {
  const cacheKey = `quick_service_sections_${token || "guest"}`;
  if (memoryCache.has(cacheKey)) {
    const bgHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (token) bgHeaders["Authorization"] = `Bearer ${token}`;
    const endpoint = typeof window !== "undefined" ? "/api/quick-service-sections" : `${API_BASE_URL}/api/quick-service-sections`;
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

    const endpoint = typeof window !== "undefined" ? "/api/quick-service-sections" : `${API_BASE_URL}/api/quick-service-sections`;
    const res = await fetch(endpoint, {
      method: "GET",
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch quick service sections.",
      };
    }

    if (data && data.success) {
      memoryCache.set(cacheKey, data);
    }

    return data;
  } catch (err: any) {
    console.error("fetchQuickServiceSectionsApi error:", err);
    return {
      success: false,
      message: err.message || "Network error while fetching quick service sections.",
    };
  }
}
