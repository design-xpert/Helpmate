"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Instagram, ShieldCheck } from "lucide-react";
import { fetchCustomerCategoriesApi } from "@/services/categoryApi";

interface FooterCategory {
  id: string;
  name: string;
  slug: string;
}

const FALLBACK_CATEGORIES: FooterCategory[] = [
  { id: "cleaning", name: "Deep Cleaning", slug: "cleaning" },
  { id: "ac", name: "AC Service & Repair", slug: "ac-repair-service" },
  { id: "electrician", name: "Electrician", slug: "electrician" },
  { id: "plumbing", name: "Plumber", slug: "plumber" },
  { id: "painting", name: "Wall Painting", slug: "wall-painting" },
  { id: "carpentry", name: "Carpenter", slug: "carpenter" },
  { id: "salon", name: "Salon & Hair", slug: "salon-hair" },
  { id: "appliances", name: "Appliance Repair", slug: "appliance-repair" },
];

export default function Footer() {
  const [categoriesList, setCategoriesList] = useState<FooterCategory[]>(FALLBACK_CATEGORIES);

  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const res = await fetchCustomerCategoriesApi();
        if (isMounted && res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: FooterCategory[] = res.data.slice(0, 8).map((cat: any) => ({
            id: cat._id || cat.id,
            name: cat.categoryName || cat.name,
            slug: (cat.categoryName || cat.name || "")
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, "-"),
          }));
          setCategoriesList(mapped);
        }
      } catch (err) {
        console.error("Error loading categories for footer:", err);
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer className="bg-primary-lux text-white dark:bg-slate-950 border-t border-white/5 py-16 px-6 font-sans mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Brand Column (Left) */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex flex-col gap-5 text-left">
          <Link href="/" className="flex items-center gap-2 self-start group">
            <div className="bg-white p-1.5 rounded-xl shadow-xs inline-flex items-center justify-center transition-transform group-hover:scale-105">
              <img src="/logo-white.png" alt="HelpMate Logo" className="h-9 sm:h-10 w-auto object-contain" />
            </div>
          </Link>
          <p className="text-[12px] text-slate-400 leading-relaxed max-w-sm">
            Connecting selective clients with Varanasi&apos;s most experienced, background-verified on-demand technicians and therapists. Guaranteed premium satisfaction.
          </p>
          <div className="flex items-center gap-2 text-[10px] text-success-lux font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" /> Fully Bonded &amp; Insured up to ₹10,000
          </div>
        </div>

        {/* Categories / Quick Links (Middle-Left, Maximum 8) */}
        <div className="col-span-1 sm:col-span-1 lg:col-span-3 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-5">
            Top Categories
          </h4>
          <ul className="space-y-2.5 text-[12px] text-slate-400">
            {categoriesList.slice(0, 8).map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/services/${cat.slug}?categoryId=${encodeURIComponent(cat.id)}`}
                  className="hover:text-white transition-colors block truncate"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal Column */}
        <div className="col-span-1 sm:col-span-1 lg:col-span-2 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-5">
            Legal
          </h4>
          <ul className="space-y-3 text-[12px] text-slate-400">
            <li>
              <Link href="/terms" className="hover:text-white transition-colors block">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white transition-colors block">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition-colors block">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact HelpMate (Right Side) */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-5">
            Contact HelpMate
          </h4>
          <ul className="space-y-3.5 text-[11px] text-slate-400">
            <li className="font-semibold text-white text-[12px] leading-tight">
              Helpmate Home Care Services Pvt. Ltd.
            </li>
            <li>
              <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider mb-0.5">
                Corporate Office
              </span>
              D-58/16C Shashtri Nagar Colony, Sigra, Varanasi, UP
            </li>
            <li>
              <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider mb-0.5">
                Phone Support
              </span>
              <a href="tel:+917705004040" className="hover:text-white transition-colors block font-bold text-white">
                +91 7705 004 040
              </a>
              <a href="tel:+9105422974740" className="hover:text-white transition-colors block text-[10px] mt-0.5">
                +91 0542 297 4740
              </a>
            </li>
            <li>
              <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider mb-0.5">
                Email Support
              </span>
              <a href="mailto:info@helpmate.net.in" className="hover:text-white transition-colors block font-bold text-white">
                info@helpmate.net.in
              </a>
            </li>
            <li className="pt-2 flex items-center gap-2">
              <a
                href="https://www.instagram.com/helpmate_varanasi/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram @helpmate_varanasi"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-pink-500/30 transition-all text-xs font-semibold group cursor-pointer"
              >
                <Instagram className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                <span>@helpmate_varanasi</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar: Copyright on left, Powered by kvtmedia on right */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        <p className="text-[11px] text-slate-400">
          © 2026 HelpMate Inc. All rights reserved. Designed for elite service standards.
        </p>
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <span>Powered by</span>
          <a
            href="https://kvtmedia.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-white hover:underline transition-colors"
          >
            kvtmedia
          </a>
        </div>
      </div>
    </footer>
  );
}
