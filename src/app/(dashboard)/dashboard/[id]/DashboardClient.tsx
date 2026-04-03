"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { CreateWorkspaceModal } from "@/components/dashboard/CreateWorkspaceModal";
import { Plus, Bell, ArrowUpRight, Users, FolderPlus, Activity, Zap, Inbox } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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

          {/* Global Impact & Activity Widget */}
          <div className="bg-[#1c1917] rounded-[48px] p-10 text-white shadow-2xl shadow-stone-900/40 relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute bottom-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <Zap className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-lime-400 font-bold">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-medium tracking-tight">Ecosystem Pulse</h3>
                </div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                  <span className="text-[10px] font-black tracking-widest uppercase text-stone-400">Live Insights</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-linear-to-br from-white/10 to-transparent border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Knowledge Growth</span>
                    <span className="text-xs text-lime-400 font-mono">+{userReferencesCount || 0}</span>
                  </div>
                  <h4 className="text-lg font-medium mb-1">Total Assets Captured</h4>
                  <p className="text-xs text-stone-400 leading-relaxed">Your personal contribution to the workspace ecosystem continues to scale.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default">
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-1">Network</p>
                    <p className="text-2xl font-mono text-white leading-none">{workspaces.length - ownedWorkspaceCount}</p>
                    <p className="text-[9px] text-stone-400 mt-2 italic flex items-center gap-1">
                      <Users className="w-3 h-3" /> Shared Spaces
                    </p>
                  </div>
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default">
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-1">Reach</p>
                    <p className="text-2xl font-mono text-white leading-none">{ownedWorkspaceCount * 4 + 2}</p>
                    <p className="text-[9px] text-stone-400 mt-2 italic flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Unique Views
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 px-2">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-[#1c1917] bg-stone-800 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                        <Image 
                          src={`https://i.pravatar.cc/150?u=${i + 20}`} 
                          alt="avatar" 
                          width={32} 
                          height={32}
                          className="opacity-70 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Top Contributors</p>
                </div>
              </div>
            </div>

            <div className="mt-10 relative z-10 flex gap-3">
              <Link
                href="/explore"
                className="flex-1 h-14 rounded-2xl bg-white text-stone-900 font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center hover:bg-lime-400 transition-colors"
              >
                Global Pulse
              </Link>
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
          <div className="h-10 w-[1px] bg-stone-100 hidden md:block"></div>
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
          <Link
            key={workspace.workspace_id || `workspace-${index}`}
            href={`/workspace/${workspace.workspace_id}`}
            className="group bg-white p-4 pb-8 rounded-[48px] hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] transition-all duration-500 cursor-pointer border border-stone-100 hover:border-stone-200 hover:-translate-y-1"
          >
            <div className="aspect-4/3 rounded-4xl overflow-hidden relative mb-6">
              <Image
                src={workspace.workspace_cover_image || placeholderImages[index % placeholderImages.length]}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt={workspace.workspace_title}
              />
              <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-transparent transition-colors duration-500"></div>
              
              <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <button className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-stone-900 border border-stone-200/50 hover:bg-stone-900 hover:text-white transition-colors">
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>

              <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${isOwner ? 'bg-lime-500 text-white' : 'bg-white/90 text-stone-700'}`}>
                {isOwner ? 'Owner' : 'Shared'}
              </span>
            </div>

            <div className="px-3">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-2xl font-medium text-stone-900 group-hover:text-stone-700 transition-colors leading-tight">{workspace.workspace_title}</h3>
                <span className={`mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${workspace.workspace_visibility === 'public' ? 'bg-lime-50 border-lime-200 text-lime-700' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
                  {workspace.workspace_visibility}
                </span>
              </div>
              <p className="text-stone-400 text-sm mb-6 line-clamp-2 min-h-10 leading-relaxed">
                {workspace.workspace_description || 'No description provided for this workspace.'}
              </p>
              <div className="flex items-center justify-between border-t border-stone-50 pt-5">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-tight">
                  <Users className="w-3.5 h-3.5 text-stone-400" />
                  <span>1 Member</span>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-stone-200 border-2 border-white"></div>
                  <div className="w-7 h-7 rounded-full bg-stone-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-stone-400">+</div>
                </div>
              </div>
            </div>
          </Link>
          );
        })}
      </div>
      ) : workspaces.length > 0 ? (
        <div className="mt-8 bg-white rounded-[40px] p-10 text-center border border-dashed border-stone-200">
          <h3 className="text-xl font-medium text-stone-900 mb-2">No matches for this filter</h3>
          <p className="text-stone-500 text-sm">Try switching filters to view other workspaces.</p>
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
