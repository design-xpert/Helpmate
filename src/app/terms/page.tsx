import React from "react";
import Link from "next/link";
import { ShieldCheck, FileText, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

export const metadata = {
  title: "Terms & Conditions | HelpMate",
  description: "Read the HelpMate terms of service, customer commitments, service agreements, and cancellation policies.",
};

export default function TermsPage() {
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
              <span className="text-foreground">Terms &amp; Conditions</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-lux/10 text-accent-lux text-xs font-bold uppercase tracking-wider mb-4">
              <FileText className="w-3.5 h-3.5" />
              Legal Agreement
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground mb-4">
              Terms &amp; Conditions
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Please review these Terms and Conditions carefully before booking or utilizing any services provided by HelpMate Home Care Services Pvt. Ltd.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-muted-foreground font-medium pt-4 border-t border-border/40">
              <div>Effective Date: <span className="text-foreground font-bold">January 1, 2026</span></div>
              <div>Last Updated: <span className="text-foreground font-bold">October 2026</span></div>
              <div className="flex items-center gap-1.5 text-success-lux font-semibold">
                <ShieldCheck className="w-4 h-4" /> ₹10,000 Damage Protection Covered
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
                  Quick Navigation
                </h3>
                <nav className="flex flex-col space-y-2 text-xs">
                  <a href="#acceptance" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    1. Acceptance of Terms
                  </a>
                  <a href="#eligibility" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    2. Eligibility &amp; Account
                  </a>
                  <a href="#services" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    3. Booking &amp; Fulfillment
                  </a>
                  <a href="#pricing" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    4. Pricing &amp; Payments
                  </a>
                  <a href="#cancellation" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    5. Cancellation &amp; Refunds
                  </a>
                  <a href="#guarantee" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    6. ₹10,000 Safety Guarantee
                  </a>
                  <a href="#conduct" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    7. User Responsibilities
                  </a>
                  <a href="#liability" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    8. Limitation of Liability
                  </a>
                  <a href="#jurisdiction" className="text-muted-foreground hover:text-accent-lux transition-colors py-1">
                    9. Governing Law &amp; Jurisdiction
                  </a>
                </nav>

                <div className="pt-4 border-t border-border/50">
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Have questions regarding our terms? Contact our compliance desk at{" "}
                    <a href="mailto:info@helpmate.net.in" className="text-accent-lux font-semibold hover:underline">
                      info@helpmate.net.in
                    </a>
                  </p>
                </div>
              </div>
            </aside>

            {/* Document Body */}
            <article className="lg:col-span-8 space-y-10 text-sm leading-relaxed text-muted-foreground">
              <section id="acceptance" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">1.</span> Acceptance of Terms
                </h2>
                <p>
                  These Terms and Conditions (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (whether individually or on behalf of an entity) and <strong>Helpmate Home Care Services Pvt. Ltd.</strong> (&ldquo;HelpMate&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), governing your access to and use of our website, mobile interface, and on-demand home service marketplace.
                </p>
                <p>
                  By accessing our platform, booking a service, or placing an order, you acknowledge that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy.
                </p>
              </section>

              <section id="eligibility" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">2.</span> Eligibility &amp; Account
                </h2>
                <p>
                  You must be at least 18 years of age to book services through HelpMate. When creating an account or providing booking information, you represent that all details submitted (including contact telephone numbers and service premises address) are accurate, complete, and up to date.
                </p>
                <p>
                  You are solely responsible for maintaining the confidentiality of your authentication credentials and OTP tokens.
                </p>
              </section>

              <section id="services" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">3.</span> Booking &amp; Fulfillment
                </h2>
                <p>
                  HelpMate connects discerning clients with verified, trained independent service professionals and internal service teams. While HelpMate endeavors to ensure prompt arrival within requested time slots, service times are estimates and may occasionally vary due to traffic, weather conditions, or unforeseen complexities at prior job sites.
                </p>
                <div className="p-4 rounded-xl bg-primary-lux/5 border border-primary-lux/10 space-y-2">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-success-lux" /> Verified Personnel
                  </div>
                  <p className="text-xs">
                    All technicians assigned through HelpMate undergo background verification and skill assessments before deployment to customer premises.
                  </p>
                </div>
              </section>

              <section id="pricing" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">4.</span> Pricing, Taxes &amp; Payments
                </h2>
                <p>
                  All prices listed on the HelpMate platform are in Indian Rupees (₹) and are inclusive of standard diagnostic fees unless otherwise stated. Final prices for custom repairs, replacement spare parts, or additional requested scopes will be communicated prior to execution.
                </p>
                <p>
                  Payments may be completed securely online via UPI, debit/credit cards, net banking, or via authorized Cash on Delivery (COD) / Pay After Service options.
                </p>
              </section>

              <section id="cancellation" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">5.</span> Cancellation &amp; Refund Policy
                </h2>
                <p>
                  We understand schedules can change. You can cancel or reschedule any scheduled booking without penalty up to 2 hours before the technician&apos;s scheduled arrival window.
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>Free Cancellation:</strong> Up to 2 hours prior to scheduled appointment.</li>
                  <li><strong>Late Cancellation:</strong> Cancellations made once a technician is en route or on-site may incur a minimal standard visiting fee of ₹149 to compensate the service professional.</li>
                  <li><strong>Refunds:</strong> Pre-paid bookings cancelled in accordance with our policy will be refunded to the original payment method within 5–7 business days.</li>
                </ul>
              </section>

              <section id="guarantee" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">6.</span> ₹10,000 Safety &amp; Damage Protection Guarantee
                </h2>
                <p>
                  We stand by the quality of our craftsmanship. For eligible completed services booked directly through HelpMate, we provide coverage up to ₹10,000 against accidental property damage directly resulting from the technician&apos;s actions during service execution.
                </p>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Important Condition:
                  </div>
                  Claims under the ₹10,000 guarantee must be reported within 24 hours of service completion with supporting photographs/invoices through our official support hotline or email.
                </div>
              </section>

              <section id="conduct" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">7.</span> Customer Responsibilities &amp; Premises Safety
                </h2>
                <p>
                  Customers are expected to provide a safe, respectful working environment for our service personnel. Ensure water, electricity, and necessary access to the work area are available at the booked appointment time.
                </p>
              </section>

              <section id="liability" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">8.</span> Limitation of Liability
                </h2>
                <p>
                  To the maximum extent permitted by applicable Indian law, HelpMate shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from platform downtime or third-party acts outside reasonable control.
                </p>
              </section>

              <section id="jurisdiction" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent-lux">9.</span> Governing Law &amp; Jurisdiction
                </h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any legal dispute, controversy, or claim arising out of these Terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Varanasi, Uttar Pradesh, India</strong>.
                </p>
              </section>

              {/* Help & Contact Footer Box */}
              <div className="pt-8 mt-12 border-t border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card-lux border border-border">
                <div>
                  <h4 className="font-bold text-foreground text-sm">Need help or further clarification?</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Our support line is open 7 days a week from 8:00 AM to 9:00 PM.</p>
                </div>
                <Link
                  href="/contact"
                  className="px-5 py-2.5 rounded-xl bg-primary-lux text-white text-xs font-bold hover:opacity-90 transition-all shrink-0"
                >
                  Contact Support
                </Link>
              </div>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
