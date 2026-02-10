"use client";
import { Image as ImageIcon, PlayCircle, FileText, Mic, Link as LinkIcon } from "lucide-react";

export function ClusterView() {
  return (
    <div className="flex-1 relative rounded-[40px] bg-white/50 border border-stone-100/50 overflow-hidden animate-in fade-in duration-500 flex items-center justify-center min-h-[500px]">
        {/* Background Blobs */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lime-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        {/* Floating Clusters */}
        <div className="relative z-10 w-full max-w-4xl h-[500px] flex items-center justify-center">
            
            <div className="absolute left-[10%] top-[20%] w-48 h-48 rounded-full bg-gradient-to-br from-lime-200 to-green-400 flex flex-col items-center justify-center text-stone-900 cursor-pointer shadow-lg shadow-green-500/20 hover:scale-110 transition-all duration-500 group animate-float">
                <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform">
                    <ImageIcon className="w-6 h-6 text-green-900" />
                </div>
                <span className="font-bold text-lg">Images</span>
                <span className="bg-white/40 px-3 py-0.5 rounded-full text-xs font-bold mt-1">128</span>
            </div>

            <div className="absolute right-[15%] top-[25%] w-44 h-44 rounded-full bg-gradient-to-br from-sky-200 to-blue-400 flex flex-col items-center justify-center text-white cursor-pointer shadow-lg shadow-blue-500/20 hover:scale-110 transition-all duration-500 group animate-float">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-2"><FileText className="w-5 h-5" /></div>
                <span className="font-bold">Docs</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1">42</span>
            </div>

            {/* Add more bubbles here as needed from your HTML */}
        </div>
    </div>
  );
}