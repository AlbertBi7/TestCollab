"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowDownUp, LayoutGrid, List, Plus, Pencil, UserPlus, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  ReferenceCard,
  WorkspaceHeader,
  WorkspaceSidebar,
} from "@/components/workspace/public";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { AddReferenceModal } from "@/components/workspace/AddReferenceModal";
import { WorkspaceChat } from "@/components/workspace/chat";

interface WorkspaceData {
  workspace_id: string;
  workspace_title: string;
  workspace_description: string;
  workspace_owner_id: string;
  workspace_visibility: string;
}

interface ReferenceData {
  reference_id: string;
  reference_title: string;
  reference_url: string;
  reference_thumbnail: string;
  reference_source: string;
  reference_tags: string[];
  reference_type: string;
  reference_category: string;
}

interface Collection {
  id: string;
  name: string;
  count: number;
}

// Mock data for demonstration
const mockWorkspace: WorkspaceData = {
  workspace_id: "mock-1",
  workspace_title: "UI/UX Inspiration 2024",
  workspace_description:
    "A highly curated collection of the best landing pages, mobile app patterns, and interactions. Updated weekly with fresh finds from across the web.",
  workspace_owner_id: "owner-1",
  workspace_visibility: "public",
};

const mockAuthor = {
  id: "owner-1",
  name: "Sarah Jenks",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
};

const mockReferences: ReferenceData[] = [
  {
    reference_id: "ref-1",
    reference_title: "Vercel Dashboard",
    reference_url: "https://vercel.com",
    reference_thumbnail:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500",
    reference_source: "vercel.com",
    reference_tags: ["darkmode", "dashboard"],
    reference_type: "link",
    reference_category: "Landing Pages",
  },
  {
    reference_id: "ref-2",
    reference_title: "Linear App Layout",
    reference_url: "https://linear.app",
    reference_thumbnail:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?w=500",
    reference_source: "linear.app",
    reference_tags: ["typography"],
    reference_type: "link",
    reference_category: "Mobile Interactions",
  },
  {
    reference_id: "ref-3",
    reference_title: "Nature Background Texture",
    reference_url: "https://unsplash.com",
    reference_thumbnail:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500",
    reference_source: "Unsplash",
    reference_tags: ["asset"],
    reference_type: "image",
    reference_category: "Landing Pages",
  },
  {
    reference_id: "ref-4",
    reference_title: "Fintech Primary Colors",
    reference_url: "https://colorhunt.co",
    reference_thumbnail: "",
    reference_source: "Color Hunt",
    reference_tags: ["colors"],
    reference_type: "color",
    reference_category: "Typography",
  },
];

const mockCollections: Collection[] = [
  { id: "1", name: "Landing Pages", count: 45 },
  { id: "2", name: "Mobile Interactions", count: 32 },
  { id: "3", name: "Typography", count: 51 },
];

const mockTags = ["minimal", "darkmode", "fintech", "gradients"];

function PublicWorkspaceContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [author, setAuthor] = useState(mockAuthor);
  const [references, setReferences] = useState<ReferenceData[]>([]);
  const [collections, setCollections] = useState<Collection[]>(mockCollections);
  const [tags, setTags] = useState<string[]>(mockTags);
  const [loading, setLoading] = useState(true);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Owner-only state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMember, setIsMember] = useState(false);

  // Check if current user is the owner
  const isOwner = user?.id === workspace?.workspace_owner_id;

  // Unwrap params
  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      setWorkspaceId(resolvedParams.id);
    };
    unwrapParams();
  }, [params]);

  // Fetch workspace data
  useEffect(() => {
    if (!workspaceId) return;

    const fetchWorkspace = async () => {
      setLoading(true);
      try {
        // Fetch workspace
        const { data: workspaceData, error: workspaceError } = await supabase
          .from("workspaces")
          .select("*")
          .eq("workspace_id", workspaceId)
          .single();

        if (workspaceError) {
          // Use mock data if not found
          setWorkspace(mockWorkspace);
          setReferences(mockReferences);
          setLoading(false);
          return;
        }

        // Check if workspace is private and user is not the owner
        const isUserOwner = user?.id === workspaceData.workspace_owner_id;
        if (workspaceData.workspace_visibility !== "public" && !isUserOwner) {
          router.push("/explore");
          return;
        }

        setWorkspace(workspaceData);

        // Check if user is a member (owner or collaborator)
        if (user) {
          if (user.id === workspaceData.workspace_owner_id) {
            setIsMember(true);
          } else {
            // Check workspace_members table
            const { data: memberData } = await supabase
              .from("workspace_members")
              .select("workspace_id")
              .eq("workspace_id", workspaceId)
              .eq("profile_id", user.id)
              .maybeSingle();
            
            setIsMember(!!memberData);
          }
        }

        // Fetch owner profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("profile_id, display_name, profile_avatar_url")
          .eq("profile_id", workspaceData.workspace_owner_id)
          .single();

        if (profileData) {
          setAuthor({
            id: profileData.profile_id,
            name: profileData.display_name || "Unknown User",
            avatar:
              profileData.profile_avatar_url ||
              "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100",
          });
        }

        // Fetch references
        const { data: referencesData } = await supabase
          .from("references")
          .select("*")
          .eq("workspace_id", workspaceId)
          .order("reference_created_at", { ascending: false });

        if (referencesData) {
          setReferences(referencesData);

          // Extract unique categories for collections
          const categoryMap = new Map<string, number>();
          referencesData.forEach((ref: any) => {
            const category = ref.reference_category || "Uncategorized";
            categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
          });

          const extractedCollections: Collection[] = Array.from(
            categoryMap.entries()
          ).map(([name, count], index) => ({
            id: String(index + 1),
            name,
            count,
          }));
          setCollections(extractedCollections);

          // Extract unique tags
          const tagSet = new Set<string>();
          referencesData.forEach((ref: any) => {
            (ref.reference_tags || []).forEach((tag: string) => tagSet.add(tag));
          });
          setTags(Array.from(tagSet).slice(0, 8));
        }
      } catch (err) {
        console.error("Error fetching workspace:", err);
        setWorkspace(mockWorkspace);
        setReferences(mockReferences);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId, router, user]);

  // Filter references
  const filteredReferences = references.filter((ref) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      ref.reference_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.reference_tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Collection filter
    const matchesCollection =
      activeCollection === null ||
      ref.reference_category ===
        collections.find((c) => c.id === activeCollection)?.name;

    return matchesSearch && matchesCollection;
  });

  // Handlers
  const handleLike = useCallback(async () => {
    if (!workspace) return;
    showToast("Added to your Favorites 💖");
    // TODO: Implement actual like logic with Supabase
  }, [workspace, showToast]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Link copied to clipboard! 📋");
  }, [showToast]);

  const handleDuplicate = useCallback(async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    showToast("Duplicated to your Dashboard ✨");
    // TODO: Implement actual duplicate logic with Supabase
  }, [user, router, showToast]);

  const handleSaveReference = useCallback(
    (refId: string) => {
      showToast("Item Saved to your Library");
      // TODO: Implement save to library logic
    },
    [showToast]
  );

  const handleOpenReference = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const handleTagClick = useCallback((tag: string) => {
    setSearchQuery(tag);
  }, []);

  // Owner-only: Handle adding new reference (optimistic update)
  const handleAddReference = useCallback((newFile: any) => {
    setReferences((prev) => [newFile, ...prev]);
    showToast("Reference Added Successfully ✨");
    setIsAddModalOpen(false);
  }, [showToast]);

  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      Design: "🎨",
      Code: "💻",
      Audio: "🎧",
      Branding: "✨",
      Mobile: "📱",
      Video: "🎬",
      Writing: "📝",
    };
    return emojiMap[category] || "📁";
  };

  if (loading || !workspace) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-stone-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-stone-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto pb-20">
      {/* Owner-only: Add Reference Modal */}
      {isOwner && (
        <AddReferenceModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          workspaceId={workspace.workspace_id}
        />
      )}

      {/* Header */}
      <WorkspaceHeader
        id={workspace.workspace_id}
        title={workspace.workspace_title}
        description={workspace.workspace_description || ""}
        coverImage="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600"
        category="General"
        categoryEmoji={getCategoryEmoji("General")}
        views={0}
        likes={0}
        author={author}
        onLike={handleLike}
        onShare={handleShare}
        onDuplicate={handleDuplicate}
        isOwner={isOwner}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 float-in delay-2">
        {/* Sidebar */}
        <WorkspaceSidebar
          collections={collections}
          tags={tags}
          activeCollection={activeCollection}
          onCollectionChange={setActiveCollection}
          onTagClick={handleTagClick}
        />

        {/* References Grid */}
        <main>
          {/* Search and Filter Bar */}
          <div className="flex items-center justify-between mb-6 bg-white p-2 pr-6 rounded-full shadow-sm border border-stone-100">
            <div className="relative group w-full max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search inside this space..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-transparent border-none focus:outline-none text-stone-900 placeholder:text-stone-400 font-medium text-sm"
              />
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <button className="text-sm font-bold text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1">
                <ArrowDownUp className="w-4 h-4" /> Sort
              </button>
              <div className="w-px h-6 bg-stone-200 mx-1"></div>
              <button
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "text-stone-900" : "text-stone-400 hover:text-stone-900"}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "text-stone-900" : "text-stone-400 hover:text-stone-900"}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* References Grid */}
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
            }
          >
            {filteredReferences.map((ref) => (
              <ReferenceCard
                key={ref.reference_id}
                id={ref.reference_id}
                title={ref.reference_title || "Untitled"}
                source={ref.reference_source || ref.reference_url || ""}
                imageUrl={
                  ref.reference_thumbnail ||
                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500"
                }
                tags={ref.reference_tags || []}
                type={ref.reference_type as "image" | "link" | "color" | "video"}
                colorPalette={
                  ref.reference_type === "color"
                    ? ["#2C3E50", "#E74C3C", "#ECF0F1", "#3498DB"]
                    : undefined
                }
                onSave={() => handleSaveReference(ref.reference_id)}
                onOpen={() => handleOpenReference(ref.reference_url)}
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredReferences.length === 0 && (
            <div className="text-center py-16">
              <p className="text-stone-500 text-lg">
                {searchQuery
                  ? `No references found for "${searchQuery}"`
                  : "No references in this collection yet."}
              </p>
              {isOwner && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 px-6 py-3 bg-[#1c1917] text-white rounded-full font-medium hover:bg-stone-800 transition-colors"
                >
                  Add your first reference
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Owner-only: Floating Add Button */}
      {isOwner && (
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-tr from-lime-400 to-green-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-lime-500/40 hover:scale-110 hover:rotate-90 transition-all duration-500 z-30"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      {/* Chat Button - Only for members */}
      {isMember && (
        <button
          onClick={() => setIsChatOpen(true)}
          className={`fixed bottom-8 ${isOwner ? 'right-28' : 'right-8'} w-14 h-14 bg-[#1c1917] rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-all duration-300 z-30`}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Panel - Only for members */}
      {isMember && workspaceId && (
        <WorkspaceChat
          workspaceId={workspaceId}
          currentUserId={user?.id}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}

export default function PublicWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ToastProvider>
      <PublicWorkspaceContent params={params} />
    </ToastProvider>
  );
}
