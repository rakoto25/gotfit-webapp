"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
  UserSearch,
  Users,
  Wifi,
  X,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getCurrentUser, getToken } from "@/lib/auth";
import {
  Annonce,
  PaymentIntentPayload,
  Reservation,
  createPaymentIntent,
  fetchAnnonce,
  formatMinorMoney,
  formatMoney,
  getAnnonceDescription,
  getAnnonceTitle,
  getAssetUrl,
  getMaxParticipants,
  reserveAnnonce,
} from "@/lib/marketplace";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY)
  : null;

function isClientRequest(annonce: Annonce | null) {
  return annonce?.announcement_type === "client_request";
}

function getPublisherName(annonce: Annonce | null) {
  return (
    annonce?.intervenant?.display_name ||
    annonce?.user?.display_name ||
    annonce?.intervenant?.name ||
    annonce?.user?.name ||
    "Intervenant Gotfit"
  );
}

function getPriceLabel(annonce: Annonce | null) {
  if (isClientRequest(annonce)) {
    return Number(annonce?.price || 0) > 0
      ? `Budget ${formatMoney(annonce?.price)}`
      : "Budget à discuter";
  }

  return formatMoney(annonce?.price);
}

function getLocation(_annonce: Annonce | null) {
  return "Visio GotFit";
}

function getImage(annonce: Annonce | null) {
  return getAssetUrl(annonce?.image_url || annonce?.image);
}

const weekdayKeys = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function toLocalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getAvailableDates(annonce?: Annonce | null, horizonDays = 90) {
  const days = new Set((annonce?.available_days || []).map((day) => day.toLowerCase()));
  if (!days.size) return [];

  const result: string[] = [];
  const start = new Date();
  start.setHours(12, 0, 0, 0);

  for (let offset = 0; offset <= horizonDays; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    if (days.has(weekdayKeys[date.getDay()])) result.push(toLocalDateValue(date));
  }

  return result;
}

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function getAvailableStartTimes(annonce?: Annonce | null) {
  if (!annonce) return [];
  const duration = Math.max(15, Number(annonce.duration || 60));
  const result = new Set<string>();

  for (const rawRange of annonce.available_hours || []) {
    const [start, end] = String(rawRange).split("-");
    if (!/^\d{2}:\d{2}$/.test(start || "") || !/^\d{2}:\d{2}$/.test(end || "")) continue;
    const startMinutes = minutesFromTime(start);
    const endMinutes = minutesFromTime(end);
    for (let current = startMinutes; current + duration <= endMinutes; current += duration) {
      result.add(timeFromMinutes(current));
    }
  }

  return Array.from(result).sort();
}

function formatSlotDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function CheckoutForm({
  reservation,
  payment,
}: {
  reservation: Reservation;
  payment: PaymentIntentPayload;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  async function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!stripe || !elements || processing) return;

    try {
      setProcessing(true);
      setError("");

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH || ""}/reservations?payment=success&reservation=${reservation.id}`,
        },
      });

      if (result.error) {
        setError(result.error.message || "Paiement refusé.");
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handlePayment} className="grid gap-5">
      <div className="rounded-[1.5rem] border border-orange-100 bg-orange-50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.16em] text-orange-700">
              Montant à payer
            </span>
            <strong className="mt-1 block text-3xl font-black text-slate-950">
              {payment.amount_major !== undefined && payment.amount_major !== null
                ? formatMoney(payment.amount_major, payment.currency)
                : formatMinorMoney(
                    payment.amount_in_cents ?? payment.amount,
                    payment.currency
                  )}
            </strong>
            {Number(reservation.service_fee_amount || 0) > 0 && (
              <span className="mt-2 block text-xs font-bold text-orange-800">
                Prestation {formatMoney(reservation.price, payment.currency)} + frais de service{" "}
                {formatMoney(reservation.service_fee_amount, payment.currency)}
              </span>
            )}
          </div>
          <CreditCard className="text-orange-700" size={28} />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
        <PaymentElement />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {processing ? <Loader2 className="animate-spin" size={18} /> : null}
        Payer maintenant
      </button>
    </form>
  );
}

export default function AnnonceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const annonceId = params.id;

  const [annonce, setAnnonce] = useState<Annonce | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [payment, setPayment] = useState<PaymentIntentPayload | null>(null);

  const [reservationDate, setReservationDate] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const image = useMemo(() => getImage(annonce), [annonce]);
  const availableDates = useMemo(() => getAvailableDates(annonce), [annonce]);
  const availableStartTimes = useMemo(() => getAvailableStartTimes(annonce), [annonce]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReservationDate(availableDates[0] || "");
      setReservationTime(availableStartTimes[0] || "");
      setReservation(null);
      setPayment(null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [annonce?.id, availableDates, availableStartTimes]);

  useEffect(() => {
    async function loadAnnonce() {
      setCurrentUserId(getCurrentUser()?.id || null);
      try {
        setLoading(true);
        setError("");
        setAnnonce(await fetchAnnonce(annonceId));
      } catch (err) {
        setError(getErrorMessage(err, "Impossible de charger l’annonce."));
      } finally {
        setLoading(false);
      }
    }

    loadAnnonce();
  }, [annonceId]);

  async function handleReserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!getToken()) {
      const target = `/annonces/${annonceId}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(target)}`);
      return;
    }

    if (!reservationDate || !availableDates.includes(reservationDate)) {
      setError("Choisissez une date proposée par le coach.");
      return;
    }

    if (!reservationTime || !availableStartTimes.includes(reservationTime)) {
      setError("Choisissez un créneau proposé par le coach.");
      return;
    }

    if (submitting) return;

    try {
      setSubmitting(true);
      setError("");

      const createdReservation = await reserveAnnonce(annonceId, {
        reservation_date: reservationDate,
        reservation_time: reservationTime,
        note: note.trim(),
      });

      const intent = await createPaymentIntent(createdReservation.id);

      setReservation(createdReservation);
      setPayment(intent);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Impossible de créer la réservation ou le paiement."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FFF7ED] px-4 pb-16 pt-32 text-slate-950 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/annonces"
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-orange-700 shadow-sm transition hover:bg-orange-50"
          >
            <ArrowLeft size={17} />
            Retour aux annonces
          </Link>

          {loading && (
            <div className="flex items-center justify-center rounded-[2rem] bg-white py-16 text-sm font-black text-orange-700 shadow-sm">
              <Loader2 className="mr-3 animate-spin" size={20} />
              Chargement de l’annonce...
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-[2rem] border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              <X className="mt-0.5 shrink-0" size={18} />
              {error}
            </div>
          )}

          {!loading && annonce && (
            <div className="grid gap-7 lg:grid-cols-[1fr_430px]">
              <section className="overflow-hidden rounded-[2.5rem] bg-white shadow-[0_24px_80px_rgba(249,115,22,0.14)]">
                <div className="relative h-[360px] bg-gradient-to-br from-orange-100 to-amber-50">
                  {image ? (
                    <img
                      src={image}
                      alt={getAnnonceTitle(annonce)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-orange-700">
                      <Sparkles size={56} />
                    </div>
                  )}

                  <div className="absolute left-5 top-5 rounded-full bg-white/95 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-orange-700 shadow-sm">
                    {annonce.category || "Coaching"}
                  </div>

                  {isClientRequest(annonce) && (
                    <div className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm">
                      <UserSearch size={15} />
                      Recherche de coach
                    </div>
                  )}
                </div>

                <div className="p-6 sm:p-8">
                  <div className="mb-5 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-500">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2">
                      <UserRound size={16} />
                      {isClientRequest(annonce) ? "Client" : "Coach"} · {getPublisherName(annonce)}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2">
                      <MapPin size={16} />
                      {getLocation(annonce)}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2">
                      <Clock3 size={16} />
                      {annonce.duration || 60} min
                    </span>
                    {!isClientRequest(annonce) && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2">
                        <Users size={16} />
                        {getMaxParticipants(annonce)} coaché{getMaxParticipants(annonce) > 1 ? "s" : ""} max
                      </span>
                    )}
                    {annonce.is_online ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-white">
                        <Wifi size={16} />
                        En ligne
                      </span>
                    ) : null}
                  </div>

                  <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                    {getAnnonceTitle(annonce)}
                  </h1>

                  <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
                    {getAnnonceDescription(annonce) ||
                      (isClientRequest(annonce)
                        ? "Ce client Gotfit recherche un coach pour l’accompagner."
                        : "Cette prestation est proposée par un intervenant Gotfit validé.")}
                  </p>

                  {isClientRequest(annonce) ? (
                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-[1.5rem] bg-orange-50 p-5">
                        <UserSearch className="mb-3 text-orange-700" size={24} />
                        <strong className="block text-sm font-black">Besoin client</strong>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Une demande publiée directement par un membre Gotfit.</p>
                      </div>
                      <div className="rounded-[1.5rem] bg-orange-50 p-5">
                        <MessageCircle className="mb-3 text-orange-700" size={24} />
                        <strong className="block text-sm font-black">Contact direct</strong>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Les coachs peuvent proposer leur accompagnement par message.</p>
                      </div>
                      <div className="rounded-[1.5rem] bg-orange-50 p-5">
                        <BadgeCheck className="mb-3 text-orange-700" size={24} />
                        <strong className="block text-sm font-black">Annonce modérée</strong>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">La demande est publiée après validation Gotfit.</p>
                      </div>
                    </div>
                  ) : (
                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[1.5rem] bg-orange-50 p-5">
                      <ShieldCheck className="mb-3 text-orange-700" size={24} />
                      <strong className="block text-sm font-black">
                        Paiement protégé
                      </strong>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                        Gotfit sécurise le paiement jusqu’à la validation.
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] bg-orange-50 p-5">
                      <BadgeCheck className="mb-3 text-orange-700" size={24} />
                      <strong className="block text-sm font-black">
                        Coach validé
                      </strong>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                        Reversement via Stripe Connect après prestation.
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] bg-orange-50 p-5">
                      <Users className="mb-3 text-orange-700" size={24} />
                      <strong className="block text-sm font-black">
                        Litige possible
                      </strong>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                        Le client peut signaler un problème avant reversement.
                      </p>
                    </div>
                  </div>
                  )}
                </div>
              </section>

              <aside className="h-fit rounded-[2.5rem] bg-white p-5 shadow-[0_24px_80px_rgba(249,115,22,0.14)] sm:p-6 lg:sticky lg:top-28">
                {isClientRequest(annonce) && (
                  <div className="grid gap-5">
                    <div className="rounded-[1.7rem] bg-slate-950 p-5 text-white">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-orange-200">
                        Budget indicatif
                      </span>
                      <strong className="mt-1 block text-3xl font-black">
                        {getPriceLabel(annonce)}
                      </strong>
                      <p className="mt-2 text-xs font-semibold leading-5 text-white/55">
                        Les conditions peuvent être précisées directement avec le client.
                      </p>
                    </div>

                    {currentUserId === annonce.user_id ? (
                      <div className="rounded-[1.5rem] border border-orange-100 bg-orange-50 p-5 text-sm font-bold leading-6 text-orange-800">
                        C’est votre annonce. Les coachs intéressés peuvent vous contacter dans votre messagerie.
                      </div>
                    ) : (
                      <Link
                        href={
                          currentUserId
                            ? `/messages?user_id=${annonce.user_id}`
                            : `/auth/login?redirect=${encodeURIComponent(`/annonces/${annonce.id}`)}`
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700"
                      >
                        <MessageCircle size={18} />
                        {currentUserId ? "Contacter le client" : "Se connecter pour répondre"}
                      </Link>
                    )}

                    <p className="text-center text-xs font-semibold leading-5 text-slate-500">
                      Cette annonce est une recherche de coach et ne déclenche aucun paiement automatique.
                    </p>
                  </div>
                )}

                {!isClientRequest(annonce) && (
                  <>
                <div className="mb-5 rounded-[1.7rem] bg-slate-950 p-5 text-white">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-orange-200">
                    Prix prestation
                  </span>
                  <strong className="mt-1 block text-4xl font-black">
                    {formatMoney(annonce.price)}
                  </strong>
                  <p className="mt-2 text-xs font-semibold leading-5 text-white/55">
                    Des frais de service peuvent être ajoutés au paiement par la
                    plateforme.
                  </p>
                </div>

                {!payment && (
                  <>
                  <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-xs font-semibold leading-6 text-slate-600">
                    <strong className="block text-sm font-black text-slate-900">Créneaux du coach uniquement</strong>
                    Choisissez l’une des dates et heures proposées ci-dessous. Cette séance accepte jusqu’à {getMaxParticipants(annonce)} coaché{getMaxParticipants(annonce) > 1 ? "s" : ""} par créneau. Le prix et les frais applicables sont présentés avant le paiement Stripe.
                    <Link href="/aide#paiement" className="mt-2 block font-black text-orange-700">Comprendre le paiement</Link>
                  </div>
                  <form onSubmit={handleReserve} className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Date
                      </label>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <CalendarDays size={18} className="text-slate-400" />
                        <select
                          value={reservationDate}
                          onChange={(event) => setReservationDate(event.target.value)}
                          className="w-full bg-transparent text-sm font-semibold outline-none"
                          required
                          disabled={!availableDates.length}
                        >
                          {!availableDates.length && <option value="">Aucune date disponible</option>}
                          {availableDates.map((date) => (
                            <option key={date} value={date}>{formatSlotDate(date)}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Heure
                      </label>
                      <select
                        value={reservationTime}
                        onChange={(event) => setReservationTime(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none"
                        required
                        disabled={!availableStartTimes.length}
                      >
                        {!availableStartTimes.length && <option value="">Aucun créneau</option>}
                        {availableStartTimes.map((time) => (
                          <option key={time} value={time}>{time} · {annonce.duration || 60} min</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Note pour le coach
                      </label>
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={4}
                        placeholder="Objectif, niveau, précision utile..."
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 outline-none placeholder:text-slate-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !reservationDate || !reservationTime || !availableDates.length || !availableStartTimes.length}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <CreditCard size={18} />
                      )}
                      Réserver et payer
                    </button>
                  </form>
                  </>
                )}

                {payment && reservation && (
                  <div className="grid gap-5">
                    <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                      Réservation créée. Finalisez le paiement pour confirmer.
                    </div>

                    {!stripePromise ? (
                      <div className="rounded-[1.5rem] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
                        Ajoutez NEXT_PUBLIC_STRIPE_KEY dans .env.local pour
                        activer le formulaire Stripe côté webapp.
                      </div>
                    ) : (
                      <Elements
                        stripe={stripePromise}
                        options={{ clientSecret: payment.clientSecret }}
                      >
                        <CheckoutForm
                          reservation={reservation}
                          payment={payment}
                        />
                      </Elements>
                    )}
                  </div>
                )}
                  </>
                )}
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
