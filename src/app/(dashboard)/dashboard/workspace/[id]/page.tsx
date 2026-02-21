"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase"; // <--- NOW USING SUPABASE
import { 
  Search, LayoutDashboard, LayoutGrid, 
  Plus, Pencil, Layers, ChevronDown, FolderOpen, UserPlus
} from "lucide-react";
import { ClusterView } from "@/components/workspace/ClusterView";
import { GridView } from "@/components/workspace/GridView";
import { AddReferenceModal } from "@/components/workspace/AddReferenceModal";

export default function WorkspacePage() {
  const { id } = useParams(); // This is the workspace_id
  const [workspace, setWorkspace] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [view, setView] = useState<"cluster" | "grid">("cluster");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Fetch Workspace & References from Supabase
  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);

        // Run both queries in parallel for speed
        const [workspaceResponse, filesResponse] = await Promise.all([
          // Query 1: Get Workspace Details
          supabase
            .from('workspaces')
            .select('*')
            .eq('workspace_id', id)
            .single(),

          // Query 2: Get Files (References)
          supabase
            .from('references')
            .select('*')
            .eq('workspace_id', id)
            .order('reference_created_at', { ascending: false })
        ]);

        if (workspaceResponse.error) throw workspaceResponse.error;
        if (filesResponse.error) throw filesResponse.error;

        setWorkspace(workspaceResponse.data);
        setFiles(filesResponse.data || []);

      } catch (err) {
        console.error("Error loading workspace:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // 2. Handle New File (Optimistic Update)
  // This is passed to the modal so the UI updates instantly after upload
  const handleAddFile = (newFile: any) => {
    setFiles((prev) => [newFile, ...prev]);
    setToastMessage("Reference Added Successfully");
    setView('grid'); // Switch to grid so user sees the new file
    setTimeout(() => setToastMessage(""), 3000);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-stone-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-stone-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!workspace) return <div className="p-8 text-center text-stone-500">Workspace not found</div>;

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-2rem)] grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
      
      {/* Toast Notification */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1c1917] text-white px-6 py-3 rounded-full shadow-xl transition-all duration-300 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        {toastMessage}
      </div>

      <AddReferenceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        
        workspaceId={id as string} // Pass the ID so the modal knows where to save
      />

      {/* --- LEFT PANEL --- */}
      <aside className="hidden lg:block sticky top-0 h-full bg-white rounded-[40px] p-6 shadow-sm overflow-y-auto border border-stone-100">
         <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="font-bold text-stone-400 uppercase tracking-widest text-xs">Library</h3>
            <button className="w-8 h-8 rounded-full bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-600 transition-colors">
                <Plus className="w-4 h-4" />
            </button>
         </div>

         <ul className="space-y-2">
            <li>
                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1c1917] text-white shadow-lg shadow-stone-900/10 hover:scale-105 transition-transform origin-left">
                    <Layers className="w-5 h-5 text-[#d9f99d]" />
                    <span className="font-medium">All References</span>
                </a>
            </li>
            
            <li className="pt-4">
               <div className="flex items-center gap-2 px-4 py-2 text-stone-900 font-medium cursor-pointer hover:bg-stone-50 rounded-xl select-none">
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                  <FolderOpen className="w-5 h-5 text-lime-600" />
                  Campaign Assets
               </div>
               <ul className="pl-10 mt-1 space-y-1">
                  <li className="flex items-center gap-2 py-2 text-sm text-stone-500 hover:text-stone-900 cursor-pointer">
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-300"></span> Inspiration
                  </li>
                  <li className="flex items-center gap-2 py-2 text-sm text-stone-500 hover:text-stone-900 cursor-pointer">
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-300"></span> Guidelines
                  </li>
               </ul>
            </li>
         </ul>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex flex-col h-full relative overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-white rounded-[40px] p-8 mb-6 shadow-sm border border-stone-100 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-4xl font-semibold text-stone-900 flex items-center gap-3">
                            {workspace.workspace_title} {/* Use DB column name */}
                        </h1>
                        <button className="p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-colors">
                            <Pencil className="w-4 h-4" />
                        </button>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border cursor-pointer select-none ${workspace.workspace_visibility === 'public' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                            {workspace.workspace_visibility || 'Private'} {/* Use DB column name */}
                        </div>
                    </div>
                    <p className="text-stone-500 max-w-2xl leading-relaxed">
                        {workspace.workspace_description || "Collection of assets and ideas."}
                    </p>
                </div>

                {/* MEMBERS */}
                <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center -space-x-3">
                        {/* Static placeholders for now */}
                        <div className="w-10 h-10 rounded-full bg-stone-200 border-2 border-white"></div>
                        <div className="w-10 h-10 rounded-full bg-stone-300 border-2 border-white"></div>
                        <div className="w-10 h-10 rounded-full bg-stone-100 border-2 border-white flex items-center justify-center text-xs font-bold text-stone-500">+</div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setToastMessage("Invitation Copied")} className="px-5 py-2.5 rounded-full bg-[#1c1917] text-white text-sm font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> Invite
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
                     <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                        <input type="text" placeholder="Filter..." className="pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-lime-200 w-40 transition-all focus:w-60" />
                     </div>
                     <div className="h-8 w-[1px] bg-stone-200 mx-1"></div>
                     
                     <div className="flex bg-white rounded-full border border-stone-200 p-1">
                         <button onClick={() => setView('cluster')} className={`p-2 rounded-full transition-all ${view === 'cluster' ? 'bg-stone-100 text-stone-900' : 'text-stone-400'}`}><LayoutDashboard className="w-4 h-4" /></button>
                         <button onClick={() => setView('grid')} className={`p-2 rounded-full transition-all ${view === 'grid' ? 'bg-stone-100 text-stone-900' : 'text-stone-400'}`}><LayoutGrid className="w-4 h-4" /></button>
                     </div>
                </div>
            </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 relative overflow-y-auto">
            {/* Pass actual fetched files to the views */}
            {view === 'cluster' ? <ClusterView /> : <GridView files={files} />}
        </div>

        {/* Floating Add Button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-tr from-lime-400 to-green-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-lime-500/40 hover:scale-110 hover:rotate-90 transition-all duration-500 z-30"
        >
          <Plus className="w-8 h-8" />
        </button>

      </main>
    </div>
  );
}