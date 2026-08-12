import type { ReactNode } from "react";
import Link from "next/link";

import VerificationStatus from "@/components/coach/VerificationStatus";

import type { Intervenant } from "@/lib/intervenants";

import {
  getActivityName,
  getCoachCertifications,
  getCoachDescription,
  getCoachExperience,
  getCoachLanguages,
  getCoachServices,
  getCoachSpeciality,
  getCoachTitle,
  getDocumentsCount,
  getIntervenantCover,
  getIntervenantName,
  getIntervenantPhoto,
  getIntervenantStatus,
  getIntervenantVideo,
  getLocation,
  getProfileCompletion,
  getProfileMissingFields,
  getRating,
  getReviewsCount,
  getSiret,
  getVideoDurationLabel,
  isValidSiret,
} from "@/lib/intervenants";

/* =========================================================
   TYPES
========================================================= */

type UnknownRecord = Record<string, unknown>;

type IconProps = {
  className?: string;
};

type InformationItemProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
};

type TagListProps = {
  items: string[];
  emptyLabel: string;
};

export type CoachProfessionalProfileProps = {
  intervenant: Intervenant;

  /**
   * Affiche les boutons de gestion,
   * les informations manquantes et les actions privées.
   */
  editable?: boolean;

  /**
   * Affiche le SIRET complet.
   * Par défaut, suit la valeur de `editable`.
   */
  showSensitiveDetails?: boolean;

  className?: string;

  /**
   * Page permettant de modifier le profil général.
   */
  editProfileHref?: string;

  /**
   * Page privée de gestion des justificatifs.
   */
  documentsHref?: string;

  /**
   * Tableau de bord privé de l’intervenant.
   */
  dashboardHref?: string;
};

/* =========================================================
   OUTILS
========================================================= */

function classNames(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
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

  const text = String(value).trim();

  return text || null;
}

function getFirstText(
  records: UnknownRecord[],
  keys: string[],
): string | null {
  for (const record of records) {
    for (const key of keys) {
      const value = cleanText(record[key]);

      if (value) {
        return value;
      }
    }
  }

  return null;
}

/**
 * Retourne une propriété imbriquée uniquement
 * lorsqu’elle correspond réellement à un objet.
 */
function getNestedRecord(
  record: UnknownRecord,
  key: string,
): UnknownRecord {
  const value = record[key];

  return isRecord(value)
    ? value
    : {};
}

/**
 * Regroupe les différentes structures possibles
 * renvoyées par l’API pour un profil intervenant.
 */
function getIntervenantRecords(
  intervenant: Intervenant,
): UnknownRecord[] {
  const root: UnknownRecord =
    isRecord(intervenant)
      ? intervenant
      : {};

  return [
    root,
    getNestedRecord(
      root,
      "intervenant_profile",
    ),
    getNestedRecord(
      root,
      "coach_profile",
    ),
    getNestedRecord(
      root,
      "professional_profile",
    ),
    getNestedRecord(
      root,
      "profile",
    ),
  ];
}

function getVerificationRejectionReason(
  intervenant: Intervenant,
): string | null {
  return getFirstText(
    getIntervenantRecords(intervenant),
    [
      "rejection_reason",
      "verification_rejection_reason",
      "validation_rejection_reason",
      "refusal_reason",
    ],
  );
}

function getVerificationDate(
  intervenant: Intervenant,
): string | null {
  return getFirstText(
    getIntervenantRecords(intervenant),
    [
      "verified_at",
      "validated_at",
      "approved_at",
    ],
  );
}

function getUpdatedDate(
  intervenant: Intervenant,
): string | null {
  return getFirstText(
    getIntervenantRecords(intervenant),
    ["updated_at"],
  );
}

function getInitials(
  name: string,
): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "GF";
  }

  return parts
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getCompletionClasses(
  completion: number,
): string {
  if (completion >= 100) {
    return "from-emerald-400 to-emerald-600";
  }

  if (completion >= 70) {
    return "from-amber-300 to-orange-500";
  }

  return "from-orange-400 to-red-500";
}

function normalizePercentage(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, Math.round(value)),
  );
}

function formatSiret(
  value: string | null,
): string {
  if (!value) {
    return "Non renseigné";
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length !== 14) {
    return value;
  }

  return [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 9),
    digits.slice(9),
  ].join(" ");
}

