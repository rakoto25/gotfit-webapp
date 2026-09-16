import { getPostAuthRoute, isCoach } from "@/lib/auth";
import type { User } from "@/types/auth";

export function getSafeRedirect(value: string | null): string | null {
  if (!value) return null;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || /[\\\u0000-\u0020]/.test(path)) return null;
  return path;
}

export function getAuthDestination(user: User, search: string): string {
  if (isCoach(user)) return getPostAuthRoute(user);
  return getSafeRedirect(new URLSearchParams(search).get("redirect")) ?? getPostAuthRoute(user);
}
