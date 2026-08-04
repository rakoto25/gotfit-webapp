import type {
  AccountStatus,
  VerificationStatus as ApiVerificationStatus,
} from "@/types/auth";

/* =========================================================
   TYPES
========================================================= */

export type VerificationState =
  | "approved"
  | "pending"
  | "rejected"
  | "incomplete"
  | "suspended"
  | "inactive"
  | "unknown";

export type VerificationStatusContext =
  | "profile"
  | "document"
  | "account"
  | "generic";

export type VerificationStatusVariant =
  | "badge"
  | "inline"
  | "card";

export type VerificationStatusSize =
  | "sm"
  | "md"
  | "lg";

export type VerificationStatusValue =
  | ApiVerificationStatus
  | AccountStatus
  | string
  | null
  | undefined;

export type VerificationStatusProps = {
  /**
   * Statut renvoyé par l’API Laravel.
   *
   * Exemples :
   * approved, pending, rejected,
   * in_review, active, incomplete...
   */
  status?: VerificationStatusValue;

  /**
   * Contexte d’utilisation du statut.
   */
  context?: VerificationStatusContext;

  /**
   * Forme visuelle du composant.
   */
  variant?: VerificationStatusVariant;

  /**
   * Taille du composant.
   */
  size?: VerificationStatusSize;

  /**
   * Remplace le libellé généré automatiquement.
   */
  label?: string;

  /**
   * Remplace le titre généré automatiquement.
   * Principalement utilisé avec variant="card".
   */
  heading?: string;

  /**
   * Remplace la description générée automatiquement.
   */
  description?: string;

  /**
   * Affiche ou masque la description.
   */
  showDescription?: boolean;

  /**
   * Affiche ou masque l’icône.
   */
  showIcon?: boolean;

  /**
   * Motif du refus éventuellement renvoyé par Laravel.
   */
  rejectionReason?: string | null;

  /**
   * Date de validation.
   */
  verifiedAt?: string | null;

  /**
   * Date de dernière mise à jour du statut.
   */
  updatedAt?: string | null;

  /**
   * Classes CSS supplémentaires.
   */
  className?: string;

  /**
   * Libellé d’accessibilité personnalisé.
   */
  ariaLabel?: string;
};

export type VerificationStatusMeta = {
  state: VerificationState;
  label: string;
  heading: string;
  description: string;
  badgeClasses: string;
  cardClasses: string;
  iconContainerClasses: string;
  iconClasses: string;
};

/* =========================================================
   OUTILS
========================================================= */

function classNames(
  ...values: Array<
    string | false | null | undefined
  >
): string {
  return values.filter(Boolean).join(" ");
}

function cleanText(
  value: unknown,
): string | null {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return null;
  }

  const result = String(value).trim();

  return result || null;
}

/**
 * Transforme par exemple :
 *
 * "Validé"             => "valide"
 * "pending-validation" => "pending_validation"
 * "Under Review"       => "under_review"
 */
