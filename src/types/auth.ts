/* =========================================================
   TYPES GÉNÉRIQUES
========================================================= */

export type ApiId = number | string;

export type Nullable<T> = T | null;

export type ApiTimestamp = string | null;

/* =========================================================
   RÔLES
========================================================= */

export type RegisterRole =
  | "client"
  | "intervenant";

export type UserRoleName =
  | RegisterRole
  | "coach"
  | "admin"
  | "administrator"
  | "super_admin"
  | string;

export type Role = {
  id: ApiId;
  name: string;
  slug?: string | null;
  guard_name?: string | null;

  pivot?: {
    model_type?: string;
    model_id?: ApiId;
    role_id?: ApiId;
  } | null;
};

/* =========================================================
   STATUTS DU COMPTE
========================================================= */

export type AccountStatus =
  | "pending"
  | "pending_validation"
  | "pending_review"
  | "in_review"
  | "under_review"
  | "incomplete"
  | "draft"
  | "active"
  | "approved"
  | "verified"
  | "validated"
  | "inactive"
  | "disabled"
  | "suspended"
  | "blocked"
  | "rejected"
  | "refused";

export type VerificationStatus =
  | "pending"
  | "pending_validation"
  | "pending_review"
  | "in_review"
  | "under_review"
  | "approved"
  | "verified"
  | "validated"
  | "rejected"
  | "refused";

export type DocumentVerificationStatus =
  | VerificationStatus
  | "not_submitted"
  | "incomplete";

/* =========================================================
   DOCUMENTS INTERVENANT
========================================================= */

export type CoachDocumentType =
  | "diploma"
  | "certification"
  | "identity"
  | "professional_card"
  | "license"
  | "insurance"
  | "other";

export type CoachDocument = {
  id: ApiId;

  name: string;
  title?: string | null;

  original_name?: string | null;
  file_name?: string | null;

  type: CoachDocumentType | string;

  disk?: string | null;
  path?: string | null;

  url?: string | null;
  file_url?: string | null;
  download_url?: string | null;

  mime_type?: string | null;
  extension?: string | null;

  size?: number | string | null;
  size_bytes?: number | string | null;

  verification_status?:
    | DocumentVerificationStatus
    | string
    | null;

  status?:
    | DocumentVerificationStatus
    | string
    | null;

  rejection_reason?: string | null;

  verified_at?: ApiTimestamp;
  created_at?: ApiTimestamp;
  updated_at?: ApiTimestamp;
};

export type CoachDocumentUpload = {
  file: File;
  type: CoachDocumentType;
  name?: string;
};

/* =========================================================
   PROFIL PROFESSIONNEL INTERVENANT
========================================================= */

export type CoachProfile = {
  id?: ApiId | null;
  user_id?: ApiId | null;

  /*
   * Identité professionnelle.
   */
  activity_name?: string | null;
  business_name?: string | null;
  company_name?: string | null;
  nom_activite?: string | null;

  siret?: string | null;
  siret_number?: string | null;
  numero_siret?: string | null;

  /*
   * Statut de validation.
   */
  verification_status?:
    | VerificationStatus
    | string
    | null;

  validation_status?:
    | VerificationStatus
    | string
    | null;

  account_status?:
    | AccountStatus
    | string
    | null;

  profile_status?:
    | AccountStatus
    | string
    | null;

  status?:
    | AccountStatus
    | VerificationStatus
    | string
    | null;

  rejection_reason?: string | null;

  /*
   * Coordonnées.
   */
  phone?: string | null;

  address?: string | null;
  city?: string | null;
  location?: string | null;

  postal_code?: string | null;
  country?: string | null;

  /*
   * Présentation.
   */
  bio?: string | null;
  about?: string | null;
  description?: string | null;
  contenu?: string | null;

  /*
   * Images.
   */
  photo?: string | null;
  photo_url?: string | null;

  avatar?: string | null;
  avatar_url?: string | null;

  profile_photo?: string | null;
  profile_photo_url?: string | null;

  cover_photo?: string | null;
  cover_photo_url?: string | null;

  banner?: string | null;
  banner_url?: string | null;

  /*
   * Activité de coaching.
   */
  speciality?: string | null;
  specialty?: string | null;

  specialities?:
    | string[]
    | string
    | null;

  specialties?:
    | string[]
    | string
    | null;

  service?: string | null;

  services?:
    | string[]
    | string
    | null;

  category?: string | null;
  type_prestation?: string | null;

  profession?: string | null;
  job_title?: string | null;
  title?: string | null;

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

  languages?:
    | string[]
    | string
    | null;

  /*
   * Vidéo de présentation.
   */
  presentation_video?: string | null;

  presentation_video_url?: string | null;

  presentation_video_duration_seconds?:
    | number
    | string
    | null;

  /*
   * Statistiques.
   */
  rating?: number | string | null;

  average_rating?:
    | number
    | string
    | null;

  reviews_count?:
    | number
    | string
    | null;

  clients_count?:
    | number
    | string
    | null;

  sessions_count?:
    | number
    | string
    | null;

  /*
   * Justificatifs.
   */
  documents_count?:
    | number
    | string
    | null;

  certifications_count?:
    | number
    | string
    | null;

  diplomas_count?:
    | number
    | string
    | null;

  coach_documents?:
    | CoachDocument[]
    | null;

  /*
   * Complétion du profil.
   */
  profile_completion?:
    | number
    | string
    | null;

  profile_completion_percentage?:
    | number
    | string
    | null;

  completion_percentage?:
    | number
    | string
    | null;

  created_at?: ApiTimestamp;
  updated_at?: ApiTimestamp;
};

