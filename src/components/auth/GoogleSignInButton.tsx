"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import { getPostAuthRoute, saveAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api-config";
import type { User } from "@/types/auth";

type RegisterRole = "client" | "intervenant";

type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

type GoogleAccountsId = {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    context?: "signin" | "signup" | "use";
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    ux_mode?: "popup" | "redirect";
    itp_support?: boolean;
  }) => void;

  renderButton: (
    element: HTMLElement,
    options: {
      type: "standard";
      theme: "outline" | "filled_blue" | "filled_black";
      size: "large" | "medium" | "small";
      text:
        | "signin_with"
        | "signup_with"
        | "continue_with"
        | "signin";
      shape: "rectangular" | "pill" | "circle" | "square";
      logo_alignment: "left" | "center";
      width?: number;
      locale?: string;
    }
  ) => void;

  cancel?: () => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

type GoogleAuthResponse = {
  token?: string;
  access_token?: string;
  user?: User;
  message?: string;
  errors?: Record<string, string[]>;
};

type PendingCoachRegistration = {
  role?: RegisterRole;
  siret?: string;
  company_name?: string;
};

type GoogleSignInButtonProps = {
  flow: "login" | "register";
  role?: RegisterRole;
  onError?: (message: string) => void;
};

const PENDING_COACH_STORAGE_KEY =
  "gotfit:pending-coach-registration";

function getResponseError(result: GoogleAuthResponse | null) {
  const validationMessage = result?.errors
    ? Object.values(result.errors).flat()[0]
    : null;

  return (
    validationMessage ||
    result?.message ||
    "La connexion Google n’a pas pu aboutir. Veuillez réessayer."
  );
}

function readPendingCoachRegistration():
  | PendingCoachRegistration
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.sessionStorage.getItem(
      PENDING_COACH_STORAGE_KEY
    );

    if (!storedValue) {
      return null;
    }

    const parsedValue = JSON.parse(
      storedValue
    ) as PendingCoachRegistration;

    return {
      role: parsedValue.role,
      siret:
        typeof parsedValue.siret === "string"
          ? parsedValue.siret.replace(/\D/g, "").slice(0, 14)
          : "",
      company_name:
        typeof parsedValue.company_name === "string"
          ? parsedValue.company_name.trim()
          : "",
    };
  } catch {
    window.sessionStorage.removeItem(
      PENDING_COACH_STORAGE_KEY
    );

    return null;
  }
}

function clearPendingCoachRegistration() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(
    PENDING_COACH_STORAGE_KEY
  );
}

