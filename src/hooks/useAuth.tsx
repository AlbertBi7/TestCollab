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
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // B. If logged in, fetch the Extra Details from 'profiles' table
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('profile_id', session.user.id)
            .single();

          // C. Merge them into one object
          setUser({
            ...session.user,
            display_name: profile?.display_name,
            avatar_url: profile?.profile_avatar_url, // Matches your DB column name
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // D. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
         // Re-fetch profile on login to be safe
         const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('profile_id', session.user.id)
          .single();
          
         setUser({
          ...session.user,
          display_name: profile?.display_name,
          avatar_url: profile?.profile_avatar_url,
        });
      } else {
        setUser(null);
        if (_event === 'SIGNED_OUT') router.push('/login');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return { user, loading, signOut };
}