import type { User } from "@/types/auth";

/**
 * Types de justificatifs professionnels acceptés
 * par le backend Laravel.
 *
 * Ces valeurs correspondent à DocumentController::PROFESSIONAL_TYPES.
 */
export const PROFESSIONAL_DOCUMENT_TYPES = [
  "diploma",
  "certification",
  "professional_card",
  "identity",
  "other",
] as const;

export type ProfessionalDocumentType =
  (typeof PROFESSIONAL_DOCUMENT_TYPES)[number];

/**
 * Types de documents obligatoires indiqués par :
 * GET /api/coach/credentials
 */
export const REQUIRED_PROFESSIONAL_DOCUMENT_TYPES = [
  "diploma",
  "certification",
] as const;

export type RequiredProfessionalDocumentType =
  (typeof REQUIRED_PROFESSIONAL_DOCUMENT_TYPES)[number];

/**
 * Statuts possibles retournés par Laravel.
 *
 * Le backend utilise notamment :
 * - valide
 * - refuse
 *
 * Certaines installations peuvent aussi utiliser :
 * - pending
 * - en_attente
 * - approved
 * - rejected
 */
export type RawCoachDocumentStatus =
  | "pending"
  | "en_attente"
  | "valide"
  | "validé"
  | "approved"
  | "refuse"
  | "refusé"
  | "rejected"
  | string;

/**
 * Statuts normalisés utilisés par le frontend.
 */
export type CoachDocumentStatus =
  | "pending"
  | "approved"
  | "rejected";

/**
 * Document professionnel tel qu'il peut être renvoyé
 * par le backend Laravel.
 */
export type CoachDocument = {
  id: number | string;

  user_id?: number | string | null;
  validated_by?: number | string | null;

  name?: string | null;
  title?: string | null;
  description?: string | null;

  original_name?: string | null;
  file_name?: string | null;

  path?: string | null;
  file_path?: string | null;
  url?: string | null;

  mime_type?: string | null;
  extension?: string | null;

  size?: number | null;
  file_size?: number | null;

  type?: string | null;
  document_type?: ProfessionalDocumentType | string | null;

  status?: RawCoachDocumentStatus | null;

  rejection_reason?: string | null;

  validated_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  user?: {
    id?: number | string;
    name?: string | null;
    email?: string | null;
    siret?: string | null;
  } | null;

  validator?: {
    id?: number | string;
    name?: string | null;
  } | null;
};

/**
 * Document normalisé utilisé par les composants frontend.
 *
 * Ce type est compatible avec le format attendu
 * par le composant DocumentUploader.
 */
export type ExistingCoachDocument = {
  id: number | string;
  name: string;
  url?: string | null;
  size?: number | null;
  mime_type?: string | null;
  status?: CoachDocumentStatus;
  document_type?: ProfessionalDocumentType | string | null;
  rejection_reason?: string | null;
  created_at?: string | null;
};

/**
 * Réponse de :
 * GET /api/coach/credentials
 */
export type CoachCredentialsResponse = {
  status?: number;

  required_types?: ProfessionalDocumentType[];

  accepted_types?: ProfessionalDocumentType[];

  credentials?: CoachDocument[];

  message?: string;
};

/**
 * Réponse possible de :
 * POST /api/coach/credentials
 */
export type CoachCredentialUploadResponse = {
  status?: number;

  document?: CoachDocument;

  credential?: CoachDocument;

  data?: CoachDocument;

  message?: string;

  errors?: Record<string, string[]>;
};

/**
 * Réponse possible de :
 * DELETE /api/coach/credentials/{id}
 */
export type CoachCredentialDeleteResponse = {
  status?: number;
  message?: string;
};

/**
 * Informations spécifiques au profil public d'un coach.
 */
export type CoachProfileFields = {
  company_name?: string | null;
  siret?: string | null;

  coach_title?: string | null;

  coach_short_description?: string | null;

  coach_speciality?: string | null;

  coach_experience_years?:
    | number
    | string
    | null;

  coach_certifications?:
    | string[]
    | string
    | null;

  coach_languages?:
    | string[]
    | string
    | null;

  presentation_video?: string | null;

  presentation_video_url?: string | null;

  presentation_video_duration_seconds?:
    | number
    | string
    | null;

  documents?: CoachDocument[] | null;

  coach_documents?: CoachDocument[] | null;

  professional_documents?:
    | CoachDocument[]
    | null;

  stripe_account_id?: string | null;

  stripe_onboarding_completed?:
    | boolean
    | null;
};

/**
 * Utilisateur coach complet.
 *
 * Il étend le type User utilisé par le système
 * d'authentification.
 */
export type CoachUser = User &
  CoachProfileFields & {
    phone?: string | null;
    address?: string | null;
    bio?: string | null;

    photo?: string | null;
    photo_url?: string | null;

    cover_photo?: string | null;
    cover_photo_url?: string | null;

    city?: string | null;
    location?: string | null;

    account_status?: string | null;

    created_at?: string | null;
    updated_at?: string | null;
  };

/**
 * Réponse possible de :
 * GET /api/profile
 */
export type CoachProfileResponse = {
  status?: number;

  user?: CoachUser;

  data?: CoachUser;

  message?: string;
};

/**
 * Réponse possible de :
 * POST /api/profile/update
 */
export type CoachProfileUpdateResponse = {
  status?: number;

  user?: CoachUser;

  data?: CoachUser;

  message?: string;

  errors?: Record<string, string[]>;
};

/**
 * Données textuelles envoyées lors de la mise à jour
 * du profil professionnel.
 */
