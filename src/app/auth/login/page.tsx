"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { getCurrentUser, saveAuth } from "@/lib/auth";
import type { User } from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://187.77.181.212/api";

const LOGO_URL = "http://187.77.181.212/images/logo.png";

type LoginResponse = {
  token?: string;
  access_token?: string;
  user?: User;
  data?: {
    token?: string;
    access_token?: string;
    user?: User;
  };
  message?: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (currentUser) {
      router.replace("/profile");
    }
  }, [router]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("gotfit_remember_email");

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Veuillez renseigner votre email et votre mot de passe.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | LoginResponse
        | null;

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Connexion impossible. Vérifiez votre email et votre mot de passe."
        );
      }

      const token =
        result?.token ||
        result?.access_token ||
        result?.data?.token ||
        result?.data?.access_token;

      const user = result?.user || result?.data?.user || null;

      if (!token || !user) {
        throw new Error(
          "Réponse API invalide : token ou utilisateur manquant."
        );
      }

      saveAuth(token, user);

      if (rememberMe) {
        localStorage.setItem("gotfit_remember_email", cleanEmail);
      } else {
        localStorage.removeItem("gotfit_remember_email");
      }

      router.replace("/profile");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue pendant la connexion.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F3] px-4 py-28 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-14rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
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
                <ShieldCheck size={16} />
                Espace sécurisé
              </span>

              <h1 className="max-w-xl text-5xl font-black leading-[1.02] tracking-tight">
                Connecte-toi à ton espace Gotfit.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-white/65">
                Retrouve tes réservations, tes messages, ton profil et le suivi
                de tes accompagnements bien-être depuis une seule interface.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                  <strong className="block text-2xl font-black">24/7</strong>
                  <span className="mt-1 block text-xs font-semibold text-white/50">
                    Accès webapp
                  </span>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                  <strong className="block text-2xl font-black">100%</strong>
                  <span className="mt-1 block text-xs font-semibold text-white/50">
                    Sécurisé
                  </span>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                  <strong className="block text-2xl font-black">Fast</strong>
                  <span className="mt-1 block text-xs font-semibold text-white/50">
                    Réservation
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-8">
            <div className="mb-8 text-center">
              <Link href="/" className="mb-6 inline-flex justify-center">
                <img
                  src={LOGO_URL}
                  alt="Logo Gotfit"
                  className="h-auto w-[155px] object-contain"
                />
              </Link>

              <h2 className="text-3xl font-black tracking-tight text-slate-950">
                Connexion
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Entrez vos identifiants pour accéder à votre compte Gotfit.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4">
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
                    placeholder="exemple@email.com"
                    autoComplete="email"
                    className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

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
                    placeholder="Votre mot de passe"
                    autoComplete="current-password"
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

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="inline-flex cursor-pointer items-center gap-2 font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-slate-950"
                  />
                  Se souvenir de moi
                </label>

                <Link
                  href="/auth/forgot-password"
                  className="font-bold text-slate-950 transition hover:text-emerald-600"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  "Connexion en cours..."
                ) : (
                  <>
                    <LogIn size={19} />
                    Se connecter
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-600">
              Pas encore de compte ?{" "}
              <Link
                href="/auth/register"
                className="font-black text-slate-950 transition hover:text-emerald-600"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}