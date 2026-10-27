"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { loginCustomerApi, sendCustomerLoginOtpApi } from "@/services/authApi";
import { toast } from "@/components/common/Toast";
import {
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Phone,
  Lock,
  ArrowRight,
  UserPlus,
  KeyRound,
  RotateCcw,
  Edit2,
  ShieldCheck,
} from "lucide-react";
import confetti from "canvas-confetti";

type LoginMode = "otp" | "password";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryRedirect = searchParams.get("redirect");
  const queryMobile = searchParams.get("mobile");
  const queryMode = searchParams.get("mode");

  const [redirectPath, setRedirectPath] = useState<string>("/");
  const { setAuth } = useStore();

  // Mode: "otp" | "password"
  const [loginMode, setLoginMode] = useState<LoginMode>(
    queryMode === "password" ? "password" : "otp"
  );

  // Common Phone State
  const [phone, setPhone] = useState(
    queryMobile ? queryMobile.replace(/\D/g, "").slice(0, 10) : ""
  );

  // Password Login State
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login State
  const [otpSent, setOtpSent] = useState(false);
  const [otpTargetMobile, setOtpTargetMobile] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Feedback & Loading States
  const [loginError, setLoginError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isNotRegistered, setIsNotRegistered] = useState(false);

  useEffect(() => {
    if (queryMobile) {
      setPhone(queryMobile.replace(/\D/g, "").slice(0, 10));
    }
  }, [queryMobile]);

  useEffect(() => {
    if (queryMode === "password" || queryMode === "otp") {
      setLoginMode(queryMode);
    }
  }, [queryMode]);

  useEffect(() => {
    // 1. Direct query parameter in URL (highest priority)
    if (queryRedirect && queryRedirect !== "/login" && queryRedirect !== "/register") {
      setRedirectPath(queryRedirect);
      try {
        sessionStorage.setItem("helpmate_redirect", queryRedirect);
      } catch {}
      return;
    }

    // 2. Check sessionStorage fallback
    try {
      const stored = sessionStorage.getItem("helpmate_redirect");
      if (stored && stored !== "/login" && stored !== "/register") {
        setRedirectPath(stored);
        return;
      }
    } catch {}

    // 3. Check document.referrer (browser previous page)
    if (typeof window !== "undefined" && document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.host === window.location.host) {
          const pathWithSearch = refUrl.pathname + refUrl.search;
          if (refUrl.pathname !== "/login" && refUrl.pathname !== "/register") {
            setRedirectPath(pathWithSearch);
            try {
              sessionStorage.setItem("helpmate_redirect", pathWithSearch);
            } catch {}
          }
        }
      } catch {}
    }
  }, [queryRedirect]);

  // Resend Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, resendTimer]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#801C6E", "#48073d", "#A21CAF", "#E879F9"],
      });
    } catch {}
  };

  const handleModeSwitch = (mode: LoginMode) => {
    setLoginMode(mode);
    setLoginError("");
    setSuccessMsg("");
    setIsNotRegistered(false);
    // Reset OTP stage if switching to password
    if (mode === "password") {
      setOtpSent(false);
      setOtpValues(["", "", "", "", "", ""]);
    }
  };

  // ===================== OTP LOGIN HANDLERS =====================

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError("");
    setSuccessMsg("");
    setIsNotRegistered(false);

    const cleanedPhone = phone.trim().replace(/\D/g, "");
    if (!cleanedPhone || cleanedPhone.length !== 10) {
      const err = "Please enter a valid 10-digit mobile number";
      setLoginError(err);
      toast.error("Invalid Mobile Number", err);
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      const err = "Please enter a valid Indian mobile number starting with 6, 7, 8, or 9";
      setLoginError(err);
      toast.error("Invalid Mobile Number", err);
      return;
    }

    setIsSendingOtp(true);

    try {
      const res = await sendCustomerLoginOtpApi({ mobile: cleanedPhone });

      if (res.success) {
        toast.success("OTP Sent Successfully", `6-digit login code sent to +91 ${cleanedPhone}`);
        setSuccessMsg(`Verification code sent to +91 ${cleanedPhone}`);
        setOtpSent(true);
        setOtpTargetMobile(cleanedPhone);
        setResendTimer(60);
        setCanResend(false);
        setOtpValues(["", "", "", "", "", ""]);

        // Auto-focus first digit
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 200);
      } else {
        const err = res.message || "Failed to send login OTP. Please try again.";
        setLoginError(err);
        if (
          err.toLowerCase().includes("not found") ||
          err.toLowerCase().includes("does not exist") ||
          err.toLowerCase().includes("not registered")
        ) {
          setIsNotRegistered(true);
        }
        toast.error("Sign In Failed", err);
      }
    } catch (err: any) {
      const msg = err?.message || "Connection error. Please check your network and try again.";
      setLoginError(msg);
      toast.error("Connection Error", msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend && resendTimer > 0) return;
    setLoginError("");
    setSuccessMsg("");
    setIsSendingOtp(true);

    const target = otpTargetMobile || phone.trim().replace(/\D/g, "");

    try {
      const res = await sendCustomerLoginOtpApi({ mobile: target });

      if (res.success) {
        toast.success("OTP Resent", `New verification code sent to +91 ${target}`);
        setSuccessMsg(`New verification code sent to +91 ${target}`);
        setResendTimer(60);
        setCanResend(false);
        setOtpValues(["", "", "", "", "", ""]);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 150);
      } else {
        const err = res.message || "Failed to resend OTP. Please try again.";
        setLoginError(err);
        toast.error("Resend Failed", err);
      }
    } catch (err: any) {
      const msg = "Network error. Unable to resend OTP.";
      setLoginError(msg);
      toast.error("Connection Error", msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const numericVal = value.replace(/\D/g, "");

    // Handle full paste of 6 digits
    if (numericVal.length >= 6) {
      const pastedDigits = numericVal.slice(0, 6).split("");
      const newOtp = [...otpValues];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedDigits[i] || "";
      }
      setOtpValues(newOtp);
      otpInputRefs.current[5]?.focus();
      return;
    }

    const singleDigit = numericVal.slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = singleDigit;
    setOtpValues(newOtp);
    setLoginError("");

    // Auto-advance to next input if digit entered
    if (singleDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setSuccessMsg("");

    const otpCode = otpValues.join("");
    if (otpCode.length !== 6) {
      const err = "Please enter the complete 6-digit verification code";
      setLoginError(err);
      toast.error("Incomplete Code", err);
      return;
    }

    const targetMobile = otpTargetMobile || phone.trim().replace(/\D/g, "");

    setIsLoading(true);

    try {
      const res = await loginCustomerApi({
        mobile: targetMobile,
        otp: otpCode,
      });

      if (res.success && res.data) {
        triggerConfetti();
        setSuccessMsg("Signed in successfully! Welcome back.");
        toast.success("Welcome Back!", "Signed in with OTP successfully.");

        await setAuth({
          token: res.data.token,
          customer: res.data.customer,
        });

        try {
          sessionStorage.removeItem("helpmate_redirect");
        } catch {}

        setTimeout(() => {
          router.push(redirectPath || "/");
        }, 500);
      } else {
        const err = res.message || "Invalid or expired login OTP. Please try again.";
        setLoginError(err);
        toast.error("Sign In Failed", err);
      }
    } catch (err: any) {
      const msg = err?.message || "An unexpected error occurred. Please check network connection.";
      setLoginError(msg);
      toast.error("Connection Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== PASSWORD LOGIN HANDLERS =====================

  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setSuccessMsg("");
    setIsNotRegistered(false);

    const cleanedPhone = phone.trim().replace(/\D/g, "");
    if (!cleanedPhone || cleanedPhone.length !== 10) {
      const err = "Please enter a valid 10-digit mobile number";
      setLoginError(err);
      toast.error("Invalid Mobile Number", err);
      return;
    }

    if (!password) {
      const err = "Please enter your password";
      setLoginError(err);
      toast.error("Password Required", err);
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginCustomerApi({
        mobile: cleanedPhone,
        password: password,
      });

      if (res.success && res.data) {
        triggerConfetti();
        setSuccessMsg("Login successful! Welcome back.");
        toast.success("Welcome Back!", "Signed in successfully.");

        await setAuth({
          token: res.data.token,
          customer: res.data.customer,
        });

        try {
          sessionStorage.removeItem("helpmate_redirect");
        } catch {}

        setTimeout(() => {
          router.push(redirectPath || "/");
        }, 500);
      } else {
        const err = res.message || "Invalid mobile number or password.";
        setLoginError(err);
        if (
          err.toLowerCase().includes("not found") ||
          err.toLowerCase().includes("does not exist") ||
          err.toLowerCase().includes("not registered")
        ) {
          setIsNotRegistered(true);
        }
        toast.error("Sign In Failed", err);
      }
    } catch (err: any) {
      const message = err?.message || "An unexpected error occurred. Please check network connection.";
      setLoginError(message);
      toast.error("Connection Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  const registerLink =
    redirectPath && redirectPath !== "/"
      ? `/register?redirect=${encodeURIComponent(redirectPath)}${phone ? `&mobile=${encodeURIComponent(phone)}` : ""}`
      : `/register${phone ? `?mobile=${encodeURIComponent(phone)}` : ""}`;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-900 px-4 sm:px-6 font-sans relative overflow-hidden py-10 sm:py-14">
      {/* Soft background ambient gradient circles */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-purple-100/60 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-200/40 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md bg-white border border-slate-200 p-5 sm:p-9 rounded-3xl sm:rounded-[32px] text-left shadow-xl shadow-slate-200/60 relative z-10 space-y-6"
      >
        {/* Header / Logo */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <img
              src="/logo-white.png"
              alt="HelpMate Logo"
              className="h-11 sm:h-12 w-auto object-contain mx-auto mb-1 cursor-pointer hover:opacity-90 transition-opacity"
            />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Sign In to HelpMate
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Welcome back! Choose your preferred method to sign in.
          </p>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div className="p-1 rounded-2xl bg-slate-100 border border-slate-200/70 grid grid-cols-2 gap-1 relative select-none">
          <button
            type="button"
            onClick={() => handleModeSwitch("otp")}
            className={`relative py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer z-10 ${
              loginMode === "otp"
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {loginMode === "otp" && (
              <motion.div
                layoutId="activeLoginTab"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/60"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-accent-lux" />
              <span>OTP Login</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleModeSwitch("password")}
            className={`relative py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer z-10 ${
              loginMode === "password"
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {loginMode === "password" && (
              <motion.div
                layoutId="activeLoginTab"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/60"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-accent-lux" />
              <span>Password</span>
            </span>
          </button>
        </div>

        {/* Error Alert */}
        {loginError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold space-y-1.5"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
            {isNotRegistered && (
              <div className="pl-6 pt-1">
                <Link
                  href={registerLink}
                  className="inline-flex items-center gap-1 font-bold text-accent-lux hover:underline text-[11px]"
                >
                  <span>Create an account with this number</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {/* ======================= TAB 1: LOGIN WITH OTP ======================= */}
        {loginMode === "otp" && (
          <div className="space-y-4">
            {!otpSent ? (
              // Step 1: Mobile Input -> Request OTP
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Mobile Number
                    </label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-500 flex items-center gap-1 select-none">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> +91
                    </span>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                        setLoginError("");
                        setIsNotRegistered(false);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-16 pr-4 text-xs font-bold tracking-wider focus:outline-none focus:border-accent-lux focus:bg-white text-slate-900 transition-all placeholder:text-slate-400 font-sans"
                      required
                      disabled={isSendingOtp}
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    We will send a 6-digit verification code to this mobile number via SMS.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSendingOtp || phone.replace(/\D/g, "").length !== 10}
                  className="w-full bg-accent-lux hover:bg-accent-lux/95 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg shadow-accent-lux/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Login Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Get Login OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              // Step 2: 6-Digit OTP Verification Screen
              <form onSubmit={handleVerifyOtpLogin} className="space-y-4">
                {/* Active Phone Confirmation Pill */}
                <div className="p-3 rounded-2xl bg-slate-100/80 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-accent-lux/10 text-accent-lux flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">
                        Sending Code To
                      </span>
                      <span className="text-xs font-black text-slate-900 tracking-wider">
                        +91 {otpTargetMobile || phone}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpValues(["", "", "", "", "", ""]);
                      setLoginError("");
                      setSuccessMsg("");
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-lux hover:underline px-2 py-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Change</span>
                  </button>
                </div>

                {/* 6 Digit Inputs */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">
                    Enter 6-Digit Verification Code
                  </label>
                  <div className="flex items-center justify-between gap-1 xs:gap-1.5 sm:gap-2">
                    {otpValues.map((val, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={val}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        disabled={isLoading}
                        className={`w-9.5 xs:w-11 sm:w-12 h-11 xs:h-12 sm:h-13 text-center text-sm xs:text-base sm:text-lg font-black rounded-xl sm:rounded-2xl border transition-all focus:outline-none ${
                          val
                            ? "bg-white border-accent-lux text-slate-900 shadow-sm ring-2 ring-accent-lux/20"
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-accent-lux focus:bg-white"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Resend Timer & Action */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 text-[11px]">
                    Didn&apos;t receive code?
                  </span>
                  {canResend || resendTimer <= 0 ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isSendingOtp}
                      className="font-bold text-accent-lux hover:underline inline-flex items-center gap-1 cursor-pointer text-[11px]"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Resend OTP</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
                      Resend in <strong className="text-slate-600 font-bold">{resendTimer}s</strong>
                    </span>
                  )}
                </div>

                {/* Verify Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || otpValues.join("").length !== 6}
                  className="w-full bg-accent-lux hover:bg-accent-lux/95 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg shadow-accent-lux/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying & Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Switch Helper */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleModeSwitch("password")}
                className="text-xs text-slate-500 hover:text-accent-lux font-semibold transition-colors cursor-pointer"
              >
                Prefer password? <span className="font-bold text-accent-lux underline">Sign in with password</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: LOGIN WITH PASSWORD ======================= */}
        {loginMode === "password" && (
          <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
            {/* Mobile Field */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-500 flex items-center gap-1 select-none">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> +91
                </span>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setLoginError("");
                    setIsNotRegistered(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-16 pr-4 text-xs font-bold tracking-wider focus:outline-none focus:border-accent-lux focus:bg-white text-slate-900 transition-all placeholder:text-slate-400 font-sans"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Password
                </label>
                <Link
                  href={
                    redirectPath && redirectPath !== "/"
                      ? `/forgot-password?redirect=${encodeURIComponent(redirectPath)}`
                      : "/forgot-password"
                  }
                  className="text-[11px] font-bold text-accent-lux hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError("");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-11 text-xs font-medium focus:outline-none focus:border-accent-lux focus:bg-white text-slate-900 transition-all placeholder:text-slate-400"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || phone.replace(/\D/g, "").length !== 10 || !password}
              className="w-full bg-accent-lux hover:bg-accent-lux/95 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg shadow-accent-lux/20 transition-all cursor-pointer mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In with Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch Helper */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleModeSwitch("otp")}
                className="text-xs text-slate-500 hover:text-accent-lux font-semibold transition-colors cursor-pointer"
              >
                Forgot your password? <span className="font-bold text-accent-lux underline">Sign in with OTP</span>
              </button>
            </div>
          </form>
        )}

        {/* Register Button Link */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-3">
          <Link
            href={registerLink}
            className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:border-accent-lux bg-slate-50 hover:bg-white text-slate-700 hover:text-accent-lux font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-accent-lux" />
            <span>New to HelpMate? Create an Account</span>
          </Link>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-bit Encrypted &amp; Verified Login</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center font-sans">
          Loading authentication page...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
