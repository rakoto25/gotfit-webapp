"use client";

import { apiRequest, normalizeArray } from "@/lib/marketplace";
import type { Intervenant } from "@/lib/intervenants";

export type CoachFavorite = {
  id: number;
  user_id?: number;
  coach_id: number;
  coach?: Intervenant | null;
  created_at?: string | null;
};

export async function fetchCoachFavorites() {
  const payload = await apiRequest<{ favorites?: CoachFavorite[] }>(
    "/coach-favorites",
    { auth: true }
  );

  return normalizeArray<CoachFavorite>(payload, ["favorites"]);
}

export async function addCoachFavorite(coachId: number | string) {
  const payload = await apiRequest<{ favorite?: CoachFavorite }>(
    `/coach-favorites/${coachId}`,
    { method: "POST", auth: true }
  );

  return payload.favorite || null;
}

export async function removeCoachFavorite(coachId: number | string) {
  return apiRequest(`/coach-favorites/${coachId}`, {
    method: "DELETE",
    auth: true,
  });
}
