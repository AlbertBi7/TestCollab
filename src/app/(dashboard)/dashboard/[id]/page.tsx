import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { getDefaultAvatarUrl } from "@/lib/avatar";

export default async function UserDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, profile_email, profile_avatar_url")
    .eq("profile_id", authUser.id)
    .maybeSingle();

  const displayName = profile?.display_name?.trim() || "";
  const profileEmail = profile?.profile_email?.trim() || "";
  const authEmail = authUser.email?.trim() || "";

  const hasRequiredName = displayName.length > 0;
  const hasRequiredEmail = (profileEmail || authEmail).length > 0;

  if (!hasRequiredName || !hasRequiredEmail) {
    redirect("/profile/setup");
  }

  if (!profile?.profile_avatar_url?.trim()) {
    const defaultAvatar = getDefaultAvatarUrl(displayName || profileEmail || authEmail || authUser.id);
    await supabase.from("profiles").upsert(
      {
        profile_id: authUser.id,
        profile_avatar_url: defaultAvatar,
      },
      { onConflict: "profile_id" }
    );
  }

  const effectiveUserId = authUser.id || userId;

  const [{ data: memberRows }, { data: ownedWorkspaces }, { count: userReferencesCount }] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("workspace_id, workspaces(*)")
      .eq("profile_id", effectiveUserId)
      .limit(200),
    supabase
      .from("workspaces")
      .select("*")
      .eq("workspace_owner_id", effectiveUserId)
      .order("workspace_created_at", { ascending: false })
      .limit(200),
    supabase
      .from("references")
      .select("reference_id", { count: "exact", head: true })
      .eq("uploaded_by_profile_id", effectiveUserId),
  ]);

  const ownedWorkspaceIds = new Set((ownedWorkspaces || []).map((w: any) => w.workspace_id));

  const joinedSharedWorkspaces = (memberRows || [])
    .map((row: any) => row.workspaces)
    .filter(Boolean)
    .flat();

  const joinedSharedIds = new Set(
    joinedSharedWorkspaces.map((w: any) => w.workspace_id).filter(Boolean)
  );

  const fallbackSharedIds = Array.from(
    new Set(
      (memberRows || [])
        .map((row: any) => row.workspace_id)
        .filter(
          (id: string) =>
            !!id && !ownedWorkspaceIds.has(id) && !joinedSharedIds.has(id)
        )
    )
  );

  const { data: fallbackSharedWorkspaces } = fallbackSharedIds.length
    ? await supabase
        .from("workspaces")
        .select("*")
        .in("workspace_id", fallbackSharedIds)
        .order("workspace_created_at", { ascending: false })
    : { data: [] as any[] };

  const allWorkspaces = [
    ...(ownedWorkspaces || []),
    ...joinedSharedWorkspaces,
    ...(fallbackSharedWorkspaces || []),
  ];
  const uniqueWorkspaces = Array.from(
    new Map(allWorkspaces.map((w: any) => [w.workspace_id, w])).values()
  );
  const activeWorkspaces = uniqueWorkspaces.filter((workspace: any) => !workspace.is_archived);

  const workspaceIds = activeWorkspaces.map((w: any) => w.workspace_id);

  const [{ data: activityLogs }, { data: pendingInviteRows }] = await Promise.all([
    workspaceIds.length
      ? supabase
          .from("activity_logs")
          .select("*, profiles(display_name, profile_avatar_url)")
          .in("workspace_id", workspaceIds)
          .order("activity_created_at", { ascending: false })
          .limit(15)
      : Promise.resolve({ data: [] as any[] }),
    supabase
      .from("notifications")
      .select("notification_id, recipient_profile_id, notification_message, notification_created_at, notification_data")
      .eq("notification_type", "workspace_invite")
      .eq("notification_data->>inviter_id", effectiveUserId)
      .order("notification_created_at", { ascending: false })
      .limit(20),
  ]);

  const recipientIds = Array.from(
    new Set((pendingInviteRows || []).map((invite: any) => invite.recipient_profile_id).filter(Boolean))
  );

  const { data: recipientProfiles } = recipientIds.length
    ? await supabase
        .from("profiles")
        .select("profile_id, display_name, profile_email")
        .in("profile_id", recipientIds)
    : { data: [] as any[] };

  const recipientMap = new Map((recipientProfiles || []).map((profile: any) => [profile.profile_id, profile]));

  const pendingInvites = (pendingInviteRows || []).map((invite: any) => ({
    notification_id: invite.notification_id,
    recipient_profile_id: invite.recipient_profile_id,
    recipient_name:
      recipientMap.get(invite.recipient_profile_id)?.display_name ||
      recipientMap.get(invite.recipient_profile_id)?.profile_email ||
      "Unknown user",
    workspace_title: invite.notification_data?.workspace_title || "Workspace",
    created_at: invite.notification_created_at,
  }));

  return (
    <DashboardClient
      initialWorkspaces={activeWorkspaces}
      initialActivityLogs={activityLogs || []}
      initialPendingInvites={pendingInvites}
      userId={effectiveUserId}
      ownedWorkspaceCount={(ownedWorkspaces || []).filter((workspace: any) => !workspace.is_archived).length}
      userReferencesCount={userReferencesCount || 0}
    />
  );
}