/* =========================================================
   UTILISATEUR AUTHENTIFIÉ
========================================================= */

export type User = {
  id: number;

  name: string;
  email: string;

  full_name?: string | null;
  display_name?: string | null;
  username?: string | null;

  /*
   * Rôles.
   */
  role?: UserRoleName | null;
  role_name?: UserRoleName | null;
  user_type?: UserRoleName | null;

  roles?: Role[];

  /*
   * Coordonnées.
   */
  phone?: string | null;

  address?: string | null;
  city?: string | null;
  location?: string | null;

  postal_code?: string | null;
  country?: string | null;

  /*
   * Présentation.
   */
  bio?: string | null;
  about?: string | null;
  description?: string | null;
  contenu?: string | null;

  /*
   * Images.
   */
  photo?: string | null;
  photo_url?: string | null;

  avatar?: string | null;
  avatar_url?: string | null;

  profile_photo?: string | null;
  profile_photo_url?: string | null;

  cover_photo?: string | null;
  cover_photo_url?: string | null;

  /*
   * Statuts.
   */
  account_status?:
    | AccountStatus
    | string
    | null;

  status?:
    | AccountStatus
    | VerificationStatus
    | string
    | null;

  verification_status?:
    | VerificationStatus
    | string
    | null;

  validation_status?:
    | VerificationStatus
    | string
    | null;

  coach_verification_status?:
    | VerificationStatus
    | string
    | null;

  rejection_reason?: string | null;

  /*
   * Vérification du compte.
   */
  email_verified_at?: ApiTimestamp;
  phone_verified_at?: ApiTimestamp;

  is_email_verified?: boolean;
  is_phone_verified?: boolean;

  /*
   * Authentification Google.
   */
  google_id?: string | null;

  auth_provider?:
    | "email"
    | "google"
    | string
    | null;

  provider?: string | null;
  provider_id?: string | null;

  /*
   * Informations professionnelles.
   */
  activity_name?: string | null;
  business_name?: string | null;
  company_name?: string | null;
  nom_activite?: string | null;

  siret?: string | null;
  siret_number?: string | null;
  numero_siret?: string | null;

  /*
   * Profil coach/intervenant.
   */
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

  speciality?: string | null;
  specialty?: string | null;

  service?: string | null;

  services?:
    | string[]
    | string
    | null;

  category?: string | null;
  type_prestation?: string | null;

  profession?: string | null;
  job_title?: string | null;
  title?: string | null;

  /*
   * Documents professionnels.
   */
  coach_documents?:
    | CoachDocument[]
    | null;

  documents_count?:
    | number
    | string
    | null;

  certifications_count?:
    | number
    | string
    | null;

  diplomas_count?:
    | number
    | string
    | null;

  /*
   * Vidéo de présentation.
   */
  presentation_video?: string | null;

  presentation_video_url?: string | null;

  presentation_video_duration_seconds?:
    | number
    | string
    | null;

  /*
   * Données d’évaluation.
   */
  rating?: number | string | null;

  average_rating?:
    | number
    | string
    | null;

  reviews_count?:
    | number
    | string
    | null;

  /*
   * Complétion du profil.
   */
  profile_completion?:
    | number
    | string
    | null;

  profile_completion_percentage?:
    | number
    | string
    | null;

  /*
   * Profils imbriqués pouvant être renvoyés
   * par l’API Laravel.
   */
  profile?: CoachProfile | null;

  coach_profile?: CoachProfile | null;

  intervenant_profile?: CoachProfile | null;

  professional_profile?: CoachProfile | null;

  /*
   * Dates.
   */
  created_at?: ApiTimestamp;
  updated_at?: ApiTimestamp;
  deleted_at?: ApiTimestamp;
};

/* =========================================================
   RÉPONSES D’AUTHENTIFICATION
========================================================= */

