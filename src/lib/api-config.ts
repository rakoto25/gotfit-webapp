const DEFAULT_API_BASE_URL = "https://api.gotfit.tech/api";
const DEFAULT_API_ORIGIN_URL = "https://api.gotfit.tech";

export const LOGO_URL = "/brand/gotfit-logo.png";

function removeTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function removeLeadingSlashes(value: string): string {
  return value.replace(/^\/+/, "");
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isDataUrl(value: string): boolean {
  return /^data:/i.test(value);
}

function isBlobUrl(value: string): boolean {
  return /^blob:/i.test(value);
}

function isProtocolRelativeUrl(value: string): boolean {
  return value.startsWith("//");
}

function sanitizeUrl(value: unknown): string {
  return String(value ?? "").trim();
}

export function normalizeApiBaseUrl(url?: string | null): string {
  const rawUrl = sanitizeUrl(url);

  if (!rawUrl) {
    return DEFAULT_API_BASE_URL;
  }

  const cleanUrl = removeTrailingSlashes(rawUrl);

  if (!cleanUrl) {
    return DEFAULT_API_BASE_URL;
  }

  if (/\/api$/i.test(cleanUrl)) {
    return cleanUrl;
  }

  return `${cleanUrl}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL
);

export function getApiOriginUrl(apiBaseUrl = API_BASE_URL): string {
  const normalizedApiUrl = normalizeApiBaseUrl(apiBaseUrl);

  return normalizedApiUrl.replace(/\/api$/i, "");
}

export const API_ORIGIN_URL =
  getApiOriginUrl(API_BASE_URL) || DEFAULT_API_ORIGIN_URL;

export function getApiUrl(
  endpoint?: string | null
): string {
  const cleanEndpoint = sanitizeUrl(endpoint);

  if (!cleanEndpoint) {
    return API_BASE_URL;
  }

  if (isAbsoluteUrl(cleanEndpoint)) {
    return cleanEndpoint;
  }

  const normalizedEndpoint =
    removeLeadingSlashes(cleanEndpoint);

  if (!normalizedEndpoint) {
    return API_BASE_URL;
  }

  return `${removeTrailingSlashes(
    API_BASE_URL
  )}/${normalizedEndpoint}`;
}

export function getAssetUrl(
  url?: string | null
): string {
  const cleanUrl = sanitizeUrl(url);

  if (!cleanUrl) {
    return "";
  }

  if (
    isAbsoluteUrl(cleanUrl) ||
    isDataUrl(cleanUrl) ||
    isBlobUrl(cleanUrl)
  ) {
    return cleanUrl;
  }

  if (isProtocolRelativeUrl(cleanUrl)) {
    return `https:${cleanUrl}`;
  }

  const normalizedPath =
    removeLeadingSlashes(cleanUrl);

  if (!normalizedPath) {
    return "";
  }

  return `${removeTrailingSlashes(
    API_ORIGIN_URL
  )}/${normalizedPath}`;
}

export function getStorageAssetUrl(
  path?: string | null
): string {
  const cleanPath = sanitizeUrl(path);

  if (!cleanPath) {
    return "";
  }

  if (
    isAbsoluteUrl(cleanPath) ||
    isDataUrl(cleanPath) ||
    isBlobUrl(cleanPath)
  ) {
    return cleanPath;
  }

  const normalizedPath =
    removeLeadingSlashes(cleanPath);

  if (
    normalizedPath.startsWith("storage/")
  ) {
    return `${removeTrailingSlashes(
      API_ORIGIN_URL
    )}/${normalizedPath}`;
  }

  return `${removeTrailingSlashes(
    API_ORIGIN_URL
  )}/storage/${normalizedPath}`;
}

export function getNetworkErrorMessage(
  context = "charger les données"
): string {
  return [
    `Impossible de ${context} depuis l’API Gotfit.`,
    "Vérifiez votre connexion Internet, la disponibilité du backend et la configuration de NEXT_PUBLIC_API_URL.",
    `URL actuellement utilisée : ${API_BASE_URL}`,
  ].join(" ");
}

export function getApiConfigurationError():
  | string
  | null {
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!configuredUrl) {
    return null;
  }

  try {
    const normalizedUrl =
      normalizeApiBaseUrl(configuredUrl);

    const parsedUrl = new URL(normalizedUrl);

    if (
      parsedUrl.protocol !== "http:" &&
      parsedUrl.protocol !== "https:"
    ) {
      return "NEXT_PUBLIC_API_URL doit utiliser le protocole HTTP ou HTTPS.";
    }

    return null;
  } catch {
    return "NEXT_PUBLIC_API_URL n’est pas une URL valide.";
  }
}

export function isApiConfigured(): boolean {
  return !getApiConfigurationError();
}

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  originUrl: API_ORIGIN_URL,
  logoUrl: LOGO_URL,
} as const;