"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
  UserRoundPlus,
} from "lucide-react";

import AuthShell from "@/components/auth/AuthShell";
import CoachRegistrationFields, {
  isValidSiret,
  normalizeSiret,
  validateCoachDocuments,
} from "@/components/auth/CoachRegistrationFields";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

import {
  getCurrentUser,
  getPostAuthRoute,
  saveAuth,
} from "@/lib/auth";
import { getApiUrl } from "@/lib/api-config";

import type { User } from "@/types/auth";

type RegisterRole = "client" | "intervenant";
type RegisterMethod = "google" | "form";

type RegisterResponse = {
  token?: string;
  access_token?: string;
  user?: User;
  message?: string;
  errors?: Record<string, string[]>;
};

const PENDING_COACH_STORAGE_KEY =
  "gotfit:pending-coach-registration";

const accountTypes = [
  {
    value: "client" as const,
    icon: UserRound,
    title: "Je cherche un coach",
    description:
      "Trouvez un professionnel, réservez vos séances et suivez votre progression.",
  },
  {
    value: "intervenant" as const,
    icon: BriefcaseBusiness,
    title: "Je suis coach",
    description:
      "Présentez votre expertise, développez votre activité et accompagnez vos clients.",
  },
];

function getRegisterError(
  result: RegisterResponse | null
): string {
  const validationMessage = result?.errors
    ? Object.values(result.errors).flat()[0]
    : null;

  return (
    validationMessage ||
    result?.message ||
    "L’inscription n’a pas pu aboutir. Veuillez réessayer."
  );
}

function isStrongPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[A-Za-zÀ-ÿ]/.test(value) &&
    /\d/.test(value)
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim()
  );
}

