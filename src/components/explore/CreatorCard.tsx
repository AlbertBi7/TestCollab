"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";

interface CreatorCardProps {
  id: string;
  name: string;
  username: string;
  role: string;
  avatar: string;
  spacesCount: number;
  followersCount: number;
  isFollowing?: boolean;
}

export function CreatorCard({
  id,
  name,
  username,
  role,
  avatar,
  spacesCount,
  followersCount: initialFollowersCount,
  isFollowing: initialIsFollowing = false,
}: CreatorCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isFollowing, toggleFollow, isLoading, followersCount } = useFollow(id, initialIsFollowing, initialFollowersCount);

  const formattedFollowers =
    followersCount >= 1000
      ? `${(followersCount / 1000).toFixed(1)}k`
      : followersCount.toString();

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFollow();
  };


  const handleProfileClick = () => {
    router.push(`/profile/${id}`);
  };

  return (
    <div 
      onClick={handleProfileClick}
      className="group relative h-95 bg-stone-950/90 backdrop-blur-xl p-8 rounded-[40px] overflow-hidden border-2 border-white/20 transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_28px_56px_-24px_rgba(0,0,0,0.8)] cursor-pointer flex flex-col items-center justify-between"
    >
      {/* Ambient accent background */}
      <div className="absolute inset-0 opacity-40 transition-opacity duration-700 group-hover:opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-lime-500/10 blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-stone-500/5 blur-[100px]" />
      </div>

      {/* Avatar Section */}
      <div className="relative pt-2">
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/10 group-hover:border-lime-500 transition-all duration-500 shadow-2xl relative z-10">
          <Image src={avatar} alt={name} width={80} height={80} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        </div>
        {/* Glow Ring */}
        <div className="absolute inset-0 rounded-full bg-lime-500/0 group-hover:bg-lime-500/20 blur-2xl transition-all duration-700" />
      </div>

      {/* Identity Block */}
      <div className="relative z-10 text-center">
        <h3 className="text-xl font-medium text-white tracking-tight group-hover:text-lime-400 transition-colors">
          {name}
        </h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-[10px] font-mono tracking-tight text-stone-500">
            @{username}
          </span>
          <span className="w-1 h-1 rounded-full bg-stone-700" />
          <span className="text-[10px] font-black text-lime-500/80 uppercase tracking-widest">
            {role}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-px bg-white/5 rounded-[28px] overflow-hidden w-full border border-white/10 relative z-10 backdrop-blur-sm">
        <div className="bg-white/5 p-4 hover:bg-white/10 transition-colors text-center">
          <p className="text-xl font-mono text-white leading-none">{spacesCount}</p>
          <p className="text-[8px] font-black uppercase tracking-widest text-stone-500 mt-2">
            Spaces
          </p>
        </div>
        <div className="bg-white/5 p-4 hover:bg-white/10 transition-colors text-center">
          <p className="text-xl font-mono text-white leading-none">{formattedFollowers}</p>
          <p className="text-[8px] font-black uppercase tracking-widest text-stone-500 mt-2">
            Followers
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="w-full relative z-10">
        {user?.id !== id ? (
          <button
            onClick={handleFollowToggle}
            disabled={isLoading}
            className={`w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-2 ${isFollowing
                ? "bg-white/10 border border-white/10 text-white hover:bg-white hover:text-stone-950"
                : "bg-lime-500 text-stone-950 hover:bg-white shadow-xl shadow-lime-500/0 hover:shadow-lime-500/20"
              }`}
          >
            {isLoading ? "••••" : isFollowing ? "Following" : "Follow Creator"}
          </button>
        ) : (
          <div className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black text-stone-500 uppercase tracking-[0.2em] italic text-center">
            Your Identity
          </div>
        )}
      </div>
    </div>
  );
}
