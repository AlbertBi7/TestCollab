"use client";

import Link from "next/link";
import { ArrowRight, Globe, Image as ImageIcon } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Content */}
        <div className="relative z-10 reveal active">
          <div className="inline-flex items-center gap-2 bg-white border border-stone-200 px-4 py-1.5 rounded-full mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-lime-500"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-stone-500">New Public Workspaces</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-medium tracking-tight text-stone-900 mb-6 leading-[1.05]">
            Organize your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-600 to-emerald-600">creative chaos.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-stone-500 mb-10 max-w-lg leading-relaxed">
            Collabio is the visual workspace for references, links, and ideas. Stop digging through folders and start connecting the dots.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/signup" className="w-full sm:w-auto">
              <button className="h-14 px-8 rounded-full bg-stone-900 text-white text-lg font-bold hover:scale-105 transition-transform shadow-xl flex items-center justify-center gap-2 w-full">
                Sign Up Free <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/explore" className="w-full sm:w-auto">
              <button className="h-14 px-8 rounded-full bg-white border border-stone-200 text-stone-900 text-lg font-medium hover:bg-stone-50 transition-colors flex items-center justify-center gap-2 w-full">
                <Globe className="w-5 h-5" /> Explore Workspaces
              </button>
            </Link>
          </div>
        </div>

        {/* Right Animation Area */}
        <div className="relative h-[500px] w-full hidden lg:block">
          {/* 1. Background Blobs (using the animations we added to globals.css) */}
          <div className="absolute top-0 right-10 w-96 h-96 bg-lime-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute bottom-0 left-10 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: "2s" }}></div>

          <div className="relative z-10 w-full h-full">
            {/* 2. Main Glass Card */}
            <div className="absolute top-10 left-10 right-10 bottom-10 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[40px] shadow-2xl p-6 animate-float">
              {/* Fake UI inside the card */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="h-2 w-20 bg-stone-200 rounded-full"></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-32 bg-stone-100 rounded-2xl"></div>
                <div className="h-32 bg-stone-100 rounded-2xl"></div>
                <div className="h-32 bg-stone-100 rounded-2xl"></div>
              </div>
            </div>

            {/* 3. Floating "Image" Card */}
            <div className="absolute -right-4 top-20 bg-white p-4 rounded-[32px] shadow-xl animate-float-delayed border border-stone-100 max-w-[200px]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center text-lime-700">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="h-2 w-16 bg-stone-800 rounded-full mb-1"></div>
                  <div className="h-2 w-10 bg-stone-200 rounded-full"></div>
                </div>
              </div>
              <div className="aspect-square bg-stone-100 rounded-2xl overflow-hidden flex items-center justify-center text-stone-400 font-bold text-xs">
                 IMG_001
              </div>
            </div>

            {/* 4. Floating "Collaborators" Badge */}
            <div className="absolute -left-4 bottom-32 bg-stone-900 text-white px-5 py-3 rounded-full shadow-xl animate-float flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-stone-700 border-2 border-stone-900"></div>
                <div className="w-8 h-8 rounded-full bg-stone-600 border-2 border-stone-900"></div>
              </div>
              <span className="text-sm font-bold">4 Collaborators</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}