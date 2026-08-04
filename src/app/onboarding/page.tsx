"use client";

import Link from "next/link";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import FitnessAssessmentForm from "@/components/onboarding/FitnessAssessmentForm";
import FormStep from "@/components/onboarding/FormStep";

import {
  getCurrentUser,
  getToken,
  hasRole,
} from "@/lib/auth";

import {
  fetchMyOnboarding,
  saveMyOnboarding,
} from "@/lib/client-journey";

import {
  EMPTY_FITNESS_ASSESSMENT,
  fitnessAssessmentToPayload,
  onboardingToFitnessAssessment,
  validateFitnessAssessment,
} from "@/lib/fitness-assessment";

import type {
  FitnessAssessmentValues,
} from "@/types/fitness-assessment";

/* =========================================================
   CONSTANTES
========================================================= */

const ONBOARDING_PATH = "/onboarding";

const LOGIN_REDIRECT_PATH =
  `/auth/login?redirect=${encodeURIComponent(
    ONBOARDING_PATH,
  )}`;

/* =========================================================
   PAGE
========================================================= */

export default function OnboardingPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<FitnessAssessmentValues>(
      () => ({
        ...EMPTY_FITNESS_ASSESSMENT,
      }),
    );

  const [completed, setCompleted] =
    useState(false);

  const [accessDenied, setAccessDenied] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =======================================================
     MODIFICATION DES CHAMPS
  ======================================================= */

  function updateField<
    K extends keyof FitnessAssessmentValues,
  >(
    field: K,
    value: FitnessAssessmentValues[K],
  ): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  }

  /* =======================================================
     CHARGEMENT
  ======================================================= */

  const loadOnboarding =
    useCallback(async (): Promise<void> => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const onboarding =
          await fetchMyOnboarding();

        setForm(
          onboardingToFitnessAssessment(
            onboarding,
          ),
        );

        setCompleted(
          Boolean(
            onboarding?.is_completed,
          ),
        );
      } catch (requestError) {
        setCompleted(false);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Impossible de charger le questionnaire d’onboarding.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /* =======================================================
     CONTRÔLE D’ACCÈS
  ======================================================= */

  useEffect(() => {
    const token = getToken();
    const user = getCurrentUser();

    if (!token || !user) {
      router.replace(
        LOGIN_REDIRECT_PATH,
      );

      return;
    }

    if (!hasRole(user, "client")) {
      setAccessDenied(true);
      setError("");
      setSuccess("");
      setLoading(false);

      return;
    }

    setAccessDenied(false);

    void loadOnboarding();
  }, [
    loadOnboarding,
    router,
  ]);

  /* =======================================================
     ENREGISTREMENT
  ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (saving || accessDenied) {
      return;
    }

    const validation =
      validateFitnessAssessment(
        form,
      );

    if (!validation.valid) {
      setSuccess("");
      setError(validation.message);

      const invalidField =
        event.currentTarget.elements.namedItem(
          validation.field,
        );

      if (
        invalidField instanceof HTMLElement
      ) {
        invalidField.focus();
      }

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload =
        fitnessAssessmentToPayload(
          form,
          true,
        );

      const saved =
        await saveMyOnboarding(
          payload,
        );

      setForm(
        onboardingToFitnessAssessment(
          saved,
        ),
      );

      setCompleted(
        Boolean(
          saved?.is_completed,
        ),
      );

      setSuccess(
        completed
          ? "Votre questionnaire d’onboarding a été mis à jour avec succès."
          : "Votre questionnaire d’onboarding a été enregistré avec succès.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible d’enregistrer le questionnaire d’onboarding.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FFF7ED] px-4 pb-16 pt-36 text-slate-950">
        <div className="mx-auto max-w-6xl">
          {/* Navigation */}

          <nav
            aria-label="Navigation de l’onboarding"
            className="mb-6 flex flex-wrap items-center justify-between gap-3"
          >
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-orange-700 shadow-sm transition hover:bg-orange-50"
            >
              <ArrowLeft
                aria-hidden="true"
                size={17}
              />

              Retour au profil
            </Link>

            <Link
              href="/parcours-client"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
            >
              <UserRound
                aria-hidden="true"
                size={17}
              />

              Mon parcours
            </Link>
          </nav>

          {/* Messages */}

          <div
            aria-live="polite"
            aria-atomic="true"
          >
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-[2rem] border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700"
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
                className="mb-5 flex items-start gap-3 rounded-[2rem] border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700"
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  size={18}
                />

                <span>{success}</span>
              </div>
            )}
          </div>

          {/* Chargement */}

          {loading ? (
            <div
              role="status"
              aria-label="Chargement du questionnaire"
              className="flex items-center justify-center rounded-[2rem] bg-white py-16 text-sm font-black text-orange-700 shadow-sm"
            >
              <Loader2
                aria-hidden="true"
                className="mr-3 animate-spin"
                size={20}
              />

              Chargement du questionnaire...
            </div>
          ) : accessDenied ? (
            /* Accès refusé */

            <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm">
              <ShieldCheck
                aria-hidden="true"
                className="mx-auto text-orange-600"
                size={36}
              />

              <h1 className="mt-4 text-2xl font-black">
                Accès réservé aux clients
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-7 text-slate-500">
                Ce questionnaire est réservé
                aux utilisateurs possédant un
                compte client.
              </p>

              <Link
                href="/profile"
                className="mt-6 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                Retour au profil
              </Link>
            </section>
          ) : (
            /* Questionnaire */

            <FormStep
              step={1}
              totalSteps={1}
              title="Questionnaire d’onboarding client"
              description="Ces informations permettent aux coachs de comprendre vos objectifs, votre niveau, vos contraintes et vos préférences avant votre première séance."
              icon={
                <ShieldCheck
                  aria-hidden="true"
                  size={22}
                />
              }
            >
              <FitnessAssessmentForm
                values={form}
                onChange={updateField}
                onSubmit={handleSubmit}
                saving={saving}
                completed={completed}
              />
            </FormStep>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}