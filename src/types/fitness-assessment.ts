/* =========================================================
   VALEURS DU FORMULAIRE
========================================================= */

export type FitnessAssessmentValues = {
  goals: string;
  level: string;
  preferences: string;
  availability: string;
  health: string;
  height: string;
  weight: string;
  birthYear: string;
  lifestyle: string;
  emergencyName: string;
  emergencyPhone: string;
  extraAnswers: string;
};

export type FitnessAssessmentField =
  keyof FitnessAssessmentValues;

export type FitnessAssessmentChange = <
  K extends FitnessAssessmentField,
>(
  field: K,
  value: FitnessAssessmentValues[K],
) => void;

/* =========================================================
   PAYLOAD ENVOYÉ À LARAVEL
========================================================= */

export type FitnessAssessmentPayload = {
  goals: string[];
  level: string;

  training_preferences: {
    text: string;
  };

  availability: {
    text: string;
  };

  health_constraints: {
    text: string;
  };

  measurements: {
    height: string;
    weight: string;
    birth_year: string;
  };

  lifestyle: {
    text: string;
  };

  emergency_contact: {
    name: string;
    phone: string;
  };

  answers: {
    text: string;
  };

  is_completed: boolean;
};

/* =========================================================
   VALIDATION
========================================================= */

export type FitnessAssessmentValidation =
  | {
      valid: true;
    }
  | {
      valid: false;
      field: FitnessAssessmentField;
      message: string;
    };