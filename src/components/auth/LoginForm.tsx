"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Github, Loader2, Infinity } from "lucide-react";

const isValidEmail = (email: string) => {
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
  if (!/[a-zA-Z]/.test(trimmed.split("@")[0] || "")) return false;
  return true;
};

const getFriendlyError = (message: string): string => {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials") || normalized.includes("invalid_grant")) return "Incorrect email or password.";
  if (normalized.includes("email not confirmed")) return "Please verify your email before logging in.";
  if (normalized.includes("user already registered")) return "An account with this email already exists.";
  if (normalized.includes("network")) return "Connection error. Check your internet and try again.";
  if (normalized.includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  if (normalized.includes("error sending confirmation email")) return "Could not send confirmation email. Try again shortly.";
  return "Something went wrong. Please try again.";
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResendingConfirm, setIsResendingConfirm] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setEmailError("");
    setPasswordError("");
    setResetMessage("");
    setConfirmMessage("");
    setIsSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setEmailError("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    if (!password.trim()) {
      setPasswordError("Password is required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        router.push(`/dashboard/${data.user.id}`);
      } else {
        router.push("/dashboard");
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setFormError(getFriendlyError(message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    setFormError("");
    setConfirmMessage("");
    setEmailError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setEmailError("Enter a valid email before resending verification.");
      return;
    }

    setIsResendingConfirm(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setFormError(getFriendlyError(error.message));
        return;
      }

      setConfirmMessage("Verification email sent. Please check your inbox.");
    } finally {
      setIsResendingConfirm(false);
    }
  };

  const handlePasswordReset = async () => {
    setFormError("");
    setEmailError("");
    setResetMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setEmailError("Enter a valid email before requesting reset.");
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        setFormError(getFriendlyError(error.message));
        return;
      }

      setResetMessage("Check your email for a password reset link");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setFormError("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setFormError(getFriendlyError(message));
    }
  };

 return (
    <div className="h-screen w-full bg-[#F2F2F0] text-stone-900 overflow-hidden">
      <div className="w-full flex flex-col relative h-screen overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-lime-200/40 blur-3xl"></div>
        <div className="pointer-events-none absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-emerald-100/50 blur-3xl"></div>
        <div className="pointer-events-none absolute bottom-10 left-1/3 h-52 w-52 rounded-full bg-white/40 blur-2xl"></div>
        <div className="absolute top-8 left-8 sm:left-12 z-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#1c1917] rounded-full flex items-center justify-center text-[#d9f99d] shadow-md group-hover:rotate-180 transition-transform duration-700">
              <Infinity className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">Collabio</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-12 xl:px-20 py-10 mt-8 lg:mt-0 overflow-hidden">
          <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-left-4 duration-500 rounded-[32px] border border-stone-200/70 bg-white/70 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] p-8 sm:p-10">
            <h2 className="text-4xl font-bold mb-3 tracking-tight">Welcome back.</h2>
            <p className="text-stone-500 mb-10 text-lg">Log in to organize your creative flow.</p>

            {formError && (
              <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-xl text-center font-medium border border-red-100">
                {formError}
              </div>
            )}

            {resetMessage && (
              <div className="mb-4 p-3 text-sm text-green-700 bg-green-50 rounded-xl text-center font-medium border border-green-100">
                {resetMessage}
              </div>
            )}

            {confirmMessage && (
              <div className="mb-4 p-3 text-sm text-green-700 bg-green-50 rounded-xl text-center font-medium border border-green-100">
                {confirmMessage}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-2">Email</label>
                <div className="relative group">
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                      setFormError("");
                      setResetMessage("");
                    }}
                    className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-stone-200 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5 focus:outline-none transition-all font-medium placeholder:text-stone-300 shadow-sm"
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                </div>
                {emailError ? <p className="text-red-500 text-xs mt-1 ml-1">{emailError}</p> : null}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowReset((prev) => !prev)}
                    className="text-xs font-bold text-stone-900 hover:text-lime-600 transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <input
                    id="loginPass"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                      setFormError("");
                    }}
                    className="w-full pl-12 pr-12 py-4 bg-white rounded-2xl border border-stone-200 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5 focus:outline-none transition-all font-medium placeholder:text-stone-300 shadow-sm"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordError ? <p className="text-red-500 text-xs mt-1 ml-1">{passwordError}</p> : null}
                {showReset ? (
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={isResetting}
                    className="text-xs font-semibold text-stone-800 mt-2 disabled:opacity-60"
                  >
                    {isResetting ? "Sending reset link..." : "Send password reset link"}
                  </button>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 mt-4 bg-[#1c1917] text-white rounded-2xl font-bold text-lg hover:bg-stone-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-stone-900/10 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Sign In"}
                {!isSubmitting && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            {formError.toLowerCase().includes("verify your email") && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={isResendingConfirm}
                className="w-full mt-4 py-3 bg-white border border-stone-200 text-stone-800 rounded-2xl font-semibold hover:bg-stone-50 transition-colors disabled:opacity-60"
              >
                {isResendingConfirm ? "Resending verification..." : "Resend verification email"}
              </button>
            )}

            <div className="relative flex items-center py-8">
              <div className="flex-grow border-t border-stone-200"></div>
              <span className="flex-shrink-0 mx-4 text-stone-400 text-[10px] font-bold uppercase tracking-widest">Or continue with</span>
              <div className="flex-grow border-t border-stone-200"></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                className="flex items-center justify-center gap-2 py-3.5 bg-white border border-stone-200 rounded-2xl hover:bg-stone-50 hover:border-stone-300 transition-all font-bold text-stone-700 shadow-sm hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin("github")}
                className="flex items-center justify-center gap-2 py-3.5 bg-white border border-stone-200 rounded-2xl hover:bg-stone-50 hover:border-stone-300 transition-all font-bold text-stone-700 shadow-sm hover:-translate-y-0.5"
              >
                <Github className="w-5 h-5" />
                GitHub
              </button>
            </div>

            <p className="text-center text-stone-500 font-medium">
              New to Collabio?{" "}
              <Link href="/signup" className="text-stone-900 font-bold hover:text-lime-600 transition-colors underline decoration-2 underline-offset-4 decoration-stone-200 hover:decoration-lime-600">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}