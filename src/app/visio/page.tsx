"use client";

import Link from "next/link";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  Video,
  X,
} from "lucide-react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

import {
  getCurrentUser,
  getToken,
  hasRole,
} from "@/lib/auth";

import {
  formatDate,
  formatMoney,
} from "@/lib/marketplace";

import {
  createVisioSession,
  fetchVisioSessions,
  getVisioStatusLabel,
  type CreateVisioSessionPayload,
  type VisioSession,
} from "@/lib/visio";

/* =========================================================
   CONFIGURATION VISIO V1
========================================================= */

/**
 * Capacité maximale :
 *
 * - 1 intervenant organisateur ;
 * - 2 coachés maximum ;
 * - 3 personnes au total.
 *
 * Les champs Laravel `min_participants` et
 * `max_participants` représentent ici le nombre
 * de coachés, sans compter l’intervenant.
 */
const VISIO_MAX_COACHEES = 2;
const VISIO_MIN_COACHEES = 1;

const DEFAULT_DURATION_MINUTES = 60;
const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 360;

const DEFAULT_PRICE = 25;
const DEFAULT_CURRENCY = "EUR";

/**
 * Formulaire statique utilisé pendant le rendu initial.
 *
 * Il évite une différence d’hydratation entre le serveur
 * et le navigateur causée par `Date.now()`.
 */
const EMPTY_FORM: CreateVisioSessionPayload = {
  title: "",
  description: "",
  start_at: "",
  duration_minutes: DEFAULT_DURATION_MINUTES,
  min_participants: VISIO_MIN_COACHEES,
  max_participants: VISIO_MAX_COACHEES,
  price: DEFAULT_PRICE,
  currency: DEFAULT_CURRENCY,
};

/* =========================================================
   OUTILS
========================================================= */

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error instanceof Error &&
    error.message.trim() !== ""
  ) {
    return error.message;
  }

  return fallback;
}

function normalizeValue(
  value: unknown,
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  );
}

function clampInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback = minimum,
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return clamp(
    Math.floor(parsed),
    minimum,
    maximum,
  );
}

function toDateTimeLocal(
  value: Date,
): string {
  const timezoneOffset =
    value.getTimezoneOffset();

  const localDate = new Date(
    value.getTime() -
      timezoneOffset * 60 * 1000,
  );

  return localDate
    .toISOString()
    .slice(0, 16);
}

function createInitialForm():
  CreateVisioSessionPayload {
  return {
    title: "",
    description: "",

    start_at: toDateTimeLocal(
      new Date(
        Date.now() +
          24 * 60 * 60 * 1000,
      ),
    ),

    duration_minutes:
      DEFAULT_DURATION_MINUTES,

    min_participants:
      VISIO_MIN_COACHEES,

    max_participants:
      VISIO_MAX_COACHEES,

    price: DEFAULT_PRICE,

    currency:
      DEFAULT_CURRENCY,
  };
}

function getMinimumStartDate(): string {
  return toDateTimeLocal(
    new Date(
      Date.now() +
        15 * 60 * 1000,
    ),
  );
}

function getStatusClass(
  status: VisioSession["status"],
): string {
  const normalized =
    normalizeValue(status);

  if (
    [
      "live",
      "started",
      "in_progress",
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
      "confirmed",
      "scheduled",
      "reserved",
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
      "ended",
      "completed",
      "finished",
    ].includes(normalized)
  ) {
    return [
      "border-slate-200",
      "bg-slate-100",
      "text-slate-600",
    ].join(" ");
  }

  if (
    [
      "cancelled",
      "canceled",
      "rejected",
    ].includes(normalized)
  ) {
    return [
      "border-red-200",
      "bg-red-50",
      "text-red-700",
    ].join(" ");
  }

  if (
    [
      "open",
      "available",
    ].includes(normalized)
  ) {
    return [
      "border-blue-200",
      "bg-blue-50",
      "text-blue-700",
    ].join(" ");
  }

  return [
    "border-amber-200",
    "bg-amber-50",
    "text-amber-700",
  ].join(" ");
}

