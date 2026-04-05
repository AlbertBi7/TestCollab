"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, Home, ShieldCheck } from "lucide-react";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setStatusMessage("");
    setStatusError("");

    if (!email) {
      setStatusError("Missing email. Please return to signup and try again.");
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setStatusError(error.message || "Could not resend verification email.");
        return;
      }

      setStatusMessage("Verification email resent. Check your inbox and spam folder.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F2F2F0] flex flex-col items-center justify-center p-6 text-stone-900 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute -top-24 -left-16 h-80 w-80 rounded-full bg-lime-200/40 blur-3xl"></div>
      <div className="pointer-events-none absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-emerald-100/50 blur-3xl"></div>
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-white/40 blur-2xl"></div>

      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-stone-200/70 p-8 sm:p-12 rounded-[40px] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] text-center animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
        <div className="w-20 h-20 bg-lime-100 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-inner">
          <Mail className="w-10 h-10 text-lime-600" />
        </div>

        <h1 className="text-3xl font-bold mb-4 tracking-tight">Verify your email.</h1>
        <p className="text-stone-500 mb-8 leading-relaxed">
          We've sent a verification link to <span className="text-stone-900 font-semibold">{email || "your email"}</span>. Please click the link in the email to activate your account.
        </p>

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || !email}
            className="w-full h-14 bg-white border border-stone-200 text-stone-800 rounded-2xl font-semibold flex items-center justify-center hover:bg-stone-50 transition-all disabled:opacity-60"
          >
            {isResending ? "Resending..." : "Resend verification email"}
          </button>

          <Link
            href="/login"
            className="w-full h-14 bg-stone-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-stone-200"
          >
            Back to Login
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/"
            className="w-full h-14 bg-white border border-stone-200 text-stone-600 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-stone-50 transition-all"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>

        {statusMessage && (
          <p className="mt-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl p-3">{statusMessage}</p>
        )}

        {statusError && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{statusError}</p>
        )}

        <div className="mt-10 pt-8 border-t border-stone-100 flex items-center justify-center gap-2 text-stone-400">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-widest">Secure Authentication</span>
        </div>
      </div>
      
      <p className="mt-8 text-stone-400 text-sm font-medium animate-pulse">
        Check your spam folder if you don't see it.
      </p>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen w-full bg-[#F2F2F0] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
        </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}
