"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { getAssetUrl } from "@/lib/api-config";

import type {
  CoachDocument,
  CoachDocumentType,
} from "@/types/auth";

/* =========================================================
   CONFIGURATION
========================================================= */

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  "https://api.gotfit.tech/api"
).replace(/\/+$/, "");

const DEFAULT_DOCUMENT_ENDPOINTS = [
  `${API_URL}/intervenant/documents`,
  `${API_URL}/intervenant/profile/documents`,
  `${API_URL}/coach/documents`,
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

const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ACCEPTED_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
];

const DOCUMENT_TYPE_OPTIONS: Array<{
  value: CoachDocumentType;
  label: string;
  description: string;
}> = [
  {
    value: "diploma",
    label: "Diplôme",
    description: "Diplôme ou titre professionnel.",
  },
  {
    value: "certification",
    label: "Certification",
    description: "Certification liée à votre activité.",
  },
  {
    value: "identity",
    label: "Pièce d’identité",
    description: "Document permettant de vérifier votre identité.",
  },
  {
    value: "professional_card",
    label: "Carte professionnelle",
    description: "Carte ou autorisation professionnelle.",
  },
  {
    value: "license",
    label: "Licence",
    description: "Licence ou agrément professionnel.",
  },
  {
    value: "insurance",
    label: "Assurance",
    description: "Attestation d’assurance professionnelle.",
  },
  {
    value: "other",
    label: "Autre justificatif",
    description: "Tout autre document utile.",
  },
];

/* =========================================================
   TYPES
========================================================= */

type UnknownRecord = Record<string, unknown>;

type ManagerStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error";

type Notice = {
  type: "success" | "error" | "info";
  message: string;
} | null;

type StagedDocument = {
  key: string;
  file: File;
  type: CoachDocumentType;
};

type ApiRequestResult = {
  endpoint: string;
  payload: unknown;
  status: number;
};

export type CoachDocumentsManagerProps = {
  initialDocuments?: CoachDocument[] | null;

  /**
   * Endpoints Laravel à tester.
   * Seuls les codes 404 et 405 déclenchent le test
   * de l’endpoint suivant.
   */
  endpoints?: readonly string[];

  /**
   * Nombre total maximum de documents enregistrés.
   */
  maxDocuments?: number;

  /**
   * Taille maximale d’un fichier en mégaoctets.
   */
  maxFileSizeMb?: number;

  /**
   * Nom du champ attendu par Laravel pour les fichiers.
   */
  fileFieldName?: string;

  /**
   * Nom du champ attendu pour les types de documents.
   */
  typeFieldName?: string;

  /**
   * Charge automatiquement les documents au montage.
   */
  autoLoad?: boolean;

  /**
   * Désactive l’ajout et la suppression.
   */
  readOnly?: boolean;

  /**
   * URL de connexion utilisée lorsque le token est expiré.
   */
  loginHref?: string;

  className?: string;

  onDocumentsChange?: (
    documents: CoachDocument[],
  ) => void;
};

/* =========================================================
   ERREURS PERSONNALISÉES
========================================================= */

class ApiRequestError extends Error {
  status: number;
  payload: unknown;

  constructor(
    message: string,
    status: number,
    payload: unknown = null,
  ) {
    super(message);

    this.name = "ApiRequestError";
    this.status = status;
    this.payload = payload;
  }
}

class UnauthorizedError extends Error {
  constructor() {
    super("Votre session a expiré.");

    this.name = "UnauthorizedError";
  }
}

/* =========================================================
   OUTILS GÉNÉRIQUES
========================================================= */

function classNames(
  ...values: Array<
    string | false | null | undefined
  >
): string {
  return values.filter(Boolean).join(" ");
}

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function cleanText(
  value: unknown,
): string | null {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return null;
  }

  const text = String(value).trim();

  return text || null;
}