function isCoachParticipantRole(
  role: unknown,
): boolean {
  return [
    "coach",
    "intervenant",
    "organizer",
    "organisateur",
  ].includes(
    normalizeValue(role),
  );
}

function isPaidPaymentStatus(
  status: unknown,
): boolean {
  return [
    "paid",
    "completed",
    "approved",
    "confirmed",
  ].includes(
    normalizeValue(status),
  );
}

function getPaidCoacheesCount(
  session: VisioSession,
): number {
  const directCount = Number(
    session.paid_participants_count,
  );

  if (Number.isFinite(directCount)) {
    return clamp(
      Math.floor(directCount),
      0,
      VISIO_MAX_COACHEES,
    );
  }

  const participants =
    Array.isArray(session.participants)
      ? session.participants
      : [];

  const calculatedCount =
    participants.filter(
      (participant) =>
        !isCoachParticipantRole(
          participant.role,
        ) &&
        isPaidPaymentStatus(
          participant.payment_status,
        ),
    ).length;

  return clamp(
    calculatedCount,
    0,
    VISIO_MAX_COACHEES,
  );
}

function getSessionStatusCount(
  sessions: VisioSession[],
  acceptedStatuses: string[],
): number {
  return sessions.filter((session) =>
    acceptedStatuses.includes(
      normalizeValue(session.status),
    ),
  ).length;
}

function normalizeCurrency(
  value: unknown,
): string {
  return String(
    value ?? DEFAULT_CURRENCY,
  )
    .replace(/[^a-zA-Z]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, 3);
}

function validateForm(
  form: CreateVisioSessionPayload,
): string | null {
  const title =
    String(form.title ?? "").trim();

  if (!title) {
    return "Le titre de la séance est obligatoire.";
  }

  if (title.length < 3) {
    return "Le titre doit contenir au moins 3 caractères.";
  }

  if (title.length > 150) {
    return "Le titre ne doit pas dépasser 150 caractères.";
  }

  const description =
    String(
      form.description ?? "",
    ).trim();

  if (description.length > 2000) {
    return "La description ne doit pas dépasser 2 000 caractères.";
  }

  const startAt =
    String(
      form.start_at ?? "",
    ).trim();

  if (!startAt) {
    return "La date et l’heure de la séance sont obligatoires.";
  }

  const startDate =
    new Date(startAt);

  if (
    Number.isNaN(
      startDate.getTime(),
    )
  ) {
    return "La date de la séance n’est pas valide.";
  }

  if (
    startDate.getTime() <=
    Date.now()
  ) {
    return "La date de la séance doit être située dans le futur.";
  }

  const duration = Number(
    form.duration_minutes,
  );

  if (
    !Number.isFinite(duration) ||
    duration <
      MIN_DURATION_MINUTES ||
    duration >
      MAX_DURATION_MINUTES
  ) {
    return `La durée doit être comprise entre ${MIN_DURATION_MINUTES} et ${MAX_DURATION_MINUTES} minutes.`;
  }

  const minimumParticipants =
    Number(
      form.min_participants,
    );

  if (
    !Number.isFinite(
      minimumParticipants,
    ) ||
    minimumParticipants <
      VISIO_MIN_COACHEES ||
    minimumParticipants >
      VISIO_MAX_COACHEES
  ) {
    return "Le nombre minimum de coachés doit être compris entre 1 et 2.";
  }

  const price =
    Number(form.price);

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    return "Le prix de la séance ne peut pas être négatif.";
  }

  const currency =
    normalizeCurrency(
      form.currency,
    );

  if (
    !/^[A-Z]{3}$/.test(currency)
  ) {
    return "La devise doit contenir exactement 3 lettres, par exemple EUR.";
  }

  return null;
}

/* =========================================================
   PAGE
========================================================= */

