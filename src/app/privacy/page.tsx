import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, ChevronRight, CheckCircle2, Eye, Server, Phone, Mail } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

export const metadata = {
  title: "Privacy Policy | HelpMate",
  description: "Learn how HelpMate collects, uses, encrypts, and protects your personal information and service records.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary-lux/10 via-primary-lux/5 to-transparent pt-12 pb-16 sm:pt-16 sm:pb-20 border-b border-border/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent-lux mb-4">
              <Link href="/" className="hover:underline">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Legal</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-foreground">Privacy Policy</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-lux/10 text-accent-lux text-xs font-bold uppercase tracking-wider mb-4">
              <Lock className="w-3.5 h-3.5" />
              Data Protection &amp; Privacy
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
              At HelpMate, your trust and privacy are paramount. This policy outlines how Helpmate Home Care Services Pvt. Ltd. collects, handles, and safeguards your personal information.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-muted-foreground font-medium pt-4 border-t border-border/40">
              <div>Effective Date: <span className="text-foreground font-bold">January 1, 2026</span></div>
              <div>Last Updated: <span className="text-foreground font-bold">October 2026</span></div>
              <div className="flex items-center gap-1.5 text-success-lux font-semibold">
                <ShieldCheck className="w-4 h-4" /> 256-Bit SSL Encryption Protected
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Table of Contents / Sidebar */}
            <aside className="lg:col-span-4 hidden lg:block">
              <div className="sticky top-28 p-5 rounded-2xl bg-card-lux border border-border/50 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Policy Sections
                </h3>
                <nav className="flex flex-col space-y-2 text-xs">
                  <a href="#intro" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    1. Introduction
                  </a>
                  <a href="#collection" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    2. Data We Collect
                  </a>
                  <a href="#usage" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    3. How We Use Data
                  </a>
                  <a href="#sharing" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    4. Data Sharing &amp; Partners
                  </a>
                  <a href="#security" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    5. Data Security Measures
                  </a>
                  <a href="#location" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    6. Location Information
                  </a>
                  <a href="#rights" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    7. Your Privacy Rights
                  </a>
                  <a href="#grievance" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    8. Grievance Officer
                  </a>
                </nav>

                <div className="pt-4 border-t border-border/50">
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    To request data access or deletion, please email{" "}
                    <a href="mailto:info@helpmate.net.in" className="text-accent-lux font-semibold hover:underline">
                      info@helpmate.net.in
                    </a>
                  </p>
                </div>
              </div>
            </aside>

            {/* Document Body */}
            <article className="lg:col-span-8 space-y-10 text-sm leading-relaxed text-muted-foreground">
              <section id="intro" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">1.</span> Introduction
                </h2>
                <p>
                  Helpmate Home Care Services Pvt. Ltd. (&ldquo;HelpMate&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) respects your privacy and is committed to protecting your personal data in accordance with the Information Technology Act, 2000 and applicable digital privacy regulations in India.
                </p>
                <p>
                  This Privacy Policy describes the practices regarding collection, storage, transfer, and utilization of personal information collected through our website, web application, and mobile interfaces.
                </p>
              </section>

              <section id="collection" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">2.</span> Information We Collect
                </h2>
                <p>To provide high-reliability on-demand home services, we collect the following categories of data:</p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li>
                    <strong>Identity &amp; Contact Information:</strong> Name, mobile telephone number, email address, and authentication OTP records.
                  </li>
                  <li>
                    <strong>Service Location Data:</strong> Residential/commercial service address, landmarks, postal code, and geocoordinates used exclusively to navigate assigned professionals to your location.
                  </li>
                  <li>
                    <strong>Transaction &amp; Order Details:</strong> Services booked, package addons, invoices, scheduled time slots, and payment confirmation statuses (Note: We do not store credit/debit card numbers or UPI PINs).
                  </li>
                  <li>
                    <strong>Device &amp; Usage Information:</strong> Browser type, operating system version, IP address, and platform usage metrics to ensure security and prevent fraudulent bookings.
                  </li>
                </ul>
              </section>

              <section id="usage" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">3.</span> How We Use Your Information
                </h2>
                <p>Your data is processed strictly for legitimate operational purposes:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-card-lux border border-border space-y-1">
                    <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                      <CheckCircle2 className="w-4 h-4 text-accent-lux" /> Service Fulfillment
                    </div>
                    <p className="text-xs text-muted-foreground">Assigning the closest verified technician and providing navigation instructions.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-card-lux border border-border space-y-1">
                    <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                      <CheckCircle2 className="w-4 h-4 text-accent-lux" /> Real-time Updates
                    </div>
                    <p className="text-xs text-muted-foreground">Sending SMS and WhatsApp alerts regarding technician arrival, ETA, and digital invoices.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-card-lux border border-border space-y-1">
                    <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                      <CheckCircle2 className="w-4 h-4 text-accent-lux" /> Quality Assurance
                    </div>
                    <p className="text-xs text-muted-foreground">Reviewing service ratings and investigating any service warranty or protection claims.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-card-lux border border-border space-y-1">
                    <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                      <CheckCircle2 className="w-4 h-4 text-accent-lux" /> Fraud Prevention
                    </div>
                    <p className="text-xs text-muted-foreground">Detecting bot activity, account hijacking, and abuse of promotional coupon codes.</p>
                  </div>
                </div>
              </section>

              <section id="sharing" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">4.</span> Data Sharing &amp; Verified Partners
                </h2>
                <p>
                  HelpMate never sells or rents your personal information to third-party advertisers. We share necessary contact details only with:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>Assigned Service Partners:</strong> The specific technician dispatched to your location receives your name, address, and phone number for job coordination.</li>
                  <li><strong>Payment Gateway Partners:</strong> RBI-licensed payment processors (such as Razorpay, Cashfree, or UPI partners) to securely authorize transactions.</li>
                  <li><strong>Law Enforcement &amp; Legal Authorities:</strong> Only when legally compelled by an official court order or statutory requirement under Indian law.</li>
                </ul>
              </section>

              <section id="security" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">5.</span> Data Security &amp; Encryption Standards
                </h2>
                <p>
                  We implement robust technical and organizational safeguards including end-to-end HTTPS encryption, role-based database access, and continuous monitoring against unauthorized intrusion.
                </p>
              </section>

              <section id="location" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">6.</span> Location Information
                </h2>
                <p>
                  When you grant location permissions in your browser or device, we access your device coordinates solely to auto-populate your booking address and ensure that technicians in your Varanasi locality (e.g., Sigra, Mahmoorganj, Assi, Lanka, Sarnath) are dispatched efficiently.
                </p>
              </section>

              <section id="rights" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">7.</span> Your Privacy Rights &amp; Preferences
                </h2>
                <p>
                  You may at any time view, rectify, or request deletion of your saved addresses and profile records by visiting the HelpMate Profile section or contacting customer support.
                </p>
              </section>

              <section id="grievance" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">8.</span> Grievance Officer &amp; Contact Details
                </h2>
                <p>
                  In accordance with the Information Technology Act, 2000 and rules made thereunder, the contact details of the Grievance Officer are provided below:
                </p>
                <div className="p-5 rounded-2xl bg-card-lux border border-border space-y-2">
                  <div className="font-bold text-foreground text-sm">Grievance Officer, HelpMate</div>
                  <div className="text-xs text-muted-foreground">Helpmate Home Care Services Pvt. Ltd.</div>
                  <div className="text-xs text-muted-foreground">D-58/16C Shashtri Nagar Colony, Sigra, Varanasi, UP – 221010</div>
                  <div className="text-xs text-muted-foreground pt-1 flex flex-wrap gap-4">
                    <span>Email: <a href="mailto:info@helpmate.net.in" className="text-accent-lux font-bold hover:underline">info@helpmate.net.in</a></span>
                    <span>Phone: <a href="tel:+917705004040" className="text-accent-lux font-bold hover:underline">+91 7705 004 040</a></span>
                  </div>
                </div>
              </section>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
