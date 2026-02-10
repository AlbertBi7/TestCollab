"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/landing/NavBar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import Link from "next/link";
import { Infinity } from "lucide-react";

export default function LandingPage() {
  
  // Logic to make elements fade in as you scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-x-hidden bg-[#F2F2F0] min-h-screen">
      <Navbar />
      
      <main>
        <Hero />
        
        {/* Stats Section */}
        <section className="bg-stone-900 py-12 -mx-2 sm:mx-0 sm:rounded-[40px] mb-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
              <Stat number="10k+" label="Active Creatives" />
              <Stat number="1M+" label="References Saved" highlight />
              <Stat number="99%" label="Uptime" />
              <Stat number="4.9/5" label="User Rating" />
            </div>
          </div>
        </section>

        <Features />

        {/* CTA Section */}
        <section className="px-6 mb-20 reveal">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-stone-900 to-stone-800 rounded-[48px] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Ready to get organized?</h2>
              <div className="flex justify-center gap-4 mt-8">
                <Link href="/signup">
                  <button className="h-16 px-10 rounded-full bg-lime-200 text-stone-900 text-xl font-bold hover:bg-white transition-colors shadow-lg hover:scale-105 transform duration-300">
                    Sign Up Free
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center text-lime-300">
              <Infinity className="w-4 h-4" />
            </div>
            <span className="font-bold text-xl tracking-tight text-stone-900">Collabio</span>
          </div>
          <p className="text-stone-400 text-sm">© 2026 Collabio Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function Stat({ number, label, highlight }: any) {
  return (
    <div className="reveal">
      <h3 className={`text-4xl md:text-5xl font-bold mb-1 ${highlight ? 'text-lime-300' : 'text-white'}`}>{number}</h3>
      <p className="text-stone-400 font-medium">{label}</p>
    </div>
  );
}