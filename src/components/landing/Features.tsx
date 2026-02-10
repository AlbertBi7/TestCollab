import { LayoutGrid, Zap, Users, Lock } from "lucide-react";

export function Features() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 mb-32">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-stone-900 mb-4">Everything you need to flow.</h2>
        <p className="text-stone-500 text-lg max-w-2xl mx-auto">Collabio replaces your scattered bookmarks and folders with a single, visual workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeatureCard 
          icon={<LayoutGrid className="w-7 h-7" />} 
          color="bg-lime-100 text-lime-700"
          title="Visual Cluster View"
          desc="Break free from lists. Organize your files, links, and assets in intuitive clusters that mimic how your brain works."
        />
        <FeatureCard 
          icon={<Zap className="w-7 h-7" />} 
          color="bg-emerald-100 text-emerald-700"
          title="Instant Capture"
          desc="Paste a URL, and we'll handle the rest. We automatically detect metadata, generate previews, and sort into folders."
        />
        <FeatureCard 
          icon={<Users className="w-7 h-7" />} 
          color="bg-sky-100 text-sky-700"
          title="Real-time Collaboration"
          desc="Work together in harmony. See who is viewing what with live cursors and instant updates across your team."
        />
        <FeatureCard 
          icon={<Lock className="w-7 h-7" />} 
          color="bg-orange-100 text-orange-700"
          title="Private & Public Spaces"
          desc="Keep your client work secure in private vaults, or toggle 'Public' to share your moodboard with the world."
        />
      </div>
    </section>
  );
}

// Simple internal component for the cards
function FeatureCard({ icon, color, title, desc }: any) {
  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group border border-stone-100">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-stone-900 mb-3">{title}</h3>
      <p className="text-stone-500 leading-relaxed">{desc}</p>
    </div>
  );
}