export function normalizeVerificationStatusValue(
  status?: VerificationStatusValue,
): string {
  return String(status ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");
}

/* =========================================================
   NORMALISATION DU STATUT
========================================================= */

export function getVerificationState(
  status?: VerificationStatusValue,
): VerificationState {
  const normalized =
    normalizeVerificationStatusValue(status);

  if (
    [
      "approved",
      "approve",
      "verified",
      "validate",
      "validated",
      "valide",
      "accepted",
      "active",
    ].includes(normalized)
  ) {
    return "approved";
  }

  if (
    [
      "pending",
      "pending_review",
      "pending_validation",
      "pending_verification",
      "en_attente",
      "in_review",
      "under_review",
      "submitted",
      "processing",
    ].includes(normalized)
  ) {
    return "pending";
  }

  if (
    [
      "rejected",
      "refused",
      "refuse",
      "declined",
      "invalid",
      "not_approved",
    ].includes(normalized)
  ) {
    return "rejected";
  }

  if (
    [
      "incomplete",
      "draft",
      "not_submitted",
      "missing",
      "uncompleted",
    ].includes(normalized)
  ) {
    return "incomplete";
  }

  if (
    [
      "suspended",
      "blocked",
      "disabled",
      "banned",
    ].includes(normalized)
  ) {
    return "suspended";
  }

  if (
    [
      "inactive",
      "archived",
      "closed",
    ].includes(normalized)
  ) {
    return "inactive";
  }

  return "unknown";
}

/* =========================================================
   LIBELLÉS PAR CONTEXTE
========================================================= */

function getProfileCopy(
  state: VerificationState,
): Pick<
  VerificationStatusMeta,
  "label" | "heading" | "description"
> {
  switch (state) {
    case "approved":
      return {
        label: "Profil vérifié",
        heading: "Votre profil est vérifié",
        description:
          "Votre profil professionnel a été contrôlé et validé par l’équipe Gotfit.",
      };

    case "pending":
      return {
        label: "Validation en cours",
        heading: "Votre profil est en cours de validation",
        description:
          "L’équipe Gotfit examine actuellement vos informations et vos justificatifs professionnels.",
      };

    case "rejected":
      return {
        label: "Profil refusé",
        heading: "La validation du profil a été refusée",
        description:
          "Certaines informations ou certains justificatifs doivent être corrigés avant une nouvelle validation.",
      };

    case "incomplete":
      return {
        label: "Profil incomplet",
        heading: "Votre profil doit être complété",
        description:
          "Ajoutez les informations et les justificatifs manquants pour demander la validation de votre profil.",
      };

    case "suspended":
      return {
        label: "Profil suspendu",
        heading: "Votre profil est suspendu",
        description:
          "Votre profil professionnel n’est actuellement pas disponible publiquement.",
      };

    case "inactive":
      return {
        label: "Profil inactif",
        heading: "Votre profil est inactif",
        description:
          "Votre profil n’est actuellement pas visible dans l’annuaire des intervenants.",
      };

    default:
      return {
        label: "Statut indisponible",
        heading: "Le statut du profil est indisponible",
        description:
          "Le statut de validation de ce profil n’a pas encore été communiqué par l’API.",
      };
  }
}

function getDocumentCopy(
  state: VerificationState,
): Pick<
  VerificationStatusMeta,
  "label" | "heading" | "description"
> {
  switch (state) {
    case "approved":
      return {
        label: "Document validé",
        heading: "Ce justificatif est validé",
        description:
          "Le document a été vérifié et accepté par l’équipe Gotfit.",
      };

    case "pending":
      return {
        label: "En cours de vérification",
        heading: "Ce justificatif est en cours de vérification",
        description:
          "Le document a bien été transmis et sera prochainement examiné.",
      };

    case "rejected":
      return {
        label: "Document refusé",
        heading: "Ce justificatif a été refusé",
        description:
          "Le document ne répond pas aux conditions de validation et doit être remplacé ou corrigé.",
      };

    case "incomplete":
      return {
        label: "Document incomplet",
        heading: "Ce justificatif est incomplet",
        description:
          "Certaines informations du document sont manquantes ou illisibles.",
      };

    case "suspended":
      return {
        label: "Document bloqué",
        heading: "Ce justificatif est bloqué",
        description:
          "Le document ne peut actuellement pas être utilisé pour la validation du profil.",
      };

    case "inactive":
      return {
        label: "Document archivé",
        heading: "Ce justificatif est archivé",
        description:
          "Le document n’est plus utilisé pour la vérification du profil.",
      };

    default:
      return {
        label: "Statut indisponible",
        heading: "Statut du justificatif indisponible",
        description:
          "Aucune information de validation n’est actuellement disponible pour ce document.",
      };
  }
}

function getAccountCopy(
  state: VerificationState,
): Pick<
  VerificationStatusMeta,
  "label" | "heading" | "description"
> {
  switch (state) {
    case "approved":
      return {
        label: "Compte actif",
        heading: "Votre compte est actif",
        description:
          "Votre compte Gotfit est actif et peut accéder aux fonctionnalités autorisées.",
      };

    case "pending":
      return {
        label: "Compte en attente",
        heading: "Votre compte est en attente",
        description:
          "Votre compte doit encore être contrôlé ou activé par l’équipe Gotfit.",
      };

    case "rejected":
      return {
        label: "Compte refusé",
        heading: "Votre compte a été refusé",
        description:
          "Votre demande d’accès à Gotfit n’a pas été validée.",
      };

    case "incomplete":
      return {
        label: "Compte incomplet",
        heading: "Votre compte doit être complété",
        description:
          "Certaines informations obligatoires doivent encore être renseignées.",
      };

    case "suspended":
      return {
        label: "Compte suspendu",
        heading: "Votre compte est suspendu",
        description:
          "L’accès à certaines fonctionnalités Gotfit est temporairement désactivé.",
      };

    case "inactive":
      return {
        label: "Compte inactif",
        heading: "Votre compte est inactif",
        description:
          "Votre compte n’est actuellement pas actif sur Gotfit.",
      };

    default:
      return {
        label: "Statut indisponible",
        heading: "Statut du compte indisponible",
        description:
          "Le statut actuel du compte n’a pas encore été communiqué.",
      };
  }
}

function getGenericCopy(
  state: VerificationState,
): Pick<
  VerificationStatusMeta,
  "label" | "heading" | "description"
> {
  switch (state) {
    case "approved":
      return {
        label: "Vérifié",
        heading: "Vérification validée",
        description:
          "Les informations ont été contrôlées et validées.",
      };

    case "pending":
      return {
        label: "En attente",
        heading: "Vérification en cours",
        description:
          "Les informations sont actuellement en cours de vérification.",
      };

    case "rejected":
      return {
        label: "Refusé",
        heading: "Vérification refusée",
        description:
          "Les informations transmises n’ont pas été validées.",
      };

    case "incomplete":
      return {
        label: "Incomplet",
        heading: "Informations incomplètes",
        description:
          "Certaines informations obligatoires sont manquantes.",
      };

    case "suspended":
      return {
        label: "Suspendu",
        heading: "Vérification suspendue",
        description:
          "La vérification est temporairement suspendue.",
      };

    case "inactive":
      return {
        label: "Inactif",
        heading: "Élément inactif",
        description:
          "Cet élément n’est actuellement pas actif.",
      };

    default:
      return {
        label: "Indisponible",
        heading: "Statut indisponible",
        description:
          "Aucune information de validation n’est disponible.",
      };
  }
}

/* =========================================================
   STYLES PAR STATUT
========================================================= */

function getStatusStyles(
  state: VerificationState,
): Pick<
  VerificationStatusMeta,
  | "badgeClasses"
  | "cardClasses"
  | "iconContainerClasses"
  | "iconClasses"
> {
  switch (state) {
    case "approved":
      return {
        badgeClasses:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        cardClasses:
          "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
        iconContainerClasses:
          "bg-emerald-100 text-emerald-700",
        iconClasses:
          "text-emerald-700",
      };

    case "pending":
      return {
        badgeClasses:
          "border-amber-200 bg-amber-50 text-amber-700",
        cardClasses:
          "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
        iconContainerClasses:
          "bg-amber-100 text-amber-700",
        iconClasses:
          "text-amber-700",
      };

    case "rejected":
      return {
        badgeClasses:
          "border-red-200 bg-red-50 text-red-700",
        cardClasses:
          "border-red-200 bg-gradient-to-br from-red-50 to-white",
        iconContainerClasses:
          "bg-red-100 text-red-700",
        iconClasses:
          "text-red-700",
      };

    case "incomplete":
      return {
        badgeClasses:
          "border-orange-200 bg-orange-50 text-orange-700",
        cardClasses:
          "border-orange-200 bg-gradient-to-br from-orange-50 to-white",
        iconContainerClasses:
          "bg-orange-100 text-orange-700",
        iconClasses:
          "text-orange-700",
      };

    case "suspended":
      return {
        badgeClasses:
          "border-rose-200 bg-rose-50 text-rose-700",
        cardClasses:
          "border-rose-200 bg-gradient-to-br from-rose-50 to-white",
        iconContainerClasses:
          "bg-rose-100 text-rose-700",
        iconClasses:
          "text-rose-700",
      };

    case "inactive":
      return {
        badgeClasses:
          "border-slate-200 bg-slate-100 text-slate-600",
        cardClasses:
          "border-slate-200 bg-gradient-to-br from-slate-100 to-white",
        iconContainerClasses:
          "bg-slate-200 text-slate-600",
        iconClasses:
          "text-slate-600",
      };

    default:
      return {
        badgeClasses:
          "border-slate-200 bg-slate-50 text-slate-600",
        cardClasses:
          "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
        iconContainerClasses:
          "bg-slate-100 text-slate-500",
        iconClasses:
          "text-slate-500",
      };
  }
}

/* =========================================================
   MÉTADONNÉES DU STATUT
========================================================= */

export function getVerificationStatusMeta(
  status?: VerificationStatusValue,
  context: VerificationStatusContext = "generic",
): VerificationStatusMeta {
  const state = getVerificationState(status);

  let copy: Pick<
    VerificationStatusMeta,
    "label" | "heading" | "description"
  >;

  switch (context) {
    case "profile":
      copy = getProfileCopy(state);
      break;

    case "document":
      copy = getDocumentCopy(state);
      break;

    case "account":
      copy = getAccountCopy(state);
      break;

    default:
      copy = getGenericCopy(state);
      break;
  }

  return {
    state,
    ...copy,
    ...getStatusStyles(state),
  };
}

/* =========================================================
   FONCTIONS DE VÉRIFICATION
========================================================= */

export function isVerificationApproved(
  status?: VerificationStatusValue,
): boolean {
  return getVerificationState(status) === "approved";
}

export function isVerificationPending(
  status?: VerificationStatusValue,
): boolean {
  return getVerificationState(status) === "pending";
}

export function isVerificationRejected(
  status?: VerificationStatusValue,
): boolean {
  return getVerificationState(status) === "rejected";
}

export function isVerificationIncomplete(
  status?: VerificationStatusValue,
): boolean {
  return getVerificationState(status) === "incomplete";
}

/* =========================================================
   FORMATAGE DE DATE
========================================================= */

function formatStatusDate(
  value?: string | null,
): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/* =========================================================
   ICÔNES
========================================================= */

type IconProps = {
  className?: string;
};

function ApprovedIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function PendingIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function RejectedIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6" />
      <path d="m15 9-6 6" />
    </svg>
  );
}

function IncompleteIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3 2.8 19h18.4L12 3Z" />
      <path d="M12 9v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function SuspendedIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 7.5 16.5 16.5" />
    </svg>
  );
}

function InactiveIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </svg>
  );
}

function UnknownIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.4 2.4 0 1 1 3.7 2c-1 .7-1.5 1.1-1.5 2" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function StatusIcon({
  state,
  className,
}: IconProps & {
  state: VerificationState;
}) {
  switch (state) {
    case "approved":
      return (
        <ApprovedIcon
          className={className}
        />
      );

    case "pending":
      return (
        <PendingIcon
          className={className}
        />
      );

    case "rejected":
      return (
        <RejectedIcon
          className={className}
        />
      );

    case "incomplete":
      return (
        <IncompleteIcon
          className={className}
        />
      );

    case "suspended":
      return (
        <SuspendedIcon
          className={className}
        />
      );

    case "inactive":
      return (
        <InactiveIcon
          className={className}
        />
      );

    default:
      return (
        <UnknownIcon
          className={className}
        />
      );
  }
}

/* =========================================================
   TAILLES
========================================================= */

function getBadgeSizeClasses(
  size: VerificationStatusSize,
): string {
  switch (size) {
    case "sm":
      return "gap-1.5 px-2.5 py-1 text-[11px]";

    case "lg":
      return "gap-2.5 px-4 py-2.5 text-sm";

    default:
      return "gap-2 px-3 py-1.5 text-xs";
  }
}

