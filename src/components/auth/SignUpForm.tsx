"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff, Check, CheckCircle2, Github, Loader2, Infinity } from "lucide-react";

const nameRegex = /^[A-Za-z' -]+$/;

const isValidName = (name: string) => {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 50) return false;
  return nameRegex.test(trimmed);
};

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

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Password Strength Logic
  const getStrength = (pass: string) => {
    let strength = 0;
    if (pass.length > 5) strength += 1;
    if (pass.length > 8) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9!@#$%^&*]/.test(pass)) strength += 1;
    return strength;
  };

  const strength = getStrength(password);
  
  const getStrengthColor = () => {
    if (strength === 0) return "bg-stone-200";
    if (strength <= 1) return "bg-red-400";
    if (strength <= 2) return "bg-orange-400";
    if (strength <= 3) return "bg-yellow-400";
    return "bg-green-500";
  };
  
  const getStrengthText = () => {
    if (strength === 0) return "";
    if (strength <= 1) return "Weak";
    if (strength <= 2) return "Fair";
    if (strength <= 3) return "Good";
    return "Strong";
  };

  const handleSocialSignUp = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setError(`Failed to sign up with ${provider}.`);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setNameError("");
    setEmailError("");
    setPasswordError("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidName(normalizedName)) {
      setNameError("Enter a valid name (2-50 chars, letters/spaces/-/').");
      setIsSubmitting(false);
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setEmailError("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: normalizedName,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedName)}`,
          },
        },
      });

      if (error) {
        throw error;
      }

      router.replace(`/auth/confirm?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(getFriendlyError(message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#F2F2F0] text-stone-900 overflow-hidden">
      <div className="w-full flex flex-col relative h-screen overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-lime-200/40 blur-3xl"></div>
        <div className="pointer-events-none absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-emerald-100/50 blur-3xl"></div>
        <div className="pointer-events-none absolute bottom-10 left-1/3 h-52 w-52 rounded-full bg-white/40 blur-2xl"></div>
        <div className="absolute top-3 left-8 sm:left-12 z-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#1c1917] rounded-full flex items-center justify-center text-[#d9f99d] shadow-md group-hover:rotate-180 transition-transform duration-700">
              <Infinity className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">Collabio</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-12 xl:px-20 py-2 mt-0 overflow-hidden">
          <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-left-4 duration-500 rounded-[32px] border border-stone-200/70 bg-white/70 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] p-5 sm:p-6">
            <h2 className="text-4xl font-bold mb-2 tracking-tight">Create Account.</h2>
            <p className="text-stone-500 mb-5 text-base">Join 10k+ creatives in the flow state.</p>

            {error && (
              <div className="text-red-500 text-center mb-4 text-sm font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                {error}
                {error.includes("rate limit") && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-xs text-red-600 mb-2">While you wait, you can:</p>
                    <div className="flex gap-2 justify-center">
                      <Link href="/login" className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-full text-xs font-medium transition-colors">
                        Try Login Instead
                      </Link>
                      <button
                        onClick={() => {
                          setError("");
                          setEmail("");
                          setPassword("");
                          setName("");
                        }}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-full text-xs font-medium transition-colors"
                      >
                        Clear Form
                      </button>
                    </div>
                  </div>
                )}
                {error.includes("already registered") && (
                  <div className="mt-2">
                    <Link href="/login" className="text-xs underline hover:no-underline">
                      Go to Login
                    </Link>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-1.5">
                <div className="relative group">
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => {
                      const onlyAllowedNameChars = e.target.value.replace(/[^A-Za-z' -]/g, "");
                      setName(onlyAllowedNameChars);
                      setNameError("");
                      setError("");
                    }}
                    className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-stone-200 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5 focus:outline-none transition-all font-medium placeholder:text-stone-300 shadow-sm"
                    required
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                </div>
                {nameError ? <p className="text-red-500 text-xs mt-1 ml-1">{nameError}</p> : null}
              </div>

              <div className="space-y-1.5">
                <div className="relative group">
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                      setError("");
                    }}
                    className="w-full pl-12 pr-10 py-4 bg-white rounded-2xl border border-stone-200 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5 focus:outline-none transition-all font-medium placeholder:text-stone-300 shadow-sm peer"
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                  {isValidEmail(email) && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
                </div>
                {emailError ? <p className="text-red-500 text-xs mt-1 ml-1">{emailError}</p> : null}
              </div>

              <div className="space-y-1.5">
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                      setError("");
                    }}
                    className="w-full pl-12 pr-12 py-4 bg-white rounded-2xl border border-stone-200 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5 focus:outline-none transition-all font-medium placeholder:text-stone-300 shadow-sm"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordError ? <p className="text-red-500 text-xs mt-1 ml-1">{passwordError}</p> : null}
                <div className="flex items-center gap-3 px-2">
                  <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden flex flex-1">
                    <div className={`h-full strength-bar ${getStrengthColor()}`} style={{ width: `${(strength / 4) * 100}%` }}></div>
                  </div>
                  <p className="text-[10px] text-stone-400 font-bold uppercase w-12 text-right">{getStrengthText() || "Weak"}</p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group mt-2 pt-1">
                <div className="relative flex items-center mt-0.5">
                  <input type="checkbox" className="peer sr-only" required />
                  <div className="w-5 h-5 border-2 border-stone-300 rounded-md peer-checked:bg-[#1c1917] peer-checked:border-[#1c1917] transition-all flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
                <span className="text-sm text-stone-500 leading-tight group-hover:text-stone-700 transition-colors">
                  I agree to the <a href="#" className="font-bold underline decoration-stone-300 text-stone-900">Terms</a> and <a href="#" className="font-bold underline decoration-stone-300 text-stone-900">Privacy Policy</a>.
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#1c1917] text-white rounded-2xl font-bold text-base hover:bg-stone-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-stone-900/10 flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Create Account"}
              </button>
            </form>

            <div className="relative flex items-center py-4 mt-1">
              <div className="flex-grow border-t border-stone-200"></div>
              <span className="flex-shrink-0 mx-4 text-stone-400 text-[10px] font-bold uppercase tracking-widest">Or sign up with</span>
              <div className="flex-grow border-t border-stone-200"></div>
            </div>

            <div className="flex gap-4 justify-center mb-4">
              <button
                type="button"
                onClick={() => handleSocialSignUp("google")}
                className="w-14 h-14 bg-white rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
              </button>
              <button
                type="button"
                onClick={() => handleSocialSignUp("github")}
                className="w-14 h-14 bg-white rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <Github className="w-6 h-6 text-stone-900" />
              </button>
            </div>

            <p className="text-center text-stone-500 font-medium pb-2">
              Already have an account?{" "}
              <Link href="/login" className="text-stone-900 font-bold hover:text-lime-600 transition-colors underline decoration-2 underline-offset-4 decoration-stone-200 hover:decoration-lime-600">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}