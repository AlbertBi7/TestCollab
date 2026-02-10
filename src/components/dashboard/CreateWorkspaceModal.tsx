"use client";

import { useState } from "react";
import { X, Loader2, Lock, Globe } from "lucide-react"; // Import icons for privacy
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  setWorkspaces?: React.Dispatch<React.SetStateAction<any[]>>; 
}

export function CreateWorkspaceModal({ isOpen, onClose, setWorkspaces }: ModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"private" | "public">("private"); // New State
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !auth.currentUser) return;

    // 1. OPTIMISTIC UPDATE: Create a fake "temp" workspace immediately
    const tempId = Math.random().toString();
    const newWorkspace = {
      id: tempId,
      title: name,
      description: description,
      type: privacy, // Use the selected privacy
      members: [auth.currentUser.uid],
      createdAt: new Date(), 
      coverImage: `https://images.unsplash.com/photo-${privacy === 'private' ? '1506784983877-45594efa4cbe' : '1618005182384-a83a8bd57fbe'}?auto=format&fit=crop&q=80&w=800` 
    };

    // Update the list INSTANTLY
    if (setWorkspaces) {
      setWorkspaces((prev) => [newWorkspace, ...prev]);
    }
    
    // Close modal INSTANTLY
    onClose(); 
    
    // Reset form for next time
    setName("");
    setDescription("");
    setPrivacy("private");

    try {
      // 2. Send to Firebase in background
      await addDoc(collection(db, "workspaces"), {
        title: name,
        description: description,
        type: privacy, // Save privacy setting
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        members: [auth.currentUser.uid],
        coverImage: newWorkspace.coverImage
      });

    } catch (error) {
      console.error("Error creating workspace:", error);
      // Rollback if failed (optional, but good practice)
      if (setWorkspaces) {
        setWorkspaces((prev) => prev.filter(w => w.id !== tempId));
      }
      alert("Failed to save workspace.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 relative">
        
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-stone-100 transition-colors">
          <X className="w-5 h-5 text-stone-500" />
        </button>

        <h2 className="text-2xl font-bold text-stone-900 mb-2">Create Workspace</h2>
        <p className="text-stone-500 mb-6">Start a new collection for your project.</p>

        <form onSubmit={handleCreate} className="space-y-5">
          
          {/* 1. Workspace Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 ml-3">Workspace Name</label>
            <input 
              autoFocus
              type="text" 
              placeholder="e.g., Q4 Marketing Campaign" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3 bg-stone-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-stone-900 focus:outline-none transition-all font-medium text-stone-900 placeholder:text-stone-400"
              required
            />
          </div>

          {/* 2. Privacy Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 ml-3">Privacy</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPrivacy("private")}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                  privacy === "private" 
                    ? "border-stone-900 bg-stone-900 text-white" 
                    : "border-stone-100 bg-stone-50 text-stone-500 hover:bg-stone-100"
                }`}
              >
                <Lock className="w-4 h-4" />
                Private
              </button>
              <button
                type="button"
                onClick={() => setPrivacy("public")}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                  privacy === "public" 
                    ? "border-lime-500 bg-lime-500 text-white" 
                    : "border-stone-100 bg-stone-50 text-stone-500 hover:bg-stone-100"
                }`}
              >
                <Globe className="w-4 h-4" />
                Public
              </button>
            </div>
            <p className="text-[10px] text-stone-400 font-medium ml-3 mt-1">
              {privacy === "private" 
                ? "Only you and invited members can view this." 
                : "Anyone with the link can view this workspace."}
            </p>
          </div>

          {/* 3. Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 ml-3">Description</label>
            <textarea 
              placeholder="What is this workspace for?" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-5 py-3 bg-stone-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-stone-900 focus:outline-none transition-all font-medium text-stone-900 resize-none placeholder:text-stone-400"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-100 transition-colors">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-3 bg-[#1c1917] text-white rounded-xl font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-stone-900/10"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}