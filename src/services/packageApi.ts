const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface FetchPackagesParams {
  categoryId?: string;
  subCategoryId?: string;
  serviceActionId?: string;
  search?: string;
  maxBudget?: number;
  page?: number;
  limit?: number;
  sort?: "price_asc" | "price_desc" | "newest";
}

export interface CustomerPackageItem {
  package: {
    id: string;
    name: string;
    subtitle?: string;
    description?: string;
    price: number;
    originalPrice?: number;
    discountPercentage?: number;
    duration?: number;
    imageUrl?: string;
    thumbnailUrl?: string;
    includeInPackage?: string[];
    excludeFromPackage?: string[];
    isBookmarked?: boolean;
  };
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
  addons?: Array<{
    _id: string;
    addonName: string;
    description?: string;
    price: number;
    unit?: string;
    imageUrl?: string;
  }>;
}

export interface CustomerPackagesResponse {
  success: boolean;
  message: string;
  data?: CustomerPackageItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// In-memory cache for ultra-fast API response & zero repeat network calls
const packageMemoryCache = new Map<string, CustomerPackagesResponse>();

/**
 * Fetch customer packages with optional filters:
 * - categoryId
 * - subCategoryId
 * - serviceActionId
 * - search
 * - maxBudget
 * - page
 * - limit
 * - sort
 * 
 * GET /api/customer/packages
 */
export async function fetchCustomerPackagesApi(
  params: FetchPackagesParams | string = {},
  token?: string | null
): Promise<CustomerPackagesResponse> {
  try {
    const normalizedParams: FetchPackagesParams =
      typeof params === "string" ? { serviceActionId: params } : params;

    const queryParams = new URLSearchParams();

    if (normalizedParams.categoryId) queryParams.append("categoryId", normalizedParams.categoryId);
    if (normalizedParams.subCategoryId) queryParams.append("subCategoryId", normalizedParams.subCategoryId);
    if (normalizedParams.serviceActionId) queryParams.append("serviceActionId", normalizedParams.serviceActionId);
    if (normalizedParams.search) queryParams.append("search", normalizedParams.search);
    if (normalizedParams.maxBudget !== undefined && normalizedParams.maxBudget > 0) {
      queryParams.append("maxBudget", normalizedParams.maxBudget.toString());
    }
    if (normalizedParams.page) queryParams.append("page", Math.max(1, normalizedParams.page).toString());
    const safeLimit = Math.min(50, Math.max(1, normalizedParams.limit || 50));
    queryParams.append("limit", safeLimit.toString());
    if (normalizedParams.sort) queryParams.append("sort", normalizedParams.sort);

    const queryString = queryParams.toString();
    const cacheKey = `pkg_${queryString || "all"}`;
    const url = `${API_BASE_URL}/api/customer/packages${queryString ? `?${queryString}` : ""}`;

    // Return cached result instantly if available to prevent repeated API calls when switching back
    if (packageMemoryCache.has(cacheKey)) {
      const cachedResponse = packageMemoryCache.get(cacheKey)!;

      // Background revalidation
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      fetch(url, { method: "GET", headers })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success) {
            packageMemoryCache.set(cacheKey, data);
          }
        })
        .catch(() => {});

      return cachedResponse;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await response.json();
    if (data && data.success) {
      packageMemoryCache.set(cacheKey, data);
    }
    return data;
  } catch (error: any) {
    console.error("Error fetching customer packages:", error);
    return {
      success: false,
      message: error?.message || "Failed to fetch packages.",
    };
  }
}

export interface CustomerPackageDetailsData {
  package: {
    id: string;
    name: string;
    subtitle?: string;
    description?: string;
    price: number;
    originalPrice?: number;
    discountPercentage?: number;
    duration?: number;
    imageUrl?: string;
    thumbnailUrl?: string;
    includeInPackage?: string[];
    excludeFromPackage?: string[];
    isBookmarked?: boolean;
  };
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
  addons?: Array<{
    _id: string;
    addonName: string;
    description?: string;
    price: number;
    unit?: string;
    imageUrl?: string;
  }>;
  reviews?: {
    averageRating: number;
    totalReviews: number;
    items: Array<{
      id: string;
      customer?: {
        id?: string;
        name?: string;
      };
      rating: number;
      review?: string;
      isEdited?: boolean;
      createdAt?: string;
      video?: {
        originalName?: string;
        mimeType?: string;
        size?: number;
        duration?: number;
        videoUrl?: string;
      } | null;
    }>;
  };
}

export interface CustomerPackageDetailsResponse {
  success: boolean;
  message: string;
  data?: CustomerPackageDetailsData;
}

/**
 * Fetch package details by packageId:
 * GET /api/customer/packages/:packageId
 */
export async function fetchCustomerPackageDetailsApi(
  packageId: string,
  token?: string | null
): Promise<CustomerPackageDetailsResponse> {
  try {
    const url = `${API_BASE_URL}/api/customer/packages/${packageId}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching package details:", error);
    return {
      success: false,
      message: error?.message || "Failed to fetch package details.",
    };
  }
}
