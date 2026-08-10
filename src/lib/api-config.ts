const DEFAULT_API_BASE_URL = "https://api.gotfit.tech/api";
const DEFAULT_API_ORIGIN_URL = "https://api.gotfit.tech";
const API_PROXY_PATH = "/api/gotfit-proxy";

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

export const API_TARGET_BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL
);

function normalizeBasePath(value?: string | null): string {
  const cleanValue = sanitizeUrl(value);

  if (!cleanValue || cleanValue === "/") {
    return "";
  }

  return `/${removeLeadingSlashes(removeTrailingSlashes(cleanValue))}`;
}

function getRuntimeBasePath(): string {
  const configuredBasePath = normalizeBasePath(
    process.env.NEXT_PUBLIC_BASE_PATH
  );

  if (configuredBasePath) {
    return configuredBasePath;
  }

  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/webapp")
  ) {
    return "/webapp";
  }

  return "";
}

export function getApiProxyBaseUrl(): string {
  return `${getRuntimeBasePath()}${API_PROXY_PATH}`;
}

export function getRuntimeApiBaseUrl(
  apiTargetBaseUrl = API_TARGET_BASE_URL
): string {
  if (typeof window === "undefined") {
    return apiTargetBaseUrl;
  }

  try {
    const targetOrigin = new URL(apiTargetBaseUrl).origin;

    if (targetOrigin !== window.location.origin) {
      return getApiProxyBaseUrl();
    }
  } catch {
    return apiTargetBaseUrl;
  }

  return apiTargetBaseUrl;
}

export const API_BROWSER_BASE_URL = getRuntimeApiBaseUrl();
export const API_BASE_URL = API_BROWSER_BASE_URL;

export function getApiOriginUrl(apiBaseUrl = API_TARGET_BASE_URL): string {
  const normalizedApiUrl = normalizeApiBaseUrl(apiBaseUrl);

  return normalizedApiUrl.replace(/\/api$/i, "");
}

export const API_ORIGIN_URL =
  getApiOriginUrl(API_TARGET_BASE_URL) || DEFAULT_API_ORIGIN_URL;

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
    `URL Laravel configurée : ${API_TARGET_BASE_URL}`,
    `URL utilisée par le navigateur : ${API_BASE_URL}`,
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
  targetBaseUrl: API_TARGET_BASE_URL,
  originUrl: API_ORIGIN_URL,
  logoUrl: LOGO_URL,
} as const;
