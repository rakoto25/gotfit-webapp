"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearAuth,
  getCurrentUser,
  getPostAuthRoute,
  getToken,
  isCoach,
} from "@/lib/auth";
import { getApiUrl } from "@/lib/api-config";

type UnknownRecord = Record<string, unknown>;

type DashboardUser = {
  id: number | null;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  activityName: string;
  siret: string;
  documentsCount: number;
  verificationStatus: string;
};

type DashboardStats = {
  pendingReservations: number;
  upcomingReservations: number;
  clientsCount: number;
  monthlySessions: number;
};

type DashboardReservation = {
  id: number | string;
  clientName: string;
  clientAvatarUrl: string | null;
  startsAt: string | null;
  status: string;
  type: string;
  participantsCount: number;
  meetingUrl: string | null;
};

type DashboardData = {
  user: DashboardUser;
  stats: DashboardStats;
  upcomingReservations: DashboardReservation[];
  profileCompletion: number;
  alerts: string[];
};

type LoadingState =
  | "loading"
  | "success"
  | "error";

const emptyUser: DashboardUser = {
  id: null,
  name: "Intervenant",
  email: "",
  role: "intervenant",
  avatarUrl: null,
  activityName: "",
  siret: "",
  documentsCount: 0,
  verificationStatus: "incomplete",
};

const initialDashboard: DashboardData = {
  user: emptyUser,
  stats: {
    pendingReservations: 0,
    upcomingReservations: 0,
    clientsCount: 0,
    monthlySessions: 0,
  },
  upcomingReservations: [],
  profileCompletion: 0,
  alerts: [],
};

function isRecord(value: unknown): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getRecord(
  value: unknown,
): UnknownRecord {
  return isRecord(value) ? value : {};
}

function getString(
  value: unknown,
  fallback = "",
): string {
  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    return value.trim();
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return String(value);
  }

  return fallback;
}

