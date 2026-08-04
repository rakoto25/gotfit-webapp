"use client";

import Link from "next/link";
import {
  Suspense,
  type FormEvent,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  X,
} from "lucide-react";

import AuthShell from "@/components/auth/AuthShell";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

import {
  getPostAuthRoute,
  getStoredAuth,
  saveAuth,
} from "@/lib/auth";

import {
  API_BASE_URL,
} from "@/lib/api-config";

import type {
  User,
} from "@/types/auth";

/* =========================================================
   TYPES
========================================================= */

type LoginResponse = {
  token?: string;
  user?: User;
  message?: string;

  errors?: Record<
    string,
    unknown
  >;
};

/* =========================================================
   OUTILS
========================================================= */

function getSafeRedirect(
  value: string | null,
): string | null {
  if (!value) {
    return null;
  }

  const redirect =
    value.trim();

  /*
   * Autorise uniquement les routes internes.
   * Cela évite les redirections vers un domaine externe.
   */
  if (
    !redirect.startsWith("/") ||
    redirect.startsWith("//") ||
    redirect.includes("\\")
  ) {
    return null;
  }

  return redirect;
}

function getFirstValidationError(
  errors?: Record<
    string,
    unknown
  >,
): string {
  if (!errors) {
    return "";
  }

  for (
    const error
    of Object.values(errors)
  ) {
    if (
      typeof error === "string" &&
      error.trim()
    ) {
      return error;
    }

    if (Array.isArray(error)) {
      const firstMessage =
        error.find(
          (
            message,
          ): message is string =>
            typeof message ===
              "string" &&
            message.trim().length > 0,
        );

      if (firstMessage) {
        return firstMessage;
      }
    }
  }

  return "";
}

function getLoginErrorMessage(
  result: LoginResponse | null,
): string {
  const validationError =
    getFirstValidationError(
      result?.errors,
    );

  if (validationError) {
    return validationError;
  }

  if (
    typeof result?.message ===
      "string" &&
    result.message.trim()
  ) {
    return result.message;
  }

  return "Email ou mot de passe incorrect.";
}

/* =========================================================
   PAGE
========================================================= */

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <LoginPageLoading />
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

/* =========================================================
   CONTENU
========================================================= */

