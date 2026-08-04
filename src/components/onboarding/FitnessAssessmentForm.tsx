"use client";

import type {
  FormEvent,
  ReactNode,
} from "react";

import {
  BadgeCheck,
  Loader2,
  Save,
} from "lucide-react";

import type {
  FitnessAssessmentChange,
  FitnessAssessmentValues,
} from "@/types/fitness-assessment";

/* =========================================================
   TYPES DU COMPOSANT
========================================================= */

export type FitnessAssessmentFormProps = {
  values: FitnessAssessmentValues;
  onChange: FitnessAssessmentChange;

  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void | Promise<void>;

  saving?: boolean;
  completed?: boolean;
  disabled?: boolean;
};

/* =========================================================
   COMPOSANT
========================================================= */

export default function FitnessAssessmentForm({
  values,
  onChange,
  onSubmit,
  saving = false,
  completed = false,
  disabled = false,
}: FitnessAssessmentFormProps) {
  const isDisabled =
    disabled || saving;

  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      aria-busy={saving}
      className="grid gap-5"
    >
      {/* Objectifs et niveau */}

      <div className="grid gap-5 lg:grid-cols-2">
        <Field
          id="fitness-goals"
          label="Objectifs principaux"
          hint="Séparez les objectifs par des virgules."
        >
          <input
            id="fitness-goals"
            required
            type="text"
            name="goals"
            autoComplete="off"
            value={values.goals}
            disabled={isDisabled}
            aria-describedby="fitness-goals-hint"
            onChange={(event) => {
              onChange(
                "goals",
                event.target.value,
              );
            }}
            placeholder="Perte de poids, mobilité, renforcement..."
            className="gotfit-input"
          />
        </Field>

        <Field
          id="fitness-level"
          label="Niveau actuel"
        >
          <select
            id="fitness-level"
            required
            name="level"
            value={values.level}
            disabled={isDisabled}
            onChange={(event) => {
              onChange(
                "level",
                event.target.value,
              );
            }}
            className="gotfit-input"
          >
            <option value="">
              Choisir un niveau
            </option>

            <option value="debutant">
              Débutant
            </option>

            <option value="intermediaire">
              Intermédiaire
            </option>

            <option value="avance">
              Avancé
            </option>

            <option value="reprise">
              Reprise après une pause ou une blessure
            </option>
          </select>
        </Field>
      </div>

      {/* Préférences */}

      <TextField
        id="fitness-preferences"
        name="preferences"
        label="Préférences d’entraînement"
        value={values.preferences}
        disabled={isDisabled}
        onChange={(value) => {
          onChange(
            "preferences",
            value,
          );
        }}
        placeholder="À domicile, en salle, intensité souhaitée, matériel disponible..."
      />

      <TextField
        id="fitness-availability"
        name="availability"
        label="Disponibilités"
        value={values.availability}
        disabled={isDisabled}
        onChange={(value) => {
          onChange(
            "availability",
            value,
          );
        }}
        placeholder="Lundi soir, mercredi matin, week-end..."
      />

      <TextField
        id="fitness-health"
        name="health"
        label="Contraintes de santé ou blessures"
        value={values.health}
        disabled={isDisabled}
        onChange={(value) => {
          onChange(
            "health",
            value,
          );
        }}
        placeholder="Blessures, douleurs, contre-indications ou points de vigilance..."
      />

      {/* Mesures */}

      <div className="grid gap-5 md:grid-cols-3">
        <Field
          id="fitness-height"
          label="Taille"
          hint="Vous pouvez indiquer la valeur en centimètres."
        >
          <input
            id="fitness-height"
            type="text"
            name="height"
            inputMode="decimal"
            autoComplete="off"
            value={values.height}
            disabled={isDisabled}
            aria-describedby="fitness-height-hint"
            onChange={(event) => {
              onChange(
                "height",
                event.target.value,
              );
            }}
            placeholder="Ex. : 175"
            className="gotfit-input"
          />
        </Field>

        <Field
          id="fitness-weight"
          label="Poids"
          hint="Vous pouvez indiquer la valeur en kilogrammes."
        >
          <input
            id="fitness-weight"
            type="text"
            name="weight"
            inputMode="decimal"
            autoComplete="off"
            value={values.weight}
            disabled={isDisabled}
            aria-describedby="fitness-weight-hint"
            onChange={(event) => {
              onChange(
                "weight",
                event.target.value,
              );
            }}
            placeholder="Ex. : 72"
            className="gotfit-input"
          />
        </Field>

        <Field
          id="fitness-birth-year"
          label="Année de naissance"
        >
          <input
            id="fitness-birth-year"
            type="text"
            name="birthYear"
            inputMode="numeric"
            autoComplete="bday-year"
            maxLength={4}
            value={values.birthYear}
            disabled={isDisabled}
            onChange={(event) => {
              const birthYear =
                event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 4);

              onChange(
                "birthYear",
                birthYear,
              );
            }}
            placeholder="Ex. : 1992"
            className="gotfit-input"
          />
        </Field>
      </div>

      {/* Mode de vie */}

      <TextField
        id="fitness-lifestyle"
        name="lifestyle"
        label="Mode de vie"
        value={values.lifestyle}
        disabled={isDisabled}
        onChange={(value) => {
          onChange(
            "lifestyle",
            value,
          );
        }}
        placeholder="Sommeil, stress, activité quotidienne, alimentation..."
      />

      {/* Contact d’urgence */}

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          id="fitness-emergency-name"
          label="Contact d’urgence"
        >
          <input
            id="fitness-emergency-name"
            type="text"
            name="emergencyName"
            autoComplete="section-emergency name"
            value={values.emergencyName}
            disabled={isDisabled}
            onChange={(event) => {
              onChange(
                "emergencyName",
                event.target.value,
              );
            }}
            placeholder="Nom du contact"
            className="gotfit-input"
          />
        </Field>

        <Field
          id="fitness-emergency-phone"
          label="Téléphone d’urgence"
        >
          <input
            id="fitness-emergency-phone"
            type="tel"
            name="emergencyPhone"
            inputMode="tel"
            autoComplete="section-emergency tel"
            value={values.emergencyPhone}
            disabled={isDisabled}
            onChange={(event) => {
              onChange(
                "emergencyPhone",
                event.target.value,
              );
            }}
            placeholder="+33..."
            className="gotfit-input"
          />
        </Field>
      </div>

      {/* Informations complémentaires */}

      <TextField
        id="fitness-extra-answers"
        name="extraAnswers"
        label="Autres informations utiles"
        value={values.extraAnswers}
        disabled={isDisabled}
        onChange={(value) => {
          onChange(
            "extraAnswers",
            value,
          );
        }}
        placeholder="Tout ce que le coach doit savoir pour mieux vous accompagner."
      />

      {/* Enregistrement */}

      <div className="flex flex-col gap-4 rounded-[2rem] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div
          aria-live="polite"
          className="flex items-center gap-3 text-sm font-bold text-slate-600"
        >
          <BadgeCheck
            aria-hidden="true"
            className={
              completed
                ? "text-emerald-600"
                : "text-orange-600"
            }
            size={20}
          />

          <span>
            Statut :{" "}
            {completed
              ? "complété"
              : "brouillon"}
          </span>
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          aria-disabled={isDisabled}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {saving ? (
            <Loader2
              aria-hidden="true"
              className="animate-spin"
              size={18}
            />
          ) : (
            <Save
              aria-hidden="true"
              size={18}
            />
          )}

          {saving
            ? "Enregistrement..."
            : completed
              ? "Mettre à jour l’onboarding"
              : "Enregistrer l’onboarding"}
        </button>
      </div>
    </form>
  );
}

/* =========================================================
   CHAMP GÉNÉRIQUE
========================================================= */

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
};

function Field({
  id,
  label,
  hint,
  children,
}: FieldProps) {
  const hintId = `${id}-hint`;

  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm">
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-black text-slate-800"
      >
        {label}
      </label>

      {hint && (
        <p
          id={hintId}
          className="mb-3 text-xs font-bold leading-5 text-slate-400"
        >
          {hint}
        </p>
      )}

      {children}
    </div>
  );
}

/* =========================================================
   ZONE DE TEXTE
========================================================= */

type TextFieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  placeholder: string;
  disabled?: boolean;
  rows?: number;
  onChange: (value: string) => void;
};

function TextField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  rows = 4,
}: TextFieldProps) {
  return (
    <Field
      id={id}
      label={label}
    >
      <textarea
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        rows={rows}
        onChange={(event) => {
          onChange(
            event.target.value,
          );
        }}
        placeholder={placeholder}
        className="gotfit-input resize-none leading-7"
      />
    </Field>
  );
}