function getNumber(
  value: unknown,
  fallback = 0,
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function getFirstString(
  values: unknown[],
  fallback = "",
): string {
  for (const value of values) {
    const result = getString(value);

    if (result) {
      return result;
    }
  }

  return fallback;
}

function getFirstNumber(
  values: unknown[],
  fallback = 0,
): number {
  for (const value of values) {
    if (
      typeof value === "number" ||
      (
        typeof value === "string" &&
        value.trim() !== ""
      )
    ) {
      const result = getNumber(value, Number.NaN);

      if (Number.isFinite(result)) {
        return result;
      }
    }
  }

  return fallback;
}

function getUserRole(
  user: UnknownRecord,
  fallbackUser: UnknownRecord,
): string {
  const directRole = getFirstString([
    user.role,
    user.role_name,
    user.user_type,
    fallbackUser.role,
    fallbackUser.role_name,
    fallbackUser.user_type,
  ]);

  if (directRole) {
    return directRole.toLowerCase();
  }

  const roleCollections = [user.roles, fallbackUser.roles];

  for (const collection of roleCollections) {
    if (!Array.isArray(collection)) continue;

    for (const rawRole of collection) {
      const role = getRecord(rawRole);
      const roleName = getFirstString([
        typeof rawRole === "string" ? rawRole : null,
        role.slug,
        role.name,
      ]);

      if (roleName) return roleName.toLowerCase();
    }
  }

  return "intervenant";
}

function normalizeUser(
  rawUser: unknown,
  fallbackUser: UnknownRecord = {},
): DashboardUser {
  const user = getRecord(rawUser);

  const profile = getRecord(
    user.profile ??
      user.intervenant_profile ??
      user.coach_profile,
  );

  const fallbackProfile = getRecord(
    fallbackUser.profile ??
      fallbackUser.intervenant_profile ??
      fallbackUser.coach_profile,
  );

  const professionalDocuments = getRecord(
    user.professional_documents,
  );

  const fallbackProfessionalDocuments = getRecord(
    fallbackUser.professional_documents,
  );

  return {
    id:
      getFirstNumber(
        [
          user.id,
          fallbackUser.id,
        ],
        0,
      ) || null,

    name: getFirstString(
      [
        user.name,
        user.full_name,
        user.display_name,
        fallbackUser.name,
        fallbackUser.full_name,
        fallbackUser.display_name,
      ],
      "Intervenant",
    ),

    email: getFirstString([
      user.email,
      fallbackUser.email,
    ]),

    role: getUserRole(user, fallbackUser),

    avatarUrl:
      getFirstString([
        user.avatar_url,
        user.avatar,
        user.photo_url,
        user.photo,
        profile.avatar_url,
        fallbackUser.avatar_url,
        fallbackUser.avatar,
        fallbackUser.photo_url,
        fallbackUser.photo,
      ]) || null,

    activityName: getFirstString([
      user.activity_name,
      user.business_name,
      user.nom_activite,
      user.coach_title,
      user.coach_speciality,
      profile.activity_name,
      profile.business_name,
      profile.nom_activite,
      fallbackUser.activity_name,
      fallbackUser.business_name,
      fallbackProfile.activity_name,
      fallbackProfile.business_name,
    ]),

    siret: getFirstString([
      user.siret,
      profile.siret,
      fallbackUser.siret,
      fallbackProfile.siret,
    ]),

    documentsCount: getFirstNumber([
      user.documents_count,
      user.certifications_count,
      profile.documents_count,
      profile.certifications_count,
      professionalDocuments.total,
      fallbackUser.documents_count,
      fallbackProfessionalDocuments.total,
      fallbackProfile.documents_count,
    ]),

    verificationStatus: getFirstString(
      [
        user.verification_status,
        user.validation_status,
        user.account_status,
        user.status,
        profile.verification_status,
        profile.validation_status,
        profile.status,
        fallbackUser.verification_status,
        fallbackProfile.verification_status,
      ],
      "incomplete",
    ).toLowerCase(),
  };
}

function normalizeReservation(
  rawReservation: unknown,
  index: number,
): DashboardReservation {
  const reservation = getRecord(rawReservation);

  const client = getRecord(
    reservation.client ??
      reservation.coachee ??
      reservation.coache,
  );

  const session = getRecord(
    reservation.session ??
      reservation.appointment,
  );

  const annonce = getRecord(reservation.annonce);
  const visioSession = getRecord(
    reservation.visio_session ?? reservation.visioSession,
  );
  const reservationDate = getFirstString([
    reservation.reservation_date,
    reservation.date,
  ]);
  const reservationTime = getFirstString([
    reservation.reservation_time,
    reservation.time,
  ]);
  const combinedStart =
    reservationDate && reservationTime
      ? `${reservationDate.slice(0, 10)}T${reservationTime}`
      : "";

  return {
    id: getFirstString(
      [
        reservation.id,
        session.id,
      ],
      `reservation-${index}`,
    ),

    clientName: getFirstString(
      [
        reservation.client_name,
        reservation.coachee_name,
        reservation.coache_name,
        client.name,
        client.full_name,
        client.display_name,
      ],
      "Coaché",
    ),

    clientAvatarUrl:
      getFirstString([
        reservation.client_avatar_url,
        client.avatar_url,
        client.avatar,
      ]) || null,

    startsAt:
      getFirstString([
        reservation.starts_at,
        reservation.start_at,
        reservation.scheduled_at,
        combinedStart,
        reservationDate,
        session.starts_at,
        session.scheduled_at,
      ]) || null,

    status: getFirstString(
      [
        reservation.status,
        session.status,
      ],
      "pending",
    ).toLowerCase(),

    type: getFirstString(
      [
        reservation.type,
        reservation.session_type,
        reservation.mode,
        annonce.type_prestation,
        session.type,
      ],
      "Séance",
    ),

    participantsCount: Math.max(
      1,
      getFirstNumber(
        [
          reservation.participants_count,
          reservation.participant_count,
          session.participants_count,
        ],
        1,
      ),
    ),

    meetingUrl:
      getFirstString([
        reservation.meeting_url,
        reservation.visio_url,
        reservation.video_url,
        session.meeting_url,
        session.visio_url,
        visioSession.join_url,
        visioSession.server_url,
      ]) || null,
  };
}

function normalizeAlerts(
  rawAlerts: unknown,
): string[] {
  if (!Array.isArray(rawAlerts)) {
    return [];
  }

  return rawAlerts
    .map((alert) => {
      if (typeof alert === "string") {
        return alert.trim();
      }

      const record = getRecord(alert);

      return getFirstString([
        record.message,
        record.text,
        record.label,
      ]);
    })
    .filter(Boolean);
}

function calculateProfileCompletion(
  user: DashboardUser,
): number {
  const fields = [
    Boolean(user.name),
    Boolean(user.email),
    Boolean(user.activityName),
    /^\d{14}$/.test(user.siret),
    user.documentsCount > 0,
  ];

  const completedFields = fields.filter(Boolean).length;

  return Math.round(
    (completedFields / fields.length) * 100,
  );
}

function normalizeDashboard(
  payload: unknown,
  storedUser: UnknownRecord,
): DashboardData {
  const response = getRecord(payload);

  const root = getRecord(
    response.data ?? response,
  );

  const statistics = getRecord(
    root.stats ??
      root.statistics ??
      root.counters,
  );

  const normalizedUser = normalizeUser(
    root.user ??
      root.intervenant ??
      root.coach,
    storedUser,
  );

  const rawReservations =
    root.upcoming_reservations ??
    root.next_reservations ??
    root.reservations ??
    [];

  const reservations = Array.isArray(rawReservations)
    ? rawReservations
    : [];

  const normalizedReservations = reservations.map(
    normalizeReservation,
  );

  const inactiveStatuses = new Set([
    "annule",
    "annulee",
    "cancelled",
    "refuse",
    "refused",
    "realise",
    "termine",
    "completed",
  ]);

  const upcomingReservations = normalizedReservations
    .filter((reservation) => {
      if (inactiveStatuses.has(reservation.status)) return false;
      if (!reservation.startsAt) return true;

      const startsAt = new Date(reservation.startsAt).getTime();
      return Number.isNaN(startsAt) || startsAt >= Date.now();
    })
    .sort((left, right) => {
      const leftTime = left.startsAt ? new Date(left.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
      const rightTime = right.startsAt ? new Date(right.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    })
    .slice(0, 8);

  const pendingReservations = normalizedReservations.filter((reservation) =>
    ["attente", "pending", "en_attente"].includes(reservation.status),
  ).length;

  const clientIds = new Set(
    reservations
      .map((reservation) => {
        const record = getRecord(reservation);
        const client = getRecord(record.client);
        return getFirstString([record.client_id, client.id]);
      })
      .filter(Boolean),
  );

  const now = new Date();
  const monthlySessions = normalizedReservations.filter((reservation) => {
    if (!["realise", "termine", "completed"].includes(reservation.status)) {
      return false;
    }

    if (!reservation.startsAt) return false;
    const date = new Date(reservation.startsAt);
    return (
      !Number.isNaN(date.getTime()) &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  const profileCompletion =
    Math.min(
      100,
      Math.max(
        0,
        getFirstNumber(
          [
            root.profile_completion,
            root.profile_completion_percentage,
            statistics.profile_completion,
          ],
          calculateProfileCompletion(
            normalizedUser,
          ),
        ),
      ),
    );

  const alerts = normalizeAlerts(
    root.alerts ??
      root.notifications ??
      root.warnings,
  );

  if (
    !normalizedUser.activityName &&
    !alerts.includes(
      "Le nom de votre activité doit être renseigné.",
    )
  ) {
    alerts.push(
      "Le nom de votre activité doit être renseigné.",
    );
  }

  if (
    !/^\d{14}$/.test(normalizedUser.siret) &&
    !alerts.includes(
      "Votre numéro SIRET doit contenir 14 chiffres.",
    )
  ) {
    alerts.push(
      "Votre numéro SIRET doit contenir 14 chiffres.",
    );
  }

  if (
    normalizedUser.documentsCount < 1 &&
    !alerts.includes(
      "Ajoutez au moins un diplôme ou une certification.",
    )
  ) {
    alerts.push(
      "Ajoutez au moins un diplôme ou une certification.",
    );
  }

  return {
    user: normalizedUser,

    stats: {
      pendingReservations: getFirstNumber([
        statistics.pending_reservations,
        statistics.reservations_pending,
        root.pending_reservations_count,
      ], pendingReservations),

      upcomingReservations: getFirstNumber(
        [
          statistics.upcoming_reservations,
          statistics.reservations_upcoming,
          root.upcoming_reservations_count,
        ],
        upcomingReservations.length,
      ),

      clientsCount: getFirstNumber([
        statistics.clients_count,
        statistics.coachees_count,
        statistics.coaches_count,
        root.clients_count,
        root.coachees_count,
      ], clientIds.size),

      monthlySessions: getFirstNumber([
        statistics.monthly_sessions,
        statistics.sessions_this_month,
        statistics.completed_sessions_month,
        root.monthly_sessions_count,
      ], monthlySessions),
    },

    upcomingReservations,
    profileCompletion,
    alerts,
  };
}

function formatReservationDate(
  dateValue: string | null,
): string {
  if (!dateValue) {
    return "Date à confirmer";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "IN";
  }

  return parts
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getVerificationLabel(
  status: string,
): string {
  switch (status) {
    case "verified":
    case "approved":
    case "validated":
    case "valide":
      return "Profil validé";

    case "pending":
    case "in_review":
    case "under_review":
      return "Validation en cours";

    case "rejected":
    case "refused":
      return "Profil refusé";

    default:
      return "Profil incomplet";
  }
}

function getVerificationClasses(
  status: string,
): string {
  switch (status) {
    case "verified":
    case "approved":
    case "validated":
    case "valide":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "pending":
    case "in_review":
    case "under_review":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "rejected":
    case "refused":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getReservationStatusLabel(
  status: string,
): string {
  switch (status) {
    case "confirmed":
    case "accepted":
      return "Confirmée";

    case "completed":
    case "finished":
      return "Terminée";

    case "cancelled":
    case "canceled":
      return "Annulée";

    case "rejected":
      return "Refusée";

    default:
      return "En attente";
  }
}

function getReservationStatusClasses(
  status: string,
): string {
  switch (status) {
    case "confirmed":
    case "accepted":
      return "bg-emerald-50 text-emerald-700";

    case "completed":
    case "finished":
      return "bg-blue-50 text-blue-700";

    case "cancelled":
    case "canceled":
    case "rejected":
      return "bg-red-50 text-red-700";

    default:
      return "bg-amber-50 text-amber-700";
  }
}

type StatCardProps = {
  label: string;
  value: number;
  description: string;
};

function StatCard({
  label,
  value,
  description,
}: StatCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-44 rounded-[2rem] bg-slate-200" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <div
              key={index}
              className="h-40 rounded-3xl bg-slate-200"
            />
          ),
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="h-96 rounded-3xl bg-slate-200" />
        <div className="h-96 rounded-3xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function IntervenantDashboardPage() {
  const router = useRouter();

  const [dashboard, setDashboard] =
    useState<DashboardData>(
      initialDashboard,
    );

  const [status, setStatus] =
    useState<LoadingState>("loading");

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadDashboard = useCallback(
    async (signal?: AbortSignal) => {
      setStatus("loading");
      setErrorMessage("");

      const token = getToken();
      const currentUser = getCurrentUser();
      const storedUser = getRecord(currentUser);

      if (!token || !currentUser) {
        router.replace(
          "/auth/login?redirect=/intervenant/dashboard",
        );

        return;
      }

      if (!isCoach(currentUser)) {
        router.replace(
          getPostAuthRoute(currentUser),
        );

        return;
      }

      try {
        const [profileResponse, reservationsResponse] = await Promise.all([
          fetch(getApiUrl("profile"), {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
            signal,
          }),
          fetch(getApiUrl("reservation/intervenant"), {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
            signal,
          }),
        ]);

        if (
          profileResponse.status === 401 ||
          reservationsResponse.status === 401
        ) {
          clearAuth();

          router.replace(
            "/auth/login?redirect=/intervenant/dashboard",
          );

          return;
        }

        const [profilePayload, reservationsPayload] = await Promise.all([
          profileResponse.json().catch(() => ({})),
          reservationsResponse.json().catch(() => ({})),
        ]);

        if (!profileResponse.ok || !reservationsResponse.ok) {
          const responseData = getRecord(
            !profileResponse.ok ? profilePayload : reservationsPayload,
          );

          throw new Error(
            getFirstString(
              [
                responseData.message,
                responseData.error,
              ],
              "Impossible de charger le tableau de bord.",
            ),
          );
        }

        const profileData = getRecord(profilePayload);
        const reservationsData = getRecord(reservationsPayload);
        const payload = {
          user:
            profileData.user ??
            getRecord(profileData.data).user ??
            profileData.data ??
            currentUser,
          reservations:
            reservationsData.reservations ??
            reservationsData.data ??
            [],
        };

        const normalizedDashboard =
          normalizeDashboard(
            payload,
            storedUser,
          );

        if (
          normalizedDashboard.user.role &&
          ![
            "intervenant",
            "coach",
          ].includes(
            normalizedDashboard.user.role,
          )
        ) {
          router.replace(
            getPostAuthRoute(currentUser),
          );

          return;
        }

        setDashboard(normalizedDashboard);
        setStatus("success");
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Une erreur inattendue est survenue.",
        );

        setStatus("error");
      }
    },
    [router],
  );

  useEffect(() => {
    const controller = new AbortController();
    const initialLoad = window.setTimeout(() => {
      void loadDashboard(controller.signal);
    }, 0);

    const handleAuthChange = () => {
      void loadDashboard();
    };

    window.addEventListener(
      "gotfit:auth",
      handleAuthChange,
    );

    window.addEventListener(
      "storage",
      handleAuthChange,
    );

    return () => {
      window.clearTimeout(initialLoad);
      controller.abort();

      window.removeEventListener(
        "gotfit:auth",
        handleAuthChange,
      );

      window.removeEventListener(
        "storage",
        handleAuthChange,
      );
    };
  }, [loadDashboard]);

  const firstName = useMemo(() => {
    return (
      dashboard.user.name
        .trim()
        .split(/\s+/)[0] || "Intervenant"
    );
  }, [dashboard.user.name]);

  const verificationLabel =
    getVerificationLabel(
      dashboard.user.verificationStatus,
    );

  const verificationClasses =
    getVerificationClasses(
      dashboard.user.verificationStatus,
    );

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        {status === "loading" && (
          <DashboardSkeleton />
        )}

        {status === "error" && (
          <section className="mx-auto max-w-2xl rounded-[2rem] border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl font-black text-red-600">
              !
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-950">
              Tableau de bord indisponible
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => {
                void loadDashboard();
              }}
              className="mt-6 min-h-12 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Réessayer
            </button>
          </section>
        )}

        {status === "success" && (
          <div className="space-y-8">
            <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-8 lg:p-10">
              <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
              <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />

              <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-5">
                  {dashboard.user.avatarUrl ? (
                    <img
                      src={
                        dashboard.user.avatarUrl
                      }
                      alt={
                        dashboard.user.name
                      }
                      className="h-16 w-16 rounded-2xl border border-white/20 object-cover sm:h-20 sm:w-20"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-xl font-black text-slate-950 sm:h-20 sm:w-20 sm:text-2xl">
                      {getInitials(
                        dashboard.user.name,
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-semibold text-slate-300">
                      Espace intervenant
                    </p>

                    <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                      Bonjour {firstName}
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                      Consultez vos réservations,
                      suivez vos coachés et préparez
                      vos prochaines séances.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 sm:flex-row lg:max-w-sm lg:flex-row lg:flex-wrap lg:justify-end">
                  <span
                    className={`inline-flex rounded-full border px-4 py-2 text-xs font-black ${verificationClasses}`}
                  >
                    {verificationLabel}
                  </span>

                  <Link
                    href="/intervenant/annonces/nouvelle"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-50 hover:shadow-lg"
                  >
                    Créer une annonce
                  </Link>

                  <Link
                    href="/reservations"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-amber-300 to-orange-500 px-5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Voir mes réservations
                  </Link>
                </div>
              </div>
            </section>

            <section
              aria-label="Statistiques"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <StatCard
                label="Demandes en attente"
                value={
                  dashboard.stats
                    .pendingReservations
                }
                description="Réservations qui attendent votre réponse."
              />

              <StatCard
                label="Prochaines séances"
                value={
                  dashboard.stats
                    .upcomingReservations
                }
                description="Séances confirmées ou programmées."
              />

              <StatCard
                label="Coachés"
                value={
                  dashboard.stats.clientsCount
                }
                description="Personnes actuellement suivies."
              />

              <StatCard
                label="Séances ce mois"
                value={
                  dashboard.stats
                    .monthlySessions
                }
                description="Séances réalisées pendant le mois."
              />
            </section>

            <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <header className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
                      Planning
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-slate-950">
                      Prochaines réservations
                    </h2>
                  </div>

                  <Link
                    href="/reservations"
                    className="text-sm font-black text-orange-600 hover:text-orange-700"
                  >
                    Tout consulter →
                  </Link>
                </header>

                {dashboard
                  .upcomingReservations
                  .length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl font-black text-slate-500">
                      0
                    </div>

                    <h3 className="mt-4 text-lg font-black text-slate-950">
                      Aucune séance programmée
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Les prochaines réservations
                      apparaîtront ici dès qu’elles
                      seront disponibles.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {dashboard.upcomingReservations.map(
                      (reservation) => (
                        <div
                          key={reservation.id}
                          className="flex flex-col gap-5 p-6 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            {reservation.clientAvatarUrl ? (
                              <img
                                src={
                                  reservation.clientAvatarUrl
                                }
                                alt={
                                  reservation.clientName
                                }
                                className="h-12 w-12 shrink-0 rounded-2xl object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-sm font-black text-orange-600">
                                {getInitials(
                                  reservation.clientName,
                                )}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate font-black text-slate-950">
                                  {
                                    reservation.clientName
                                  }
                                </h3>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-black ${getReservationStatusClasses(
                                    reservation.status,
                                  )}`}
                                >
                                  {getReservationStatusLabel(
                                    reservation.status,
                                  )}
                                </span>
                              </div>

                              <p className="mt-1 text-sm text-slate-500">
                                {formatReservationDate(
                                  reservation.startsAt,
                                )}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                {reservation.type}
                                {" · "}
                                {
                                  reservation.participantsCount
                                }
                                /3 participant
                                {reservation.participantsCount >
                                1
                                  ? "s"
                                  : ""}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 gap-2">
                            {reservation.meetingUrl && (
                              <a
                                href={
                                  reservation.meetingUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-slate-800"
                              >
                                Rejoindre la visio
                              </a>
                            )}

                            <Link
                              href="/reservations"
                              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                            >
                              Détails
                            </Link>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </article>

              <aside className="space-y-6">
                <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
                        Profil professionnel
                      </p>

                      <h2 className="mt-2 text-xl font-black text-slate-950">
                        Complétion du profil
                      </h2>
                    </div>

                    <strong className="text-2xl font-black text-slate-950">
                      {
                        dashboard.profileCompletion
                      }
                      %
                    </strong>
                  </div>

                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-500 transition-all duration-500"
                      style={{
                        width: `${dashboard.profileCompletion}%`,
                      }}
                    />
                  </div>

                  <dl className="mt-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-sm font-semibold text-slate-500">
                        Activité
                      </dt>

                      <dd className="max-w-[60%] text-right text-sm font-black text-slate-950">
                        {dashboard.user
                          .activityName ||
                          "Non renseignée"}
                      </dd>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-sm font-semibold text-slate-500">
                        SIRET
                      </dt>

                      <dd className="max-w-[60%] break-all text-right text-sm font-black text-slate-950">
                        {dashboard.user.siret ||
                          "Non renseigné"}
                      </dd>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-sm font-semibold text-slate-500">
                        Justificatifs
                      </dt>

                      <dd className="text-right text-sm font-black text-slate-950">
                        {
                          dashboard.user
                            .documentsCount
                        }
                        /5
                      </dd>
                    </div>
                  </dl>
                </article>

                {dashboard.alerts.length > 0 && (
                  <article className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                      Actions nécessaires
                    </p>

                    <h2 className="mt-2 text-xl font-black text-amber-950">
                      Finalisez votre profil
                    </h2>

                    <ul className="mt-4 space-y-3">
                      {dashboard.alerts.map(
                        (alert, index) => (
                          <li
                            key={`${alert}-${index}`}
                            className="flex gap-3 text-sm font-semibold leading-6 text-amber-900"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500"
                            />

                            <span>{alert}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </article>
                )}

                <article className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                    Visioconférence V1
                  </p>

                  <h2 className="mt-2 text-xl font-black">
                    Séances en petit groupe
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Une visioconférence peut accueillir
                    au maximum un intervenant et deux
                    coachés, soit trois participants.
                  </p>
                </article>
              </aside>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
