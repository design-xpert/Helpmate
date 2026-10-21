"use client";

import Header from "@/components/common/Header";
import PromoModal from "@/components/home/PromoModal";
import Hero from "@/components/home/Hero";
import PricingCalculator from "@/components/home/PricingCalculator";
import Categories from "@/components/home/Categories";
import InTheSpotlight from "@/components/home/InTheSpotlight";
import CategoryServiceSections from "@/components/home/CategoryServiceSections";
import Trending from "@/components/home/Trending";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import HowItWorks from "@/components/home/HowItWorks";
import Reviews from "@/components/home/Reviews";
import FaqSection from "@/components/home/FaqSection";
import Footer from "@/components/common/Footer";
import ServiceAreas from "@/components/home/ServiceAreas";
import CtaBanner from "@/components/home/CtaBanner";
import MembershipBanner from "@/components/membership/MembershipBanner";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";

export default function Home() {
  const router = useRouter();
  const { addToCart, cart } = useStore();

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#categories") {
      const scrollCategories = () => {
        const el = document.getElementById("categories");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      };
      scrollCategories();
      const timer = setTimeout(scrollCategories, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleBookFromCalculator = (data: {
    id: string;
    name: string;
    price: number;
    category: string;
    duration: number;
  }) => {
    const isAlreadyInCart = cart.some(
      (c) => String(c.id) === String(data.id) || String(c.itemId) === String(data.id)
    );

    if (!isAlreadyInCart) {
      addToCart(data);
    }

    router.push("/booking");
  };

  return (
    <>
      <PromoModal />
      <Header />
      
      <main 
        style={{ paddingTop: "var(--header-total-height, 7.5rem)" }}
        className="flex-1 pt-28 sm:pt-32"
      >
        {/* Hero Section */}
        <Hero />

        {/* Categories Grid */}
        <Categories />

        {/* In The Spotlight - Flagship Curated Experiences */}
        <InTheSpotlight />

        {/* Category-Wise Service Sections (Urban Company Style: Image & Title Only) */}
        <CategoryServiceSections />

        {/* Trending Packages */}
        <Trending />

        {/* Dynamic Pricing Calculator Widget */}
        {/* <PricingCalculator onBook={handleBookFromCalculator} /> */}

        {/* Vetting Vow (Why Choose Us) */}
        <WhyChooseUs />

        {/* Where We Serve (Varanasi active zones & sub-areas) */}
        <ServiceAreas />

        {/* Step Guide (How it works) */}
        <HowItWorks />

        {/* Reviews & Video Reviews Section */}
        <Reviews />

        {/* FAQs Section */}
        <FaqSection />

        {/* Membership Customer Benefits Promotional Section */}
        {/* <div className="max-w-7xl mx-auto px-6">
          <MembershipBanner variant="full" />
        </div> */}

        {/* CTA Download Banner */}
        <CtaBanner />
      </main>

      <Footer />
    </>
  );
}
