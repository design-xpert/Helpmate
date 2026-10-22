const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";

export interface WebsiteBannerData {
  _id: string;
  badgeText?: string;
  badgePosition?: "bottom-left" | "bottom-right" | "top-left" | "top-right" | string;
  clickTargetUrl?: string;
  popupDelaySeconds?: number;
  displayFrequency?: "once-per-session" | "always" | "once-per-day" | string;
  isActive: boolean;
  mainImageMimeType?: string;
  mainImageSize?: number;
  badgeIconMimeType?: string;
  badgeIconSize?: number;
  mainImageUrl?: string;
  badgeIconUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WebsiteBannerResponse {
  success: boolean;
  message: string;
  data?: WebsiteBannerData | null;
}

/**
 * Fetch active promotional banner for website visitors
 * GET /api/website/banner
 */
export async function fetchWebsiteBannerApi(): Promise<WebsiteBannerResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/website/banner`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching website banner:", error);
    return {
      success: false,
      message: error?.message || "Failed to fetch website banner.",
      data: null,
    };
  }
}
