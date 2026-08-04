import { getAssetUrl } from "@/lib/api-config";
import type { User } from "@/types/auth";

/* =========================================================
   TYPES
========================================================= */

type UnknownRecord = Record<string, unknown>;

export type IntervenantDocument = {
  id?: number | string | null;
  name?: string | null;
  title?: string | null;
  type?: string | null;
  status?: string | null;
  path?: string | null;
  url?: string | null;
  file_url?: string | null;
  created_at?: string | null;
};

export type IntervenantProfile = {
  id?: number | string | null;

  activity_name?: string | null;
  business_name?: string | null;
  nom_activite?: string | null;

  siret?: string | null;
  siret_number?: string | null;

  verification_status?: string | null;
  validation_status?: string | null;
  account_status?: string | null;
  profile_status?: string | null;
  status?: string | null;

  documents_count?: number | string | null;
  certifications_count?: number | string | null;
  diplomas_count?: number | string | null;

  phone?: string | null;
  address?: string | null;
  city?: string | null;
  location?: string | null;

  bio?: string | null;
  about?: string | null;
  description?: string | null;
  contenu?: string | null;

  photo?: string | null;
  photo_url?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;

  cover_photo?: string | null;
  cover_photo_url?: string | null;

  speciality?: string | null;
  specialty?: string | null;
  service?: string | null;
  services?: string[] | string | null;
  category?: string | null;
  type_prestation?: string | null;

  profession?: string | null;
  job_title?: string | null;
  title?: string | null;

  coach_title?: string | null;
  coach_short_description?: string | null;
  coach_speciality?: string | null;
  coach_experience_years?: number | string | null;
  coach_certifications?: string[] | string | null;
  coach_languages?: string[] | string | null;

  presentation_video?: string | null;
  presentation_video_url?: string | null;
  presentation_video_duration_seconds?: number | string | null;

  rating?: number | string | null;
  reviews_count?: number | string | null;

  profile_completion?: number | string | null;
  profile_completion_percentage?: number | string | null;
};

export type Intervenant = User &
  IntervenantProfile & {
    role?: string | null;
    role_name?: string | null;
    user_type?: string | null;

    profile?: IntervenantProfile | null;
    coach_profile?: IntervenantProfile | null;
    intervenant_profile?: IntervenantProfile | null;
    professional_profile?: IntervenantProfile | null;

    documents?: IntervenantDocument[] | null;
    certifications?: IntervenantDocument[] | string[] | string | null;
    diplomas?: IntervenantDocument[] | string[] | string | null;

    created_at?: string | null;
    updated_at?: string | null;
  };

export type ApiPaginatedIntervenants = {
  data?: Intervenant[];
  items?: Intervenant[];
  results?: Intervenant[];

  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;

  next_page_url?: string | null;
  prev_page_url?: string | null;
};

export type ApiIntervenantsResponse = {
  success?: boolean;
  status?: number;
  message?: string;

  data?:
    | Intervenant[]
    | Intervenant
    | ApiPaginatedIntervenants
    | {
        user?: Intervenant;
        intervenant?: Intervenant;
        coach?: Intervenant;
        data?: Intervenant[] | Intervenant;
      };

  intervenant?: Intervenant;
  coach?: Intervenant;
  user?: Intervenant;

  users?: Intervenant[];
  coaches?: Intervenant[];
  intervenants?: Intervenant[];

  items?: Intervenant[];
  results?: Intervenant[];
};

/* =========================================================
   OUTILS GÉNÉRIQUES
========================================================= */

function isRecord(value: unknown): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function firstRecord(
  values: unknown[],
): UnknownRecord | null {
  for (const value of values) {
    if (isRecord(value)) {
      return value;
    }
  }

  return null;
}

function firstValue(
  records: UnknownRecord[],
  keys: string[],
): unknown {
  for (const record of records) {
    for (const key of keys) {
      const value = record[key];

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }
  }

  return undefined;
}

function firstText(
  records: UnknownRecord[],
  keys: string[],
): string | null {
  return cleanText(
    firstValue(records, keys),
  );
}

function firstNumber(
  records: UnknownRecord[],
  keys: string[],
): number | null {
  const value = firstValue(records, keys);

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const normalized =
    typeof value === "string"
      ? value.replace(",", ".").trim()
      : value;

  const result = Number(normalized);

  return Number.isFinite(result)
    ? result
    : null;
}

