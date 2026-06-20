"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getToken, hasRole } from "@/lib/auth";
import type { User } from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://187.77.181.212/api";

type Intervenant = User & {
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  photo?: string | null;
  photo_url?: string | null;
  cover_photo?: string | null;
  cover_photo_url?: string | null;
  account_status?: string | null;
  speciality?: string | null;
  specialty?: string | null;
  service?: string | null;
  services?: string[] | null;
  rating?: number | string | null;
  reviews_count?: number | string | null;
  city?: string | null;
  location?: string | null;
  created_at?: string;
};

type ApiIntervenantsResponse = {
  success?: boolean;
  message?: string;
  data?: Intervenant[] | Intervenant;
};

function normalizeArray(payload: ApiIntervenantsResponse | Intervenant[] | null) {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload.data && typeof payload.data === "object") {
    return [payload.data as Intervenant];
  }

  return [];
}

function getFullUrl(url?: string | null) {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const base = API_BASE_URL.replace(/\/api\/?$/, "");

  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

function getIntervenantPhoto(intervenant: Intervenant) {
  return getFullUrl(intervenant.photo_url || intervenant.photo);
}

function getIntervenantCover(intervenant: Intervenant) {
  return getFullUrl(intervenant.cover_photo_url || intervenant.cover_photo);
}

function getSpeciality(intervenant: Intervenant) {
  return (
    intervenant.speciality ||
    intervenant.specialty ||
    intervenant.service ||
    intervenant.services?.[0] ||
    "Bien-être"
  );
}

function getLocation(intervenant: Intervenant) {
  return (
    intervenant.city ||
    intervenant.location ||
    intervenant.address ||
    "Localisation non définie"
  );
}

function getRating(intervenant: Intervenant) {
  const value = Number(intervenant.rating ?? 4.8);

  if (Number.isNaN(value)) {
    return 4.8;
  }

  return value;
}

function getReviewsCount(intervenant: Intervenant) {
  const value = Number(intervenant.reviews_count ?? 0);

  if (Number.isNaN(value)) {
    return 0;
  }

  return value;
}

function getStatusLabel(status?: string | null) {
  if (!status) return "Profil disponible";

  const labels: Record<string, string> = {
    approved: "Profil vérifié",
    pending: "En attente",
    rejected: "Refusé",
    active: "Actif",
    inactive: "Inactif",
  };

  return labels[status] || status;
}

function isIntervenant(user: Intervenant) {
  if (hasRole(user, "intervenant")) return true;

  const roles = user.roles || [];

  return roles.some((role: any) => {
    const name = String(role?.name || "").toLowerCase();
    const slug = String(role?.slug || "").toLowerCase();

    return name.includes("intervenant") || slug.includes("intervenant");
  });
}

async function fetchIntervenantById(id: string): Promise<Intervenant | null> {
  const token = getToken();

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  /*
    1) On tente d'abord l'endpoint direct :
       GET /api/intervenants/{id}

    2) Si le backend ne l'a pas encore, on fallback sur :
       GET /api/intervenants
       puis on cherche l'intervenant avec le bon ID.
  */

  try {
    const detailResponse = await fetch(`${API_BASE_URL}/intervenants/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (detailResponse.ok) {
      const payload = (await detailResponse.json().catch(() => null)) as
        | ApiIntervenantsResponse
        | Intervenant[]
        | null;

      const items = normalizeArray(payload);
      const found = items.find((item) => String(item.id) === String(id));

      if (found) {
        return found;
      }
    }
  } catch (error) {
    console.warn("Endpoint détail intervenant indisponible:", error);
  }

  const listResponse = await fetch(`${API_BASE_URL}/intervenants`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!listResponse.ok) {
    throw new Error(`Erreur API intervenants : ${listResponse.status}`);
  }

  const payload = (await listResponse.json().catch(() => null)) as
    | ApiIntervenantsResponse
    | Intervenant[]
    | null;

  const items = normalizeArray(payload);

  return (
    items.find((item) => {
      const status = String(item.account_status || "").toLowerCase();

      return (
        String(item.id) === String(id) &&
        isIntervenant(item) &&
        status === "approved"
      );
    }) || null
  );
}

export default function IntervenantDetailPage() {
  const params = useParams();
  const router = useRouter();

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

  useEffect(() => {
    if (!id) return;

    loadIntervenant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadIntervenant() {
    try {
      setLoading(true);
      setErrorMessage("");

      const item = await fetchIntervenantById(String(id));

      if (!item) {
        setIntervenant(null);
        setErrorMessage("Cet intervenant est introuvable ou non disponible.");
        return;
      }

      setIntervenant(item);
    } catch (error) {
      console.error("Erreur chargement détail intervenant:", error);
      setIntervenant(null);
      setErrorMessage(
        "Impossible de charger le profil de cet intervenant pour le moment."
      );
    } finally {
      setLoading(false);
    }
  }

  const photo = intervenant ? getIntervenantPhoto(intervenant) : "";
  const cover = intervenant ? getIntervenantCover(intervenant) : "";
  const speciality = intervenant ? getSpeciality(intervenant) : "";
  const location = intervenant ? getLocation(intervenant) : "";
  const rating = intervenant ? getRating(intervenant) : 0;
  const reviewsCount = intervenant ? getReviewsCount(intervenant) : 0;

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
                <div className="relative h-64 bg-gradient-to-br from-orange-100 via-orange-200 to-orange-500 sm:h-80">
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

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/10 to-transparent" />

                  <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-orange-700 shadow-sm backdrop-blur">
                      <BadgeCheck size={15} />
                      {speciality}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-950/90 px-4 py-2 text-xs font-black text-white shadow-sm backdrop-blur">
                      <Star size={15} className="fill-white" />
                      {rating.toFixed(1)} / 5
                    </span>
                  </div>
                </div>

                <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.9fr_1.6fr] lg:p-10">
                  <aside className="relative">
                    <div className="-mt-24 rounded-[2rem] border border-orange-100 bg-white p-5 shadow-xl lg:sticky lg:top-28">
                      <div className="mx-auto h-36 w-36 overflow-hidden rounded-[2rem] border-4 border-white bg-orange-100 shadow-xl">
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

                      <div className="mt-5 text-center">
                        <h1 className="text-3xl font-black tracking-tight text-slate-950">
                          {intervenant.name || "Intervenant Gotfit"}
                        </h1>

                        <p className="mt-2 text-sm font-black uppercase tracking-[0.16em] text-orange-600">
                          {speciality}
                        </p>
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
                            <Phone
                              className="shrink-0 text-orange-600"
                              size={20}
                            />
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
                            <Mail
                              className="shrink-0 text-orange-600"
                              size={20}
                            />
                            <span className="break-all text-sm font-bold text-slate-600">
                              {intervenant.email}
                            </span>
                          </a>
                        )}
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <Link
                          href={`/reservation?intervenant_id=${intervenant.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
                        >
                          Réserver
                          <CalendarCheck size={17} />
                        </Link>

                        <Link
                          href={`/messages?user_id=${intervenant.id}`}
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
                          {rating.toFixed(1)}
                        </strong>

                        <span className="mt-1 block text-sm font-bold text-slate-500">
                          Note moyenne
                        </span>
                      </div>

                      <div className="rounded-3xl bg-orange-50 p-5">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-orange-600">
                          <HeartPulse size={22} />
                        </div>

                        <strong className="block text-3xl font-black">
                          {reviewsCount}
                        </strong>

                        <span className="mt-1 block text-sm font-bold text-slate-500">
                          Avis client
                        </span>
                      </div>

                      <div className="rounded-3xl bg-orange-50 p-5">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-orange-600">
                          <ShieldCheck size={22} />
                        </div>

                        <strong className="block text-xl font-black">
                          Vérifié
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

                      <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
                        {intervenant.bio ||
                          "Cet intervenant Gotfit est disponible pour proposer un accompagnement personnalisé selon vos objectifs de bien-être, de remise en forme ou de suivi sportif."}
                      </p>
                    </div>

                    <div className="mt-6 rounded-[2rem] border border-orange-100 bg-orange-50 p-6 sm:p-8">
                      <span className="mb-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-700">
                        Service principal
                      </span>

                      <h2 className="text-3xl font-black tracking-tight">
                        {speciality}
                      </h2>

                      <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
                        Vous pouvez réserver une séance avec cet intervenant ou
                        le contacter directement pour plus d’informations avant
                        de confirmer votre accompagnement.
                      </p>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link
                          href={`/reservation?intervenant_id=${intervenant.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700"
                        >
                          Réserver une séance
                          <CalendarCheck size={18} />
                        </Link>

                        <Link
                          href={`/messages?user_id=${intervenant.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                        >
                          Envoyer un message
                          <MessageCircle size={18} />
                        </Link>
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