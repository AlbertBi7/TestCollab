"use client";

import { useState, useRef } from "react";
import { X, Link as LinkIcon, Upload, Loader2 } from "lucide-react";
import { db, auth, storage } from "@/lib/firebase"; // <--- Import storage
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // <--- Storage functions

interface AddReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function AddReferenceModal({ isOpen, onClose, workspaceId }: AddReferenceModalProps) {
  const [activeTab, setActiveTab] = useState<'link' | 'upload'>('upload');
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState(""); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Store the actual file object
  const [previewUrl, setPreviewUrl] = useState<string>(""); 
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file); // Keep the file for uploading later
      
      // Create a local preview just for the UI
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setTitle(file.name);
    }
  };

  const handleSubmit = async () => {
    if (!title) return;
    if (activeTab === 'upload' && !selectedFile) return;
    if (activeTab === 'link' && !linkUrl) return;

    if (!workspaceId) {
      alert("Error: Workspace ID is missing");
      return;
    }
  // ... rest of the function
    setLoading(true);

    try {
      let finalUrl = linkUrl;
      let finalType = 'link';

      // 1. IF UPLOADING: Send file to Firebase Storage first
      if (activeTab === 'upload' && selectedFile) {
        finalType = 'image';
        
        // Create a reference (folder path: workspaces/workspaceId/filename)
        const storageRef = ref(storage, `workspaces/${workspaceId}/${Date.now()}_${selectedFile.name}`);
        
        // Upload the file
        const snapshot = await uploadBytes(storageRef, selectedFile);
        
        // Get the public URL
        finalUrl = await getDownloadURL(snapshot.ref);
      }

      // 2. SAVE DATA TO FIRESTORE (using the URL we just got)
      await addDoc(collection(db, "workspaces", workspaceId, "references"), {
        title: title,
        type: finalType,
        url: finalUrl, // This is now a short Firebase URL, not a huge text string!
        author: auth.currentUser?.email?.split('@')[0] || "User",
        createdAt: serverTimestamp(),
      });

      // Reset and Close
      setTitle("");
      setLinkUrl("");
      setPreviewUrl("");
      setSelectedFile(null);
      onClose();

    } catch (error) {
      console.error("Error adding reference:", error);
      alert("Failed to add reference");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-lg rounded-[32px] p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-stone-900">Add New Reference</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900"><X className="w-6 h-6" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-stone-100 mb-6">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'upload' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400'}`}
          >
            Upload
          </button>
          <button 
            onClick={() => setActiveTab('link')}
            className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'link' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400'}`}
          >
            Link
          </button>
        </div>

        <div className="space-y-5">
          {activeTab === 'upload' ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors h-48 overflow-hidden relative"
            >
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              
              {previewUrl ? (
                <img src={previewUrl} className="h-full w-full object-contain" />
              ) : (
                <>
                  <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-stone-600">Click to upload image</p>
                </>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">URL</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/image.png" 
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-all font-medium text-stone-900" 
                />
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              </div>
            </div>
          )}

          <div>
             <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Title</label>
             <input 
               type="text" 
               value={title} 
               onChange={(e) => setTitle(e.target.value)}
               placeholder="e.g. Moodboard V1"
               className="w-full px-4 py-3 rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-all font-bold text-stone-900" 
             />
          </div>

          <div className="flex gap-3 pt-2">
            <button disabled={loading} onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50 transition-colors">Cancel</button>
            <button 
              disabled={loading} 
              onClick={handleSubmit} 
              className="flex-1 py-3.5 rounded-xl bg-[#1c1917] text-white font-bold hover:bg-stone-800 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Reference"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}