"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// 1. Define a custom type that matches your Database
export interface UserProfile extends User {
  display_name?: string;
  avatar_url?: string;
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        // A. Get the Basic Auth User
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log("Supabase session:", session); // Debug session
        if (sessionError) {
          console.error("Error fetching session:", sessionError);
          setLoading(false);
          return;
        }

        if (!session?.user) {
          console.log("No active session found.");
          setLoading(false);
          return;
        }

        // B. If logged in, fetch the Extra Details from 'profiles' table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('profile_id', session.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else {
          console.log("Fetched profile:", profile); // Debug profile data
        }

        // C. Merge them into one object
        setUser({
          ...session.user,
          display_name: profile?.display_name,
          avatar_url: profile?.profile_avatar_url, // Matches your DB column name
        });

        // Note: Don't redirect here - let the auth callback or individual pages handle redirects
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // D. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed:", _event, session); // Debug auth state changes

      if (session?.user) {
        // Re-fetch profile on login to be safe
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('profile_id', session.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile on auth change:", profileError);
        } else {
          console.log("Fetched profile on auth change:", profile); // Debug profile data
        }

        setUser({
          ...session.user,
          display_name: profile?.display_name,
          avatar_url: profile?.profile_avatar_url,
        });
      } else {
        console.log("User signed out or no session available.");
        setUser(null);
        // Only redirect automatically on session timeout, not on manual signOut
        // (signOut function handles its own redirect)
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const signOut = async () => {
    try {
      setUser(null); // Clear user immediately for instant UI feedback
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
      }
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
      router.push("/login"); // Still redirect even if error
    }
  };

  return { user, loading, signOut };
}