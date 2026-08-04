"use client";

import Link from "next/link";
import {
  type FormEvent,
  useState,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  requestPasswordReset,
} from "@/lib/auth";

/* =========================================================
   PAGE
========================================================= */

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [sentEmail, setSentEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =======================================================
     ENVOI DU LIEN
  ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (loading) {
      return;
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setSuccess("");

      setError(
        "Veuillez indiquer votre adresse email.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response =
        await requestPasswordReset(
          normalizedEmail,
        );

      setSentEmail(
        normalizedEmail,
      );

      setSuccess(
        response.message ||
          "Si un compte correspond à cette adresse, un lien de réinitialisation a été envoyé.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible d’envoyer le lien de réinitialisation.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     NOUVEL ENVOI
  ======================================================= */

  function handleRetry(): void {
    setSuccess("");
    setError("");
    setSentEmail("");
  }

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 px-4 py-10 text-slate-950 sm:py-16">
      <div className="mx-auto max-w-lg">
        <Link
          href="/auth/login"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-black text-orange-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50"
        >
          <ArrowLeft
            aria-hidden="true"
            size={17}
          />

          Retour à la connexion
        </Link>

        <section className="overflow-hidden rounded-[2.25rem] border border-orange-100 bg-white shadow-2xl shadow-orange-500/10">
          {/* En-tête */}

          <header className="bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 px-6 py-8 text-white sm:px-9 sm:py-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
              <ShieldCheck
                aria-hidden="true"
                size={27}
              />
            </div>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-orange-300">
              Sécurité du compte
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Mot de passe oublié
            </h1>

            <p className="mt-3 max-w-md text-sm font-semibold leading-7 text-slate-300">
              Indiquez l’adresse email associée
              à votre compte. Vous recevrez un
              lien permettant de définir un
              nouveau mot de passe.
            </p>
          </header>

          <div className="p-6 sm:p-9">
            {/* Messages */}

            <div
              aria-live="polite"
              aria-atomic="true"
            >
              {error && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm font-bold leading-6 text-red-700"
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
                  className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-emerald-700"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      size={19}
                    />

                    <div>
                      <p className="text-sm font-black">
                        Demande enregistrée
                      </p>

                      <p className="mt-1 text-sm font-semibold leading-6">
                        {success}
                      </p>

                      {sentEmail && (
                        <p className="mt-2 break-all text-xs font-black">
                          {sentEmail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!success ? (
              <form
                onSubmit={handleSubmit}
                className="grid gap-5"
              >
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="mb-2 block text-sm font-black text-slate-800"
                  >
                    Adresse email
                  </label>

                  <div className="relative">
                    <Mail
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={19}
                    />

                    <input
                      id="forgot-email"
                      required
                      type="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      disabled={loading}
                      aria-invalid={
                        Boolean(error)
                      }
                      onChange={(event) => {
                        setEmail(
                          event.target.value,
                        );

                        if (error) {
                          setError("");
                        }
                      }}
                      placeholder="nom@exemple.com"
                      className="w-full rounded-2xl border border-orange-100 bg-orange-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:from-orange-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <Loader2
                      aria-hidden="true"
                      className="animate-spin"
                      size={18}
                    />
                  ) : (
                    <Send
                      aria-hidden="true"
                      size={18}
                    />
                  )}

                  {loading
                    ? "Envoi en cours..."
                    : "Envoyer le lien"}
                </button>
              </form>
            ) : (
              <div className="grid gap-3">
                <p className="text-center text-sm font-semibold leading-6 text-slate-500">
                  Vérifiez également votre dossier
                  de courriers indésirables.
                </p>

                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Retour à la connexion
                </Link>

                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center justify-center rounded-2xl border border-orange-100 bg-white px-6 py-4 text-sm font-black text-orange-700 transition hover:bg-orange-50"
                >
                  Utiliser une autre adresse
                </button>
              </div>
            )}

            <p className="mt-6 text-center text-xs font-semibold leading-5 text-slate-400">
              Pour protéger les utilisateurs,
              Gotfit ne confirme pas si une
              adresse email est enregistrée.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}