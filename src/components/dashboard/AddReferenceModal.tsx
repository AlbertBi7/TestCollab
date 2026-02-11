"use client";

import { useState, useRef } from "react";
import { X, Link as LinkIcon, Upload, Image as ImageIcon } from "lucide-react";

interface AddReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (file: any) => void; // Pass data back to parent
}

export function AddReferenceModal({ isOpen, onClose, onAdd }: AddReferenceModalProps) {
  const [activeTab, setActiveTab] = useState<'link' | 'upload'>('upload');
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Create local preview
      setTitle(file.name);
    }
  };

  const handleSubmit = () => {
    // Create a mock object
    const newFile = {
      id: Math.random().toString(),
      title: title || "Untitled",
      type: "image",
      url: previewUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
      author: "You",
      date: "Just now"
    };
    
    onAdd(newFile);
    onClose();
    // Reset
    setTitle("");
    setSelectedFile(null);
    setPreviewUrl("");
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
              className="border-2 border-dashed border-stone-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors h-48"
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
                <input type="text" placeholder="https://..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-all font-medium text-stone-900" />
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
            <button onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50 transition-colors">Cancel</button>
            <button onClick={handleSubmit} className="flex-1 py-3.5 rounded-xl bg-[#1c1917] text-white font-bold hover:bg-stone-800 transition-colors shadow-lg hover:shadow-xl">Add Reference</button>
          </div>
        </div>
      </div>
    </div>
  );
}