export type AuthResponse = {
  token: string;
  user: User;

  access_token?: string;
  token_type?: string;

  expires_in?: number | null;
  expires_at?: string | null;

  message?: string;
  success?: boolean;
  status?: number;
};

export type ApiAuthResponse =
  | AuthResponse
  | {
      success?: boolean;
      status?: number;
      message?: string;

      data: AuthResponse;
    }
  | {
      success?: boolean;
      status?: number;
      message?: string;

      token?: string;
      access_token?: string;
      token_type?: string;
      expires_in?: number | null;

      user?: User;

      data?: {
        token?: string;
        access_token?: string;
        token_type?: string;
        expires_in?: number | null;
        user?: User;
      };
    };

export type LoginResponse =
  AuthResponse;

export type MeResponse = {
  success?: boolean;
  message?: string;

  user: User;

  data?: {
    user?: User;
  };
};

/* =========================================================
   CONNEXION
========================================================= */

export type LoginPayload = {
  email: string;
  password: string;

  remember?: boolean;

  device_name?: string;
};

/* =========================================================
   INSCRIPTION
========================================================= */

export type RegisterMethod =
  | "form"
  | "google";

export type RegisterPayload = {
  name: string;
  email: string;

  password: string;
  password_confirmation: string;

  role: RegisterRole;

  phone?: string | null;
  address?: string | null;
  city?: string | null;

  /*
   * Informations obligatoires ou optionnelles
   * pour l’inscription intervenant.
   */
  siret?: string | null;

  activity_name?: string | null;

  /*
   * Compatibilité avec les anciens noms
   * utilisés par le frontend ou Laravel.
   */
  company_name?: string | null;
  business_name?: string | null;
  nom_activite?: string | null;

  device_name?: string;

  registration_method?: RegisterMethod;
};

/* =========================================================
   INSCRIPTION INTERVENANT AVEC DOCUMENTS
========================================================= */

export type CoachRegisterPayload =
  RegisterPayload & {
    role: "intervenant";

    siret: string;
    activity_name: string;

    /*
     * Un à cinq documents.
     * Taille maximale prévue : 8 Mo par fichier.
     */
    documents?: File[];
    coach_documents?: File[];

    document_types?:
      | CoachDocumentType[]
      | string[];
  };

/* =========================================================
   AUTHENTIFICATION GOOGLE
========================================================= */

export type GoogleAuthPayload = {
  credential: string;

  role?: RegisterRole;

  siret?: string | null;

  activity_name?: string | null;

  /*
   * Compatibilité avec l’ancien frontend.
   */
  company_name?: string | null;
  business_name?: string | null;
  nom_activite?: string | null;

  device_name?: string;

  registration_method?: "google";
};

/* =========================================================
   INSCRIPTION INTERVENANT EN ATTENTE
========================================================= */

export type PendingCoachRegistration = {
  role: "intervenant";

  method: RegisterMethod;

  siret: string;

  activity_name: string;

  company_name?: string | null;
  business_name?: string | null;

  phone?: string | null;
  address?: string | null;
  city?: string | null;

  created_at?: string;
};

/* =========================================================
   MISE À JOUR DU PROFIL
========================================================= */

export type UpdateUserProfilePayload = {
  name?: string;

  phone?: string | null;

  address?: string | null;
  city?: string | null;
  location?: string | null;

  bio?: string | null;

  photo?: File | string | null;
  cover_photo?: File | string | null;
};

export type UpdateCoachProfilePayload =
  UpdateUserProfilePayload & {
    activity_name?: string | null;

    company_name?: string | null;
    business_name?: string | null;
    nom_activite?: string | null;

    siret?: string | null;

    coach_title?: string | null;

    coach_short_description?:
      | string
      | null;

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

    presentation_video?:
      | File
      | string
      | null;
  };

/* =========================================================
   SESSION STOCKÉE DANS LE NAVIGATEUR
========================================================= */

export type StoredAuthSession = {
  token: string;
  user: User;

  token_type?: string;
  expires_at?: string | null;
};

/* =========================================================
   ÉVÉNEMENT gotfit:auth
========================================================= */

export type GotfitAuthEventDetail = {
  token?: string | null;
  user?: User | null;

  authenticated: boolean;

  action?:
    | "login"
    | "register"
    | "logout"
    | "refresh"
    | "profile_updated";
};

/* =========================================================
   ERREURS API LARAVEL
========================================================= */

export type ApiValidationErrorValue =
  | string[]
  | string;

export type ApiValidationErrors =
  Record<string, ApiValidationErrorValue>;

export type ApiErrorResponse = {
  success?: false;

  status?: number;
  message?: string;
  error?: string;

  errors?: ApiValidationErrors;

  data?: {
    message?: string;
    errors?: ApiValidationErrors;
  } | null;
};