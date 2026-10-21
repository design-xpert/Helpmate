"use client";

import { useState, useEffect } from "react";
import { formatImageUrl, getNameInitials } from "@/utils/image";

interface CartPackageImageProps {
  src?: string;
  name: string;
  pkgId?: string;
  category?: string;
  className?: string;
}

// Fallback high-resolution service images mapped to common categories & keywords
export function getFallbackServiceImage(name?: string, category?: string): string {
  const combined = `${name || ""} ${category || ""}`.toLowerCase();

  if (combined.includes("ac") || combined.includes("air condition") || combined.includes("cooling") || combined.includes("jet")) {
    return "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80";
  }
  if (combined.includes("clean") || combined.includes("wash") || combined.includes("maid") || combined.includes("sanitiz")) {
    return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80";
  }
  if (combined.includes("plumb") || combined.includes("pipe") || combined.includes("tap") || combined.includes("water") || combined.includes("drain") || combined.includes("leak")) {
    return "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80";
  }
  if (combined.includes("electr") || combined.includes("wire") || combined.includes("switch") || combined.includes("light") || combined.includes("fan")) {
    return "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80";
  }
  if (combined.includes("pest") || combined.includes("termite") || combined.includes("cockroach") || combined.includes("bug")) {
    return "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80";
  }
  if (combined.includes("paint") || combined.includes("wall") || combined.includes("waterproof") || combined.includes("whitewash")) {
    return "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80";
  }
  if (combined.includes("carpent") || combined.includes("wood") || combined.includes("furniture") || combined.includes("door")) {
    return "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80";
  }
  if (combined.includes("chimney") || combined.includes("kitchen") || combined.includes("hob")) {
    return "https://images.unsplash.com/photo-1587582423116-ec07293f0395?auto=format&fit=crop&w=600&q=80";
  }
  if (combined.includes("appliance") || combined.includes("refrigerator") || combined.includes("washing machine") || combined.includes("microwave")) {
    return "https://images.unsplash.com/photo-1571175432247-fe063c762567?auto=format&fit=crop&w=600&q=80";
  }
  if (combined.includes("ro") || combined.includes("purifier") || combined.includes("filter")) {
    return "https://images.unsplash.com/photo-1545173168-9f1947eebd01?auto=format&fit=crop&w=600&q=80";
  }

  return "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80";
}

function extractMongoId(val?: string | null): string {
  if (!val) return "";
  const matches = String(val).match(/[0-9a-fA-F]{24}/g);
  if (!matches || matches.length === 0) return "";
  // Return the last match because in composite IDs like `cat-sub-act-pkg`, pkg is the last segment
  return matches[matches.length - 1];
}

function getValidImageSource(src?: string, id?: string, name?: string, category?: string): string {
  const formatted = formatImageUrl(src);
  if (formatted) return formatted;
  const cleanId = extractMongoId(id);
  if (cleanId) return `/api/media/package/${cleanId}/image`;
  return getFallbackServiceImage(name, category);
}

export function CartPackageImage({
  src,
  name,
  pkgId,
  category,
  className = "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl",
}: CartPackageImageProps) {
  const [imgError, setImgError] = useState(false);
  const [attemptedFallback, setAttemptedFallback] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(() =>
    getValidImageSource(src, pkgId, name, category)
  );

  useEffect(() => {
    setImgError(false);
    setAttemptedFallback(false);
    setCurrentSrc(getValidImageSource(src, pkgId, name, category));
  }, [src, pkgId, name, category]);

  const initials = getNameInitials(name, "P");

  if (currentSrc && !imgError) {
    return (
      <img
        src={currentSrc}
        alt={name}
        referrerPolicy="no-referrer"
        className={`${className} object-cover shrink-0 border border-slate-200/80 dark:border-slate-800 shadow-xs`}
        onError={() => {
          const cleanId = extractMongoId(pkgId);
          const pkgEndpoint = cleanId ? `/api/media/package/${cleanId}/image` : "";
          const fallback = getFallbackServiceImage(name, category);

          // If currentSrc was not the package media endpoint, try the package media endpoint first
          if (pkgEndpoint && currentSrc !== pkgEndpoint && !attemptedFallback) {
            setCurrentSrc(pkgEndpoint);
          } else if (currentSrc !== fallback && !attemptedFallback) {
            // Next try the high quality category service image fallback
            setAttemptedFallback(true);
            setCurrentSrc(fallback);
          } else {
            // Finally show monogram if everything fails
            setImgError(true);
          }
        }}
      />
    );
  }

  return (
    <div className={`${className} bg-purple-50 dark:bg-purple-950/60 border border-purple-100/60 dark:border-purple-900/40 flex items-center justify-center shrink-0 shadow-xs text-accent-lux select-none`}>
      <span className="font-black text-base sm:text-lg uppercase tracking-tight">
        {initials}
      </span>
    </div>
  );
}

export default CartPackageImage;
