"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  Camera,
  CreditCard,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import {
  clearAuth,
  getCurrentUser,
  getToken,
  hasRole,
  saveAuth,
} from "@/lib/auth";
import type { User } from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://187.77.181.212/api";

const FALLBACK_COVER =
  "linear-gradient(135deg, #fff7ed 0%, #fed7aa 45%, #fb923c 100%)";

type ProfileResponse = {
  user?: ProfileUser;
  data?: ProfileUser;
  message?: string;
};

type ProfileUpdateResponse = {
  user?: ProfileUser;
  data?: ProfileUser;
  message?: string;
  errors?: Record<string, string[]>;
};

type ProfileUser = User & {
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  photo?: string | null;
  photo_url?: string | null;
  cover_photo?: string | null;
  cover_photo_url?: string | null;
  account_status?: string | null;
  created_at?: string;
  updated_at?: string;
};

type Reservation = {
  id: number;
  status?: string | null;
  reservation_status?: string | null;
  payment_status?: string | null;
  amount?: number | string | null;
  total?: number | string | null;
  price?: number | string | null;
  created_at?: string;
  date?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  client?: ProfileUser | null;
  intervenant?: ProfileUser | null;
  annonce?: {
    id?: number;
    title?: string | null;
    name?: string | null;
    price?: number | string | null;
  } | null;
};

type Payment = {
  id: number;
  amount?: number | string | null;
  total?: number | string | null;
  status?: string | null;
  payment_status?: string | null;
  method?: string | null;
  provider?: string | null;
  reference?: string | null;
  created_at?: string;
  reservation?: Reservation | null;
};

function normalizeArray<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.payments)) return payload.payments;
  if (Array.isArray(payload?.payements)) return payload.payements;
  if (Array.isArray(payload?.reservations)) return payload.reservations;
  return [];
}

function getFullUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const base = API_BASE_URL.replace("/api", "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

function getUserPhoto(user: ProfileUser | null) {
  return getFullUrl(user?.photo_url || user?.photo);
}

function getUserCover(user: ProfileUser | null) {
  return getFullUrl(user?.cover_photo_url || user?.cover_photo);
}

function formatDate(value?: string | null) {
  if (!value) return "Non défini";

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "Non défini";

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatMoney(value?: number | string | null) {
  if (value === null || value === undefined || value === "") {
    return "0 €";
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return `${value} €`;
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(numberValue);
}

function getErrorMessage(result: ProfileUpdateResponse | null) {
  if (!result) return "Une erreur est survenue.";

  if (result.errors) {
    const firstError = Object.values(result.errors)[0]?.[0];
    if (firstError) return firstError;
  }

  return result.message || "Une erreur est survenue.";
}

function getDashboardUrl(user: ProfileUser | null) {
  if (hasRole(user, "admin")) return "/admin/dashboard";
  if (hasRole(user, "intervenant")) return "/intervenant/dashboard";
  return "/client/dashboard";
}

function getMainRole(user: ProfileUser | null) {
  if (hasRole(user, "admin")) return "Admin";
  if (hasRole(user, "intervenant")) return "Intervenant";
  if (hasRole(user, "client")) return "Client";
  return "Utilisateur";
}

function getStatusLabel(status?: string | null) {
  if (!status) return "Non défini";

  const labels: Record<string, string> = {
    approved: "Approuvé",
    pending: "En attente",
    rejected: "Refusé",
    active: "Actif",
    inactive: "Inactif",
    paid: "Payé",
    unpaid: "Non payé",
    completed: "Terminé",
    cancelled: "Annulé",
    confirmed: "Confirmé",
  };

  return labels[status] || status;
}

async function apiGet<T>(endpoint: string): Promise<T | null> {
  const token = getToken();

  if (!token) {
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    clearAuth();
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function apiPostForm<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = (await response.json().catch(() => null)) as T & {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (response.status === 401) {
    clearAuth();
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(result as ProfileUpdateResponse));
  }

  return result;
}

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [photoPreview, setPhotoPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const mainRole = useMemo(() => getMainRole(user), [user]);

  const totalPaid = useMemo(() => {
    return payments.reduce((total, item) => {
      const rawAmount = item.amount || item.total || 0;
      const amount = Number(rawAmount);
      return total + (Number.isNaN(amount) ? 0 : amount);
    }, 0);
  }, [payments]);

  useEffect(() => {
    const localUser = getCurrentUser();

    if (!getToken()) {
      router.replace("/auth/login");
      return;
    }

    if (localUser) {
      setUser(localUser as ProfileUser);
    }

    loadProfile();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    setName(user.name || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setAddress(user.address || "");
    setBio(user.bio || "");
    setPhotoPreview(getUserPhoto(user));
    setCoverPreview(getUserCover(user));
  }, [user]);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const profilePayload = await apiGet<ProfileResponse>("/profile");
      const profileUser = profilePayload?.user || profilePayload?.data || null;

      if (profileUser) {
        setUser(profileUser);
        saveAuth(getToken() || "", profileUser);
      }

      const currentUser = profileUser || (getCurrentUser() as ProfileUser | null);

      if (hasRole(currentUser, "intervenant")) {
        const reservationPayload = await apiGet<any>("/reservation/intervenant");
        setReservations(normalizeArray<Reservation>(reservationPayload));
      } else {
        const reservationPayload = await apiGet<any>("/reservation/client");
        setReservations(normalizeArray<Reservation>(reservationPayload));
      }

      const paymentsPayload =
        (await apiGet<any>("/payments")) || (await apiGet<any>("/payements"));

      setPayments(normalizeArray<Payment>(paymentsPayload));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible de charger le profil.";

      setError(message);

      if (message.includes("Session expirée")) {
        router.replace("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const cleanName = name.trim();
      const cleanEmail = email.trim();

      if (!cleanName) {
        setError("Le nom complet est obligatoire.");
        return;
      }

      if (!cleanEmail) {
        setError("L’adresse email est obligatoire.");
        return;
      }

      const formData = new FormData();

      formData.append("name", cleanName);
      formData.append("email", cleanEmail);
      formData.append("phone", phone.trim());
      formData.append("address", address.trim());
      formData.append("bio", bio.trim());

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      if (coverFile) {
        formData.append("cover_photo", coverFile);
      }

      const result = await apiPostForm<ProfileUpdateResponse>(
        "/profile/update",
        formData
      );

      const updatedUser = result.user || result.data || null;

      if (updatedUser) {
        setUser(updatedUser);
        saveAuth(getToken() || "", updatedUser);
      }

      setPhotoFile(null);
      setCoverFile(null);
      setSuccess("Profil mis à jour avec succès.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de mettre à jour le profil.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    clearAuth();
    router.replace("/auth/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-orange-50 px-4 py-32 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-28">
          <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-5 text-sm font-bold text-orange-700 shadow-sm">
            <Loader2 className="animate-spin" size={20} />
            Chargement du profil...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-orange-50 px-4 py-28 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-orange-700 shadow-sm transition hover:bg-orange-100"
          >
            <ArrowLeft size={17} />
            Retour vers l’accueil
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-red-600 shadow-sm transition hover:bg-red-50"
          >
            <LogOut size={17} />
            Déconnexion
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            <X className="mt-0.5 shrink-0" size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-3xl border border-orange-200 bg-orange-100 px-5 py-4 text-sm font-bold text-orange-800">
            <BadgeCheck className="mt-0.5 shrink-0" size={18} />
            {success}
          </div>
        )}

        <section className="overflow-hidden rounded-[2.5rem] bg-white shadow-[0_24px_80px_rgba(249,115,22,0.15)]">
          <div
            className="relative h-56 bg-orange-200"
            style={
              coverPreview
                ? {
                    backgroundImage: `url(${coverPreview})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : {
                    background: FALLBACK_COVER,
                  }
            }
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-950/10 to-orange-500/10" />

            <label className="absolute right-5 top-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-black text-orange-700 shadow-sm backdrop-blur transition hover:bg-orange-50">
              <Camera size={17} />
              Couverture
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="px-5 pb-8 sm:px-8">
            <div className="-mt-16 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative h-32 w-32 overflow-hidden rounded-[2rem] border-4 border-white bg-orange-100 shadow-xl">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={user?.name || "Photo de profil"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-orange-100 text-orange-700">
                      <UserRound size={42} />
                    </div>
                  )}

                  <label className="absolute bottom-2 right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-orange-700 shadow-lg transition hover:bg-orange-50">
                    <Camera size={18} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="pb-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white">
                      {mainRole}
                    </span>

                    {user?.account_status && (
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                        {getStatusLabel(user.account_status)}
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    {user?.name || "Utilisateur Gotfit"}
                  </h1>

                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    Membre depuis {formatDate(user?.created_at)}
                  </p>
                </div>
              </div>

              <Link
                href={getDashboardUrl(user)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700"
              >
                <ShieldCheck size={18} />
                Mon espace
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  Informations du profil
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Modifiez vos informations personnelles.
                </p>
              </div>

              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                <Pencil size={19} />
              </span>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Nom complet
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-orange-500 focus:bg-white"
                  placeholder="Nom complet"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Email
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
                    <Mail size={18} className="text-orange-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full bg-transparent text-sm font-semibold outline-none"
                      placeholder="email@exemple.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Téléphone
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
                    <Phone size={18} className="text-orange-500" />
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="w-full bg-transparent text-sm font-semibold outline-none"
                      placeholder="+33 6 00 00 00 00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Adresse
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
                  <MapPin size={18} className="text-orange-500" />
                  <input
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    placeholder="Adresse ou ville"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-orange-500 focus:bg-white"
                  placeholder="Présentez-vous en quelques lignes..."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </form>

          <aside className="grid gap-6">
            <div className="rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
              <h2 className="mb-5 text-2xl font-black tracking-tight">
                Résumé du compte
              </h2>

              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-2xl bg-orange-50 p-4">
                  <div className="flex items-center gap-3">
                    <UserRound className="text-orange-500" size={20} />
                    <span className="text-sm font-bold text-slate-600">
                      Type de compte
                    </span>
                  </div>
                  <strong className="text-sm font-black">{mainRole}</strong>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-orange-50 p-4">
                  <div className="flex items-center gap-3">
                    <CalendarCheck className="text-orange-500" size={20} />
                    <span className="text-sm font-bold text-slate-600">
                      Réservations
                    </span>
                  </div>
                  <strong className="text-sm font-black">
                    {reservations.length}
                  </strong>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-orange-50 p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="text-orange-500" size={20} />
                    <span className="text-sm font-bold text-slate-600">
                      Paiements
                    </span>
                  </div>
                  <strong className="text-sm font-black">{payments.length}</strong>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-orange-600 p-4 text-white">
                  <div className="flex items-center gap-3">
                    <Wallet className="text-white/80" size={20} />
                    <span className="text-sm font-bold text-white/80">
                      Total payé
                    </span>
                  </div>
                  <strong className="text-sm font-black">
                    {formatMoney(totalPaid)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
              <h2 className="mb-5 text-2xl font-black tracking-tight">
                Rôles
              </h2>

              <div className="flex flex-wrap gap-2">
                {user?.roles?.length ? (
                  user.roles.map((role: any) => (
                    <span
                      key={role.id || role.slug || role.name}
                      className="rounded-full bg-orange-100 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-orange-700"
                    >
                      {role.name || role.slug}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-semibold text-slate-500">
                    Aucun rôle trouvé.
                  </span>
                )}
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  Réservations récentes
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Vos dernières réservations Gotfit.
                </p>
              </div>

              <CalendarCheck className="text-orange-300" size={26} />
            </div>

            <div className="grid gap-3">
              {reservations.length ? (
                reservations.slice(0, 5).map((reservation) => {
                  const title =
                    reservation.annonce?.title ||
                    reservation.annonce?.name ||
                    `Réservation #${reservation.id}`;

                  const status =
                    reservation.status || reservation.reservation_status;

                  const amount =
                    reservation.amount ||
                    reservation.total ||
                    reservation.price ||
                    reservation.annonce?.price;

                  return (
                    <div
                      key={reservation.id}
                      className="rounded-2xl border border-orange-100 bg-orange-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <strong className="block text-sm font-black text-slate-950">
                            {title}
                          </strong>
                          <span className="mt-1 block text-xs font-semibold text-slate-500">
                            {formatDateTime(
                              reservation.date ||
                                reservation.start_at ||
                                reservation.created_at
                            )}
                          </span>
                        </div>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-orange-700">
                          {getStatusLabel(status)}
                        </span>
                      </div>

                      <div className="mt-3 text-sm font-black text-slate-950">
                        {formatMoney(amount)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl bg-orange-50 p-5 text-sm font-semibold text-slate-500">
                  Aucune réservation trouvée.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  Paiements récents
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Historique des paiements liés au compte.
                </p>
              </div>

              <CreditCard className="text-orange-300" size={26} />
            </div>

            <div className="grid gap-3">
              {payments.length ? (
                payments.slice(0, 5).map((payment) => {
                  const amount = payment.amount || payment.total;
                  const status = payment.status || payment.payment_status;

                  return (
                    <div
                      key={payment.id}
                      className="rounded-2xl border border-orange-100 bg-orange-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <strong className="block text-sm font-black text-slate-950">
                            Paiement #{payment.id}
                          </strong>
                          <span className="mt-1 block text-xs font-semibold text-slate-500">
                            {formatDateTime(payment.created_at)}
                          </span>
                        </div>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-orange-700">
                          {getStatusLabel(status)}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-sm font-black text-slate-950">
                          {formatMoney(amount)}
                        </span>

                        {(payment.provider || payment.method) && (
                          <span className="text-xs font-bold text-slate-400">
                            {payment.provider || payment.method}
                          </span>
                        )}
                      </div>

                      {payment.reference && (
                        <div className="mt-2 text-xs font-semibold text-slate-400">
                          Réf : {payment.reference}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl bg-orange-50 p-5 text-sm font-semibold text-slate-500">
                  Aucun paiement trouvé ou endpoint paiement réservé à l’admin.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}