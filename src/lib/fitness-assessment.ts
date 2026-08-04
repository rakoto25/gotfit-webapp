import type {
  ClientOnboarding,
} from "@/lib/client-journey";

import type {
  FitnessAssessmentPayload,
  FitnessAssessmentValidation,
  FitnessAssessmentValues,
} from "@/types/fitness-assessment";

export type {
  FitnessAssessmentChange,
  FitnessAssessmentField,
  FitnessAssessmentPayload,
  FitnessAssessmentValidation,
  FitnessAssessmentValues,
} from "@/types/fitness-assessment";

/* =========================================================
   VALEURS PAR DÉFAUT
========================================================= */

export const EMPTY_FITNESS_ASSESSMENT: FitnessAssessmentValues = {
  goals: "",
  level: "",
  preferences: "",
  availability: "",
  health: "",
  height: "",
  weight: "",
  birthYear: "",
  lifestyle: "",
  emergencyName: "",
  emergencyPhone: "",
  extraAnswers: "",
};

/* =========================================================
   OUTILS INTERNES
========================================================= */

function cleanText(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value).trim();
  }

  return "";
}

function objectText(
  value: unknown,
  key = "text",
): string {
  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return cleanText(value);
  }

  if (
    !value ||
    typeof value !== "object"
  ) {
    return "";
  }

  return cleanText(
    (
      value as Record<
        string,
        unknown
      >
    )[key],
  );
}

function arrayToCsv(
  value: unknown,
): string {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string" &&
        item.trim() !== "",
    )
    .map((item) => item.trim())
    .join(", ");
}

/* =========================================================
   OBJECTIFS
========================================================= */

export function parseFitnessGoals(
  value: string,
): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

/* =========================================================
   LARAVEL VERS FORMULAIRE
========================================================= */

export function onboardingToFitnessAssessment(
  onboarding?: ClientOnboarding | null,
): FitnessAssessmentValues {
  if (!onboarding) {
    return {
      ...EMPTY_FITNESS_ASSESSMENT,
    };
  }

  return {
    goals: arrayToCsv(
      onboarding.goals,
    ),

    level: cleanText(
      onboarding.level,
    ),

    preferences: objectText(
      onboarding.training_preferences,
    ),

    availability: objectText(
      onboarding.availability,
    ),

    health: objectText(
      onboarding.health_constraints,
    ),

    height: cleanText(
      onboarding.measurements?.height,
    ),

    weight: cleanText(
      onboarding.measurements?.weight,
    ),

    birthYear: cleanText(
      onboarding.measurements
        ?.birth_year,
    ),

    lifestyle: objectText(
      onboarding.lifestyle,
    ),

    emergencyName: objectText(
      onboarding.emergency_contact,
      "name",
    ),

    emergencyPhone: objectText(
      onboarding.emergency_contact,
      "phone",
    ),

    extraAnswers: objectText(
      onboarding.answers,
    ),
  };
}

/* =========================================================
   VALIDATION
========================================================= */

export function validateFitnessAssessment(
  values: FitnessAssessmentValues,
): FitnessAssessmentValidation {
  if (
    parseFitnessGoals(
      values.goals,
    ).length === 0
  ) {
    return {
      valid: false,
      field: "goals",
      message:
        "Veuillez indiquer au moins un objectif principal.",
    };
  }

  if (!values.level.trim()) {
    return {
      valid: false,
      field: "level",
      message:
        "Veuillez sélectionner votre niveau actuel.",
    };
  }

  const birthYear =
    values.birthYear.trim();

  if (
    birthYear &&
    !/^\d{4}$/.test(birthYear)
  ) {
    return {
      valid: false,
      field: "birthYear",
      message:
        "L’année de naissance doit contenir quatre chiffres.",
    };
  }

  if (birthYear) {
    const year =
      Number(birthYear);

    const currentYear =
      new Date().getFullYear();

    if (
      year < 1900 ||
      year > currentYear
    ) {
      return {
        valid: false,
        field: "birthYear",
        message:
          "L’année de naissance indiquée n’est pas valide.",
      };
    }
  }

  return {
    valid: true,
  };
}

/* =========================================================
   FORMULAIRE VERS LARAVEL
========================================================= */

export function fitnessAssessmentToPayload(
  values: FitnessAssessmentValues,
  isCompleted = true,
): FitnessAssessmentPayload {
  return {
    goals: parseFitnessGoals(
      values.goals,
    ),

    level:
      values.level.trim(),

    training_preferences: {
      text:
        values.preferences.trim(),
    },

    availability: {
      text:
        values.availability.trim(),
    },

    health_constraints: {
      text:
        values.health.trim(),
    },

    measurements: {
      height:
        values.height.trim(),

      weight:
        values.weight.trim(),

      birth_year:
        values.birthYear.trim(),
    },

    lifestyle: {
      text:
        values.lifestyle.trim(),
    },

    emergency_contact: {
      name:
        values.emergencyName.trim(),

      phone:
        values.emergencyPhone.trim(),
    },

    answers: {
      text:
        values.extraAnswers.trim(),
    },

    is_completed: isCompleted,
  };
}