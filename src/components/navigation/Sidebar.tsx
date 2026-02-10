import Link from "next/link"
import { LayoutGrid, Compass, Settings } from "lucide-react" // Icons

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-gray-50 h-screen p-4">
      <nav className="space-y-2">
        <Link href="/" className="flex items-center gap-2 p-2 hover:bg-gray-200 rounded">
           <LayoutGrid size={20} /> Dashboard
        </Link>
        <Link href="/explore" className="flex items-center gap-2 p-2 hover:bg-gray-200 rounded">
           <Compass size={20} /> Explore
        </Link>
      </nav>
    </aside>
  )
}