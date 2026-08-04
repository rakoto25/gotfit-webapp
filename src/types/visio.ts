import type {
  ApiId,
  ApiTimestamp,
  User,
} from "@/types/auth";

/* =========================================================
   OUTILS
========================================================= */

/**
 * Autorise les valeurs connues tout en restant compatible
 * avec de nouveaux statuts renvoyés par Laravel.
 */
type OpenString = string & {};

/**
 * Version allégée d’un utilisateur associé à une visio.
 */
export type VisioUser = Omit<
  Partial<User>,
  "id" | "name"
> & {
  id: ApiId;
  name: string;
};

/* =========================================================
   STATUTS ET RÔLES
========================================================= */

export type VisioParticipantRole =
  | "coach"
  | "intervenant"
  | "organizer"
  | "organisateur"
  | "client"
  | "participant"
  | "coache"
  | "coachee"
  | OpenString;

export type VisioParticipantStatus =
  | "invited"
  | "reserved"
  | "confirmed"
  | "accepted"
  | "approved"
  | "joined"
  | "present"
  | "left"
  | "cancelled"
  | "canceled"
  | "no_show"
  | "blocked"
  | OpenString;

export type VisioPaymentStatus =
  | "not_required"
  | "unpaid"
  | "pending"
  | "paid"
  | "completed"
  | "succeeded"
  | "refunded"
  | "failed"
  | OpenString;

export type VisioSessionStatus =
  | "draft"
  | "open"
  | "confirmed"
  | "scheduled"
  | "reserved"
  | "live"
  | "started"
  | "in_progress"
  | "ended"
  | "completed"
  | "finished"
  | "cancelled"
  | "canceled"
  | OpenString;

export type VisioSessionType =
  | "individual"
  | "group"
  | OpenString;

export type VisioProvider =
  | "livekit"
  | OpenString;

/* =========================================================
   PARTICIPANT
========================================================= */

export type VisioParticipant = {
  id: ApiId;

  visio_session_id: ApiId;
  user_id: ApiId;

  reservation_id?: ApiId | null;

  role: VisioParticipantRole;
  status: VisioParticipantStatus;
  payment_status: VisioPaymentStatus;

  amount?: number | string | null;
  currency?: string | null;

  payment_intent_id?: string | null;

  paid_at?: ApiTimestamp;
  joined_at?: ApiTimestamp;
  left_at?: ApiTimestamp;
  cancelled_at?: ApiTimestamp;

  user?: VisioUser | null;

  created_at?: ApiTimestamp;
  updated_at?: ApiTimestamp;
};

/* =========================================================
   SÉANCE VISIO
========================================================= */

export type VisioSession = {
  id: ApiId;

  coach_id?: ApiId | null;
  intervenant_id?: ApiId | null;

  reservation_id?: ApiId | null;
  annonce_id?: ApiId | null;

  title: string;
  description?: string | null;

  start_at: string;
  scheduled_at?: string | null;

  duration_minutes: number;

  /**
   * Nombre de coachés, sans compter l’intervenant.
   */
  min_participants: number;
  minimum_participants?: number | null;
  max_participants?: number | null;

  price?: number | string | null;
  currency?: string | null;

  session_type?: VisioSessionType | null;
  status: VisioSessionStatus;

  provider?: VisioProvider | null;

  provider_room_id?: string | null;
  room_name?: string | null;
  join_url?: string | null;

  started_at?: ApiTimestamp;
  ended_at?: ApiTimestamp;

  cancellation_reason?: string | null;

  paid_participants_count?: number;
  reserved_participants_count?: number;

  available_places?: number | null;
  is_confirmed_by_minimum?: boolean;

  coach?: VisioUser | null;
  intervenant?: VisioUser | null;

  participants?: VisioParticipant[];

  created_at?: ApiTimestamp;
  updated_at?: ApiTimestamp;
};

/* =========================================================
   CRÉATION D’UNE SÉANCE
========================================================= */

export type CreateVisioSessionPayload = {
  title: string;
  description?: string;

  start_at: string;
  duration_minutes: number;

  /**
   * Nombre de coachés.
   * Maximum prévu pour la V1 : 2.
   */
  min_participants: number;
  max_participants?: number | null;

  price: number;
  currency: string;
};

/* =========================================================
   CONNEXION LIVEKIT
========================================================= */

export type VisioJoinPayload = {
  provider?: VisioProvider | null;

  server_url?: string | null;
  room_name?: string | null;
  join_url?: string | null;

  token?: string | null;
  participant_token?: string | null;

  session?: VisioSession;
  participant?: VisioParticipant;

  [key: string]: unknown;
};

/* =========================================================
   RÉPONSES DES ACTIONS
========================================================= */

export type VisioMutationPayload = {
  session?: VisioSession;
  participant?: VisioParticipant;

  message?: string;
  success?: boolean;

  [key: string]: unknown;
};