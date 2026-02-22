"use client";

interface Collection {
  id: string;
  name: string;
  count: number;
}

interface WorkspaceSidebarProps {
  collections: Collection[];
  tags: string[];
  activeCollection: string | null;
  onCollectionChange: (collectionId: string | null) => void;
  onTagClick?: (tag: string) => void;
}

export function WorkspaceSidebar({
  collections,
  tags,
  activeCollection,
  onCollectionChange,
  onTagClick,
}: WorkspaceSidebarProps) {
  const totalCount = collections.reduce((sum, c) => sum + c.count, 0);

  return (
    <aside className="hidden lg:block sticky top-32 h-fit bg-white rounded-[40px] p-6 shadow-sm border border-stone-100">
      {/* Collections */}
      <div className="mb-8">
        <h3 className="font-bold text-stone-400 uppercase tracking-widest text-xs mb-4 px-2">
          Collections
        </h3>
        <ul className="space-y-2">
          {/* All References */}
          <li>
            <button
              onClick={() => onCollectionChange(null)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-colors ${
                activeCollection === null
                  ? "bg-[#1c1917] text-white shadow-lg shadow-stone-900/10"
                  : "text-stone-600 hover:bg-stone-50 font-medium"
              }`}
            >
              <span className={activeCollection === null ? "font-bold" : ""}>
                All References
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeCollection === null
                    ? "bg-stone-700"
                    : "bg-stone-100 text-stone-400"
                }`}
              >
                {totalCount}
              </span>
            </button>
          </li>

          {/* Individual Collections */}
          {collections.map((collection) => (
            <li key={collection.id}>
              <button
                onClick={() => onCollectionChange(collection.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-colors ${
                  activeCollection === collection.id
                    ? "bg-[#1c1917] text-white shadow-lg shadow-stone-900/10"
                    : "text-stone-600 hover:bg-stone-50 font-medium"
                }`}
              >
                <span className={activeCollection === collection.id ? "font-bold" : ""}>
                  {collection.name}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeCollection === collection.id
                      ? "bg-stone-700"
                      : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {collection.count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <h3 className="font-bold text-stone-400 uppercase tracking-widest text-xs mb-4 px-2">
            Popular Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                onClick={() => onTagClick?.(tag)}
                className="px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-200 cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
