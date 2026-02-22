"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Element */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 z-[100] min-w-[250px] bg-[#1c1917] text-white text-center rounded-full px-6 py-4 font-bold shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all duration-500 ${
          toast.visible
            ? "bottom-8 opacity-100"
            : "bottom-0 opacity-0 pointer-events-none"
        }`}
      >
        {toast.message}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
