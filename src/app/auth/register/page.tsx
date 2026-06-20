"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  UserRound,
  UsersRound,
} from "lucide-react";
import { getCurrentUser, saveAuth } from "@/lib/auth";
import type { User } from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://187.77.181.212/api";

const LOGO_URL = "http://187.77.181.212/images/logo.png";

type RegisterRole = "client" | "intervenant";

type RegisterResponse = {
  token?: string;
  access_token?: string;
  user?: User;
  data?: {
    token?: string;
    access_token?: string;
    user?: User;
  };
  message?: string;
  errors?: Record<string, string[]>;
};

function getErrorMessage(result: RegisterResponse | null) {
  if (!result) {
    return "Inscription impossible. Veuillez réessayer.";
  }

  if (result.errors) {
    const firstError = Object.values(result.errors)[0]?.[0];

    if (firstError) {
      return firstError;
    }
  }

  return (
    result.message ||
    "Inscription impossible. Veuillez vérifier les informations."
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<RegisterRole>("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  const [acceptTerms, setAcceptTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (currentUser) {
      router.replace("/profile");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanEmail || !password || !passwordConfirmation) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    if (!acceptTerms) {
      setError("Veuillez accepter les conditions générales pour continuer.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone || null,
          password,
          password_confirmation: passwordConfirmation,
          role,
          role_slug: role,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | RegisterResponse
        | null;

      if (!response.ok) {
        throw new Error(getErrorMessage(result));
      }

      const token =
        result?.token ||
        result?.access_token ||
        result?.data?.token ||
        result?.data?.access_token;

      const user = result?.user || result?.data?.user || null;

      /**
       * Cas 1 :
       * Le backend Laravel renvoie token + user après inscription.
       * On connecte l'utilisateur directement et on l'envoie vers /profile.
       */
      if (token && user) {
        saveAuth(token, user);
        router.replace("/profile");
        return;
      }

      /**
       * Cas 2 :
       * Le backend crée seulement le compte sans connecter l'utilisateur.
       * Dans ce cas, on ne peut pas ouvrir /profile car il n'y a pas de token.
       */
      router.replace("/auth/login");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue pendant l’inscription.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F3] px-4 py-28 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-14rem)] max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1fr]">
        <section className="hidden lg:block">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-10 text-white shadow-2xl">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-orange-400/20 blur-3xl" />

            <div className="relative">
              <Link href="/" className="mb-12 inline-flex">
                <img
                  src={LOGO_URL}
                  alt="Logo Gotfit"
                  className="h-auto w-[170px] object-contain"
                />
              </Link>

              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
                <CheckCircle2 size={16} />
                Créer un compte
              </span>

              <h1 className="max-w-xl text-5xl font-black leading-[1.02] tracking-tight">
                Rejoins Gotfit et réserve ton accompagnement bien-être.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-white/65">
                Crée ton espace client ou intervenant pour gérer les services,
                les réservations, les messages et le suivi depuis la webapp.
              </p>

              <div className="mt-10 grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                  <strong className="flex items-center gap-3 text-lg font-black">
                    <UserRound size={22} />
                    Compte client
                  </strong>
                  <span className="mt-2 block text-sm leading-6 text-white/55">
                    Pour rechercher, réserver et suivre vos séances.
                  </span>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                  <strong className="flex items-center gap-3 text-lg font-black">
                    <Dumbbell size={22} />
                    Compte intervenant
                  </strong>
                  <span className="mt-2 block text-sm leading-6 text-white/55">
                    Pour proposer vos services et gérer vos réservations.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-white bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-8">
            <div className="mb-8 text-center">
              <Link href="/" className="mb-6 inline-flex justify-center">
                <img
                  src={LOGO_URL}
                  alt="Logo Gotfit"
                  className="h-auto w-[155px] object-contain"
                />
              </Link>

              <h2 className="text-3xl font-black tracking-tight text-slate-950">
                Inscription
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Créez votre compte Gotfit en quelques secondes.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Type de compte
                </label>

                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-2">
                  <button
                    type="button"
                    onClick={() => setRole("client")}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
                      role === "client"
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-500 hover:bg-white"
                    }`}
                  >
                    <UserRound size={18} />
                    Client
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("intervenant")}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
                      role === "intervenant"
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-500 hover:bg-white"
                    }`}
                  >
                    <UsersRound size={18} />
                    Intervenant
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Nom complet
                </label>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-slate-950 focus-within:bg-white">
                  <UserRound size={19} className="shrink-0 text-slate-400" />

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Votre nom complet"
                    autoComplete="name"
                    className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Adresse email
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-slate-950 focus-within:bg-white">
                    <Mail size={19} className="shrink-0 text-slate-400" />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="email@exemple.com"
                      autoComplete="email"
                      className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Téléphone
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-slate-950 focus-within:bg-white">
                    <Phone size={19} className="shrink-0 text-slate-400" />

                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+33 6 00 00 00 00"
                      autoComplete="tel"
                      className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Mot de passe
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-slate-950 focus-within:bg-white">
                    <Lock size={19} className="shrink-0 text-slate-400" />

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Minimum 6 caractères"
                      autoComplete="new-password"
                      className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="shrink-0 text-slate-400 transition hover:text-slate-950"
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password_confirmation"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Confirmation
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-slate-950 focus-within:bg-white">
                    <Lock size={19} className="shrink-0 text-slate-400" />

                    <input
                      id="password_confirmation"
                      type={showPasswordConfirmation ? "text" : "password"}
                      value={passwordConfirmation}
                      onChange={(event) =>
                        setPasswordConfirmation(event.target.value)
                      }
                      placeholder="Confirmer"
                      autoComplete="new-password"
                      className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswordConfirmation((value) => !value)
                      }
                      className="shrink-0 text-slate-400 transition hover:text-slate-950"
                      aria-label={
                        showPasswordConfirmation
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                    >
                      {showPasswordConfirmation ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <label className="mt-1 flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(event) => setAcceptTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-slate-950"
                />

                <span>
                  J’accepte les{" "}
                  <Link
                    href="/cgu"
                    className="font-black text-slate-950 transition hover:text-emerald-600"
                  >
                    conditions générales
                  </Link>{" "}
                  et la{" "}
                  <Link
                    href="/confidentialite"
                    className="font-black text-slate-950 transition hover:text-emerald-600"
                  >
                    politique de confidentialité
                  </Link>
                  .
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  "Création du compte..."
                ) : (
                  <>
                    Créer mon compte
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-600">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/auth/login"
                className="font-black text-slate-950 transition hover:text-emerald-600"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}