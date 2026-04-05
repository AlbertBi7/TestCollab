import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDefaultAvatarUrl } from "@/lib/avatar";

export default async function DashboardRedirectPage() {
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
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("No user found in dashboard redirect, going to login");
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, profile_email, profile_avatar_url")
    .eq("profile_id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name?.trim() || "";
  const profileEmail = profile?.profile_email?.trim() || "";
  const authEmail = user.email?.trim() || "";

  const hasRequiredName = displayName.length > 0;
  const hasRequiredEmail = (profileEmail || authEmail).length > 0;

  if (!hasRequiredName || !hasRequiredEmail) {
    redirect("/profile/setup");
  }

  if (!profile?.profile_avatar_url?.trim()) {
    const defaultAvatar = getDefaultAvatarUrl(displayName || profileEmail || authEmail || user.id);
    await supabase.from("profiles").upsert(
      {
        profile_id: user.id,
        profile_avatar_url: defaultAvatar,
      },
      { onConflict: "profile_id" }
    );
  }

  console.log("User found in dashboard redirect, going to:", `/dashboard/${user.id}`);
  redirect(`/dashboard/${user.id}`);
}
