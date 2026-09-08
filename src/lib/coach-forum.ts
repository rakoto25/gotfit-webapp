import { apiRequest, normalizeArray } from "@/lib/marketplace";

export type ForumReaction = "like" | "love" | "helpful" | "celebrate";

export type CoachForumAuthor = {
  id: number;
  name: string;
  coach_title?: string | null;
  photo?: string | null;
  photo_url?: string | null;
  google_avatar_url?: string | null;
};

export type ForumChannel = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  is_official: boolean;
  is_active: boolean;
  sort_order: number;
  discussions_count?: number;
};

export type ForumDiscussion = {
  id: number;
  channel_id: number;
  author_id: number;
  title: string;
  body: string;
  is_pinned: boolean;
  is_locked: boolean;
  views_count: number;
  comments_count: number;
  reactions_count: number;
  reaction_counts?: Partial<Record<ForumReaction, number>>;
  viewer_reaction?: ForumReaction | null;
  last_activity_at?: string | null;
  created_at: string;
  updated_at: string;
  author?: CoachForumAuthor | null;
  channel?: ForumChannel | null;
  can_edit?: boolean;
  can_moderate?: boolean;
};

export type ForumComment = {
  id: number;
  discussion_id: number;
  author_id: number;
  parent_id?: number | null;
  body: string;
  created_at: string;
  updated_at: string;
  author?: CoachForumAuthor | null;
  reaction_counts?: Partial<Record<ForumReaction, number>>;
  viewer_reaction?: ForumReaction | null;
  can_edit?: boolean;
  children: ForumComment[];
};

export type ForumNotification = {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  url?: string | null;
  read_at?: string | null;
  created_at: string;
  actor?: CoachForumAuthor | null;
};

export type ForumReport = {
  id: number;
  reason: string;
  details?: string | null;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
  reporter?: CoachForumAuthor | null;
  discussion?: ForumDiscussion | null;
  comment?: (ForumComment & { discussion?: ForumDiscussion | null }) | null;
};

export type ForumPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type Paginated<T> = ForumPagination & { data: T[] };

