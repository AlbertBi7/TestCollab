import { Sidebar } from "@/components/navigation/Sidebar"; // Using your existing component
import { UserNav } from "@/components/navigation/UserNav"; // Using your existing component

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* 1. The Sidebar (Left) */}
      <aside className="hidden w-64 border-r bg-white md:block">
        <Sidebar />
      </aside>

      {/* 2. Main Content Area (Right) */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header for Mobile & User Profile */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <div className="font-bold text-xl md:hidden">Collabio</div>
          
          {/* Push UserNav to the far right */}
          <div className="ml-auto flex items-center gap-4">
            <UserNav />
          </div>
        </header>

        {/* The Page Content (e.g., Dashboard, Workspace) */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}