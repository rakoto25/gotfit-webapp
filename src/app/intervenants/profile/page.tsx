"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import CoachProfessionalProfile from "@/components/coach/CoachProfessionalProfile";

import {
  getIntervenantRoleNames,
  normalizeProfile,
  type Intervenant,
} from "@/lib/intervenants";

/* =========================================================
   CONFIGURATION
========================================================= */

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  "https://api.gotfit.tech/api"
).replace(/\/+$/, "");

const PROFILE_PAGE_PATH =
  "/intervenant/profile";

const LOGIN_PAGE_PATH =
  "/auth/login";

const DASHBOARD_PAGE_PATH =
  "/intervenant/dashboard";

/*
 * Plusieurs endpoints sont testés pour rester compatible
 * avec les différentes versions de l’API Laravel Gotfit.
 */
const PROFILE_ENDPOINTS = [
  `${API_URL}/intervenant/profile`,
  `${API_URL}/auth/me`,
  `${API_URL}/me`,
] as const;

const TOKEN_STORAGE_KEYS = [
  "gotfit:token",
  "gotfit:access_token",
  "auth_token",
  "access_token",
  "token",
] as const;

const USER_STORAGE_KEYS = [
  "gotfit:user",
  "user",
] as const;

/* =========================================================
   TYPES
========================================================= */

type PageStatus =
  | "loading"
  | "success"
  | "error";

type UnknownRecord =
  Record<string, unknown>;

type ProfileRequestResult =
  | {
      type: "success";
      profile: Intervenant;
    }
  | {
      type: "unauthorized";
    }
  | {
      type: "not_found";
      message: string;
    };

/* =========================================================
   OUTILS GÉNÉRIQUES
========================================================= */

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getText(
  value: unknown,
): string | null {
  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    return value.trim();
  }

  return null;
}

function getApiMessage(
  payload: unknown,
  fallback: string,
): string {
  if (!isRecord(payload)) {
    return fallback;
  }

  const directMessage =
    getText(payload.message) ??
    getText(payload.error);

  if (directMessage) {
    return directMessage;
  }

  if (isRecord(payload.data)) {
    const nestedMessage =
      getText(payload.data.message) ??
      getText(payload.data.error);

    if (nestedMessage) {
      return nestedMessage;
    }
  }

  return fallback;
}

/* =========================================================
   SESSION LOCALE
========================================================= */

function readFirstStorageValue(
  keys: readonly string[],
): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  for (const key of keys) {
    const value =
      window.localStorage.getItem(key);

    if (
      typeof value === "string" &&
      value.trim() !== ""
    ) {
      return value.trim();
    }
  }

  return null;
}

function readAuthToken(): string | null {
  return readFirstStorageValue(
    TOKEN_STORAGE_KEYS,
  );
}

function readStoredProfile():
  | Intervenant
  | null {
  const rawUser =
    readFirstStorageValue(
      USER_STORAGE_KEYS,
    );

  if (!rawUser) {
    return null;
  }

  try {
    const parsed: unknown =
      JSON.parse(rawUser);

    return normalizeProfile(parsed);
  } catch {
    return null;
  }
}

function saveStoredProfile(
  profile: Intervenant,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const serializedProfile =
    JSON.stringify(profile);

  /*
   * Les deux clés sont conservées pour rester compatible
   * avec les anciennes parties de la webapp.
   */
  window.localStorage.setItem(
    "gotfit:user",
    serializedProfile,
  );

  window.localStorage.setItem(
    "user",
    serializedProfile,
  );
}

function clearStoredAuthentication(): void {
  if (typeof window === "undefined") {
    return;
  }

  TOKEN_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });

  USER_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

/* =========================================================
   VÉRIFICATION DU RÔLE
========================================================= */

function canAccessIntervenantProfile(
  profile: Intervenant,
): boolean {
  const roles =
    getIntervenantRoleNames(profile);

  /*
   * Compatibilité avec les anciennes réponses API
   * qui ne renvoyaient aucun rôle.
   */
  if (roles.length === 0) {
    return true;
  }

  return roles.some((role) => {
    const normalizedRole =
      role.toLowerCase();

    return (
      normalizedRole.includes(
        "intervenant",
      ) ||
      normalizedRole.includes("coach") ||
      normalizedRole.includes("admin")
    );
  });
}

