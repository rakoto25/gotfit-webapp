"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  HeartPulse,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
  Video,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getCurrentUser, getToken, hasRole } from "@/lib/auth";
import { getApiUrl, getNetworkErrorMessage } from "@/lib/api-config";
import {
  getCoachCertifications,
  getCoachDescription,
  getCoachExperience,
  getCoachLanguages,
  getCoachSpeciality,
  getCoachTitle,
  getIntervenantCover,
  getIntervenantPhoto,
  getIntervenantVideo,
  getLocation,
  getRating,
  getReviewsCount,
  getStatusLabel,
  getVideoDurationLabel,
  isPublicIntervenant,
  normalizeIntervenants,
  type ApiIntervenantsResponse,
  type Intervenant,
} from "@/lib/intervenants";
import {
  canReviewReservation,
  fetchClientReservations,
  fetchIntervenantReviews,
  formatDate,
  getAssetUrl,
  submitReservationReview,
  type Reservation,
  type Review,
} from "@/lib/marketplace";

function buildAuthUrl(targetUrl: string) {
  return `/auth/login?redirect=${encodeURIComponent(targetUrl)}`;
}

function buildReservationUrl(intervenant: Intervenant) {
  return `/reservation?intervenant_id=${intervenant.id}`;
}

function buildMessageUrl(intervenant: Intervenant) {
  return `/messages?user_id=${intervenant.id}`;
}

function getProtectedUrl(targetUrl: string) {
  return getToken() ? targetUrl : buildAuthUrl(targetUrl);
}

async function fetchJson<T>(endpoint: string, headers: HeadersInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(getApiUrl(endpoint), {
      method: "GET",
      headers,
      cache: "no-store",
    });
  } catch {
    throw new Error(getNetworkErrorMessage("charger les intervenants"));
  }

  const payload = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    const message =
      payload && !Array.isArray(payload) && typeof payload === "object"
        ? (payload as { message?: string }).message
        : undefined;

    throw new Error(message || `Erreur API intervenants : ${response.status}`);
  }

  return payload as T;
}

async function fetchIntervenantById(id: string): Promise<Intervenant | null> {
  const token = getToken();

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const detailPayload = await fetchJson<
      | ApiIntervenantsResponse
      | Intervenant[]
      | null
    >(`/intervenants/${id}`, headers);

    const items = normalizeIntervenants(detailPayload);
    const found = items.find((item) => String(item.id) === String(id));

    if (found && isPublicIntervenant(found)) {
      return found;
    }
  } catch {
    // L'API Laravel fournie ne declare pas toujours de route detail intervenant.
  }

  const payload = await fetchJson<
    | ApiIntervenantsResponse
    | Intervenant[]
    | null
  >("/intervenants", headers);

  return (
    normalizeIntervenants(payload).find(
      (item) => String(item.id) === String(id) && isPublicIntervenant(item)
    ) || null
  );
}

function InfoPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700">
      {children}
    </span>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getReviewRating(review: Review) {
  const rating = Number(review.rating);

  if (!Number.isFinite(rating)) {
    return 0;
  }

  return Math.min(5, Math.max(0, rating));
}

function getReviewAverage(reviews: Review[]) {
  if (!reviews.length) {
    return 0;
  }

  const total = reviews.reduce((sum, review) => sum + getReviewRating(review), 0);
  return total / reviews.length;
}

function getReviewerInitial(name?: string | null) {
  return (name || "Client").trim().charAt(0).toUpperCase() || "C";
}

function getReservationLabel(reservation: Reservation) {
  const title =
    reservation.annonce?.titre || reservation.annonce?.title || "Seance Gotfit";
  const date = formatDate(reservation.reservation_date);

  return `${title} - ${date}`;
}

