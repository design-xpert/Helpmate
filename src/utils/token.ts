import { useStore } from "@/store/useStore";
import { toast } from "@/components/common/Toast";

/**
 * Safely decodes base64url encoded string in both browser and server environments
 */
function decodeBase64Url(base64Url: string): string {
  try {
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    if (typeof window !== "undefined" && typeof window.atob === "function") {
      return decodeURIComponent(
        Array.prototype.map
          .call(window.atob(base64), (c: string) => {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
    } else {
      return Buffer.from(base64, "base64").toString("utf-8");
    }
  } catch {
    return "";
  }
}

export interface DecodedJwtPayload {
  id?: string;
  sub?: string;
  userId?: string;
  customerId?: string;
  mobile?: string;
  phone?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * Decodes JWT token payload without verification
 */
export function decodeJwt(token: string | null | undefined): DecodedJwtPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const jsonStr = decodeBase64Url(parts[1]);
    if (!jsonStr) return null;
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Checks if a JWT token is expired.
 * Returns true if token is missing or if exp is in the past.
 * Returns false if token has a valid future expiration or is non-standard.
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  const payload = decodeJwt(token);
  if (!payload) {
    return false;
  }

  if (typeof payload.exp === "number") {
    // payload.exp is in seconds
    const expirationTimeMs = payload.exp * 1000;
    // Buffer with 5 seconds clock skew to avoid borderline failures
    return Date.now() >= expirationTimeMs - 5000;
  }

  return false;
}

/**
 * Checks whether an HTTP status or response message represents an auth expiration / invalid token failure
 */
export function isAuthError(status?: number, message?: string): boolean {
  if (status === 401) return true;
  if (!message || typeof message !== "string") return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("jwt expired") ||
    lower.includes("token expired") ||
    lower.includes("token has expired") ||
    lower.includes("invalid token") ||
    lower.includes("unauthorized") ||
    lower.includes("jwt malformed") ||
    lower.includes("jwt must be provided") ||
    lower.includes("authentication failed") ||
    lower.includes("session expired")
  );
}

let isLoggingOut = false;

/**
 * Central handler to immediately log the user out when their token expires or verification fails
 */
export function handleTokenExpiration(customReason?: string, customTitle?: string) {
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    // 1. Immediately clear user authentication and persisted state in Zustand
    useStore.getState().logout();

    // 2. Show alert toast notification
    const title = customTitle || "Session Expired";
    const reason = customReason || "Your login session has expired. Please sign in again.";
    toast.error(title, reason);

    // 3. If currently on a protected route or checkout page, redirect to login
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      const isProtectedRoute = pathname.startsWith("/profile") || pathname.startsWith("/booking");
      if (isProtectedRoute) {
        window.location.href = `/login?redirect=${encodeURIComponent(pathname + window.location.search)}`;
      }
    }
  } finally {
    setTimeout(() => {
      isLoggingOut = false;
    }, 2000);
  }
}
