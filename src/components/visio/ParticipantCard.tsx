"use client";

import {
  CheckCircle2,
  CircleUserRound,
  CreditCard,
  Loader2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  getParticipantStatusLabel,
  getPaymentStatusLabel,
  type VisioParticipant,
} from "@/lib/visio";

import {
  formatMoney,
} from "@/lib/marketplace";

/* =========================================================
   TYPES
========================================================= */

export type ParticipantCardProps = {
  participant: VisioParticipant;

  /**
   * Identifiant de l’utilisateur actuellement connecté.
   * Permet d’afficher le badge « Vous ».
   */
  currentUserId?:
    | number
    | string
    | null;

  /**
   * Indique si l’utilisateur connecté est
   * l’organisateur de la séance.
   */
  isOrganizer?: boolean;

  /**
   * Affiche le statut du paiement pour les coachés.
   */
  showPaymentStatus?: boolean;

  /**
   * Action optionnelle permettant au coach ou à
   * l’administrateur de confirmer manuellement un paiement.
   */
  onMarkPaid?: (
    participant: VisioParticipant,
  ) =>
    | void
    | Promise<void>;

  /**
   * État de chargement pendant la confirmation du paiement.
   */
  markingPaid?: boolean;

  className?: string;
};

/* =========================================================
   CONFIGURATION
========================================================= */

const COACH_ROLES = [
  "coach",
  "intervenant",
  "organizer",
  "organisateur",
];

const ADMIN_ROLES = [
  "admin",
  "administrator",
  "super_admin",
];

const PAID_STATUSES = [
  "paid",
  "completed",
  "succeeded",
  "approved",
  "confirmed",
];

/* =========================================================
   OUTILS
========================================================= */

function normalizeValue(
  value: unknown,
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[\s-]+/g,
      "_",
    );
}

function sameId(
  first: unknown,
  second: unknown,
): boolean {
  if (
    first === null ||
    first === undefined ||
    second === null ||
    second === undefined
  ) {
    return false;
  }

  const firstValue =
    String(first).trim();

  const secondValue =
    String(second).trim();

  return Boolean(
    firstValue &&
      secondValue &&
      firstValue === secondValue,
  );
}

function isCoachRole(
  role: unknown,
): boolean {
  return COACH_ROLES.includes(
    normalizeValue(role),
  );
}

function isAdministratorRole(
  role: unknown,
): boolean {
  return ADMIN_ROLES.includes(
    normalizeValue(role),
  );
}

function isPaidStatus(
  status: unknown,
): boolean {
  return PAID_STATUSES.includes(
    normalizeValue(status),
  );
}

function getParticipantName(
  participant: VisioParticipant,
): string {
  const name =
    participant.user?.name?.trim();

  if (name) {
    return name;
  }

  if (
    String(
      participant.user_id,
    ).trim()
  ) {
    return `Utilisateur #${participant.user_id}`;
  }

  return "Participant Gotfit";
}

function getParticipantInitials(
  participant: VisioParticipant,
): string {
  const name =
    getParticipantName(
      participant,
    );

  const words = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  const initials = words
    .map((word) =>
      word.charAt(0).toUpperCase(),
    )
    .join("");

  return initials || "GF";
}

function getParticipantRoleLabel(
  role: unknown,
): string {
  if (isCoachRole(role)) {
    return "Intervenant";
  }

  if (
    isAdministratorRole(role)
  ) {
    return "Administrateur";
  }

  return "Coaché";
}

function ParticipantRoleIcon({
  role,
}: {
  role: unknown;
}) {
  if (isCoachRole(role)) {
    return <ShieldCheck size={14} className="shrink-0 text-orange-700" />;
  }

  if (
    isAdministratorRole(role)
  ) {
    return <CircleUserRound size={14} className="shrink-0 text-orange-700" />;
  }

  return <UserRound size={14} className="shrink-0 text-orange-700" />;
}

function getStatusClass(
  status: unknown,
): string {
  const normalized =
    normalizeValue(status);

  if (
    [
      "paid",
      "completed",
      "succeeded",
      "joined",
      "present",
      "confirmed",
      "approved",
      "accepted",
    ].includes(normalized)
  ) {
    return [
      "border-emerald-200",
      "bg-emerald-50",
      "text-emerald-700",
    ].join(" ");
  }

  if (
    [
      "invited",
      "reserved",
      "pending",
      "pending_payment",
      "waiting",
    ].includes(normalized)
  ) {
    return [
      "border-orange-200",
      "bg-orange-50",
      "text-orange-700",
    ].join(" ");
  }

  if (
    [
      "cancelled",
      "canceled",
      "rejected",
      "refused",
      "blocked",
      "no_show",
      "unpaid",
      "failed",
      "refunded",
    ].includes(normalized)
  ) {
    return [
      "border-red-200",
      "bg-red-50",
      "text-red-700",
    ].join(" ");
  }

  return [
    "border-slate-200",
    "bg-slate-100",
    "text-slate-600",
  ].join(" ");
}

