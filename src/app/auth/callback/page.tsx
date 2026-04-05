"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OtpType = "signup" | "recovery" | "invite" | "email" | "email_change";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // 1. Log entry immediately
      console.log("🚀 Auth Callback: Initialization", {
        href: window.location.href,
        hasCode: !!new URLSearchParams(window.location.search).get("code"),
        timestamp: new Date().toISOString()
      });

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const tokenHash = urlParams.get("token_hash");
      const otpType = urlParams.get("type") as OtpType | null;
      const error = urlParams.get("error");
      const errorDescription = urlParams.get("error_description");

      if (error) {
        console.error("❌ OAuth Error from provider:", error, errorDescription);
        router.replace(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      if (code) {
        console.log("⚡ Found code, exchanging for session...");
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error("❌ Exchange Failed:", exchangeError.message);
            router.replace(`/login?error=exchange_failed&details=${encodeURIComponent(exchangeError.message)}`);
            return;
          }

          if (data?.user) {
            console.log("✅ Session established for:", data.user.id);
            // use replace instead of push to avoid back-button loop
            router.replace(`/dashboard/${data.user.id}`);
            return;
          }
        } catch (err: any) {
          console.error("❌ Unexpected error during exchange:", err);
          router.replace(`/login?error=unexpected_callback_error`);
          return;
        }
      }

      if (tokenHash && otpType) {
        console.log("⚡ Found token_hash, verifying OTP...", { otpType });
        try {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            type: otpType,
            token_hash: tokenHash,
          });

          if (verifyError) {
            console.error("❌ OTP verification failed:", verifyError.message);
            router.replace(`/login?error=verify_failed&details=${encodeURIComponent(verifyError.message)}`);
            return;
          }

          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            router.replace(`/dashboard/${session.user.id}`);
            return;
          }

          router.replace("/login?verified=1");
          return;
        } catch (err: any) {
          console.error("❌ Unexpected error during OTP verification:", err);
          router.replace("/login?error=unexpected_verify_error");
          return;
        }
      }

      // 2. If no code or exchange didn't redirect, check for existing session
      console.log("🔍 No code, checking for existing session...");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("❌ getSession Error:", sessionError.message);
      }

      if (session?.user) {
        console.log("✅ Existing session found, redirecting to dashboard");
        router.replace(`/dashboard/${session.user.id}`);
        return;
      }

      // 3. Fallback: Something is wrong
      console.warn("⚠️ No code or session found. Redirecting to login shortly...");
      const timer = setTimeout(() => {
        router.replace("/login?error=no_session_detected");
      }, 1500);

      return () => clearTimeout(timer);
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F2F2F0]">
      <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin mb-4"></div>
      <p className="text-stone-500 font-medium animate-pulse">Authenticating...</p>
    </div>
  );
}