export default function GoogleSignInButton({
  flow,
  role = "client",
  onError,
}: GoogleSignInButtonProps) {
  const router = useRouter();

  const buttonRef = useRef<HTMLDivElement>(null);
  const requestInProgressRef = useRef(false);
  const initializedRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(320);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  const handleCredential = useCallback(
    async ({ credential }: GoogleCredentialResponse) => {
      if (
        requestInProgressRef.current ||
        !credential
      ) {
        if (!credential) {
          onError?.(
            "Google n’a pas retourné de jeton d’authentification valide."
          );
        }

        return;
      }

      requestInProgressRef.current = true;
      setLoading(true);
      onError?.("");

      try {
        const pendingCoachRegistration =
          flow === "register" &&
          role === "intervenant"
            ? readPendingCoachRegistration()
            : null;

        if (
          flow === "register" &&
          role === "intervenant"
        ) {
          if (
            !pendingCoachRegistration?.siret ||
            pendingCoachRegistration.siret.length !== 14
          ) {
            throw new Error(
              "Le numéro SIRET du coach est manquant ou invalide."
            );
          }

          if (
            !pendingCoachRegistration.company_name
          ) {
            throw new Error(
              "Le nom de l’activité professionnelle est obligatoire."
            );
          }
        }

        const payload: Record<string, unknown> = {
          credential,
          device_name: "gotfit-webapp",
        };

        if (flow === "register") {
          payload.role = role;
        }

        if (
          flow === "register" &&
          role === "intervenant" &&
          pendingCoachRegistration
        ) {
          payload.siret =
            pendingCoachRegistration.siret;

          payload.company_name =
            pendingCoachRegistration.company_name;
        }

        const response = await fetch(
          `${API_BASE_URL}/auth/google`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        const result = (await response
          .json()
          .catch(() => null)) as
          | GoogleAuthResponse
          | null;

        const token =
          result?.token || result?.access_token;

        if (
          !response.ok ||
          !token ||
          !result?.user
        ) {
          throw new Error(
            getResponseError(result)
          );
        }

        saveAuth(token, result.user);

        clearPendingCoachRegistration();

        window.dispatchEvent(
          new Event("gotfit:auth")
        );

        router.replace(
          getPostAuthRoute(result.user)
        );

        router.refresh();
      } catch (error) {
        onError?.(
          error instanceof Error
            ? error.message
            : "Une erreur est survenue pendant la connexion Google."
        );
      } finally {
        requestInProgressRef.current = false;
        setLoading(false);
      }
    },
    [flow, onError, role, router]
  );

  const initializeGoogleButton =
    useCallback(() => {
      const googleIdentity =
        window.google?.accounts?.id;

      const buttonElement =
        buttonRef.current;

      if (
        !clientId ||
        !googleIdentity ||
        !buttonElement
      ) {
        return;
      }

      buttonElement.replaceChildren();

      googleIdentity.initialize({
        client_id: clientId,
        callback: handleCredential,
        context:
          flow === "register"
            ? "signup"
            : "signin",
        auto_select: false,
        cancel_on_tap_outside: true,
        ux_mode: "popup",
        itp_support: true,
      });

      googleIdentity.renderButton(
        buttonElement,
        {
          type: "standard",
          theme: "outline",
          size: "large",
          text:
            flow === "register"
              ? "signup_with"
              : "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: buttonWidth,
          locale: "fr",
        }
      );

      initializedRef.current = true;
    }, [
      buttonWidth,
      clientId,
      flow,
      handleCredential,
    ]);

  useEffect(() => {
    function updateButtonWidth() {
      const availableWidth =
        buttonRef.current?.parentElement
          ?.clientWidth ?? 320;

      const nextWidth = Math.max(
        240,
        Math.min(availableWidth, 400)
      );

      setButtonWidth(nextWidth);
    }

    updateButtonWidth();

    window.addEventListener(
      "resize",
      updateButtonWidth
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateButtonWidth
      );
    };
  }, []);

  useEffect(() => {
    if (
      scriptLoaded ||
      window.google?.accounts?.id
    ) {
      initializeGoogleButton();
    }
  }, [
    initializeGoogleButton,
    scriptLoaded,
  ]);

  useEffect(() => {
    initializedRef.current = false;

    if (window.google?.accounts?.id) {
      initializeGoogleButton();
    }
  }, [
    flow,
    initializeGoogleButton,
    role,
  ]);

  useEffect(() => {
    return () => {
      window.google?.accounts?.id?.cancel?.();
    };
  }, []);

  if (!clientId) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900"
      >
        <AlertCircle
          size={18}
          className="mt-0.5 shrink-0"
        />

        <div>
          <p className="font-black">
            Connexion Google non configurée
          </p>

          <p className="mt-1 text-xs font-semibold">
            Ajoutez{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5">
              NEXT_PUBLIC_GOOGLE_CLIENT_ID
            </code>{" "}
            dans le fichier{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5">
              .env.local
            </code>
            .
          </p>
        </div>
      </div>
    );
  }

  if (scriptError) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700"
      >
        <AlertCircle
          size={18}
          className="mt-0.5 shrink-0"
        />

        <div>
          <p className="font-black">
            Google est temporairement indisponible
          </p>

          <p className="mt-1 text-xs font-semibold">
            Vérifiez votre connexion Internet,
            désactivez temporairement les bloqueurs de
            scripts, puis actualisez la page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Script
        id="google-identity-services"
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          setScriptLoaded(true);
          setScriptError(false);
        }}
        onReady={() => {
          setScriptLoaded(true);
          setScriptError(false);
          initializeGoogleButton();
        }}
        onError={() => {
          setScriptError(true);
          setScriptLoaded(false);
        }}
      />

      <div className="relative flex min-h-[44px] w-full justify-center">
        <div
          ref={buttonRef}
          aria-label={
            flow === "register"
              ? "S’inscrire avec Google"
              : "Se connecter avec Google"
          }
          className={`flex w-full justify-center transition ${
            loading
              ? "pointer-events-none opacity-20"
              : ""
          }`}
        />

        {!scriptLoaded &&
          !window.google?.accounts?.id &&
          !scriptError && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-black text-slate-600">
              <LoaderCircle
                className="animate-spin"
                size={18}
              />

              Chargement de Google…
            </div>
          )}

        {loading && (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-black text-[var(--ink)] shadow-sm"
          >
            <LoaderCircle
              className="animate-spin"
              size={18}
            />

            Connexion sécurisée…
          </div>
        )}
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold leading-5 text-slate-500">
        <ShieldCheck
          size={14}
          className="shrink-0 text-[var(--brand)]"
        />

        Gotfit ne reçoit et ne conserve jamais
        votre mot de passe Google.
      </p>
    </div>
  );
}