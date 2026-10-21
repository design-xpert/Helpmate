"use client";

import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { isTokenExpired, isAuthError, handleTokenExpiration } from "@/utils/token";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
      },
    },
  }));

  const theme = useStore((state) => state.theme);
  const token = useStore((state) => state.token);
  const fetchServerCart = useStore((state) => state.fetchServerCart);
  const fetchCustomerProfile = useStore((state) => state.fetchCustomerProfile);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dark / Light Theme Sync
  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, mounted]);

  // Global HTTP Fetch Interceptor for immediate logout on 401 / expired token
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);

      // Check if response indicates unauthenticated / token expired
      if (res.status === 401) {
        const currentToken = useStore.getState().token;
        if (currentToken) {
          handleTokenExpiration("Your session has expired. Please sign in again.");
        }
      } else if (res.status === 403) {
        try {
          const cloned = res.clone();
          cloned.json().then((data) => {
            if (data && isAuthError(403, data.message || data.error)) {
              const currentToken = useStore.getState().token;
              if (currentToken) {
                handleTokenExpiration(data.message || "Your session has expired. Please sign in again.");
              }
            }
          }).catch(() => {});
        } catch {
          // Ignore clone/read errors
        }
      }

      return res;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Proactive Token Expiration Monitor (Mount, Tab Focus, and 10s Timer)
  useEffect(() => {
    if (!mounted) return;

    const verifyTokenStatus = () => {
      const currentToken = useStore.getState().token;
      if (currentToken && isTokenExpired(currentToken)) {
        handleTokenExpiration("Your session has expired. Please sign in again.");
      }
    };

    verifyTokenStatus();

    const onFocus = () => verifyTokenStatus();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        verifyTokenStatus();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const interval = setInterval(verifyTokenStatus, 10000);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(interval);
    };
  }, [mounted]);

  // Validate server-side session and cart on startup if token exists
  useEffect(() => {
    if (mounted && token) {
      if (isTokenExpired(token)) {
        handleTokenExpiration("Your session has expired. Please sign in again.");
      } else {
        fetchServerCart();
        fetchCustomerProfile();
      }
    }
  }, [mounted, token, fetchServerCart, fetchCustomerProfile]);

  // Prevent flash during hydration
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
