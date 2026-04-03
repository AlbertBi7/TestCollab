# Collabio Logic Audit Report

## Scope
This audit focuses on application logic, auth/session behavior, route access control, API safety, and mutation reliability across major dashboard, profile, workspace, notifications, and import flows.

## CRITICAL

### 1. Auth hook contract is broken across the app
- Finding: The auth hook returns loading, but consuming pages destructure isLoading. This is a live contract mismatch and currently reported as a compile error.
- Evidence:
  - [src/hooks/useAuth.tsx](src/hooks/useAuth.tsx#L121)
  - [src/hooks/useAuth.tsx](src/hooks/useAuth.tsx#L142)
  - [src/app/(dashboard)/layout.tsx](src/app/(dashboard)/layout.tsx#L23)
  - [src/app/(dashboard)/dashboard/[id]/DashboardClient.tsx](src/app/(dashboard)/dashboard/[id]/DashboardClient.tsx#L27)
- Impact: Auth loading state becomes undefined in consumers, causing broken guards, incorrect redirects, and unstable rendering behavior in protected flows.
- Recommendation: Standardize the hook return shape immediately (either return isLoading or update all consumers), then re-run type checks to ensure zero references to the wrong field.

## HIGH

### 2. Import URL API allows unauthenticated remote fetch and storage operations
- Finding: The endpoint accepts request body input and performs remote fetches even when no verified user token is present. User identity is optional and not enforced.
- Evidence:
  - [src/app/api/import-url/route.ts](src/app/api/import-url/route.ts#L216)
  - [src/app/api/import-url/route.ts](src/app/api/import-url/route.ts#L224)
  - [src/app/api/import-url/route.ts](src/app/api/import-url/route.ts#L241)
  - [src/app/api/import-url/route.ts](src/app/api/import-url/route.ts#L263)
  - [src/app/api/import-url/route.ts](src/app/api/import-url/route.ts#L345)
- Impact: Abuse risk for server-side outbound requests and storage write amplification. This can become a cost and security issue.
- Recommendation: Require authenticated user context before processing, reject requests without a valid token, and enforce strict allowlisting and URL validation.

### 3. Import URL API can run with elevated storage client context
- Finding: The route can create a service-role-backed storage client when service role key exists.
- Evidence:
  - [src/app/api/import-url/route.ts](src/app/api/import-url/route.ts#L231)
  - [src/app/api/import-url/route.ts](src/app/api/import-url/route.ts#L233)
- Impact: If auth checks are weak, this increases blast radius for misuse of uploads and asset handling.
- Recommendation: Keep service-role use behind strict authenticated server-side authorization checks and per-user quotas.

## MEDIUM

### 4. Public profile route behavior is inconsistent between middleware and layout
- Finding: Middleware classifies only specific profile paths as protected, while dashboard layout still enforces auth redirect on profile pages in the dashboard route group.
- Evidence:
  - [middleware.ts](middleware.ts#L45)
  - [middleware.ts](middleware.ts#L53)
  - [src/app/(dashboard)/layout.tsx](src/app/(dashboard)/layout.tsx#L37)
  - [src/app/(dashboard)/layout.tsx](src/app/(dashboard)/layout.tsx#L43)
- Impact: Users can hit profile URLs that are not middleware-blocked, but client layout forces login redirect, causing access ambiguity and potential UX loops.
- Recommendation: Decide whether profile pages are truly public or protected, then align middleware and layout logic to the same policy.

### 5. Workspace settings mutations do not validate write result before success flow
- Finding: Save, archive, and delete operations execute mutations and continue success navigation/toasts without checking returned mutation errors.
- Evidence:
  - [src/app/(dashboard)/workspace/[id]/settings/page.tsx](src/app/(dashboard)/workspace/[id]/settings/page.tsx#L161)
  - [src/app/(dashboard)/workspace/[id]/settings/page.tsx](src/app/(dashboard)/workspace/[id]/settings/page.tsx#L186)
  - [src/app/(dashboard)/workspace/[id]/settings/page.tsx](src/app/(dashboard)/workspace/[id]/settings/page.tsx#L194)
  - [src/app/(dashboard)/workspace/[id]/settings/page.tsx](src/app/(dashboard)/workspace/[id]/settings/page.tsx#L216)
- Impact: UI can report success or navigate away even if DB mutation failed, causing silent data inconsistency.
- Recommendation: Capture mutation response errors and block success UI/redirect when failures occur.

### 6. Profile page falls back to mock identity/content on data errors
- Finding: When profile fetch fails, the page renders hardcoded mock profile, stats, and workspaces.
- Evidence:
  - [src/app/(dashboard)/profile/[id]/page.tsx](src/app/(dashboard)/profile/[id]/page.tsx#L60)
  - [src/app/(dashboard)/profile/[id]/page.tsx](src/app/(dashboard)/profile/[id]/page.tsx#L169)
  - [src/app/(dashboard)/profile/[id]/page.tsx](src/app/(dashboard)/profile/[id]/page.tsx#L172)
  - [src/app/(dashboard)/profile/[id]/page.tsx](src/app/(dashboard)/profile/[id]/page.tsx#L174)
- Impact: Data fidelity issue. Real fetch failures can be masked as real user content, which can mislead users and complicate debugging.
- Recommendation: Show an explicit error/empty state instead of synthetic identity data.

## LOW

### 7. Debug logging remains in production paths
- Finding: Settings and profile edit flows include console logging in user-facing execution paths.
- Evidence:
  - [src/app/(dashboard)/workspace/[id]/settings/page.tsx](src/app/(dashboard)/workspace/[id]/settings/page.tsx#L60)
  - [src/components/profile/EditProfileModal.tsx](src/components/profile/EditProfileModal.tsx#L197)
- Impact: Noise in production logs and potential metadata exposure in client console.
- Recommendation: Remove or gate logs behind development checks.

### 8. Middleware references auth confirm route that is not present in current app tree
- Finding: Middleware whitelists /auth/confirm as public, but current routing tree shows callback page only.
- Evidence:
  - [middleware.ts](middleware.ts#L56)
- Impact: Low immediate runtime impact, but indicates route-policy drift and future maintenance confusion.
- Recommendation: Remove stale route checks or implement the missing route intentionally.

## PASSING AREAS

### 1. Owner authorization guard exists before entering workspace settings
- Evidence:
  - [src/app/(dashboard)/workspace/[id]/settings/page.tsx](src/app/(dashboard)/workspace/[id]/settings/page.tsx#L88)
  - [src/app/(dashboard)/workspace/[id]/settings/page.tsx](src/app/(dashboard)/workspace/[id]/settings/page.tsx#L91)
- Why this passes: Non-owners are redirected away from settings.

### 2. Invite accept flow handles duplicate membership safely
- Evidence:
  - [src/components/ui/NotificationBell.tsx](src/components/ui/NotificationBell.tsx#L60)
- Why this passes: Duplicate insert conflict is tolerated, reducing failure noise during repeated invite actions.

### 3. Notifications realtime subscription has cleanup and visibility reconnect handling
- Evidence:
  - [src/hooks/useNotifications.tsx](src/hooks/useNotifications.tsx#L123)
  - [src/hooks/useNotifications.tsx](src/hooks/useNotifications.tsx#L126)
  - [src/hooks/useNotifications.tsx](src/hooks/useNotifications.tsx#L129)
- Why this passes: Reduces stale channels and improves resiliency after tab visibility changes.

## Overall Assessment
Current codebase has one immediate blocker-level auth-state contract defect and two high-risk API safety/authz concerns. These should be addressed before release. Medium and low findings are mostly consistency and reliability hardening items and can be scheduled right after critical/high fixes.
