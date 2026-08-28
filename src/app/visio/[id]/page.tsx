"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";

import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  ShieldCheck,
  Users,
  Video,
  X,
} from "lucide-react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

import VisioControls, {
  type VisioControlAction,
} from "@/components/visio/VisioControls";

import VisioParticipants from "@/components/visio/VisioParticipants";

import {
  getCurrentUser,
  getToken,
  hasRole,
} from "@/lib/auth";

import {
  formatDate,
} from "@/lib/marketplace";

import {
  endVisioSession,
  fetchVisioSession,
  getVisioStatusLabel,
  joinVisioSession,
  leaveVisioSession,
  reserveVisioSession,
  startVisioSession,
  VISIO_MAX_COACHEES,
  VISIO_MAX_TOTAL_PARTICIPANTS,
  type VisioJoinPayload,
  type VisioSession,
} from "@/lib/visio";

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

const AUTHORIZED_PARTICIPANT_STATUSES = [
  "invited",
  "reserved",
  "confirmed",
  "accepted",
  "approved",
  "joined",
  "left",
  "present",
  "paid",
];

const BLOCKED_PARTICIPANT_STATUSES = [
  "cancelled",
  "canceled",
  "rejected",
  "refused",
  "no_show",
  "blocked",
];

const STARTABLE_SESSION_STATUSES = [
  "open",
  "confirmed",
  "scheduled",
  "reserved",
];

const LIVE_SESSION_STATUSES = [
  "live",
  "started",
  "in_progress",
];

const CLOSED_SESSION_STATUSES = [
  "ended",
  "completed",
  "finished",
  "cancelled",
  "canceled",
];

/* =========================================================
   OUTILS
========================================================= */

function messageOf(
  error: unknown,
  fallback: string,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
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

  return Math.min(
    maximum,
    Math.max(
      minimum,
      Math.floor(parsed),
    ),
  );
}