export type CoachProfileFormValues = {
  company_name: string;
  siret: string;

  coach_title: string;

  coach_short_description: string;

  coach_speciality: string;

  coach_experience_years: string;

  coach_certifications: string;

  coach_languages: string;
};

/**
 * Valeurs initiales du formulaire coach.
 */
export const EMPTY_COACH_PROFILE_FORM: CoachProfileFormValues =
  {
    company_name: "",
    siret: "",
    coach_title: "",
    coach_short_description: "",
    coach_speciality: "",
    coach_experience_years: "",
    coach_certifications: "",
    coach_languages: "",
  };

/**
 * Statut Stripe Connect utilisé dans l'interface.
 */
export type CoachStripeStatus =
  | "hidden"
  | "missing"
  | "pending"
  | "active";

/**
 * Réponse de :
 * POST /api/stripe/connect/onboarding
 */
export type StripeConnectOnboardingResponse = {
  status?: number;

  url?: string;

  stripe_account_id?: string | null;

  message?: string;
};

/**
 * Réponse de :
 * GET /api/stripe/connect/status
 */
export type StripeConnectStatusResponse = {
  status?: number;

  connected?: boolean;

  onboarding_completed?: boolean;

  charges_enabled?: boolean;

  payouts_enabled?: boolean;

  stripe_account_id?: string | null;

  message?: string;
};

/**
 * Vérifie qu'une valeur correspond à un type de
 * document professionnel accepté.
 */
export function isProfessionalDocumentType(
  value: unknown
): value is ProfessionalDocumentType {
  return (
    typeof value === "string" &&
    PROFESSIONAL_DOCUMENT_TYPES.includes(
      value as ProfessionalDocumentType
    )
  );
}

/**
 * Normalise les statuts retournés par Laravel
 * vers les statuts utilisés dans l'interface.
 */
export function normalizeCoachDocumentStatus(
  status?: string | null
): CoachDocumentStatus {
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase();

  if (
    [
      "valide",
      "validé",
      "approved",
      "approve",
      "accepted",
    ].includes(normalizedStatus)
  ) {
    return "approved";
  }

  if (
    [
      "refuse",
      "refusé",
      "rejected",
      "reject",
      "denied",
    ].includes(normalizedStatus)
  ) {
    return "rejected";
  }

  return "pending";
}

/**
 * Transforme un tableau ou une chaîne provenant
 * du backend en texte utilisable dans un input.
 */
export function coachValueToInput(
  value: string[] | string | null | undefined
): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value ?? "");
}

/**
 * Nettoie un numéro SIRET.
 */
export function normalizeCoachSiret(
  value: string
): string {
  return value.replace(/\D/g, "").slice(0, 14);
}

/**
 * Vérifie la longueur d'un numéro SIRET.
 *
 * Une valeur vide est acceptée pour permettre
 * aux formulaires où le champ n'est pas obligatoire
 * de fonctionner.
 */
export function isValidCoachSiret(
  value: string
): boolean {
  const normalizedSiret =
    normalizeCoachSiret(value);

  return (
    normalizedSiret.length === 0 ||
    normalizedSiret.length === 14
  );
}

/**
 * Détermine automatiquement la catégorie d'un fichier
 * à partir de son nom.
 *
 * Cette fonction peut être utilisée avant :
 * POST /api/coach/credentials
 */
export function inferProfessionalDocumentType(
  file: Pick<File, "name">
): ProfessionalDocumentType {
  const fileName = file.name
    .trim()
    .toLowerCase();

  if (
    fileName.includes("diplom") ||
    fileName.includes("degree")
  ) {
    return "diploma";
  }

  if (
    fileName.includes("certif") ||
    fileName.includes("attestation")
  ) {
    return "certification";
  }

  if (
    fileName.includes("identit") ||
    fileName.includes("identity") ||
    fileName.includes("passport") ||
    fileName.includes("passeport")
  ) {
    return "identity";
  }

  if (
    fileName.includes("carte") ||
    fileName.includes("card")
  ) {
    return "professional_card";
  }

  return "other";
}

/**
 * Retourne les documents professionnels présents
 * directement dans l'objet utilisateur.
 */
export function getCoachDocuments(
  user?: CoachUser | null
): CoachDocument[] {
  const documents =
    user?.coach_documents ||
    user?.professional_documents ||
    user?.documents ||
    [];

  return Array.isArray(documents)
    ? documents
    : [];
}

/**
 * Vérifie si tous les justificatifs obligatoires
 * sont présents.
 *
 * La validation administrative du document n'est
 * pas prise en compte ici : seule sa présence est vérifiée.
 */
export function hasRequiredCoachDocuments(
  documents: CoachDocument[]
): boolean {
  const availableTypes = new Set(
    documents
      .map((document) => document.document_type)
      .filter(isProfessionalDocumentType)
  );

  return REQUIRED_PROFESSIONAL_DOCUMENT_TYPES.every(
    (requiredType) =>
      availableTypes.has(requiredType)
  );
}

/**
 * Nombre de justificatifs obligatoires manquants.
 */
export function getMissingCoachDocumentTypes(
  documents: CoachDocument[]
): RequiredProfessionalDocumentType[] {
  const availableTypes = new Set(
    documents
      .map((document) => document.document_type)
      .filter(isProfessionalDocumentType)
  );

  return REQUIRED_PROFESSIONAL_DOCUMENT_TYPES.filter(
    (requiredType) =>
      !availableTypes.has(requiredType)
  );
}