function clearPendingCoachRegistration(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(
    PENDING_COACH_STORAGE_KEY
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [method, setMethod] =
    useState<RegisterMethod>("google");

  const [role, setRole] =
    useState<RegisterRole>("client");

  const [acceptTerms, setAcceptTerms] =
    useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [companyName, setCompanyName] =
    useState("");

  const [siret, setSiret] = useState("");

  const [documents, setDocuments] = useState<
    File[]
  >([]);

  const [password, setPassword] = useState("");

  const [
    passwordConfirmation,
    setPasswordConfirmation,
  ] = useState("");

  const [showPasswords, setShowPasswords] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [documentError, setDocumentError] =
    useState("");

  const [error, setError] = useState("");

  const isCoach = role === "intervenant";

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (currentUser) {
      router.replace(
        getPostAuthRoute(currentUser)
      );
    }
  }, [router]);

  useEffect(() => {
    if (!isCoach) {
      setCompanyName("");
      setSiret("");
      setDocuments([]);
      setDocumentError("");

      clearPendingCoachRegistration();
    }
  }, [isCoach]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !isCoach
    ) {
      return;
    }

    window.sessionStorage.setItem(
      PENDING_COACH_STORAGE_KEY,
      JSON.stringify({
        role: "intervenant",
        siret: normalizeSiret(siret),
        company_name: companyName.trim(),
      })
    );
  }, [companyName, isCoach, siret]);

  function selectMethod(
    nextMethod: RegisterMethod
  ): void {
    setMethod(nextMethod);
    setError("");
    setDocumentError("");
  }

  function selectRole(
    nextRole: RegisterRole
  ): void {
    setRole(nextRole);
    setError("");
    setDocumentError("");
  }

  function validateCoachInformation(): boolean {
    if (!isCoach) {
      return true;
    }

    if (!companyName.trim()) {
      setError(
        "Indiquez le nom de votre entreprise, structure ou activité professionnelle."
      );
      return false;
    }

    if (!isValidSiret(siret)) {
      setError(
        "Le numéro SIRET doit contenir exactement 14 chiffres."
      );
      return false;
    }

    if (method === "form") {
      if (documents.length === 0) {
        setError(
          "Ajoutez au moins un diplôme ou une certification professionnelle."
        );
        return false;
      }

      const documentsValidationError =
        validateCoachDocuments(documents);

      if (documentsValidationError) {
        setDocumentError(
          documentsValidationError
        );
        return false;
      }
    }

    return true;
  }

  function savePendingCoachInformation(): void {
    if (
      typeof window === "undefined" ||
      !isCoach
    ) {
      return;
    }

    window.sessionStorage.setItem(
      PENDING_COACH_STORAGE_KEY,
      JSON.stringify({
        role: "intervenant",
        siret: normalizeSiret(siret),
        company_name: companyName.trim(),
      })
    );
  }

  function handleGoogleAttempt(): boolean {
    setError("");
    setDocumentError("");

    if (!acceptTerms) {
      setError(
        "Acceptez les conditions générales pour créer votre compte."
      );
      return false;
    }

    if (!validateCoachInformation()) {
      return false;
    }

    savePendingCoachInformation();

    return true;
  }

  async function handleManualRegister(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setDocumentError("");

    if (!acceptTerms) {
      setError(
        "Acceptez les conditions générales pour créer votre compte."
      );
      return;
    }

    if (!name.trim()) {
      setError("Indiquez votre nom complet.");
      return;
    }

    if (!isValidEmail(email)) {
      setError(
        "Indiquez une adresse email valide."
      );
      return;
    }

    if (!isStrongPassword(password)) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre."
      );
      return;
    }

    if (
      password !== passwordConfirmation
    ) {
      setError(
        "Les deux mots de passe ne correspondent pas."
      );
      return;
    }

    if (!validateCoachInformation()) {
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("password", password);

      formData.append(
        "password_confirmation",
        passwordConfirmation
      );

      formData.append("role", role);

      formData.append(
        "device_name",
        "gotfit-webapp"
      );

      if (isCoach) {
        formData.append(
          "siret",
          normalizeSiret(siret)
        );

        formData.append(
          "company_name",
          companyName.trim()
        );

        documents.forEach((document) => {
          formData.append(
            "documents[]",
            document
          );
        });
      }

      const response = await fetch(
        getApiUrl("register"),
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formData,
        }
      );

      const result = (await response
        .json()
        .catch(() => null)) as
        | RegisterResponse
        | null;

      const token =
        result?.token ||
        result?.access_token;

      if (
        !response.ok ||
        !token ||
        !result?.user
      ) {
        throw new Error(
          getRegisterError(result)
        );
      }

      const authSaved = saveAuth(
        token,
        result.user
      );

      if (!authSaved) {
        throw new Error(
          "Le compte a été créé, mais la session n’a pas pu être enregistrée dans le navigateur."
        );
      }

      clearPendingCoachRegistration();

      router.replace(
        getPostAuthRoute(result.user)
      );

      router.refresh();
    } catch (registerError) {
      setError(
        registerError instanceof Error
          ? registerError.message
          : "Une erreur est survenue pendant l’inscription."
      );
    } finally {
      setLoading(false);
    }
  }

  const termsControl = (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold leading-5 text-slate-600 transition hover:border-slate-300">
      <input
        type="checkbox"
        checked={acceptTerms}
        onChange={(event) => {
          setAcceptTerms(
            event.target.checked
          );
          setError("");
        }}
        disabled={loading}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--ink)] disabled:cursor-not-allowed"
      />

      <span>
        J’accepte les{" "}
        <Link
          href="/cgu"
          className="font-black text-[var(--ink)] underline"
        >
          conditions générales
        </Link>{" "}
        et la{" "}
        <Link
          href="/confidentialite"
          className="font-black text-[var(--ink)] underline"
        >
          politique de confidentialité
        </Link>
        .
      </span>
    </label>
  );

  const errorMessage = error ? (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700"
    >
      {error}
    </div>
  ) : null;

  return (
    <AuthShell
      eyebrow="Bienvenue chez Gotfit"
      title="Créez le compte qui vous ressemble."
      description="Rejoignez Gotfit comme coaché ou professionnel. Inscrivez-vous avec Google ou utilisez notre formulaire sécurisé."
    >
      <fieldset disabled={loading}>
        <legend className="mb-3 text-sm font-black text-slate-700">
          Choisissez votre méthode
          d’inscription
        </legend>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-2">
          <button
            type="button"
            onClick={() =>
              selectMethod("google")
            }
            aria-pressed={
              method === "google"
            }
            className={`rounded-xl px-3 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              method === "google"
                ? "bg-white text-[var(--ink)] shadow-sm"
                : "text-slate-500 hover:text-[var(--ink)]"
            }`}
          >
            <span className="mr-2 inline-grid h-5 w-5 place-items-center rounded-full border border-slate-200 bg-white text-xs">
              G
            </span>

            Avec Google
          </button>

          <button
            type="button"
            onClick={() =>
              selectMethod("form")
            }
            aria-pressed={
              method === "form"
            }
            className={`rounded-xl px-3 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              method === "form"
                ? "bg-white text-[var(--ink)] shadow-sm"
                : "text-slate-500 hover:text-[var(--ink)]"
            }`}
          >
            <UserRoundPlus
              size={17}
              className="mr-2 inline"
            />

            Formulaire
          </button>
        </div>
      </fieldset>

      <fieldset
        disabled={loading}
        className="mt-6"
      >
        <legend className="mb-3 text-sm font-black text-slate-700">
          Comment souhaitez-vous utiliser
          Gotfit ?
        </legend>

        <div className="grid gap-3 sm:grid-cols-2">
          {accountTypes.map(
            ({
              value,
              icon: Icon,
              title,
              description,
            }) => {
              const selected =
                role === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    selectRole(value)
                  }
                  aria-pressed={selected}
                  className={`relative rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    selected
                      ? "border-[var(--ink)] bg-[var(--ink)] text-white shadow-lg"
                      : "border-slate-200 bg-white text-[var(--ink)] hover:-translate-y-0.5 hover:border-[var(--brand)]"
                  }`}
                >
                  {selected && (
                    <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-[var(--brand)] text-[var(--ink)]">
                      <Check
                        size={14}
                        strokeWidth={3}
                      />
                    </span>
                  )}

                  <Icon
                    size={22}
                    className={
                      selected
                        ? "text-[var(--brand)]"
                        : ""
                    }
                  />

                  <strong className="mt-4 block text-sm font-black">
                    {title}
                  </strong>

                  <span
                    className={`mt-1 block text-xs leading-5 ${
                      selected
                        ? "text-white/60"
                        : "text-slate-500"
                    }`}
                  >
                    {description}
                  </span>
                </button>
              );
            }
          )}
        </div>
      </fieldset>

      {isCoach && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-900">
          <BadgeCheck
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>
            Les profils coachs sont
            vérifiés par l’équipe Gotfit
            avant leur publication sur la
            plateforme.
          </span>
        </div>
      )}

      {isCoach && (
        <div className="mt-5">
          <CoachRegistrationFields
            method={method}
            companyName={companyName}
            onCompanyNameChange={
              setCompanyName
            }
            siret={siret}
            onSiretChange={setSiret}
            documents={documents}
            onDocumentsChange={
              setDocuments
            }
            error={documentError}
            onError={setDocumentError}
            disabled={loading}
          />
        </div>
      )}

      {method === "google" ? (
        <div className="mt-5 space-y-4">
          {termsControl}
          {errorMessage}

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
            {acceptTerms ? (
              <div
                onClickCapture={(event) => {
                  if (
                    !handleGoogleAttempt()
                  ) {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                }}
              >
                <GoogleSignInButton
                  flow="register"
                  role={role}
                  onError={setError}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setError(
                    "Acceptez les conditions générales pour créer votre compte."
                  )
                }
                className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-400"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 font-black">
                  G
                </span>

                Continuer avec Google
              </button>
            )}
          </div>
        </div>
      ) : (
        <form
          onSubmit={
            handleManualRegister
          }
          className="mt-5 grid gap-4"
          noValidate
        >
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Nom complet

            <span className="gotfit-field">
              <UserRound size={18} />

              <input
                type="text"
                value={name}
                onChange={(event) => {
                  setName(
                    event.target.value
                  );
                  setError("");
                }}
                autoComplete="name"
                placeholder="Votre nom complet"
                maxLength={255}
                disabled={loading}
                required
              />
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Adresse email

              <span className="gotfit-field">
                <Mail size={18} />

                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(
                      event.target.value
                    );
                    setError("");
                  }}
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  disabled={loading}
                  required
                />
              </span>
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              <span>
                Téléphone{" "}
                <span className="font-semibold text-slate-400">
                  (optionnel)
                </span>
              </span>

              <span className="gotfit-field">
                <Phone size={18} />

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(
                      event.target.value
                    );
                    setError("");
                  }}
                  autoComplete="tel"
                  placeholder="+33 6 00 00 00 00"
                  maxLength={50}
                  disabled={loading}
                />
              </span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Mot de passe

              <span className="gotfit-field">
                <LockKeyhole
                  size={18}
                />

                <input
                  type={
                    showPasswords
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) => {
                    setPassword(
                      event.target.value
                    );
                    setError("");
                  }}
                  autoComplete="new-password"
                  placeholder="8 caractères minimum"
                  minLength={8}
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords(
                      (visible) =>
                        !visible
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPasswords
                      ? "Masquer les mots de passe"
                      : "Afficher les mots de passe"
                  }
                >
                  {showPasswords ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </span>
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Confirmation

              <span className="gotfit-field">
                <LockKeyhole
                  size={18}
                />

                <input
                  type={
                    showPasswords
                      ? "text"
                      : "password"
                  }
                  value={
                    passwordConfirmation
                  }
                  onChange={(event) => {
                    setPasswordConfirmation(
                      event.target.value
                    );
                    setError("");
                  }}
                  autoComplete="new-password"
                  placeholder="Répétez le mot de passe"
                  minLength={8}
                  disabled={loading}
                  required
                />
              </span>
            </label>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <LockKeyhole
              size={18}
              className="mt-0.5 shrink-0 text-slate-500"
            />

            <p className="text-xs font-semibold leading-5 text-slate-500">
              Utilisez au moins 8
              caractères avec une lettre
              et un chiffre. Évitez un mot
              de passe déjà utilisé sur un
              autre service.
            </p>
          </div>

          {termsControl}
          {errorMessage}

          <button
            type="submit"
            disabled={loading}
            className="gotfit-button gotfit-button-dark w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Création du compte…"
              : "Créer mon compte"}

            {!loading && (
              <ArrowRight size={18} />
            )}
          </button>
        </form>
      )}

      <p className="mt-7 text-center text-sm text-slate-600">
        Vous avez déjà un compte ?{" "}
        <Link
          href="/auth/login"
          className="font-black text-[var(--ink)] underline decoration-[var(--brand)] decoration-2 underline-offset-4"
        >
          Se connecter
        </Link>
      </p>
    </AuthShell>
  );
}