/* =========================================================
   REQUÊTE API
========================================================= */

async function requestProfile(
  token: string,
  signal?: AbortSignal,
): Promise<ProfileRequestResult> {
  let lastMessage =
    "L’endpoint du profil intervenant est introuvable.";

  for (
    const endpoint of PROFILE_ENDPOINTS
  ) {
    const response = await fetch(endpoint, {
      method: "GET",

      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },

      cache: "no-store",
      signal,
    });

    if (response.status === 401) {
      return {
        type: "unauthorized",
      };
    }

    const payload: unknown =
      await response
        .json()
        .catch(() => null);

    /*
     * Une route inexistante ou non autorisée en GET
     * déclenche l’essai de l’endpoint suivant.
     */
    if (
      response.status === 404 ||
      response.status === 405
    ) {
      lastMessage = getApiMessage(
        payload,
        lastMessage,
      );

      continue;
    }

    if (response.status === 403) {
      throw new Error(
        getApiMessage(
          payload,
          "Vous n’avez pas l’autorisation d’accéder à ce profil.",
        ),
      );
    }

    if (!response.ok) {
      throw new Error(
        getApiMessage(
          payload,
          "Impossible de récupérer le profil intervenant.",
        ),
      );
    }

    const profile =
      normalizeProfile(payload);

    if (!profile) {
      lastMessage =
        "La réponse de l’API ne contient aucun profil exploitable.";

      continue;
    }

    return {
      type: "success",
      profile,
    };
  }

  return {
    type: "not_found",
    message: lastMessage,
  };
}

/* =========================================================
   SQUELETTE DE CHARGEMENT
========================================================= */

