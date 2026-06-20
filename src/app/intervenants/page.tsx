"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  HeartPulse,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  UserRound,
  UsersRound,
  X,
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
  data?: Intervenant[];
};

const specialties = [
  "Tous",
  "Coaching sportif",
  "Pilates",
  "Yoga",
  "Nutrition",
  "Réathlétisation",
  "Bien-être",
];

const sortOptions = [
  {
    label: "Recommandés",
    value: "recommended",
  },
  {
    label: "Mieux notés",
    value: "rating",
  },
  {
    label: "Nom A-Z",
    value: "name",
  },
];

function normalizeArray(payload: ApiIntervenantsResponse | Intervenant[] | null) {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
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

async function fetchIntervenants(): Promise<Intervenant[]> {
  const token = getToken();

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/intervenants`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Erreur API intervenants : ${response.status}`);
  }

  const payload = (await response.json().catch(() => null)) as
    | ApiIntervenantsResponse
    | Intervenant[]
    | null;

  const items = normalizeArray(payload);

  return items.filter((item) => {
    const status = String(item.account_status || "").toLowerCase();

    return isIntervenant(item) && status === "approved";
  });
}

export default function IntervenantsPage() {
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("Tous");
  const [sortBy, setSortBy] = useState("recommended");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    loadIntervenants();
  }, []);

  async function loadIntervenants() {
    try {
      setLoading(true);
      setErrorMessage("");

      const items = await fetchIntervenants();

      setIntervenants(items);
    } catch (error) {
      console.error("Erreur chargement intervenants:", error);
      setIntervenants([]);
      setErrorMessage(
        "Impossible de charger les intervenants depuis l’API pour le moment."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setSelectedSpecialty("Tous");
    setSortBy("recommended");
    setVerifiedOnly(false);
  }

  const filteredIntervenants = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    const filtered = intervenants.filter((intervenant) => {
      const speciality = getSpeciality(intervenant);
      const location = getLocation(intervenant);

      const matchesSearch =
        !cleanSearch ||
        intervenant.name?.toLowerCase().includes(cleanSearch) ||
        intervenant.email?.toLowerCase().includes(cleanSearch) ||
        intervenant.bio?.toLowerCase().includes(cleanSearch) ||
        speciality.toLowerCase().includes(cleanSearch) ||
        location.toLowerCase().includes(cleanSearch);

      const matchesSpecialty =
        selectedSpecialty === "Tous" ||
        speciality.toLowerCase().includes(selectedSpecialty.toLowerCase());

      const matchesVerified =
        !verifiedOnly || intervenant.account_status === "approved";

      return matchesSearch && matchesSpecialty && matchesVerified;
    });

    if (sortBy === "rating") {
      filtered.sort((a, b) => getRating(b) - getRating(a));
    }

    if (sortBy === "name") {
      filtered.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
    }

    return filtered;
  }, [intervenants, search, selectedSpecialty, sortBy, verifiedOnly]);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FFF7ED] text-slate-950">
        <section className="relative overflow-hidden px-4 pb-14 pt-36 sm:pt-40 lg:pb-20">
          <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-orange-300/30 blur-3xl" />
          <div className="absolute -left-40 top-56 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute -right-40 top-72 h-96 w-96 rounded-full bg-orange-400/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-700 shadow-sm backdrop-blur">
                  <UsersRound size={16} />
                  Intervenants Gotfit
                </span>

                <h1 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-7xl">
                  Trouvez l’intervenant idéal pour votre bien-être.
                </h1>

                <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                  Comparez les profils, spécialités, disponibilités et avis pour
                  réserver le bon accompagnement : coaching, Pilates, yoga,
                  nutrition ou suivi personnalisé.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="#liste-intervenants"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-4 text-sm font-black text-white shadow-xl shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700"
                  >
                    Voir les profils
                    <ArrowRight size={18} />
                  </Link>

                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-200 bg-white px-7 py-4 text-sm font-black text-orange-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50"
                  >
                    Devenir intervenant
                  </Link>
                </div>
              </div>

              <div className="rounded-[2.5rem] border border-white/80 bg-white/70 p-4 shadow-[0_24px_80px_rgba(249,115,22,0.14)] backdrop-blur-xl">
                <div className="rounded-[2rem] bg-white p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">
                        Recherche rapide
                      </p>
                      <h2 className="mt-2 text-3xl font-black tracking-tight">
                        Sélection premium
                      </h2>
                    </div>

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                      <Sparkles size={26} />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-2xl bg-orange-50 p-5">
                      <div className="mb-3 flex items-center gap-3">
                        <BadgeCheck className="text-orange-600" size={22} />
                        <strong className="text-sm font-black">
                          Profils vérifiés
                        </strong>
                      </div>
                      <p className="text-sm font-semibold leading-7 text-slate-500">
                        Des intervenants qualifiés pour un accompagnement clair,
                        sécurisé et personnalisé.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-950 p-4 text-white">
                        <strong className="block text-2xl font-black">
                          {intervenants.length}
                        </strong>
                        <span className="mt-1 block text-xs font-semibold text-white/60">
                          Profils
                        </span>
                      </div>

                      <div className="rounded-2xl bg-orange-100 p-4">
                        <strong className="block text-2xl font-black text-orange-700">
                          {new Set(intervenants.map(getSpeciality)).size}
                        </strong>
                        <span className="mt-1 block text-xs font-semibold text-slate-500">
                          Services
                        </span>
                      </div>

                      <div className="rounded-2xl bg-orange-100 p-4">
                        <strong className="block text-2xl font-black text-orange-700">
                          {intervenants.length
                            ? (
                                intervenants.reduce(
                                  (total, item) => total + getRating(item),
                                  0
                                ) / intervenants.length
                              ).toFixed(1)
                            : "0.0"}
                        </strong>
                        <span className="mt-1 block text-xs font-semibold text-slate-500">
                          Note moy.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="liste-intervenants" className="px-4 py-8 lg:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 rounded-[2rem] border border-orange-100 bg-white p-4 shadow-sm sm:p-5">
              <div className="grid gap-3 lg:grid-cols-[1.3fr_0.75fr_0.65fr_auto]">
                <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
                  <Search className="shrink-0 text-orange-500" size={20} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher par nom, service, ville..."
                    className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>

                <div className="relative">
                  <select
                    value={selectedSpecialty}
                    onChange={(event) =>
                      setSelectedSpecialty(event.target.value)
                    }
                    className="h-full w-full appearance-none rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:border-orange-500"
                  >
                    {specialties.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-orange-500"
                  />
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="h-full w-full appearance-none rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:border-orange-500"
                  >
                    {sortOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-orange-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setVerifiedOnly((value) => !value)}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                    verifiedOnly
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                      : "bg-slate-950 text-white hover:bg-slate-800"
                  }`}
                >
                  <ShieldCheck size={18} />
                  Vérifiés
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
                  <SlidersHorizontal size={17} />
                  {filteredIntervenants.length} résultat(s) trouvé(s)
                </div>

                {(search || selectedSpecialty !== "Tous" || verifiedOnly) && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-black text-orange-700 transition hover:bg-orange-100"
                  >
                    <X size={16} />
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

            {errorMessage && (
              <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {errorMessage}
              </div>
            )}

            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] bg-white">
                <div className="inline-flex items-center gap-3 rounded-3xl bg-orange-50 px-6 py-5 text-sm font-black text-orange-700">
                  <Loader2 className="animate-spin" size={20} />
                  Chargement des intervenants...
                </div>
              </div>
            ) : filteredIntervenants.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredIntervenants.map((intervenant) => {
                  const photo = getIntervenantPhoto(intervenant);
                  const speciality = getSpeciality(intervenant);
                  const location = getLocation(intervenant);
                  const rating = getRating(intervenant);
                  const reviewsCount = getReviewsCount(intervenant);

                  return (
                    <article
                      key={intervenant.id}
                      className="group overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(249,115,22,0.16)]"
                    >
                      <div className="relative h-36 bg-gradient-to-br from-orange-100 via-orange-200 to-orange-400">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.8),transparent_35%)]" />

                        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-orange-700 shadow-sm backdrop-blur">
                          {speciality}
                        </span>

                        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-slate-950/90 px-3 py-1 text-xs font-black text-white shadow-sm backdrop-blur">
                          <Star size={13} className="fill-white" />
                          {rating.toFixed(1)}
                        </span>
                      </div>

                      <div className="relative px-5 pb-5">
                        <div className="-mt-12 mb-4 flex items-end justify-between gap-3">
                          <div className="h-24 w-24 overflow-hidden rounded-[1.6rem] border-4 border-white bg-orange-100 shadow-xl">
                            {photo ? (
                              <img
                                src={photo}
                                alt={intervenant.name || "Intervenant Gotfit"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-orange-700">
                                <UserRound size={38} />
                              </div>
                            )}
                          </div>

                          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
                            <CheckCircle2 size={14} />
                            {getStatusLabel(intervenant.account_status)}
                          </span>
                        </div>

                        <h3 className="text-2xl font-black tracking-tight text-slate-950">
                          {intervenant.name || "Intervenant Gotfit"}
                        </h3>

                        <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-500">
                          <MapPin size={16} className="text-orange-500" />
                          {location}
                        </div>

                        <p className="mt-4 line-clamp-3 min-h-[4.6rem] text-sm font-semibold leading-7 text-slate-500">
                          {intervenant.bio ||
                            "Profil intervenant Gotfit disponible pour un accompagnement personnalisé."}
                        </p>

                        <div className="mt-5 flex items-center justify-between rounded-2xl bg-orange-50 p-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-orange-600">
                              <Star size={17} className="fill-orange-500" />
                            </div>

                            <div>
                              <strong className="block text-sm font-black">
                                {rating.toFixed(1)} / 5
                              </strong>
                              <span className="text-xs font-bold text-slate-500">
                                {reviewsCount} avis
                              </span>
                            </div>
                          </div>

                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-orange-600">
                            <HeartPulse size={18} />
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-2">
                          <Link
                            href={`/intervenants/${intervenant.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-black text-orange-700 transition hover:bg-orange-50"
                          >
                            Profil
                          </Link>

                          <Link
                            href={`/reservation?intervenant_id=${intervenant.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
                          >
                            Réserver
                            <CalendarCheck size={17} />
                          </Link>
                        </div>

                        <Link
                          href={`/messages?user_id=${intervenant.id}`}
                          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                        >
                          <MessageCircle size={17} />
                          Contacter
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                  <Search size={28} />
                </div>

                <h3 className="text-2xl font-black tracking-tight">
                  Aucun intervenant trouvé
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-7 text-slate-500">
                  Aucun intervenant approuvé n’est disponible pour le moment, ou
                  vos filtres sont trop restrictifs.
                </p>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="px-4 pb-24 pt-12">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-slate-950 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
              <div>
                <span className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200">
                  Gotfit Pro
                </span>

                <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                  Vous êtes coach, nutritionniste ou praticien bien-être ?
                </h2>

                <p className="mt-5 max-w-xl text-sm font-semibold leading-7 text-white/60">
                  Créez votre compte intervenant, présentez vos services et
                  commencez à recevoir des réservations depuis Gotfit.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700"
                >
                  Devenir intervenant
                  <ArrowRight size={17} />
                </Link>

                <Link
                  href="/#contact"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Nous contacter
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}