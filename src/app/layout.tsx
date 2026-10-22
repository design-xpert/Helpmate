import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import Providers from "@/components/common/Providers";
import CursorGlow from "@/components/common/CursorGlow";
import FloatingHelp from "@/components/common/FloatingHelp";
import ScrollToTop from "@/components/common/ScrollToTop";

import NextTopLoader from "nextjs-toploader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HelpMate | Premium On-Demand Services",
  description: "Experience ultra-premium home services on-demand. Book verified professionals, transparent pricing, and instant tracking in 30 seconds. Inspired by Apple & Airbnb.",
  keywords: ["home service", "AC repair", "luxury cleaning", "electrician", "plumber", "premium salon", "painting"],
  openGraph: {
    title: "HelpMate | Premium On-Demand Services",
    description: "Experience ultra-premium home services on-demand. Book verified professionals, transparent pricing, and instant tracking in 30 seconds.",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { Suspense } from "react";
import GlobalTopLoader from "@/components/common/GlobalTopLoader";

import ToastContainer from "@/components/common/ToastContainer";

import PromoModal from "@/components/home/PromoModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col selection:bg-accent-lux selection:text-white">
        <NextTopLoader
          color="#48073d"
          initialPosition={0.1}
          crawlSpeed={200}
          height={3.5}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={250}
          shadow="0 0 12px #48073d,0 0 6px #e0b168"
        />
        <Suspense fallback={null}>
          <GlobalTopLoader />
        </Suspense>
        <Providers>
          <CursorGlow />
          <PromoModal />
          {children}
          {/* <FloatingHelp /> */}
          <ScrollToTop />
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
