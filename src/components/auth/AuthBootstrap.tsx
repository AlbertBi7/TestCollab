"use client";

import { useAuth } from "@/hooks/useAuth";

export function AuthBootstrap() {
  // Ensure auth initialization runs once globally on app mount.
  useAuth();
  return null;
}
