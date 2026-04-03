"use client";

import { Heart, Bookmark } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface WorkspaceCardProps {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  category: string;
  categoryEmoji?: string;
  likes: number;
  isLiked?: boolean;
  author?: {
    id: string;
    name: string;
    avatar: string;
  };
  updatedAt?: string;
  showAuthor?: boolean;
  onBookmark?: () => void;
  onAuthorClick?: () => void;
  isOwner?: boolean;
  visibility?: string;
}

export function WorkspaceCard({
  id,
  title,
  description,
  coverImage,
  category,
  categoryEmoji = "📁",
  likes,
  isLiked = false,
  author,
  updatedAt,
  showAuthor = true,
  onBookmark,
  onAuthorClick,
  isOwner,
  visibility,
}: WorkspaceCardProps) {
  const formattedLikes = likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : likes.toString();

  return (
    <Link 
      href={`/workspace/${id}`}
      className="group relative h-[320px] rounded-[32px] overflow-hidden bg-stone-900 transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] border-2 border-stone-200/50 hover:border-lime-500/50 block"
    >
      {/* Background Image with Overlay */}
      <Image
        src={coverImage}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        loading="lazy"
        className="w-full h-full object-cover opacity-80 transition-all duration-1000 group-hover:scale-110 group-hover:opacity-100"
        alt={title}
      />
      
      {/* Gradient Scrim (Black) */}
      <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-700" />

      {/* Category Badge */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
        {category !== "General" && (
          <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/10 shadow-sm">
            {categoryEmoji} {category}
          </div>
        )}
        {visibility && (
          <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-stone-300 border border-white/10 shadow-sm">
            {visibility}
          </div>
        )}
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end">
        {isOwner !== undefined && (
          <div className="mb-3 transition-all duration-500">
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${isOwner ? 'bg-lime-500 border-lime-400 text-stone-950' : 'bg-white/10 border-white/20 text-stone-300'}`}>
              {isOwner ? 'Owner' : 'Collaborator'}
            </span>
          </div>
        )}
        <h3 className="text-2xl font-semibold text-white mb-1 tracking-tight group-hover:text-lime-400 transition-colors duration-300">
          {title}
        </h3>
        
        <p className="text-stone-300 text-xs line-clamp-1 group-hover:line-clamp-none transition-all duration-500 max-w-[90%] mb-4 leading-relaxed font-medium">
          {description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
          {showAuthor && author && (
            <div
              className="flex items-center gap-3 cursor-pointer group/author"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAuthorClick?.();
              }}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 shadow-sm group-hover/author:border-lime-400 transition-colors">
                <Image
                  src={author.avatar}
                  alt={author.name}
                  width={32}
                  height={32}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest group-hover/author:text-lime-400">
                {author.name}
              </p>
            </div>
          )}
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
            {updatedAt || 'Recently Updated'}
          </span>
        </div>
      </div>

      {/* Corner Accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-bl from-lime-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </Link>
  );
}
