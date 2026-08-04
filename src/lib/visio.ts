import {
  apiRequest,
  type GotfitUser,
} from "@/lib/marketplace";

import type {
  ApiId,
} from "@/types/auth";

/* =========================================================
   CONFIGURATION VISIO V1
========================================================= */

export const VISIO_MAX_COACHEES = 2;
export const VISIO_MAX_TOTAL_PARTICIPANTS = 3;

/* =========================================================
   TYPES
========================================================= */

export type VisioParticipantRole =
  | "coach"
  | "intervenant"
  | "client"
  | "participant"
  | "organizer"
  | string;

export type VisioParticipantStatus =
  | "invited"
  | "reserved"
  | "confirmed"
  | "joined"
  | "left"
  | "cancelled"
  | "no_show"
  | string;

export type VisioPaymentStatus =
  | "not_required"
  | "unpaid"
  | "pending"
  | "paid"
  | "completed"
  | "refunded"
  | string;

export type VisioSessionStatus =
  | "draft"
  | "open"
  | "confirmed"
  | "scheduled"
  | "live"
  | "started"
  | "in_progress"
  | "ended"
  | "completed"
  | "cancelled"
  | "canceled"
  | string;

export type VisioParticipant = {
  id: ApiId;

  visio_session_id: ApiId;
  user_id: ApiId;

  reservation_id?: ApiId | null;

  role: VisioParticipantRole;

  status: VisioParticipantStatus;

  payment_status:
    VisioPaymentStatus;

  amount?:
    | string
    | number
    | null;

  currency?: string | null;

  payment_intent_id?:
    | string
    | null;

  paid_at?: string | null;
  joined_at?: string | null;
  left_at?: string | null;

  cancelled_at?:
    | string
    | null;

  user?: GotfitUser | null;

  created_at?: string | null;
  updated_at?: string | null;
};

export type VisioSession = {
  id: ApiId;

  coach_id?: ApiId | null;

  intervenant_id?:
    | ApiId
    | null;

  reservation_id?:
    | ApiId
    | null;

  annonce_id?: ApiId | null;

  title: string;

  description?: string | null;

  start_at: string;

  scheduled_at?: string | null;

  duration_minutes: number;

  /**
   * Ces champs correspondent au nombre
   * de coachés et n’incluent pas le coach.
   */
  min_participants: number;

  minimum_participants?:
    | number
    | null;

  max_participants?:
    | number
    | null;

  price?:
    | string
    | number
    | null;

  currency?: string | null;

  session_type?:
    | "individual"
    | "group"
    | string
    | null;

  status: VisioSessionStatus;

  provider?: string | null;

  provider_room_id?:
    | string
    | null;

  room_name?: string | null;

  join_url?: string | null;

  started_at?: string | null;
  ended_at?: string | null;

  cancellation_reason?:
    | string
    | null;

  paid_participants_count?:
    | number;

  reserved_participants_count?:
    | number;

  available_places?:
    | number
    | null;

  is_confirmed_by_minimum?:
    | boolean;

  coach?: GotfitUser | null;

  intervenant?:
    | GotfitUser
    | null;

  participants?:
    | VisioParticipant[];

  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateVisioSessionPayload = {
  title: string;

  description?: string;

  start_at: string;

  duration_minutes: number;

  /**
   * Nombre de coachés.
   */
  min_participants: number;

  /**
   * Toujours limité à deux pour la V1.
   */
  max_participants?:
    | number
    | null;

  price: number;

  currency: string;
};

export type VisioJoinPayload = {
  provider?: string | null;

  server_url?: string | null;

  room_name?: string | null;

  join_url?: string | null;

  token?: string | null;

  participant_token?:
    | string
    | null;

  session?: VisioSession;

  participant?:
    | VisioParticipant;

  [key: string]: unknown;
};

/* =========================================================
   TYPES INTERNES
========================================================= */

type UnknownRecord =
  Record<string, unknown>;

/* =========================================================
   OUTILS DE NORMALISATION
========================================================= */

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function asRecord(
  value: unknown,
): UnknownRecord {
  return isRecord(value)
    ? value
    : {};
}

function firstDefined(
  ...values: unknown[]
): unknown {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null
    ) {
      return value;
    }
  }

  return undefined;
}

