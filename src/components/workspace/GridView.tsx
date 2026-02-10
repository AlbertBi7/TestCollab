"use client";
import { Heart } from "lucide-react";

export function GridView() {
  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start min-h-[500px] animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Card 1 */}
        <div className="bg-white rounded-[24px] overflow-hidden group hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 border border-stone-100 h-fit">
            <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <button className="absolute top-2 right-2 w-8 h-8 bg-white/50 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors">
                    <Heart className="w-4 h-4 text-stone-900 hover:text-red-500 hover:fill-red-500" />
                </button>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-stone-900 truncate">Moodboard_v4.jpg</h3>
                <p className="text-stone-400 text-xs mb-3 line-clamp-2">Initial color exploration.</p>
            </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-[24px] overflow-hidden group hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 border border-stone-100 h-fit">
            <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-4">
                <h3 className="font-bold text-stone-900 truncate">Nature_Background.jpg</h3>
                <p className="text-stone-400 text-xs mb-3 line-clamp-2">Stock photo for section.</p>
            </div>
        </div>

    </div>
  );
}