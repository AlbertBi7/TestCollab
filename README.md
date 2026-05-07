# Collabio

> A real-time collaborative workspace for organizing, sharing, and discussing references in one place.

Collabio is a full-stack collaboration platform where creators and teams can collect links, files, and media, organize them into folders and tags, and communicate in real time within shared workspaces.

The platform solves the problem of fragmented collaboration by combining reference management, communication, and discovery into a single system.

---

# Features

## Real-Time Collaboration
- Live workspace updates using Supabase Realtime
- Instant chat messaging inside workspaces
- Real-time notifications and invite updates
- Presence tracking for online members

## Workspace Management
- Create public or private workspaces
- Role-based access control (Owner / Member / Viewer)
- Archive and manage workspaces
- Activity logging for workspace actions

## Reference Management
- Upload files or import references using URLs
- Automatic metadata extraction from imported links
- Support for images, videos, audio, documents, and external links
- Organize references using folders and tags
- Search, sort, filter, and group references dynamically

## Community & Discovery
- Explore public workspaces and creators
- Follow creators and discover collaborators
- Fuzzy search across users, workspaces, and references

---

# Tech Stack

## Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- Lucide React
- Radix UI

## Backend / Services
- Supabase Authentication
- Supabase PostgreSQL Database
- Supabase Realtime
- Supabase Storage

## Utilities
- Fuse.js
- date-fns
- clsx
- tailwind-merge

---

# Architecture Overview

Collabio follows a hybrid rendering architecture using Next.js App Router.

```text
Frontend (Next.js + Zustand)
        ↓
Supabase (Auth + Database + Realtime + Storage)
        ↓
Realtime updates across connected users
```

### Key Design Decisions
- Server-side rendering for initial data fetch
- Client-side hydration for interactive workflows
- Optimistic UI updates for smooth UX
- Realtime synchronization using WebSockets
- Direct Supabase SDK integration without unnecessary backend layers

---

# Installation

## Clone the Repository

```bash
git clone <repository-url>
cd collabio
```

## Install Dependencies

```bash
npm install
```

## Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Start Development Server

```bash
npm run dev
```

---

# Available Scripts

```bash
npm run dev     # Start development server
npm run build   # Create production build
npm run start   # Start production server
npm run lint    # Run ESLint
```

---

# Future Improvements

- AI-powered reference tagging
- Smart collaborator recommendations
- Semantic search
- AI-generated summaries for imported content
- Workspace analytics and insights

---

# Contributors

Developed by Albert Biju and team.

---

# License

This project is intended for educational and portfolio purposes.