function cleanNumber(
  value: unknown,
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

  const parsed = Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function getApiMessage(
  payload: unknown,
  fallback: string,
): string {
  if (!isRecord(payload)) {
    return fallback;
  }

  const directMessage =
    cleanText(payload.message) ??
    cleanText(payload.error);

  if (directMessage) {
    return directMessage;
  }

  if (isRecord(payload.data)) {
    const nestedMessage =
      cleanText(payload.data.message) ??
      cleanText(payload.data.error);

    if (nestedMessage) {
      return nestedMessage;
    }
  }

  if (isRecord(payload.errors)) {
    const firstError = Object.values(
      payload.errors,
    )[0];

    if (Array.isArray(firstError)) {
      return (
        firstError
          .map(cleanText)
          .find(Boolean) ??
        fallback
      );
    }

    const errorText =
      cleanText(firstError);

    if (errorText) {
      return errorText;
    }
  }

  return fallback;
}

function createDocumentKey(
  file: File,
): string {
  return [
    file.name,
    file.size,
    file.lastModified,
  ].join("-");
}

function getFileExtension(
  fileName: string,
): string {
  const parts = fileName
    .toLowerCase()
    .split(".");

  return parts.length > 1
    ? parts.pop() ?? ""
    : "";
}

function isAcceptedFile(
  file: File,
): boolean {
  if (
    file.type &&
    ACCEPTED_MIME_TYPES.has(
      file.type.toLowerCase(),
    )
  ) {
    return true;
  }

  return ACCEPTED_EXTENSIONS.includes(
    getFileExtension(file.name),
  );
}

function formatFileSize(
  value: unknown,
): string {
  const bytes = cleanNumber(value);

  if (
    bytes === null ||
    bytes <= 0
  ) {
    return "Taille inconnue";
  }

  if (bytes < 1024) {
    return `${Math.round(bytes)} octets`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} Ko`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(2)} Mo`;
}

function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return "Date inconnue";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

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

function getDocumentUrl(
  document: CoachDocument,
): string | null {
  const rawUrl =
    document.file_url ??
    document.download_url ??
    document.url ??
    document.path ??
    null;

  if (!rawUrl) {
    return null;
  }

  return (
    cleanText(getAssetUrl(rawUrl)) ??
    rawUrl
  );
}

function getDocumentTypeLabel(
  type?: string | null,
): string {
  const option =
    DOCUMENT_TYPE_OPTIONS.find(
      (item) =>
        item.value === type,
    );

  return option?.label ?? "Document";
}

function getStatusValue(
  document: CoachDocument,
): string {
  return String(
    document.verification_status ??
      document.status ??
      "pending",
  )
    .trim()
    .toLowerCase();
}

function getStatusLabel(
  status: string,
): string {
  const labels: Record<
    string,
    string
  > = {
    approved: "Validé",
    verified: "Validé",
    validated: "Validé",
    valide: "Validé",
    "validé": "Validé",

    pending: "En attente",
    pending_review: "En attente",
    pending_validation: "En attente",
    in_review: "En cours de vérification",
    under_review: "En cours de vérification",

    rejected: "Refusé",
    refused: "Refusé",
    refuse: "Refusé",
    "refusé": "Refusé",

    incomplete: "Incomplet",
    not_submitted: "Non transmis",
  };

  return (
    labels[status] ??
    "En attente"
  );
}

function getStatusClasses(
  status: string,
): string {
  if (
    [
      "approved",
      "verified",
      "validated",
      "valide",
      "validé",
    ].includes(status)
  ) {
    return [
      "border-emerald-200",
      "bg-emerald-50",
      "text-emerald-700",
    ].join(" ");
  }

  if (
    [
      "rejected",
      "refused",
      "refuse",
      "refusé",
    ].includes(status)
  ) {
    return [
      "border-red-200",
      "bg-red-50",
      "text-red-700",
    ].join(" ");
  }

  if (
    [
      "incomplete",
      "not_submitted",
    ].includes(status)
  ) {
    return [
      "border-slate-200",
      "bg-slate-50",
      "text-slate-700",
    ].join(" ");
  }

  return [
    "border-amber-200",
    "bg-amber-50",
    "text-amber-700",
  ].join(" ");
}

/* =========================================================
   NORMALISATION DES DOCUMENTS
========================================================= */

function normalizeDocument(
  payload: unknown,
  index: number,
): CoachDocument | null {
  if (!isRecord(payload)) {
    return null;
  }

  const id =
    payload.id ??
    payload.document_id ??
    `document-${index}`;

  const name =
    cleanText(payload.name) ??
    cleanText(payload.title) ??
    cleanText(payload.original_name) ??
    cleanText(payload.file_name) ??
    `Document ${index + 1}`;

  const type =
    cleanText(payload.type) ??
    cleanText(payload.document_type) ??
    cleanText(payload.category) ??
    "other";

  return {
    id:
      typeof id === "string" ||
      typeof id === "number"
        ? id
        : `document-${index}`,

    name,

    title:
      cleanText(payload.title),

    original_name:
      cleanText(
        payload.original_name,
      ),

    file_name:
      cleanText(payload.file_name),

    type,

    disk:
      cleanText(payload.disk),

    path:
      cleanText(payload.path),

    url:
      cleanText(payload.url),

    file_url:
      cleanText(payload.file_url),

    download_url:
      cleanText(
        payload.download_url,
      ),

    mime_type:
      cleanText(payload.mime_type),

    extension:
      cleanText(payload.extension),

    size:
      cleanNumber(payload.size) ??
      cleanNumber(payload.size_bytes),

    size_bytes:
      cleanNumber(
        payload.size_bytes,
      ) ??
      cleanNumber(payload.size),

    verification_status:
      cleanText(
        payload.verification_status,
      ) ??
      cleanText(payload.status) ??
      "pending",

    status:
      cleanText(payload.status) ??
      cleanText(
        payload.verification_status,
      ) ??
      "pending",

    rejection_reason:
      cleanText(
        payload.rejection_reason,
      ),

    verified_at:
      cleanText(payload.verified_at),

    created_at:
      cleanText(payload.created_at),

    updated_at:
      cleanText(payload.updated_at),
  };
}

function normalizeDocuments(
  values: unknown[],
): CoachDocument[] {
  const unique = new Map<
    string,
    CoachDocument
  >();

  values.forEach((value, index) => {
    const document =
      normalizeDocument(value, index);

    if (!document) {
      return;
    }

    const key = String(
      document.id ??
        document.file_url ??
        document.url ??
        document.name,
    );

    if (!unique.has(key)) {
      unique.set(key, document);
    }
  });

  return Array.from(unique.values());
}

function extractDocuments(
  payload: unknown,
): CoachDocument[] {
  if (Array.isArray(payload)) {
    return normalizeDocuments(payload);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates: unknown[] = [
    payload.documents,
    payload.coach_documents,
    payload.items,
    payload.results,
  ];

  if (Array.isArray(payload.data)) {
    candidates.push(payload.data);
  }

  if (isRecord(payload.data)) {
    candidates.push(
      payload.data.documents,
      payload.data.coach_documents,
      payload.data.items,
      payload.data.results,
    );

    if (
      isRecord(payload.data.user)
    ) {
      candidates.push(
        payload.data.user
          .coach_documents,
        payload.data.user.documents,
      );
    }
  }

  if (isRecord(payload.user)) {
    candidates.push(
      payload.user.coach_documents,
      payload.user.documents,
    );
  }

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return normalizeDocuments(
        candidate,
      );
    }
  }

  /*
   * Cas où l’API renvoie directement
   * le document nouvellement créé.
   */
  if (
    payload.id ||
    payload.document_id
  ) {
    const document =
      normalizeDocument(payload, 0);

    return document
      ? [document]
      : [];
  }

  if (
    isRecord(payload.data) &&
    (
      payload.data.id ||
      payload.data.document_id
    )
  ) {
    const document =
      normalizeDocument(
        payload.data,
        0,
      );

    return document
      ? [document]
      : [];
  }

  return [];
}

