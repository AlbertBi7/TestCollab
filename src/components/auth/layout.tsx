import { Infinity } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#F2F2F0] text-[#1c1917]">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#d9f99d] rounded-full blur-[80px] opacity-60 animate-blob z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#bef264] rounded-full blur-[80px] opacity-60 animate-blob animation-delay-2000 z-0"></div>

      {/* Glass Container */}
      <div className="bg-white/80 backdrop-blur-xl w-full max-w-[500px] rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-white/50 relative z-10 overflow-hidden">
        
        {/* Header Icon */}
        <div className="pt-10 pb-2 px-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1c1917] rounded-full text-[#d9f99d] mb-6 shadow-lg shadow-stone-900/20">
            <Infinity className="w-6 h-6" />
          </div>
        </div>

        {/* The Login or Signup Form goes here */}
        {children}
        
      </div>
    </div>
  );
}