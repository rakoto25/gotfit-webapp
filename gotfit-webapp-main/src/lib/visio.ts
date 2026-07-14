"use client";

import { apiRequest, normalizeArray, type GotfitUser } from "@/lib/marketplace";

export type VisioParticipant = {
  id: number;
  visio_session_id: number;
  user_id: number;
  role: "coach" | "participant";
  status:
    | "invited"
    | "reserved"
    | "paid"
    | "joined"
    | "left"
    | "cancelled"
    | "no_show";
  payment_status: "unpaid" | "pending" | "paid" | "refunded";
  amount?: string | number | null;
  currency?: string | null;
  payment_intent_id?: string | null;
  paid_at?: string | null;
  joined_at?: string | null;
  left_at?: string | null;
  cancelled_at?: string | null;
  user?: GotfitUser | null;
};

export type VisioSession = {
  id: number;
  coach_id: number;
  title: string;
  description?: string | null;
  start_at: string;
  duration_minutes: number;
  min_participants: number;
  max_participants?: number | null;
  price?: string | number | null;
  currency?: string | null;
  status: "draft" | "open" | "confirmed" | "live" | "ended" | "cancelled";
  provider?: string | null;
  provider_room_id?: string | null;
  room_name?: string | null;
  join_url?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  cancellation_reason?: string | null;
  paid_participants_count?: number;
  reserved_participants_count?: number;
  available_places?: number | null;
  is_confirmed_by_minimum?: boolean;
  coach?: GotfitUser | null;
  participants?: VisioParticipant[];
};

export type CreateVisioSessionPayload = {
  title: string;
  description?: string;
  start_at: string;
  duration_minutes: number;
  min_participants: number;
  max_participants?: number | null;
  price: number;
  currency: string;
};

export type VisioJoinPayload = {
  provider?: string | null;
  server_url?: string | null;
  room_name?: string | null;
  join_url?: string | null;
  token?: string | null;
  session?: VisioSession;
};

export function getVisioStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    draft: "Brouillon",
    open: "Ouverte",
    confirmed: "Confirmée",
    live: "En direct",
    ended: "Terminée",
    cancelled: "Annulée",
  };

  return status ? labels[status] || status : "Non défini";
}

export function getParticipantStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    invited: "Invité",
    reserved: "Réservé",
    paid: "Payé",
    joined: "Connecté",
    left: "Sorti",
    cancelled: "Annulé",
    no_show: "Absent",
  };

  return status ? labels[status] || status : "Non défini";
}

export function getPaymentStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    unpaid: "Non payé",
    pending: "En attente",
    paid: "Payé",
    refunded: "Remboursé",
  };

  return status ? labels[status] || status : "Non défini";
}

export async function fetchVisioSessions(mine = false) {
  const endpoint = mine ? "/visio/sessions?mine=1&upcoming=0" : "/visio/sessions";
  const payload = await apiRequest<{ sessions?: { data?: VisioSession[] } | VisioSession[] }>(
    endpoint,
    { auth: mine }
  );

  const sessions = payload.sessions;

  if (Array.isArray(sessions)) {
    return sessions;
  }

  return normalizeArray<VisioSession>(sessions, ["data"]);
}

export async function fetchVisioSession(id: string | number) {
  const payload = await apiRequest<{ session?: VisioSession }>(
    `/visio/sessions/${id}`,
    { auth: true }
  );

  if (!payload.session?.id) {
    throw new Error("Séance visio introuvable.");
  }

  return payload.session;
}

export async function createVisioSession(body: CreateVisioSessionPayload) {
  const payload = await apiRequest<{ session?: VisioSession }>(
    "/visio/sessions",
    {
      method: "POST",
      auth: true,
      body,
    }
  );

  if (!payload.session?.id) {
    throw new Error("La séance a été créée, mais la réponse API est incomplète.");
  }

  return payload.session;
}

export async function reserveVisioSession(id: string | number) {
  const payload = await apiRequest<{
    session?: VisioSession;
    participant?: VisioParticipant;
  }>(`/visio/sessions/${id}/reserve`, {
    method: "POST",
    auth: true,
  });

  return payload;
}

export async function startVisioSession(id: string | number) {
  const payload = await apiRequest<{ session?: VisioSession }>(
    `/visio/sessions/${id}/start`,
    {
      method: "POST",
      auth: true,
    }
  );

  return payload.session || null;
}

export async function joinVisioSession(id: string | number) {
  return apiRequest<VisioJoinPayload>(`/visio/sessions/${id}/join`, {
    method: "POST",
    auth: true,
  });
}

export async function endVisioSession(id: string | number) {
  const payload = await apiRequest<{ session?: VisioSession }>(
    `/visio/sessions/${id}/end`,
    {
      method: "POST",
      auth: true,
    }
  );

  return payload.session || null;
}

export async function markVisioParticipantPaid(
  sessionId: string | number,
  participantId: string | number
) {
  const payload = await apiRequest<{
    session?: VisioSession;
    participant?: VisioParticipant;
  }>(`/visio/sessions/${sessionId}/participants/${participantId}/paid`, {
    method: "POST",
    auth: true,
  });

  return payload;
}
