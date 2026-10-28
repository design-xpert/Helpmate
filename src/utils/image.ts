const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export function formatImageUrl(
  imgUrl?: any,
  packageId?: string,
  version?: string | number
): string {
  if (!imgUrl && !packageId) return "";

  let rawStr = "";
  let itemUpdatedAt: any = null;

  if (typeof imgUrl === "string") {
    rawStr = imgUrl;
  } else if (typeof imgUrl === "object" && imgUrl !== null) {
    itemUpdatedAt = imgUrl.updatedAt || imgUrl.updated_at || imgUrl.modifiedAt;
    rawStr =
      imgUrl.imageUrl ||
      imgUrl.thumbnailUrl ||
      imgUrl.image ||
      imgUrl.url ||
      imgUrl.iconUrl ||
      "";
    if (!packageId) {
      packageId = imgUrl.id || imgUrl._id || imgUrl.packageId;
    }
  }

  if (!rawStr && packageId && /^[0-9a-fA-F]{24}$/.test(packageId)) {
    rawStr = `/api/media/package/${packageId}/image`;
  }

  if (!rawStr || typeof rawStr !== "string") return "";
  let trimmed = rawStr.trim();
  if (!trimmed) return "";

  // Data URLs (base64) and blob URLs don't need transformation
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // Extract query string (e.g. ?v=... or ?t=...)
  let queryString = "";
  const qIdx = trimmed.indexOf("?");
  if (qIdx !== -1) {
    queryString = trimmed.substring(qIdx);
    trimmed = trimmed.substring(0, qIdx);
  }

  // If no query string, check if we have a version or updatedAt
  let versionQuery = queryString;
  if (!versionQuery) {
    if (version) {
      versionQuery = `?v=${version}`;
    } else if (itemUpdatedAt) {
      const t = new Date(itemUpdatedAt).getTime();
      if (!isNaN(t) && t > 0) {
        versionQuery = `?v=${t}`;
      }
    }
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
    return trimmed;
  }

  // 3. Convert backslashes to forward slashes
  trimmed = trimmed.replace(/\\/g, "/");

  // 4. Proxy /api/media/ URLs via same-origin Next.js rewrite to bypass CORS
  if (trimmed.includes("/api/media/")) {
    const mediaIdx = trimmed.indexOf("/api/media/");
    return `${trimmed.substring(mediaIdx)}${versionQuery}`;
  }
  if (trimmed.includes("media/package/")) {
    const mediaIdx = trimmed.indexOf("media/package/");
    return `/api/${trimmed.substring(mediaIdx)}${versionQuery}`;
  }
  if (packageId && (trimmed.startsWith("helpMate/packages") || trimmed.includes("packages/"))) {
    return `/api/media/package/${packageId}/image${versionQuery}`;
  }
  if (trimmed.includes("package/") && (trimmed.includes("/image") || trimmed.length > 20)) {
    const pkgIdx = trimmed.indexOf("package/");
    const pkgPath = trimmed.substring(pkgIdx);
    const cleanPath = pkgPath.endsWith("/image") ? pkgPath : `${pkgPath}/image`;
    return `/api/media/${cleanPath}${versionQuery}`;
  }

  // 5. Handle relative URLs by prepending API_BASE_URL
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    if (!trimmed.startsWith("/")) {
      trimmed = `/${trimmed}`;
    }
    trimmed = `${API_BASE_URL}${trimmed}`;
  }

  try {
    const encoded = encodeURI(decodeURI(trimmed));
    return `${encoded}${versionQuery}`;
  } catch {
    return `${trimmed}${versionQuery}`;
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

