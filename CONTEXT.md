# COLLABIO PROJECT CONTEXT

### 1. Project Overview
Collabio is a visual workspace and reference management platform designed for creatives and teams. It allows users to create themed workspaces, collect references (images, videos, links, documents), organize them into folders and tags, and collaborate in real-time through chat and shared workspace access. It solves the problem of fragmented references across multiple apps by providing a central visual curation hub.

### 2. Tech Stack & Architecture
- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4, PostCSS
- **Database & Auth**: Supabase (@supabase/ssr, @supabase/supabase-js)
- **State Management**: Zustand (Specialized stores for Auth, Workspaces, References, Notifications)
- **Icons**: Lucide React
- **Utilities**: Fuse.js (fuzzy search), date-fns, clsx, tailwind-merge
- **Architecture**: Layered Monolith using Next.js App Router and a Backend-as-a-Service (BaaS) pattern with Supabase.

### 3. Data Flow
1. **Input**: Data enters via UI forms, reference uploads, or URL-based metadata extraction (`/api/import-url`).
2. **Persistence**: State is stored in Supabase PostgreSQL; media is stored in Supabase Storage (`Link-UpWorkpace` bucket).
3. **Synchronization**: DB updates trigger state updates in local Zustand stores for immediate UI feedback.
4. **Real-time Updates**: Supabase Realtime handles live messaging and collaborative notifications.

### 4. All Pages and Routes
- `/` - Landing page with hero section, features, and stats. (Public)
- `/login` - User sign-in page. (Public)
- `/signup` - User registration page. (Public)
- `/auth/callback` - Supabase PKCE auth callback handler. (Public)
- `/dashboard/[id]` - User's main dashboard showing personal and shared workspaces. (Protected)
- `/workspace/[id]` - Main workspace view with references, folders, and chat. (Protected/Public)
- `/workspace/[id]/settings` - Workspace configuration (general settings, members, activity). (Protected/Owner Only)
- `/explore` - Public exploration page for trending workspaces and creators. (Public)
- `/search` - Global search for workspaces, references, and people. (Public/Mixed)
- `/profile/[id]` - Public user profile showing public workspaces and bio. (Public)
- `/profile/setup` - Initial user profile setup and editing. (Protected)
- `/api/import-url` - Backend route for metadata and media extraction from remote URLs. (Protected)

### 5. Core Modules & Responsibilities
- **Workspace Module**: Manages life-cycle, folders, and references using `useWorkspace`.
- **Auth Module**: Lifecycle of user identity via `useAuth` and `middleware.ts`.
- **Reference Extraction**: Logic for parsing and importing external visual assets.
- **Global Search**: Fuzzy search across the platform powered by `Fuse.js`.

### 6. All Features
- **Authentication**: Email/Password login/signup via Supabase Auth.
- **Workspace Management**: Creative flow orchestration with custom visibility and settings.
- **Reference Collection**: Automated metadata extraction from URLs or manual uploads.
- **Dynamic Organization**: Nested folders and multi-select tags.
- **Real-time Collaboration**: Live chat with presence indicators and notifications.
- **Member Permissions**: Role-based access (Owner, Member, Viewer).
- **Activity Tracking**: Audit log of all workspace changes.
- **Global Search**: High-performance fuzzy search across all entities.

### 7. All Components
- **Workspace UI**: Sidebar, Header, Reference Card, Chat Interface.
- **Modals**: Add/Edit Reference, Manage Members, Create Workspace.
- **Utility UI**: Notification Bell, Activity Log Drawer, Tag Manager, Toast notifications.

### 8. All Hooks and Utilities
- **Hooks**: `useAuth`, `useWorkspace`, `useNotifications`, `useFollow`.
- **Stores (Zustand)**: `authStore`, `workspaceStore`, `referencesStore`, `notificationsStore`.
- **Utils**: `getFileTypeFromUrl`, `detectPlatform`, `expandSearchQuery` (Concept map logic).

### 9. Database Tables (Supabase)
- `profiles`, `workspaces`, `workspace_members`, `workspace_folders`, `references`, `messages`, `notifications`, `activity_logs`, `tags`.

### 10. Conventions & Patterns
- **Hooks-First**: Business logic is abstracted into custom hooks.
- **BaaS Integration**: Direct interaction with Supabase using standard CRUD and Realtime SDKs.
- **Styling**: Utility-first CSS using Tailwind 4.
- **State**: Decentralized Zustand stores for modularity.

### 11. Known Issues & Gaps
- Cover images currently use Unsplash placeholders.
- Storage cleanup for deleted references is "best effort".
- Next.js version 16.1.6 is highly experimental/non-standard.
- Complex database joins have simple fallbacks if requested metadata fails to load.
