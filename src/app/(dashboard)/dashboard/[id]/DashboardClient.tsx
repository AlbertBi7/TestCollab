"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { CreateWorkspaceModal } from "@/components/dashboard/CreateWorkspaceModal";
import { Plus, ArrowUpRight, Users, FolderPlus, Activity } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { WorkspaceCard } from "@/components/explore";

export default function DashboardClient({
  initialWorkspaces,
  initialActivityLogs,
  initialPendingInvites,
  userId,
  ownedWorkspaceCount,
  userReferencesCount,
}: {
  initialWorkspaces: any[];
  initialActivityLogs: any[];
  initialPendingInvites: any[];
  userId: string;
  ownedWorkspaceCount: number;
  userReferencesCount: number;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>(initialWorkspaces || []);
  const [activeWorkspaceFilter, setActiveWorkspaceFilter] = useState<"all" | "owned" | "shared" | "public" | "private">("all");
  const [clientFetchError, setClientFetchError] = useState<string | null>(null);
  const [isRefreshingWorkspaces, setIsRefreshingWorkspaces] = useState(false);
  const [profileSummary, setProfileSummary] = useState({
    displayName: "Your Profile",
    followersCount: 0,
    followingCount: 0,
    referencesCount: 0,
  });

  const date = new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });

  useEffect(() => {
    if (authLoading || !user?.id) return;

    const fetchDashboardWorkspacesClientSide = async () => {
      setIsRefreshingWorkspaces(true);
      setClientFetchError(null);

      try {
        const { data: owned, error: ownedError } = await supabase
          .from("workspaces")
          .select("*")
          .eq("workspace_owner_id", user.id)
          .or("is_archived.is.null,is_archived.eq.false")
          .order("workspace_created_at", { ascending: false });

        if (ownedError) throw ownedError;

        const { data: sharedRows, error: sharedError } = await supabase
          .from("workspace_members")
          .select("workspace_id, workspaces(*)")
          .eq("profile_id", user.id)
          .limit(200);

        if (sharedError) throw sharedError;

        const sharedWorkspaces = (sharedRows || [])
          .map((row: any) => {
            if (Array.isArray(row.workspaces)) return row.workspaces[0] || null;
            return row.workspaces || null;
          })
          .filter((workspace: any) => workspace && !workspace.is_archived);

        const all = [...(owned || []), ...sharedWorkspaces];
        const unique = Array.from(new Map(all.map((workspace: any) => [workspace.workspace_id, workspace])).values());

        setWorkspaces(unique);
      } catch (error: any) {
        const message = error?.message || "Failed to fetch workspaces";
        console.error("Client dashboard workspace fetch failed:", error);
        setClientFetchError(message);
      } finally {
        setIsRefreshingWorkspaces(false);
      }
    };

    fetchDashboardWorkspacesClientSide();
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfileSummary = async () => {
      try {
        const [{ data: profile }, { count: followersCount }, { count: followingCount }, { count: referencesCount }] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name")
            .eq("profile_id", user.id)
            .maybeSingle(),
          supabase
            .from("followers")
            .select("follower_id", { count: "exact", head: true })
            .eq("following_id", user.id),
          supabase
            .from("followers")
            .select("following_id", { count: "exact", head: true })
            .eq("follower_id", user.id),
          supabase
            .from("references")
            .select("reference_id", { count: "exact", head: true })
            .eq("uploaded_by_profile_id", user.id),
        ]);

        setProfileSummary({
          displayName: profile?.display_name || user.email || "Your Profile",
          followersCount: followersCount || 0,
          followingCount: followingCount || 0,
          referencesCount: referencesCount || 0,
        });
      } catch {
        setProfileSummary((prev) => ({
          ...prev,
          displayName: user.email || prev.displayName,
        }));
      }
    };

    fetchProfileSummary();
  }, [user?.id, user?.email]);

  if (!authLoading && user && user.id !== userId) {
    router.push("/");
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  const placeholderImages = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800",
  ];

  const filteredWorkspaces = workspaces.filter((workspace) => {
    const isOwner = workspace.workspace_owner_id === user?.id;
    const visibility = (workspace.workspace_visibility || "").toLowerCase();

    if (activeWorkspaceFilter === "owned") return isOwner;
    if (activeWorkspaceFilter === "shared") return !isOwner;
    if (activeWorkspaceFilter === "public") return visibility === "public";
    if (activeWorkspaceFilter === "private") return visibility === "private";
    return true;
  });

  const filterOptions: Array<{ id: "all" | "owned" | "shared" | "public" | "private"; label: string }> = [
    { id: "all", label: "All" },
    { id: "owned", label: "Owned" },
    { id: "shared", label: "Shared" },
    { id: "public", label: "Public" },
    { id: "private", label: "Private" },
  ];

  return (
    <>
      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        setWorkspaces={setWorkspaces}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full w-fit mb-6 shadow-sm border border-stone-100">
            <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">System Live</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-stone-900 mb-6 leading-[1.1]">
            Create flow,<br />
            <span className="text-stone-300 italic">not friction.</span>
          </h1>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="h-14 px-8 rounded-full bg-[#1c1917] text-white text-lg font-medium hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 shadow-xl shadow-stone-900/20"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
              New Workspace
            </button>
          </div>
        </div>

        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Overview & Continuity Widget */}
          <div className="bg-white border border-stone-100 rounded-[48px] p-10 shadow-sm flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity className="w-32 h-32" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center text-white shadow-xl shadow-stone-900/20">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-stone-900 tracking-tight">Recent Continuity</h3>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-0.5">Pick up where you left off</p>
                </div>
              </div>

              <div className="space-y-4">
                {filteredWorkspaces.slice(0, 3).map((ws, i) => (
                  <Link 
                    key={ws.workspace_id} 
                    href={`/workspace/${ws.workspace_id}`}
                    className="flex items-center justify-between p-4 rounded-3xl hover:bg-stone-50 border border-transparent hover:border-stone-100 transition-all group/item"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 group-hover/item:bg-white group-hover/item:text-stone-900 transition-colors shadow-sm">
                        <FolderPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-900 group-hover/item:text-stone-700">{ws.workspace_title}</p>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tight">
                          {ws.workspace_visibility} • {i === 0 ? 'Active Now' : 'Modified recently'}
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-stone-300 group-hover/item:text-stone-900 group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 transition-all" />
                  </Link>
                ))}
                {filteredWorkspaces.length === 0 && (
                  <p className="text-stone-400 text-sm italic p-4">No recent workspaces for this filter.</p>
                )}
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-stone-50 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-2xl font-mono text-stone-900 leading-none">{ownedWorkspaceCount}</p>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">Owned</p>
                </div>
                <div className="w-px h-8 bg-stone-100"></div>
                <div>
                  <p className="text-2xl font-mono text-stone-900 leading-none">{workspaces.length - ownedWorkspaceCount}</p>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">Shared</p>
                </div>
              </div>
              <Link href="/search" className="text-xs font-bold text-stone-900 uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all">
                Global Search <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Profile Summary Widget */}
          <div className="bg-[#1c1917] rounded-[48px] p-10 text-white shadow-2xl shadow-stone-900/40 relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute bottom-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
              <Users className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-lime-400 font-bold">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium tracking-tight">Profile Summary</h3>
                    <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mt-1">Account Snapshot</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                  <span className="text-[10px] font-black tracking-widest uppercase text-stone-400">Live Insights</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-2">Creator</p>
                  <p className="text-xl font-semibold text-white leading-tight truncate">{profileSummary.displayName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default">
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-1">Workspaces</p>
                    <p className="text-2xl font-mono text-white leading-none">{workspaces.length}</p>
                    <p className="text-[9px] text-stone-400 mt-2 italic">Total Spaces</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default">
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-1">Network</p>
                    <p className="text-2xl font-mono text-white leading-none">{workspaces.length - ownedWorkspaceCount}</p>
                    <p className="text-[9px] text-stone-400 mt-2 italic flex items-center gap-1">
                      <Users className="w-3 h-3" /> Shared Spaces
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default">
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-1">References</p>
                    <p className="text-2xl font-mono text-white leading-none">{profileSummary.referencesCount}</p>
                    <p className="text-[9px] text-stone-400 mt-2 italic flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Added by You
                    </p>
                  </div>
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default">
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-1">Followers</p>
                    <p className="text-2xl font-mono text-white leading-none">{profileSummary.followersCount}</p>
                    <p className="text-[9px] text-stone-400 mt-2 italic">Following {profileSummary.followingCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-10 px-2 mt-8">
        <div>
          <h2 className="text-3xl font-medium text-stone-900 tracking-tight">Your Workspaces</h2>
          <p className="text-stone-400 text-sm mt-1">Select a space to start organizing references.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2 rounded-2xl border border-stone-200 bg-white p-1">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveWorkspaceFilter(option.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  activeWorkspaceFilter === option.id
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Total Assets</span>
            <span className="text-xl font-mono text-stone-900">{workspaces.length}</span>
          </div>
          <div className="h-10 w-px bg-stone-100 hidden md:block"></div>
          <button className="p-3 bg-white border border-stone-200 rounded-2xl hover:bg-stone-50 transition-colors shadow-sm">
            <Users className="w-5 h-5 text-stone-600" />
          </button>
        </div>
      </div>

      <div className="lg:hidden mb-8 px-2">
        <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-1">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveWorkspaceFilter(option.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${
                activeWorkspaceFilter === option.id
                  ? "bg-stone-900 text-white"
                  : "text-stone-500 hover:bg-stone-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filteredWorkspaces.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredWorkspaces.map((workspace, index) => {
          const isOwner = workspace.workspace_owner_id === user?.id;
          return (
            <WorkspaceCard
              key={workspace.workspace_id || `workspace-${index}`}
              id={workspace.workspace_id}
              title={workspace.workspace_title}
              description={workspace.workspace_description || ""}
              coverImage={workspace.workspace_cover_image || placeholderImages[index % placeholderImages.length]}
              category={workspace.workspace_category || "General"}
              categoryEmoji={workspace.workspace_category_emoji || "📁"}
              likes={0}
              showAuthor={true}
              author={isOwner && user ? {
                id: user.id,
                name: profileSummary.displayName,
                avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100",
              } : undefined}
              updatedAt={new Date(workspace.workspace_created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              isOwner={isOwner}
              visibility={workspace.workspace_visibility}
            />
          );
        })}
      </div>
      ) : workspaces.length > 0 ? (
        <div className="mt-8 bg-white/40 backdrop-blur-xl rounded-[40px] p-16 text-center border border-dashed border-stone-100 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-stone-50 flex items-center justify-center text-stone-200">
            <FolderPlus className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-stone-900 mb-2 tracking-tight">Focus your scope</h3>
            <p className="text-stone-400 text-sm max-w-xs mx-auto leading-relaxed">We couldn't find any {activeWorkspaceFilter} workspaces matching your criteria. Try adjusting your filters.</p>
          </div>
          <button 
            onClick={() => setActiveWorkspaceFilter('all')}
            className="text-xs font-black uppercase tracking-[0.2em] text-stone-900 hover:text-lime-600 transition-colors"
          >
            Clear Selected Filters
          </button>
        </div>
      ) : null}

      {workspaces.length === 0 && (
        <div className="mt-12 bg-white rounded-[48px] p-12 text-center border border-dashed border-stone-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-lime-300 via-green-400 to-emerald-500"></div>

          <div className="inline-flex justify-center items-center w-20 h-20 bg-stone-50 rounded-full mb-6 text-stone-300">
            <FolderPlus className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-medium text-stone-900 mb-2">No workspaces yet</h3>
          <p className="text-stone-500 mb-8 max-w-md mx-auto">
            {isRefreshingWorkspaces
              ? "Loading your workspaces..."
              : clientFetchError
                ? `Could not load workspaces: ${clientFetchError}`
                : "Create your first workspace to start organizing your references in a flow state."}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-3 rounded-full border-2 border-stone-900 text-stone-900 font-bold hover:bg-stone-900 hover:text-white transition-all duration-300"
          >
            Create Workspace
          </button>
        </div>
      )}

      
    </>
  );
}
