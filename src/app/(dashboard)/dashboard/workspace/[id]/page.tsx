"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { 
  Search, ArrowUpDown, LayoutDashboard, LayoutGrid, 
  Plus, Pencil, Layers, ChevronDown, FolderOpen, ChevronRight, Folder,
  UserPlus, Settings
} from "lucide-react";
import { ClusterView } from "@/components/workspace/ClusterView"; // We will create this
import { GridView } from "@/components/workspace/GridView";       // We will create this

export default function WorkspacePage() {
  const { id } = useParams(); // Get ID from URL
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"cluster" | "grid">("cluster");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // 1. Fetch Workspace Data
  useEffect(() => {
    if (!id) return;
    const fetchWorkspace = async () => {
      const docRef = doc(db, "workspaces", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setWorkspace({ id: docSnap.id, ...docSnap.data() });
        setNewTitle(docSnap.data().title);
      } else {
        console.log("No such workspace!");
      }
      setLoading(false);
    };
    fetchWorkspace();
  }, [id]);

  // 2. Update Title Function
  const handleTitleUpdate = async () => {
    if (!workspace || !newTitle.trim()) return;
    setIsEditingTitle(false);
    
    // Optimistic update
    setWorkspace((prev: any) => ({ ...prev, title: newTitle }));
    
    // Firebase update
    const docRef = doc(db, "workspaces", workspace.id);
    await updateDoc(docRef, { title: newTitle });
  };

  if (loading) return <div className="p-8">Loading workspace...</div>;
  if (!workspace) return <div className="p-8">Workspace not found.</div>;

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-2rem)] grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
      
      {/* --- LEFT SIDEBAR (Static for now) --- */}
      <aside className="hidden lg:block sticky top-0 h-full bg-white rounded-[40px] p-6 shadow-sm overflow-y-auto border border-stone-100">
         {/* ... (Keep your sidebar code here, simplified) ... */}
         <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="font-bold text-stone-400 uppercase tracking-widest text-xs">Library</h3>
            <button className="w-8 h-8 rounded-full bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-600 transition-colors">
                <Plus className="w-4 h-4" />
            </button>
         </div>
         <ul className="space-y-2">
            <li>
                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1c1917] text-white shadow-lg shadow-stone-900/10">
                    <Layers className="w-5 h-5 text-[#d9f99d]" />
                    <span className="font-medium">All References</span>
                </a>
            </li>
            {/* Add more sidebar items if needed */}
         </ul>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex flex-col h-full relative overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-white rounded-[40px] p-8 mb-6 shadow-sm border border-stone-100">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                        {isEditingTitle ? (
                            <input 
                                autoFocus
                                className="text-4xl font-semibold text-stone-900 outline-none border-b-2 border-stone-900 bg-transparent w-full"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onBlur={handleTitleUpdate}
                                onKeyDown={(e) => e.key === 'Enter' && handleTitleUpdate()}
                            />
                        ) : (
                            <h1 className="text-4xl font-semibold text-stone-900 flex items-center gap-3">
                                {workspace.title}
                            </h1>
                        )}
                        
                        <button onClick={() => setIsEditingTitle(true)} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-colors">
                            <Pencil className="w-4 h-4" />
                        </button>
                        
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border cursor-pointer select-none
                            ${workspace.type === 'public' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-stone-100 text-stone-600 border-stone-200'}`}
                        >
                            {workspace.type || 'Private'}
                        </div>
                    </div>
                    <p className="text-stone-500 max-w-2xl leading-relaxed">
                        {workspace.description || "No description provided."}
                    </p>
                </div>

                {/* MEMBERS & ACTIONS */}
                <div className="flex flex-col items-end gap-4">
                     {/* Placeholder Members */}
                    <div className="flex items-center -space-x-3">
                        <div className="w-10 h-10 rounded-full bg-stone-200 border-2 border-white"></div>
                        <div className="w-10 h-10 rounded-full bg-stone-300 border-2 border-white"></div>
                        <div className="w-10 h-10 rounded-full bg-stone-100 border-2 border-white flex items-center justify-center text-xs font-bold text-stone-500">+1</div>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-5 py-2.5 rounded-full bg-[#1c1917] text-white text-sm font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> Invite
                        </button>
                        <button className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50 transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* TOOLBAR */}
            <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-1 bg-stone-100/50 p-1 rounded-full">
                    <button className="px-6 py-2 rounded-full bg-white shadow-sm text-sm font-bold text-stone-900">References</button>
                    <button className="px-6 py-2 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900">Activity</button>
                </div>

                <div className="flex items-center gap-3">
                     {/* View Toggles */}
                     <div className="flex bg-white rounded-full border border-stone-200 p-1">
                         <button 
                            onClick={() => setView('cluster')} 
                            className={`p-2 rounded-full transition-all ${view === 'cluster' ? 'bg-stone-100 text-stone-900' : 'text-stone-400'}`}
                         >
                            <LayoutDashboard className="w-4 h-4" />
                         </button>
                         <button 
                            onClick={() => setView('grid')} 
                            className={`p-2 rounded-full transition-all ${view === 'grid' ? 'bg-stone-100 text-stone-900' : 'text-stone-400'}`}
                         >
                            <LayoutGrid className="w-4 h-4" />
                         </button>
                     </div>
                </div>
            </div>
        </header>

        {/* CONTENT AREA */}
        {view === 'cluster' ? <ClusterView /> : <GridView />}

      </main>
    </div>
  );
}