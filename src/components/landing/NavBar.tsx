"use client";

import Link from "next/link";
import { Infinity } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
      <nav className="max-w-7xl mx-auto bg-white/70 backdrop-blur-md border border-white/50 rounded-full px-6 py-3 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center text-lime-300 group-hover:rotate-180 transition-transform duration-700">
            <Infinity className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-stone-900">Collabio</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">Features</a>
          <a href="#" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">About</a>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:block text-sm font-bold text-stone-900 hover:text-stone-600 transition-colors">
            Login
          </Link>
          <Link href="/signup" className="px-6 py-2.5 rounded-full bg-stone-900 text-white text-sm font-bold hover:bg-lime-500 hover:text-stone-900 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}