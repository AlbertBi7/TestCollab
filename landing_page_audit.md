# Landing Page Audit: Project vs. "AI Slop"

This document scans the current landing page of Collabio to identify genuine project features versus generic, unsubstantiated marketing "slop" (stats, placeholder text, or AI-generated fluff).

## 1. Hero Section ([src/components/landing/Hero.tsx](src/components/landing/Hero.tsx))
- **Status:** Mostly relevant, but has some generic phrasing.
- **Genuine Features:**
  - "Visual workspace for references, links, and ideas."
  - "Explore Workspaces" (Connects to real `/explore` functionality).
  - "Sign Up Free" (Core auth).
  - Collaborative visual indicators (4 Collaborators badge).
- **AI Slop/Generic Fluff:**
  - "Organize your creative chaos" (Classic AI-generated punchline).
  - "Stop digging through folders and start connecting the dots" (Generic marketing speak).
  - "New Public Workspaces" tag (Is it actually "new"? It's a static tag).

## 2. Stats Section ([src/app/page.tsx](src/app/page.tsx))
- **Status: CRITICAL SLOP**
- **Issues:**
  - `10k+ Active Creatives`: Fabricated/Placeholder stat.
  - `1M+ References Saved`: Fabricated/Placeholder stat.
  - `99% Uptime`: Generic placeholder.
  - `4.9/5 User Rating`: Generic placeholder.
- **Action:** Replace with actual project capabilities or remove if no real data exists yet.

## 3. Features Section ([src/components/landing/Features.tsx](src/components/landing/Features.tsx))
- **Status:** Good, but descriptions are a bit "wordy" in an AI way.
- **Genuine Features:**
  - **Visual Cluster View:** Relates to workspace layout.
  - **Instant Capture:** Relates to URL metadata detection in `api/import-url`.
  - **Real-time Collaboration:** Relates to Supabase Realtime/Presence.
  - **Private & Public Spaces:** Relates to workspace visibility settings.
- **AI Slop/Generic Fluff:**
  - "Everything you need to flow" (Generic header).
  - Descriptions use fluff like "mimic how your brain works" or "Work together in harmony".

## 4. CTA Section ([src/app/page.tsx](src/app/page.tsx))
- **Status:** Functional but generic.
- **Action:** Make it more specific to the tool's collaborative nature.

---

## Proposed Changes
1. **Remove Stats Section:** Since there are no real 10k users yet, replace this with direct "How it works" or project-specific screenshots/capabilities.
2. **Sharpen Copy:** Rewrite Hero and Features to be more technical/functional rather than poetic.
3. **Focus on Workspaces:** Emphasize the unique hierarchy of Workspaces -> Folders -> References which is the core of the app.
4. **Remove Placeholder Badges:** Remove "User Rating" and "Active Creatives" unless they pull from actual DB counts.