/* =========================================================
   SYNCHRONISATION DU PROFIL LOCAL
========================================================= */

function updateUserObjectDocuments(
  user: UnknownRecord,
  documents: CoachDocument[],
): UnknownRecord {
  const updatedUser: UnknownRecord = {
    ...user,
    coach_documents: documents,
    documents_count: documents.length,
  };

  const profileKeys = [
    "profile",
    "coach_profile",
    "intervenant_profile",
    "professional_profile",
  ];

  profileKeys.forEach((key) => {
    if (isRecord(user[key])) {
      updatedUser[key] = {
        ...user[key],
        coach_documents: documents,
        documents_count:
          documents.length,
      };
    }
  });

  return updatedUser;
}

function updateStoragePayload(
  payload: unknown,
  documents: CoachDocument[],
): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  if (isRecord(payload.user)) {
    return {
      ...payload,
      user: updateUserObjectDocuments(
        payload.user,
        documents,
      ),
    };
  }

  if (
    isRecord(payload.data) &&
    isRecord(payload.data.user)
  ) {
    return {
      ...payload,
      data: {
        ...payload.data,
        user: updateUserObjectDocuments(
          payload.data.user,
          documents,
        ),
      },
    };
  }

  return updateUserObjectDocuments(
    payload,
    documents,
  );
}

function synchronizeStoredDocuments(
  documents: CoachDocument[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  USER_STORAGE_KEYS.forEach((key) => {
    const rawValue =
      window.localStorage.getItem(key);

    if (!rawValue) {
      return;
    }

    try {
      const parsed: unknown =
        JSON.parse(rawValue);

      const updated =
        updateStoragePayload(
          parsed,
          documents,
        );

      window.localStorage.setItem(
        key,
        JSON.stringify(updated),
      );
    } catch {
      // Ignore les anciennes valeurs non JSON.
    }
  });

  window.dispatchEvent(
    new CustomEvent(
      "gotfit:coach-documents",
      {
        detail: {
          documents,
          documentsCount:
            documents.length,
        },
      },
    ),
  );

  /*
   * Les pages profil et dashboard écoutent déjà
   * l’événement gotfit:auth.
   */
  window.dispatchEvent(
    new CustomEvent("gotfit:auth", {
      detail: {
        action: "profile_updated",
        authenticated: true,
      },
    }),
  );
}

/* =========================================================
   REQUÊTES API
========================================================= */

async function parseResponsePayload(
  response: Response,
): Promise<unknown> {
  const contentType =
    response.headers.get(
      "content-type",
    ) ?? "";

  if (
    contentType.includes(
      "application/json",
    )
  ) {
    return response
      .json()
      .catch(() => null);
  }

  const text = await response
    .text()
    .catch(() => "");

  return text
    ? {
        message: text,
      }
    : null;
}

function prioritizeEndpoints(
  endpoints: readonly string[],
  preferredEndpoint?: string | null,
): string[] {
  const uniqueEndpoints =
    Array.from(
      new Set(
        endpoints
          .map((endpoint) =>
            endpoint.replace(/\/+$/, ""),
          )
          .filter(Boolean),
      ),
    );

  if (!preferredEndpoint) {
    return uniqueEndpoints;
  }

  const normalizedPreferred =
    preferredEndpoint.replace(/\/+$/, "");

  return [
    normalizedPreferred,
    ...uniqueEndpoints.filter(
      (endpoint) =>
        endpoint !==
        normalizedPreferred,
    ),
  ];
}

async function requestDocuments(
  token: string,
  endpoints: readonly string[],
  signal?: AbortSignal,
): Promise<ApiRequestResult> {
  let lastMessage =
    "Aucun endpoint Laravel pour les justificatifs n’a été trouvé.";

  for (const endpoint of endpoints) {
    const response = await fetch(
      endpoint,
      {
        method: "GET",

        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },

        cache: "no-store",
        signal,
      },
    );

    const payload =
      await parseResponsePayload(
        response,
      );

    if (response.status === 401) {
      throw new UnauthorizedError();
    }

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

    if (!response.ok) {
      throw new ApiRequestError(
        getApiMessage(
          payload,
          "Impossible de récupérer les justificatifs.",
        ),
        response.status,
        payload,
      );
    }

    return {
      endpoint,
      payload,
      status: response.status,
    };
  }

  throw new ApiRequestError(
    lastMessage,
    404,
  );
}

