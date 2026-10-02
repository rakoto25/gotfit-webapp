"use client";

import { clearAuth, getToken } from "@/lib/auth";
import { API_BASE_URL, getAssetUrl as resolveAssetUrl } from "@/lib/api-config";

export type ApiEnvelope<T> = T & {
  status?: number;
  message?: string;
  errors?: Record<string, string[]>;
};

export type GotfitUser = {
  id: number;
  name: string;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  address?: string | null;
  photo?: string | null;
  photo_url?: string | null;
  cover_photo?: string | null;
  cover_photo_url?: string | null;
  account_status?: string | null;
  stripe_account_id?: string | null;
  stripe_onboarding_completed?: boolean;
};

export type ReviewClient = Pick<
  GotfitUser,
  "id" | "name" | "email" | "photo" | "photo_url"
>;

export type Review = {
  id: number;
  reservation_id?: number | null;
  client_id?: number | null;
  intervenant_id?: number | null;
  rating: number | string;
  comment?: string | null;
  status?: string | null;
  client?: ReviewClient | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type Annonce = {
  id: number;
  titre?: string | null;
  title?: string | null;
  contenu?: string | null;
  description?: string | null;
  category?: string | null;
  type_prestation?: string | null;
  price?: string | number | null;
  duration?: string | number | null;
  max_participants?: string | number | null;
  is_online?: boolean | number | null;
  location?: string | null;
  city?: string | null;
  address?: string | null;
  image?: string | null;
  image_url?: string | null;
  status?: string | null;
  announcement_type?: "coach_service" | "client_request" | string | null;
  user_id?: number | null;
  intervenant?: GotfitUser | null;
  user?: GotfitUser | null;
  available_days?: string[] | null;
  available_hours?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export function getMaxParticipants(annonce?: Annonce | null): number {
  const value = Number(annonce?.max_participants || 2);

  return Math.max(1, Math.min(4, Number.isFinite(value) ? Math.trunc(value) : 2));
}

export type Reservation = {
  id: number;
  annonce_id?: number | null;
  client_id?: number | null;
  intervenant_id?: number | null;
  reservation_date?: string | null;
  reservation_time?: string | null;
  guests?: number | null;
  note?: string | null;
  price?: string | number | null;
  service_fee_amount?: string | number | null;
  commission_amount?: string | number | null;
  intervenant_amount?: string | number | null;
  total_client_amount?: string | number | null;
  currency?: string | null;
  status?: string | null;
  is_paid?: boolean | number;
  payment_status?: string | null;
  prestation_status?: string | null;
  payout_status?: string | null;
  payment_intent_id?: string | null;
  stripe_charge_id?: string | null;
  stripe_transfer_id?: string | null;
  paid_at?: string | null;
  validated_at?: string | null;
  validation_deadline?: string | null;
  transferred_at?: string | null;
  disputed_at?: string | null;
  dispute_reason?: string | null;
  refunded_at?: string | null;
  refund_reason?: string | null;
  annonce?: Annonce | null;
  client?: GotfitUser | null;
  intervenant?: GotfitUser | null;
  calendar_url?: string | null;
  visio_session_id?: number | null;
  visio_session?: {
    id?: number | null;
    status?: string | null;
    join_url?: string | null;
    link_created_at?: string | null;
  } | null;
  review?: Review | null;
  start?: string | null;
  end?: string | null;
};

export type PlanningEvent = Reservation & {
  title?: string | null;
  start?: string | null;
  end?: string | null;
  calendar_url?: string | null;
};

export type ReservationPayload = {
  reservation?: Reservation;
  data?: Reservation;
  already_exists?: boolean;
};

export type PaymentIntentPayload = {
  clientSecret: string;
  client_secret?: string;
  payment_intent_id: string;
  amount: string | number;
  amount_in_cents?: string | number;
  amount_major?: string | number;
  currency: string;
  payment_status?: string;
  already_paid?: boolean;
  reservation: Reservation;
};

export type PaymentStatusPayload = {
  payment_status: string;
  reservation?: Reservation;
};

export type OfferStatus = "draft" | "sent" | "paid" | "expired" | "cancelled";

export type PackSessionStatus =
  | "pending"
  | "awaiting_client_confirmation"
  | "validated"
  | "paid"
  | "disputed"
  | "cancelled";

export type PackSessionCancellation = {
  id: number;
  actor_role: "client" | "coach" | string;
  kind: "cancellation" | "no_show" | string;
  scheduled_at?: string | null;
  is_late?: boolean;
  consumes_session?: boolean;
  reason?: string | null;
  created_at?: string | null;
};

export type PackSession = {
  id: number;
  pack_id: number;
  sequence: number;
  amount_due: number;
  status: PackSessionStatus | string;
  payout_status?: string | null;
  scheduled_at?: string | null;
  completed_at?: string | null;
  validation_deadline?: string | null;
  validated_at?: string | null;
  disputed_at?: string | null;
  dispute_reason?: string | null;
  stripe_transfer_id?: string | null;
  transferred_at?: string | null;
  cancellations?: PackSessionCancellation[];
};

export type Pack = {
  id: number;
  offer_id: number;
  client_id: number;
  coach_id: number;
  amount_total: number;
  wallet_amount_used?: number;
  stripe_amount_paid?: number;
  refunded_amount?: number;
  commission_rate?: string | number;
  commission_amount?: number;
  coach_net_amount?: number;
  amount_transferred?: number;
  session_count: number;
  completed_sessions?: number;
  currency: string;
  status: string;
  paid_at?: string | null;
  coach?: MessageUser | null;
  client?: MessageUser | null;
  offer?: Offer | null;
  sessions?: PackSession[];
};

export type Offer = {
  id: number;
  conversation_id: number;
  coach_id: number;
  client_id: number;
  title: string;
  description?: string | null;
  session_count: number;
  amount_total: number;
  amount_major?: number;
  wallet_amount_applied?: number;
  stripe_amount_due?: number | null;
  currency: string;
  status: OfferStatus | string;
  expires_at?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_checkout_url?: string | null;
  paid_at?: string | null;
  cancelled_at?: string | null;
  is_expired?: boolean;
  coach?: MessageUser | null;
  client?: MessageUser | null;
  pack?: Pack | null;
};

export type Wallet = {
  id: number;
  user_id: number;
  balance: number;
  currency: string;
};

export type WalletTransaction = {
  id: number;
  wallet_id: number;
  pack_id?: number | null;
  offer_id?: number | null;
  payment_intent_id?: string | null;
  type: string;
  amount: number;
  balance_after: number;
  metadata?: Record<string, unknown> | null;
  pack?: Pack | null;
  created_at?: string | null;
};

export type WalletPayload = {
  wallet: Wallet;
  transactions?: {
    data?: WalletTransaction[];
    current_page?: number;
    last_page?: number;
    total?: number;
  };
};

type RequestOptions = {
  auth?: boolean;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

function getApiError(payload: ApiEnvelope<unknown> | null, fallback: string) {
  const firstError = payload?.errors
    ? Object.values(payload.errors)[0]?.[0]
    : null;

  return firstError || payload?.message || fallback;
}

export function normalizeArray<T>(payload: unknown, keys: string[] = []): T[] {
  if (Array.isArray(payload)) return payload as T[];

  const data = payload as Record<string, unknown> | null;
  if (!data) return [];

  if (Array.isArray(data.data)) return data.data as T[];

  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key] as T[];
  }

  return [];
}

export function getAssetUrl(url?: string | null) {
  return resolveAssetUrl(url);
}

export function formatMoney(value?: string | number | null, currency = "EUR") {
  if (value === null || value === undefined || value === "") return "0 €";

  const amount = Number(value);
  if (Number.isNaN(amount)) return `${value} €`;

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

export function formatMinorMoney(
  value?: string | number | null,
  currency = "EUR"
) {
  if (value === null || value === undefined || value === "") return "0 €";

  const amountInMinorUnits = Number(value);
  if (Number.isNaN(amountInMinorUnits)) return `${value} €`;

  return formatMoney(amountInMinorUnits / 100, currency);
}

export function formatDate(value?: string | null) {
  if (!value) return "Non défini";

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function getAnnonceTitle(annonce?: Annonce | null) {
  return annonce?.titre || annonce?.title || "Annonce Gotfit";
}

export function getAnnonceDescription(annonce?: Annonce | null) {
  return annonce?.contenu || annonce?.description || "";
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiEnvelope<T>> {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (options.body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth) {
    const token = getToken();

    if (!token) {
      throw new Error("Veuillez vous connecter pour continuer.");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body:
      options.body === undefined
        ? undefined
        : isFormData
          ? (options.body as BodyInit)
          : JSON.stringify(options.body),
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | null;

  if (response.status === 401) {
    clearAuth();
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }

  if (!response.ok) {
    throw new Error(getApiError(payload, "Une erreur est survenue."));
  }

  return (payload || {}) as ApiEnvelope<T>;
}

export async function fetchAnnonces() {
  const payload = await apiRequest<{
    annonces?: Annonce[];
    data?: Annonce[];
  }>("/annonces");

  return normalizeArray<Annonce>(payload, ["annonces"]);
}

export async function fetchMyAnnonces() {
  const payload = await apiRequest<{
    annonces?: Annonce[];
    data?: Annonce[];
  }>("/annonces/my", { auth: true });

  return normalizeArray<Annonce>(payload, ["annonces"]);
}

export async function fetchAnnonce(id: string | number) {
  try {
    const payload = await apiRequest<{
      annonce?: Annonce;
      data?: Annonce;
    }>(`/annonces/${id}/detail`);

    const annonce = payload.annonce || payload.data;

    if (!annonce?.id) {
      throw new Error("Annonce introuvable.");
    }

    return annonce;
  } catch (error) {
    const annonces = await fetchAnnonces();
    const annonce = annonces.find((item) => String(item.id) === String(id));

    if (!annonce) {
      throw error;
    }

    return annonce;
  }
}

export async function createAnnonce(body: FormData) {
  const payload = await apiRequest<{
    annonce?: Annonce;
    data?: Annonce;
  }>("/annonces", {
    method: "POST",
    auth: true,
    body,
  });

  const annonce = payload.annonce || payload.data;

  if (!annonce?.id) {
    throw new Error(
      "L’annonce a été envoyée, mais la réponse de l’API est incomplète."
    );
  }

  return {
    annonce,
    message:
      payload.message ||
      "Annonce créée. Elle sera publiée après validation de l’administration.",
  };
}

export async function updateAnnonce(id: string | number, body: FormData) {
  const payload = await apiRequest<{
    annonce?: Annonce;
    data?: Annonce;
  }>(`/annonces/${id}`, {
    // POST multipart évite les limites PHP sur l’analyse de FormData avec PUT.
    method: "POST",
    auth: true,
    body,
  });

  const annonce = payload.annonce || payload.data;

  if (!annonce?.id) {
    throw new Error("L’annonce a été modifiée, mais la réponse de l’API est incomplète.");
  }

  return {
    annonce,
    message:
      payload.message ||
      "Annonce modifiée. Elle attend une nouvelle validation de l’administration.",
  };
}

export async function deleteAnnonce(id: string | number) {
  return apiRequest<Record<string, never>>(`/annonces/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function reserveAnnonce(
  annonceId: string | number,
  body: {
    reservation_date: string;
    reservation_time: string;
    note?: string;
  }
) {
  const payload = await apiRequest<ReservationPayload>(
    `/annonces/${annonceId}/reserve`,
    {
      method: "PUT",
      auth: true,
      body,
    }
  );

  const reservation = payload.reservation || payload.data;

  if (!reservation?.id) {
    throw new Error("La réservation a été créée, mais son ID est introuvable.");
  }

  return reservation;
}

export async function createPaymentIntent(reservationId: number) {
  const payload = await apiRequest<PaymentIntentPayload>(
    "/create-payment-intent",
    {
      method: "POST",
      auth: true,
      body: {
        reservation_id: reservationId,
      },
    }
  );

  const clientSecret = payload.clientSecret || payload.client_secret;

  if (!clientSecret) {
    throw new Error("Le paiement a été initialisé, mais la clé Stripe est introuvable.");
  }

  return { ...payload, clientSecret };
}

export async function syncPaymentStatus(paymentIntentId: string) {
  return apiRequest<PaymentStatusPayload>(
    `/payment/status/${encodeURIComponent(paymentIntentId)}`,
    { auth: true }
  );
}

export async function reserveAndCreatePaymentIntent(
  annonceId: string | number,
  body: {
    reservation_date: string;
    reservation_time: string;
    note?: string;
  }
) {
  const reservation = await reserveAnnonce(annonceId, body);
  const paymentIntent = await createPaymentIntent(reservation.id);

  return {
    reservation,
    paymentIntent,
  };
}

export async function fetchClientReservations() {
  const payload = await apiRequest<{
    reservations?: Reservation[];
    data?: Reservation[];
  }>("/reservation/client", {
    auth: true,
  });

  return normalizeArray<Reservation>(payload, ["reservations"]);
}

export async function fetchIntervenantReservations() {
  const payload = await apiRequest<{
    reservations?: Reservation[];
    data?: Reservation[];
  }>("/reservation/intervenant", {
    auth: true,
  });

  return normalizeArray<Reservation>(payload, ["reservations"]);
}

export async function fetchPlanning(params?: { from?: string; to?: string }) {
  const search = new URLSearchParams();

  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);

  const endpoint = `/planning${search.toString() ? `?${search.toString()}` : ""}`;
  const payload = await apiRequest<{
    reservations?: PlanningEvent[];
    data?: PlanningEvent[];
  }>(endpoint, {
    auth: true,
  });

  return normalizeArray<PlanningEvent>(payload, ["reservations"]);
}

export async function finishReservation(reservationId: number) {
  return apiRequest<{ reservation?: Reservation }>(
    `/reservation/${reservationId}/terminer`,
    {
      method: "PUT",
      auth: true,
    }
  );
}

export function getReservationCalendarUrl(reservationId: number) {
  return `${API_BASE_URL}/reservation/${reservationId}/calendar.ics`;
}

export function isReservationPaid(reservation: Reservation) {
  return (
    reservation.payment_status === "paid" ||
    reservation.is_paid === true ||
    reservation.is_paid === 1
  );
}

export function isReservationOnline(_reservation: Reservation) {
  // GotFit fonctionne désormais exclusivement en visioconférence.
  return true;
}

export function canAccessReservationVisio(reservation: Reservation) {
  const status = reservation.prestation_status || reservation.status || "";
  return (
    isReservationPaid(reservation) &&
    isReservationOnline(reservation) &&
    Boolean(reservation.visio_session_id || reservation.visio_session?.id) &&
    Boolean(reservation.visio_session?.join_url || reservation.visio_session?.link_created_at) &&
    !["cancelled", "annulee", "refunded", "remboursee"].includes(status)
  );
}

export async function createReservationVisioLink(reservationId: number) {
  const payload = await apiRequest<{
    join_url?: string;
    session?: Reservation["visio_session"];
  }>(`/reservation/${reservationId}/visio-link`, {
    method: "POST",
    auth: true,
  });

  if (!payload.join_url) {
    throw new Error("Le lien a été créé, mais l’adresse est introuvable.");
  }

  return payload.join_url;
}

export function canAddReservationToCalendar(reservation: Reservation) {
  const paymentPaid = isReservationPaid(reservation);
  const status = reservation.prestation_status || reservation.status || "";

  return (
    paymentPaid &&
    !["cancelled", "annulee", "refunded", "remboursee", "payment_failed"].includes(status)
  );
}

export function getReservationVisioHref(reservation: Reservation) {
  const sessionId = reservation.visio_session_id || reservation.visio_session?.id;
  return sessionId ? `/visio/${sessionId}` : "/visio";
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function getReservationDateTime(reservation: Reservation) {
  const date = reservation.reservation_date || reservation.start?.slice(0, 10);
  const time = reservation.reservation_time || reservation.start?.slice(11, 19) || "09:00:00";
  if (!date) return null;

  const start = new Date(`${date}T${time}`);
  if (Number.isNaN(start.getTime())) return null;

  const duration = Number(reservation.annonce?.duration || 60);
  const end = reservation.end ? new Date(reservation.end) : new Date(start.getTime() + duration * 60_000);
  return { start, end };
}

function toIcsUtc(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function createReservationIcs(reservation: Reservation) {
  const range = getReservationDateTime(reservation);
  if (!range) {
    throw new Error("La date ou l’heure de cette réservation est incomplète.");
  }

  const title = getAnnonceTitle(reservation.annonce);
  const location = "Visio GotFit";
  const description =
    "Retrouvez l’accès à la séance depuis votre espace GotFit, rubrique Visio.";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gotfit//Reservation//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:gotfit-reservation-${reservation.id}@gotfit.tech`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(range.start)}`,
    `DTEND:${toIcsUtc(range.end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function saveCalendarBlob(blob: Blob, reservationId: number) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `gotfit-reservation-${reservationId}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export async function downloadReservationCalendar(reservation: Reservation) {
  if (!canAddReservationToCalendar(reservation)) {
    throw new Error("Le calendrier sera disponible après confirmation du paiement.");
  }

  const token = getToken();

  try {
    const response = await fetch(
      reservation.calendar_url || getReservationCalendarUrl(reservation.id),
      {
        headers: {
          Accept: "text/calendar",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Calendrier API indisponible (${response.status}).`);
    }

    const content = await response.blob();
    saveCalendarBlob(
      content.type ? content : new Blob([content], { type: "text/calendar;charset=utf-8" }),
      reservation.id
    );
    return;
  } catch {
    const fallback = createReservationIcs(reservation);
    saveCalendarBlob(
      new Blob([fallback], { type: "text/calendar;charset=utf-8" }),
      reservation.id
    );
  }
}

export async function confirmPrestation(reservationId: number) {
  return apiRequest<{ reservation?: Reservation }>(
    `/reservation/${reservationId}/confirm-prestation`,
    {
      method: "POST",
      auth: true,
    }
  );
}

export async function disputePrestation(reservationId: number, reason: string) {
  return apiRequest<{ reservation?: Reservation }>(
    `/reservation/${reservationId}/dispute`,
    {
      method: "POST",
      auth: true,
      body: {
        reason,
      },
    }
  );
}

export async function fetchIntervenantReviews(intervenantId: string | number) {
  const payload = await apiRequest<{
    reviews?: Review[];
    data?: Review[];
  }>(`/intervenants/${intervenantId}/reviews`);

  return normalizeArray<Review>(payload, ["reviews"]);
}

export async function submitReservationReview(
  reservationId: string | number,
  body: {
    rating: number;
    comment?: string;
  }
) {
  const payload = await apiRequest<{ review?: Review }>(
    `/reservations/${reservationId}/review`,
    {
      method: "POST",
      auth: true,
      body,
    }
  );

  if (!payload.review?.id) {
    throw new Error("L'avis a ete envoye, mais la reponse API est incomplete.");
  }

  return payload.review;
}

export function canReviewReservation(reservation: Reservation) {
  return (
    isReservationPaid(reservation) &&
    (reservation.status || "").toLowerCase() === "realise" &&
    !reservation.review?.id
  );
}

export type MessageUser = Pick<
  GotfitUser,
  "id" | "name" | "email" | "photo_url" | "photo"
> & {
  role?: string | null;
};

export type MessageReaction = {
  id?: number;
  message_id?: number;
  user_id?: number;
  reaction: "like" | "dislike" | "love" | "haha" | "wow" | "sad" | "angry";
  user?: MessageUser | null;
};

export type MessageItem = {
  id: number;
  conversation_id: number;
  sender_id: number;
  parent_id?: number | null;
  message?: string | null;
  type?: "text" | "image" | "video" | "mixed" | string | null;
  media_url?: string | null;
  media_full_url?: string | null;
  media_type?: "image" | "video" | string | null;
  sender?: MessageUser | null;
  parent?: MessageItem | null;
  reactions?: MessageReaction[];
  offer?: Offer | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type Conversation = {
  id: number;
  client_id?: number | null;
  intervenant_id?: number | null;
  client?: MessageUser | null;
  intervenant?: MessageUser | null;
  messages?: MessageItem[];
  created_at?: string | null;
  updated_at?: string | null;
};

export type MessageContact = MessageUser & {
  role?: string | null;
};

export async function fetchMessageContacts() {
  const payload = await apiRequest<{
    contacts?: MessageContact[];
    data?: MessageContact[];
  }>("/message/contacts", {
    auth: true,
  });

  return normalizeArray<MessageContact>(payload, ["contacts"]);
}

export async function fetchConversations() {
  const payload = await apiRequest<{
    conversations?: Conversation[];
    data?: Conversation[];
  }>("/conversation", {
    auth: true,
  });

  return normalizeArray<Conversation>(payload, ["conversations"]);
}

export async function createConversation(otherUserId: string | number) {
  const payload = await apiRequest<{ conversation?: Conversation }>(
    `/conversation/${otherUserId}`,
    {
      method: "POST",
      auth: true,
    }
  );

  if (!payload.conversation?.id) {
    throw new Error("Impossible de créer ou récupérer la conversation.");
  }

  return payload.conversation;
}

export async function fetchMessages(conversationId: string | number) {
  const payload = await apiRequest<{
    messages?: MessageItem[];
    data?: MessageItem[];
  }>(`/message/${conversationId}`, {
    auth: true,
  });

  return normalizeArray<MessageItem>(payload, ["messages"]);
}

export async function createChatOffer(
  conversationId: string | number,
  body: {
    title: string;
    session_count: number;
    amount: number;
    description?: string;
    validity_days?: number;
  }
) {
  const payload = await apiRequest<{ offer?: Offer; message?: MessageItem }>(
    `/conversations/${conversationId}/offers`,
    {
      method: "POST",
      auth: true,
      body,
    }
  );

  if (!payload.offer?.id || !payload.message?.id) {
    throw new Error("L’offre a été créée, mais la réponse de l’API est incomplète.");
  }

  return { offer: payload.offer, message: payload.message };
}

export async function fetchOffer(offerId: string | number) {
  const payload = await apiRequest<{ offer?: Offer }>(`/offers/${offerId}`, {
    auth: true,
  });

  if (!payload.offer?.id) {
    throw new Error("Cette offre est introuvable.");
  }

  return payload.offer;
}

export async function createOfferCheckout(
  offerId: string | number,
  walletAmount = 0
) {
  const payload = await apiRequest<{
    checkout_url?: string;
    checkout_session_id?: string;
    already_paid?: boolean;
    offer?: Offer;
  }>(`/offers/${offerId}/checkout`, {
    method: "POST",
    auth: true,
    body: { wallet_amount: walletAmount },
  });

  if (!payload.already_paid && !payload.checkout_url) {
    throw new Error("Le lien de paiement Stripe est introuvable.");
  }

  return payload;
}

export async function cancelOffer(offerId: string | number) {
  const payload = await apiRequest<{ offer?: Offer }>(`/offers/${offerId}/cancel`, {
    method: "POST",
    auth: true,
  });

  if (!payload.offer?.id) {
    throw new Error("L’offre a été annulée, mais la réponse est incomplète.");
  }

  return payload.offer;
}

export async function fetchPacks() {
  const payload = await apiRequest<{ packs?: Pack[]; data?: Pack[] }>("/packs", {
    auth: true,
  });

  return normalizeArray<Pack>(payload, ["packs"]);
}

export async function fetchPack(packId: string | number) {
  const payload = await apiRequest<{ pack?: Pack }>(`/packs/${packId}`, {
    auth: true,
  });

  if (!payload.pack?.id) {
    throw new Error("Ce pack est introuvable.");
  }

  return payload.pack;
}

async function updatePackSession(
  sessionId: string | number,
  action: "schedule" | "complete" | "validate" | "dispute" | "cancel" | "no-show",
  body?: Record<string, unknown>
) {
  const payload = await apiRequest<{ session?: PackSession }>(
    `/pack-sessions/${sessionId}/${action}`,
    {
      method: "POST",
      auth: true,
      body,
    }
  );

  if (!payload.session?.id) {
    throw new Error("La séance a été modifiée, mais la réponse est incomplète.");
  }

  return { session: payload.session, message: payload.message };
}

export function schedulePackSession(sessionId: string | number, scheduledAt: string) {
  return updatePackSession(sessionId, "schedule", { scheduled_at: scheduledAt });
}

export function completePackSession(sessionId: string | number) {
  return updatePackSession(sessionId, "complete");
}

export function validatePackSession(sessionId: string | number) {
  return updatePackSession(sessionId, "validate");
}

export function disputePackSession(sessionId: string | number, reason: string) {
  return updatePackSession(sessionId, "dispute", { reason });
}

export function cancelPackSession(sessionId: string | number, reason?: string) {
  return updatePackSession(sessionId, "cancel", { reason });
}

export function declarePackSessionNoShow(sessionId: string | number, reason?: string) {
  return updatePackSession(sessionId, "no-show", { reason });
}

export async function fetchWallet() {
  const payload = await apiRequest<WalletPayload>("/wallet", { auth: true });

  if (!payload.wallet?.id) {
    throw new Error("La cagnotte est indisponible.");
  }

  return {
    wallet: payload.wallet,
    transactions: payload.transactions?.data || [],
    pagination: payload.transactions,
  };
}

export async function sendConversationMessage(
  conversationId: string | number,
  body: {
    message?: string;
    parent_id?: number | null;
    media?: File | null;
  }
) {
  const formData = new FormData();

  if (body.message?.trim()) {
    formData.append("message", body.message.trim());
  }

  if (body.parent_id) {
    formData.append("parent_id", String(body.parent_id));
  }

  if (body.media) {
    formData.append("media", body.media);
  }

  const payload = await apiRequest<{ message?: MessageItem }>(
    `/message/${conversationId}`,
    {
      method: "POST",
      auth: true,
      body: formData,
    }
  );

  if (!payload.message?.id) {
    throw new Error("Le message a été envoyé, mais la réponse API est incomplète.");
  }

  return payload.message;
}

export async function reactToMessage(
  messageId: string | number,
  reaction: MessageReaction["reaction"]
) {
  return apiRequest<{ message?: MessageItem; reaction?: MessageReaction }>(
    `/message/${messageId}/reaction`,
    {
      method: "POST",
      auth: true,
      body: {
        reaction,
      },
    }
  );
}

export async function removeMessageReaction(messageId: string | number) {
  return apiRequest<{ message?: MessageItem }>(`/message/${messageId}/reaction`, {
    method: "DELETE",
    auth: true,
  });
}
