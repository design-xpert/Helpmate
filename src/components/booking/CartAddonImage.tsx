"use client";

import { useState, useEffect } from "react";
import { formatImageUrl, getNameInitials } from "@/utils/image";

interface CartAddonImageProps {
  src?: string;
  name: string;
  addonId?: string;
  className?: string;
}

function extractMongoId(val?: string | null): string {
  if (!val) return "";
  const matches = String(val).match(/[0-9a-fA-F]{24}/g);
  if (!matches || matches.length === 0) return "";
  return matches[matches.length - 1];
}

function getValidAddonSource(src?: string, id?: string): string {
  const formatted = formatImageUrl(src);
  if (formatted) return formatted;
  const cleanId = extractMongoId(id);
  if (cleanId) return `/api/media/addon/${cleanId}/image`;
  return "";
}

export function CartAddonImage({
  src,
  name,
  addonId,
  className = "w-12 h-12 rounded-xl",
}: CartAddonImageProps) {
  const [imgError, setImgError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(() =>
    getValidAddonSource(src, addonId)
  );

  useEffect(() => {
    setImgError(false);
    setCurrentSrc(getValidAddonSource(src, addonId));
  }, [src, addonId]);

  const initials = getNameInitials(name, "A");

  if (currentSrc && !imgError) {
    return (
      <img
        src={currentSrc}
        alt={name}
        referrerPolicy="no-referrer"
        className={`${className} object-cover shrink-0 border border-slate-200/80 dark:border-slate-800 shadow-xs bg-slate-100 dark:bg-slate-900`}
        onError={() => {
          const cleanId = extractMongoId(addonId);
          const fallback = cleanId ? `/api/media/addon/${cleanId}/image` : "";
          if (fallback && currentSrc !== fallback) {
            setCurrentSrc(fallback);
          } else {
            setImgError(true);
          }
        }}
      />
    );
  }

  return (
    <div
      className={`${className} bg-purple-50 dark:bg-purple-950/60 border border-purple-100/60 dark:border-purple-900/40 flex flex-col items-center justify-center shrink-0 shadow-xs text-accent-lux select-none`}
      title={name}
    >
      <span className="font-extrabold text-xs uppercase tracking-tight">
        {initials}
      </span>
    </div>
  );
}

export default CartAddonImage;