async function uploadDocumentsRequest(
  token: string,
  endpoints: readonly string[],
  stagedDocuments: StagedDocument[],
  fileFieldName: string,
  typeFieldName: string,
): Promise<ApiRequestResult> {
  let lastMessage =
    "Aucun endpoint Laravel d’envoi de documents n’a été trouvé.";

  for (const endpoint of endpoints) {
    /*
     * Le FormData est recréé pour chaque tentative.
     */
    const formData = new FormData();

    stagedDocuments.forEach(
      (document) => {
        formData.append(
          fileFieldName,
          document.file,
          document.file.name,
        );

        formData.append(
          typeFieldName,
          document.type,
        );
      },
    );

    const response = await fetch(
      endpoint,
      {
        method: "POST",

        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: formData,
      },
    );

    const payload =
      await parseResponsePayload(
        response,
      );

    if (response.status === 401) {
      throw new UnauthorizedError();
    }

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

    if (!response.ok) {
      throw new ApiRequestError(
        getApiMessage(
          payload,
          "L’envoi des justificatifs a échoué.",
        ),
        response.status,
        payload,
      );
    }

    return {
      endpoint,
      payload,
      status: response.status,
    };
  }

  throw new ApiRequestError(
    lastMessage,
    404,
  );
}

async function deleteDocumentRequest(
  token: string,
  endpoints: readonly string[],
  documentId: string | number,
): Promise<ApiRequestResult> {
  let lastMessage =
    "Aucun endpoint Laravel de suppression n’a été trouvé.";

  for (const collectionEndpoint of endpoints) {
    const endpoint = [
      collectionEndpoint.replace(
        /\/+$/,
        "",
      ),
      encodeURIComponent(
        String(documentId),
      ),
    ].join("/");

    const response = await fetch(
      endpoint,
      {
        method: "DELETE",

        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const payload =
      await parseResponsePayload(
        response,
      );

    if (response.status === 401) {
      throw new UnauthorizedError();
    }

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

    if (!response.ok) {
      throw new ApiRequestError(
        getApiMessage(
          payload,
          "Impossible de supprimer ce justificatif.",
        ),
        response.status,
        payload,
      );
    }

    return {
      endpoint:
        collectionEndpoint,
      payload,
      status: response.status,
    };
  }

  throw new ApiRequestError(
    lastMessage,
    404,
  );
}

/* =========================================================
   ICÔNES
========================================================= */

type IconProps = {
  className?: string;
};

function DocumentIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

function UploadIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
    </svg>
  );
}

function TrashIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="m6 7 1 14h10l1-14" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function EyeIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function RefreshIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M6.1 9a7 7 0 0 1 11.3-2L20 9" />
      <path d="M17.9 15a7 7 0 0 1-11.3 2L4 15" />
    </svg>
  );
}

/* =========================================================
   SQUELETTE
========================================================= */