function firstText(
  ...values: unknown[]
): string | null {
  for (const value of values) {
    if (
      typeof value !== "string" &&
      typeof value !== "number"
    ) {
      continue;
    }

    const normalized =
      String(value).trim();

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function normalizeKey(
  value: unknown,
  fallback = "",
): string {
  const normalized =
    String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .replace(/[\s-]+/g, "_");

  return normalized || fallback;
}

function normalizeId(
  value: unknown,
  fallback: ApiId = "",
): ApiId {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  const normalized =
    String(value ?? "").trim();

  if (!normalized) {
    return fallback;
  }

  if (/^\d+$/.test(normalized)) {
    const numericValue =
      Number(normalized);

    if (
      Number.isSafeInteger(
        numericValue,
      )
    ) {
      return numericValue;
    }
  }

  return normalized;
}

function normalizeNullableId(
  value: unknown,
): ApiId | null {
  const id = normalizeId(value);

  return String(id).trim()
    ? id
    : null;
}

function normalizeNumber(
  value: unknown,
  fallback: number,
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function normalizeOptionalNumber(
  value: unknown,
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function normalizeInteger(
  value: unknown,
  fallback: number,
  minimum?: number,
  maximum?: number,
): number {
  let parsed = Math.floor(
    normalizeNumber(
      value,
      fallback,
    ),
  );

  if (
    minimum !== undefined
  ) {
    parsed = Math.max(
      minimum,
      parsed,
    );
  }

  if (
    maximum !== undefined
  ) {
    parsed = Math.min(
      maximum,
      parsed,
    );
  }

  return parsed;
}

function normalizeBoolean(
  value: unknown,
): boolean | null {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    value === 1 ||
    value === "1" ||
    value === "true"
  ) {
    return true;
  }

  if (
    value === 0 ||
    value === "0" ||
    value === "false"
  ) {
    return false;
  }

  return null;
}

function normalizeUser(
  value: unknown,
): GotfitUser | null {
  return isRecord(value)
    ? (value as GotfitUser)
    : null;
}

function normalizeCurrency(
  value: unknown,
): string {
  const currency =
    String(value ?? "EUR")
      .replace(/[^a-zA-Z]/g, "")
      .trim()
      .toUpperCase()
      .slice(0, 3);

  return currency || "EUR";
}

function extractArray(
  value: unknown,
  depth = 0,
): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    depth > 4 ||
    !isRecord(value)
  ) {
    return [];
  }

  const keys = [
    "sessions",
    "visio_sessions",
    "participants",
    "items",
    "results",
    "data",
  ];

  for (const key of keys) {
    const candidate =
      value[key];

    if (
      Array.isArray(candidate)
    ) {
      return candidate;
    }

    if (isRecord(candidate)) {
      const nested =
        extractArray(
          candidate,
          depth + 1,
        );

      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
}

function isCoachRole(
  role: unknown,
): boolean {
  return [
    "coach",
    "intervenant",
    "organizer",
    "organisateur",
  ].includes(
    normalizeKey(role),
  );
}

function isPaidStatus(
  status: unknown,
): boolean {
  return [
    "paid",
    "completed",
    "succeeded",
    "approved",
    "confirmed",
  ].includes(
    normalizeKey(status),
  );
}

function isCancelledStatus(
  status: unknown,
): boolean {
  return [
    "cancelled",
    "canceled",
    "refunded",
    "rejected",
  ].includes(
    normalizeKey(status),
  );
}

/* =========================================================
   NORMALISATION D’UN PARTICIPANT
========================================================= */

function normalizeParticipant(
  raw: unknown,
): VisioParticipant {
  const data =
    asRecord(raw);

  const user =
    normalizeUser(data.user);

  const isPaid =
    normalizeBoolean(
      data.is_paid,
    );

  const paymentStatus =
    normalizeKey(
      firstDefined(
        data.payment_status,
        data.payment_state,
        isPaid === true
          ? "paid"
          : undefined,
      ),
      "unpaid",
    );

  return {
    ...(data as VisioParticipant),

    id: normalizeId(
      firstDefined(
        data.id,
        data.participant_id,
      ),
    ),

    visio_session_id:
      normalizeId(
        firstDefined(
          data.visio_session_id,
          data.session_id,
          asRecord(
            data.session,
          ).id,
        ),
      ),

    user_id: normalizeId(
      firstDefined(
        data.user_id,
        user?.id,
      ),
    ),

    reservation_id:
      normalizeNullableId(
        data.reservation_id,
      ),

    role: normalizeKey(
      data.role,
      "participant",
    ),

    status: normalizeKey(
      data.status,
      "reserved",
    ),

    payment_status:
      paymentStatus,

    amount:
      firstDefined(
        data.amount,
        data.price,
      ) as
        | string
        | number
        | null
        | undefined,

    currency:
      firstText(
        data.currency,
      )?.toUpperCase() ??
      null,

    payment_intent_id:
      firstText(
        data.payment_intent_id,
        data.stripe_payment_intent_id,
      ),

    paid_at:
      firstText(data.paid_at),

    joined_at:
      firstText(data.joined_at),

    left_at:
      firstText(data.left_at),

    cancelled_at:
      firstText(
        data.cancelled_at,
        data.canceled_at,
      ),

    user,

    created_at:
      firstText(data.created_at),

    updated_at:
      firstText(data.updated_at),
  };
}

/* =========================================================
   NORMALISATION D’UNE SÉANCE
========================================================= */

export function normalizeVisioSession(
  raw: unknown,
): VisioSession {
  const data =
    asRecord(raw);

  const coach =
    normalizeUser(
      firstDefined(
        data.coach,
        data.intervenant,
        data.organizer,
      ),
    );

  const intervenant =
    normalizeUser(
      firstDefined(
        data.intervenant,
        data.coach,
        data.organizer,
      ),
    );

  const participants =
    extractArray(
      firstDefined(
        data.participants,
        data.visio_participants,
        data.attendees,
      ),
    ).map(
      normalizeParticipant,
    );

  const maximumParticipants =
    normalizeInteger(
      firstDefined(
        data.max_participants,
        data.maximum_participants,
      ),
      VISIO_MAX_COACHEES,
      1,
      VISIO_MAX_COACHEES,
    );

  const minimumParticipants =
    normalizeInteger(
      firstDefined(
        data.min_participants,
        data.minimum_participants,
      ),
      1,
      1,
      maximumParticipants,
    );

  const calculatedPaidCount =
    participants.filter(
      (participant) =>
        !isCoachRole(
          participant.role,
        ) &&
        isPaidStatus(
          participant.payment_status,
        ),
    ).length;

  const calculatedReservedCount =
    participants.filter(
      (participant) =>
        !isCoachRole(
          participant.role,
        ) &&
        !isCancelledStatus(
          participant.status,
        ),
    ).length;

  const paidParticipantsCount =
    normalizeInteger(
      firstDefined(
        data.paid_participants_count,
        data.paid_coachees_count,
        calculatedPaidCount,
      ),
      calculatedPaidCount,
      0,
      VISIO_MAX_COACHEES,
    );

  const reservedParticipantsCount =
    normalizeInteger(
      firstDefined(
        data.reserved_participants_count,
        data.participants_count,
        calculatedReservedCount,
      ),
      calculatedReservedCount,
      0,
      VISIO_MAX_COACHEES,
    );

  const availablePlacesFromApi =
    normalizeOptionalNumber(
      firstDefined(
        data.available_places,
        data.remaining_places,
      ),
    );

  const availablePlaces =
    availablePlacesFromApi ??
    Math.max(
      0,
      maximumParticipants -
        reservedParticipantsCount,
    );

  const confirmationFromApi =
    normalizeBoolean(
      data.is_confirmed_by_minimum,
    );

  const startAt =
    firstText(
      data.start_at,
      data.scheduled_at,
      data.starts_at,
      data.date,
    ) ?? "";

  const price =
    firstDefined(
      data.price,
      data.amount,
    );

  return {
    ...(data as VisioSession),

    id: normalizeId(data.id),

    coach_id:
      normalizeNullableId(
        firstDefined(
          data.coach_id,
          data.intervenant_id,
          coach?.id,
        ),
      ),

    intervenant_id:
      normalizeNullableId(
        firstDefined(
          data.intervenant_id,
          data.coach_id,
          intervenant?.id,
        ),
      ),

    reservation_id:
      normalizeNullableId(
        data.reservation_id,
      ),

    annonce_id:
      normalizeNullableId(
        firstDefined(
          data.annonce_id,
          data.listing_id,
        ),
      ),

    title:
      firstText(
        data.title,
        data.name,
      ) ??
      "Séance visio Gotfit",

    description:
      firstText(
        data.description,
      ),

    start_at:
      startAt,

    scheduled_at:
      firstText(
        data.scheduled_at,
        startAt,
      ),

    duration_minutes:
      normalizeInteger(
        firstDefined(
          data.duration_minutes,
          data.duration,
        ),
        60,
        1,
      ),

    min_participants:
      minimumParticipants,

    minimum_participants:
      minimumParticipants,

    max_participants:
      maximumParticipants,

    price:
      typeof price === "string" ||
      typeof price === "number"
        ? price
        : null,

    currency:
      normalizeCurrency(
        data.currency,
      ),

    session_type:
      firstText(
        data.session_type,
        data.type,
      ),

    status:
      normalizeKey(
        data.status,
        "draft",
      ),

    provider:
      firstText(data.provider),

    provider_room_id:
      firstText(
        data.provider_room_id,
        data.livekit_room_id,
      ),

    room_name:
      firstText(
        data.room_name,
        data.provider_room_id,
      ),

    join_url:
      firstText(
        data.join_url,
        data.meeting_url,
      ),

    started_at:
      firstText(data.started_at),

    ended_at:
      firstText(data.ended_at),

    cancellation_reason:
      firstText(
        data.cancellation_reason,
        data.cancel_reason,
      ),

    paid_participants_count:
      paidParticipantsCount,

    reserved_participants_count:
      reservedParticipantsCount,

    available_places:
      Math.max(
        0,
        Math.min(
          VISIO_MAX_COACHEES,
          availablePlaces,
        ),
      ),

    is_confirmed_by_minimum:
      confirmationFromApi ??
      paidParticipantsCount >=
        minimumParticipants,

    coach,

    intervenant,

    participants,

    created_at:
      firstText(data.created_at),

    updated_at:
      firstText(data.updated_at),
  };
}

/* =========================================================
   EXTRACTION DES RÉPONSES LARAVEL
========================================================= */

function getSessionFromPayload(
  payload: unknown,
): VisioSession | null {
  const root =
    asRecord(payload);

  const data =
    asRecord(root.data);

  const candidates = [
    root.session,
    root.visio_session,

    data.session,
    data.visio_session,

    root.data,
    payload,
  ];

  for (
    const candidate of candidates
  ) {
    const candidateRecord =
      asRecord(candidate);

    const id =
      normalizeId(
        candidateRecord.id,
      );

    if (String(id).trim()) {
      return normalizeVisioSession(
        candidate,
      );
    }
  }

  return null;
}

function getParticipantFromPayload(
  payload: unknown,
): VisioParticipant | null {
  const root =
    asRecord(payload);

  const data =
    asRecord(root.data);

  const candidate =
    firstDefined(
      root.participant,
      data.participant,
      root.visio_participant,
      data.visio_participant,
    );

  if (!isRecord(candidate)) {
    return null;
  }

  const participant =
    normalizeParticipant(candidate);

  if (
    !String(
      participant.id,
    ).trim() &&
    !String(
      participant.user_id,
    ).trim()
  ) {
    return null;
  }

  return participant;
}

function mergePayloadData(
  payload: unknown,
): UnknownRecord {
  const root =
    asRecord(payload);

  const data =
    asRecord(root.data);

  return {
    ...root,
    ...data,
  };
}

/* =========================================================
   LIBELLÉS
========================================================= */

export function getVisioStatusLabel(
  status?: string | null,
): string {
  const labels:
    Record<string, string> = {
    draft: "Brouillon",

    open: "Ouverte",
    available: "Ouverte",

    confirmed: "Confirmée",
    scheduled: "Programmée",
    reserved: "Réservée",

    live: "En direct",
    started: "En direct",
    in_progress: "En direct",

    ended: "Terminée",
    completed: "Terminée",
    finished: "Terminée",

    cancelled: "Annulée",
    canceled: "Annulée",
  };

  const key =
    normalizeKey(status);

  if (!key) {
    return "Non défini";
  }

  return labels[key] ?? status ?? key;
}

export function getParticipantStatusLabel(
  status?: string | null,
): string {
  const labels:
    Record<string, string> = {
    invited: "Invité",
    reserved: "Réservé",
    confirmed: "Confirmé",
    paid: "Payé",
    joined: "Connecté",
    left: "Sorti",
    cancelled: "Annulé",
    canceled: "Annulé",
    no_show: "Absent",
  };

  const key =
    normalizeKey(status);

  if (!key) {
    return "Non défini";
  }

  return labels[key] ?? status ?? key;
}

export function getPaymentStatusLabel(
  status?: string | null,
): string {
  const labels:
    Record<string, string> = {
    not_required: "Non requis",
    unpaid: "Non payé",
    pending: "En attente",
    paid: "Payé",
    completed: "Payé",
    succeeded: "Payé",
    refunded: "Remboursé",
    failed: "Échec du paiement",
  };

  const key =
    normalizeKey(status);

  if (!key) {
    return "Non défini";
  }

  return labels[key] ?? status ?? key;
}

/* =========================================================
   LISTE DES SÉANCES
========================================================= */

export async function fetchVisioSessions(
  mine = false,
): Promise<VisioSession[]> {
  let payload: unknown;

  if (!mine) {
    payload =
      await apiRequest<unknown>(
        "/visio/sessions",
        {
          auth: false,
        },
      );
  } else {
    try {
      payload =
        await apiRequest<unknown>(
          "/visio/my-sessions",
          {
            auth: true,
          },
        );
    } catch {
      payload =
        await apiRequest<unknown>(
          "/visio/sessions?mine=1&upcoming=0",
          {
            auth: true,
          },
        );
    }
  }

  return extractArray(payload)
    .map(normalizeVisioSession)
    .filter(
      (session) =>
        String(
          session.id,
        ).trim() !== "",
    );
}

/* =========================================================
   DÉTAIL D’UNE SÉANCE
========================================================= */

export async function fetchVisioSession(
  id: ApiId,
): Promise<VisioSession> {
  const payload =
    await apiRequest<unknown>(
      `/visio/sessions/${encodeURIComponent(
        String(id),
      )}`,
      {
        auth: true,
      },
    );

  const session =
    getSessionFromPayload(
      payload,
    );

  if (!session) {
    throw new Error(
      "Séance visio introuvable ou réponse API incomplète.",
    );
  }

  return session;
}

/* =========================================================
   CRÉATION
========================================================= */

export async function createVisioSession(
  body: CreateVisioSessionPayload,
): Promise<VisioSession> {
  const normalizedMinimum =
    normalizeInteger(
      body.min_participants,
      1,
      1,
      VISIO_MAX_COACHEES,
    );

  const normalizedDuration =
    normalizeInteger(
      body.duration_minutes,
      60,
      1,
    );

  const normalizedPrice =
    Math.max(
      0,
      normalizeNumber(
        body.price,
        0,
      ),
    );

  const payload =
    await apiRequest<unknown>(
      "/visio/sessions",
      {
        method: "POST",
        auth: true,

        body: {
          ...body,

          title:
            body.title.trim(),

          description:
            body.description
              ?.trim() ?? "",

          duration_minutes:
            normalizedDuration,

          min_participants:
            normalizedMinimum,

          /**
           * Règle fixe de la V1 :
           * deux coachés maximum.
           */
          max_participants:
            VISIO_MAX_COACHEES,

          price:
            normalizedPrice,

          currency:
            normalizeCurrency(
              body.currency,
            ),
        },
      },
    );

  const session =
    getSessionFromPayload(
      payload,
    );

  if (!session) {
    throw new Error(
      "La séance a été créée, mais Laravel n’a pas retourné les informations de la séance.",
    );
  }

  return session;
}

/* =========================================================
   RÉSERVATION
========================================================= */

export async function reserveVisioSession(
  id: ApiId,
) {
  const payload =
    await apiRequest<unknown>(
      `/visio/sessions/${encodeURIComponent(
        String(id),
      )}/reserve`,
      {
        method: "POST",
        auth: true,
      },
    );

  return {
    ...mergePayloadData(payload),

    session:
      getSessionFromPayload(
        payload,
      ) ?? undefined,

    participant:
      getParticipantFromPayload(
        payload,
      ) ?? undefined,
  };
}

/* =========================================================
   DÉMARRAGE
========================================================= */

export async function startVisioSession(
  id: ApiId,
): Promise<VisioSession> {
  const payload =
    await apiRequest<unknown>(
      `/visio/sessions/${encodeURIComponent(
        String(id),
      )}/start`,
      {
        method: "POST",
        auth: true,
      },
    );

  const session =
    getSessionFromPayload(
      payload,
    );

  if (!session) {
    throw new Error(
      "La séance a été démarrée, mais la réponse API est incomplète.",
    );
  }

  return session;
}

/* =========================================================
   CONNEXION LIVEKIT
========================================================= */

export async function joinVisioSession(
  id: ApiId,
): Promise<VisioJoinPayload> {
  const payload =
    await apiRequest<unknown>(
      `/visio/sessions/${encodeURIComponent(
        String(id),
      )}/join`,
      {
        method: "POST",
        auth: true,
      },
    );

  const root =
    asRecord(payload);

  const data =
    asRecord(root.data);

  const credentials =
    asRecord(
      firstDefined(
        root.credentials,
        data.credentials,
        root.connection,
        data.connection,
      ),
    );

  const token =
    firstText(
      root.token,
      root.participant_token,
      root.livekit_token,

      data.token,
      data.participant_token,
      data.livekit_token,

      credentials.token,
      credentials.participant_token,
      credentials.livekit_token,
    );

  const serverUrl =
    firstText(
      root.server_url,
      root.serverUrl,
      root.livekit_server_url,

      data.server_url,
      data.serverUrl,
      data.livekit_server_url,

      credentials.server_url,
      credentials.serverUrl,
      credentials.livekit_server_url,
    );

  const session =
    getSessionFromPayload(
      payload,
    );

  const participant =
    getParticipantFromPayload(
      payload,
    );

  const roomName =
    firstText(
      root.room_name,
      data.room_name,
      credentials.room_name,
      session?.room_name,
    );

  const provider =
    firstText(
      root.provider,
      data.provider,
      credentials.provider,
      session?.provider,
    ) ?? "livekit";

  const joinUrl =
    firstText(
      root.join_url,
      data.join_url,
      credentials.join_url,
      session?.join_url,
    );

  if (!token) {
    throw new Error(
      "Laravel n’a pas retourné le jeton de connexion LiveKit.",
    );
  }

  if (!serverUrl) {
    throw new Error(
      "Laravel n’a pas retourné l’adresse du serveur LiveKit.",
    );
  }

  return {
    ...mergePayloadData(payload),

    provider,

    token,

    participant_token:
      token,

    server_url:
      serverUrl,

    room_name:
      roomName,

    join_url:
      joinUrl,

    session:
      session ?? undefined,

    participant:
      participant ?? undefined,
  };
}

/* =========================================================
   FIN DE SÉANCE
========================================================= */

export async function endVisioSession(
  id: ApiId,
): Promise<VisioSession> {
  const payload =
    await apiRequest<unknown>(
      `/visio/sessions/${encodeURIComponent(
        String(id),
      )}/end`,
      {
        method: "POST",
        auth: true,
      },
    );

  const session =
    getSessionFromPayload(
      payload,
    );

  if (!session) {
    throw new Error(
      "La séance a été terminée, mais la réponse API est incomplète.",
    );
  }

  return session;
}

/* =========================================================
   VALIDATION MANUELLE D’UN PAIEMENT
========================================================= */

export async function markVisioParticipantPaid(
  sessionId: ApiId,
  participantId: ApiId,
) {
  const payload =
    await apiRequest<unknown>(
      `/visio/sessions/${encodeURIComponent(
        String(sessionId),
      )}/participants/${encodeURIComponent(
        String(participantId),
      )}/paid`,
      {
        method: "POST",
        auth: true,
      },
    );

  return {
    ...mergePayloadData(payload),

    session:
      getSessionFromPayload(
        payload,
      ) ?? undefined,

    participant:
      getParticipantFromPayload(
        payload,
      ) ?? undefined,
  };
}