function RatingStars({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;

        if (onChange) {
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              disabled={disabled}
              aria-label={`${star} etoile${star > 1 ? "s" : ""}`}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                active
                  ? "border-orange-200 bg-orange-100 text-orange-600"
                  : "border-slate-200 bg-white text-slate-300 hover:border-orange-200 hover:text-orange-500"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Star size={22} className={active ? "fill-orange-500" : ""} />
            </button>
          );
        }

        return (
          <Star
            key={star}
            size={18}
            className={active ? "fill-orange-500 text-orange-500" : "text-slate-300"}
          />
        );
      })}
    </div>
  );
}

export default function IntervenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = useMemo(() => {
    const rawId = params?.id;

    if (Array.isArray(rawId)) {
      return rawId[0];
    }

    return rawId || "";
  }, [params]);

  const [intervenant, setIntervenant] = useState<Intervenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [eligibleReservations, setEligibleReservations] = useState<Reservation[]>([]);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    async function loadIntervenant() {
      try {
        setLoading(true);
        setErrorMessage("");

        const item = await fetchIntervenantById(String(id));

        if (!mounted) return;

        if (!item) {
          setIntervenant(null);
          setErrorMessage("Cet intervenant est introuvable ou non disponible.");
          return;
        }

        setIntervenant(item);
      } catch (error) {
        if (mounted) {
          setIntervenant(null);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger le profil de cet intervenant pour le moment."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadIntervenant();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    async function loadReviews() {
      try {
        setReviewsLoading(true);
        setReviewsError("");

        const items = await fetchIntervenantReviews(String(id));

        if (mounted) {
          setReviews(items);
        }
      } catch (error) {
        if (mounted) {
          setReviews([]);
          setReviewsError(
            getErrorMessage(error, "Impossible de charger les avis de cet intervenant.")
          );
        }
      } finally {
        if (mounted) {
          setReviewsLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !getToken()) {
      const timer = window.setTimeout(() => {
        setEligibleReservations([]);
        setSelectedReservationId("");
      }, 0);

      return () => window.clearTimeout(timer);
    }

    const user = getCurrentUser();

    if (!hasRole(user, "client")) {
      const timer = window.setTimeout(() => {
        setEligibleReservations([]);
        setSelectedReservationId("");
      }, 0);

      return () => window.clearTimeout(timer);
    }

    let mounted = true;

    async function loadEligibleReservations() {
      try {
        setEligibilityLoading(true);

        const requestedReservationId = searchParams.get("reservation");
        const reservations = (await fetchClientReservations()).filter((reservation) => {
          const intervenantId =
            reservation.intervenant_id || reservation.intervenant?.id || null;

          return (
            String(intervenantId) === String(id) &&
            canReviewReservation(reservation)
          );
        });

        if (!mounted) return;

        setEligibleReservations(reservations);

        const requestedReservation = requestedReservationId
          ? reservations.find(
              (reservation) => String(reservation.id) === requestedReservationId
            )
          : null;

        setSelectedReservationId(
          String((requestedReservation || reservations[0])?.id || "")
        );
      } catch {
        if (mounted) {
          setEligibleReservations([]);
          setSelectedReservationId("");
        }
      } finally {
        if (mounted) {
          setEligibilityLoading(false);
        }
      }
    }

    loadEligibleReservations();

    return () => {
      mounted = false;
    };
  }, [id, searchParams]);

  async function reloadReviews() {
    if (!id) return;

    setReviews(await fetchIntervenantReviews(String(id)));
  }

  async function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedReservation = eligibleReservations.find(
      (reservation) => String(reservation.id) === selectedReservationId
    );

    if (!selectedReservation) {
      setReviewError("Selectionnez une reservation realisee pour laisser un avis.");
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError("La note doit etre comprise entre 1 et 5.");
      return;
    }

    const comment = reviewComment.trim();

    if (comment.length > 2000) {
      setReviewError("Le commentaire ne doit pas depasser 2000 caracteres.");
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError("");
      setReviewSuccess("");

      await submitReservationReview(selectedReservation.id, {
        rating: reviewRating,
        comment,
      });

      setReviewSuccess("Votre avis a bien ete enregistre.");
      setReviewComment("");
      setReviewRating(5);
      const remainingReservations = eligibleReservations.filter(
        (reservation) => reservation.id !== selectedReservation.id
      );
      setEligibleReservations(remainingReservations);
      setSelectedReservationId(String(remainingReservations[0]?.id || ""));
      await reloadReviews();
    } catch (error) {
      setReviewError(getErrorMessage(error, "Impossible d'enregistrer votre avis."));
    } finally {
      setReviewSubmitting(false);
    }
  }

  const photo = intervenant ? getIntervenantPhoto(intervenant) : "";
  const cover = intervenant ? getIntervenantCover(intervenant) : "";
  const video = intervenant ? getIntervenantVideo(intervenant) : "";
  const speciality = intervenant ? getCoachSpeciality(intervenant) : "";
  const coachTitle = intervenant ? getCoachTitle(intervenant) : "";
  const description = intervenant ? getCoachDescription(intervenant) : "";
  const location = intervenant ? getLocation(intervenant) : "";
  const rating = intervenant ? getRating(intervenant) : 0;
  const reviewsCount = intervenant ? getReviewsCount(intervenant) : 0;
  const experience = intervenant ? getCoachExperience(intervenant) : null;
  const certifications = intervenant ? getCoachCertifications(intervenant) : [];
  const languages = intervenant ? getCoachLanguages(intervenant) : [];
  const reservationUrl = intervenant ? buildReservationUrl(intervenant) : "/intervenants";
  const messageUrl = intervenant ? buildMessageUrl(intervenant) : "/intervenants";
  const currentUser = getCurrentUser();
  const isClient = hasRole(currentUser, "client");
  const liveReviewsCount = reviews.length || reviewsCount;
  const liveRating = reviews.length ? getReviewAverage(reviews) : rating;

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FFF7ED] pt-28 text-slate-950 sm:pt-32">
        <section className="px-4 pb-20">
          <div className="mx-auto max-w-7xl">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-5 py-3 text-sm font-black text-orange-700 shadow-sm transition hover:bg-orange-50"
            >
              <ArrowLeft size={18} />
              Retour
            </button>

            {loading ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-[2.5rem] bg-white shadow-sm">
                <div className="inline-flex items-center gap-3 rounded-3xl bg-orange-50 px-6 py-5 text-sm font-black text-orange-700">
                  <Loader2 className="animate-spin" size={20} />
                  Chargement du profil intervenant...
                </div>
              </div>
            ) : errorMessage || !intervenant ? (
              <div className="rounded-[2.5rem] bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                  <UserRound size={30} />
                </div>

                <h1 className="text-3xl font-black tracking-tight">
                  Profil introuvable
                </h1>

                <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-7 text-slate-500">
                  {errorMessage ||
                    "Le profil demandé n’existe pas ou n’est plus disponible."}
                </p>

                <Link
                  href="/intervenants"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-orange-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
                >
                  Voir tous les intervenants
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[2.5rem] border border-orange-100 bg-white shadow-[0_24px_90px_rgba(249,115,22,0.12)]">
                <div className="relative h-72 bg-gradient-to-br from-orange-100 via-orange-200 to-orange-500 sm:h-96">
                  {cover ? (
                    <img
                      src={cover}
                      alt={`Couverture ${intervenant.name || "intervenant"}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_34%)]" />
                      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
                      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-orange-700/20 blur-3xl" />
                    </>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />

                  <div className="absolute bottom-6 left-5 right-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                      <div className="h-32 w-32 overflow-hidden rounded-[2rem] border-4 border-white bg-orange-100 shadow-xl">
                        {photo ? (
                          <img
                            src={photo}
                            alt={intervenant.name || "Intervenant Gotfit"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-orange-700">
                            <UserRound size={54} />
                          </div>
                        )}
                      </div>

                      <div className="text-white">
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-orange-700 shadow-sm backdrop-blur">
                            <BadgeCheck size={15} />
                            {speciality}
                          </span>

                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-950/90 px-4 py-2 text-xs font-black text-white shadow-sm backdrop-blur">
                            <Star size={15} className="fill-white" />
                            {liveRating ? `${liveRating.toFixed(1)} / 5` : "Nouveau"}
                          </span>
                        </div>

                        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
                          {intervenant.name || "Intervenant Gotfit"}
                        </h1>

                        <p className="mt-3 text-base font-bold text-white/80">
                          {coachTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={getProtectedUrl(reservationUrl)}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
                      >
                        Réserver
                        <CalendarCheck size={18} />
                      </Link>

                      <Link
                        href={getProtectedUrl(messageUrl)}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-orange-50"
                      >
                        Contacter
                        <MessageCircle size={18} />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.9fr_1.6fr] lg:p-10">
                  <aside className="relative">
                    <div className="rounded-[2rem] border border-orange-100 bg-white p-5 shadow-xl lg:sticky lg:top-28">
                      <div className="text-center">
                        <p className="text-sm font-black uppercase tracking-[0.16em] text-orange-600">
                          {speciality}
                        </p>
                        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                          {coachTitle}
                        </h2>
                      </div>

                      <div className="mt-5 grid gap-3">
                        <div className="flex items-center gap-3 rounded-2xl bg-orange-50 p-4">
                          <MapPin className="shrink-0 text-orange-600" size={20} />
                          <span className="text-sm font-bold text-slate-600">
                            {location}
                          </span>
                        </div>

                        {intervenant.phone && (
                          <a
                            href={`tel:${intervenant.phone}`}
                            className="flex items-center gap-3 rounded-2xl bg-orange-50 p-4 transition hover:bg-orange-100"
                          >
                            <Phone className="shrink-0 text-orange-600" size={20} />
                            <span className="text-sm font-bold text-slate-600">
                              {intervenant.phone}
                            </span>
                          </a>
                        )}

                        {intervenant.email && (
                          <a
                            href={`mailto:${intervenant.email}`}
                            className="flex items-center gap-3 rounded-2xl bg-orange-50 p-4 transition hover:bg-orange-100"
                          >
                            <Mail className="shrink-0 text-orange-600" size={20} />
                            <span className="break-all text-sm font-bold text-slate-600">
                              {intervenant.email}
                            </span>
                          </a>
                        )}
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <Link
                          href={getProtectedUrl(reservationUrl)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
                        >
                          Réserver
                          <CalendarCheck size={17} />
                        </Link>

                        <Link
                          href={getProtectedUrl(messageUrl)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                        >
                          Contacter
                          <MessageCircle size={17} />
                        </Link>
                      </div>
                    </div>
                  </aside>

                  <section>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-3xl bg-orange-50 p-5">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-orange-600">
                          <Star size={22} className="fill-orange-500" />
                        </div>

                        <strong className="block text-3xl font-black">
                          {liveRating ? liveRating.toFixed(1) : "Nouveau"}
                        </strong>

                        <span className="mt-1 block text-sm font-bold text-slate-500">
                          {liveReviewsCount} avis client
                        </span>
                      </div>

                      <div className="rounded-3xl bg-orange-50 p-5">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-orange-600">
                          <HeartPulse size={22} />
                        </div>

                        <strong className="block text-2xl font-black">
                          {experience || "À compléter"}
                        </strong>

                        <span className="mt-1 block text-sm font-bold text-slate-500">
                          Expérience
                        </span>
                      </div>

                      <div className="rounded-3xl bg-orange-50 p-5">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-orange-600">
                          <ShieldCheck size={22} />
                        </div>

                        <strong className="block text-xl font-black">
                          Profil
                        </strong>

                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-orange-700">
                          <CheckCircle2 size={14} />
                          {getStatusLabel(intervenant.account_status)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
                      <span className="mb-4 inline-flex rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-700">
                        Présentation
                      </span>

                      <h2 className="text-3xl font-black tracking-tight">
                        À propos de {intervenant.name || "cet intervenant"}
                      </h2>

                      <p className="mt-5 whitespace-pre-line text-base font-semibold leading-8 text-slate-600">
                        {description}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <InfoPill>
                          <BadgeCheck size={14} />
                          {speciality}
                        </InfoPill>

                        {experience && (
                          <InfoPill>
                            <HeartPulse size={14} />
                            {experience}
                          </InfoPill>
                        )}

                        {video && (
                          <InfoPill>
                            <Video size={14} />
                            Vidéo disponible
                          </InfoPill>
                        )}
                      </div>
                    </div>

                    {video && (
                      <div className="mt-6 overflow-hidden rounded-[2rem] border border-orange-100 bg-slate-950 p-4 shadow-sm">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2 text-white">
                          <span className="inline-flex items-center gap-2 text-sm font-black">
                            <Video size={18} />
                            Vidéo de présentation
                          </span>
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/70">
                            {getVideoDurationLabel(intervenant)}
                          </span>
                        </div>

                        <video
                          controls
                          src={video}
                          className="aspect-video w-full rounded-[1.5rem] bg-black object-cover"
                        />
                      </div>
                    )}

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                      <div className="rounded-[2rem] border border-orange-100 bg-orange-50 p-6 sm:p-8">
                        <span className="mb-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-700">
                          Certifications
                        </span>

                        <div className="flex flex-wrap gap-2">
                          {certifications.length ? (
                            certifications.map((item) => (
                              <span
                                key={item}
                                className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700"
                              >
                                {item}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm font-semibold leading-7 text-slate-600">
                              Certifications à compléter dans le profil intervenant.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-[2rem] border border-orange-100 bg-orange-50 p-6 sm:p-8">
                        <span className="mb-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-700">
                          Langues
                        </span>

                        <div className="flex flex-wrap gap-2">
                          {languages.length ? (
                            languages.map((item) => (
                              <span
                                key={item}
                                className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700"
                              >
                                {item}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm font-semibold leading-7 text-slate-600">
                              Langues à compléter dans le profil intervenant.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div id="avis" className="mt-6 rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <span className="mb-4 inline-flex rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-700">
                            Avis clients
                          </span>
                          <h2 className="text-3xl font-black tracking-tight">
                            Retours sur {intervenant.name || "cet intervenant"}
                          </h2>
                          <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
                            Les avis affiches proviennent des reservations Gotfit
                            payees et realisees.
                          </p>
                        </div>

                        <div className="rounded-3xl bg-orange-50 px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Star size={20} className="fill-orange-500 text-orange-500" />
                            <strong className="text-2xl font-black">
                              {liveRating ? liveRating.toFixed(1) : "Nouveau"}
                            </strong>
                          </div>
                          <span className="mt-1 block text-xs font-black text-slate-500">
                            {liveReviewsCount} avis
                          </span>
                        </div>
                      </div>

                      <div className="mt-6">
                        {reviewsLoading ? (
                          <div className="flex items-center justify-center rounded-3xl bg-orange-50 py-10 text-sm font-black text-orange-700">
                            <Loader2 className="mr-3 animate-spin" size={18} />
                            Chargement des avis...
                          </div>
                        ) : reviewsError ? (
                          <div className="rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                            {reviewsError}
                          </div>
                        ) : reviews.length === 0 ? (
                          <div className="rounded-3xl bg-orange-50 px-5 py-6 text-sm font-bold leading-7 text-slate-600">
                            Aucun avis public pour le moment.
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {reviews.map((review) => {
                              const clientName = review.client?.name || "Client Gotfit";
                              const clientPhoto = getAssetUrl(
                                review.client?.photo_url || review.client?.photo
                              );

                              return (
                                <article
                                  key={review.id}
                                  className="rounded-3xl border border-orange-100 bg-orange-50 p-5"
                                >
                                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-sm font-black text-orange-700">
                                        {clientPhoto ? (
                                          <img
                                            src={clientPhoto}
                                            alt={clientName}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          getReviewerInitial(clientName)
                                        )}
                                      </div>
                                      <div>
                                        <strong className="block text-sm font-black text-slate-900">
                                          {clientName}
                                        </strong>
                                        <span className="text-xs font-bold text-slate-500">
                                          {formatDate(review.created_at)}
                                        </span>
                                      </div>
                                    </div>

                                    <RatingStars value={Math.round(getReviewRating(review))} />
                                  </div>

                                  {review.comment && (
                                    <p className="mt-4 whitespace-pre-line text-sm font-semibold leading-7 text-slate-600">
                                      {review.comment}
                                    </p>
                                  )}
                                </article>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 rounded-3xl border border-orange-100 bg-white p-5">
                        <h3 className="text-xl font-black tracking-tight">
                          Laisser un avis
                        </h3>

                        {!getToken() ? (
                          <div className="mt-4 rounded-3xl bg-orange-50 px-5 py-4 text-sm font-bold leading-7 text-slate-600">
                            Connectez-vous avec un compte client pour noter une
                            seance realisee avec cet intervenant.
                            <Link
                              href={buildAuthUrl(`/intervenants/${id}#avis`)}
                              className="mt-3 inline-flex items-center justify-center rounded-full bg-orange-600 px-5 py-3 text-sm font-black text-white"
                            >
                              Se connecter
                            </Link>
                          </div>
                        ) : !isClient ? (
                          <p className="mt-3 rounded-3xl bg-orange-50 px-5 py-4 text-sm font-bold leading-7 text-slate-600">
                            Seuls les clients peuvent laisser un avis apres une
                            reservation payee et realisee.
                          </p>
                        ) : eligibilityLoading ? (
                          <div className="mt-4 flex items-center rounded-3xl bg-orange-50 px-5 py-4 text-sm font-black text-orange-700">
                            <Loader2 className="mr-3 animate-spin" size={18} />
                            Verification des reservations eligibles...
                          </div>
                        ) : eligibleReservations.length === 0 ? (
                          <p className="mt-3 rounded-3xl bg-orange-50 px-5 py-4 text-sm font-bold leading-7 text-slate-600">
                            Vous pourrez laisser un avis ici apres une reservation
                            payee et marquee comme realisee avec ce coach.
                          </p>
                        ) : (
                          <form onSubmit={handleReviewSubmit} className="mt-5 grid gap-4">
                            {reviewError && (
                              <div className="rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                                {reviewError}
                              </div>
                            )}

                            {reviewSuccess && (
                              <div className="flex items-start gap-3 rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                                <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
                                {reviewSuccess}
                              </div>
                            )}

                            <label className="grid gap-2">
                              <span className="text-sm font-black text-slate-700">
                                Reservation concernee
                              </span>
                              <select
                                value={selectedReservationId}
                                onChange={(event) =>
                                  setSelectedReservationId(event.target.value)
                                }
                                disabled={reviewSubmitting}
                                className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-orange-300 focus:bg-white"
                              >
                                {eligibleReservations.map((reservation) => (
                                  <option key={reservation.id} value={reservation.id}>
                                    {getReservationLabel(reservation)}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <div className="grid gap-2">
                              <span className="text-sm font-black text-slate-700">
                                Note
                              </span>
                              <RatingStars
                                value={reviewRating}
                                onChange={setReviewRating}
                                disabled={reviewSubmitting}
                              />
                            </div>

                            <label className="grid gap-2">
                              <span className="text-sm font-black text-slate-700">
                                Commentaire
                              </span>
                              <textarea
                                value={reviewComment}
                                onChange={(event) => setReviewComment(event.target.value)}
                                rows={5}
                                maxLength={2000}
                                disabled={reviewSubmitting}
                                placeholder="Partagez votre experience avec ce coach..."
                                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none placeholder:text-slate-400 transition focus:border-orange-300 focus:bg-white"
                              />
                              <span className="text-right text-xs font-bold text-slate-400">
                                {reviewComment.length}/2000
                              </span>
                            </label>

                            <button
                              type="submit"
                              disabled={reviewSubmitting}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:opacity-60"
                            >
                              {reviewSubmitting ? (
                                <Loader2 className="animate-spin" size={18} />
                              ) : (
                                <Star size={18} />
                              )}
                              Publier mon avis
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