function DocumentsSkeleton() {
  return (
    <div
      className="grid gap-4 md:grid-cols-2"
      aria-hidden="true"
    >
      {Array.from({
        length: 2,
      }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-200" />

            <div className="flex-1 space-y-3">
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
              <div className="h-7 w-24 rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */

export default function CoachDocumentsManager({
  initialDocuments = [],
  endpoints,
  maxDocuments = 5,
  maxFileSizeMb = 8,
  fileFieldName = "documents[]",
  typeFieldName = "document_types[]",
  autoLoad = true,
  readOnly = false,
  loginHref = "/auth/login",
  className,
  onDocumentsChange,
}: CoachDocumentsManagerProps) {
  const router = useRouter();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const activeEndpointRef =
    useRef<string | null>(null);

  const normalizedEndpoints =
    useMemo(() => {
      const values =
        endpoints &&
        endpoints.length > 0
          ? endpoints
          : DEFAULT_DOCUMENT_ENDPOINTS;

      return Array.from(
        new Set(
          values
            .map((endpoint) =>
              endpoint.replace(
                /\/+$/,
                "",
              ),
            )
            .filter(Boolean),
        ),
      );
    }, [endpoints]);

  const [
    documents,
    setDocuments,
  ] = useState<CoachDocument[]>(
    () =>
      Array.isArray(
        initialDocuments,
      )
        ? normalizeDocuments(
            initialDocuments,
          )
        : [],
  );

  const [
    stagedDocuments,
    setStagedDocuments,
  ] = useState<StagedDocument[]>(
    [],
  );

  const [status, setStatus] =
    useState<ManagerStatus>(
      autoLoad ? "loading" : "ready",
    );

  const [notice, setNotice] =
    useState<Notice>(null);

  const [isDragging, setIsDragging] =
    useState(false);

  const [isUploading, setIsUploading] =
    useState(false);

  const [
    deletingDocumentId,
    setDeletingDocumentId,
  ] = useState<
    string | number | null
  >(null);

  const maxFileSizeBytes =
    maxFileSizeMb *
    1024 *
    1024;

  const remainingSlots = Math.max(
    0,
    maxDocuments -
      documents.length -
      stagedDocuments.length,
  );

  const profileIsComplete =
    documents.length > 0;

  const commitDocuments =
    useCallback(
      (
        nextDocuments: CoachDocument[],
      ) => {
        const normalized =
          normalizeDocuments(
            nextDocuments,
          );

        setDocuments(normalized);

        synchronizeStoredDocuments(
          normalized,
        );

        onDocumentsChange?.(
          normalized,
        );
      },
      [onDocumentsChange],
    );

  const redirectToLogin =
    useCallback(() => {
      clearStoredAuthentication();

      const redirectPath =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/intervenant/profile/documents";

      router.replace(
        `${loginHref}?redirect=${encodeURIComponent(
          redirectPath,
        )}`,
      );
    }, [loginHref, router]);

  const loadDocuments =
    useCallback(
      async (
        options: {
          silent?: boolean;
          signal?: AbortSignal;
        } = {},
      ) => {
        const {
          silent = false,
          signal,
        } = options;

        const token =
          readAuthToken();

        if (!token) {
          redirectToLogin();
          return null;
        }

        if (!silent) {
          setStatus("loading");
          setNotice(null);
        }

        try {
          const requestEndpoints =
            prioritizeEndpoints(
              normalizedEndpoints,
              activeEndpointRef.current,
            );

          const result =
            await requestDocuments(
              token,
              requestEndpoints,
              signal,
            );

          activeEndpointRef.current =
            result.endpoint;

          const nextDocuments =
            extractDocuments(
              result.payload,
            );

          commitDocuments(
            nextDocuments,
          );

          setStatus("ready");

          return nextDocuments;
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return null;
          }

          if (
            error instanceof
            UnauthorizedError
          ) {
            redirectToLogin();
            return null;
          }

          if (!silent) {
            setStatus("error");

            setNotice({
              type: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Impossible de charger les justificatifs.",
            });
          }

          return null;
        }
      },
      [
        commitDocuments,
        normalizedEndpoints,
        redirectToLogin,
      ],
    );

  useEffect(() => {
    const controller =
      new AbortController();

    const timer = window.setTimeout(() => {
      if (!autoLoad) {
        setStatus("ready");
        return;
      }

      void loadDocuments({
        signal: controller.signal,
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [autoLoad, loadDocuments]);

  useEffect(() => {
    if (
      !initialDocuments ||
      initialDocuments.length === 0
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      const normalized =
        normalizeDocuments(
          initialDocuments,
        );

      setDocuments(normalized);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialDocuments]);

  const addFiles =
    useCallback(
      (fileList: FileList | File[]) => {
        if (readOnly) {
          return;
        }

        const incomingFiles =
          Array.from(fileList);

        if (incomingFiles.length === 0) {
          return;
        }

        const currentKeys =
          new Set([
            ...stagedDocuments.map(
              (document) =>
                document.key,
            ),
          ]);

        const accepted: StagedDocument[] =
          [];

        const errorMessages: string[] =
          [];

        for (const file of incomingFiles) {
          if (
            accepted.length >=
            remainingSlots
          ) {
            errorMessages.push(
              `Vous pouvez enregistrer au maximum ${maxDocuments} justificatifs.`,
            );

            break;
          }

          const key =
            createDocumentKey(file);

          if (currentKeys.has(key)) {
            errorMessages.push(
              `Le fichier « ${file.name} » est déjà sélectionné.`,
            );

            continue;
          }

          if (!isAcceptedFile(file)) {
            errorMessages.push(
              `Le fichier « ${file.name} » n’est pas accepté. Formats autorisés : PDF, JPG, PNG et WEBP.`,
            );

            continue;
          }

          if (
            file.size >
            maxFileSizeBytes
          ) {
            errorMessages.push(
              `Le fichier « ${file.name} » dépasse ${maxFileSizeMb} Mo.`,
            );

            continue;
          }

          if (file.size <= 0) {
            errorMessages.push(
              `Le fichier « ${file.name} » est vide.`,
            );

            continue;
          }

          currentKeys.add(key);

          accepted.push({
            key,
            file,
            type: "certification",
          });
        }

        if (accepted.length > 0) {
          setStagedDocuments(
            (current) => [
              ...current,
              ...accepted,
            ],
          );
        }

        if (
          errorMessages.length > 0
        ) {
          setNotice({
            type: "error",
            message:
              errorMessages.join(" "),
          });
        } else {
          setNotice(null);
        }

        if (fileInputRef.current) {
          fileInputRef.current.value =
            "";
        }
      },
      [
        maxDocuments,
        maxFileSizeBytes,
        maxFileSizeMb,
        readOnly,
        remainingSlots,
        stagedDocuments,
      ],
    );

  function removeStagedDocument(
    key: string,
  ): void {
    setStagedDocuments(
      (current) =>
        current.filter(
          (document) =>
            document.key !== key,
        ),
    );

    setNotice(null);
  }

  function updateStagedDocumentType(
    key: string,
    type: CoachDocumentType,
  ): void {
    setStagedDocuments(
      (current) =>
        current.map((document) =>
          document.key === key
            ? {
                ...document,
                type,
              }
            : document,
        ),
    );
  }

  async function handleUpload(): Promise<void> {
    if (
      readOnly ||
      isUploading
    ) {
      return;
    }

    if (
      stagedDocuments.length === 0
    ) {
      setNotice({
        type: "error",
        message:
          "Sélectionnez au moins un justificatif.",
      });

      return;
    }

    if (
      documents.length +
        stagedDocuments.length >
      maxDocuments
    ) {
      setNotice({
        type: "error",
        message: `Vous pouvez enregistrer au maximum ${maxDocuments} justificatifs.`,
      });

      return;
    }

    const token =
      readAuthToken();

    if (!token) {
      redirectToLogin();
      return;
    }

    setIsUploading(true);
    setNotice(null);

    try {
      const requestEndpoints =
        prioritizeEndpoints(
          normalizedEndpoints,
          activeEndpointRef.current,
        );

      const result =
        await uploadDocumentsRequest(
          token,
          requestEndpoints,
          stagedDocuments,
          fileFieldName,
          typeFieldName,
        );

      activeEndpointRef.current =
        result.endpoint;

      const responseDocuments =
        extractDocuments(
          result.payload,
        );

      let nextDocuments:
        | CoachDocument[]
        | null = null;

      /*
       * L’API peut renvoyer toute la liste ou seulement
       * les documents nouvellement créés.
       */
      if (
        responseDocuments.length > 0
      ) {
        const existingIds =
          new Set(
            documents.map(
              (document) =>
                String(document.id),
            ),
          );

        const responseContainsExisting =
          responseDocuments.some(
            (document) =>
              existingIds.has(
                String(document.id),
              ),
          );

        nextDocuments =
          responseContainsExisting
            ? responseDocuments
            : [
                ...documents,
                ...responseDocuments,
              ];

        commitDocuments(
          nextDocuments,
        );
      } else {
        nextDocuments =
          await loadDocuments({
            silent: true,
          });
      }

      setStagedDocuments([]);

      setNotice({
        type: "success",
        message:
          stagedDocuments.length > 1
            ? "Vos justificatifs ont bien été envoyés et sont en attente de vérification."
            : "Votre justificatif a bien été envoyé et est en attente de vérification.",
      });
    } catch (error) {
      if (
        error instanceof
        UnauthorizedError
      ) {
        redirectToLogin();
        return;
      }

      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d’envoyer les justificatifs.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(
    document: CoachDocument,
  ): Promise<void> {
    if (
      readOnly ||
      deletingDocumentId !== null
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Supprimer le justificatif « ${document.name} » ?`,
      );

    if (!confirmed) {
      return;
    }

    const token =
      readAuthToken();

    if (!token) {
      redirectToLogin();
      return;
    }

    setDeletingDocumentId(
      document.id,
    );

    setNotice(null);

    try {
      const requestEndpoints =
        prioritizeEndpoints(
          normalizedEndpoints,
          activeEndpointRef.current,
        );

      const result =
        await deleteDocumentRequest(
          token,
          requestEndpoints,
          document.id,
        );

      activeEndpointRef.current =
        result.endpoint;

      const responseDocuments =
        extractDocuments(
          result.payload,
        );

      if (
        responseDocuments.length > 0
      ) {
        commitDocuments(
          responseDocuments,
        );
      } else {
        commitDocuments(
          documents.filter(
            (item) =>
              String(item.id) !==
              String(document.id),
          ),
        );
      }

      setNotice({
        type: "success",
        message:
          "Le justificatif a bien été supprimé.",
      });
    } catch (error) {
      if (
        error instanceof
        UnauthorizedError
      ) {
        redirectToLogin();
        return;
      }

      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer ce justificatif.",
      });
    } finally {
      setDeletingDocumentId(null);
    }
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>,
  ): void {
    event.preventDefault();

    setIsDragging(false);

    if (
      readOnly ||
      remainingSlots <= 0
    ) {
      return;
    }

    addFiles(
      event.dataTransfer.files,
    );
  }

  return (
    <section
      className={classNames(
        "overflow-hidden rounded-[2rem]",
        "border border-slate-200",
        "bg-white shadow-sm",
        className,
      )}
    >
      {/* =================================================
          EN-TÊTE
      ================================================= */}

      <header className="border-b border-slate-100 bg-gradient-to-br from-white via-white to-orange-50/60 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-slate-950 shadow-lg shadow-orange-200/60">
              <DocumentIcon className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.17em] text-orange-500">
                Vérification professionnelle
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Mes justificatifs
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Ajoutez vos diplômes,
                certifications ou autres
                documents professionnels.
                Chaque fichier sera contrôlé
                avant la validation de votre
                profil.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
              <strong className="block text-2xl font-black text-slate-950">
                {documents.length}
                <span className="text-sm text-slate-400">
                  /{maxDocuments}
                </span>
              </strong>

              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Documents
              </span>
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  void loadDocuments();
                }}
                disabled={
                  status === "loading"
                }
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-wait disabled:opacity-60"
                aria-label="Actualiser les justificatifs"
              >
                <RefreshIcon
                  className={classNames(
                    "h-5 w-5",
                    status === "loading" &&
                      "animate-spin",
                  )}
                />
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-500 transition-all duration-500"
            style={{
              width: `${Math.min(
                100,
                (
                  documents.length /
                  maxDocuments
                ) * 100,
              )}%`,
            }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
          <span>
            Au moins un justificatif est
            nécessaire pour compléter le
            profil intervenant.
          </span>

          <span
            className={
              profileIsComplete
                ? "text-emerald-600"
                : "text-amber-600"
            }
          >
            {profileIsComplete
              ? "Condition remplie"
              : "Document requis"}
          </span>
        </div>
      </header>

      <div className="space-y-7 p-6 sm:p-8">
        {/* =================================================
            NOTIFICATION
        ================================================= */}

        {notice && (
          <div
            role={
              notice.type === "error"
                ? "alert"
                : "status"
            }
            className={classNames(
              "rounded-2xl border p-4 text-sm font-semibold leading-6",

              notice.type ===
                "success" &&
                [
                  "border-emerald-200",
                  "bg-emerald-50",
                  "text-emerald-800",
                ].join(" "),

              notice.type === "error" &&
                [
                  "border-red-200",
                  "bg-red-50",
                  "text-red-800",
                ].join(" "),

              notice.type === "info" &&
                [
                  "border-blue-200",
                  "bg-blue-50",
                  "text-blue-800",
                ].join(" "),
            )}
          >
            {notice.message}
          </div>
        )}

        {/* =================================================
            DOCUMENTS EXISTANTS
        ================================================= */}

        <section aria-labelledby="saved-documents-title">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-orange-500">
                Documents transmis
              </p>

              <h3
                id="saved-documents-title"
                className="mt-1 text-xl font-black text-slate-950"
              >
                Justificatifs enregistrés
              </h3>
            </div>

            <span className="text-xs font-bold text-slate-500">
              {documents.length} document
              {documents.length > 1
                ? "s"
                : ""}
            </span>
          </div>

          {status === "loading" && (
            <DocumentsSkeleton />
          )}

          {status !== "loading" &&
            documents.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                  <DocumentIcon className="h-6 w-6" />
                </div>

                <h4 className="mt-4 text-lg font-black text-slate-950">
                  Aucun justificatif enregistré
                </h4>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Ajoutez au moins un diplôme
                  ou une certification pour
                  permettre la validation de
                  votre profil.
                </p>
              </div>
            )}

          {status !== "loading" &&
            documents.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {documents.map(
                  (document) => {
                    const documentUrl =
                      getDocumentUrl(
                        document,
                      );

                    const documentStatus =
                      getStatusValue(
                        document,
                      );

                    const isDeleting =
                      String(
                        deletingDocumentId,
                      ) ===
                      String(document.id);

                    return (
                      <article
                        key={String(
                          document.id,
                        )}
                        className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg hover:shadow-slate-200/60"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition group-hover:bg-orange-50 group-hover:text-orange-600">
                            <DocumentIcon className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4
                              className="truncate text-sm font-black text-slate-950"
                              title={
                                document.name
                              }
                            >
                              {document.name}
                            </h4>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {getDocumentTypeLabel(
                                document.type,
                              )}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span
                                className={classNames(
                                  "inline-flex rounded-full border px-3 py-1 text-[11px] font-black",
                                  getStatusClasses(
                                    documentStatus,
                                  ),
                                )}
                              >
                                {getStatusLabel(
                                  documentStatus,
                                )}
                              </span>

                              <span className="text-[11px] font-semibold text-slate-400">
                                {formatFileSize(
                                  document.size_bytes ??
                                    document.size,
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <p className="text-xs font-semibold text-slate-400">
                            Ajouté le{" "}
                            {formatDate(
                              document.created_at,
                            )}
                          </p>

                          {document.rejection_reason && (
                            <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3">
                              <p className="text-[11px] font-black uppercase tracking-wider text-red-600">
                                Motif du refus
                              </p>

                              <p className="mt-1 text-xs font-semibold leading-5 text-red-800">
                                {
                                  document.rejection_reason
                                }
                              </p>
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            {documentUrl && (
                              <a
                                href={
                                  documentUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                              >
                                <EyeIcon className="h-4 w-4" />

                                Consulter
                              </a>
                            )}

                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => {
                                  void handleDelete(
                                    document,
                                  );
                                }}
                                disabled={
                                  deletingDocumentId !==
                                  null
                                }
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:border-red-200 hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
                              >
                                <TrashIcon className="h-4 w-4" />

                                {isDeleting
                                  ? "Suppression..."
                                  : "Supprimer"}
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}
        </section>

        {/* =================================================
            AJOUT DE DOCUMENTS
        ================================================= */}

        {!readOnly && (
          <section
            aria-labelledby="upload-documents-title"
            className="border-t border-slate-100 pt-7"
          >
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-orange-500">
                Ajouter des justificatifs
              </p>

              <h3
                id="upload-documents-title"
                className="mt-1 text-xl font-black text-slate-950"
              >
                Importer mes documents
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Formats acceptés : PDF, JPG,
                PNG et WEBP. Taille maximale :
                {` ${maxFileSizeMb} Mo `}
                par fichier.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={
                remainingSlots <= 0 ||
                isUploading
              }
              onChange={(event) => {
                if (
                  event.target.files
                ) {
                  addFiles(
                    event.target.files,
                  );
                }
              }}
            />

            <div
              role="button"
              tabIndex={
                remainingSlots > 0
                  ? 0
                  : -1
              }
              aria-disabled={
                remainingSlots <= 0
              }
              onClick={() => {
                if (
                  remainingSlots > 0 &&
                  !isUploading
                ) {
                  fileInputRef.current?.click();
                }
              }}
              onKeyDown={(event) => {
                if (
                  (
                    event.key ===
                      "Enter" ||
                    event.key === " "
                  ) &&
                  remainingSlots > 0 &&
                  !isUploading
                ) {
                  event.preventDefault();

                  fileInputRef.current?.click();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();

                if (
                  remainingSlots > 0
                ) {
                  setIsDragging(true);
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();

                if (
                  remainingSlots > 0
                ) {
                  setIsDragging(true);
                }
              }}
              onDragLeave={(event) => {
                event.preventDefault();

                if (
                  event.currentTarget ===
                  event.target
                ) {
                  setIsDragging(false);
                }
              }}
              onDrop={handleDrop}
              className={classNames(
                "flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 text-center transition",

                isDragging
                  ? "border-orange-400 bg-orange-50 shadow-lg shadow-orange-100"
                  : "border-slate-300 bg-slate-50/70 hover:border-orange-300 hover:bg-orange-50/50",

                remainingSlots <= 0 &&
                  "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70",
              )}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-slate-950 shadow-lg shadow-orange-200/60">
                <UploadIcon className="h-7 w-7" />
              </div>

              <h4 className="mt-5 text-lg font-black text-slate-950">
                {remainingSlots > 0
                  ? "Déposez vos fichiers ici"
                  : "Nombre maximum atteint"}
              </h4>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {remainingSlots > 0
                  ? "Glissez-déposez vos documents ou cliquez pour les sélectionner."
                  : `Vous avez déjà atteint la limite de ${maxDocuments} justificatifs.`}
              </p>

              {remainingSlots > 0 && (
                <span className="mt-4 rounded-full bg-white px-4 py-2 text-xs font-black text-orange-600 shadow-sm">
                  {remainingSlots} emplacement
                  {remainingSlots > 1
                    ? "s"
                    : ""}{" "}
                  disponible
                  {remainingSlots > 1
                    ? "s"
                    : ""}
                </span>
              )}
            </div>

            {/* =============================================
                FICHIERS EN ATTENTE
            ============================================= */}

            {stagedDocuments.length > 0 && (
              <div className="mt-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h4 className="text-sm font-black text-slate-950">
                    Documents à envoyer
                  </h4>

                  <button
                    type="button"
                    onClick={() => {
                      setStagedDocuments(
                        [],
                      );
                    }}
                    disabled={
                      isUploading
                    }
                    className="text-xs font-black text-red-600 transition hover:text-red-700 disabled:opacity-50"
                  >
                    Tout retirer
                  </button>
                </div>

                <div className="space-y-3">
                  {stagedDocuments.map(
                    (document) => (
                      <article
                        key={document.key}
                        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                            <DocumentIcon className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p
                              className="truncate text-sm font-black text-slate-950"
                              title={
                                document.file
                                  .name
                              }
                            >
                              {
                                document.file
                                  .name
                              }
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {formatFileSize(
                                document.file
                                  .size,
                              )}
                            </p>
                          </div>
                        </div>

                        <label className="block">
                          <span className="sr-only">
                            Type du document
                          </span>

                          <select
                            value={
                              document.type
                            }
                            disabled={
                              isUploading
                            }
                            onChange={(
                              event,
                            ) => {
                              updateStagedDocumentType(
                                document.key,
                                event.target
                                  .value as CoachDocumentType,
                              );
                            }}
                            className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                          >
                            {DOCUMENT_TYPE_OPTIONS.map(
                              (
                                option,
                              ) => (
                                <option
                                  key={
                                    option.value
                                  }
                                  value={
                                    option.value
                                  }
                                >
                                  {
                                    option.label
                                  }
                                </option>
                              ),
                            )}
                          </select>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            removeStagedDocument(
                              document.key,
                            );
                          }}
                          disabled={
                            isUploading
                          }
                          className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:border-red-200 hover:bg-red-100 disabled:opacity-50 md:w-11"
                          aria-label={`Retirer ${document.file.name}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </article>
                    ),
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-slate-500">
                    {
                      stagedDocuments.length
                    }{" "}
                    fichier
                    {stagedDocuments.length >
                    1
                      ? "s"
                      : ""}{" "}
                    prêt
                    {stagedDocuments.length >
                    1
                      ? "s"
                      : ""}{" "}
                    à être envoyé
                    {stagedDocuments.length >
                    1
                      ? "s"
                      : ""}.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      void handleUpload();
                    }}
                    disabled={
                      isUploading ||
                      stagedDocuments.length ===
                        0
                    }
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-orange-500 px-6 text-sm font-black text-slate-950 shadow-lg shadow-orange-200/60 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    <UploadIcon className="h-5 w-5" />

                    {isUploading
                      ? "Envoi en cours..."
                      : "Envoyer les documents"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </section>
  );
}