function LoginPageContent() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const requestedRedirect =
    getSafeRedirect(
      searchParams.get(
        "redirect",
      ),
    );

  const passwordResetSuccess =
    searchParams.get(
      "passwordReset",
    ) === "success";

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     UTILISATEUR DÉJÀ CONNECTÉ
  ======================================================= */

  useEffect(() => {
    const storedAuth =
      getStoredAuth();

    if (!storedAuth) {
      return;
    }

    router.replace(
      requestedRedirect ??
        getPostAuthRoute(
          storedAuth.user,
        ),
    );
  }, [
    requestedRedirect,
    router,
  ]);

  /* =======================================================
     MODIFICATION DES CHAMPS
  ======================================================= */

  function handleEmailChange(
    value: string,
  ): void {
    setEmail(value);

    if (error) {
      setError("");
    }
  }

  function handlePasswordChange(
    value: string,
  ): void {
    setPassword(value);

    if (error) {
      setError("");
    }
  }

  /* =======================================================
     CONNEXION EMAIL ET MOT DE PASSE
  ======================================================= */

  async function handleLegacyLogin(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (loading) {
      return;
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Veuillez indiquer votre adresse email.",
      );

      return;
    }

    if (!password) {
      setError(
        "Veuillez indiquer votre mot de passe.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const apiBaseUrl =
        API_BASE_URL.replace(
          /\/+$/,
          "",
        );

      const response =
        await fetch(
          `${apiBaseUrl}/login`,
          {
            method: "POST",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email:
                normalizedEmail,

              password,
            }),

            cache: "no-store",
          },
        );

      const result =
        (await response
          .json()
          .catch(
            () => null,
          )) as LoginResponse | null;

      if (!response.ok) {
        throw new Error(
          getLoginErrorMessage(
            result,
          ),
        );
      }

      if (
        !result?.token ||
        !result.user
      ) {
        throw new Error(
          "La réponse du serveur est incomplète. Veuillez réessayer.",
        );
      }

      const authSaved =
        saveAuth(
          result.token,
          result.user,
        );

      if (!authSaved) {
        throw new Error(
          "La session n’a pas pu être enregistrée dans votre navigateur.",
        );
      }

      const destination =
        requestedRedirect ??
        getPostAuthRoute(
          result.user,
        );

      router.replace(
        destination,
      );

      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "La connexion n’a pas pu aboutir.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (
    <AuthShell
      eyebrow="Ravi de vous revoir"
      title="Connectez-vous en un clic."
      description="Utilisez votre compte Google ou votre adresse email pour accéder à votre espace Gotfit."
    >
      {/* Confirmation après changement du mot de passe */}

      {passwordResetSuccess && (
        <div
          role="status"
          className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold leading-6 text-emerald-700"
        >
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={19}
          />

          <div>
            <p className="font-black">
              Mot de passe modifié
            </p>

            <p>
              Votre mot de passe a été
              réinitialisé. Vous pouvez
              maintenant vous connecter.
            </p>
          </div>
        </div>
      )}

      {/* Erreur */}

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold leading-6 text-red-700"
        >
          <X
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={18}
          />

          <span>{error}</span>
        </div>
      )}

      {/* Connexion Google */}

      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
        <GoogleSignInButton
          flow="login"
          onError={(message) => {
            setError(message);
          }}
        />
      </div>

      {/* Séparateur */}

      <div className="my-7 flex items-center gap-4">
        <span
          aria-hidden="true"
          className="h-px flex-1 bg-slate-200"
        />

        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
          Accès avec mot de passe
        </span>

        <span
          aria-hidden="true"
          className="h-px flex-1 bg-slate-200"
        />
      </div>

      {/* Connexion classique */}

      <details className="group rounded-2xl border border-slate-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-black text-slate-700">
          <span>
            Se connecter avec email et mot de passe
          </span>

          <ChevronDown
            aria-hidden="true"
            size={18}
            className="shrink-0 transition group-open:rotate-180"
          />
        </summary>

        <form
          onSubmit={handleLegacyLogin}
          aria-busy={loading}
          className="grid gap-4 border-t border-slate-100 px-5 pb-5 pt-4"
        >
          {/* Email */}

          <div className="grid gap-2">
            <label
              htmlFor="login-email"
              className="text-sm font-bold text-slate-700"
            >
              Adresse email
            </label>

            <div className="gotfit-field">
              <Mail
                aria-hidden="true"
                size={18}
              />

              <input
                id="login-email"
                required
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                disabled={loading}
                aria-invalid={
                  Boolean(error)
                }
                onChange={(event) => {
                  handleEmailChange(
                    event.target.value,
                  );
                }}
                placeholder="vous@exemple.com"
              />
            </div>
          </div>

          {/* Mot de passe */}

          <div className="grid gap-2">
            <label
              htmlFor="login-password"
              className="text-sm font-bold text-slate-700"
            >
              Mot de passe
            </label>

            <div className="gotfit-field">
              <LockKeyhole
                aria-hidden="true"
                size={18}
              />

              <input
                id="login-password"
                required
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                autoComplete="current-password"
                value={password}
                disabled={loading}
                aria-invalid={
                  Boolean(error)
                }
                onChange={(event) => {
                  handlePasswordChange(
                    event.target.value,
                  );
                }}
                placeholder="Votre mot de passe"
              />

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setShowPassword(
                    (visible) =>
                      !visible,
                  );
                }}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
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

          {/* Mot de passe oublié */}

          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-xs font-black text-[var(--brand-strong)] transition hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          {/* Bouton */}

          <button
            type="submit"
            disabled={loading}
            className="gotfit-button gotfit-button-dark"
          >
            {loading ? (
              <>
                <Loader2
                  aria-hidden="true"
                  className="animate-spin"
                  size={17}
                />

                Connexion…
              </>
            ) : (
              <>
                Se connecter

                <ArrowRight
                  aria-hidden="true"
                  size={17}
                />
              </>
            )}
          </button>
        </form>
      </details>

      {/* Inscription */}

      <p className="mt-7 text-center text-sm text-slate-600">
        Première visite ?{" "}

        <Link
          href="/auth/register"
          className="font-black text-[var(--ink)] underline decoration-[var(--brand)] decoration-2 underline-offset-4"
        >
          Créer mon compte
        </Link>
      </p>
    </AuthShell>
  );
}

/* =========================================================
   CHARGEMENT DE LA PAGE
========================================================= */

function LoginPageLoading() {
  return (
    <AuthShell
      eyebrow="Connexion"
      title="Chargement..."
      description="Préparation de votre espace sécurisé Gotfit."
    >
      <div
        role="status"
        className="flex items-center justify-center gap-3 rounded-[1.75rem] border border-orange-100 bg-orange-50 px-6 py-12 text-sm font-black text-orange-700"
      >
        <Loader2
          aria-hidden="true"
          className="animate-spin"
          size={21}
        />

        Chargement de la connexion...
      </div>
    </AuthShell>
  );
}