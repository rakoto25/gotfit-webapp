"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarCheck,
  Camera,
  CheckCircle2,
  CreditCard,
  FileBadge2,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
  Video,
  Wallet,
  X,
} from "lucide-react";

import DocumentUploader, {
  type ExistingDocument,
} from "@/components/uploads/DocumentUploader";

import {
  clearAuth,
  getCurrentUser,
  getPostAuthRoute,
  getToken,
  hasRole,
  updateCurrentUser,
} from "@/lib/auth";

import {
  getApiUrl,
  getAssetUrl,
} from "@/lib/api-config";

import {
  inferProfessionalDocumentType,
  normalizeCoachDocumentStatus,
  type CoachCredentialDeleteResponse,
  type CoachCredentialsResponse,
  type CoachCredentialUploadResponse,
  type CoachDocument,
  type CoachProfileResponse,
  type CoachProfileUpdateResponse,
  type CoachUser,
  type StripeConnectOnboardingResponse,
  type StripeConnectStatusResponse,
} from "@/types/coach";

const FALLBACK_COVER =
  "linear-gradient(135deg, #fff7ed 0%, #ffedd5 35%, #fdba74 70%, #f97316 100%)";

const MAX_IMAGE_SIZE =
  8 * 1024 * 1024;

const MAX_VIDEO_SIZE =
  100 * 1024 * 1024;

const MAX_VIDEO_DURATION_SECONDS =
  60;

/**
 * Alias locaux permettant de conserver les noms
 * utilisés dans le reste de cette page.
 */
type ProfileDocument =
  CoachDocument;

type ProfileUser =
  CoachUser;

type ProfileResponse =
  CoachProfileResponse;

type ProfileUpdateResponse =
  CoachProfileUpdateResponse;

type CredentialUploadResponse =
  CoachCredentialUploadResponse;

type DeleteDocumentResponse =
  CoachCredentialDeleteResponse;

type StripeConnectResponse =
  StripeConnectOnboardingResponse;

/**
 * Réservation renvoyée par :
 *
 * GET /api/reservation/client
 * GET /api/reservation/intervenant
 */
type Reservation = {
  id: number;

  status?: string | null;
  reservation_status?: string | null;
  payment_status?: string | null;
  prestation_status?: string | null;

  visio_session_id?: number | string | null;
  visio_session?: {
    id?: number | string | null;
    status?: string | null;
  } | null;

  amount?: number | string | null;
  total?: number | string | null;
  price?: number | string | null;
  total_client_amount?:
    | number
    | string
    | null;

  currency?: string | null;

  is_paid?: boolean | number | null;
  paid_at?: string | null;

  created_at?: string | null;
  date?: string | null;
  start_at?: string | null;
  end_at?: string | null;

  client?: ProfileUser | null;
  intervenant?: ProfileUser | null;

  annonce?: {
    id?: number;
    titre?: string | null;
    title?: string | null;
    name?: string | null;
    price?: number | string | null;
  } | null;
};

/**
 * Paiement renvoyé par :
 *
 * GET /api/my-payments
 */
type Payment = {
  id: number;

  amount?: number | string | null;
  total?: number | string | null;

  status?: string | null;
  payment_status?: string | null;

  method?: string | null;
  provider?: string | null;
  reference?: string | null;

  created_at?: string | null;

  reservation?: Reservation | null;
};

/**
 * Format des erreurs Laravel.
 */
type ApiErrorPayload = {
  message?: string;

  errors?: Record<
    string,
    string[]
  >;
};

/* =========================================================
   OUTILS DE NORMALISATION
========================================================= */

function normalizeArray<T>(
  payload: unknown,
): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (
    !payload ||
    typeof payload !== "object"
  ) {
    return [];
  }

  const objectPayload =
    payload as Record<
      string,
      unknown
    >;

  const possibleArrays = [
    objectPayload.data,
    objectPayload.payments,
    objectPayload.payements,
    objectPayload.reservations,
    objectPayload.documents,
    objectPayload.credentials,
  ];

  const foundArray =
    possibleArrays.find(
      Array.isArray,
    );

  return foundArray
    ? (foundArray as T[])
    : [];
}

function getUserPhoto(
  user: ProfileUser | null,
): string {
  return getAssetUrl(
    user?.photo_url ||
      user?.photo,
  );
}

function getUserCover(
  user: ProfileUser | null,
): string {
  return getAssetUrl(
    user?.cover_photo_url ||
      user?.cover_photo,
  );
}

function getUserVideo(
  user: ProfileUser | null,
): string {
  return getAssetUrl(
    user?.presentation_video_url ||
      user?.presentation_video,
  );
}

function toInputValue(
  value: unknown,
): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value ?? "");
}

