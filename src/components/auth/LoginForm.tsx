"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Github, Loader2 } from "lucide-react";

const isValidEmail = (email: string) => {
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
  if (!/[a-zA-Z]/.test(trimmed.split("@")[0] || "")) return false;
  return true;
};

const getFriendlyError = (message: string): string => {
  if (message.includes("Invalid login credentials")) return "Incorrect email or password.";
  if (message.includes("Email not confirmed")) return "Please verify your email before logging in.";
  if (message.includes("User already registered")) return "An account with this email already exists.";
  if (message.includes("Network")) return "Connection error. Check your internet and try again.";
  if (message.toLowerCase().includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  if (message.includes("Error sending confirmation email")) return "Could not send confirmation email. Try again shortly.";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setEmailError("");
    setPasswordError("");
    setResetMessage("");
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
    <div className="px-10 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold text-center text-stone-900 mb-2">Welcome back</h2>
      <p className="text-center text-stone-500 mb-8">Enter your details to access your flow.</p>

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

      <form onSubmit={handleEmailLogin} className="space-y-5">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 ml-3">Email Address</label>
          <div className="relative group">
            <input 
              type="email" 
              placeholder="alex@example.com" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
                setFormError("");
                setResetMessage("");
              }}
              className="w-full pl-12 pr-4 py-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-stone-900 focus:outline-none transition-all font-medium text-stone-900 placeholder:text-stone-400"
              required
            />
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
          </div>
          {emailError ? <p className="text-red-500 text-xs mt-1 ml-1">{emailError}</p> : null}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between ml-3">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Password</label>
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
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
                setFormError("");
              }}
              className="w-full pl-12 pr-12 py-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-stone-900 focus:outline-none transition-all font-medium text-stone-900 placeholder:text-stone-400"
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
          className="w-full py-4 bg-[#1c1917] text-white rounded-2xl font-bold text-lg hover:bg-stone-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-stone-900/10 flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Sign In"} 
          {!isSubmitting && <ArrowRight className="w-5 h-5" />}
        </button>
      </form>

      <div className="relative flex items-center py-8">
        <div className="grow border-t border-stone-200"></div>
        <span className="shrink-0 mx-4 text-stone-400 text-xs font-bold uppercase">Or continue with</span>
        <div className="grow border-t border-stone-200"></div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <button 
          onClick={() => handleSocialLogin('google')}
          className="flex items-center justify-center gap-2 py-3 border-2 border-stone-100 rounded-xl hover:bg-white hover:border-stone-200 transition-all font-medium text-stone-600"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
          Google
        </button>
        <button 
          onClick={() => handleSocialLogin('github')}
          className="flex items-center justify-center gap-2 py-3 border-2 border-stone-100 rounded-xl hover:bg-white hover:border-stone-200 transition-all font-medium text-stone-600"
        >
          <Github className="w-5 h-5" />
          GitHub
        </button>
      </div>

      <p className="text-center text-stone-500 font-medium">
        Don't have an account?{" "}
        <Link href="/signup" className="text-stone-900 font-bold hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}