function maskSiret(
  value: string | null,
): string {
  if (!value) {
    return "Non renseigné";
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length < 5) {
    return "••• ••• ••• •••••";
  }

  return `••• ••• ••• ${digits.slice(-5)}`;
}

/* =========================================================
   ICÔNES
========================================================= */

function BriefcaseIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" />

      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="2.5"
      />

      <path d="M3 12.5c2.7 1.5 5.7 2.2 9 2.2s6.3-.7 9-2.2" />

      <path d="M10.5 14.5h3" />
    </svg>
  );
}

function LocationIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 10c0 5.3-8 11-8 11s-8-5.7-8-11a8 8 0 1 1 16 0Z" />

      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}

function CertificateIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle
        cx="12"
        cy="9"
        r="5"
      />

      <path d="m8.5 13-1 7 4.5-2 4.5 2-1-7" />

      <path d="m10.2 9 1.2 1.2 2.5-2.5" />
    </svg>
  );
}

function LanguageIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M3.5 9h17" />
      <path d="M3.5 15h17" />

      <path d="M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21" />

      <path d="M12 3c-2.2 2.5-3.3 5.5-3.3 9S9.8 18.5 12 21" />
    </svg>
  );
}

function DocumentIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />

      <path d="M14 3v5h5" />

      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

function StarIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9L12 2.8Z" />
    </svg>
  );
}

function VideoIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect
        x="3"
        y="6"
        width="13"
        height="12"
        rx="2"
      />

      <path d="m16 10 5-3v10l-5-3" />
    </svg>
  );
}

/* =========================================================
   COMPOSANTS INTERNES
========================================================= */

function InformationItem({
  icon,
  label,
  value,
}: InformationItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>

        <div className="mt-1 break-words text-sm font-black text-slate-900">
          {value}
        </div>
      </div>
    </div>
  );
}

