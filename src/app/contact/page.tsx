"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Instagram,
  Send,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Headphones,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "AC Service & Repair",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate inquiry submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({
        name: "",
        phone: "",
        email: "",
        service: "AC Service & Repair",
        message: "",
      });
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary-lux/10 via-primary-lux/5 to-transparent pt-12 pb-16 sm:pt-16 sm:pb-20 border-b border-border/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent-lux mb-4">
              <Link href="/" className="hover:underline">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Support &amp; Legal</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-foreground">Contact Us</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-lux/10 text-accent-lux text-xs font-bold uppercase tracking-wider mb-4">
              <Headphones className="w-3.5 h-3.5" />
              Varanasi Headquarters Support
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground mb-4">
              Contact HelpMate
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Have a question about our verified technician services, require an urgent home repair, or want to discuss enterprise facilities? We are here to help.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-muted-foreground font-medium pt-4 border-t border-border/40">
              <div className="flex items-center gap-1.5 text-success-lux font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Dispatch Desk: Active
              </div>
              <div>Response Time: <span className="text-foreground font-bold">Within 15 minutes</span></div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-accent-lux" /> Guaranteed Service Excellence
              </div>
            </div>
          </div>
        </section>

        {/* Contact Info Cards & Form */}
        <section className="py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Direct Info Cards */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  Reach Our Support Desk
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Connect with our dedicated customer care team in Varanasi directly via phone, email, or office visit.
                </p>
              </div>

              {/* Corporate Office Card */}
              <div className="p-5 rounded-2xl bg-card-lux border border-border hover:border-accent-lux/40 transition-all shadow-xs flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary-lux/10 text-accent-lux shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Corporate Office</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Helpmate Home Care Services Pvt. Ltd.<br />
                    D-58/16C Shashtri Nagar Colony, Sigra, Varanasi, Uttar Pradesh – 221010
                  </p>
                  <a
                    href="https://maps.google.com/?q=Sigra+Varanasi+Uttar+Pradesh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-lux hover:underline mt-2.5"
                  >
                    View on Google Maps <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Phone Line Card */}
              <div className="p-5 rounded-2xl bg-card-lux border border-border hover:border-accent-lux/40 transition-all shadow-xs flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary-lux/10 text-accent-lux shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Direct Telephones</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Instant technician dispatch &amp; customer care:
                  </p>
                  <div className="mt-2 space-y-1">
                    <a
                      href="tel:+917705004040"
                      className="text-xs font-black text-foreground hover:text-accent-lux transition-colors block"
                    >
                      +91 7705 004 040 (Primary Hotline)
                    </a>
                    <a
                      href="tel:+9105422974740"
                      className="text-xs font-semibold text-muted-foreground hover:text-accent-lux transition-colors block"
                    >
                      +91 0542 297 4740 (Office Landline)
                    </a>
                  </div>
                </div>
              </div>

              {/* Email Support Card */}
              <div className="p-5 rounded-2xl bg-card-lux border border-border hover:border-accent-lux/40 transition-all shadow-xs flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary-lux/10 text-accent-lux shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Email Support</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    For billing, business tie-ups, and service queries:
                  </p>
                  <a
                    href="mailto:info@helpmate.net.in"
                    className="text-xs font-black text-accent-lux hover:underline mt-2 block"
                  >
                    info@helpmate.net.in
                  </a>
                </div>
              </div>

              {/* Working Hours & Instagram */}
              <div className="p-5 rounded-2xl bg-card-lux border border-border flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary-lux/10 text-accent-lux shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-foreground">Operational Hours</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Monday – Sunday: <strong className="text-foreground">8:00 AM – 9:00 PM</strong>
                  </p>
                  <div className="pt-3 mt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Follow updates on social:</span>
                    <a
                      href="https://www.instagram.com/helpmate_varanasi/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold text-xs hover:bg-pink-500/20 transition-all"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      @helpmate_varanasi
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Inquiry Form */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-3xl bg-card-lux border border-border shadow-xs space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-lux mb-2">
                    <MessageSquare className="w-3.5 h-3.5" /> Quick Inquiry
                  </div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">
                    Send Us a Message
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Leave your contact details and our service coordinator will call you back shortly.
                  </p>
                </div>

                {submitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">Message Dispatched Successfully!</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      Thank you for reaching out to HelpMate. Our Varanasi dispatch manager has received your note and will contact you via phone or email within 15–30 minutes.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-2 px-4 py-2 rounded-xl bg-primary-lux text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Ramesh Tripathi"
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-hidden focus:border-accent-lux transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">
                          Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-hidden focus:border-accent-lux transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="name@example.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-hidden focus:border-accent-lux transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">
                          Service Needed
                        </label>
                        <select
                          value={formData.service}
                          onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-hidden focus:border-accent-lux transition-colors"
                        >
                          <option>AC Service &amp; Repair</option>
                          <option>Deep Cleaning</option>
                          <option>Electrician</option>
                          <option>Plumbing Solutions</option>
                          <option>Wall Painting &amp; Waterproofing</option>
                          <option>Appliance Repair</option>
                          <option>Carpenter Services</option>
                          <option>Corporate / Bulk Inquiry</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">
                        How can we help you? <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell us about the issue, your locality in Varanasi (e.g. Sigra, Lanka, Mahmoorganj), and preferred time..."
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-hidden focus:border-accent-lux transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-6 rounded-xl bg-primary-lux text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending Message...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Inquiry
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-center text-muted-foreground pt-1">
                      By submitting, you agree to our{" "}
                      <Link href="/terms" className="text-accent-lux font-semibold hover:underline">
                        Terms &amp; Conditions
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-accent-lux font-semibold hover:underline">
                        Privacy Policy
                      </Link>.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