function statusClass(
  status?: string | null,
): string {
  const normalized =
    normalizeValue(status);

  if (
    [
      "live",
      "started",
      "in_progress",
      "paid",
      "succeeded",
      "joined",
      "confirmed",
      "approved",
      "accepted",
      "present",
      "completed",
    ].includes(normalized)
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    [
      "open",
      "reserved",
      "pending",
      "pending_payment",
      "waiting",
      "scheduled",
      "invited",
    ].includes(normalized)
  ) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (
    [
      "cancelled",
      "canceled",
      "ended",
      "finished",
      "no_show",
      "unpaid",
      "refunded",
      "rejected",
      "refused",
      "blocked",
      "failed",
    ].includes(normalized)
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function hasRoomCredentials(
  payload?: VisioJoinPayload | null,
): payload is VisioJoinPayload & {
  token: string;
  server_url: string;
} {
  return Boolean(
    payload?.token?.trim() &&
      payload?.server_url?.trim(),
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

function isAuthorizedParticipantStatus(
  status: unknown,
): boolean {
  return AUTHORIZED_PARTICIPANT_STATUSES.includes(
    normalizeValue(status),
  );
}

function isBlockedParticipantStatus(
  status: unknown,
): boolean {
  return BLOCKED_PARTICIPANT_STATUSES.includes(
    normalizeValue(status),
  );
}

function isSessionClosed(
  session?: VisioSession | null,
): boolean {
  return Boolean(
    session &&
      CLOSED_SESSION_STATUSES.includes(
        normalizeValue(
          session.status,
        ),
      ),
  );
}

function isSessionLive(
  session?: VisioSession | null,
): boolean {
  return Boolean(
    session &&
      LIVE_SESSION_STATUSES.includes(
        normalizeValue(
          session.status,
        ),
      ),
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function VisioDetailPage() {
  const params =
    useParams<{
      id: string | string[];
    }>();

  const router = useRouter();

  const rawSessionId =
    params?.id;

  const sessionId =
    Array.isArray(rawSessionId)
      ? rawSessionId[0] ?? ""
      : rawSessionId ?? "";

  const [
    session,
    setSession,
  ] =
    useState<VisioSession | null>(
      null,
    );

  const [
    credentials,
    setCredentials,
  ] =
    useState<VisioJoinPayload | null>(
      null,
    );

  const [
    currentUser,
    setCurrentUser,
  ] =
    useState<
      ReturnType<
        typeof getCurrentUser
      >
    >(null);

  const [
    authToken,
    setAuthToken,
  ] =
    useState<string | null>(
      null,
    );

  const [
    authReady,
    setAuthReady,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    action,
    setAction,
  ] =
    useState<VisioControlAction>(
      "",
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    focusMode,
    setFocusMode,
  ] =
    useState(false);

  const [
    browserFullscreen,
    setBrowserFullscreen,
  ] =
    useState(false);

  const roomShellRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  /* =======================================================
     MODE IMMERSIF / PLEIN ÉCRAN
  ======================================================= */

  useEffect(() => {
    function synchronizeFullscreen(): void {
      setBrowserFullscreen(
        document.fullscreenElement ===
          roomShellRef.current,
      );
    }

    document.addEventListener(
      "fullscreenchange",
      synchronizeFullscreen,
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        synchronizeFullscreen,
      );
    };
  }, []);

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent,
    ): void {
      if (
        event.key === "Escape" &&
        focusMode &&
        !document.fullscreenElement
      ) {
        setFocusMode(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [focusMode]);

  async function toggleBrowserFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (
        !roomShellRef.current?.requestFullscreen
      ) {
        throw new Error(
          "Le plein écran n’est pas pris en charge par ce navigateur.",
        );
      }

      await roomShellRef.current.requestFullscreen();
    } catch (fullscreenError) {
      setError(
        messageOf(
          fullscreenError,
          "Impossible d’activer le plein écran du navigateur.",
        ),
      );
    }
  }

  async function reduceRoom(): Promise<void> {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Le mode immersif GotFit reste contrôlable même si le navigateur
        // refuse de quitter son plein écran natif.
      }
    }

    setFocusMode(false);
  }

  /* =======================================================
     AUTHENTIFICATION
  ======================================================= */

  useEffect(() => {
    function synchronizeAuthentication(): void {
      setCurrentUser(
        getCurrentUser(),
      );

      setAuthToken(
        getToken(),
      );

      setAuthReady(true);
    }

    synchronizeAuthentication();

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (
        authReady &&
        !authToken
      ) {
        setCredentials(null);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    authReady,
    authToken,
  ]);

  /* =======================================================
     CHARGEMENT
  ======================================================= */

  const loadSession =
    useCallback(async () => {
      if (!authReady) {
        return;
      }

      if (!sessionId) {
        setError(
          "L’identifiant de la séance est invalide.",
        );

        setLoading(false);
        return;
      }

      if (!authToken) {
        setLoading(false);

        router.replace(
          `/auth/login?redirect=${encodeURIComponent(
            `/visio/${sessionId}`,
          )}`,
        );

        return;
      }

      try {
        setLoading(true);
        setError("");

        const loadedSession =
          await fetchVisioSession(
            sessionId,
          );

        setSession(
          loadedSession,
        );

        if (
          isSessionClosed(
            loadedSession,
          )
        ) {
          setCredentials(null);
        }
      } catch (requestError) {
        setSession(null);

        setError(
          messageOf(
            requestError,
            "Impossible de charger cette séance visio.",
          ),
        );
      } finally {
        setLoading(false);
      }
    }, [
      authReady,
      authToken,
      router,
      sessionId,
    ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (authReady) {
        void loadSession();
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    authReady,
    loadSession,
  ]);

  /* =======================================================
     PARTICIPANTS
  ======================================================= */

  const participants =
    useMemo(() => {
      return Array.isArray(
        session?.participants,
      )
        ? session.participants
        : [];
    }, [session]);

  const currentParticipant =
    useMemo(() => {
      if (!currentUser) {
        return undefined;
      }

      return participants.find(
        (participant) =>
          sameId(
            participant.user_id,
            currentUser.id,
          ),
      );
    }, [
      currentUser,
      participants,
    ]);

  const activeClientParticipants =
    useMemo(() => {
      return participants.filter(
        (participant) => {
          const isClient =
            !isCoachRole(
              participant.role,
            ) &&
            !isAdministratorRole(
              participant.role,
            );

          return (
            isClient &&
            !isBlockedParticipantStatus(
              participant.status,
            )
          );
        },
      );
    }, [
      participants,
    ]);

  const calculatedPaidClientCount =
    useMemo(() => {
      return activeClientParticipants.filter(
        (participant) =>
          isPaidStatus(
            participant.payment_status,
          ),
      ).length;
    }, [
      activeClientParticipants,
    ]);

  const paidClientCount =
    useMemo(() => {
      const apiCount = Number(
        session?.paid_participants_count,
      );

      return clampInteger(
        Number.isFinite(apiCount)
          ? apiCount
          : calculatedPaidClientCount,
        0,
        VISIO_MAX_COACHEES,
        calculatedPaidClientCount,
      );
    }, [
      calculatedPaidClientCount,
      session?.paid_participants_count,
    ]);

  const reservedClientCount =
    useMemo(() => {
      const apiCount = Number(
        session?.reserved_participants_count,
      );

      return clampInteger(
        Number.isFinite(apiCount)
          ? apiCount
          : activeClientParticipants.length,
        0,
        VISIO_MAX_COACHEES,
        activeClientParticipants.length,
      );
    }, [
      activeClientParticipants.length,
      session?.reserved_participants_count,
    ]);

  const minimumRequired =
    useMemo(() => {
      return clampInteger(
        session?.min_participants,
        1,
        VISIO_MAX_COACHEES,
        1,
      );
    }, [
      session?.min_participants,
    ]);

  const minimumReached =
    paidClientCount >=
    minimumRequired;

  const capacityReached =
    reservedClientCount >=
    VISIO_MAX_COACHEES;

  const totalParticipantCount =
    Math.min(
      VISIO_MAX_TOTAL_PARTICIPANTS,
      1 + reservedClientCount,
    );

  /* =======================================================
     AUTORISATIONS
  ======================================================= */

  const isAdministrator =
    Boolean(
      currentUser &&
        (
          hasRole(
            currentUser,
            "admin",
          ) ||
          hasRole(
            currentUser,
            "administrator",
          ) ||
          hasRole(
            currentUser,
            "super_admin",
          )
        ),
    );

  const isSessionCoach =
    useMemo(() => {
      if (
        !currentUser ||
        !session
      ) {
        return false;
      }

      if (isAdministrator) {
        return true;
      }

      const matchesOwner =
        sameId(
          session.coach_id,
          currentUser.id,
        ) ||
        sameId(
          session.intervenant_id,
          currentUser.id,
        ) ||
        sameId(
          session.coach?.id,
          currentUser.id,
        ) ||
        sameId(
          session.intervenant?.id,
          currentUser.id,
        );

      if (matchesOwner) {
        return true;
      }

      return Boolean(
        currentParticipant &&
          isCoachRole(
            currentParticipant.role,
          ),
      );
    }, [
      currentParticipant,
      currentUser,
      isAdministrator,
      session,
    ]);

  const userHasCoachRole =
    Boolean(
      currentUser &&
        (
          hasRole(
            currentUser,
            "intervenant",
          ) ||
          hasRole(
            currentUser,
            "coach",
          )
        ),
    );

  const currentParticipantIsClient =
    Boolean(
      currentParticipant &&
        !isCoachRole(
          currentParticipant.role,
        ) &&
        !isAdministratorRole(
          currentParticipant.role,
        ),
    );

  const clientIsAuthorized =
    Boolean(
      currentParticipant &&
        currentParticipantIsClient &&
        isPaidStatus(
          currentParticipant.payment_status,
        ) &&
        isAuthorizedParticipantStatus(
          currentParticipant.status,
        ) &&
        !isBlockedParticipantStatus(
          currentParticipant.status,
        ),
    );

  const normalizedSessionStatus =
    normalizeValue(
      session?.status,
    );

  const sessionIsLive =
    isSessionLive(session);

  const sessionIsClosed =
    isSessionClosed(session);

  const canStart =
    Boolean(
      session &&
        isSessionCoach &&
        minimumReached &&
        STARTABLE_SESSION_STATUSES.includes(
          normalizedSessionStatus,
        ),
    );

  const canJoin =
    Boolean(
      session &&
        !sessionIsClosed &&
        normalizedSessionStatus !== "draft" &&
        (
          (isSessionCoach && sessionIsLive) ||
          (!isSessionCoach && clientIsAuthorized)
        ),
    );

  const canEnd =
    Boolean(
      session &&
        isSessionCoach &&
        sessionIsLive,
    );

  const sessionFullForCurrentUser =
    Boolean(
      capacityReached &&
        !currentParticipant &&
        !isSessionCoach,
    );

  const canReserveFreeSession =
    Boolean(
      session &&
        !session.reservation_id &&
        !sessionIsClosed &&
        !sessionFullForCurrentUser &&
        !currentParticipant &&
        !isSessionCoach &&
        !userHasCoachRole &&
        Number(session.price || 0) <= 0,
    );

  /* =======================================================
     ACTIONS
  ======================================================= */

  async function execute(
    label: Exclude<
      VisioControlAction,
      ""
    >,
    callback: () => Promise<void>,
  ): Promise<void> {
    if (action) {
      return;
    }

    try {
      setAction(label);
      setError("");
      setSuccess("");

      await callback();
    } catch (requestError) {
      setError(
        messageOf(
          requestError,
          "Cette action est impossible pour le moment.",
        ),
      );
    } finally {
      setAction("");
    }
  }

  async function reserveFreeSession(): Promise<void> {
    await execute(
      "reserve",
      async () => {
        if (!canReserveFreeSession) {
          throw new Error(
            "Cette séance ne peut pas être réservée depuis cet écran.",
          );
        }

        const result = await reserveVisioSession(sessionId);

        if (result.session) {
          setSession(result.session);
        } else {
          await loadSession();
        }

        setSuccess(
          "Votre place est confirmée. Vous pouvez rejoindre la salle immédiatement.",
        );
      },
    );
  }

  async function joinRoom(): Promise<void> {
    await execute(
      "join",
      async () => {
        if (!canJoin) {
          if (sessionFullForCurrentUser) {
            throw new Error(
              "Cette séance a déjà atteint sa capacité maximale de deux coachés.",
            );
          }

          throw new Error(
            "Vous n’êtes pas autorisé à rejoindre cette séance.",
          );
        }

        const payload =
          await joinVisioSession(
            sessionId,
          );

        if (
          !hasRoomCredentials(
            payload,
          )
        ) {
          throw new Error(
            "Laravel n’a pas renvoyé le token LiveKit ou l’adresse du serveur.",
          );
        }

        setCredentials(payload);
        setFocusMode(true);

        if (payload.session) {
          setSession(
            payload.session,
          );
        }

        setSuccess(
          "Connexion autorisée. Vous pouvez activer votre caméra et votre microphone.",
        );
      },
    );
  }

  async function startRoom(): Promise<void> {
    await execute(
      "start",
      async () => {
        if (!isSessionCoach) {
          throw new Error(
            "Seul l’intervenant organisateur peut démarrer cette séance.",
          );
        }

        if (!minimumReached) {
          throw new Error(
            `Cette séance nécessite au moins ${minimumRequired} coaché${
              minimumRequired > 1
                ? "s"
                : ""
            } ayant réglé leur réservation.`,
          );
        }

        if (!canStart) {
          throw new Error(
            "Cette séance ne peut pas être démarrée dans son état actuel.",
          );
        }

        const updated =
          await startVisioSession(
            sessionId,
          );

        setSession(updated);

        const payload =
          await joinVisioSession(
            sessionId,
          );

        if (
          !hasRoomCredentials(
            payload,
          )
        ) {
          throw new Error(
            "La séance a été démarrée, mais les accès LiveKit sont incomplets.",
          );
        }

        setCredentials(payload);
        setFocusMode(true);

        if (payload.session) {
          setSession(
            payload.session,
          );
        }

        setSuccess(
          "La séance visio est démarrée.",
        );
      },
    );
  }

  async function endRoom(): Promise<void> {
    if (!canEnd) {
      setError(
        "Seul l’intervenant organisateur peut terminer une séance en direct.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Voulez-vous vraiment terminer cette séance visio pour tous les participants ?",
      );

    if (!confirmed) {
      return;
    }

    await execute(
      "end",
      async () => {
        const updated =
          await endVisioSession(
            sessionId,
          );

        setSession(updated);
        setCredentials(null);
        setFocusMode(false);

        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(() => undefined);
        }

        setSuccess(
          "La séance visio est terminée.",
        );
      },
    );
  }

  async function leaveRoom(): Promise<void> {
    setCredentials(null);
    setFocusMode(false);

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
    }

    try {
      await leaveVisioSession(sessionId);
    } catch {
      // La connexion LiveKit est déjà coupée localement. L’API pourra
      // resynchroniser le participant lors de la prochaine entrée.
    }

    setSuccess(
      "Vous avez quitté la salle visio.",
    );
  }

  /* =======================================================
     INFORMATIONS D’AFFICHAGE
  ======================================================= */

  const coachName =
    session?.intervenant?.name ||
    session?.coach?.name ||
    "Intervenant Gotfit";

  const coachSubtitle =
    isSessionCoach
      ? "Vous organisez cette séance"
      : "Organisateur de la séance";

  const sessionTypeLabel =
    session?.session_type ===
    "individual"
      ? "Visio individuelle"
      : session?.session_type ===
          "group"
        ? "Visio en petit groupe"
        : "Séance visio";

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FFF7ED] px-4 pb-16 pt-36 text-slate-950">
        <div className="mx-auto max-w-7xl">
          {/* Navigation */}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/visio"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-black text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-50"
            >
              <ArrowLeft size={17} />

              Retour aux séances visio
            </Link>

            <button
              type="button"
              onClick={() => {
                void loadSession();
              }}
              disabled={
                loading ||
                Boolean(action)
              }
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Actualiser
            </button>
          </div>

          {/* Messages */}

          <div
            aria-live="polite"
            aria-atomic="true"
          >
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700"
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
                className="mb-5 flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700"
              >
                <CheckCircle2
                  className="mt-0.5 shrink-0"
                  size={18}
                />

                <span>{success}</span>
              </div>
            )}
          </div>

          {/* Chargement */}

          {!authReady || loading ? (
            <div className="flex items-center justify-center rounded-[2rem] bg-white py-20 text-sm font-black text-orange-700 shadow-sm">
              <Loader2
                className="mr-3 animate-spin"
                size={20}
              />

              Chargement de la visio...
            </div>
          ) : !session ? (
            <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm">
              <AlertTriangle
                className="mx-auto mb-4 text-orange-600"
                size={34}
              />

              <h1 className="text-2xl font-black">
                Séance introuvable
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-slate-500">
                Cette séance n’existe pas ou
                n’est plus disponible.
              </p>

              <Link
                href="/visio"
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-orange-600 px-6 text-sm font-black text-white transition hover:bg-orange-700"
              >
                Voir les séances visio
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              {/* Contenu principal */}

              <section className="rounded-[2rem] bg-white p-5 shadow-sm md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-orange-700">
                      <Video size={15} />

                      {sessionTypeLabel}
                    </span>

                    <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                      {session.title}
                    </h1>
                  </div>

                  <span
                    className={`rounded-full border px-4 py-2 text-xs font-black ${statusClass(
                      session.status,
                    )}`}
                  >
                    {getVisioStatusLabel(
                      session.status,
                    )}
                  </span>
                </div>

                <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
                  {session.description ||
                    "Séance visio privée entre l’intervenant et les coachés autorisés."}
                </p>

                {/* Informations */}

                <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl bg-orange-50 p-5">
                    <Calendar
                      className="mb-3 text-orange-700"
                      size={22}
                    />

                    <strong className="block text-base font-black">
                      {session.start_at
                        ? formatDate(
                            session.start_at,
                          )
                        : "Date à confirmer"}
                    </strong>

                    <span className="mt-1 block text-xs font-bold text-slate-500">
                      Date prévue
                    </span>
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-5">
                    <Clock
                      className="mb-3 text-orange-700"
                      size={22}
                    />

                    <strong className="block text-lg font-black">
                      {
                        session.duration_minutes
                      }{" "}
                      min
                    </strong>

                    <span className="mt-1 block text-xs font-bold text-slate-500">
                      Durée
                    </span>
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-5">
                    <Users
                      className="mb-3 text-orange-700"
                      size={22}
                    />

                    <strong className="block text-lg font-black">
                      {paidClientCount}/
                      {VISIO_MAX_COACHEES}
                    </strong>

                    <span className="mt-1 block text-xs font-bold text-slate-500">
                      Coachés confirmés
                    </span>
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-5">
                    <ShieldCheck
                      className="mb-3 text-orange-700"
                      size={22}
                    />

                    <strong className="block text-lg font-black">
                      {session.reservation_id ? "Payé via Stripe" : "Gratuit"}
                    </strong>

                    <span className="mt-1 block text-xs font-bold text-slate-500">
                      Accès à la visio
                    </span>
                  </div>
                </div>

                {/* Salle LiveKit */}

                {hasRoomCredentials(
                  credentials,
                ) ? (
                  <div
                    ref={roomShellRef}
                    className={
                      focusMode
                        ? "fixed inset-0 z-[200] flex h-[100dvh] w-screen flex-col overflow-hidden bg-slate-950 text-white"
                        : "mt-7 overflow-hidden rounded-[2rem] bg-slate-950 shadow-xl"
                    }
                  >
                    <div className="relative z-20 flex min-h-[72px] shrink-0 flex-col gap-4 border-b border-white/10 bg-slate-950/95 px-4 py-3 text-white backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-400">
                          Connexion sécurisée
                        </p>

                        <h2 className="mt-1 text-lg font-black">
                          GotFit Live · Salle visio en cours
                        </h2>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {focusMode && (
                          <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-slate-200 md:inline-flex">
                            {totalParticipantCount}/{VISIO_MAX_TOTAL_PARTICIPANTS} participants
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            void toggleBrowserFullscreen();
                          }}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-xs font-black text-white transition hover:bg-white/20"
                        >
                          {browserFullscreen ? (
                            <Minimize2 size={16} />
                          ) : (
                            <Maximize2 size={16} />
                          )}

                          {browserFullscreen
                            ? "Quitter plein écran"
                            : "Plein écran"}
                        </button>

                        {focusMode && (
                          <button
                            type="button"
                            onClick={() => {
                              void reduceRoom();
                            }}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-xs font-black text-white transition hover:bg-white/20"
                          >
                            <Minimize2 size={16} />
                            Réduire
                          </button>
                        )}

                        <VisioControls
                          inRoom
                          canEnd={canEnd}
                          busyAction={action}
                          onLeave={leaveRoom}
                          onEnd={endRoom}
                        />
                      </div>
                    </div>

                    <div
                      className={
                        focusMode
                          ? "min-h-0 flex-1 bg-black p-0 [&_.lk-room-container]:h-full [&_.lk-video-conference]:h-full"
                          : "min-h-[560px] p-2 [&_.lk-room-container]:min-h-[544px]"
                      }
                    >
                      <LiveKitRoom
                        serverUrl={
                          credentials.server_url
                        }
                        token={
                          credentials.token
                        }
                        connect
                        audio
                        video
                        data-lk-theme="default"
                        className="h-full min-h-0"
                        onConnected={() => {
                          setError("");
                          setFocusMode(true);
                          setSuccess(
                            "Connexion LiveKit établie. La salle est prête.",
                          );
                        }}
                        onDisconnected={() => {
                          setCredentials(null);
                          setFocusMode(false);
                          if (document.fullscreenElement) {
                            void document.exitFullscreen().catch(() => undefined);
                          }
                          void leaveVisioSession(sessionId).catch(() => undefined);

                          setSuccess(
                            "Vous avez été déconnecté de la salle visio.",
                          );
                        }}
                      >
                        <VideoConference />
                        <RoomAudioRenderer />
                      </LiveKitRoom>
                    </div>

                    {focusMode && !browserFullscreen && (
                      <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-center text-[11px] font-bold text-white/80 backdrop-blur md:bottom-4">
                        Échap ou « Réduire » pour revenir à la page GotFit · « Plein écran » pour masquer aussi le navigateur
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-7 rounded-[2rem] border border-orange-100 bg-orange-50 p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-700 shadow-sm">
                        <Video size={23} />
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                          Accès sécurisé
                        </p>

                        <h2 className="mt-1 text-xl font-black">
                          Accéder à la salle
                        </h2>

                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                          L’API vérifie votre
                          identité, votre rôle,
                          votre réservation et
                          votre paiement avant
                          de générer un token
                          LiveKit privé.
                        </p>
                      </div>
                    </div>

                    <VisioControls
                      className="mt-5"
                      canStart={canStart}
                      canJoin={canJoin}
                      canEnd={canEnd}
                      busyAction={action}
                      onStart={startRoom}
                      onJoin={joinRoom}
                      onEnd={endRoom}
                    />

                    {sessionIsClosed && (
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600">
                        Cette séance est
                        terminée ou annulée.
                        L’accès à la salle
                        n’est plus disponible.
                      </div>
                    )}

                    {isSessionCoach &&
                      !minimumReached &&
                      !sessionIsClosed && (
                        <div className="mt-5 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold leading-6 text-amber-700">
                          La séance pourra être
                          démarrée lorsque{" "}
                          {minimumRequired}{" "}
                          coaché
                          {minimumRequired > 1
                            ? "s auront"
                            : " aura"}{" "}
                          réglé la réservation.
                          Actuellement :{" "}
                          {paidClientCount}/
                          {minimumRequired}.
                        </div>
                      )}

                    {sessionFullForCurrentUser &&
                      !sessionIsClosed && (
                        <div className="mt-5 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-bold leading-6 text-red-700">
                          Cette séance est
                          complète. Les deux
                          places réservées aux
                          coachés sont déjà
                          occupées.
                        </div>
                      )}

                    {!isSessionCoach &&
                      userHasCoachRole &&
                      !isAdministrator && (
                        <div className="mt-5 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold leading-6 text-amber-700">
                          Vous êtes connecté en
                          tant qu’intervenant,
                          mais vous n’êtes pas
                          l’organisateur de
                          cette séance.
                        </div>
                      )}

                    {canReserveFreeSession && (
                      <button
                        type="button"
                        onClick={() => void reserveFreeSession()}
                        disabled={action !== ""}
                        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-5 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60"
                      >
                        {action === "reserve" ? (
                          <Loader2 className="animate-spin" size={17} />
                        ) : (
                          <CheckCircle2 size={17} />
                        )}
                        {action === "reserve" ? "Réservation…" : "Réserver gratuitement"}
                      </button>
                    )}

                    {!isSessionCoach &&
                      !clientIsAuthorized &&
                      !userHasCoachRole &&
                      !sessionIsClosed &&
                      !sessionFullForCurrentUser && (
                        <div className="mt-5 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold leading-6 text-amber-700">
                          Votre accès n’est pas
                          encore autorisé.
                          Vérifiez que cette
                          visio est liée à une
                          réservation payée et
                          confirmée.
                        </div>
                      )}

                    {clientIsAuthorized &&
                      !sessionIsLive &&
                      !sessionIsClosed && (
                        <div className="mt-5 rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold leading-6 text-blue-700">
                          Votre accès est confirmé. Vous pouvez rejoindre la salle immédiatement, sans attendre l’heure prévue.
                        </div>
                      )}
                  </div>
                )}
              </section>

              {/* Colonne latérale */}

              <aside className="grid content-start gap-5">
                {/* Intervenant */}

                <section className="rounded-[2rem] bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
                      <ShieldCheck
                        size={22}
                      />
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">
                        Intervenant
                      </p>

                      <h2 className="mt-1 text-xl font-black">
                        {coachName}
                      </h2>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {coachSubtitle}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Capacité */}

                <section className="rounded-[2rem] border border-orange-100 bg-orange-50 p-5">
                  <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
                    <Users
                      className="text-orange-700"
                      size={21}
                    />

                    Capacité V1
                  </h2>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-white p-4">
                      <strong className="block text-sm font-black text-slate-950">
                        1 intervenant
                      </strong>

                      <span className="mt-1 block text-xs font-semibold text-slate-500">
                        Organisateur de la
                        séance
                      </span>
                    </div>

                    <div className="rounded-2xl bg-white p-4">
                      <strong className="block text-sm font-black text-slate-950">
                        2 coachés maximum
                      </strong>

                      <span className="mt-1 block text-xs font-semibold text-slate-500">
                        Participants clients
                      </span>
                    </div>

                    <div className="rounded-2xl bg-white p-4">
                      <strong className="block text-sm font-black text-slate-950">
                        {totalParticipantCount}/
                        {
                          VISIO_MAX_TOTAL_PARTICIPANTS
                        }{" "}
                        personnes
                      </strong>

                      <span className="mt-1 block text-xs font-semibold text-slate-500">
                        Capacité totale de la
                        salle
                      </span>
                    </div>
                  </div>
                </section>

                {/* Participants */}

                <section className="rounded-[2rem] bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-xl font-black">
                      <Users
                        className="text-orange-700"
                        size={22}
                      />

                      Participants
                    </h2>

                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
                      {reservedClientCount}/
                      {VISIO_MAX_COACHEES}
                    </span>
                  </div>

                  <VisioParticipants
                    participants={
                      participants
                    }
                    currentUserId={
                      currentUser?.id ??
                      null
                    }
                    isOrganizer={
                      isSessionCoach
                    }
                    showPaymentStatus
                    emptyMessage="Les coachés seront ajoutés automatiquement par l’API Laravel après leur réservation et leur paiement."
                  />
                </section>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
