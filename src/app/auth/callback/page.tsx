"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log("Auth callback started", window.location.href);
      // Get the code from URL query params (Supabase uses PKCE flow)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const error = urlParams.get("error");
      const errorDescription = urlParams.get("error_description");

      if (error) {
        console.error("OAuth error in URL:", error, errorDescription);
        router.push(`/login?error=${error}`);
        return;
      }

      // If there's a code, exchange it for a session
      if (code) {
        console.log("EXCHANGING CODE FOR SESSION...");
        try {
          const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

          if (sessionError) {
            console.error("Error exchanging code for session:", sessionError.message);
            router.push(`/login?error=session_error&details=${encodeURIComponent(sessionError.message)}`);
            return;
          }

          if (data?.user) {
            console.log("SESSION CREATED SUCCESSFULLY", data.user.id);
            router.replace(`/dashboard/${data.user.id}`);
          } else {
            console.error("No user found after exchanging code.");
            router.push("/login?error=user_not_found");
          }
        } catch (err) {
          console.error("Unexpected error in callback:", err);
          router.push("/login?error=callback_error");
        }
      } else {
        // Fallback: Check if there's already a session established by the listener
        console.log("Checking for existing session...");
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log("Existing session found", session.user.id);
          router.replace(`/dashboard/${session.user.id}`);
        } else {
          console.error("No code or session found in callback.");
          // Only redirect if we've waited long enough for potential async init
          setTimeout(() => {
            router.push("/login?error=no_session_found");
          }, 1000);
        }
      }
    };

    handleAuthCallback();
  }, [router]);

  return <div>Loading...</div>;
}