function TagList({
  items,
  emptyLabel,
}: TagListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm leading-6 text-slate-500">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */

export default function CoachProfessionalProfile({
  intervenant,
  editable = false,
  showSensitiveDetails,
  className,
  editProfileHref = "/profile",
  documentsHref = "/intervenants/documents",
  dashboardHref = "/intervenant/dashboard",
}: CoachProfessionalProfileProps) {
  const canShowSensitiveDetails =
    showSensitiveDetails ?? editable;

  const name =
    getIntervenantName(intervenant);

  const initials =
    getInitials(name);

  const title =
    getCoachTitle(intervenant);

  const speciality =
    getCoachSpeciality(intervenant);

  const description =
    getCoachDescription(intervenant);

  const activityName =
    getActivityName(intervenant);

  const siret =
    getSiret(intervenant);

  const validSiret =
    isValidSiret(intervenant);

  const location =
    getLocation(intervenant);

  const experience =
    getCoachExperience(intervenant);

  const services =
    getCoachServices(intervenant);

  const languages =
    getCoachLanguages(intervenant);

  const certifications =
    getCoachCertifications(intervenant);

  const documentsCount = Math.max(
    0,
    getDocumentsCount(intervenant),
  );

  const photoUrl =
    getIntervenantPhoto(intervenant);

  const coverUrl =
    getIntervenantCover(intervenant);

  const videoUrl =
    getIntervenantVideo(intervenant);

  const videoDuration =
    getVideoDurationLabel(intervenant);

  const rating =
    getRating(intervenant);

  const reviewsCount =
    getReviewsCount(intervenant);

  const verificationStatus =
    getIntervenantStatus(intervenant);

  const rejectionReason =
    getVerificationRejectionReason(
      intervenant,
    );

  const verifiedAt =
    getVerificationDate(intervenant);

  const updatedAt =
    getUpdatedDate(intervenant);

  const profileCompletion =
    normalizePercentage(
      getProfileCompletion(intervenant),
    );

  const missingFields = editable
    ? getProfileMissingFields(intervenant)
    : [];

  const displayedSiret =
    canShowSensitiveDetails
      ? formatSiret(siret)
      : maskSiret(siret);

  const documentsProgress = Math.min(
    100,
    Math.max(
      0,
      (documentsCount / 5) * 100,
    ),
  );

  return (
    <section
      className={classNames(
        "overflow-hidden rounded-[2rem]",
        "border border-slate-200",
        "bg-white shadow-sm",
        className,
      )}
    >
      {/* ===================================================
          COUVERTURE
      =================================================== */}

      <div className="relative h-40 overflow-hidden bg-slate-950 sm:h-52 lg:h-60">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`Couverture du profil de ${name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />

        <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />
      </div>

      {/* ===================================================
          IDENTITÉ
      =================================================== */}

      <div className="relative px-5 pb-6 sm:px-7 lg:px-9">
        <div className="-mt-16 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[1.75rem] border-4 border-white bg-gradient-to-br from-amber-300 to-orange-500 shadow-xl">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={`Photo de ${name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-black text-slate-950">
                  {initials}
                </div>
              )}
            </div>

            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <VerificationStatus
                  status={verificationStatus}
                  context="profile"
                  variant="badge"
                  size="md"
                />

                {profileCompletion >= 100 && (
                  <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700">
                    Profil complet
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {name}
              </h1>

              <p className="mt-1 text-base font-bold text-orange-600">
                {title}
              </p>

              {activityName && (
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {activityName}
                </p>
              )}
            </div>
          </div>

          {editable && (
            <div className="flex flex-wrap gap-2 pb-1">
              <Link
                href="/intervenant/annonces/nouvelle"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand)] px-4 text-xs font-black text-[var(--ink)] transition hover:bg-[var(--brand-soft)]"
              >
                Créer une annonce
              </Link>

              <Link
                href={dashboardHref}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
              >
                Tableau de bord
              </Link>

              <Link
                href={editProfileHref}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-slate-800"
              >
                Modifier le profil
              </Link>
            </div>
          )}
        </div>

        {/* =================================================
            STATISTIQUES
        ================================================= */}

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Profil
            </p>

            <div className="mt-2 flex items-end justify-between gap-3">
              <strong className="text-2xl font-black text-slate-950">
                {profileCompletion}%
              </strong>

              <span className="text-xs font-semibold text-slate-500">
                complété
              </span>
            </div>

            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={profileCompletion}
              aria-label="Complétion du profil"
            >
              <div
                className={classNames(
                  "h-full rounded-full",
                  "bg-gradient-to-r",
                  getCompletionClasses(
                    profileCompletion,
                  ),
                )}
                style={{
                  width: `${profileCompletion}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Note
            </p>

            <div className="mt-2 flex items-center gap-2">
              <StarIcon className="h-5 w-5 text-amber-400" />

              <strong className="text-2xl font-black text-slate-950">
                {rating > 0
                  ? rating.toFixed(1)
                  : "—"}
              </strong>
            </div>

            <p className="mt-2 text-xs font-semibold text-slate-500">
              {reviewsCount} avis
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Justificatifs
            </p>

            <strong className="mt-2 block text-2xl font-black text-slate-950">
              {documentsCount}/5
            </strong>

            <p className="mt-2 text-xs font-semibold text-slate-500">
              diplôme(s) ou certification(s)
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Expérience
            </p>

            <strong className="mt-2 block text-lg font-black text-slate-950">
              {experience ?? "À compléter"}
            </strong>

            <p className="mt-2 text-xs font-semibold text-slate-500">
              expérience professionnelle
            </p>
          </div>
        </div>

        {/* =================================================
            INFORMATIONS MANQUANTES
        ================================================= */}

        {editable &&
          missingFields.length > 0 && (
            <aside className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">
                Profil à finaliser
              </p>

              <h2 className="mt-2 text-lg font-black text-amber-950">
                Certaines informations sont manquantes
              </h2>

              <ul className="mt-4 space-y-2">
                {missingFields.map(
                  (field) => (
                    <li
                      key={field}
                      className="flex gap-3 text-sm font-semibold leading-6 text-amber-900"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500"
                      />

                      <span>{field}</span>
                    </li>
                  ),
                )}
              </ul>

              <Link
                href={editProfileHref}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-900 px-4 text-xs font-black text-white transition hover:bg-amber-800"
              >
                Compléter mon profil
              </Link>
            </aside>
          )}

        {/* =================================================
            CONTENU PRINCIPAL
        ================================================= */}

        <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {/* Présentation */}

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">
                Présentation
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                À propos de l’intervenant
              </h2>

              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
                {description}
              </p>
            </article>

            {/* Services */}

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <BriefcaseIcon className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">
                    Expertise
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Spécialités et services
                  </h2>
                </div>
              </div>

              <p className="mt-5 text-sm font-black text-slate-900">
                {speciality}
              </p>

              <div className="mt-4">
                <TagList
                  items={services}
                  emptyLabel="Les services proposés seront affichés ici."
                />
              </div>
            </article>

            {/* Langues et certifications */}

            <div className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <LanguageIcon className="h-5 w-5" />
                  </div>

                  <h2 className="text-lg font-black text-slate-950">
                    Langues
                  </h2>
                </div>

                <div className="mt-5">
                  <TagList
                    items={languages}
                    emptyLabel="Aucune langue n’a encore été renseignée."
                  />
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <CertificateIcon className="h-5 w-5" />
                  </div>

                  <h2 className="text-lg font-black text-slate-950">
                    Certifications
                  </h2>
                </div>

                <div className="mt-5">
                  <TagList
                    items={certifications}
                    emptyLabel="Aucune certification n’a encore été renseignée."
                  />
                </div>
              </article>
            </div>

            {/* Vidéo */}

            {videoUrl && (
              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-sm">
                <div className="flex items-center justify-between gap-4 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-amber-300">
                      <VideoIcon className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">
                        Présentation vidéo
                      </p>

                      <h2 className="mt-1 text-xl font-black">
                        Découvrez le coach
                      </h2>
                    </div>
                  </div>

                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200">
                    {videoDuration}
                  </span>
                </div>

                <video
                  controls
                  preload="metadata"
                  playsInline
                  className="aspect-video w-full bg-black object-contain"
                >
                  <source src={videoUrl} />

                  Votre navigateur ne peut pas lire cette vidéo.
                </video>
              </article>
            )}
          </div>

          {/* ===============================================
              COLONNE LATÉRALE
          =============================================== */}

          <aside className="space-y-5">
            {/* Statut détaillé */}

            <VerificationStatus
              status={verificationStatus}
              context="profile"
              variant="card"
              rejectionReason={
                rejectionReason
              }
              verifiedAt={verifiedAt}
              updatedAt={updatedAt}
            />

            {/* Informations professionnelles */}

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">
                Profil professionnel
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-950">
                Informations principales
              </h2>

              <div className="mt-5 space-y-3">
                <InformationItem
                  icon={
                    <BriefcaseIcon className="h-5 w-5" />
                  }
                  label="Activité"
                  value={
                    activityName ??
                    "Non renseignée"
                  }
                />

                <InformationItem
                  icon={
                    <CertificateIcon className="h-5 w-5" />
                  }
                  label="SIRET"
                  value={
                    <div>
                      <span>
                        {displayedSiret}
                      </span>

                      {canShowSensitiveDetails &&
                        siret && (
                          <span
                            className={classNames(
                              "mt-1 block text-xs font-bold",
                              validSiret
                                ? "text-emerald-600"
                                : "text-red-600",
                            )}
                          >
                            {validSiret
                              ? "SIRET au format valide"
                              : "Le SIRET doit contenir 14 chiffres"}
                          </span>
                        )}
                    </div>
                  }
                />

                <InformationItem
                  icon={
                    <LocationIcon className="h-5 w-5" />
                  }
                  label="Localisation"
                  value={location}
                />

                <InformationItem
                  icon={
                    <BriefcaseIcon className="h-5 w-5" />
                  }
                  label="Spécialité"
                  value={speciality}
                />
              </div>
            </article>

            {/* Justificatifs */}

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">
                    Vérification
                  </p>

                  <h2 className="mt-2 text-xl font-black text-slate-950">
                    Justificatifs
                  </h2>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <DocumentIcon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <strong className="text-3xl font-black text-slate-950">
                      {documentsCount}
                    </strong>

                    <span className="ml-1 text-sm font-bold text-slate-400">
                      / 5
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-500">
                    document
                    {documentsCount !== 1
                      ? "s"
                      : ""}
                  </span>
                </div>

                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
                  role="progressbar"
                  aria-label="Nombre de justificatifs ajoutés"
                  aria-valuemin={0}
                  aria-valuemax={5}
                  aria-valuenow={Math.min(
                    documentsCount,
                    5,
                  )}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-500 transition-all"
                    style={{
                      width: `${documentsProgress}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
                  Un minimum d’un diplôme ou d’une certification est requis.
                </p>
              </div>

              {editable && (
                <Link
                  href={documentsHref}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-orange-200 bg-orange-50 px-4 text-xs font-black text-orange-700 transition hover:border-orange-300 hover:bg-orange-100"
                >
                  Gérer mes justificatifs
                </Link>
              )}
            </article>
          </aside>
        </div>
      </div>
    </section>
  );
}
