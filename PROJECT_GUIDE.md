# COLLABIO — PROJECT GUIDE

> A complete technical walkthrough of the Collabio project. Teaches how the entire system works — from stack to data flow to every file's role — without going line-by-line into code.

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Full Tech Stack](#2-full-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Folder and File Structure](#4-folder-and-file-structure)
5. [Data Flow: How Data Moves Through the App](#5-data-flow-how-data-moves-through-the-app)
6. [State Management: Zustand](#6-state-management-zustand)
7. [Database Schema and Relationships](#7-database-schema-and-relationships)
8. [Supabase RLS (Row Level Security)](#8-supabase-rls-row-level-security)
9. [API Routes](#9-api-routes)
10. [Frontend Pages: What Each Page Does](#10-frontend-pages-what-each-page-does)
11. [Key Algorithms and Logic](#11-key-algorithms-and-logic)
12. [Component Architecture](#12-component-architecture)
13. [Performance Decisions](#13-performance-decisions)
14. [How to Explain the Project to Someone](#14-how-to-explain-the-project-to-someone)
15. [Glossary](#15-glossary)

---

## 1. Project Summary

Collabio is a real-time collaborative reference management platform built for teams and solo creators. It lets users create project workspaces, save references (URLs, uploaded files, or links from platforms like YouTube and Spotify), organise them with folders and colour-coded tags, and discuss them in a built-in live chat. Every workspace has role-based access (owner, member, viewer), a complete activity log, and real-time synchronisation so all team members see updates instantly without refreshing. A public explore page makes workspaces and creator profiles discoverable to anyone, even without an account.

---

## 2. Full Tech Stack

### Core Framework

| Package | Version | What it is | Why it is used | Where it appears |
|---|---|---|---|---|
| `next` | 16.1.6 | Full-stack React framework | Provides App Router, server components, API routes, middleware, and image optimisation | Entire app — every page, layout, API route |
| `react` | 19.2.3 | UI library | Component model, hooks, state | Every component and page |
| `react-dom` | 19.2.3 | React DOM renderer | Renders React to the browser | Root layout |
| `typescript` | ^5 | Type system | Type safety across the entire codebase | Every `.ts` and `.tsx` file |

### Database and Auth

| Package | Version | What it is | Why it is used | Where it appears |
|---|---|---|---|---|
| `@supabase/supabase-js` | ^2.95.3 | Supabase JS client | Direct database queries, auth, storage, and realtime subscriptions from the browser | `lib/supabase.ts`, all hooks, all client components |
| `@supabase/ssr` | ^0.6.1 | Supabase SSR helpers | Creates server-side Supabase clients that read cookies (required for server components and middleware) | `middleware.ts`, all server-side `page.tsx` files, dashboard layout |

### State Management

| Package | Version | What it is | Why it is used | Where it appears |
|---|---|---|---|---|
| `zustand` | ^5.0.12 | Lightweight global state | Shares auth, workspace, references, and notification state across components without prop drilling | `lib/stores/*.ts`, all hooks, all client components that read global state |

### Styling

| Package | Version | What it is | Why it is used | Where it appears |
|---|---|---|---|---|
| `tailwindcss` | ^4 | Utility-first CSS framework | All layout, spacing, colour, and responsive styles | Every component |
| `@tailwindcss/postcss` | ^4 | PostCSS plugin for Tailwind v4 | Processes Tailwind CSS via the PostCSS pipeline | `postcss.config.mjs` |
| `clsx` | ^2.1.1 | Conditional class names | Builds class strings with conditionals cleanly | `lib/utils.ts` → `cn()` used in every component |
| `tailwind-merge` | ^3.4.0 | Merges Tailwind class conflicts | Prevents conflicting Tailwind classes from stacking | `lib/utils.ts` → `cn()` |

### UI

| Package | Version | What it is | Why it is used | Where it appears |
|---|---|---|---|---|
| `lucide-react` | ^0.563.0 | Icon library | Consistent, lightweight SVG icons | Navigation, modals, buttons, cards throughout the app |

### Search

| Package | Version | What it is | Why it is used | Where it appears |
|---|---|---|---|---|
| `fuse.js` | ^7.1.0 | Client-side fuzzy search | Re-ranks results from Supabase queries and powers collaborator discovery | `search/page.tsx`, `explore/ExploreClient.tsx`, `ManageMembersModal.tsx` |

### Utilities

| Package | Version | What it is | Why it is used | Where it appears |
|---|---|---|---|---|
| `date-fns` | ^4.1.0 | Date formatting | Human-readable relative timestamps (e.g. "3 hours ago") | Activity logs, chat messages, notification timestamps |

### Dev Tools

| Package | Version | What it is | Why it is used | Where it appears |
|---|---|---|---|---|
| `eslint` | ^9 | Linter | Code quality checks | `eslint.config.mjs`, `npm run lint` |
| `eslint-config-next` | 16.1.6 | Next.js ESLint rules | Catches Next.js-specific mistakes | ESLint config |
| `@types/node` / `react` / `react-dom` | ^20 / ^19 / ^19 | TypeScript type definitions | Type inference for Node and React APIs | All TypeScript files |

### NPM Scripts

```
dev    → next dev        (local dev server)
build  → next build      (production bundle)
start  → next start      (run production server)
lint   → eslint          (run ESLint)
```

---

## 3. Architecture Overview

### Monolith or split?

Collabio is a **monolith** — the frontend and the one API route (`/api/import-url`) live in the same Next.js project. There is no separate backend server. Supabase acts as the external backend for database, auth, storage, and realtime.

### How Next.js App Router works in this project

The App Router separates pages into two categories:

**Server Components** run on the server at request time. They can access cookies, call Supabase directly using the session from cookies, and pass fetched data as props to client components. The dashboard `[id]/page.tsx` and workspace `[id]/page.tsx` are server components. They fetch all initial data with `Promise.all()` before the page renders, so the client receives a fully-populated page on first load.

**Client Components** (marked `"use client"`) run in the browser. They handle all interactivity — modals, forms, real-time subscriptions, Zustand reads and writes, and event handlers. Every major feature component is a client component.

The pattern throughout is: **server page fetches → passes props to client component → client component hydrates → takes over with hooks and Zustand**.

### Where Supabase sits

Supabase is **everything except the Next.js framework itself**:

- **Database**: PostgreSQL with 11 tables, all accessed via the Supabase JS client
- **Auth**: Email/password, Google OAuth, GitHub OAuth — sessions managed via cookies
- **Storage**: One bucket (`Link-UpWorkpace`) stores avatars, banners, uploaded files, and downloaded thumbnails
- **Realtime**: WebSocket channels subscribed per workspace for live reference, member, and chat updates
- **RLS**: Row Level Security policies on every table enforce who can read and write what

### How the client talks to Supabase

**Directly from the browser** for nearly everything. The `supabase` singleton in `lib/supabase.ts` (a browser client created with `createBrowserClient`) is imported by hooks and client components and calls Supabase directly. The exception is the `/api/import-url` route, which runs on the Next.js server to download files and upload them to storage — browser-side fetching of external media would be blocked by CORS.

### What middleware does

`middleware.ts` runs on **every request** before it reaches any page. It:
1. Creates a server-side Supabase client using the request cookies
2. Calls `supabase.auth.getUser()` to check authentication
3. **Protected routes** (`/dashboard/*`, `/workspace/*`, `/profile/setup`, `/profile/edit`): redirects to `/login` if no user
4. **Auth routes** (`/login`, `/signup`): redirects logged-in users to `/dashboard/{userId}`
5. **Public routes** (`/`, `/explore/*`, `/profile/*`, `/auth/callback`): passes through without any auth check

The middleware matcher excludes static files (`_next/static`, images, favicons) so it only runs on actual page routes.

---

## 4. Folder and File Structure

```
TestCollab/
├── middleware.ts              — Route protection. Runs on every request. Checks auth and redirects.
├── next.config.ts             — Next.js config. Whitelists remote image domains for <Image> component.
├── package.json               — All dependencies and npm scripts.
├── postcss.config.mjs         — PostCSS config for Tailwind CSS v4.
├── tsconfig.json              — TypeScript config.
├── .env.local                 — Environment variables (Supabase URL and anon key). Not committed.
│
├── public/                    — Static assets served directly. SVG icons.
│
└── src/
    ├── app/                   — Next.js App Router. Every folder is a route segment.
    │   │
    │   ├── layout.tsx         — Root layout. Wraps all pages. Sets Outfit font, ToastProvider,
    │   │                        and renders <AuthBootstrap> to initialise auth on first load.
    │   ├── page.tsx           — Landing page (/). Client component. Renders Navbar, Hero,
    │   │                        stats section, Features, CTA, footer. Handles auth redirect
    │   │                        if Supabase lands the user on root with a code param.
    │   ├── globals.css        — Tailwind import + custom utilities (.glass, .reveal, .hover-lift,
    │   │                        .float-in), custom scrollbar, keyframe animations.
    │   │
    │   ├── (auth)/            — Route group for public auth pages. No shared layout.
    │   │   ├── login/page.tsx — Renders <LoginForm>. No data fetching.
    │   │   └── signup/page.tsx— Renders <SignUpForm>. No data fetching.
    │   │
    │   ├── (dashboard)/       — Route group for all protected pages. Shares dashboard layout.
    │   │   ├── layout.tsx     — Dashboard shell. Floating glassmorphism navbar, avatar dropdown,
    │   │   │                    notification bell, archived workspaces modal, sign out. Uses
    │   │   │                    useAuth() to gate rendering — shows spinner while loading,
    │   │   │                    null if unauthenticated. Calls router.replace('/login') if no user.
    │   │   │
    │   │   ├── dashboard/
    │   │   │   ├── page.tsx   — /dashboard redirect. Server component. Gets user from cookies,
    │   │   │   │                checks profile completeness, sets default avatar if missing,
    │   │   │   │                then redirects to /dashboard/{userId}.
    │   │   │   └── [id]/
    │   │   │       ├── page.tsx         — Server component. Fetches owned workspaces, joined
    │   │   │       │                      workspaces (via workspace_members), activity logs,
    │   │   │       │                      and pending invites with Promise.all(). Passes all
    │   │   │       │                      data as props to DashboardClient.
    │   │   │       └── DashboardClient.tsx — Client component. Workspace grid, create workspace
    │   │   │                                  button, activity feed, pending invites list.
    │   │   │
    │   │   ├── workspace/[id]/
    │   │   │   ├── page.tsx         — Server component. Fetches workspace, references, members,
    │   │   │   │                      and folders with Promise.all(). Computes initial user role.
    │   │   │   │                      Wraps output in ToastProvider. Passes all data to
    │   │   │   │                      WorkspaceClient as props.
    │   │   │   ├── WorkspaceClient.tsx — The largest client component (~1,200 lines). Manages
    │   │   │   │                          the entire workspace UI: reference grid, filtering,
    │   │   │   │                          sorting, grouping, folder management, modals (add ref,
    │   │   │   │                          manage members, tags, folders), chat panel, activity
    │   │   │   │                          drawer. Uses useWorkspace() hook for all data and actions.
    │   │   │   └── settings/page.tsx — Workspace settings page. Owner-only. Update title,
    │   │   │                            description, visibility, banner image. Archive or delete
    │   │   │                            workspace. Client component.
    │   │   │
    │   │   ├── explore/
    │   │   │   ├── page.tsx         — Server component. Fetches public workspaces and creator
    │   │   │   │                      profiles. Passes to ExploreClient.
    │   │   │   └── ExploreClient.tsx— Client component. Fuzzy search, category filter, trending
    │   │   │                          workspaces section, workspace cards, creator cards.
    │   │   │
    │   │   ├── profile/
    │   │   │   ├── [id]/page.tsx    — Public profile page. Client component. Fetches profile,
    │   │   │   │                      follower counts, public workspaces. Shows follow button via
    │   │   │   │                      useFollow(). Renders EditProfileModal if own profile.
    │   │   │   └── setup/page.tsx   — Onboarding page for new users. Avatar upload, display name,
    │   │   │                          bio, skill selection. Client component.
    │   │   │
    │   │   └── search/             — (also in app/search/ — client component)
    │   │
    │   ├── api/
    │   │   └── import-url/route.ts — POST endpoint. The only custom API route. Downloads URLs,
    │   │                              extracts metadata, uploads media to Supabase Storage.
    │   │
    │   ├── auth/
    │   │   └── callback/page.tsx   — OAuth PKCE callback. Exchanges auth code for session.
    │   │                              Handles OTP verification. Redirects to dashboard or login.
    │   │
    │   └── search/page.tsx         — Global search. Client component. Searches workspaces,
    │                                  references, and people simultaneously with Promise.all().
    │                                  Uses Fuse.js for client-side re-ranking.
    │
    ├── components/
    │   ├── auth/
    │   │   ├── AuthBootstrap.tsx   — Invisible component rendered in root layout. Calls useAuth()
    │   │   │                         to kick off singleton auth initialisation on every page load.
    │   │   │                         Depends on: useAuth, authStore.
    │   │   ├── LoginForm.tsx       — Email/password + Google + GitHub login form. Handles errors,
    │   │   │                         rate limits, redirect after login.
    │   │   └── SignUpForm.tsx      — Registration form with password strength meter, email
    │   │                             validation, rate limit countdown.
    │   │
    │   ├── dashboard/
    │   │   └── CreateWorkspaceModal.tsx — Modal for creating a workspace. Title, description,
    │   │                                   visibility toggle. Inserts into workspaces table.
    │   │
    │   ├── explore/
    │   │   ├── WorkspaceCard.tsx   — Card showing a public workspace: cover image, title,
    │   │   │                         description, owner avatar, links to /workspace/[id].
    │   │   ├── CreatorCard.tsx     — Card showing a user profile: avatar, name, role, stats.
    │   │   │                         Links to /profile/[id].
    │   │   ├── ExploreSearchBar.tsx— Controlled search input for the explore page.
    │   │   └── index.ts            — Re-exports WorkspaceCard and CreatorCard.
    │   │
    │   ├── landing/
    │   │   ├── NavBar.tsx          — Landing page top navigation. Logo, links, sign up / login.
    │   │   ├── Hero.tsx            — Hero section with animated glass cards and floating elements.
    │   │   └── Features.tsx        — Feature grid with icon cards describing core capabilities.
    │   │
    │   ├── profile/
    │   │   └── EditProfileModal.tsx— Modal for editing display name, bio, avatar, and skills.
    │   │                             Uploads avatar to Supabase Storage. Updates profiles table.
    │   │
    │   ├── ui/
    │   │   ├── Toast.tsx           — Context-based toast system. ToastProvider wraps pages.
    │   │   │                         useToast() hook triggers 3-second auto-dismiss popups.
    │   │   ├── NotificationBell.tsx— Bell icon with unread badge. Dropdown shows all notifications.
    │   │   │                         Accept/decline workspace invites, mark read, delete.
    │   │   │                         Uses useNotifications() hook.
    │   │   ├── Card.tsx            — Reusable card primitives (Card, CardHeader, CardContent).
    │   │   └── dropdown-menu.tsx   — Radix UI dropdown wrapper with styled trigger and items.
    │   │
    │   └── workspace/
    │       ├── AddReferenceModal.tsx      — Two-tab modal: Upload (file) or Import URL (link).
    │       │                                Handles file upload to Supabase Storage, calls
    │       │                                /api/import-url for URLs. Tag and folder selection.
    │       │                                Inserts placeholder row immediately, updates async.
    │       ├── ManageMembersModal.tsx     — Two-tab modal: Find Collaborators (fuzzy search using
    │       │                                conceptExpansion + Fuse.js) or Invite by Email.
    │       │                                Lists current members with role change and remove.
    │       ├── ActivityLogDrawer.tsx      — Slide-in drawer. Shows timeline of workspace events
    │       │                                merged from activity_logs table, ref creation times,
    │       │                                and member join times.
    │       ├── CreateFolderModal.tsx      — Simple modal for naming and creating a folder.
    │       ├── EditReferenceModal.tsx     — Edit reference title, type, metadata.
    │       ├── ReferenceDetailsDrawer.tsx — Slide-in panel with full reference details, tags,
    │       │                                metadata, open link button.
    │       ├── TagManager.tsx             — Create, edit, and delete workspace-scoped tags with
    │       │                                colour pickers.
    │       ├── chat/
    │       │   ├── WorkspaceChat.tsx  — Full chat panel. Tabs for Chat and Members. Manages
    │       │   │                        real-time messaging, presence tracking, profile caching.
    │       │   ├── MessageList.tsx    — Scrollable message list. Auto-scrolls to newest message.
    │       │   ├── MessageInput.tsx   — Text input with send button. Disabled for non-members.
    │       │   └── index.ts           — Re-exports WorkspaceChat.
    │       └── public/
    │           ├── ReferenceCard.tsx  — Card showing reference thumbnail, title, type badge, tags.
    │           │                        Hover reveals action buttons (open, edit, delete, move).
    │           ├── WorkspaceHeader.tsx— Banner image, title, member avatar stack, action buttons.
    │           ├── WorkspaceSidebar.tsx— Sidebar: workspace info, folder tree, member list.
    │           └── index.ts            — Re-exports ReferenceCard, WorkspaceHeader, WorkspaceSidebar.
    │
    ├── hooks/
    │   ├── useAuth.tsx           — Auth backbone. Singleton promise ensures auth initialises once
    │   │                           globally regardless of how many components call it. Subscribes
    │   │                           to onAuthStateChange once. Only clears state on SIGNED_OUT.
    │   │                           Returns: user, profile, isLoading, signOut.
    │   │                           Depends on: supabase, authStore.
    │   ├── useWorkspace.tsx      — Largest hook (~968 lines). Full lifecycle of a workspace view.
    │   │                           Fetches workspace, owner, references (with tags), folders,
    │   │                           members. Opens 4 Realtime channels. CRUD for references,
    │   │                           workspace, members, folders. Permission checking. Activity
    │   │                           logging. Reconnects dead channels on tab visibility restore.
    │   │                           Depends on: supabase, workspaceStore, referencesStore, useAuth.
    │   ├── useNotifications.tsx  — Subscribes to notifications for current user. Handles INSERT,
    │   │                           UPDATE, DELETE from Realtime. markAsRead, markAllAsRead,
    │   │                           deleteNotification, deleteAllRead. Auto-reconnects on tab focus.
    │   │                           Depends on: supabase, notificationsStore, useAuth.
    │   └── useFollow.ts          — Follow/unfollow with optimistic update. Checks follow status
    │                               and fetches follower count on mount. Creates notification on
    │                               follow. Reverts on error.
    │                               Depends on: supabase, useAuth, Toast.
    │
    ├── lib/
    │   ├── supabase.ts           — Singleton Supabase browser client. Created with createBrowserClient
    │   │                           from @supabase/ssr. PKCE flow enabled. Session persisted in cookies.
    │   │                           Logs warning if env vars are missing. Used by every hook and client.
    │   ├── avatar.ts             — getDefaultAvatarUrl(seed). Returns a DiceBear avatar URL seeded
    │   │                           by the user's name or ID. Used as fallback when no avatar is set.
    │   ├── fileType.ts           — getFileTypeFromUrl(url) and getFileTypeFromMime(file). Classifies
    │   │                           a URL or File as audio | video | document | image | link using an
    │   │                           extension map and platform hostname shortcuts.
    │   ├── platformDetect.ts     — detectPlatform(url). Matches URL hostname against YouTube, Vimeo,
    │   │                           Instagram, TikTok, SoundCloud, Spotify, X, Pinterest. Returns
    │   │                           { platform, isKnownPlatform }.
    │   ├── conceptExpansion.ts   — expandSearchQuery(query). Removes stop words, maps keywords to
    │   │                           related technical terms via a CONCEPT_MAP dictionary. Used in
    │   │                           ManageMembersModal for collaborator discovery.
    │   ├── utils.ts              — cn(...inputs). Combines clsx + tailwind-merge for safe class merging.
    │   └── stores/
    │       ├── authStore.ts          — Zustand store: user, profile, isLoading. Actions: setUser,
    │       │                           setProfile, setIsLoading, clear.
    │       ├── workspaceStore.ts     — Zustand store: workspace, members, folders, userRole.
    │       │                           Actions: setWorkspace, setMembers, setFolders, setUserRole, reset.
    │       ├── referencesStore.ts    — Zustand store: references[]. Actions: setReferences, addReference
    │       │                           (with deduplication by ID), updateReference, removeReference.
    │       └── notificationsStore.ts — Zustand store: notifications[], unreadCount (auto-computed).
    │                                   Actions: setNotifications, addNotification, removeNotification,
    │                                   markRead, markAllRead.
    │
    └── types/
        └── index.ts              — All shared TypeScript interfaces: User, Workspace, WorkspaceMember,
                                    MemberRole, MemberPermissions, Reference, ReferenceData, WorkspaceFolder,
                                    FolderFilter, Message, Notification.
```

---

## 5. Data Flow: How Data Moves Through the App

### Authentication flow

1. User visits `/signup` or `/login`. Forms are client components (`LoginForm`, `SignUpForm`).
2. On submit, the form calls `supabase.auth.signInWithPassword()` or `supabase.auth.signUp()` directly from the browser.
3. For OAuth (Google/GitHub), `supabase.auth.signInWithOAuth()` redirects the browser to the provider.
4. The provider redirects back to `/auth/callback?code=...`.
5. `auth/callback/page.tsx` calls `supabase.auth.exchangeCodeForSession(code)`. This exchanges the temporary code for a session and sets a cookie.
6. The callback redirects to `/dashboard/{userId}`.
7. The dashboard server page creates a server-side Supabase client (using the cookie), calls `supabase.auth.getUser()`, checks if the profile has a `display_name`. If not, redirects to `/profile/setup`.
8. On every page load, `AuthBootstrap` (rendered in root layout) calls `useAuth()`, which runs `initializeAuthOnce()`. This calls `supabase.auth.getSession()`, stores the user in `authStore`, and fetches the profile from the `profiles` table. The `onAuthStateChange` global listener is registered once and only acts on `SIGNED_OUT` events from then on.

**Files involved:** `auth/callback/page.tsx`, `LoginForm.tsx`, `SignUpForm.tsx`, `useAuth.tsx`, `authStore.ts`, `supabase.ts`, `middleware.ts`, `dashboard/page.tsx`.

---

### Workspace creation flow

1. User clicks "New Workspace" on the dashboard. `CreateWorkspaceModal` opens.
2. User fills in title, description, and visibility. Submits.
3. The modal calls `supabase.from('workspaces').insert(...)` directly from the browser using the browser Supabase client.
4. On success, the new workspace row is written to the `workspaces` table. The `workspace_owner_id` is set to the current user's ID.
5. The modal optionally inserts a row into `workspace_members` with `member_role = 'owner'` (depending on implementation — the workspace page always includes the owner by constructing an owner member record from `workspace_owner_id` anyway).
6. The workspace appears on the dashboard. The dashboard page either re-fetches (via `router.refresh()`) or the modal adds the new workspace to local state.

**Tables touched:** `workspaces`, optionally `workspace_members`.
**Files involved:** `CreateWorkspaceModal.tsx`, `dashboard/[id]/DashboardClient.tsx`, `supabase.ts`.

---

### Reference import flow (URL)

1. User opens `AddReferenceModal`, selects "Import URL" tab, pastes a URL.
2. The modal calls `detectPlatform(url)` and `getFileTypeFromUrl(url)` to classify the URL client-side.
3. The modal immediately calls `supabase.from('references').insert(...)` with `reference_status: 'processing'`, title set to the URL hostname, and the detected type. This writes a placeholder row instantly.
4. `addReferenceState(placeholder)` updates the Zustand `referencesStore` immediately. The card appears in the UI right away with a "Downloading…" indicator.
5. The modal closes — the user can keep working.
6. In the background (not awaited), the modal sends a `POST /api/import-url` request with `{ url, type, platform }` and an `Authorization: Bearer {token}` header.
7. `route.ts` (API route, runs on Next.js server):
   - Verifies the JWT token with Supabase
   - Fetches the URL server-side (avoids CORS)
   - If the response is HTML: extracts Open Graph/Twitter Card meta tags, attempts to upload the preview image to Supabase Storage
   - If the response is a direct media file (image, video, audio): downloads the blob and uploads it to Supabase Storage under `imports/{type}/{timestamp}_{filename}`
   - Returns `{ publicUrl, metadata, title, type }` or falls back to a "link" type if nothing could be downloaded
8. The modal's background callback receives the API response and calls `supabase.from('references').update({ reference_status: 'ready', reference_url: publicUrl, reference_metadata: {...}, reference_title: title })`.
9. The Realtime subscription in `useWorkspace` receives the UPDATE event on the `references` table and calls `updateReferenceState()` in the Zustand store. The card in the UI updates in place with the real title and thumbnail.
10. On any error, the status is set to `'failed'` and the type falls back to `'link'`.

**Tables touched:** `references`.
**Storage:** `Link-UpWorkpace` bucket, path `imports/{type}/{timestamp}_{filename}`.
**Files involved:** `AddReferenceModal.tsx`, `api/import-url/route.ts`, `useWorkspace.tsx`, `referencesStore.ts`, `fileType.ts`, `platformDetect.ts`.

---

### Invite flow

1. Workspace owner opens `ManageMembersModal`, types an email, clicks "Invite".
2. `inviteMemberByEmail(email)` in `useWorkspace`:
   - Looks up the profile by email in the `profiles` table
   - Checks they are not already a member
   - Inserts a row into `notifications` with `notification_type: 'workspace_invite'` and `notification_data: { workspace_id, workspace_title, inviter_id, inviter_name }`
   - Does NOT add the user to `workspace_members` yet — the invite is only a notification, not automatic membership
3. The invited user's `useNotifications` hook receives the INSERT event from the Realtime channel filtered to `recipient_profile_id = their ID`.
4. `addNotification(newNotification)` updates the `notificationsStore`. The bell icon shows a new badge.
5. The invited user opens the notification bell (`NotificationBell.tsx`) and sees the invite with "Accept" and "Decline" buttons.
6. On "Accept": the `NotificationBell` calls `supabase.from('workspace_members').insert({ workspace_id, profile_id: currentUser.id, member_role: 'member' })`. It then deletes or marks the notification as read.
7. On "Decline": the notification is simply deleted.

**Tables touched:** `notifications`, `workspace_members` (on accept).
**Files involved:** `useWorkspace.tsx` (inviteMemberByEmail), `ManageMembersModal.tsx`, `NotificationBell.tsx`, `useNotifications.tsx`, `notificationsStore.ts`.

---

### Real-time updates flow

Supabase Realtime uses WebSockets to push Postgres change events to subscribed clients. Here is how each channel works in this project:

`useWorkspace` opens 4 channels per workspace when the component mounts:

1. **`workspace-references-{id}`** — listens for `*` (INSERT/UPDATE/DELETE) on the `references` table filtered by `workspace_id`. On INSERT → `addReferenceState(payload.new)`. On DELETE → `removeReference(payload.old.reference_id)`. On UPDATE → `updateReferenceState(id, payload.new)` preserving the tags array which is not in the Postgres change payload.

2. **`workspace-details-{id}`** — listens for UPDATE on `workspaces` filtered by `workspace_id`. Updates `setWorkspace(payload.new)` in `workspaceStore` so title/description/visibility changes propagate live.

3. **`workspace-members-{id}`** — listens for `*` on `workspace_members`. On any change, triggers a 500ms debounced `fetchWorkspace()` to refetch the full member list with profiles.

4. **`references-{id}`** — a second UPDATE-only channel on `references` that triggers `updateReferenceState`. This overlaps with channel 1 but is kept separate for granular update handling.

`useNotifications` opens:

5. **`user-notifications-{userId}`** — listens for `*` on `notifications` filtered by `recipient_profile_id`. Direct INSERT/UPDATE/DELETE handling in the store.

`WorkspaceChat` opens:

6. **`workspace-chat-{id}`** — listens for INSERT on `messages`. Deduplicates against optimistic inserts using a `seenMessageIds` Set.

7. **`workspace-presence-{id}`** — Supabase Presence channel. Tracks which users have the chat panel open. Updates an `onlineUserIds` Set.

**Channel cleanup:** All channels use `setTimeout(fn, 0)` for deferred setup (prevents blocking render). Cleanup in the `useEffect` return removes all channels. If the browser tab was backgrounded, channels may close — a `visibilitychange` event listener checks channel state and recreates closed/errored channels on tab focus restore.

**Store update path:** Realtime event → handler function → Zustand store action → React re-render via store subscription.

---

## 6. State Management: Zustand

### Why Zustand instead of local state

Supabase Realtime callbacks fire outside React's render cycle. Context providers would cause the entire tree to re-render on every notification. Local state cannot be shared between sibling components without drilling through many layers. Zustand solves all three: it works outside React, triggers only the components that subscribe to the specific slice they need, and is accessible directly via `getState()` from anywhere.

---

### `authStore` — Authentication State

**Data it holds:** `user` (id, email), `profile` (display_name, avatar_url, email, skills, bio), `isLoading`.

**Populated by:** `useAuth` hook calling `supabase.auth.getSession()` and fetching from `profiles` table. Triggered on app first load via `AuthBootstrap`.

**Read by:** `DashboardLayout`, `useWorkspace`, `useNotifications`, `useFollow`, `NotificationBell`, `WorkspaceChat`, profile pages.

**Mutated by:** `useAuth` (setUser, setProfile, setIsLoading, clear on sign out).

**Why Zustand:** Auth state is needed across every page and many components. Initialising once globally via a singleton promise prevents duplicate session fetches.

---

### `workspaceStore` — Active Workspace

**Data it holds:** `workspace` (full workspace object), `members` (array with profiles embedded), `folders` (array), `userRole` (owner | member | viewer | null).

**Populated by:** `useWorkspace` hook on mount — calls `fetchWorkspace()` which queries workspaces, profiles, references, workspace_folders, and workspace_members tables.

**Read by:** `WorkspaceClient`, `WorkspaceHeader`, `WorkspaceSidebar`, `ManageMembersModal`, `ActivityLogDrawer`, `WorkspaceChat`.

**Mutated by:** `useWorkspace` CRUD actions and Realtime event handlers.

**Why Zustand:** The workspace data is needed by many sibling components (header, sidebar, modals, chat). Zustand prevents the `WorkspaceClient` from having to drill all this data down as props. Notably the store is **not reset on unmount** — intentionally — so navigating away and back doesn't wipe data and cause a loading flash.

---

### `referencesStore` — References List

**Data it holds:** `references[]` — the full list of ReferenceData objects for the active workspace.

**Populated by:** `useWorkspace` on initial fetch and on Realtime INSERT events.

**Read by:** `WorkspaceClient` (renders the reference grid), `useWorkspace` (reads references for delete/workspace delete operations).

**Mutated by:** `addReference` (with deduplication — checks `reference_id` before pushing), `updateReference`, `removeReference`, `setReferences`.

**Why Zustand:** References update frequently via Realtime. Keeping them in Zustand means the Realtime callback can call `addReferenceState(ref)` directly without going through React state — and only the component subscribed to `references` re-renders.

---

### `notificationsStore` — Notifications

**Data it holds:** `notifications[]`, `unreadCount` (auto-computed whenever notifications are set or modified).

**Populated by:** `useNotifications` on mount, then on Realtime INSERT events.

**Read by:** `NotificationBell` (shows badge count, renders list), `useNotifications` (for mark-all-read and delete-all-read).

**Mutated by:** `setNotifications`, `addNotification`, `removeNotification`, `markRead`, `markAllRead`. `unreadCount` is derived automatically — every mutating action recomputes it from the array.

**Why Zustand:** Notifications arrive via Realtime outside React. The `NotificationBell` needs a badge count that updates live. Zustand lets the Realtime handler update the count without causing a full rerender of the bell's parent layout.

---

## 7. Database Schema and Relationships

### `profiles`

Stores public user identity. Auto-created by a Supabase database trigger (`handle_new_user`) when a new auth user signs up.

| Column | Type | Notes |
|---|---|---|
| `profile_id` | UUID (PK) | Matches `auth.users.id` exactly |
| `display_name` | TEXT | Required for dashboard access |
| `profile_email` | TEXT | Synced from auth email |
| `profile_avatar_url` | TEXT | URL. Falls back to DiceBear if null |
| `profile_bio` | TEXT | Optional biography |
| `profile_skills` | TEXT[] | Array of skill strings |
| `profile_created_at` | TIMESTAMPTZ | Set by trigger |

**Operations:** SELECT (read profile by ID), UPDATE (edit profile, set avatar), UPSERT (set default avatar on first dashboard load).

---

### `workspaces`

Central table. One row per project workspace.

| Column | Type | Notes |
|---|---|---|
| `workspace_id` | UUID (PK) | |
| `workspace_owner_id` | UUID (FK → profiles) | The creator |
| `workspace_title` | TEXT | |
| `workspace_description` | TEXT | Optional |
| `workspace_visibility` | TEXT | `'public'` or `'private'` |
| `workspace_cover_image` | TEXT | URL of banner image |
| `workspace_created_at` | TIMESTAMPTZ | |
| `is_archived` | BOOLEAN | Soft-delete flag |

**Operations:** SELECT, INSERT (create), UPDATE (title/desc/visibility/banner/archive flag), DELETE (permanent delete by owner). Realtime: UPDATE channel per workspace.

---

### `workspace_members`

Junction table connecting users to workspaces with a role. The owner is always present here with `member_role = 'owner'` (constructed in code even if not always written to this table).

| Column | Type | Notes |
|---|---|---|
| `workspace_id` | UUID (FK → workspaces) | |
| `profile_id` | UUID (FK → profiles) | |
| `member_role` | TEXT | `'owner'` \| `'member'` \| `'viewer'` |
| `member_category` | TEXT | Custom label set by owner |
| `member_joined_at` | TIMESTAMPTZ | |

**Operations:** SELECT (list members), INSERT (add member on invite accept), UPDATE (change role or category), DELETE (remove member). Realtime: `*` events trigger full workspace refetch.

---

### `references`

Every saved reference in every workspace.

| Column | Type | Notes |
|---|---|---|
| `reference_id` | UUID (PK) | |
| `workspace_id` | UUID (FK → workspaces) | |
| `uploaded_by_profile_id` | UUID (FK → profiles) | |
| `reference_title` | TEXT | |
| `reference_url` | TEXT | Public storage URL or external link |
| `reference_type` | TEXT | `'image'` \| `'video'` \| `'audio'` \| `'document'` \| `'link'` |
| `reference_status` | TEXT | `'processing'` \| `'ready'` \| `'failed'` |
| `reference_metadata` | JSONB | `{ thumbnail, source, colorPalette, source_url, platform, thumbnailStoredUrl }` |
| `reference_created_at` | TIMESTAMPTZ | |
| `folder_id` | UUID (FK → workspace_folders, nullable) | |

**Operations:** SELECT with left join on `reference_tags → tags`, INSERT, UPDATE (metadata after import, folder, title), DELETE. Realtime: INSERT/UPDATE/DELETE channels.

---

### `workspace_folders`

Organisational folders inside a workspace.

| Column | Type | Notes |
|---|---|---|
| `folder_id` | UUID (PK) | |
| `workspace_id` | UUID (FK → workspaces) | |
| `folder_name` | TEXT | |
| `folder_created_at` | TIMESTAMPTZ | |

**Operations:** SELECT, INSERT, DELETE (sets `folder_id = null` on all child references first).

---

### `tags`

Workspace-scoped colour labels. Each workspace has its own tag set.

| Column | Type | Notes |
|---|---|---|
| `tag_id` | UUID (PK) | |
| `workspace_id` | UUID (FK → workspaces) | |
| `tag_name` | TEXT | |
| `tag_color` | TEXT | Hex colour |

**Operations:** SELECT, INSERT, UPDATE, DELETE.

---

### `reference_tags`

Many-to-many junction. A reference can have multiple tags; a tag can be on multiple references.

| Column | Type | Notes |
|---|---|---|
| `reference_id` | UUID (FK → references) | |
| `tag_id` | UUID (FK → tags) | |

**Operations:** SELECT (via left join from references query), INSERT (apply tag), DELETE (remove tag).

---

### `messages`

Chat messages per workspace.

| Column | Type | Notes |
|---|---|---|
| `message_id` | UUID (PK) | |
| `workspace_id` | UUID (FK → workspaces) | |
| `sender_profile_id` | UUID (FK → profiles) | |
| `message_content` | TEXT | |
| `message_created_at` | TIMESTAMPTZ | |

**Operations:** SELECT (initial load, ordered by time), INSERT (send message). Realtime: INSERT channel per workspace.

---

### `notifications`

Inbox for each user. Serves both as the notification feed and as the invite mechanism.

| Column | Type | Notes |
|---|---|---|
| `notification_id` | UUID (PK) | |
| `recipient_profile_id` | UUID (FK → profiles) | |
| `notification_type` | TEXT | `'workspace_invite'` \| `'workspace_removal'` \| `'reference_added'` \| `'member_joined'` \| `'workspace_updated'` \| `'new_follower'` |
| `notification_message` | TEXT | Human-readable string |
| `notification_link` | TEXT | URL for click navigation |
| `notification_data` | JSONB | `{ workspace_id, workspace_title, inviter_id, inviter_name }` |
| `notification_is_read` | BOOLEAN | |
| `notification_created_at` | TIMESTAMPTZ | |

**Operations:** SELECT, INSERT (created by other users' actions), UPDATE (mark read), DELETE (dismiss). Realtime: `*` events filtered by `recipient_profile_id`.

---

### `followers`

Social follow graph.

| Column | Type | Notes |
|---|---|---|
| `follower_id` | UUID (FK → profiles) | Doing the following |
| `following_id` | UUID (FK → profiles) | Being followed |

**Operations:** SELECT (check if following, count followers), INSERT (follow), DELETE (unfollow).

---

### `activity_logs`

Persistent log of destructive or notable workspace actions.

| Column | Type | Notes |
|---|---|---|
| `activity_id` | UUID (PK) | |
| `activity_type` | TEXT | `'reference_added'` \| `'deleted_reference'` \| `'updated_workspace'` \| `'archived_workspace'` \| `'deleted_workspace'` |
| `activity_target_title` | TEXT | Title of the affected entity |
| `workspace_id` | UUID (FK → workspaces) | |
| `actor_profile_id` | UUID (FK → profiles) | |
| `activity_created_at` | TIMESTAMPTZ | |

**Operations:** SELECT (with profiles join, ordered by time, limit 15 per dashboard), INSERT (by logActivity() in useWorkspace on delete/update actions).

---

### Relationship Map

```
profiles ──< workspace_members >── workspaces
profiles ──< references
workspaces ──< references ──< reference_tags >── tags
workspaces ──< workspace_folders
references >── workspace_folders (folder_id nullable)
workspaces ──< messages
workspaces ──< workspace_folders
profiles ──< notifications (recipient)
profiles ──< activity_logs (actor)
workspaces ──< activity_logs
profiles ──< followers (follower_id)
profiles ──< followers (following_id)
```

---

## 8. Supabase RLS (Row Level Security)

### What RLS is and why it matters

RLS is a PostgreSQL feature where each table has policies that define which rows a given database user can see or modify. In Supabase, the "user" is derived from the JWT token in the request. Without RLS, any user with the anon key could read every row in every table. With RLS, a user can only query rows that a policy explicitly permits.

In Collabio, RLS is the **primary security boundary**. The browser client uses the public anon key, so RLS is what prevents one user from reading another user's private workspace data.

### Per-table policy descriptions

**`profiles`**
- Anyone can SELECT profiles (public — needed for explore, member lists, chat sender names)
- Only the authenticated user can UPDATE their own profile (`profile_id = auth.uid()`)
- INSERT is handled by the database trigger on signup, not by user action

**`workspaces`**
- **SELECT**: A user can see a workspace if: (a) they are the owner (`workspace_owner_id = auth.uid()`), or (b) they are in `workspace_members` for that workspace, or (c) the workspace is public (`workspace_visibility = 'public'`)
- **INSERT**: Any authenticated user can create a workspace
- **UPDATE**: Only the owner (`workspace_owner_id = auth.uid()`)
- **DELETE**: Only the owner

**`workspace_members`**
- **SELECT**: A user can see member rows for workspaces they are a member of or own
- **INSERT**: Only workspace owners can add members (or the user adding themselves on invite-accept — policy must allow this)
- **UPDATE**: Only workspace owners can change roles/categories
- **DELETE**: Workspace owner can remove anyone; a member can remove themselves

**`references`**
- **SELECT**: A user can see references for workspaces they have access to (owned, member, or public)
- **INSERT**: Owners and members can add references (viewers cannot)
- **UPDATE**: Owners and members
- **DELETE**: Owners and members

**`workspace_folders`**
- Same access pattern as references — readable by workspace members and public viewers, writable by owners and members

**`tags` and `reference_tags`**
- Readable by workspace members and public viewers; writable by owners and members

**`messages`**
- **SELECT**: Workspace members and owners
- **INSERT**: Only members and owners (not viewers, not unauthenticated)

**`notifications`**
- **SELECT**: Only `recipient_profile_id = auth.uid()` — users can only see their own notifications
- **INSERT**: Any authenticated user (so actions in `useWorkspace` can create notifications for other users)
- **UPDATE**: Only the recipient
- **DELETE**: Only the recipient

**`followers`**
- **SELECT**: Public (anyone can see follow counts)
- **INSERT**: Authenticated users only, `follower_id = auth.uid()` (you can only follow as yourself)
- **DELETE**: `follower_id = auth.uid()` (you can only unfollow yourself)

**`activity_logs`**
- **SELECT**: Users can see logs for workspaces they have access to
- **INSERT**: Any authenticated member can insert logs (the `logActivity()` function does this)

---

## 9. API Routes

### `POST /api/import-url`

**File:** `src/app/api/import-url/route.ts`

**Why it exists as an API route:** Downloading external media files from the browser is blocked by CORS on most platforms (YouTube, Spotify, Instagram, etc.). Running the fetch on the Next.js server bypasses this. Storage uploads also benefit from the service role key which is only available server-side.

**What request it expects:**
- Header: `Authorization: Bearer {supabase_session_token}`
- Body JSON: `{ url: string, type: ReferenceType, platform?: string }`

**What it does internally:**

1. Verifies the JWT token by creating a temporary Supabase auth client and calling `getUser(token)`. Returns 401 if invalid.
2. Creates a storage client — uses the Supabase service role key if available (for elevated storage permissions), otherwise falls back to the user's token.
3. Fetches the target URL server-side with a browser-like User-Agent header.
4. If the response is HTML (most web pages and social platforms):
   - Parses Open Graph tags, Twitter Card tags, JSON-LD, and `<title>` to extract title, preview image, and media URLs
   - Uploads the preview image to Supabase Storage immediately
   - Scans URL query params and HTML for `<video>`, `<source>`, and `<img>` tags to find downloadable media candidates
   - For each candidate, attempts to fetch and download the media blob
   - If no downloadable media is found, returns a `type: 'link'` fallback with the extracted metadata
5. If the response is a direct media file (image/png, video/mp4, audio/mpeg, etc.):
   - Downloads the blob directly
   - Uses MIME type to confirm/override the type classification
6. Uploads the blob to `Link-UpWorkpace` storage bucket under path `imports/{type}/{timestamp}_{filename}`
7. Returns `{ success, publicUrl, type, title, metadata: { thumbnail, source, source_url, platform } }`

**What it returns on failure:** Falls back to `buildLinkFallbackResponse()` — a success response with `type: 'link'` and whatever metadata could be extracted. This means the import never fully fails; it degrades gracefully to a saved link.

**What calls it:** `AddReferenceModal.tsx` — after inserting the placeholder reference row, it sends this request in the background and uses the response to update the reference.

---

## 10. Frontend Pages: What Each Page Does

### `/` — Landing Page

**Server/Client:** Client component.

**What the user sees:** Navbar, animated hero section, stats row (10k+ Creatives etc.), features grid, CTA section, footer.

**Data fetched:** None from Supabase. Fully static content.

**Actions available:** Sign up (→ `/signup`), Explore Workspaces (→ `/explore`), Log in (→ `/login`).

**Special behaviour:** On mount, checks if the URL contains a `code` or `token_hash` query param (Supabase sometimes redirects to root after OAuth). If found, forwards to `/auth/callback` to complete the session exchange.

---

### `/login` — Login Page

**Server/Client:** Client component (`LoginForm`).

**What the user sees:** Email/password fields, Google OAuth button, GitHub OAuth button, link to signup.

**Actions available:** Sign in with credentials, sign in with Google, sign in with GitHub, navigate to signup.

**Auth protection:** If already logged in, middleware redirects to `/dashboard/{userId}` before the page renders.

---

### `/signup` — Signup Page

**Server/Client:** Client component (`SignUpForm`).

**What the user sees:** Email, password, confirm password fields with real-time strength meter and validation. Google/GitHub OAuth buttons.

**Actions available:** Create account with email, sign up with OAuth.

**After signup:** Supabase sends a confirmation email. On click, user is taken to `/auth/callback` which creates the session and redirects to `/dashboard/{userId}`. The dashboard server page then redirects to `/profile/setup` if `display_name` is missing.

---

### `/auth/callback` — OAuth Callback

**Server/Client:** Client component.

**What the user sees:** Spinning loader ("Authenticating...").

**What it does:** Reads `code`, `token_hash`, and `type` from URL params. Exchanges the code for a session via `supabase.auth.exchangeCodeForSession(code)`. On success, redirects to `/dashboard/{userId}`. Handles OTP (email verification) via `supabase.auth.verifyOtp()`. Falls back to checking for an existing session. If nothing works, redirects to `/login?error=...` after 1.5 seconds.

---

### `/profile/setup` — Profile Onboarding

**Server/Client:** Client component.

**What the user sees:** Avatar upload, display name input, bio textarea, skills multi-select.

**Data fetched:** Current profile from `profiles` on mount (pre-fills if partially set).

**Actions:** Upload avatar (to Supabase Storage), save profile. On save, upserts the `profiles` row. Redirects to `/dashboard/{userId}` on success.

**Auth protection:** Middleware allows `/profile/*` as a public route. However the dashboard server page redirects here if profile is incomplete, creating a soft gate.

---

### `/dashboard/{userId}` — User Dashboard

**Server/Client:** Server page (`page.tsx`) → client component (`DashboardClient.tsx`).

**What the user sees:** Grid of workspaces they own or joined, activity feed showing recent team actions, list of pending invited users (people the current user invited who haven't accepted yet), workspace count and reference count stats, create workspace button.

**Data fetched (server-side, parallel):**
- Owned workspaces via `workspace_owner_id = userId`
- Joined workspaces via `workspace_members.profile_id = userId` (with nested workspace join)
- Total references count for the user
- Activity logs for all their workspace IDs (with profiles join, limit 15)
- Pending invites sent by this user (from `notifications` where they are the inviter)

**Actions:** Create workspace (opens `CreateWorkspaceModal`), click workspace to navigate to `/workspace/{id}`.

---

### `/workspace/{id}` — Workspace View

**Server/Client:** Server page (`page.tsx`) → client component (`WorkspaceClient.tsx`).

**What the user sees:** Workspace header (banner, title, member avatars), reference grid with search/sort/filter/group controls, folder sidebar, chat panel, activity log drawer, notification prompts.

**Data fetched (server-side, parallel):**
- Workspace details
- References (first 50, ordered by creation date)
- Members with profiles
- Folders

**After hydration:** `useWorkspace(workspaceId)` hook takes over. It re-fetches complete data (including tags via join), opens realtime channels, and provides all CRUD actions.

**Actions available (by role):**
- **Owner:** All below plus manage members, invite users, create/delete folders, update workspace settings, archive, delete workspace
- **Member:** Add references, delete own references, edit references, move to folders, send chat messages
- **Viewer:** View references, view chat, cannot add or edit

**Auth protection:** Middleware gates the route. The server page computes `initialUserRole` to pre-populate permission state. The client `getPermissions()` enforces role-based UI gating (hides buttons, disables actions).

---

### `/workspace/{id}/settings` — Workspace Settings

**Server/Client:** Client component.

**What the user sees:** Edit title, description, visibility, cover image. Archive workspace button. Delete workspace button (with confirmation modal).

**Auth protection:** Only the workspace owner can reach meaningful actions. If a non-owner somehow navigates here, `getPermissions().canDeleteWorkspace` returns false and all mutating buttons are disabled.

---

### `/explore` — Public Discovery

**Server/Client:** Server page → client component (`ExploreClient.tsx`).

**What the user sees:** Search bar, category filter tabs, trending workspaces section (most recently active), workspace cards grid, creator cards grid.

**Data fetched (server-side):** Public workspaces (visibility = 'public') with owner profiles, creator profiles.

**After hydration:** `ExploreClient` handles search with `expandSearchQuery` + Fuse.js for fuzzy matching, and category filtering client-side.

**Auth protection:** None — fully public.

---

### `/profile/{id}` — Public Profile

**Server/Client:** Client component.

**What the user sees:** Avatar, display name, bio, skills list, follower count, follow button (if not own profile), public workspaces grid, edit profile button (if own profile).

**Data fetched (client-side on mount):** Profile from `profiles`, follower count via `followers` table count query, public workspaces via `workspaces` where `workspace_owner_id = id AND visibility = 'public'`.

**Actions:** Follow/unfollow (via `useFollow`), open `EditProfileModal` if own profile.

---

### `/search` — Global Search

**Server/Client:** Client component.

**What the user sees:** Search input, tab switcher (Workspaces / References / People), results grid.

**Data fetched (on user search, parallel):**
- Public workspaces matching query (`ilike` title or description)
- References in user's accessible workspaces matching query title
- People matching display name

**Search logic:** Supabase `ilike` query returns candidates, then Fuse.js re-ranks them client-side for fuzzy matching (threshold 0.4). Results update once per search submission (Enter key or button).

**Auth check:** References search is only run if the user is logged in (since it queries their member workspaces). Guest users see workspace and people results only.

---

## 11. Key Algorithms and Logic

### Platform Detection

**File:** `lib/platformDetect.ts`

`detectPlatform(url)` parses the URL hostname and checks it against a hardcoded list: YouTube (youtube.com, youtu.be), Vimeo, Instagram, TikTok, SoundCloud, Spotify, X (x.com, twitter.com), Pinterest. Returns `{ platform: string, isKnownPlatform: boolean }`. Unknown hosts return `{ platform: 'web', isKnownPlatform: false }`. This is used in `AddReferenceModal` to decide which platform label to show and to pass `platform` to the API route where it controls the import strategy.

---

### File Type Detection

**File:** `lib/fileType.ts`

Two functions:

`getFileTypeFromUrl(url)`: Parses the URL pathname, extracts the file extension, and looks it up in a hardcoded `EXTENSION_MAP` (e.g. `.mp4 → 'video'`, `.pdf → 'document'`). Falls back to hostname shortcuts (youtube.com → 'video', spotify.com → 'audio') if no extension is found. Returns `'link'` if nothing matches.

`getFileTypeFromMime(file)`: Checks the MIME type prefix (`image/`, `video/`, `audio/`). Falls back to extension lookup. Returns `'document'` for unknown types with extensions.

Both are used in `AddReferenceModal` for client-side classification and in `route.ts` for server-side confirmation.

---

### Fuzzy Search

**Library:** `fuse.js` v7

Used in three places:

1. **Global search** (`search/page.tsx`): After fetching candidates from Supabase with `ilike`, three separate Fuse instances are created — one for workspaces (searching `workspace_title`, `workspace_description`), one for references (searching `reference_title`), one for people (searching `display_name`). Each uses threshold 0.4 (higher = more permissive). Results are `.map(r => r.item)` to extract the original objects sorted by relevance score.

2. **Explore page** (`ExploreClient.tsx`): Fuse searches workspace titles and descriptions client-side after the initial server-fetched dataset loads.

3. **Manage Members Modal** (`ManageMembersModal.tsx`): The "Find Collaborators" tab searches all profiles. Before running Fuse, the query is passed through `expandSearchQuery()` (concept expansion) to augment the search terms. The expanded terms are concatenated and fed into a Fuse instance searching on `profile_skills` and `display_name`.

---

### Concept Expansion

**File:** `lib/conceptExpansion.ts`

`expandSearchQuery(query)` processes a natural language query like "I need a designer" into a flat array of expanded technical terms: `['designer', 'UI', 'UX', 'Figma', 'Branding', ...]`.

Steps:
1. Split query on non-alphanumeric characters
2. Remove stop words (a, the, and, need, want, looking, etc.)
3. For each word, check the `CONCEPT_MAP` dictionary for direct matches and singular form matches
4. Collect all original words plus all expanded synonyms into a deduplicated Set
5. Return as an array

The result is joined and passed to Fuse — so a query for "frontend developer" would also match profiles with "React", "TypeScript", "CSS" in their skills.

---

### Permission System

**File:** `hooks/useWorkspace.tsx` — `getCurrentUserRole()` and `getPermissions()`

`getCurrentUserRole()`: Checks if the current user's ID matches `workspace.workspace_owner_id` → `'owner'`. Otherwise finds their record in the `members` array → returns `member_role`. Returns `null` if not a member.

`getPermissions()` maps roles to a `MemberPermissions` object:

| Role | canView | canEdit | canManageMembers | canDeleteWorkspace |
|---|---|---|---|---|
| owner | ✅ | ✅ | ✅ | ✅ |
| member | ✅ | ✅ | ❌ | ❌ |
| viewer | ✅ | ❌ | ❌ | ❌ |
| not member, public workspace | ✅ | ❌ | ❌ | ❌ |
| not member, private workspace | ❌ | ❌ | ❌ | ❌ |

Every CRUD action in `useWorkspace` calls `getPermissions()` first and throws an error if the required permission is false. The UI also reads permissions to show/hide buttons.

---

### Optimistic Updates

Used in three locations:

1. **Reference import** (`AddReferenceModal.tsx`): Inserts a `processing` placeholder row into the DB and immediately calls `addReferenceState(placeholder)` in the Zustand store. The card appears in the grid right away. No rollback if the background import fails — the status updates to `'failed'` instead.

2. **Follow/unfollow** (`useFollow.ts`): Before the Supabase write, calls `setIsFollowing(!prev)` and `setFollowersCount(prev ± 1)`. If the Supabase call throws, reverts both to saved `previousStatus` and `previousCount`.

3. **Notification mark-as-read** (`useNotifications.tsx`): Calls `markRead(id)` in the store before the Supabase UPDATE. No explicit rollback — if it fails, the store shows it as read but the DB has it as unread (the next page load corrects this).

4. **Member category/role update** (`useWorkspace.tsx`): Saves `previousMembers`, applies the update to `setMembers()` immediately, then calls Supabase. On error, calls `setMembers(previousMembers)` to revert.

---

### Activity Logging

**Function:** `logActivity(activityType, activityTargetTitle)` inside `useWorkspace.tsx`.

Triggered after: `deleteReference`, `updateWorkspace`, `deleteWorkspace`, `archiveWorkspace`. Not triggered for add (reference INSERT is logged separately by the notification system).

Inserts a row into `activity_logs` with `{ activity_type, activity_target_title, workspace_id, actor_profile_id }`. Silently swallows errors (non-critical path) — if the insert fails, the workspace operation already succeeded.

Activity logs are read on the dashboard (last 15 entries with actor profiles join) and displayed as a timeline in `ActivityLogDrawer`.

---

## 12. Component Architecture

### `/components/ui` vs `/components/workspace`

`/components/ui` contains **primitives** — small, generic, reusable pieces with no knowledge of Collabio business logic. `Toast`, `Card`, `NotificationBell` (though it reads Zustand), `dropdown-menu` live here. These could be used on any page.

`/components/workspace` contains **feature components** — large, opinionated components that know about references, workspaces, members, and tags. `AddReferenceModal`, `ManageMembersModal`, `WorkspaceChat` live here. They use `useWorkspace`, call Supabase directly, and contain complex business logic.

### What makes something a "primitive" vs "feature component"

A **primitive** accepts generic props (title, onClick, children) and has no knowledge of the app's domain. It could be extracted into a separate UI library with zero changes.

A **feature component** is tightly coupled to the app — it reads from `useAuth`, calls `useWorkspace`, knows what a "reference" is, queries specific tables. It cannot be reused outside Collabio without significant refactoring.

### How props flow

The data path for the workspace view is:

```
workspace/[id]/page.tsx (server) 
  → passes initialWorkspace, initialReferences, initialMembers, initialFolders, initialUserRole
  → WorkspaceClient.tsx (client)
      → uses useWorkspace(workspaceId) which hydrates Zustand stores
      → opens modals by passing handler functions as props
      → WorkspaceHeader receives workspace + onAction callbacks
      → WorkspaceSidebar receives folders + members
      → ReferenceCard receives individual reference + onEdit/onDelete/onMove
```

The server page provides the props for the first render. After hydration, `useWorkspace` takes over and all subsequent data flows through Zustand.

### Where Zustand is read vs props

**Zustand is read directly** in: hooks (`useAuth`, `useWorkspace`, `useNotifications`), `NotificationBell`, `WorkspaceChat`, `ActivityLogDrawer`, `ManageMembersModal`.

**Props are passed** to: `ReferenceCard` (individual reference object), `WorkspaceHeader` (workspace object + callbacks), `WorkspaceSidebar` (folders, members), modal components (workspaceId, current user role).

### Components with local state vs display-only

**Heavy local state:** `WorkspaceClient` (selected folder, active sort/filter, open modal, search query, chat visibility), `AddReferenceModal` (active tab, file/URL input, upload progress), `ManageMembersModal` (active tab, search query, Fuse results), `WorkspaceChat` (messages, online users, profile cache, scroll position).

**Mostly display:** `ReferenceCard` (hover state only), `WorkspaceHeader` (dropdown toggle), `ActivityLogDrawer` (open/close from parent), `MessageList` (scroll ref only).

---

## 13. Performance Decisions

### Server vs client components

Pages that need data before rendering (`dashboard/[id]/page.tsx`, `workspace/[id]/page.tsx`, `explore/page.tsx`) are server components. This means:
- The HTML arrives pre-populated — no loading flash for initial data
- Supabase queries run on the server, close to the database
- No extra client-side fetch on page load

Client components only take over for interactivity (modals, realtime, Zustand reads).

### `Promise.all()` for parallelism

Every server page uses `Promise.all()` to run all its Supabase queries simultaneously rather than sequentially. The `workspace/[id]/page.tsx` fetches workspace, references, members, and folders in one parallel batch. The `dashboard/[id]/page.tsx` fetches owned workspaces, joined workspaces, reference count, activity logs, and pending invites simultaneously. Without this, each query would wait for the previous one — the page would be 5× slower.

### Deferred channel setup

All Realtime channels are initialised inside `setTimeout(fn, 0)`. This pushes subscription setup to the next event loop tick, ensuring it does not block or delay the first render. The page paints immediately; channels connect in the background.

### No store reset on unmount

`useWorkspace`'s cleanup function explicitly avoids calling `reset()` or `setReferences([])`. If the store were cleared on unmount, navigating back to a workspace would blank the screen until the next fetch completed. By keeping stale data in the store, the previous workspace state stays visible while the fresh fetch runs — a cache-like behaviour at zero extra cost.

### Lazy image loading

Images in the dashboard layout avatar use `loading="lazy"`. The `<Image>` component from Next.js is used throughout for workspace covers and avatars — it handles WebP conversion, responsive sizing, and serves images through Next.js's built-in image optimisation.

### Memory leak prevention

Every `useEffect` in every hook returns a cleanup function that:
- Removes the `visibilitychange` event listener
- Clears any pending `setTimeout` timer IDs
- Calls `supabase.removeChannel(channel)` for every open Realtime channel

This ensures subscriptions do not accumulate when navigating between workspaces.

---

## 14. How to Explain the Project to Someone

### 30 seconds — elevator pitch for a non-technical person

"Collabio is a team workspace where you save anything — a YouTube video, a website, a PDF, a photo — and organise it all in one place. Your whole team sees everything in real time, can chat about it, and can invite others with different levels of access. Think of it as a shared mood board where your team can add, tag, and discuss references without cluttering a group chat."

---

### 2 minutes — for a developer asking what tech you used and why

"It is a Next.js 16 app using the App Router. The backend is entirely Supabase — Postgres for the database, Supabase Auth for email and OAuth login, Supabase Storage for file hosting, and Supabase Realtime for live updates. I chose Supabase because it gives me a full backend without running a separate server.

The architecture is hybrid: server components fetch initial data at request time, then client components hydrate and take over with hooks and Zustand for global state. Zustand handles auth state, the active workspace, references, and notifications — mainly because Supabase Realtime callbacks fire outside React's render cycle, and Zustand is the simplest way to bridge that.

The most complex part is the URL import pipeline — a Next.js API route downloads external media server-side (to avoid CORS), extracts Open Graph metadata, uploads the file to a Supabase Storage bucket, and streams updates back to the frontend. The reference card appears immediately as a placeholder, then updates in place when the background import finishes.

For search I use Fuse.js client-side after a Supabase `ilike` query — the DB narrows the candidate set and Fuse reranks for fuzzy relevance. The explore page also has a concept expansion layer that maps natural language like 'I need a designer' to skill keywords like 'Figma', 'UX', 'Illustrator' before searching."

---

### 5 minutes — for a technical interview on architecture, data flow, and key decisions

"Collabio is a reference collaboration platform. The problem it solves is that teams save things in WhatsApp groups, random browser bookmarks, and scattered Google Docs — there is no single place to collect, organise, and discuss creative references together.

**Architecture:** It is a Next.js monolith. Supabase handles everything that would otherwise be a separate backend — PostgreSQL database, authentication (email, Google, GitHub OAuth via PKCE flow), file storage, and WebSocket realtime. The frontend is split into server components for data fetching and client components for interactivity. Server components run at request time, call Supabase directly using a cookie-scoped server client, and pass data as props to client components. Client components use a singleton browser Supabase client from `lib/supabase.ts`.

**State management:** I use Zustand with four stores — auth, workspace, references, notifications. The key reason is Supabase Realtime — its WebSocket callbacks run outside React's render cycle. Zustand allows calling `store.getState().addReference(ref)` from inside a WebSocket handler without going through React. I deliberately do not reset the stores on component unmount — this avoids the blank loading flash when navigating back to a workspace.

**Data flow for a reference import:** User pastes a URL → client detects platform and type → inserts a `processing` placeholder to the DB → adds it to Zustand immediately (card appears) → sends a POST to `/api/import-url` in the background → the server route fetches the URL, extracts Open Graph metadata, downloads the media blob, uploads to Supabase Storage → responds with the public URL and metadata → client updates the DB row → Realtime UPDATE event fires → Zustand `updateReferenceState` is called → card updates in place. The whole experience feels instant to the user.

**Security:** RLS is the primary security boundary. Since the browser uses the public anon key, RLS policies on every table enforce access. Workspace access checks whether the user is the owner, a member in `workspace_members`, or whether the workspace is public. The permission system in the `useWorkspace` hook adds an application-level layer on top — checking roles before allowing any CRUD action.

**Realtime:** Each workspace view opens four Postgres change channels (references INSERT/UPDATE/DELETE, workspace UPDATE, members changes, a second reference UPDATE channel). Notifications use a separate channel filtered by recipient ID. Chat uses a messages INSERT channel plus a Presence channel for online status. All channels are set up with `setTimeout(fn, 0)` to not block render, and a `visibilitychange` listener recreates dead channels when the tab comes back into focus — this fixes a common Supabase WebSocket issue where backgrounded tabs lose their connection.

**Key trade-off decisions:** Using Supabase for everything means vendor dependency but eliminates the need for a custom auth server, an ORM, a file storage service, and a WebSocket server — four separate infrastructure concerns handled by one platform. Using Zustand over React Context means less idiomatic React but dramatically better performance for realtime-updated global state. Server components mean the initial page render has real data, not a loading spinner — which significantly improves perceived performance."

---

## 15. Glossary

| Term | Definition |
|---|---|
| **Supabase** | An open-source backend platform built on PostgreSQL. Provides a REST/Realtime API, auth system, file storage, and SQL database — all managed as a service. |
| **RLS (Row Level Security)** | A PostgreSQL feature. Policies defined on each table restrict which rows each database user can SELECT, INSERT, UPDATE, or DELETE. In Supabase, the "user" is identified by the JWT token in the request. |
| **Realtime** | Supabase's WebSocket service. Listens for changes in PostgreSQL (via Postgres logical replication) and pushes them to subscribed browser clients over a persistent WebSocket connection. |
| **Storage bucket** | A named container in Supabase Storage (like an S3 bucket). The project uses one bucket: `Link-UpWorkpace`. Files inside are organised by path prefix (e.g. `imports/video/...`, `imports/previews/...`). |
| **SSR (Server-Side Rendering)** | Rendering a page's HTML on the server before sending it to the browser. In Next.js App Router, server components always render on the server. |
| **Next.js App Router** | The file-system-based routing system introduced in Next.js 13+. Folder structure defines routes. Special files (`page.tsx`, `layout.tsx`) have defined roles. Supports server and client components in the same tree. |
| **Server Component** | A React component that runs only on the server. Can fetch data, read environment variables, and access server-only APIs (like cookies). Cannot use `useState`, `useEffect`, or browser APIs. |
| **Client Component** | A React component marked `"use client"`. Runs in the browser. Can use hooks, event handlers, browser APIs, and Zustand. Receives initial props from server components. |
| **Middleware** | A Next.js function in `middleware.ts` that runs on every request before any page or API route. Used here for auth-based redirects. |
| **Zustand** | A minimal, hook-based global state library for React. Unlike Context/Redux, it does not require wrapping providers, works outside React components, and only re-renders components subscribed to the specific slice of state that changed. |
| **Store** | A Zustand state container. Holds a slice of global state (e.g. `authStore` holds user and profile). Components subscribe to stores via `useAuthStore()`. |
| **Hydration** | The process of React "taking over" server-rendered HTML on the client — attaching event listeners and activating interactivity. A hydration mismatch occurs when server and client render different HTML. |
| **Optimistic update** | Updating the UI immediately before the server confirms the change. Improves perceived performance. If the server call fails, the UI reverts to the previous state. |
| **Rollback** | Reverting an optimistic update after a server error. The previous state is saved before the optimistic change and restored on failure. |
| **Fuse.js** | A client-side fuzzy search library. Given a dataset and a query, it returns results ranked by relevance score using the Bitap algorithm. Threshold controls how fuzzy — 0.0 is exact match, 1.0 matches anything. |
| **Fuzzy search** | A search that finds approximate matches, not just exact ones. "yuotube" would still match "youtube" with a loose threshold. |
| **PKCE (Proof Key for Code Exchange)** | An OAuth security extension. The browser generates a random code verifier and sends a hash of it with the auth request. The server verifies the unhashed verifier when exchanging the code for a token. Prevents interception attacks on the auth code. |
| **Workspace** | The top-level container in Collabio. Represents one project. Has a title, description, visibility (public/private), owner, members, references, folders, and a chat. |
| **Reference** | A saved item in a workspace. Can be a URL, uploaded image, video, audio file, document, or a web link. Has a type, title, thumbnail, tags, and an optional folder. |
| **Member** | A user added to a workspace. Has a role: owner, member, or viewer. |
| **Role** | The permission level of a member. `owner` = full control. `member` = can add and edit content. `viewer` = read-only. |
| **Activity Log** | A timeline of notable actions in a workspace — who deleted a reference, who updated the workspace settings, etc. Stored in the `activity_logs` table. Displayed in `ActivityLogDrawer`. |
| **Presence** | Supabase Presence is a WebSocket feature for tracking who is currently "online" in a channel. Used in `WorkspaceChat` to show which members have the chat panel open. |
| **Toast** | A small temporary popup message shown to confirm an action or report an error. Disappears automatically after 3 seconds. Implemented via `Toast.tsx` and the `useToast()` hook. |
| **DiceBear** | An avatar generation service. Given a seed string, returns a deterministic SVG avatar. Used as fallback when users have no profile picture (`api.dicebear.com/7.x/avataaars/svg?seed=...`). |
| **`cn()` utility** | Short for "class names". Combines `clsx` (conditional class logic) and `tailwind-merge` (removes conflicting Tailwind classes). Used everywhere instead of template string concatenation for class names. |
| **FolderFilter** | A TypeScript union type used in `WorkspaceClient` to represent the active folder view: `null` (all references), `{ type: 'folder', folderId }` (a specific folder), or `{ type: 'uncategorized' }` (references with no folder). |
| **Open Graph** | A protocol where web pages embed `<meta property="og:...">` tags so other apps can extract structured metadata — title, description, preview image, video URL. Used by the import pipeline to get thumbnails and titles for saved URLs. |
| **Singleton** | A pattern where only one instance of something is created and reused. `authInitPromise` in `useAuth.tsx` is a singleton — the auth initialisation promise is created once and reused by every component that calls `useAuth()`, preventing duplicate session fetches. |
