const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export function formatImageUrl(imgUrl?: string): string {
  if (!imgUrl || typeof imgUrl !== "string") return "";
  let trimmed = imgUrl.trim();
  if (!trimmed) return "";

  // Data URLs (base64) and blob URLs don't need transformation
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // 1. Google Drive file view links to direct image source
  const gdriveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^\/&#?]+)/);
  const gdriveIdMatch = trimmed.match(/drive\.google\.com\/(?:open|uc)\?.*id=([^\/&#?]+)/);
  const gdriveId = gdriveFileMatch ? gdriveFileMatch[1] : gdriveIdMatch ? gdriveIdMatch[1] : null;

  if (gdriveId) {
    return `https://lh3.googleusercontent.com/d/${gdriveId}`;
  }

  // 2. Dropbox share link conversion
  if (trimmed.includes("dropbox.com")) {
    if (trimmed.includes("dl=0")) {
      trimmed = trimmed.replace("dl=0", "raw=1");
    } else if (!trimmed.includes("raw=1")) {
      trimmed += (trimmed.includes("?") ? "&" : "?") + "raw=1";
    }
  }

  // 3. Convert backslashes to forward slashes
  trimmed = trimmed.replace(/\\/g, "/");

  // 4. Proxy /api/media/ URLs via same-origin Next.js rewrite to bypass CORS
  if (trimmed.includes("/api/media/")) {
    const mediaIdx = trimmed.indexOf("/api/media/");
    return trimmed.substring(mediaIdx);
  }
  if (trimmed.includes("media/package/")) {
    const mediaIdx = trimmed.indexOf("media/package/");
    return `/api/${trimmed.substring(mediaIdx)}`;
  }
  if (trimmed.includes("package/") && (trimmed.includes("/image") || trimmed.length > 20)) {
    const pkgIdx = trimmed.indexOf("package/");
    const pkgPath = trimmed.substring(pkgIdx);
    return pkgPath.endsWith("/image") ? `/api/media/${pkgPath}` : `/api/media/${pkgPath}/image`;
  }

  // 5. Handle relative URLs by prepending API_BASE_URL
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    if (!trimmed.startsWith("/")) {
      trimmed = `/${trimmed}`;
    }
    trimmed = `${API_BASE_URL}${trimmed}`;
  }

  try {
    return encodeURI(decodeURI(trimmed));
  } catch {
    return trimmed;
  }
}

/**
 * Returns a clean initial letter from a name (extracts only alphabetical letter [A-Z], strictly ignoring & % and special characters).
 * e.g., "Cleaning & Pest Control" -> "C", "AC Repair" -> "A", "Plumber" -> "P"
 */
export function getNameInitials(name?: string, fallback: string = "P"): string {
  const sanitizeLetter = (char?: string): string => {
    if (!char) return "";
    const match = char.match(/[a-zA-Z]/);
    return match ? match[0].toUpperCase() : "";
  };

  const cleanFallback = sanitizeLetter(fallback) || "P";

  if (!name || typeof name !== "string") return cleanFallback;

  // Extract the first pure alphabetical character [a-zA-Z]
  const match = name.match(/[a-zA-Z]/);
  if (match) {
    return match[0].toUpperCase();
  }

  return cleanFallback;
}