function joinClassNames(
  ...values: Array<
    string | false | null | undefined
  >
): string {
  return values
    .filter(Boolean)
    .join(" ");
}

/* =========================================================
   COMPOSANT
========================================================= */

export default function ParticipantCard({
  participant,
  currentUserId = null,
  isOrganizer = false,
  showPaymentStatus = true,
  onMarkPaid,
  markingPaid = false,
  className,
}: ParticipantCardProps) {
  const participantIsCoach =
    isCoachRole(
      participant.role,
    );

  const participantIsAdministrator =
    isAdministratorRole(
      participant.role,
    );

  const participantIsClient =
    !participantIsCoach &&
    !participantIsAdministrator;

  const participantHasPaid =
    isPaidStatus(
      participant.payment_status,
    );

  const isCurrentUser =
    sameId(
      participant.user_id,
      currentUserId,
    );

  const canMarkPaid =
    Boolean(
      participantIsClient &&
        isOrganizer &&
        !participantHasPaid &&
        onMarkPaid,
    );

  const participantName =
    getParticipantName(
      participant,
    );

  const participantInitials =
    getParticipantInitials(
      participant,
    );

  const roleLabel =
    getParticipantRoleLabel(
      participant.role,
    );

  const hasAmount =
    participant.amount !== null &&
    participant.amount !== undefined &&
    participant.amount !== "";

  return (
    <article
      className={joinClassNames(
        "rounded-3xl border border-slate-100 bg-slate-50 p-4 transition hover:border-orange-100 hover:bg-orange-50/40",
        isCurrentUser &&
          "border-orange-200 bg-orange-50",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}

        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-orange-700 shadow-sm">
          {participantInitials}

          {participantHasPaid &&
            participantIsClient && (
              <span
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white"
                title="Paiement confirmé"
              >
                <CheckCircle2
                  size={12}
                />
              </span>
            )}
        </div>

        {/* Identité */}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-black text-slate-950">
              {participantName}
            </h3>

            {isCurrentUser && (
              <span className="rounded-full bg-orange-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                Vous
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <ParticipantRoleIcon role={participant.role} />

            <span>
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Statuts */}

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={joinClassNames(
            "rounded-full border px-3 py-1 text-[11px] font-black",
            getStatusClass(
              participant.status,
            ),
          )}
        >
          {getParticipantStatusLabel(
            participant.status,
          )}
        </span>

        {participantIsClient &&
          showPaymentStatus && (
            <span
              className={joinClassNames(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black",
                getStatusClass(
                  participant.payment_status,
                ),
              )}
            >
              <CreditCard
                size={12}
              />

              {getPaymentStatusLabel(
                participant.payment_status,
              )}
            </span>
          )}
      </div>

      {/* Informations complémentaires */}

      {(participantIsClient &&
        hasAmount) && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
          <span className="text-xs font-bold text-slate-500">
            Montant
          </span>

          <strong className="text-sm font-black text-slate-950">
            {formatMoney(
              participant.amount,
              participant.currency ||
                "EUR",
            )}
          </strong>
        </div>
      )}

      {participant.joined_at && (
        <p className="mt-3 text-xs font-semibold text-emerald-700">
          Participant connecté à la salle.
        </p>
      )}

      {participant.left_at && (
        <p className="mt-3 text-xs font-semibold text-slate-500">
          Le participant a quitté la salle.
        </p>
      )}

      {participant.cancelled_at && (
        <p className="mt-3 text-xs font-semibold text-red-700">
          La participation a été annulée.
        </p>
      )}

      {/* Action de paiement */}

      {canMarkPaid && (
        <button
          type="button"
          disabled={markingPaid}
          onClick={() => {
            if (!onMarkPaid) {
              return;
            }

            void onMarkPaid(
              participant,
            );
          }}
          className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
        >
          {markingPaid ? (
            <Loader2
              size={15}
              className="animate-spin"
            />
          ) : (
            <CheckCircle2
              size={15}
            />
          )}

          {markingPaid
            ? "Confirmation..."
            : "Marquer comme payé"}
        </button>
      )}
    </article>
  );
}