export default function VisioPage() {
  const [sessions, setSessions] =
    useState<VisioSession[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [
    showCreate,
    setShowCreate,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [form, setForm] =
    useState<CreateVisioSessionPayload>(
      EMPTY_FORM,
    );

  const [
    minimumStartDate,
    setMinimumStartDate,
  ] = useState("");

  const [user, setUser] =
    useState<
      ReturnType<
        typeof getCurrentUser
      >
    >(null);

  const [authToken, setAuthToken] =
    useState<string | null>(null);

  const [authReady, setAuthReady] =
    useState(false);

  /* =======================================================
     AUTHENTIFICATION
  ======================================================= */

  useEffect(() => {
    function synchronizeAuthentication(): void {
      setUser(
        getCurrentUser(),
      );

      setAuthToken(
        getToken(),
      );

      setAuthReady(true);
    }

    synchronizeAuthentication();

    setForm(
      createInitialForm(),
    );

    setMinimumStartDate(
      getMinimumStartDate(),
    );

    window.addEventListener(
      "gotfit:auth",
      synchronizeAuthentication,
    );

    window.addEventListener(
      "storage",
      synchronizeAuthentication,
    );

    return () => {
      window.removeEventListener(
        "gotfit:auth",
        synchronizeAuthentication,
      );

      window.removeEventListener(
        "storage",
        synchronizeAuthentication,
      );
    };
  }, []);

  const isAuthenticated =
    authReady &&
    Boolean(authToken);

  const isCoach =
    authReady &&
    Boolean(user) &&
    (
      hasRole(
        user,
        "intervenant",
      ) ||
      hasRole(
        user,
        "coach",
      )
    );

  /* =======================================================
     STATISTIQUES
  ======================================================= */

  const stats = useMemo(() => {
    return {
      total: sessions.length,

      open:
        getSessionStatusCount(
          sessions,
          [
            "open",
            "available",
          ],
        ),

      confirmed:
        getSessionStatusCount(
          sessions,
          [
            "confirmed",
            "scheduled",
            "reserved",
          ],
        ),

      live:
        getSessionStatusCount(
          sessions,
          [
            "live",
            "started",
            "in_progress",
          ],
        ),
    };
  }, [sessions]);

  /* =======================================================
     CHARGEMENT
  ======================================================= */

  const loadSessions =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await fetchVisioSessions(
            Boolean(getToken()),
          );

        setSessions(
          Array.isArray(result)
            ? result
            : [],
        );
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Impossible de charger les séances visio.",
          ),
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  /* =======================================================
     FORMULAIRE
  ======================================================= */

  function openCreateForm(): void {
    setError("");
    setSuccess("");

    setMinimumStartDate(
      getMinimumStartDate(),
    );

    setForm(
      createInitialForm(),
    );

    setShowCreate(true);
  }

  function closeCreateForm(): void {
    if (creating) {
      return;
    }

    setShowCreate(false);
    setError("");

    setForm(
      createInitialForm(),
    );
  }

  async function handleCreate(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const token =
      getToken();

    if (!token) {
      setError(
        "Veuillez vous connecter avec un compte intervenant pour créer une visio.",
      );

      return;
    }

    if (!isCoach) {
      setError(
        "La création de séances visio est réservée aux coachs et intervenants.",
      );

      return;
    }

    const validationMessage =
      validateForm(form);

    if (validationMessage) {
      setError(validationMessage);

      return;
    }

    const normalizedMinimum =
      clampInteger(
        form.min_participants,
        VISIO_MIN_COACHEES,
        VISIO_MAX_COACHEES,
        VISIO_MIN_COACHEES,
      );

    const normalizedDuration =
      clampInteger(
        form.duration_minutes,
        MIN_DURATION_MINUTES,
        MAX_DURATION_MINUTES,
        DEFAULT_DURATION_MINUTES,
      );

    const parsedPrice =
      Number(form.price);

    const normalizedPrice =
      Number.isFinite(parsedPrice)
        ? Math.max(
            0,
            parsedPrice,
          )
        : 0;

    const normalizedCurrency =
      normalizeCurrency(
        form.currency,
      );

    const payload:
      CreateVisioSessionPayload = {
      ...form,

      title: String(
        form.title,
      ).trim(),

      description: String(
        form.description ?? "",
      ).trim(),

      start_at: String(
        form.start_at,
      ).trim(),

      duration_minutes:
        normalizedDuration,

      min_participants:
        normalizedMinimum,

      /**
       * Valeur non modifiable côté frontend.
       *
       * L’API Laravel doit également refuser
       * toute valeur supérieure à 2.
       */
      max_participants:
        VISIO_MAX_COACHEES,

      price:
        normalizedPrice,

      currency:
        normalizedCurrency,
    };

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const createdSession =
        await createVisioSession(
          payload,
        );

      setSessions(
        (currentSessions) => {
          const existingSession =
            currentSessions.some(
              (session) =>
                String(session.id) ===
                String(
                  createdSession.id,
                ),
            );

          if (existingSession) {
            return currentSessions.map(
              (session) =>
                String(session.id) ===
                String(
                  createdSession.id,
                )
                  ? createdSession
                  : session,
            );
          }

          return [
            createdSession,
            ...currentSessions,
          ];
        },
      );

      setSuccess(
        "La séance visio a été créée avec succès.",
      );

      setShowCreate(false);

      setForm(
        createInitialForm(),
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Impossible de créer la séance visio.",
        ),
      );
    } finally {
      setCreating(false);
    }
  }

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FFF7ED] px-4 pb-16 pt-36 text-slate-950">
        <div className="mx-auto max-w-7xl">
          {/* =================================================
              EN-TÊTE
          ================================================= */}

          <section className="mb-8 grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-700 shadow-sm">
                <Video size={16} />

                Visio V1 · 3 personnes max
              </span>

              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
                Séances visio avec votre coach.
              </h1>

              <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-600">
                Créez, réservez et rejoignez
                des séances en ligne. Chaque
                visio accueille un intervenant
                et jusqu’à deux coachés, soit
                trois participants maximum.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-2">
              <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
                <Video
                  className="mb-3 text-orange-700"
                  size={22}
                />

                <strong className="block text-2xl font-black">
                  {stats.total}
                </strong>

                <span className="text-xs font-bold text-slate-500">
                  Séances
                </span>
              </div>

              <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
                <ShieldCheck
                  className="mb-3 text-orange-700"
                  size={22}
                />

                <strong className="block text-2xl font-black">
                  {stats.confirmed}
                </strong>

                <span className="text-xs font-bold text-slate-500">
                  Confirmées
                </span>
              </div>

              <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
                <Users
                  className="mb-3 text-orange-700"
                  size={22}
                />

                <strong className="block text-2xl font-black">
                  {stats.open}
                </strong>

                <span className="text-xs font-bold text-slate-500">
                  Ouvertes
                </span>
              </div>

              <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
                <CheckCircle2
                  className="mb-3 text-orange-700"
                  size={22}
                />

                <strong className="block text-2xl font-black">
                  {stats.live}
                </strong>

                <span className="text-xs font-bold text-slate-500">
                  En direct
                </span>
              </div>
            </div>
          </section>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="mb-6 flex flex-wrap gap-3">
            {isCoach && (
              <button
                type="button"
                onClick={() => {
                  if (showCreate) {
                    closeCreateForm();
                  } else {
                    openCreateForm();
                  }
                }}
                disabled={creating}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60"
              >
                {showCreate ? (
                  <X size={17} />
                ) : (
                  <Plus size={17} />
                )}

                {showCreate
                  ? "Fermer le formulaire"
                  : "Créer une visio"}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                void loadSessions();
              }}
              disabled={loading}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-black text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-50 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              {loading
                ? "Actualisation..."
                : "Actualiser"}
            </button>

            {authReady &&
              !isAuthenticated && (
                <Link
                  href="/auth/login?redirect=/visio"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                >
                  Se connecter
                </Link>
              )}
          </div>

          {/* =================================================
              MESSAGES
          ================================================= */}

          <div
            aria-live="polite"
            aria-atomic="true"
          >
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-[2rem] border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700"
              >
                <X
                  className="mt-0.5 shrink-0"
                  size={18}
                />

                <span>{error}</span>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-5 flex items-start gap-3 rounded-[2rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700"
              >
                <CheckCircle2
                  className="mt-0.5 shrink-0"
                  size={18}
                />

                <span>{success}</span>
              </div>
            )}
          </div>

          {/* =================================================
              FORMULAIRE DE CRÉATION
          ================================================= */}

          {showCreate && isCoach && (
            <form
              onSubmit={handleCreate}
              className="mb-8 rounded-[2rem] border border-orange-100 bg-white p-5 shadow-sm md:p-7"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                    Espace intervenant
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Nouvelle séance visio
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                    Une séance peut accueillir
                    un intervenant et deux
                    coachés au maximum.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeCreateForm
                  }
                  disabled={creating}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
                  aria-label="Fermer le formulaire"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Capacité fixe */}

              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                  <Video
                    size={20}
                    className="text-orange-700"
                  />

                  <strong className="mt-3 block text-lg font-black text-slate-950">
                    1 intervenant
                  </strong>

                  <span className="mt-1 block text-xs font-semibold text-slate-500">
                    Organisateur
                  </span>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                  <Users
                    size={20}
                    className="text-orange-700"
                  />

                  <strong className="mt-3 block text-lg font-black text-slate-950">
                    2 coachés max.
                  </strong>

                  <span className="mt-1 block text-xs font-semibold text-slate-500">
                    Participants clients
                  </span>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                  <ShieldCheck
                    size={20}
                    className="text-orange-700"
                  />

                  <strong className="mt-3 block text-lg font-black text-slate-950">
                    3 personnes
                  </strong>

                  <span className="mt-1 block text-xs font-semibold text-slate-500">
                    Capacité totale
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-black text-slate-700 md:col-span-2">
                  Titre de la séance

                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => {
                      setForm(
                        (current) => ({
                          ...current,
                          title:
                            event.target
                              .value,
                        }),
                      );
                    }}
                    className="gotfit-input"
                    placeholder="Exemple : Coaching remise en forme"
                    minLength={3}
                    maxLength={150}
                    autoComplete="off"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-black text-slate-700 md:col-span-2">
                  Description

                  <textarea
                    value={
                      form.description ?? ""
                    }
                    onChange={(event) => {
                      setForm(
                        (current) => ({
                          ...current,
                          description:
                            event.target
                              .value,
                        }),
                      );
                    }}
                    className="gotfit-input min-h-28 resize-y"
                    placeholder="Décrivez le contenu et les objectifs de la séance..."
                    maxLength={2000}
                  />
                </label>

                <label className="grid gap-2 text-sm font-black text-slate-700">
                  Date et heure

                  <input
                    type="datetime-local"
                    value={form.start_at}
                    min={
                      minimumStartDate ||
                      undefined
                    }
                    onChange={(event) => {
                      setForm(
                        (current) => ({
                          ...current,
                          start_at:
                            event.target
                              .value,
                        }),
                      );
                    }}
                    className="gotfit-input"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-black text-slate-700">
                  Durée en minutes

                  <input
                    type="number"
                    min={
                      MIN_DURATION_MINUTES
                    }
                    max={
                      MAX_DURATION_MINUTES
                    }
                    step={5}
                    value={
                      form.duration_minutes
                    }
                    onChange={(event) => {
                      setForm(
                        (current) => ({
                          ...current,
                          duration_minutes:
                            event.target
                              .value === ""
                              ? DEFAULT_DURATION_MINUTES
                              : Number(
                                  event
                                    .target
                                    .value,
                                ),
                        }),
                      );
                    }}
                    className="gotfit-input"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-black text-slate-700">
                  Minimum de coachés

                  <select
                    value={
                      form.min_participants
                    }
                    onChange={(event) => {
                      setForm(
                        (current) => ({
                          ...current,

                          min_participants:
                            Number(
                              event.target
                                .value,
                            ),

                          max_participants:
                            VISIO_MAX_COACHEES,
                        }),
                      );
                    }}
                    className="gotfit-input"
                    required
                  >
                    <option value={1}>
                      1 coaché
                    </option>

                    <option value={2}>
                      2 coachés
                    </option>
                  </select>
                </label>

                <div className="grid gap-2 text-sm font-black text-slate-700">
                  Maximum de coachés

                  <div className="gotfit-input flex min-h-12 items-center justify-between bg-slate-50">
                    <span>
                      2 coachés maximum
                    </span>

                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                      Fixe V1
                    </span>
                  </div>
                </div>

                <label className="grid gap-2 text-sm font-black text-slate-700">
                  Prix par coaché

                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price}
                    onChange={(event) => {
                      setForm(
                        (current) => ({
                          ...current,

                          price:
                            event.target
                              .value === ""
                              ? 0
                              : Number(
                                  event
                                    .target
                                    .value,
                                ),
                        }),
                      );
                    }}
                    className="gotfit-input"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-black text-slate-700">
                  Devise

                  <input
                    type="text"
                    value={form.currency}
                    maxLength={3}
                    minLength={3}
                    pattern="[A-Za-z]{3}"
                    onChange={(event) => {
                      setForm(
                        (current) => ({
                          ...current,

                          currency:
                            normalizeCurrency(
                              event.target
                                .value,
                            ),
                        }),
                      );
                    }}
                    className="gotfit-input uppercase"
                    placeholder="EUR"
                    autoComplete="off"
                    required
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {creating ? (
                    <Loader2
                      className="animate-spin"
                      size={17}
                    />
                  ) : (
                    <Plus size={17} />
                  )}

                  {creating
                    ? "Création en cours..."
                    : "Créer la séance"}
                </button>

                <button
                  type="button"
                  onClick={
                    closeCreateForm
                  }
                  disabled={creating}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}

          {/* =================================================
              LISTE DES SÉANCES
          ================================================= */}

          {loading ? (
            <div className="flex items-center justify-center rounded-[2rem] bg-white py-16 text-sm font-black text-orange-700 shadow-sm">
              <Loader2
                className="mr-3 animate-spin"
                size={20}
              />

              Chargement des séances visio...
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm">
              <AlertTriangle
                className="mx-auto mb-4 text-orange-600"
                size={34}
              />

              <h2 className="text-2xl font-black">
                Aucune séance visio
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-slate-500">
                Les séances en ligne
                apparaîtront ici dès qu’un
                intervenant aura créé une
                session.
              </p>

              {isCoach && (
                <button
                  type="button"
                  onClick={
                    openCreateForm
                  }
                  className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-700"
                >
                  <Plus size={17} />

                  Créer la première séance
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {sessions.map(
                (session) => {
                  const paidCoachees =
                    getPaidCoacheesCount(
                      session,
                    );

                  return (
                    <Link
                      key={String(
                        session.id,
                      )}
                      href={`/visio/${session.id}`}
                      className="group rounded-[2rem] border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                          <Video
                            size={24}
                          />
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                            session.status,
                          )}`}
                        >
                          {getVisioStatusLabel(
                            session.status,
                          )}
                        </span>
                      </div>

                      <h2 className="line-clamp-2 text-xl font-black">
                        {session.title}
                      </h2>

                      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">
                        {session.description ||
                          "Séance visio Gotfit"}
                      </p>

                      <div className="mt-5 grid gap-3">
                        <div className="flex items-center gap-2 rounded-2xl bg-orange-50 p-4 text-sm font-bold text-slate-600">
                          <Calendar
                            size={17}
                          />

                          {formatDate(
                            session.start_at,
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <Clock
                              className="mb-2 text-orange-700"
                              size={17}
                            />

                            <strong className="text-sm font-black">
                              {
                                session.duration_minutes
                              }{" "}
                              min
                            </strong>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <Users
                              className="mb-2 text-orange-700"
                              size={17}
                            />

                            <strong className="text-sm font-black">
                              {paidCoachees}/
                              {
                                VISIO_MAX_COACHEES
                              }{" "}
                              coachés
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold text-slate-500">
                          Capacité totale
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-950">
                          1 intervenant + 2
                          coachés maximum
                        </p>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-3">
                        <span className="text-lg font-black text-slate-950">
                          {formatMoney(
                            session.price,
                            session.currency ||
                              DEFAULT_CURRENCY,
                          )}
                        </span>

                        <span className="inline-flex items-center gap-2 text-sm font-black text-orange-700">
                          Ouvrir

                          <ArrowRight
                            size={17}
                            className="transition group-hover:translate-x-1"
                          />
                        </span>
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}