function uniqueStrings(
  values: string[],
): string[] {
  const result = new Map<string, string>();

  values.forEach((value) => {
    const cleaned = cleanText(value);

    if (!cleaned) {
      return;
    }

    const key = cleaned.toLocaleLowerCase(
      "fr-FR",
    );

    if (!result.has(key)) {
      result.set(key, cleaned);
    }
  });

  return Array.from(result.values());
}

function getIntervenantSources(
  intervenant: Intervenant,
): UnknownRecord[] {
  const root = asRecord(intervenant);

  return [
    root,
    asRecord(root.intervenant_profile),
    asRecord(root.coach_profile),
    asRecord(root.professional_profile),
    asRecord(root.profile),
  ].filter(
    (record) =>
      Object.keys(record).length > 0,
  );
}

/* =========================================================
   NORMALISATION D’UN INTERVENANT
========================================================= */

export function normalizeIntervenant(
  payload: unknown,
): Intervenant | null {
  if (!isRecord(payload)) {
    return null;
  }

  const root = payload;

  const user = firstRecord([
    root.user,
    asRecord(root.data).user,
  ]);

  const intervenant = firstRecord([
    root.intervenant,
    root.coach,
    asRecord(root.data).intervenant,
    asRecord(root.data).coach,
  ]);

  const profile = firstRecord([
    root.intervenant_profile,
    root.coach_profile,
    root.professional_profile,
    root.profile,

    user?.intervenant_profile,
    user?.coach_profile,
    user?.professional_profile,
    user?.profile,

    intervenant?.intervenant_profile,
    intervenant?.coach_profile,
    intervenant?.professional_profile,
    intervenant?.profile,
  ]);

  const normalized: UnknownRecord = {
    ...(user ?? {}),
    ...(intervenant ?? {}),
    ...(profile ?? {}),
    ...root,
  };

  /*
   * L’identifiant et les informations du compte utilisateur
   * sont prioritaires sur l’identifiant du profil intervenant.
   */
  if (user?.id !== undefined) {
    normalized.id = user.id;
  }

  if (
    !normalized.name &&
    user?.name
  ) {
    normalized.name = user.name;
  }

  if (
    !normalized.email &&
    user?.email
  ) {
    normalized.email = user.email;
  }

  if (
    !normalized.roles &&
    user?.roles
  ) {
    normalized.roles = user.roles;
  }

  if (
    !normalized.role &&
    user?.role
  ) {
    normalized.role = user.role;
  }

  if (
    Object.keys(normalized).length === 0
  ) {
    return null;
  }

  return normalized as Intervenant;
}

/* =========================================================
   EXTRACTION DES LISTES DE L’API
========================================================= */

function extractIntervenantItems(
  payload: unknown,
): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  const directCollections = [
    payload.intervenants,
    payload.coaches,
    payload.users,
    payload.items,
    payload.results,
  ];

  for (const collection of directCollections) {
    if (Array.isArray(collection)) {
      return collection;
    }
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (isRecord(payload.data)) {
    const data = payload.data;

    const nestedCollections = [
      data.intervenants,
      data.coaches,
      data.users,
      data.items,
      data.results,
      data.data,
    ];

    for (
      const collection of nestedCollections
    ) {
      if (Array.isArray(collection)) {
        return collection;
      }
    }

    if (
      data.user ||
      data.intervenant ||
      data.coach ||
      data.id
    ) {
      return [data];
    }
  }

  if (
    payload.user ||
    payload.intervenant ||
    payload.coach ||
    payload.id
  ) {
    return [payload];
  }

  return [];
}

export function normalizeIntervenants(
  payload:
    | ApiIntervenantsResponse
    | Intervenant[]
    | unknown
    | null,
): Intervenant[] {
  if (!payload) {
    return [];
  }

  const items =
    extractIntervenantItems(payload);

  const normalized = items
    .map(normalizeIntervenant)
    .filter(
      (
        intervenant,
      ): intervenant is Intervenant =>
        intervenant !== null,
    );

  /*
   * Suppression des doublons pouvant apparaître
   * lorsque l’API renvoie user + profile.
   */
  const unique = new Map<
    string,
    Intervenant
  >();

  normalized.forEach(
    (intervenant, index) => {
      const record = asRecord(intervenant);

      const id = cleanText(record.id);
      const email = cleanText(record.email);
      const name = cleanText(record.name);

      const key =
        id
          ? `id:${id}`
          : email
            ? `email:${email.toLowerCase()}`
            : name
              ? `name:${name.toLowerCase()}`
              : `index:${index}`;

      if (!unique.has(key)) {
        unique.set(key, intervenant);
      }
    },
  );

  return Array.from(unique.values());
}

