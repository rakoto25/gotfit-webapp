import { apiRequest, normalizeArray } from "@/lib/marketplace";

export type CoachForumAuthor = {
  id: number;
  name: string;
  coach_title?: string | null;
  photo_url?: string | null;
};

export type CoachForumPost = {
  id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  author?: CoachForumAuthor | null;
};

export async function fetchCoachForumPosts() {
  const payload = await apiRequest<{ posts?: CoachForumPost[] }>(
    "/coach/forum",
    { auth: true }
  );

  return normalizeArray<CoachForumPost>(payload, ["posts"]);
}

export async function publishCoachForumPost(content: string) {
  const payload = await apiRequest<{ post?: CoachForumPost }>(
    "/coach/forum",
    {
      method: "POST",
      auth: true,
      body: { content },
    }
  );

  if (!payload.post) {
    throw new Error("Le message a été envoyé, mais la réponse est incomplète.");
  }

  return payload.post;
}

export async function deleteCoachForumPost(postId: number) {
  await apiRequest(`/coach/forum/${postId}`, {
    method: "DELETE",
    auth: true,
  });
}