function ProfilePageSkeleton() {
  return (
    <div
      className="animate-pulse space-y-6"
      aria-hidden="true"
    >
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
        <div className="h-52 bg-slate-200" />

        <div className="px-6 pb-8">
          <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="h-28 w-28 rounded-[1.75rem] border-4 border-white bg-slate-300" />

            <div className="flex-1 space-y-3 pb-2">
              <div className="h-5 w-28 rounded-full bg-slate-200" />
              <div className="h-9 w-64 max-w-full rounded-lg bg-slate-200" />
              <div className="h-5 w-40 rounded-lg bg-slate-200" />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({
              length: 4,
            }).map((_, index) => (
              <div
                key={index}
                className="h-32 rounded-2xl bg-slate-100"
              />
            ))}
          </div>

          <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <div className="h-64 rounded-3xl bg-slate-100" />
              <div className="h-56 rounded-3xl bg-slate-100" />
            </div>

            <div className="space-y-5">
              <div className="h-80 rounded-3xl bg-slate-100" />
              <div className="h-64 rounded-3xl bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function IntervenantProfilePage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<Intervenant | null>(null);

  const [status, setStatus] =
    useState<PageStatus>("loading");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [
    warningMessage,
    setWarningMessage,
  ] = useState("");

  const loadProfile = useCallback(
    async (signal?: AbortSignal) => {
      setStatus("loading");
      setErrorMessage("");
      setWarningMessage("");

      const token = readAuthToken();

      if (!token) {
        router.replace(
          `${LOGIN_PAGE_PATH}?redirect=${encodeURIComponent(
            PROFILE_PAGE_PATH,
          )}`,
        );

        return;
      }

      const storedProfile =
        readStoredProfile();

      /*
       * Bloque immédiatement un utilisateur explicitement
       * identifié comme client.
       */
      if (
        storedProfile &&
        !canAccessIntervenantProfile(
          storedProfile,
        )
      ) {
        router.replace("/dashboard");
        return;
      }

      try {
        const result =
          await requestProfile(
            token,
            signal,
          );

        if (
          result.type ===
          "unauthorized"
        ) {
          clearStoredAuthentication();

          router.replace(
            `${LOGIN_PAGE_PATH}?redirect=${encodeURIComponent(
              PROFILE_PAGE_PATH,
            )}`,
          );

          return;
        }

        if (
          result.type === "success"
        ) {
          if (
            !canAccessIntervenantProfile(
              result.profile,
            )
          ) {
            router.replace("/dashboard");
            return;
          }

          saveStoredProfile(
            result.profile,
          );

          setProfile(result.profile);
          setStatus("success");

          return;
        }

        /*
         * Tant que la nouvelle route Laravel n’est pas
         * disponible, on utilise les informations locales.
         */
        if (
          result.type ===
            "not_found" &&
          storedProfile
        ) {
          setProfile(storedProfile);

          setWarningMessage(
            "Le profil affiché provient temporairement de la session locale. L’endpoint Laravel du profil intervenant n’a pas encore été trouvé.",
          );

          setStatus("success");

          return;
        }

        throw new Error(
          result.message,
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        /*
         * En cas de problème réseau, les données locales
         * restent utilisables si elles existent.
         */
        if (storedProfile) {
          setProfile(storedProfile);

          setWarningMessage(
            "L’API est temporairement indisponible. Les dernières informations enregistrées sur cet appareil sont affichées.",
          );

          setStatus("success");

          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Une erreur inattendue est survenue.",
        );

        setStatus("error");
      }
    },
    [router],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    const timer = window.setTimeout(() => {
      void loadProfile(
        controller.signal,
      );
    }, 0);

    /*
     * Recharge le profil lorsque la session Gotfit
     * est modifiée ailleurs dans la webapp.
     */
    const handleAuthChange = () => {
      void loadProfile();
    };

    window.addEventListener(
      "gotfit:auth",
      handleAuthChange,
    );

    window.addEventListener(
      "storage",
      handleAuthChange,
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();

      window.removeEventListener(
        "gotfit:auth",
        handleAuthChange,
      );

      window.removeEventListener(
        "storage",
        handleAuthChange,
      );
    };
  }, [loadProfile]);

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-7xl">
        {/* ================================================
            EN-TÊTE DE PAGE
        ================================================= */}

        <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <nav
              aria-label="Fil d’Ariane"
              className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400"
            >
              <Link
                href={
                  DASHBOARD_PAGE_PATH
                }
                className="transition hover:text-orange-600"
              >
                Tableau de bord
              </Link>

              <span aria-hidden="true">
                /
              </span>

              <span className="text-slate-600">
                Profil professionnel
              </span>
            </nav>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Espace intervenant
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Mon profil professionnel
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Consultez votre présentation,
              vos informations professionnelles
              et l’état de validation de votre
              profil Gotfit.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={
                DASHBOARD_PAGE_PATH
              }
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Tableau de bord
            </Link>

            <button
              type="button"
              onClick={() => {
                void loadProfile();
              }}
              disabled={
                status === "loading"
              }
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-xs font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
            >
              {status === "loading"
                ? "Actualisation..."
                : "Actualiser"}
            </button>
          </div>
        </header>

        {/* ================================================
            AVERTISSEMENT
        ================================================= */}

        {warningMessage && (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900"
          >
            <strong className="block font-black">
              Informations temporaires
            </strong>

            <span className="mt-1 block">
              {warningMessage}
            </span>
          </div>
        )}

        {/* ================================================
            CHARGEMENT
        ================================================= */}

        {status === "loading" && (
          <ProfilePageSkeleton />
        )}

        {/* ================================================
            ERREUR
        ================================================= */}

        {status === "error" && (
          <section className="mx-auto max-w-2xl rounded-[2rem] border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl font-black text-red-600">
              !
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-red-500">
              Erreur de chargement
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Profil indisponible
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {errorMessage}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  void loadProfile();
                }}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-slate-800"
              >
                Réessayer
              </button>

              <Link
                href={
                  DASHBOARD_PAGE_PATH
                }
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                Retour au tableau de bord
              </Link>
            </div>
          </section>
        )}

        {/* ================================================
            PROFIL
        ================================================= */}

        {status === "success" &&
          profile && (
            <CoachProfessionalProfile
              intervenant={profile}
              editable
              showSensitiveDetails
              dashboardHref={
                DASHBOARD_PAGE_PATH
              }
              editProfileHref="/intervenant/profile/edit"
              documentsHref="/intervenant/profile/documents"
            />
          )}
      </div>
    </main>
  );
}