function getBadgeIconSizeClasses(
  size: VerificationStatusSize,
): string {
  switch (size) {
    case "sm":
      return "h-3.5 w-3.5";

    case "lg":
      return "h-5 w-5";

    default:
      return "h-4 w-4";
  }
}

function getInlineIconContainerClasses(
  size: VerificationStatusSize,
): string {
  switch (size) {
    case "sm":
      return "h-9 w-9 rounded-xl";

    case "lg":
      return "h-14 w-14 rounded-2xl";

    default:
      return "h-11 w-11 rounded-2xl";
  }
}

function getInlineIconSizeClasses(
  size: VerificationStatusSize,
): string {
  switch (size) {
    case "sm":
      return "h-4 w-4";

    case "lg":
      return "h-7 w-7";

    default:
      return "h-5 w-5";
  }
}

/* =========================================================
   COMPOSANT
========================================================= */

export function VerificationStatus({
  status,
  context = "generic",
  variant = "badge",
  size = "md",
  label,
  heading,
  description,
  showDescription,
  showIcon = true,
  rejectionReason,
  verifiedAt,
  updatedAt,
  className,
  ariaLabel,
}: VerificationStatusProps) {
  const meta = getVerificationStatusMeta(
    status,
    context,
  );

  const displayedLabel =
    cleanText(label) ?? meta.label;

  const displayedHeading =
    cleanText(heading) ?? meta.heading;

  const displayedDescription =
    cleanText(description) ??
    meta.description;

  const displayedReason =
    cleanText(rejectionReason);

  const shouldShowDescription =
    showDescription ??
    variant !== "badge";

  const dateValue =
    meta.state === "approved"
      ? verifiedAt ?? updatedAt
      : updatedAt ?? verifiedAt;

  const formattedDate =
    formatStatusDate(dateValue);

  const dateLabel =
    meta.state === "approved" &&
    verifiedAt
      ? "Vérifié le"
      : "Mis à jour le";

  const accessibleLabel =
    ariaLabel ??
    `${displayedLabel}. ${displayedDescription}`;

  /* =======================================================
     BADGE
  ======================================================= */

  if (variant === "badge") {
    return (
      <span
        role="status"
        aria-label={accessibleLabel}
        title={displayedDescription}
        className={classNames(
          "inline-flex w-fit items-center rounded-full border font-black",
          getBadgeSizeClasses(size),
          meta.badgeClasses,
          className,
        )}
      >
        {showIcon && (
          <StatusIcon
            state={meta.state}
            className={classNames(
              getBadgeIconSizeClasses(size),
              meta.iconClasses,
            )}
          />
        )}

        <span>{displayedLabel}</span>
      </span>
    );
  }

  /* =======================================================
     VERSION EN LIGNE
  ======================================================= */

  if (variant === "inline") {
    return (
      <div
        role="status"
        aria-label={accessibleLabel}
        className={classNames(
          "flex items-start gap-3",
          className,
        )}
      >
        {showIcon && (
          <div
            className={classNames(
              "flex shrink-0 items-center justify-center",
              getInlineIconContainerClasses(
                size,
              ),
              meta.iconContainerClasses,
            )}
          >
            <StatusIcon
              state={meta.state}
              className={getInlineIconSizeClasses(
                size,
              )}
            />
          </div>
        )}

        <div className="min-w-0">
          <p className="font-black text-slate-950">
            {displayedLabel}
          </p>

          {shouldShowDescription && (
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {displayedDescription}
            </p>
          )}

          {meta.state === "rejected" &&
            displayedReason && (
              <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-red-600">
                  Motif du refus
                </p>

                <p className="mt-1 text-sm font-semibold leading-6 text-red-800">
                  {displayedReason}
                </p>
              </div>
            )}

          {formattedDate && (
            <p className="mt-2 text-xs font-semibold text-slate-400">
              {dateLabel}{" "}
              {formattedDate}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* =======================================================
     CARTE
  ======================================================= */

  return (
    <section
      role="status"
      aria-label={accessibleLabel}
      className={classNames(
        "overflow-hidden rounded-3xl border p-5 shadow-sm sm:p-6",
        meta.cardClasses,
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {showIcon && (
          <div
            className={classNames(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
              meta.iconContainerClasses,
            )}
          >
            <StatusIcon
              state={meta.state}
              className="h-6 w-6"
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <VerificationStatus
            status={status}
            context={context}
            variant="badge"
            size="sm"
            label={displayedLabel}
            showIcon={false}
          />

          <h3 className="mt-3 text-lg font-black text-slate-950 sm:text-xl">
            {displayedHeading}
          </h3>

          {shouldShowDescription && (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {displayedDescription}
            </p>
          )}
        </div>
      </div>

      {meta.state === "rejected" &&
        displayedReason && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-white/80 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-red-600">
              Motif du refus
            </p>

            <p className="mt-2 text-sm font-semibold leading-6 text-red-800">
              {displayedReason}
            </p>
          </div>
        )}

      {formattedDate && (
        <div className="mt-5 border-t border-black/5 pt-4">
          <p className="text-xs font-semibold text-slate-500">
            {dateLabel}{" "}
            <strong className="font-black text-slate-700">
              {formattedDate}
            </strong>
          </p>
        </div>
      )}
    </section>
  );
}

export default VerificationStatus;