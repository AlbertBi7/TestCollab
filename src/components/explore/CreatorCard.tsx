"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreatorCardProps {
  id: string;
  name: string;
  username: string;
  role: string;
  avatar: string;
  spacesCount: number;
  followersCount: number;
  isFollowing?: boolean;
  onFollow?: (isFollowing: boolean) => void;
}

export function CreatorCard({
  id,
  name,
  username,
  role,
  avatar,
  spacesCount,
  followersCount,
  isFollowing: initialFollowing = false,
  onFollow,
}: CreatorCardProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);

  const formattedFollowers =
    followersCount >= 1000
      ? `${(followersCount / 1000).toFixed(1)}k`
      : followersCount.toString();

  const handleFollowToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);
    onFollow?.(newFollowingState);
  };

  const handleProfileClick = () => {
    router.push(`/profile/${id}`);
  };

  return (
    <div className="bg-white p-6 rounded-[40px] border border-stone-100 hover-lift text-center flex flex-col items-center">
      {/* Avatar */}
      <div
        className="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-stone-50 cursor-pointer hover:ring-2 ring-lime-400 transition-all"
        onClick={handleProfileClick}
      >
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      </div>

      {/* Name */}
      <h3
        className="text-lg font-bold text-stone-900 cursor-pointer hover:text-lime-600 transition-colors"
        onClick={handleProfileClick}
      >
        {name}
      </h3>

      {/* Username & Role */}
      <p className="text-sm text-stone-400 font-medium mb-4">
        @{username} • {role}
      </p>

      {/* Stats */}
      <div className="flex gap-4 mb-6 text-sm">
        <div>
          <span className="font-bold text-stone-900">{spacesCount}</span>{" "}
          <span className="text-stone-400">Spaces</span>
        </div>
        <div>
          <span className="font-bold text-stone-900">{formattedFollowers}</span>{" "}
          <span className="text-stone-400">Followers</span>
        </div>
      </div>

      {/* Follow Button */}
      <button
        onClick={handleFollowToggle}
        className={`w-full py-3 rounded-2xl font-bold transition-colors ${
          isFollowing
            ? "bg-[#1c1917] text-white hover:bg-stone-800 shadow-md"
            : "bg-stone-100 text-stone-900 hover:bg-lime-200"
        }`}
      >
        {isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  );
}
