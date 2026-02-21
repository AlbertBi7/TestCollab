"use client";

import { useState, useRef } from "react";
import { X, Link as LinkIcon, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Import Supabase
import { useAuth } from "@/hooks/useAuth"; // Get current user

interface AddReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (file: any) => void;
  workspaceId: string; // <--- REQUIRED: We need to know where to attach the file
}

export function AddReferenceModal({ isOpen, onClose, onAdd, workspaceId }: AddReferenceModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'link' | 'upload'>('upload');
  
  // Form State
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState(""); // For "Link" tab
  
  // File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  
  // UI State
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); 
      setTitle(file.name.split('.')[0]); // Auto-fill title from filename
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setUploading(true);

    try {
      let finalUrl = linkUrl;
      let finalType = 'link';
      let metadata = {};

      // 1. HANDLE FILE UPLOAD (If using Upload Tab)
      if (activeTab === 'upload' && selectedFile) {
        finalType = 'image';
        
        // A. Create unique filename: workspace_id/timestamp_filename
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${workspaceId}/${fileName}`;

        // B. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('workspace-files') // Ensure this bucket exists!
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        // C. Get the Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('workspace-files')
          .getPublicUrl(filePath);
        
        finalUrl = publicUrl;
        metadata = { size: selectedFile.size, type: selectedFile.type };
      }

      // 2. INSERT INTO DATABASE (references table)
      const { data: newReference, error: dbError } = await supabase
        .from('references')
        .insert({
          workspace_id: workspaceId,
          uploaded_by_profile_id: user.id,
          reference_title: title || "Untitled",
          reference_type: finalType,
          reference_url: finalUrl,
          reference_metadata: metadata
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 3. UPDATE UI
      onAdd(newReference); // Pass the real DB row back to the parent
      handleClose();

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload reference. Check console for details.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Reset state before closing
    setTitle("");
    setLinkUrl("");
    setSelectedFile(null);
    setPreviewUrl("");
    setUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={handleClose}></div>
      <div className="bg-white w-full max-w-lg rounded-[32px] p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-stone-900">Add New Reference</h2>
          <button onClick={handleClose} className="text-stone-400 hover:text-stone-900"><X className="w-6 h-6" /></button>
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
              className={`border-2 border-dashed border-stone-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors h-48 ${uploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              
              {previewUrl ? (
                <img src={previewUrl} className="h-full w-full object-contain rounded-lg" />
              ) : (
                <>
                  <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-stone-600">Click to upload image</p>
                  <p className="text-xs text-stone-400 mt-1">PNG, JPG, GIF up to 10MB</p>
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
                  placeholder="https://..." 
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
            <button 
                onClick={handleClose} 
                disabled={uploading}
                className="flex-1 py-3.5 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
                Cancel
            </button>
            <button 
                onClick={handleSubmit} 
                disabled={uploading || (activeTab === 'upload' && !selectedFile) || (activeTab === 'link' && !linkUrl)}
                className="flex-1 py-3.5 rounded-xl bg-[#1c1917] text-white font-bold hover:bg-stone-800 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {uploading ? (
                    <>
                        <Loader2 className="animate-spin w-5 h-5" />
                        Uploading...
                    </>
                ) : (
                    "Add Reference"
                )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}