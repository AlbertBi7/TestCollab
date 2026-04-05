"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Navbar } from "@/components/landing/NavBar";
import Link from "next/link";
import { Infinity } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  
  // Handle case where Supabase redirects to root with auth callback params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");
      const hasAccessTokenInHash = window.location.hash.includes("access_token=");

      if (code || (tokenHash && type) || hasAccessTokenInHash) {
        const search = url.searchParams.toString();
        const hash = window.location.hash;
        console.log("Redirecting to callback for auth params found on root");
        router.replace(`/auth/callback${search ? `?${search}` : ""}${hash}`);
      }
    }
  }, [router]);
  
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
        
        {/* Core Workflow Section */}
        <section className="bg-stone-900 py-20 -mx-2 sm:mx-0 sm:rounded-[40px] mb-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-white">
              <div className="p-4">
                <div className="text-lime-400 text-sm font-bold mb-4">STEP 01</div>
                <h3 className="text-2xl font-bold mb-3">Create Workspaces</h3>
                <p className="text-stone-400">Initialize custom visual spaces. Categorize projects as public for discovery or private for team use only.</p>
              </div>
              <div className="p-4 border-t md:border-t-0 md:border-l border-white/10">
                <div className="text-lime-400 text-sm font-bold mb-4">STEP 02</div>
                <h3 className="text-2xl font-bold mb-3">Add References</h3>
                <p className="text-stone-400">Our scraper automatically pulls metadata from URLs to generate rich cards with images and site titles.</p>
              </div>
              <div className="p-4 border-t md:border-t-0 md:border-l border-white/10">
                <div className="text-lime-400 text-sm font-bold mb-4">STEP 03</div>
                <h3 className="text-2xl font-bold mb-3">Collaborate</h3>
                <p className="text-stone-400">Use Real-time Chat and Presence features to work with team members across folders in milliseconds.</p>
              </div>
            </div>
          </div>
        </section>
    

        <Features />

        {/* CTA Section */}
        <section className="px-6 mb-20 reveal">
          <div className="max-w-5xl mx-auto bg-stone-900 rounded-[48px] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-lime-400"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Build your knowledge base.</h2>
              <p className="text-stone-400 text-lg mb-8 max-w-lg mx-auto">Start organizing your project references with our automated scraper and real-time collaboration tools.</p>
              <div className="flex justify-center gap-4 mt-8">
                <Link href="/signup">
                  <button className="h-16 px-10 rounded-full bg-lime-300 text-stone-900 text-xl font-bold hover:bg-white transition-colors shadow-lg hover:scale-105 transform duration-300">
                    Get Started Now
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