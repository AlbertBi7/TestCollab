import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import ExploreClient from "./ExploreClient";

const WORKSPACE_FETCH_LIMIT = 9;
const PROFILE_FETCH_LIMIT = 8;
const CANDIDATE_FETCH_LIMIT = 40;

const isKnownDisplayName = (displayName?: string | null) => {
  const normalized = (displayName || "").trim().toLowerCase();
  return (
    normalized.length > 0 &&
    normalized !== "unknown user" &&
    normalized !== "unknown" &&
    normalized !== "anonymous user" &&
    normalized !== "anonymous"
  );
};

export default async function ExplorePage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: publicWorkspaces }, { data: rawProfiles }] = await Promise.all([
    supabase
      .from("workspaces")
      .select("workspace_id, workspace_title, workspace_description, workspace_visibility, workspace_created_at, workspace_owner_id")
      .eq("workspace_visibility", "public")
      .eq("is_archived", false)
      .order("workspace_created_at", { ascending: false })
      .limit(CANDIDATE_FETCH_LIMIT),
    supabase
      .from("profiles")
      .select("profile_id, display_name, profile_avatar_url, profile_skills")
      .limit(CANDIDATE_FETCH_LIMIT),
  ]);

  const ownerIds = Array.from(new Set((publicWorkspaces || []).map((w) => w.workspace_owner_id).filter(Boolean)));

  const { data: ownerProfiles } = ownerIds.length
    ? await supabase
        .from("profiles")
        .select("profile_id, display_name, profile_avatar_url")
        .in("profile_id", ownerIds)
    : { data: [] as any[] };

  const ownerProfileMap = new Map((ownerProfiles || []).map((p: any) => [p.profile_id, p]));

  const filteredWorkspaces = (publicWorkspaces || [])
    .map((workspace: any) => {
      const owner = ownerProfileMap.get(workspace.workspace_owner_id);
      if (!owner || !isKnownDisplayName(owner.display_name)) return null;
      return {
        ...workspace,
        display_name: owner.display_name,
        profile_avatar_url: owner.profile_avatar_url,
      };
    })
    .filter(Boolean)
    .slice(0, WORKSPACE_FETCH_LIMIT);

  const profiles = (rawProfiles || [])
    .filter((p: any) => isKnownDisplayName(p.display_name))
    .slice(0, PROFILE_FETCH_LIMIT);

  if (!profiles.length) {
    return <ExploreClient initialWorkspaces={filteredWorkspaces} initialProfiles={[]} />;
  }

  const profileIds = profiles.map(p => p.profile_id);

  // Fetch counts and follow status in bulk
  const [
    { data: followersData },
    { data: workspacesData },
    { data: userFollowingsData }
  ] = await Promise.all([
    supabase.from("followers").select("following_id").in("following_id", profileIds),
    supabase.from("workspaces").select("workspace_owner_id").in("workspace_owner_id", profileIds),
    user ? supabase.from("followers").select("following_id").eq("follower_id", user.id).in("following_id", profileIds) : Promise.resolve({ data: [] })
  ]);

  // Map counts
  const followerCounts = (followersData || []).reduce((acc: any, curr: any) => {
    acc[curr.following_id] = (acc[curr.following_id] || 0) + 1;
    return acc;
  }, {});

  const workspaceCounts = (workspacesData || []).reduce((acc: any, curr: any) => {
    acc[curr.workspace_owner_id] = (acc[curr.workspace_owner_id] || 0) + 1;
    return acc;
  }, {});

  const userFollowingSet = new Set((userFollowingsData || []).map((f: any) => f.following_id));

  // Transform profiles
  const transformedProfiles = profiles.map(p => ({
    ...p,
    followers_count: followerCounts[p.profile_id] || 0,
    workspaces_count: workspaceCounts[p.profile_id] || 0,
    is_following: userFollowingSet.has(p.profile_id)
  }));

  return <ExploreClient initialWorkspaces={filteredWorkspaces} initialProfiles={transformedProfiles} />;
}