export function normalizeProfile(
  payload: unknown,
): Intervenant | null {
  return (
    normalizeIntervenants(payload)[0] ??
    normalizeIntervenant(payload)
  );
}

/* =========================================================
   NETTOYAGE DES VALEURS
========================================================= */

export function cleanText(
  value?: unknown,
): string | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return null;
  }

  const text = String(value).trim();

  return text || null;
}

export function cleanNumber(
  value?: unknown,
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const normalized =
    typeof value === "string"
      ? value.replace(",", ".").trim()
      : value;

  const result = Number(normalized);

  return Number.isFinite(result)
    ? result
    : null;
}

function parseListItem(
  item: unknown,
): string | null {
  if (
    typeof item === "string" ||
    typeof item === "number"
  ) {
    return cleanText(item);
  }

  if (!isRecord(item)) {
    return null;
  }

  return cleanText(
    item.name ??
      item.label ??
      item.title ??
      item.value ??
      item.speciality ??
      item.specialty,
  );
}

export function parseList(
  value?: unknown,
): string[] {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return [];
  }

  if (Array.isArray(value)) {
    return uniqueStrings(
      value
        .map(parseListItem)
        .filter(
          (item): item is string =>
            Boolean(item),
        ),
    );
  }

  if (isRecord(value)) {
    const values = Object.values(value)
      .map(parseListItem)
      .filter(
        (item): item is string =>
          Boolean(item),
      );

    return uniqueStrings(values);
  }

  const rawValue = cleanText(value);

  if (!rawValue) {
    return [];
  }

  /*
   * Support des tableaux JSON renvoyés
   * sous forme de chaîne par Laravel.
   */
  if (
    rawValue.startsWith("[") ||
    rawValue.startsWith("{")
  ) {
    try {
      const parsed: unknown =
        JSON.parse(rawValue);

      return parseList(parsed);
    } catch {
      // Utilise ensuite le découpage texte.
    }
  }

  return uniqueStrings(
    rawValue
      .split(/[;,\n|]/)
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

/* =========================================================
   URLS ET MÉDIAS
========================================================= */

export function getFullUrl(
  url?: string | null,
): string | null {
  const normalizedUrl = cleanText(url);

  if (!normalizedUrl) {
    return null;
  }

  return (
    cleanText(
      getAssetUrl(normalizedUrl),
    ) ?? normalizedUrl
  );
}

export function getIntervenantPhoto(
  intervenant: Intervenant,
): string | null {
  const sources =
    getIntervenantSources(intervenant);

  return getFullUrl(
    firstText(sources, [
      "photo_url",
      "avatar_url",
      "profile_photo_url",
      "photo",
      "avatar",
      "profile_photo",
      "image_url",
      "image",
    ]),
  );
}

export function getIntervenantCover(
  intervenant: Intervenant,
): string | null {
  const sources =
    getIntervenantSources(intervenant);

  return getFullUrl(
    firstText(sources, [
      "cover_photo_url",
      "cover_url",
      "banner_url",
      "cover_photo",
      "cover",
      "banner",
    ]),
  );
}

export function getIntervenantVideo(
  intervenant: Intervenant,
): string | null {
  const sources =
    getIntervenantSources(intervenant);

  return getFullUrl(
    firstText(sources, [
      "presentation_video_url",
      "video_url",
      "presentation_video",
      "video",
    ]),
  );
}

/* =========================================================
   IDENTITÉ PROFESSIONNELLE
========================================================= */

export function getIntervenantName(
  intervenant: Intervenant,
): string {
  const sources =
    getIntervenantSources(intervenant);

  return (
    firstText(sources, [
      "name",
      "full_name",
      "display_name",
      "username",
    ]) ?? "Intervenant Gotfit"
  );
}

export function getActivityName(
  intervenant: Intervenant,
): string | null {
  const sources =
    getIntervenantSources(intervenant);

  return firstText(sources, [
    "activity_name",
    "business_name",
    "nom_activite",
    "company_name",
    "organisation_name",
    "organization_name",
  ]);
}

export function getSiret(
  intervenant: Intervenant,
): string | null {
  const sources =
    getIntervenantSources(intervenant);

  return firstText(sources, [
    "siret",
    "siret_number",
    "numero_siret",
  ]);
}

export function getSiretDigits(
  intervenant: Intervenant,
): string {
  return String(
    getSiret(intervenant) ?? "",
  ).replace(/\D/g, "");
}

export function isValidSiret(
  intervenant: Intervenant,
): boolean {
  return (
    getSiretDigits(intervenant).length ===
    14
  );
}

/* =========================================================
   TITRE, SPÉCIALITÉ ET SERVICES
========================================================= */

export function getCoachTitle(
  intervenant: Intervenant,
): string {
  const sources =
    getIntervenantSources(intervenant);

  return (
    firstText(sources, [
      "coach_title",
      "title",
      "job_title",
      "profession",
      "activity_name",
      "business_name",
      "nom_activite",
    ]) ?? "Intervenant Gotfit"
  );
}

export function getCoachServices(
  intervenant: Intervenant,
): string[] {
  const sources =
    getIntervenantSources(intervenant);

  const services: string[] = [];

  sources.forEach((source) => {
    services.push(
      ...parseList(source.services),
      ...parseList(source.service),
      ...parseList(source.specialities),
      ...parseList(source.specialties),
    );
  });

  return uniqueStrings(services);
}

export function getCoachSpeciality(
  intervenant: Intervenant,
): string {
  const sources =
    getIntervenantSources(intervenant);

  const services =
    getCoachServices(intervenant);

  return (
    firstText(sources, [
      "coach_speciality",
      "speciality",
      "specialty",
      "service",
      "category",
      "type_prestation",
      "profession",
      "job_title",
      "coach_title",
    ]) ??
    services[0] ??
    "Spécialité à compléter"
  );
}

export function getCoachDescription(
  intervenant: Intervenant,
): string {
  const sources =
    getIntervenantSources(intervenant);

  return (
    firstText(sources, [
      "coach_short_description",
      "short_description",
      "bio",
      "about",
      "description",
      "contenu",
      "content",
    ]) ??
    "Présentation à compléter depuis l’espace profil intervenant."
  );
}

/* =========================================================
   EXPÉRIENCE, LANGUES ET CERTIFICATIONS
========================================================= */

export function getCoachExperienceYears(
  intervenant: Intervenant,
): number | null {
  const sources =
    getIntervenantSources(intervenant);

  const value = firstNumber(sources, [
    "coach_experience_years",
    "experience_years",
    "years_of_experience",
    "experience",
  ]);

  if (
    value === null ||
    value <= 0
  ) {
    return null;
  }

  return value;
}

export function getCoachExperience(
  intervenant: Intervenant,
): string | null {
  const value =
    getCoachExperienceYears(intervenant);

  if (value === null) {
    return null;
  }

  return value <= 1
    ? `${value} an d’expérience`
    : `${value} ans d’expérience`;
}

export function getCoachLanguages(
  intervenant: Intervenant,
): string[] {
  const sources =
    getIntervenantSources(intervenant);

  const languages: string[] = [];

  sources.forEach((source) => {
    languages.push(
      ...parseList(
        source.coach_languages,
      ),
      ...parseList(source.languages),
    );
  });

  return uniqueStrings(languages);
}

export function getCoachCertifications(
  intervenant: Intervenant,
): string[] {
  const sources =
    getIntervenantSources(intervenant);

  const certifications: string[] = [];

  sources.forEach((source) => {
    certifications.push(
      ...parseList(
        source.coach_certifications,
      ),
      ...parseList(
        source.certifications,
      ),
      ...parseList(source.diplomas),
      ...parseList(source.diplomes),
    );
  });

  return uniqueStrings(certifications);
}

/* =========================================================
   JUSTIFICATIFS
========================================================= */

export function getDocumentsCount(
  intervenant: Intervenant,
): number {
  const sources =
    getIntervenantSources(intervenant);

  const explicitCount = firstNumber(
    sources,
    [
      "documents_count",
      "certifications_count",
      "diplomas_count",
      "diplomes_count",
      "attachments_count",
    ],
  );

  if (
    explicitCount !== null &&
    explicitCount >= 0
  ) {
    return Math.floor(explicitCount);
  }

  const root = asRecord(intervenant);

  const documentCollections = [
    root.documents,
    root.certifications,
    root.diplomas,
    root.diplomes,
    root.attachments,
  ];

  for (
    const collection of
    documentCollections
  ) {
    if (Array.isArray(collection)) {
      return collection.length;
    }
  }

  return getCoachCertifications(
    intervenant,
  ).length;
}

/* =========================================================
   LOCALISATION
========================================================= */

export function getLocation(
  intervenant: Intervenant,
): string {
  const sources =
    getIntervenantSources(intervenant);

  const city = firstText(sources, [
    "city",
    "commune",
    "town",
  ]);

  const address = firstText(sources, [
    "address",
    "adresse",
  ]);

  const location = firstText(sources, [
    "location",
    "localisation",
  ]);

  if (location) {
    return location;
  }

  if (
    city &&
    address &&
    city.toLowerCase() !==
      address.toLowerCase()
  ) {
    return `${address}, ${city}`;
  }

  return (
    city ??
    address ??
    "Localisation à compléter"
  );
}

/* =========================================================
   NOTES ET AVIS
========================================================= */

export function getRating(
  intervenant: Intervenant,
): number {
  const sources =
    getIntervenantSources(intervenant);

  const value = firstNumber(sources, [
    "rating",
    "average_rating",
    "rating_average",
    "reviews_average",
  ]);

  if (
    value === null ||
    value <= 0
  ) {
    return 0;
  }

  return Math.min(5, value);
}

export function getReviewsCount(
  intervenant: Intervenant,
): number {
  const sources =
    getIntervenantSources(intervenant);

  const value = firstNumber(sources, [
    "reviews_count",
    "ratings_count",
    "review_count",
  ]);

  if (
    value === null ||
    value <= 0
  ) {
    return 0;
  }

  return Math.floor(value);
}

/* =========================================================
   VIDÉO DE PRÉSENTATION
========================================================= */

export function getVideoDurationSeconds(
  intervenant: Intervenant,
): number {
  const sources =
    getIntervenantSources(intervenant);

  const value = firstNumber(sources, [
    "presentation_video_duration_seconds",
    "video_duration_seconds",
    "presentation_video_duration",
  ]);

  if (
    value === null ||
    value <= 0
  ) {
    return 0;
  }

  return Math.round(value);
}

export function getVideoDurationLabel(
  intervenant: Intervenant,
): string {
  const value =
    getVideoDurationSeconds(intervenant);

  if (value <= 0) {
    return "60s max";
  }

  return `${value}s / 60s max`;
}

/* =========================================================
   STATUT ET VALIDATION
========================================================= */

export function getIntervenantStatus(
  intervenant: Intervenant,
): string {
  const sources =
    getIntervenantSources(intervenant);

  return (
    firstText(sources, [
      "verification_status",
      "validation_status",
      "account_status",
      "profile_status",
      "status",
    ]) ?? ""
  )
    .toLowerCase()
    .trim();
}

export function getStatusLabel(
  status?: string | null,
): string {
  const normalized = String(
    status ?? "",
  )
    .toLowerCase()
    .trim();

  const labels: Record<string, string> = {
    approved: "Profil vérifié",
    approve: "Profil vérifié",
    verified: "Profil vérifié",
    validated: "Profil vérifié",
    valide: "Profil vérifié",
    "validé": "Profil vérifié",

    active: "Actif",

    pending: "En attente",
    pending_review: "En attente",
    pending_validation: "En attente",
    en_attente: "En attente",
    in_review: "Validation en cours",
    under_review: "Validation en cours",

    incomplete: "Profil incomplet",
    draft: "Profil incomplet",

    rejected: "Refusé",
    refused: "Refusé",
    refuse: "Refusé",
    "refusé": "Refusé",

    inactive: "Inactif",
    disabled: "Désactivé",
    suspended: "Suspendu",
    blocked: "Bloqué",
  };

  return (
    labels[normalized] ??
    "Profil Gotfit"
  );
}

export function getIntervenantStatusLabel(
  intervenant: Intervenant,
): string {
  return getStatusLabel(
    getIntervenantStatus(intervenant),
  );
}

export function isApprovedIntervenant(
  intervenant: Intervenant,
): boolean {
  const status =
    getIntervenantStatus(intervenant);

  return [
    "approved",
    "approve",
    "verified",
    "validated",
    "valide",
    "validé",
    "active",
  ].includes(status);
}

/* =========================================================
   RÔLES
========================================================= */

export function getIntervenantRoleNames(
  intervenant: Intervenant,
): string[] {
  const root = asRecord(intervenant);

  const values: string[] = [];

  [
    root.role,
    root.role_name,
    root.user_type,
    root.type,
  ].forEach((value) => {
    const role = cleanText(value);

    if (role) {
      values.push(role);
    }
  });

  if (Array.isArray(root.roles)) {
    root.roles.forEach((role) => {
      if (
        typeof role === "string"
      ) {
        values.push(role);
        return;
      }

      if (isRecord(role)) {
        const name = cleanText(
          role.name ??
            role.slug ??
            role.label,
        );

        if (name) {
          values.push(name);
        }
      }
    });
  }

  return uniqueStrings(
    values.map((value) =>
      value.toLowerCase(),
    ),
  );
}

export function hasIntervenantRole(
  intervenant: Intervenant,
): boolean {
  const roles =
    getIntervenantRoleNames(intervenant);

  return roles.some((role) => {
    return (
      role.includes("intervenant") ||
      role.includes("coach")
    );
  });
}

/* =========================================================
   VISIBILITÉ PUBLIQUE
========================================================= */

export function isPublicIntervenant(
  intervenant: Intervenant,
): boolean {
  const status =
    getIntervenantStatus(intervenant);

  const blockedStatuses = [
    "rejected",
    "refused",
    "refuse",
    "refusé",
    "inactive",
    "disabled",
    "suspended",
    "blocked",
    "deleted",
  ];

  if (blockedStatuses.includes(status)) {
    return false;
  }

  /*
   * Un profil explicitement en attente ou incomplet
   * ne doit pas être affiché publiquement.
   */
  const privateStatuses = [
    "pending",
    "pending_review",
    "pending_validation",
    "en_attente",
    "in_review",
    "under_review",
    "incomplete",
    "draft",
  ];

  if (privateStatuses.includes(status)) {
    return false;
  }

  const roles =
    getIntervenantRoleNames(intervenant);

  /*
   * Compatibilité avec les anciens comptes pour lesquels
   * aucun rôle n’était renvoyé par l’API.
   */
  if (roles.length === 0) {
    return true;
  }

  return hasIntervenantRole(intervenant);
}

/* =========================================================
   COMPLÉTION DU PROFIL
========================================================= */

export function getProfileCompletion(
  intervenant: Intervenant,
): number {
  const sources =
    getIntervenantSources(intervenant);

  const apiCompletion = firstNumber(
    sources,
    [
      "profile_completion",
      "profile_completion_percentage",
      "completion_percentage",
    ],
  );

  if (apiCompletion !== null) {
    return Math.min(
      100,
      Math.max(
        0,
        Math.round(apiCompletion),
      ),
    );
  }

  const root = asRecord(intervenant);

  const completedFields = [
    Boolean(getIntervenantName(intervenant)),
    Boolean(cleanText(root.email)),
    Boolean(getActivityName(intervenant)),
    isValidSiret(intervenant),
    getDocumentsCount(intervenant) > 0,
  ].filter(Boolean).length;

  return Math.round(
    (completedFields / 5) * 100,
  );
}

export function getProfileMissingFields(
  intervenant: Intervenant,
): string[] {
  const root = asRecord(intervenant);
  const missingFields: string[] = [];

  if (!cleanText(root.name)) {
    missingFields.push(
      "Renseignez votre nom.",
    );
  }

  if (!cleanText(root.email)) {
    missingFields.push(
      "Renseignez votre adresse e-mail.",
    );
  }

  if (!getActivityName(intervenant)) {
    missingFields.push(
      "Renseignez le nom de votre activité.",
    );
  }

  if (!isValidSiret(intervenant)) {
    missingFields.push(
      "Renseignez un numéro SIRET valide de 14 chiffres.",
    );
  }

  if (
    getDocumentsCount(intervenant) < 1
  ) {
    missingFields.push(
      "Ajoutez au moins un diplôme ou une certification.",
    );
  }

  return missingFields;
}

/* =========================================================
   OPTIONS DE FILTRAGE
========================================================= */

export function getSpecialityOptions(
  intervenants: Intervenant[],
): string[] {
  const options = intervenants
    .filter(isPublicIntervenant)
    .flatMap((intervenant) => {
      const services =
        getCoachServices(intervenant);

      const speciality =
        getCoachSpeciality(intervenant);

      return [
        speciality,
        ...services,
      ];
    })
    .filter(
      (item) =>
        item !==
        "Spécialité à compléter",
    );

  const uniqueOptions =
    uniqueStrings(options).sort(
      (first, second) =>
        first.localeCompare(
          second,
          "fr-FR",
          {
            sensitivity: "base",
          },
        ),
    );

  return ["Tous", ...uniqueOptions];
}