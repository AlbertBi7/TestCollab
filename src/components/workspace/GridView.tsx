"use client";
import { Heart, MoreHorizontal } from "lucide-react";

interface GridViewProps {
  files: any[];
}

export function GridView({ files }: GridViewProps) {
  if (files.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-stone-400 min-h-[400px]">
        <p>No files yet. Click the + button to add one.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start min-h-[500px] animate-in slide-in-from-bottom-4 duration-500 pb-20">
      {files.map((file) => (
        <div key={file.id} className="bg-white rounded-[24px] overflow-hidden group hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 border border-stone-100 h-fit">
          <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
            <img src={file.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <button className="absolute top-2 right-2 w-8 h-8 bg-white/50 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors group/btn">
              <Heart className="w-4 h-4 text-stone-900 group-hover/btn:text-red-500 transition-colors" />
            </button>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-stone-900 truncate">{file.title}</h3>
            <p className="text-stone-400 text-xs mb-3 line-clamp-2">Added via upload</p>
            <div className="flex items-center gap-2 pt-3 border-t border-stone-100">
               <div className="w-5 h-5 rounded-full bg-lime-100 flex items-center justify-center text-[10px] font-bold text-lime-700">
                 {file.author[0]}
               </div>
               <span className="text-xs text-stone-400">{file.author} • {file.date}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}