function formatBytes(
  size: number,
): string {
  if (size < 1024) {
    return `${size} octet${
      size > 1 ? "s" : ""
    }`;
  }

  if (
    size <
    1024 * 1024
  ) {
    return `${Math.round(
      size / 1024,
    )} Ko`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} Mo`;
}

function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return "Non défini";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

function formatDateTime(
  value?: string | null,
): string {
  if (!value) {
    return "Non défini";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function formatMoney(
  value?:
    | number
    | string
    | null,
  currency = "EUR",
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style: "currency",
        currency,
      },
    ).format(0);
  }

  const numberValue =
    Number(value);

  if (
    Number.isNaN(numberValue)
  ) {
    return `${value} ${currency}`;
  }

  return new Intl.NumberFormat(
    "fr-FR",
    {
      style: "currency",
      currency,
    },
  ).format(numberValue);
}

function getErrorMessage(
  result:
    | ApiErrorPayload
    | null,
  fallback =
    "Une erreur est survenue.",
): string {
  if (result?.errors) {
    const firstError =
      Object.values(
        result.errors,
      )
        .flat()
        .find(Boolean);

    if (firstError) {
      return firstError;
    }
  }

  return (
    result?.message ||
    fallback
  );
}

function getDashboardUrl(
  user: ProfileUser | null,
): string {
  if (!user) {
    return "/profile";
  }

  return getPostAuthRoute(
    user,
  );
}

function getMainRole(
  user: ProfileUser | null,
): string {
  if (
    hasRole(user, "admin")
  ) {
    return "Administrateur";
  }

  if (
    hasRole(
      user,
      "intervenant",
    )
  ) {
    return "Coach";
  }

  if (
    hasRole(user, "client")
  ) {
    return "Coaché";
  }

  return "Utilisateur";
}

/* =========================================================
   STATUTS
========================================================= */

function getStatusLabel(
  status?: string | null,
): string {
  if (!status) {
    return "Non défini";
  }

  const normalizedStatus =
    status
      .trim()
      .toLowerCase();

  const labels: Record<
    string,
    string
  > = {
    approved: "Approuvé",
    valide: "Validé",
    "validé": "Validé",
    pending: "En attente",
    en_attente: "En attente",
    rejected: "Refusé",
    refuse: "Refusé",
    "refusé": "Refusé",
    active: "Actif",
    inactive: "Inactif",
    suspended: "Suspendu",
    paid: "Payé",
    unpaid: "Non payé",
    completed: "Terminé",
    cancelled: "Annulé",
    canceled: "Annulé",
    confirmed: "Confirmé",
    processing: "En traitement",
    refunded: "Remboursé",
  };

  return (
    labels[normalizedStatus] ||
    status
  );
}

function getStatusClasses(
  status?: string | null,
): string {
  const normalizedStatus =
    status
      ?.trim()
      .toLowerCase() || "";

  if (
    [
      "active",
      "approved",
      "valide",
      "validé",
      "paid",
      "completed",
      "confirmed",
    ].includes(
      normalizedStatus,
    )
  ) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (
    [
      "pending",
      "en_attente",
      "processing",
      "unpaid",
    ].includes(
      normalizedStatus,
    )
  ) {
    return "bg-amber-100 text-amber-700";
  }

  if (
    [
      "rejected",
      "refuse",
      "refusé",
      "cancelled",
      "canceled",
      "inactive",
      "suspended",
    ].includes(
      normalizedStatus,
    )
  ) {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}


function isReservationPaid(
  reservation: Reservation,
): boolean {
  return (
    reservation.payment_status === "paid" ||
    reservation.is_paid === true ||
    reservation.is_paid === 1
  );
}

function getReservationVisioSessionId(
  reservation: Reservation,
): number | string | null {
  return (
    reservation.visio_session_id ??
    reservation.visio_session?.id ??
    null
  );
}

function canAccessReservationVisio(
  reservation: Reservation,
): boolean {
  const status = (
    reservation.prestation_status ||
    reservation.status ||
    reservation.reservation_status ||
    ""
  )
    .trim()
    .toLowerCase();

  return (
    isReservationPaid(reservation) &&
    getReservationVisioSessionId(reservation) !== null &&
    ![
      "cancelled",
      "canceled",
      "annule",
      "annulee",
      "refunded",
      "remboursee",
    ].includes(status)
  );
}

/* =========================================================
   DOCUMENTS PROFESSIONNELS
========================================================= */

function normalizeProfileDocument(
  document: ProfileDocument,
  index: number,
): ExistingDocument {
  return {
    id:
      document.id ??
      `${
        document.original_name ||
        document.file_name ||
        document.name ||
        "document"
      }-${index}`,

    name:
      document.original_name ||
      document.file_name ||
      document.name ||
      `Document ${index + 1}`,

    url: getAssetUrl(
      document.url ||
        document.path ||
        document.file_path,
    ),

    size:
      document.size ?? null,

    mime_type:
      document.mime_type ||
      document.type ||
      null,

    status:
      normalizeCoachDocumentStatus(
        document.status,
      ),
  };
}

function normalizeProfileDocuments(
  documents?:
    | ProfileDocument[]
    | null,
): ExistingDocument[] {
  if (
    !Array.isArray(documents)
  ) {
    return [];
  }

  return documents.map(
    normalizeProfileDocument,
  );
}

function getDocumentsFromProfile(
  user: ProfileUser | null,
): ExistingDocument[] {
  const documents =
    user?.coach_documents ||
    user?.professional_documents ||
    user?.documents ||
    [];

  return normalizeProfileDocuments(
    documents,
  );
}

/* =========================================================
   VIDÉO
========================================================= */

function getVideoDuration(
  file: File,
): Promise<number> {
  return new Promise(
    (resolve, reject) => {
      const video =
        document.createElement(
          "video",
        );

      const objectUrl =
        URL.createObjectURL(
          file,
        );

      const cleanup =
        (): void => {
          URL.revokeObjectURL(
            objectUrl,
          );

          video.removeAttribute(
            "src",
          );

          video.load();
        };

      video.preload =
        "metadata";

      video.onloadedmetadata =
        () => {
          const duration =
            video.duration || 0;

          cleanup();

          resolve(duration);
        };

      video.onerror = () => {
        cleanup();

        reject(
          new Error(
            "Impossible de lire la durée de la vidéo.",
          ),
        );
      };

      video.src =
        objectUrl;
    },
  );
}

/* =========================================================
   API
========================================================= */

async function apiRequest<T>(
  endpoint: string,
  options:
    RequestInit = {},
): Promise<T> {
  const token =
    getToken();

  if (!token) {
    throw new Error(
      "Session expirée. Veuillez vous reconnecter.",
    );
  }

  const headers =
    new Headers(
      options.headers,
    );

  headers.set(
    "Accept",
    "application/json",
  );

  headers.set(
    "Authorization",
    `Bearer ${token}`,
  );

  const response =
    await fetch(
      getApiUrl(endpoint),
      {
        ...options,
        headers,
        cache: "no-store",
      },
    );

  const result =
    (await response
      .json()
      .catch(
        () => null,
      )) as
      | (T &
          ApiErrorPayload)
      | null;

  if (
    response.status === 401
  ) {
    clearAuth();

    throw new Error(
      "Session expirée. Veuillez vous reconnecter.",
    );
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        result,
        "La requête n’a pas pu être exécutée.",
      ),
    );
  }

  return result as T;
}

async function apiGet<T>(
  endpoint: string,
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: "GET",
    },
  );
}

async function apiPostForm<T>(
  endpoint: string,
  formData: FormData,
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: "POST",
      body: formData,
    },
  );
}

async function apiPost<T>(
  endpoint: string,
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: "POST",
    },
  );
}

async function apiDelete<T>(
  endpoint: string,
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: "DELETE",
    },
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ProfilePage() {
  const router =
    useRouter();

  const photoObjectUrlRef =
    useRef<string | null>(
      null,
    );

  const coverObjectUrlRef =
    useRef<string | null>(
      null,
    );

  const videoObjectUrlRef =
    useRef<string | null>(
      null,
    );

  const [user, setUser] =
    useState<
      ProfileUser | null
    >(null);

  const [
    reservations,
    setReservations,
  ] = useState<
    Reservation[]
  >([]);

  const [
    payments,
    setPayments,
  ] = useState<
    Payment[]
  >([]);

  const [
    existingDocuments,
    setExistingDocuments,
  ] = useState<
    ExistingDocument[]
  >([]);

  const [
    newDocuments,
    setNewDocuments,
  ] = useState<File[]>([]);

  const [
    documentError,
    setDocumentError,
  ] = useState("");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [
    address,
    setAddress,
  ] = useState("");

  const [bio, setBio] =
    useState("");

  const [city, setCity] =
    useState("");

  const [
    location,
    setLocation,
  ] = useState("");

  const [
    companyName,
    setCompanyName,
  ] = useState("");

  const [siret, setSiret] =
    useState("");

  const [
    coachTitle,
    setCoachTitle,
  ] = useState("");

  const [
    coachShortDescription,
    setCoachShortDescription,
  ] = useState("");

  const [
    coachSpeciality,
    setCoachSpeciality,
  ] = useState("");

  const [
    coachExperienceYears,
    setCoachExperienceYears,
  ] = useState("");

  const [
    coachCertifications,
    setCoachCertifications,
  ] = useState("");

  const [
    coachLanguages,
    setCoachLanguages,
  ] = useState("");

  const [
    photoFile,
    setPhotoFile,
  ] = useState<
    File | null
  >(null);

  const [
    coverFile,
    setCoverFile,
  ] = useState<
    File | null
  >(null);

  const [
    presentationVideoFile,
    setPresentationVideoFile,
  ] = useState<
    File | null
  >(null);

  const [
    photoPreview,
    setPhotoPreview,
  ] = useState("");

  const [
    coverPreview,
    setCoverPreview,
  ] = useState("");

  const [
    presentationVideoPreview,
    setPresentationVideoPreview,
  ] = useState("");

  const [
    presentationVideoDuration,
    setPresentationVideoDuration,
  ] = useState<
    number | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    stripeLoading,
    setStripeLoading,
  ] = useState(false);

  const [
    stripeChecking,
    setStripeChecking,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /* =======================================================
     DONNÉES CALCULÉES
  ======================================================= */

  const mainRole =
    useMemo(
      () =>
        getMainRole(user),
      [user],
    );

  const isIntervenantAccount =
    useMemo(
      () =>
        hasRole(
          user,
          "intervenant",
        ),
      [user],
    );

  const stripeStatus =
    useMemo(() => {
      if (
        !isIntervenantAccount
      ) {
        return "hidden";
      }

      if (
        user?.stripe_onboarding_completed
      ) {
        return "active";
      }

      if (
        user?.stripe_account_id
      ) {
        return "pending";
      }

      return "missing";
    }, [
      isIntervenantAccount,
      user?.stripe_account_id,
      user?.stripe_onboarding_completed,
    ]);

  const paidReservations =
    useMemo(
      () =>
        reservations.filter(
          (
            reservation,
          ) =>
            isReservationPaid(
              reservation,
            ),
        ),
      [reservations],
    );

  const totalPaid =
    useMemo(() => {
      if (
        payments.length > 0
      ) {
        return payments.reduce(
          (
            total,
            payment,
          ) => {
            const rawAmount =
              payment.amount ??
              payment.total ??
              payment
                .reservation
                ?.total_client_amount ??
              payment
                .reservation
                ?.price ??
              0;

            const amount =
              Number(
                rawAmount,
              );

            return (
              total +
              (Number.isNaN(
                amount,
              )
                ? 0
                : amount)
            );
          },
          0,
        );
      }

      return paidReservations.reduce(
        (
          total,
          reservation,
        ) => {
          const rawAmount =
            reservation.total_client_amount ??
            reservation.total ??
            reservation.amount ??
            reservation.price ??
            reservation.annonce
              ?.price ??
            0;

          const amount =
            Number(
              rawAmount,
            );

          return (
            total +
            (Number.isNaN(
              amount,
            )
              ? 0
              : amount)
          );
        },
        0,
      );
    }, [
      payments,
      paidReservations,
    ]);

  const paymentCount =
    payments.length ||
    paidReservations.length;

  /* =======================================================
     SYNCHRONISATION
  ======================================================= */

  const syncUser =
    useCallback(
      (
        updatedUser:
          ProfileUser,
      ): void => {
        setUser(
          updatedUser,
        );

        updateCurrentUser(
          updatedUser,
        );
      },
      [],
    );

  const loadOptionalArray =
    useCallback(
      async <T,>(
        endpoints: string[],
      ): Promise<T[]> => {
        for (
          const endpoint
          of endpoints
        ) {
          try {
            const payload =
              await apiGet<unknown>(
                endpoint,
              );

            const data =
              normalizeArray<T>(
                payload,
              );

            if (
              data.length > 0
            ) {
              return data;
            }
          } catch {
            // Essayer l’endpoint suivant.
          }
        }

        return [];
      },
      [],
    );

  const loadCoachCredentials =
    useCallback(
      async (
        fallbackUser?:
          | ProfileUser
          | null,
      ): Promise<void> => {
        try {
          const result =
            await apiGet<CoachCredentialsResponse>(
              "coach/credentials",
            );

          const credentials =
            Array.isArray(
              result.credentials,
            )
              ? result.credentials
              : [];

          setExistingDocuments(
            normalizeProfileDocuments(
              credentials,
            ),
          );
        } catch {
          setExistingDocuments(
            getDocumentsFromProfile(
              fallbackUser ||
                null,
            ),
          );
        }
      },
      [],
    );

  const loadProfile =
    useCallback(
      async (): Promise<void> => {
        try {
          setLoading(true);
          setError("");

          const profilePayload =
            await apiGet<ProfileResponse>(
              "profile",
            );

          const profileUser =
            profilePayload?.user ||
            profilePayload?.data ||
            null;

          const currentUser =
            profileUser ||
            (getCurrentUser() as
              | ProfileUser
              | null);

          if (!currentUser) {
            throw new Error(
              "Impossible de récupérer les informations du profil.",
            );
          }

          syncUser(
            currentUser,
          );

          const reservationEndpoint =
            hasRole(
              currentUser,
              "intervenant",
            )
              ? "reservation/intervenant"
              : "reservation/client";

          const [
            loadedReservations,
            loadedPayments,
          ] = await Promise.all([
            loadOptionalArray<Reservation>(
              [
                reservationEndpoint,
              ],
            ),

            loadOptionalArray<Payment>(
              [
                "my-payments",
              ],
            ),
          ]);

          if (
            hasRole(
              currentUser,
              "intervenant",
            )
          ) {
            await loadCoachCredentials(
              currentUser,
            );
          } else {
            setExistingDocuments(
              getDocumentsFromProfile(
                currentUser,
              ),
            );
          }

          setReservations(
            loadedReservations,
          );

          setPayments(
            loadedPayments,
          );
        } catch (loadError) {
          const message =
            loadError instanceof
            Error
              ? loadError.message
              : "Impossible de charger le profil.";

          setError(message);

          if (
            message.includes(
              "Session expirée",
            )
          ) {
            router.replace(
              "/auth/login",
            );
          }
        } finally {
          setLoading(false);
        }
      },
      [
        loadCoachCredentials,
        loadOptionalArray,
        router,
        syncUser,
      ],
    );

  const refreshStripeStatus =
    useCallback(
      async (): Promise<void> => {
        try {
          setStripeChecking(
            true,
          );

          setError("");
          setSuccess("");

          const result =
            await apiGet<StripeConnectStatusResponse>(
              "stripe/connect/status",
            );

          setUser(
            (
              currentUser,
            ) => {
              if (
                !currentUser
              ) {
                return currentUser;
              }

              const updatedUser:
                ProfileUser = {
                ...currentUser,

                stripe_account_id:
                  result.stripe_account_id ??
                  currentUser.stripe_account_id ??
                  null,

                stripe_onboarding_completed:
                  Boolean(
                    result.onboarding_completed,
                  ),
              };

              updateCurrentUser(
                updatedUser,
              );

              return updatedUser;
            },
          );

          if (
            result.onboarding_completed
          ) {
            setSuccess(
              "Paiements Stripe activés. Votre compte peut recevoir des reversements.",
            );
          } else {
            setError(
              "Votre compte Stripe existe, mais l’activation n’est pas encore terminée.",
            );
          }
        } catch (stripeError) {
          setError(
            stripeError instanceof
            Error
              ? stripeError.message
              : "Impossible de vérifier le statut Stripe.",
          );
        } finally {
          setStripeChecking(
            false,
          );
        }
      },
      [],
    );

  /* =======================================================
     CHARGEMENT INITIAL
  ======================================================= */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token =
        getToken();

      const localUser =
        getCurrentUser() as
          | ProfileUser
          | null;

      if (!token) {
        router.replace(
          "/auth/login",
        );

        return;
      }

      if (localUser) {
        setUser(localUser);
      }

      void loadProfile();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    loadProfile,
    router,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const searchParams =
        new URLSearchParams(
          window.location.search,
        );

      const stripeReturn =
        searchParams.get(
          "stripe",
        );

      if (
        stripeReturn ===
        "success"
      ) {
        setSuccess(
          "Retour Stripe réussi. Vérification du compte en cours…",
        );

        void refreshStripeStatus();
      }

      if (
        stripeReturn ===
        "refresh"
      ) {
        setError(
          "Le lien Stripe a expiré. Relancez l’activation des paiements.",
        );
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    refreshStripeStatus,
  ]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const timer = window.setTimeout(() => {
      setName(
        user.name || "",
      );

    setEmail(
      user.email || "",
    );

    setPhone(
      user.phone || "",
    );

    setAddress(
      user.address || "",
    );

    setBio(
      user.bio || "",
    );

    setCity(
      user.city || "",
    );

    setLocation(
      user.location || "",
    );

    setCompanyName(
      user.company_name || "",
    );

    setSiret(
      user.siret || "",
    );

    setCoachTitle(
      user.coach_title || "",
    );

    setCoachShortDescription(
      user.coach_short_description ||
        "",
    );

    setCoachSpeciality(
      user.coach_speciality ||
        "",
    );

    setCoachExperienceYears(
      toInputValue(
        user.coach_experience_years,
      ),
    );

    setCoachCertifications(
      toInputValue(
        user.coach_certifications,
      ),
    );

    setCoachLanguages(
      toInputValue(
        user.coach_languages,
      ),
    );

    setPhotoPreview(
      getUserPhoto(user),
    );

    setCoverPreview(
      getUserCover(user),
    );

    setPresentationVideoPreview(
      getUserVideo(user),
    );

    const duration =
      Number(
        user.presentation_video_duration_seconds,
      );

      setPresentationVideoDuration(
        Number.isFinite(
          duration,
        ) &&
          duration > 0
          ? duration
          : null,
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    return () => {
      if (
        photoObjectUrlRef.current
      ) {
        URL.revokeObjectURL(
          photoObjectUrlRef.current,
        );
      }

      if (
        coverObjectUrlRef.current
      ) {
        URL.revokeObjectURL(
          coverObjectUrlRef.current,
        );
      }

      if (
        videoObjectUrlRef.current
      ) {
        URL.revokeObjectURL(
          videoObjectUrlRef.current,
        );
      }
    };
  }, []);

  /* =======================================================
     FICHIERS
  ======================================================= */

  function validateImage(
    file: File,
  ): string | null {
    if (
      !file.type.startsWith(
        "image/",
      )
    ) {
      return "Le fichier sélectionné doit être une image.";
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      return `L’image ne doit pas dépasser ${formatBytes(
        MAX_IMAGE_SIZE,
      )}.`;
    }

    return null;
  }

  function handlePhotoChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ): void {
    const file =
      event.target
        .files?.[0];

    event.target.value =
      "";

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    const validationError =
      validateImage(file);

    if (validationError) {
      setError(
        validationError,
      );

      return;
    }

    if (
      photoObjectUrlRef.current
    ) {
      URL.revokeObjectURL(
        photoObjectUrlRef.current,
      );
    }

    const objectUrl =
      URL.createObjectURL(
        file,
      );

    photoObjectUrlRef.current =
      objectUrl;

    setPhotoFile(file);
    setPhotoPreview(
      objectUrl,
    );
  }

  function handleCoverChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ): void {
    const file =
      event.target
        .files?.[0];

    event.target.value =
      "";

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    const validationError =
      validateImage(file);

    if (validationError) {
      setError(
        validationError,
      );

      return;
    }

    if (
      coverObjectUrlRef.current
    ) {
      URL.revokeObjectURL(
        coverObjectUrlRef.current,
      );
    }

    const objectUrl =
      URL.createObjectURL(
        file,
      );

    coverObjectUrlRef.current =
      objectUrl;

    setCoverFile(file);

    setCoverPreview(
      objectUrl,
    );
  }

  async function handlePresentationVideoChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file =
      event.target
        .files?.[0];

    event.target.value =
      "";

    setError("");
    setSuccess("");

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "video/",
      )
    ) {
      setError(
        "Le fichier choisi doit être une vidéo.",
      );

      return;
    }

    if (
      file.size >
      MAX_VIDEO_SIZE
    ) {
      setError(
        `La vidéo ne doit pas dépasser ${formatBytes(
          MAX_VIDEO_SIZE,
        )}.`,
      );

      return;
    }

    try {
      const duration =
        await getVideoDuration(
          file,
        );

      if (
        duration >
        MAX_VIDEO_DURATION_SECONDS +
          0.5
      ) {
        setError(
          `La vidéo de présentation doit durer ${MAX_VIDEO_DURATION_SECONDS} secondes maximum.`,
        );

        return;
      }

      if (
        videoObjectUrlRef.current
      ) {
        URL.revokeObjectURL(
          videoObjectUrlRef.current,
        );
      }

      const objectUrl =
        URL.createObjectURL(
          file,
        );

      videoObjectUrlRef.current =
        objectUrl;

      setPresentationVideoFile(
        file,
      );

      setPresentationVideoPreview(
        objectUrl,
      );

      setPresentationVideoDuration(
        Math.round(
          duration,
        ),
      );
    } catch (videoError) {
      setError(
        videoError instanceof
        Error
          ? videoError.message
          : "Impossible de vérifier la vidéo.",
      );
    }
  }

  /* =======================================================
     DOCUMENTS DU COACH
  ======================================================= */

  async function handleRemoveExistingDocument(
    document:
      ExistingDocument,
  ): Promise<void> {
    try {
      setError("");
      setSuccess("");

      await apiDelete<DeleteDocumentResponse>(
        `coach/credentials/${document.id}`,
      );

      setExistingDocuments(
        (
          currentDocuments,
        ) =>
          currentDocuments.filter(
            (item) =>
              String(
                item.id,
              ) !==
              String(
                document.id,
              ),
          ),
      );

      setSuccess(
        "Le document professionnel a été supprimé.",
      );
    } catch (deleteError) {
      const message =
        deleteError instanceof
        Error
          ? deleteError.message
          : "Le document n’a pas pu être supprimé.";

      setError(message);

      throw deleteError;
    }
  }

  async function uploadCoachCredentials(
    files: File[],
  ): Promise<void> {
    for (
      const file
      of files
    ) {
      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      formData.append(
        "document_type",
        inferProfessionalDocumentType(
          file,
        ),
      );

      await apiPostForm<CredentialUploadResponse>(
        "coach/credentials",
        formData,
      );
    }
  }

  /* =======================================================
     ENREGISTREMENT DU PROFIL
  ======================================================= */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setSuccess("");
    setDocumentError("");

    const cleanName =
      name.trim();

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    const cleanSiret =
      siret.replace(
        /\D/g,
        "",
      );

    if (!cleanName) {
      setError(
        "Le nom complet est obligatoire.",
      );

      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail,
      )
    ) {
      setError(
        "Indiquez une adresse email valide.",
      );

      return;
    }

    if (
      isIntervenantAccount &&
      cleanSiret &&
      cleanSiret.length !==
        14
    ) {
      setError(
        "Le numéro SIRET doit contenir exactement 14 chiffres.",
      );

      return;
    }

    if (
      coachExperienceYears &&
      Number(
        coachExperienceYears,
      ) < 0
    ) {
      setError(
        "Le nombre d’années d’expérience ne peut pas être négatif.",
      );

      return;
    }

    try {
      setSaving(true);

      const formData =
        new FormData();

      formData.append(
        "name",
        cleanName,
      );

      formData.append(
        "email",
        cleanEmail,
      );

      formData.append(
        "phone",
        phone.trim(),
      );

      formData.append(
        "address",
        address.trim(),
      );

      formData.append(
        "bio",
        bio.trim(),
      );

      formData.append(
        "city",
        city.trim(),
      );

      formData.append(
        "location",
        location.trim(),
      );

      if (
        isIntervenantAccount
      ) {
        formData.append(
          "company_name",
          companyName.trim(),
        );

        formData.append(
          "siret",
          cleanSiret,
        );

        formData.append(
          "coach_title",
          coachTitle.trim(),
        );

        formData.append(
          "coach_short_description",
          coachShortDescription.trim(),
        );

        formData.append(
          "coach_speciality",
          coachSpeciality.trim(),
        );

        formData.append(
          "coach_experience_years",
          coachExperienceYears.trim(),
        );

        formData.append(
          "coach_certifications",
          coachCertifications.trim(),
        );

        formData.append(
          "coach_languages",
          coachLanguages.trim(),
        );
      }

      if (photoFile) {
        formData.append(
          "photo",
          photoFile,
        );
      }

      if (coverFile) {
        formData.append(
          "cover_photo",
          coverFile,
        );
      }

      if (
        presentationVideoFile
      ) {
        formData.append(
          "presentation_video",
          presentationVideoFile,
        );

        if (
          presentationVideoDuration !==
          null
        ) {
          formData.append(
            "presentation_video_duration_seconds",
            String(
              presentationVideoDuration,
            ),
          );
        }
      }

      const result =
        await apiPostForm<ProfileUpdateResponse>(
          "profile/update",
          formData,
        );

      if (
        isIntervenantAccount &&
        newDocuments.length >
          0
      ) {
        await uploadCoachCredentials(
          newDocuments,
        );
      }

      const updatedUser =
        result.user ||
        result.data;

      if (updatedUser) {
        syncUser(
          updatedUser,
        );
      }

      if (
        isIntervenantAccount
      ) {
        await loadCoachCredentials(
          updatedUser ||
            user,
        );
      }

      if (!updatedUser) {
        await loadProfile();
      }

      setPhotoFile(null);
      setCoverFile(null);

      setPresentationVideoFile(
        null,
      );

      setNewDocuments([]);

      setSuccess(
        result.message ||
          "Profil mis à jour avec succès.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof
        Error
          ? saveError.message
          : "Impossible de mettre à jour le profil.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     STRIPE
  ======================================================= */

  async function handleStripeConnect(): Promise<void> {
    if (stripeLoading) {
      return;
    }

    try {
      setStripeLoading(
        true,
      );

      setError("");
      setSuccess("");

      const result =
        await apiPost<StripeConnectResponse>(
          "stripe/connect/onboarding",
        );

      if (!result?.url) {
        throw new Error(
          "Lien Stripe Connect introuvable.",
        );
      }

      window.location.assign(
        result.url,
      );
    } catch (stripeError) {
      setError(
        stripeError instanceof
        Error
          ? stripeError.message
          : "Impossible de générer le lien Stripe Connect.",
      );

      setStripeLoading(
        false,
      );
    }
  }

  function handleLogout(): void {
    clearAuth();

    router.replace(
      "/auth/login",
    );

    router.refresh();
  }

  /* =======================================================
     CHARGEMENT
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 px-4 py-32 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-28">
          <div
            role="status"
            className="flex items-center gap-3 rounded-3xl border border-orange-100 bg-white px-6 py-5 text-sm font-black text-orange-700 shadow-xl shadow-orange-500/10"
          >
            <Loader2
              aria-hidden="true"
              className="animate-spin"
              size={20}
            />

            Chargement du profil…
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 px-4 py-24 text-slate-950 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-black text-orange-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50"
          >
            <ArrowLeft
              aria-hidden="true"
              size={17}
            />

            Retour vers l’accueil
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-black text-red-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-50"
          >
            <LogOut
              aria-hidden="true"
              size={17}
            />

            Déconnexion
          </button>
        </div>

        <div
          aria-live="polite"
          aria-atomic="true"
        >
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold leading-6 text-red-700 shadow-sm"
            >
              <X
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                size={18}
              />

              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-5 flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold leading-6 text-emerald-700 shadow-sm"
            >
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                size={18}
              />

              <span>{success}</span>
            </div>
          )}
        </div>

        {/* En-tête du profil */}

        <section className="overflow-hidden rounded-[2.5rem] border border-white bg-white shadow-[0_28px_90px_rgba(249,115,22,0.16)]">
          <div
            className="relative h-56 bg-orange-200 sm:h-64"
            style={
              coverPreview
                ? {
                    backgroundImage:
                      `url("${coverPreview}")`,

                    backgroundSize:
                      "cover",

                    backgroundPosition:
                      "center",
                  }
                : {
                    background:
                      FALLBACK_COVER,
                  }
            }
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-orange-950/10" />

            <label className="absolute right-5 top-5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/50 bg-white/95 px-4 py-2 text-sm font-black text-orange-700 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-white">
              <Camera
                aria-hidden="true"
                size={17}
              />

              Modifier la couverture

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handleCoverChange
                }
                disabled={saving}
                className="sr-only"
              />
            </label>
          </div>

          <div className="px-5 pb-8 sm:px-8">
            <div className="-mt-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-[2rem] border-4 border-white bg-orange-100 shadow-2xl">
                  {photoPreview ? (
                    <img
                      src={
                        photoPreview
                      }
                      alt={
                        user?.name ||
                        "Photo de profil"
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700">
                      <UserRound
                        aria-hidden="true"
                        size={42}
                      />
                    </div>
                  )}

                  <label className="absolute bottom-2 right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-orange-700 shadow-lg transition hover:scale-105 hover:bg-orange-50">
                    <Camera
                      aria-hidden="true"
                      size={18}
                    />

                    <span className="sr-only">
                      Modifier la photo de profil
                    </span>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        handlePhotoChange
                      }
                      disabled={
                        saving
                      }
                      className="sr-only"
                    />
                  </label>
                </div>

                <div className="pb-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white">
                      {mainRole}
                    </span>

                    {user?.account_status && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(
                          user.account_status,
                        )}`}
                      >
                        {getStatusLabel(
                          user.account_status,
                        )}
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    {user?.name ||
                      "Utilisateur Gotfit"}
                  </h1>

                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    Membre depuis{" "}

                    {formatDate(
                      user?.created_at,
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {hasRole(
                  user,
                  "client",
                ) && (
                  <>
                    <Link
                      href="/parcours-client"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      <CalendarCheck
                        aria-hidden="true"
                        size={18}
                      />

                      Parcours client
                    </Link>

                    <Link
                      href="/onboarding"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-100 bg-white px-5 py-3 text-sm font-black text-orange-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50"
                    >
                      <BadgeCheck
                        aria-hidden="true"
                        size={18}
                      />

                      Bilan de forme
                    </Link>
                  </>
                )}

                <Link
                  href={getDashboardUrl(
                    user,
                  )}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700"
                >
                  <ShieldCheck
                    aria-hidden="true"
                    size={18}
                  />

                  Mon espace
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
          {/* Formulaire */}

          <form
            onSubmit={
              handleSubmit
            }
            aria-busy={saving}
            className="rounded-[2rem] border border-orange-100 bg-white p-5 shadow-xl shadow-orange-500/5 sm:p-7"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                  Mon profil
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  Informations personnelles
                </h2>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Maintenez vos informations à
                  jour pour améliorer votre
                  expérience Gotfit.
                </p>
              </div>

              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                <Pencil
                  aria-hidden="true"
                  size={20}
                />
              </span>
            </div>

            <div className="grid gap-5">
              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Nom complet
                </label>

                <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 transition focus-within:border-orange-500 focus-within:bg-white">
                  <UserRound
                    aria-hidden="true"
                    size={18}
                    className="shrink-0 text-orange-500"
                  />

                  <input
                    id="profile-name"
                    name="name"
                    value={name}
                    onChange={(
                      event,
                    ) =>
                      setName(
                        event
                          .target
                          .value,
                      )
                    }
                    disabled={saving}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    placeholder="Nom complet"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="profile-email"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Adresse email
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 transition focus-within:border-orange-500 focus-within:bg-white">
                    <Mail
                      aria-hidden="true"
                      size={18}
                      className="shrink-0 text-orange-500"
                    />

                    <input
                      id="profile-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(
                        event,
                      ) =>
                        setEmail(
                          event
                            .target
                            .value,
                        )
                      }
                      disabled={
                        saving
                      }
                      className="w-full bg-transparent text-sm font-semibold outline-none"
                      placeholder="email@exemple.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="profile-phone"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Téléphone
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 transition focus-within:border-orange-500 focus-within:bg-white">
                    <Phone
                      aria-hidden="true"
                      size={18}
                      className="shrink-0 text-orange-500"
                    />

                    <input
                      id="profile-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(
                        event,
                      ) =>
                        setPhone(
                          event
                            .target
                            .value,
                        )
                      }
                      disabled={
                        saving
                      }
                      className="w-full bg-transparent text-sm font-semibold outline-none"
                      placeholder="+33 6 00 00 00 00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-address"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Adresse
                </label>

                <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 transition focus-within:border-orange-500 focus-within:bg-white">
                  <MapPin
                    aria-hidden="true"
                    size={18}
                    className="shrink-0 text-orange-500"
                  />

                  <input
                    id="profile-address"
                    name="address"
                    autoComplete="street-address"
                    value={address}
                    onChange={(
                      event,
                    ) =>
                      setAddress(
                        event
                          .target
                          .value,
                      )
                    }
                    disabled={saving}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    placeholder="Adresse complète"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="profile-city"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Ville
                  </label>

                  <input
                    id="profile-city"
                    name="city"
                    autoComplete="address-level2"
                    value={city}
                    onChange={(
                      event,
                    ) =>
                      setCity(
                        event
                          .target
                          .value,
                      )
                    }
                    disabled={saving}
                    className="w-full rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-orange-500 focus:bg-white"
                    placeholder="Paris"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-location"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Localisation affichée
                  </label>

                  <input
                    id="profile-location"
                    name="location"
                    value={
                      location
                    }
                    onChange={(
                      event,
                    ) =>
                      setLocation(
                        event
                          .target
                          .value,
                      )
                    }
                    disabled={saving}
                    className="w-full rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-orange-500 focus:bg-white"
                    placeholder="Paris, Île-de-France, En ligne…"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-bio"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Présentation
                </label>

                <textarea
                  id="profile-bio"
                  name="bio"
                  value={bio}
                  onChange={(
                    event,
                  ) =>
                    setBio(
                      event
                        .target
                        .value,
                    )
                  }
                  rows={5}
                  disabled={saving}
                  className="w-full resize-none rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold leading-6 outline-none transition focus:border-orange-500 focus:bg-white"
                  placeholder="Présentez-vous en quelques lignes…"
                />
              </div>

              {/* Profil coach */}

              {isIntervenantAccount && (
                <section className="rounded-[2rem] border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4 sm:p-6">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                        Espace professionnel
                      </p>

                      <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                        Profil coach
                      </h3>

                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                        Ces informations seront
                        visibles par les coachés
                        sur votre fiche publique.
                      </p>
                    </div>

                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-700 shadow-sm">
                      <BadgeCheck
                        aria-hidden="true"
                        size={20}
                      />
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="company-name"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        Nom de l’activité
                      </label>

                      <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white px-4 py-3">
                        <Building2
                          aria-hidden="true"
                          size={18}
                          className="shrink-0 text-orange-500"
                        />

                        <input
                          id="company-name"
                          name="company_name"
                          value={
                            companyName
                          }
                          onChange={(
                            event,
                          ) =>
                            setCompanyName(
                              event
                                .target
                                .value,
                            )
                          }
                          disabled={
                            saving
                          }
                          className="w-full bg-transparent text-sm font-semibold outline-none"
                          placeholder="Nom de l’entreprise ou activité"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="coach-siret"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        Numéro SIRET
                      </label>

                      <input
                        id="coach-siret"
                        name="siret"
                        value={siret}
                        onChange={(
                          event,
                        ) =>
                          setSiret(
                            event
                              .target
                              .value
                              .replace(
                                /\D/g,
                                "",
                              )
                              .slice(
                                0,
                                14,
                              ),
                          )
                        }
                        inputMode="numeric"
                        maxLength={14}
                        disabled={
                          saving
                        }
                        className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-orange-500"
                        placeholder="12345678900012"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="coach-title"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        Titre professionnel
                      </label>

                      <input
                        id="coach-title"
                        name="coach_title"
                        value={
                          coachTitle
                        }
                        onChange={(
                          event,
                        ) =>
                          setCoachTitle(
                            event
                              .target
                              .value,
                          )
                        }
                        disabled={
                          saving
                        }
                        className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-orange-500"
                        placeholder="Coach sportif, Professeur de yoga…"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="coach-speciality"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        Spécialité principale
                      </label>

                      <input
                        id="coach-speciality"
                        name="coach_speciality"
                        value={
                          coachSpeciality
                        }
                        onChange={(
                          event,
                        ) =>
                          setCoachSpeciality(
                            event
                              .target
                              .value,
                          )
                        }
                        disabled={
                          saving
                        }
                        className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-orange-500"
                        placeholder="Fitness, Pilates, Nutrition…"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="coach-experience"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        Années d’expérience
                      </label>

                      <input
                        id="coach-experience"
                        name="coach_experience_years"
                        type="number"
                        min={0}
                        max={80}
                        value={
                          coachExperienceYears
                        }
                        onChange={(
                          event,
                        ) =>
                          setCoachExperienceYears(
                            event
                              .target
                              .value,
                          )
                        }
                        disabled={
                          saving
                        }
                        className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-orange-500"
                        placeholder="5"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="coach-languages"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        Langues parlées
                      </label>

                      <input
                        id="coach-languages"
                        name="coach_languages"
                        value={
                          coachLanguages
                        }
                        onChange={(
                          event,
                        ) =>
                          setCoachLanguages(
                            event
                              .target
                              .value,
                          )
                        }
                        disabled={
                          saving
                        }
                        className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-orange-500"
                        placeholder="Français, Anglais…"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="coach-short-description"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        Description courte
                      </label>

                      <textarea
                        id="coach-short-description"
                        name="coach_short_description"
                        value={
                          coachShortDescription
                        }
                        onChange={(
                          event,
                        ) =>
                          setCoachShortDescription(
                            event
                              .target
                              .value,
                          )
                        }
                        rows={3}
                        maxLength={
                          500
                        }
                        disabled={
                          saving
                        }
                        className="w-full resize-none rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none transition focus:border-orange-500"
                        placeholder="Résumé affiché sur les cartes des coachs."
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="coach-certifications"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        Certifications textuelles
                      </label>

                      <textarea
                        id="coach-certifications"
                        name="coach_certifications"
                        value={
                          coachCertifications
                        }
                        onChange={(
                          event,
                        ) =>
                          setCoachCertifications(
                            event
                              .target
                              .value,
                          )
                        }
                        rows={3}
                        disabled={
                          saving
                        }
                        className="w-full resize-none rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none transition focus:border-orange-500"
                        placeholder="BPJEPS, Yoga Alliance, Pilates Reformer…"
                      />
                    </div>
                  </div>

                  {/* Documents */}

                  <div className="mt-6 rounded-[1.75rem] border border-orange-100 bg-white p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                        <FileBadge2
                          aria-hidden="true"
                          size={19}
                        />
                      </span>

                      <div>
                        <h4 className="text-sm font-black text-slate-900">
                          Diplômes et justificatifs
                        </h4>

                        <p className="text-xs font-semibold text-slate-500">
                          Ils seront vérifiés par
                          l’équipe Gotfit.
                        </p>
                      </div>
                    </div>

                    <DocumentUploader
                      files={
                        newDocuments
                      }
                      onFilesChange={
                        setNewDocuments
                      }
                      existingDocuments={
                        existingDocuments
                      }
                      onRemoveExistingDocument={
                        handleRemoveExistingDocument
                      }
                      label="Documents professionnels"
                      description="Ajoutez vos diplômes, certifications et justificatifs professionnels."
                      error={
                        documentError
                      }
                      onError={
                        setDocumentError
                      }
                      maxFiles={10}
                      disabled={
                        saving
                      }
                    />
                  </div>

                  {/* Vidéo */}

                  <div className="mt-6 rounded-[1.75rem] border border-orange-100 bg-white p-4 sm:p-5">
                    <label
                      htmlFor="presentation-video"
                      className="mb-3 flex items-center gap-2 text-sm font-black text-slate-800"
                    >
                      <Video
                        aria-hidden="true"
                        size={18}
                        className="text-orange-500"
                      />

                      Vidéo de présentation
                    </label>

                    <p className="mb-4 text-xs font-semibold leading-5 text-slate-500">
                      Formats vidéo standards,
                      maximum{" "}

                      {
                        MAX_VIDEO_DURATION_SECONDS
                      }{" "}

                      secondes et{" "}

                      {formatBytes(
                        MAX_VIDEO_SIZE,
                      )}
                      .
                    </p>

                    <input
                      id="presentation-video"
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={
                        handlePresentationVideoChange
                      }
                      disabled={
                        saving
                      }
                      className="w-full rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-orange-600 file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:file:bg-orange-700 disabled:opacity-60"
                    />

                    {presentationVideoDuration !==
                      null && (
                      <p className="mt-3 text-xs font-black text-orange-700">
                        Durée détectée :{" "}

                        {Math.round(
                          presentationVideoDuration,
                        )}
                        s /{" "}

                        {
                          MAX_VIDEO_DURATION_SECONDS
                        }
                        s
                      </p>
                    )}

                    {presentationVideoPreview && (
                      <div className="mt-4 overflow-hidden rounded-2xl bg-slate-950 p-2 shadow-lg">
                        <video
                          controls
                          preload="metadata"
                          src={
                            presentationVideoPreview
                          }
                          className="aspect-video w-full rounded-xl bg-black object-cover"
                        >
                          Votre navigateur ne prend pas en charge la vidéo.
                        </video>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:from-orange-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      aria-hidden="true"
                      size={18}
                      className="animate-spin"
                    />

                    Enregistrement…
                  </>
                ) : (
                  <>
                    <Save
                      aria-hidden="true"
                      size={18}
                    />

                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Colonne droite */}

          <aside className="grid content-start gap-6">
            {isIntervenantAccount && (
              <section className="rounded-[2rem] border border-orange-100 bg-white p-5 shadow-xl shadow-orange-500/5 sm:p-7">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                      Reversements
                    </p>

                    <h2 className="mt-1 text-2xl font-black tracking-tight">
                      Paiements Stripe
                    </h2>

                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                      Activez Stripe Connect pour
                      recevoir les paiements de
                      vos prestations.
                    </p>
                  </div>

                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                    <Wallet
                      aria-hidden="true"
                      size={21}
                    />
                  </span>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CreditCard
                        aria-hidden="true"
                        className="text-orange-500"
                        size={20}
                      />

                      <span className="text-sm font-bold text-slate-600">
                        Statut
                      </span>
                    </div>

                    <strong
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        stripeStatus ===
                        "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : stripeStatus ===
                              "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {stripeStatus ===
                      "active"
                        ? "Activé"
                        : stripeStatus ===
                            "pending"
                          ? "À compléter"
                          : "Non connecté"}
                    </strong>
                  </div>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                    {stripeStatus ===
                    "active"
                      ? "Votre compte est prêt à recevoir des reversements."
                      : stripeStatus ===
                          "pending"
                        ? "Stripe attend encore certaines informations."
                        : "Vous devez connecter un compte Stripe pour recevoir vos reversements."}
                  </p>
                </div>

                <div className="mt-4 grid gap-3">
                  {stripeStatus !==
                    "active" && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleStripeConnect()
                      }
                      disabled={
                        stripeLoading
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {stripeLoading ? (
                        <>
                          <Loader2
                            aria-hidden="true"
                            size={18}
                            className="animate-spin"
                          />

                          Ouverture de Stripe…
                        </>
                      ) : (
                        <>
                          <CreditCard
                            aria-hidden="true"
                            size={18}
                          />

                          {stripeStatus ===
                          "pending"
                            ? "Continuer l’activation"
                            : "Activer Stripe"}
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      void refreshStripeStatus()
                    }
                    disabled={
                      stripeChecking
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {stripeChecking ? (
                      <>
                        <Loader2
                          aria-hidden="true"
                          size={18}
                          className="animate-spin"
                        />

                        Vérification…
                      </>
                    ) : (
                      <>
                        <RefreshCw
                          aria-hidden="true"
                          size={18}
                        />

                        Vérifier le statut
                      </>
                    )}
                  </button>
                </div>
              </section>
            )}

            <section className="rounded-[2rem] border border-orange-100 bg-white p-5 shadow-xl shadow-orange-500/5 sm:p-7">
              <h2 className="mb-5 text-2xl font-black tracking-tight">
                Résumé du compte
              </h2>

              <div className="grid gap-3">
                <SummaryItem
                  icon={
                    UserRound
                  }
                  label="Type de compte"
                  value={
                    mainRole
                  }
                />

                <SummaryItem
                  icon={
                    CalendarCheck
                  }
                  label="Réservations"
                  value={String(
                    reservations.length,
                  )}
                />

                <SummaryItem
                  icon={
                    CreditCard
                  }
                  label="Paiements"
                  value={String(
                    paymentCount,
                  )}
                />

                <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 p-4 text-white shadow-lg shadow-orange-500/20">
                  <div className="flex items-center gap-3">
                    <Wallet
                      aria-hidden="true"
                      className="text-white/80"
                      size={20}
                    />

                    <span className="text-sm font-bold text-white/80">
                      Total payé
                    </span>
                  </div>

                  <strong className="text-sm font-black">
                    {formatMoney(
                      totalPaid,
                    )}
                  </strong>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-orange-100 bg-white p-5 shadow-xl shadow-orange-500/5 sm:p-7">
              <h2 className="mb-5 text-2xl font-black tracking-tight">
                Rôles et autorisations
              </h2>

              <div className="flex flex-wrap gap-2">
                {user?.roles?.length ? (
                  user.roles.map(
                    (role) => (
                      <span
                        key={
                          role.id ||
                          role.slug ||
                          role.name
                        }
                        className="rounded-full bg-orange-100 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-orange-700"
                      >
                        {role.name ||
                          role.slug}
                      </span>
                    ),
                  )
                ) : (
                  <span className="text-sm font-semibold text-slate-500">
                    Aucun rôle trouvé.
                  </span>
                )}
              </div>
            </section>
          </aside>
        </section>

        {/* Historiques */}

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <HistoryCard
            title="Réservations récentes"
            description="Vos dernières réservations Gotfit."
            icon={
              CalendarCheck
            }
          >
            <div className="grid gap-3">
              {reservations.length >
              0 ? (
                reservations
                  .slice(0, 5)
                  .map(
                    (
                      reservation,
                    ) => {
                      const title =
                        reservation
                          .annonce
                          ?.titre ||
                        reservation
                          .annonce
                          ?.title ||
                        reservation
                          .annonce
                          ?.name ||
                        `Réservation #${reservation.id}`;

                      const status =
                        reservation.status ||
                        reservation.reservation_status;

                      const amount =
                        reservation.total_client_amount ??
                        reservation.amount ??
                        reservation.total ??
                        reservation.price ??
                        reservation
                          .annonce
                          ?.price;

                      const visioSessionId =
                        getReservationVisioSessionId(
                          reservation,
                        );

                      return (
                        <div
                          key={
                            reservation.id
                          }
                          className="rounded-2xl border border-orange-100 bg-orange-50 p-4 transition hover:border-orange-200 hover:bg-orange-100/60"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <strong className="block text-sm font-black text-slate-950">
                                {
                                  title
                                }
                              </strong>

                              <span className="mt-1 block text-xs font-semibold text-slate-500">
                                {formatDateTime(
                                  reservation.date ||
                                    reservation.start_at ||
                                    reservation.created_at,
                                )}
                              </span>
                            </div>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(
                                status,
                              )}`}
                            >
                              {getStatusLabel(
                                status,
                              )}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-sm font-black text-slate-950">
                              {formatMoney(
                                amount,
                                reservation.currency ||
                                  "EUR",
                              )}
                            </div>

                            {canAccessReservationVisio(
                              reservation,
                            ) &&
                              visioSessionId !==
                                null && (
                                <Link
                                  href={`/visio/${encodeURIComponent(
                                    String(
                                      visioSessionId,
                                    ),
                                  )}`}
                                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800"
                                >
                                  <Video
                                    aria-hidden="true"
                                    size={15}
                                  />
                                  Accéder à la visio
                                </Link>
                              )}

                            {isReservationPaid(
                              reservation,
                            ) &&
                              visioSessionId ===
                                null && (
                                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-xs font-black text-amber-700">
                                  <Video
                                    aria-hidden="true"
                                    size={15}
                                  />
                                  Visio en préparation
                                </span>
                              )}
                          </div>
                        </div>
                      );
                    },
                  )
              ) : (
                <EmptyState message="Aucune réservation trouvée." />
              )}
            </div>
          </HistoryCard>

          <HistoryCard
            title="Paiements récents"
            description="Historique des paiements liés au compte."
            icon={
              CreditCard
            }
          >
            <div className="grid gap-3">
              {payments.length >
              0 ? (
                payments
                  .slice(0, 5)
                  .map(
                    (
                      payment,
                    ) => {
                      const amount =
                        payment.amount ??
                        payment.total;

                      const status =
                        payment.status ||
                        payment.payment_status;

                      return (
                        <div
                          key={
                            payment.id
                          }
                          className="rounded-2xl border border-orange-100 bg-orange-50 p-4 transition hover:border-orange-200 hover:bg-orange-100/60"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <strong className="block text-sm font-black text-slate-950">
                                Paiement #
                                {
                                  payment.id
                                }
                              </strong>

                              <span className="mt-1 block text-xs font-semibold text-slate-500">
                                {formatDateTime(
                                  payment.created_at,
                                )}
                              </span>
                            </div>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(
                                status,
                              )}`}
                            >
                              {getStatusLabel(
                                status,
                              )}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="text-sm font-black text-slate-950">
                              {formatMoney(
                                amount,
                              )}
                            </span>

                            {(payment.provider ||
                              payment.method) && (
                              <span className="text-xs font-bold text-slate-400">
                                {payment.provider ||
                                  payment.method}
                              </span>
                            )}
                          </div>

                          {payment.reference && (
                            <div className="mt-2 text-xs font-semibold text-slate-400">
                              Réf. :{" "}

                              {
                                payment.reference
                              }
                            </div>
                          )}
                        </div>
                      );
                    },
                  )
              ) : paidReservations.length >
                0 ? (
                paidReservations
                  .slice(0, 5)
                  .map(
                    (
                      reservation,
                    ) => (
                      <div
                        key={`reservation-payment-${reservation.id}`}
                        className="rounded-2xl border border-orange-100 bg-orange-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <strong className="block text-sm font-black text-slate-950">
                              {reservation
                                .annonce
                                ?.title ||
                                reservation
                                  .annonce
                                  ?.name ||
                                `Réservation #${reservation.id}`}
                            </strong>

                            <span className="mt-1 block text-xs font-semibold text-slate-500">
                              {formatDateTime(
                                reservation.paid_at ||
                                  reservation.created_at,
                              )}
                            </span>
                          </div>

                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                            Payé
                          </span>
                        </div>

                        <div className="mt-3 text-sm font-black text-slate-950">
                          {formatMoney(
                            reservation.total_client_amount ??
                              reservation.total ??
                              reservation.amount ??
                              reservation.price ??
                              reservation
                                .annonce
                                ?.price,
                          )}
                        </div>
                      </div>
                    ),
                  )
              ) : (
                <EmptyState message="Aucun paiement confirmé pour le moment." />
              )}
            </div>
          </HistoryCard>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   COMPOSANTS AUXILIAIRES
========================================================= */

type SummaryItemProps = {
  icon: typeof UserRound;
  label: string;
  value: string;
};

function SummaryItem({
  icon: Icon,
  label,
  value,
}: SummaryItemProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50 p-4">
      <div className="flex items-center gap-3">
        <Icon
          aria-hidden="true"
          className="text-orange-500"
          size={20}
        />

        <span className="text-sm font-bold text-slate-600">
          {label}
        </span>
      </div>

      <strong className="text-sm font-black">
        {value}
      </strong>
    </div>
  );
}

type HistoryCardProps = {
  title: string;
  description: string;
  icon: typeof CalendarCheck;
  children: ReactNode;
};

function HistoryCard({
  title,
  description,
  icon: Icon,
  children,
}: HistoryCardProps) {
  return (
    <section className="rounded-[2rem] border border-orange-100 bg-white p-5 shadow-xl shadow-orange-500/5 sm:p-7">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            {title}
          </h2>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {description}
          </p>
        </div>

        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <Icon
            aria-hidden="true"
            size={22}
          />
        </span>
      </div>

      {children}
    </section>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50 p-6 text-center text-sm font-semibold text-slate-500">
      {message}
    </div>
  );
}
