"use client";

import Link from "next/link";
import {
  Suspense,
  type FormEvent,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  resetPassword,
} from "@/lib/auth";

/* =========================================================
   PAGE
========================================================= */

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <ResetPasswordLoading />
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

/* =========================================================
   CONTENU
========================================================= */

function ResetPasswordContent() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const token =
    searchParams.get("token")?.trim() ??
    "";

  const email =
    searchParams.get("email")?.trim() ??
    "";

  const invalidLink =
    !token || !email;

  const [password, setPassword] =
    useState("");

  const [
    passwordConfirmation,
    setPasswordConfirmation,
  ] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    showPasswordConfirmation,
    setShowPasswordConfirmation,
  ] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const hasMinimumLength =
    password.length >= 8;

  const hasLetter =
    /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(
      password,
    );

  const hasNumber =
    /\d/.test(password);

  const passwordsMatch =
    password.length > 0 &&
    password ===
      passwordConfirmation;

  const passwordIsValid =
    hasMinimumLength &&
    hasLetter &&
    hasNumber &&
    passwordsMatch;

  /* =======================================================
     RÉINITIALISATION
  ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (
      loading ||
      invalidLink
    ) {
      return;
    }

    if (!passwordIsValid) {
      setSuccess("");

      setError(
        "Veuillez respecter toutes les règles du nouveau mot de passe.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response =
        await resetPassword({
          email,
          token,
          password,

          password_confirmation:
            passwordConfirmation,
        });

      setPassword("");
      setPasswordConfirmation("");

      setSuccess(
        response.message ||
          "Votre mot de passe a été réinitialisé avec succès.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de réinitialiser le mot de passe.",
      );
    } finally {
      setLoading(false);
    }
  }

  function goToLogin(): void {
    router.replace(
      "/auth/login?passwordReset=success",
    );
  }

  /* =======================================================
     LIEN INVALIDE
  ======================================================= */

  if (invalidLink) {
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

          <section className="rounded-[2.25rem] border border-red-100 bg-white p-7 text-center shadow-2xl shadow-red-500/10 sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <ShieldAlert
                aria-hidden="true"
                size={31}
              />
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-tight">
              Lien invalide
            </h1>

            <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
              Le lien de réinitialisation est
              incomplet, invalide ou a expiré.
              Demandez un nouveau lien depuis
              la page « Mot de passe oublié ».
            </p>

            <Link
              href="/auth/forgot-password"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700"
            >
              <Mail
                aria-hidden="true"
                size={18}
              />

              Demander un nouveau lien
            </Link>
          </section>
        </div>
      </main>
    );
  }

  /* =======================================================
     FORMULAIRE
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
              <KeyRound
                aria-hidden="true"
                size={27}
              />
            </div>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-orange-300">
              Sécurité du compte
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Nouveau mot de passe
            </h1>

            <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">
              Choisissez un nouveau mot de passe
              sécurisé pour accéder à votre
              compte Gotfit.
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
                  className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-bold leading-6 text-emerald-700"
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    size={19}
                  />

                  <span>{success}</span>
                </div>
              )}
            </div>

            {success ? (
              <div className="grid gap-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <ShieldCheck
                    aria-hidden="true"
                    size={31}
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-black">
                    Mot de passe modifié
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    Vous pouvez maintenant vous
                    connecter avec votre nouveau
                    mot de passe.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={goToLogin}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Accéder à la connexion
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="grid gap-5"
              >
                {/* Email */}

                <div>
                  <label
                    htmlFor="reset-email"
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
                      id="reset-email"
                      type="email"
                      name="email"
                      value={email}
                      readOnly
                      aria-readonly="true"
                      className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 py-4 pl-12 pr-4 text-sm font-bold text-slate-500 outline-none"
                    />
                  </div>
                </div>

                {/* Nouveau mot de passe */}

                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-black text-slate-800"
                  >
                    Nouveau mot de passe
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={19}
                    />

                    <input
                      id="new-password"
                      required
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      autoComplete="new-password"
                      minLength={8}
                      value={password}
                      disabled={loading}
                      onChange={(event) => {
                        setPassword(
                          event.target.value,
                        );

                        if (error) {
                          setError("");
                        }
                      }}
                      placeholder="Votre nouveau mot de passe"
                      className="w-full rounded-2xl border border-orange-100 bg-orange-50 py-4 pl-12 pr-12 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setShowPassword(
                          (current) =>
                            !current,
                        );
                      }}
                      disabled={loading}
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-orange-600 disabled:opacity-50"
                    >
                      {showPassword ? (
                        <EyeOff
                          aria-hidden="true"
                          size={18}
                        />
                      ) : (
                        <Eye
                          aria-hidden="true"
                          size={18}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirmation */}

                <div>
                  <label
                    htmlFor="password-confirmation"
                    className="mb-2 block text-sm font-black text-slate-800"
                  >
                    Confirmer le mot de passe
                  </label>

                  <div className="relative">
                    <ShieldCheck
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={19}
                    />

                    <input
                      id="password-confirmation"
                      required
                      type={
                        showPasswordConfirmation
                          ? "text"
                          : "password"
                      }
                      name="password_confirmation"
                      autoComplete="new-password"
                      minLength={8}
                      value={
                        passwordConfirmation
                      }
                      disabled={loading}
                      onChange={(event) => {
                        setPasswordConfirmation(
                          event.target.value,
                        );

                        if (error) {
                          setError("");
                        }
                      }}
                      placeholder="Confirmez le mot de passe"
                      className="w-full rounded-2xl border border-orange-100 bg-orange-50 py-4 pl-12 pr-12 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordConfirmation(
                          (current) =>
                            !current,
                        );
                      }}
                      disabled={loading}
                      aria-label={
                        showPasswordConfirmation
                          ? "Masquer la confirmation"
                          : "Afficher la confirmation"
                      }
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-orange-600 disabled:opacity-50"
                    >
                      {showPasswordConfirmation ? (
                        <EyeOff
                          aria-hidden="true"
                          size={18}
                        />
                      ) : (
                        <Eye
                          aria-hidden="true"
                          size={18}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* Règles */}

                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-orange-700">
                    Le mot de passe doit contenir
                  </p>

                  <div className="grid gap-2 text-xs font-bold">
                    <PasswordRule
                      valid={
                        hasMinimumLength
                      }
                      label="Au moins 8 caractères"
                    />

                    <PasswordRule
                      valid={hasLetter}
                      label="Au moins une lettre"
                    />

                    <PasswordRule
                      valid={hasNumber}
                      label="Au moins un chiffre"
                    />

                    <PasswordRule
                      valid={passwordsMatch}
                      label="Deux mots de passe identiques"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !passwordIsValid
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:from-orange-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <Loader2
                      aria-hidden="true"
                      className="animate-spin"
                      size={18}
                    />
                  ) : (
                    <KeyRound
                      aria-hidden="true"
                      size={18}
                    />
                  )}

                  {loading
                    ? "Modification..."
                    : "Modifier le mot de passe"}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   RÈGLE DU MOT DE PASSE
========================================================= */

function PasswordRule({
  valid,
  label,
}: {
  valid: boolean;
  label: string;
}) {
  return (
    <div
      className={
        valid
          ? "flex items-center gap-2 text-emerald-700"
          : "flex items-center gap-2 text-slate-500"
      }
    >
      <CheckCircle2
        aria-hidden="true"
        size={15}
        className={
          valid
            ? "text-emerald-600"
            : "text-slate-300"
        }
      />

      <span>{label}</span>
    </div>
  );
}

/* =========================================================
   CHARGEMENT
========================================================= */

function ResetPasswordLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 px-4 py-16 text-slate-950">
      <div className="mx-auto flex max-w-lg items-center justify-center py-28">
        <div
          role="status"
          className="flex items-center gap-3 rounded-3xl border border-orange-100 bg-white px-6 py-5 text-sm font-black text-orange-700 shadow-xl shadow-orange-500/10"
        >
          <Loader2
            aria-hidden="true"
            className="animate-spin"
            size={20}
          />

          Vérification du lien...
        </div>
      </div>
    </main>
  );
}