export function formatForumDate(value?: string | null) {
  if (!value) return "À l’instant";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function forumInitials(name?: string | null) {
  return (name || "Coach").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function getForumError(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

export async function fetchForumChannels() {
  const payload = await apiRequest<{ channels?: ForumChannel[] }>("/forum/channels", { auth: true });
  return normalizeArray<ForumChannel>(payload, ["channels"]);
}

export async function fetchForumDiscussions(params: { channel?: string; q?: string; sort?: "recent" | "popular"; page?: number } = {}) {
  const search = new URLSearchParams();
  if (params.channel) search.set("channel", params.channel);
  if (params.q) search.set("q", params.q);
  if (params.sort) search.set("sort", params.sort);
  if (params.page) search.set("page", String(params.page));
  const payload = await apiRequest<{ discussions?: Paginated<ForumDiscussion> }>(`/forum/discussions${search.size ? `?${search}` : ""}`, { auth: true });
  const paginated = payload.discussions;
  return {
    discussions: paginated?.data || [],
    pagination: paginated ? { current_page: paginated.current_page, last_page: paginated.last_page, per_page: paginated.per_page, total: paginated.total } : null,
  };
}

export async function fetchForumDiscussion(id: number | string) {
  const payload = await apiRequest<{ discussion?: ForumDiscussion; comments?: ForumComment[] }>(`/forum/discussions/${encodeURIComponent(String(id))}`, { auth: true });
  if (!payload.discussion) throw new Error("Discussion introuvable.");
  return { discussion: payload.discussion, comments: payload.comments || [] };
}

export async function createForumDiscussion(body: { channel_id: number; title: string; body: string; mention_ids?: number[] }) {
  const payload = await apiRequest<{ discussion?: ForumDiscussion }>("/forum/discussions", { method: "POST", auth: true, body });
  if (!payload.discussion) throw new Error("La discussion a été créée, mais la réponse est incomplète.");
  return payload.discussion;
}

export async function updateForumDiscussion(id: number, body: Partial<{ channel_id: number; title: string; body: string; mention_ids: number[] }>) {
  const payload = await apiRequest<{ discussion?: ForumDiscussion }>(`/forum/discussions/${id}`, { method: "PUT", auth: true, body });
  if (!payload.discussion) throw new Error("Mise à jour incomplète.");
  return payload.discussion;
}

export async function deleteForumDiscussion(id: number) {
  await apiRequest(`/forum/discussions/${id}`, { method: "DELETE", auth: true });
}

export async function createForumComment(discussionId: number, body: { body: string; parent_id?: number | null; mention_ids?: number[] }) {
  const payload = await apiRequest<{ comment?: ForumComment }>(`/forum/discussions/${discussionId}/comments`, { method: "POST", auth: true, body });
  if (!payload.comment) throw new Error("La réponse a été publiée, mais la réponse API est incomplète.");
  return payload.comment;
}

export async function updateForumComment(id: number, body: string, mention_ids: number[] = []) {
  const payload = await apiRequest<{ comment?: ForumComment }>(`/forum/comments/${id}`, { method: "PUT", auth: true, body: { body, mention_ids } });
  if (!payload.comment) throw new Error("Mise à jour incomplète.");
  return payload.comment;
}

export async function deleteForumComment(id: number) {
  await apiRequest(`/forum/comments/${id}`, { method: "DELETE", auth: true });
}

export async function reactToForumDiscussion(id: number, type: ForumReaction) {
  const payload = await apiRequest<{ discussion?: ForumDiscussion }>(`/forum/discussions/${id}/reactions`, { method: "POST", auth: true, body: { type } });
  if (!payload.discussion) throw new Error("Réaction incomplète.");
  return payload.discussion;
}

export async function reactToForumComment(id: number, type: ForumReaction) {
  const payload = await apiRequest<{ comment?: ForumComment }>(`/forum/comments/${id}/reactions`, { method: "POST", auth: true, body: { type } });
  if (!payload.comment) throw new Error("Réaction incomplète.");
  return payload.comment;
}

export async function searchForumCoaches(q = "") {
  const payload = await apiRequest<{ coaches?: CoachForumAuthor[] }>(`/forum/coaches${q ? `?q=${encodeURIComponent(q)}` : ""}`, { auth: true });
  return normalizeArray<CoachForumAuthor>(payload, ["coaches"]);
}

export async function reportForumTarget(target: "discussions" | "comments", id: number, details?: string) {
  await apiRequest(`/forum/${target}/${id}/report`, { method: "POST", auth: true, body: { reason: "other", details: details || "Signalé depuis l’interface web." } });
}

export async function fetchForumNotifications() {
  const payload = await apiRequest<{ notifications?: Paginated<ForumNotification>; unread_count?: number }>("/forum/notifications", { auth: true });
  return { notifications: payload.notifications?.data || [], unreadCount: Number(payload.unread_count || 0) };
}

export async function fetchForumUnreadCount() {
  const payload = await apiRequest<{ unread_count?: number }>("/forum/notifications/unread-count", { auth: true });
  return Number(payload.unread_count || 0);
}

export async function markForumNotificationRead(id: number) {
  await apiRequest(`/forum/notifications/${id}/read`, { method: "PUT", auth: true });
}

export async function markAllForumNotificationsRead() {
  await apiRequest("/forum/notifications/read-all", { method: "PUT", auth: true });
}

export async function fetchForumReports(status = "pending") {
  const payload = await apiRequest<{ reports?: Paginated<ForumReport> }>(`/admin/forum/reports?status=${encodeURIComponent(status)}`, { auth: true });
  return payload.reports?.data || [];
}

export async function updateForumReport(id: number, status: "resolved" | "dismissed", moderator_note?: string) {
  await apiRequest(`/admin/forum/reports/${id}`, { method: "PUT", auth: true, body: { status, moderator_note } });
}

export async function createForumChannel(body: { name: string; description?: string; color?: string }) {
  const payload = await apiRequest<{ channel?: ForumChannel }>("/admin/forum/channels", { method: "POST", auth: true, body });
  if (!payload.channel) throw new Error("Canal créé, mais réponse incomplète.");
  return payload.channel;
}

export async function updateForumChannel(id: number, body: Partial<ForumChannel>) {
  const payload = await apiRequest<{ channel?: ForumChannel }>(`/admin/forum/channels/${id}`, { method: "PUT", auth: true, body });
  if (!payload.channel) throw new Error("Mise à jour incomplète.");
  return payload.channel;
}

export async function deleteForumChannel(id: number) {
  await apiRequest(`/admin/forum/channels/${id}`, { method: "DELETE", auth: true });
}

export async function moderateForumDiscussion(id: number, body: { is_pinned?: boolean; is_locked?: boolean }) {
  await apiRequest(`/admin/forum/discussions/${id}/moderate`, { method: "PUT", auth: true, body });
}

// Compatibilité avec les anciennes vues qui importaient ces symboles.
export type CoachForumPost = ForumDiscussion;
export const fetchCoachForumPosts = async () => (await fetchForumDiscussions()).discussions;
export const publishCoachForumPost = async (content: string) => {
  const channels = await fetchForumChannels();
  const channel = channels.find((item) => item.slug === "general") || channels[0];
  if (!channel) throw new Error("Aucun canal disponible.");
  return createForumDiscussion({ channel_id: channel.id, title: "Échange entre coachs", body: content });
};
export const deleteCoachForumPost = deleteForumDiscussion;
